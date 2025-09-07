"use strict";
/**
 * Payment Gateway Service for HASIVU Platform
 * Handles payment processing, gateway integration, and transaction management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentGatewayService = void 0;
const database_service_1 = require("../shared/database.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class PaymentGatewayService {
    static instance;
    db = database_service_1.DatabaseService.getInstance();
    logger = logger_1.Logger.getInstance();
    constructor() { }
    static getInstance() {
        if (!PaymentGatewayService.instance) {
            PaymentGatewayService.instance = new PaymentGatewayService();
        }
        return PaymentGatewayService.instance;
    }
    /**
     * Process a payment request
     */
    async processPayment(request) {
        try {
            this.validatePaymentRequest(request);
            const user = await this.db.getPrismaClient().user.findUnique({
                where: { id: request.userId }
            });
            if (!user) {
                throw new errors_1.NotFoundError('User', request.userId);
            }
            const order = await this.db.getPrismaClient().order.findUnique({
                where: { id: request.orderId }
            });
            if (!order) {
                throw new errors_1.NotFoundError('Order', request.orderId);
            }
            if (order.totalAmount !== request.amount) {
                throw new errors_1.BusinessLogicError('Payment amount does not match order amount', 'amount_mismatch');
            }
            // Create payment record
            const payment = await this.db.getPrismaClient().payment.create({
                data: {
                    orderId: request.orderId,
                    userId: request.userId,
                    amount: request.amount,
                    currency: request.currency,
                    status: 'PENDING',
                    paymentType: 'ORDER',
                    paymentMethodId: request.paymentMethodId
                }
            });
            // Process with gateway
            const gatewayResponse = await this.processWithGateway(payment, request);
            // Update payment status
            const updatedPayment = await this.db.getPrismaClient().payment.update({
                where: { id: payment.id },
                data: {
                    status: gatewayResponse.status.toUpperCase(),
                    razorpayPaymentId: gatewayResponse.gatewayTransactionId,
                    gatewayResponse: JSON.stringify(gatewayResponse.gatewayResponse || {}),
                    paidAt: gatewayResponse.processedAt || new Date(),
                    failureReason: gatewayResponse.failureReason
                }
            });
            return {
                transactionId: updatedPayment.id,
                status: gatewayResponse.status,
                gatewayTransactionId: gatewayResponse.gatewayTransactionId,
                gatewayResponse: gatewayResponse.gatewayResponse,
                amount: request.amount,
                currency: request.currency,
                fees: gatewayResponse.fees,
                netAmount: gatewayResponse.netAmount,
                processedAt: gatewayResponse.processedAt,
                failureReason: gatewayResponse.failureReason
            };
        }
        catch (error) {
            this.logger.error('Error processing payment', { request, error });
            throw error;
        }
    }
    /**
     * Process refund request
     */
    async processRefund(request) {
        try {
            const payment = await this.db.getPrismaClient().payment.findUnique({
                where: { id: request.transactionId },
                include: { order: true }
            });
            if (!payment) {
                throw new errors_1.NotFoundError('Payment', request.transactionId);
            }
            if (payment.status !== 'COMPLETED') {
                throw new errors_1.BusinessLogicError('Can only refund completed payments', 'invalid_payment_status');
            }
            const refundAmount = request.amount || payment.amount;
            if (refundAmount > payment.amount) {
                throw new errors_1.BusinessLogicError('Refund amount cannot exceed payment amount', 'invalid_refund_amount');
            }
            // Create refund record
            const refund = await this.db.getPrismaClient().paymentRefund.create({
                data: {
                    paymentId: payment.id,
                    amount: Math.round(refundAmount * 100), // Convert to paisa/cents
                    currency: 'INR',
                    reason: request.reason,
                    status: 'PENDING',
                    razorpayRefundId: `temp_${Date.now()}`, // Will be updated after gateway processing
                    notes: JSON.stringify(request.metadata || {})
                }
            });
            // Process refund with gateway
            const gatewayRefund = await this.processRefundWithGateway(payment, refund);
            // Update refund status
            const updatedRefund = await this.db.getPrismaClient().paymentRefund.update({
                where: { id: refund.id },
                data: {
                    status: gatewayRefund.status.toUpperCase(),
                    razorpayRefundId: gatewayRefund.gatewayRefundId || refund.razorpayRefundId,
                    processedAt: gatewayRefund.processedAt
                }
            });
            return {
                refundId: updatedRefund.id,
                status: gatewayRefund.status,
                amount: refundAmount,
                processedAt: gatewayRefund.processedAt,
                gatewayRefundId: gatewayRefund.gatewayRefundId
            };
        }
        catch (error) {
            this.logger.error('Error processing refund', { request, error });
            throw error;
        }
    }
    /**
     * Handle webhook notifications from payment gateway
     */
    async handleWebhook(payload) {
        try {
            // Verify webhook signature
            if (!this.verifyWebhookSignature(payload)) {
                throw new errors_1.ValidationError('Invalid webhook signature');
            }
            const payment = await this.db.getPrismaClient().payment.findFirst({
                where: {
                    OR: [
                        { id: payload.transactionId },
                        { razorpayPaymentId: payload.gatewayTransactionId }
                    ]
                }
            });
            if (!payment) {
                this.logger.warn('Webhook received for unknown payment', { payload });
                return;
            }
            // Update payment status based on webhook
            await this.db.getPrismaClient().payment.update({
                where: { id: payment.id },
                data: {
                    status: this.mapGatewayStatus(payload.status),
                    gatewayResponse: {
                        ...payment.gatewayResponse,
                        webhook: payload.data
                    },
                    updatedAt: new Date()
                }
            });
            // Handle status-specific actions
            await this.handleStatusUpdate(payment.id, payload.status, payload.event);
            this.logger.info('Webhook processed successfully', {
                transactionId: payment.id,
                event: payload.event,
                status: payload.status
            });
        }
        catch (error) {
            this.logger.error('Error processing webhook', { payload, error });
            throw error;
        }
    }
    /**
     * Get payment methods for a user
     */
    async getPaymentMethods(userId) {
        try {
            const paymentMethods = await this.db.getPrismaClient().paymentMethod.findMany({
                where: {
                    userId,
                    isActive: true
                },
                orderBy: [
                    { isDefault: 'desc' },
                    { createdAt: 'desc' }
                ]
            });
            return paymentMethods.map(pm => this.mapToPaymentMethod(pm));
        }
        catch (error) {
            this.logger.error('Error fetching payment methods', { userId, error });
            throw error;
        }
    }
    /**
     * Add payment method for user
     */
    async addPaymentMethod(userId, methodData) {
        try {
            const user = await this.db.getPrismaClient().user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new errors_1.NotFoundError('User', userId);
            }
            // If this is the first payment method, make it default
            const existingMethods = await this.db.getPrismaClient().paymentMethod.count({
                where: { userId, isActive: true }
            });
            const paymentMethod = await this.db.getPrismaClient().paymentMethod.create({
                data: {
                    userId,
                    methodType: methodData.type || 'card',
                    provider: methodData.provider || 'unknown',
                    providerMethodId: `method_${Date.now()}`,
                    cardLast4: methodData.last4,
                    isDefault: existingMethods === 0 || methodData.isDefault || false,
                    isActive: true
                }
            });
            return this.mapToPaymentMethod(paymentMethod);
        }
        catch (error) {
            this.logger.error('Error adding payment method', { userId, methodData, error });
            throw error;
        }
    }
    /**
     * Validate payment request
     */
    validatePaymentRequest(request) {
        if (!request.amount || request.amount <= 0) {
            throw new errors_1.ValidationError('Amount must be greater than 0', 'amount');
        }
        if (!request.currency) {
            throw new errors_1.ValidationError('Currency is required', 'currency');
        }
        if (!request.orderId) {
            throw new errors_1.ValidationError('Order ID is required', 'orderId');
        }
        if (!request.userId) {
            throw new errors_1.ValidationError('User ID is required', 'userId');
        }
    }
    /**
     * Process payment with gateway (mock implementation)
     */
    async processWithGateway(payment, request) {
        // Mock gateway processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Simulate success/failure
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
            return {
                status: 'completed',
                gatewayTransactionId: `gw_${Date.now()}`,
                gatewayResponse: {
                    gateway: 'razorpay',
                    method: 'card',
                    network: 'Visa'
                },
                fees: Math.round(request.amount * 0.02), // 2% fee
                netAmount: Math.round(request.amount * 0.98),
                processedAt: new Date()
            };
        }
        else {
            return {
                status: 'failed',
                failureReason: 'Payment declined by bank'
            };
        }
    }
    /**
     * Process refund with gateway (mock implementation)
     */
    async processRefundWithGateway(payment, refund) {
        // Mock refund processing
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            status: 'completed',
            gatewayRefundId: `rfnd_${Date.now()}`,
            processedAt: new Date()
        };
    }
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload) {
        // Mock signature verification
        return payload.signature && payload.signature.length > 0;
    }
    /**
     * Map gateway status to internal status
     */
    mapGatewayStatus(gatewayStatus) {
        const statusMap = {
            'created': 'PENDING',
            'authorized': 'PROCESSING',
            'captured': 'COMPLETED',
            'failed': 'FAILED',
            'cancelled': 'CANCELLED'
        };
        return statusMap[gatewayStatus] || 'PENDING';
    }
    /**
     * Handle status update actions
     */
    async handleStatusUpdate(paymentId, status, event) {
        switch (status) {
            case 'completed':
                // Update order status, send confirmation email, etc.
                break;
            case 'failed':
                // Handle payment failure, notify user, etc.
                break;
            case 'refunded':
                // Handle refund completion, update order, etc.
                break;
        }
    }
    /**
     * Map database record to PaymentMethod interface
     */
    mapToPaymentMethod(record) {
        return {
            id: record.id,
            type: record.type,
            provider: record.provider,
            last4: record.last4,
            expiryMonth: record.expiryMonth,
            expiryYear: record.expiryYear,
            isDefault: record.isDefault,
            isActive: record.isActive,
            metadata: record.metadata
        };
    }
}
exports.PaymentGatewayService = PaymentGatewayService;
