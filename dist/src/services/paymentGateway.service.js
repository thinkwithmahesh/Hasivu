"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentGatewayService = void 0;
const database_service_1 = require("./database.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class PaymentGatewayService {
    static instance;
    db = database_service_1.DatabaseService.getInstance();
    logger = logger_1.logger;
    constructor() { }
    static getInstance() {
        if (!PaymentGatewayService.instance) {
            PaymentGatewayService.instance = new PaymentGatewayService();
        }
        return PaymentGatewayService.instance;
    }
    async processPayment(request) {
        try {
            this.validatePaymentRequest(request);
            const user = await this.db.client.user.findUnique({
                where: { id: request.userId },
            });
            if (!user) {
                throw new errors_1.NotFoundError('User', request.userId);
            }
            const order = await this.db.client.order.findUnique({
                where: { id: request.orderId },
            });
            if (!order) {
                throw new errors_1.NotFoundError('Order', request.orderId);
            }
            if (order.totalAmount !== request.amount) {
                throw new errors_1.BusinessLogicError('Payment amount does not match order amount', 'amount_mismatch');
            }
            const payment = await this.db.client.payment.create({
                data: {
                    orderId: request.orderId,
                    userId: request.userId,
                    amount: request.amount,
                    currency: request.currency,
                    status: 'PENDING',
                    paymentType: 'ORDER',
                    paymentMethodId: request.paymentMethodId,
                },
            });
            const gatewayResponse = await this.processWithGateway(payment, request);
            const updatedPayment = await this.db.client.payment.update({
                where: { id: payment.id },
                data: {
                    status: (gatewayResponse.status || 'pending').toUpperCase(),
                    razorpayPaymentId: gatewayResponse.gatewayTransactionId,
                    gatewayResponse: JSON.stringify(gatewayResponse.gatewayResponse || {}),
                    paidAt: gatewayResponse.processedAt || new Date(),
                    failureReason: gatewayResponse.failureReason,
                },
            });
            return {
                transactionId: updatedPayment.id,
                status: gatewayResponse.status || 'pending',
                gatewayTransactionId: gatewayResponse.gatewayTransactionId,
                gatewayResponse: gatewayResponse.gatewayResponse,
                amount: request.amount,
                currency: request.currency,
                fees: gatewayResponse.fees,
                netAmount: gatewayResponse.netAmount,
                processedAt: gatewayResponse.processedAt,
                failureReason: gatewayResponse.failureReason,
            };
        }
        catch (error) {
            this.logger.error('Error processing payment', error instanceof Error ? error : undefined, {
                request,
            });
            throw error;
        }
    }
    async processRefund(request) {
        try {
            const payment = await this.db.client.payment.findUnique({
                where: { id: request.transactionId },
                include: { order: true },
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
            const refund = await this.db.client.paymentRefund.create({
                data: {
                    paymentId: payment.id,
                    amount: Math.round(refundAmount * 100),
                    currency: 'INR',
                    reason: request.reason,
                    status: 'PENDING',
                    razorpayRefundId: `temp_${Date.now()}`,
                    notes: JSON.stringify(request.metadata || {}),
                },
            });
            const gatewayRefund = await this.processRefundWithGateway(payment, refund);
            const updatedRefund = await this.db.client.paymentRefund.update({
                where: { id: refund.id },
                data: {
                    status: (gatewayRefund.status || 'pending').toUpperCase(),
                    razorpayRefundId: gatewayRefund.gatewayRefundId || refund.razorpayRefundId,
                    processedAt: gatewayRefund.processedAt,
                },
            });
            return {
                refundId: updatedRefund.id,
                status: gatewayRefund.status || 'pending',
                amount: refundAmount,
                processedAt: gatewayRefund.processedAt,
                gatewayRefundId: gatewayRefund.gatewayRefundId,
            };
        }
        catch (error) {
            this.logger.error('Error processing refund', error instanceof Error ? error : undefined, {
                request,
            });
            throw error;
        }
    }
    async handleWebhook(payload) {
        try {
            if (!this.verifyWebhookSignature(payload)) {
                throw new errors_1.ValidationError('Invalid webhook signature');
            }
            const payment = await this.db.client.payment.findFirst({
                where: {
                    OR: [{ id: payload.transactionId }, { razorpayPaymentId: payload.gatewayTransactionId }],
                },
            });
            if (!payment) {
                this.logger.warn('Webhook received for unknown payment', { payload });
                return;
            }
            await this.db.client.payment.update({
                where: { id: payment.id },
                data: {
                    status: this.mapGatewayStatus(payload.status),
                    gatewayResponse: {
                        ...payment.gatewayResponse,
                        webhook: payload.data,
                    },
                    updatedAt: new Date(),
                },
            });
            await this.handleStatusUpdate(payment.id, payload.status, payload.event);
            this.logger.info('Webhook processed successfully', {
                transactionId: payment.id,
                event: payload.event,
                status: payload.status,
            });
        }
        catch (error) {
            this.logger.error('Error processing webhook', error instanceof Error ? error : undefined, {
                payload,
            });
            throw error;
        }
    }
    async getPaymentMethods(userId) {
        try {
            const paymentMethods = await this.db.client.paymentMethod.findMany({
                where: {
                    userId,
                    isActive: true,
                },
                orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
            });
            return paymentMethods.map((pm) => this.mapToPaymentMethod(pm));
        }
        catch (error) {
            this.logger.error('Error fetching payment methods', error instanceof Error ? error : undefined, { userId });
            throw error;
        }
    }
    async addPaymentMethod(userId, methodData) {
        try {
            const user = await this.db.client.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new errors_1.NotFoundError('User', userId);
            }
            const existingMethods = await this.db.client.paymentMethod.count({
                where: { userId, isActive: true },
            });
            const paymentMethod = await this.db.client.paymentMethod.create({
                data: {
                    userId,
                    methodType: methodData.type || 'card',
                    provider: methodData.provider || 'unknown',
                    providerMethodId: `method_${Date.now()}`,
                    cardLast4: methodData.last4,
                    isDefault: existingMethods === 0 || methodData.isDefault || false,
                    isActive: true,
                },
            });
            return this.mapToPaymentMethod(paymentMethod);
        }
        catch (error) {
            this.logger.error('Error adding payment method', error instanceof Error ? error : undefined, {
                userId,
                methodData,
            });
            throw error;
        }
    }
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
    async processWithGateway(payment, request) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const success = Math.random() > 0.1;
        if (success) {
            return {
                status: 'completed',
                gatewayTransactionId: `gw_${Date.now()}`,
                gatewayResponse: {
                    gateway: 'razorpay',
                    method: 'card',
                    network: 'Visa',
                },
                fees: Math.round(request.amount * 0.02),
                netAmount: Math.round(request.amount * 0.98),
                processedAt: new Date(),
            };
        }
        else {
            return {
                status: 'failed',
                failureReason: 'Payment declined by bank',
            };
        }
    }
    async processRefundWithGateway(_payment, _refund) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            status: 'completed',
            gatewayRefundId: `rfnd_${Date.now()}`,
            processedAt: new Date(),
        };
    }
    verifyWebhookSignature(payload) {
        return Boolean(payload.signature && payload.signature.length > 0);
    }
    mapGatewayStatus(gatewayStatus) {
        const statusMap = {
            created: 'PENDING',
            authorized: 'PROCESSING',
            captured: 'COMPLETED',
            failed: 'FAILED',
            cancelled: 'CANCELLED',
        };
        return statusMap[gatewayStatus] || 'PENDING';
    }
    async handleStatusUpdate(_paymentId, status, _event) {
        switch (status) {
            case 'completed':
                break;
            case 'failed':
                break;
            case 'refunded':
                break;
        }
    }
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
            metadata: record.metadata,
        };
    }
}
exports.PaymentGatewayService = PaymentGatewayService;
//# sourceMappingURL=paymentGateway.service.js.map