"use strict";
/**
 * HASIVU Platform - Razorpay Integration Service
 * Production-ready Razorpay API integration for payment processing
 * Supports order creation, payment verification, webhook handling, and refunds
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayService = exports.RazorpayService = exports.RazorpayServiceError = void 0;
const razorpay_1 = require("razorpay");
const crypto_1 = require("crypto");
const razorpay_config_1 = require("../config/razorpay.config");
// import { LoggerService } from './logger.service';  // Logger import temporarily unavailable
// Import unavailable - defining locally
const RAZORPAY_ERROR_CODES = {
    BAD_REQUEST: 'BAD_REQUEST',
    UNAUTHORIZED: 'UNAUTHORIZED',
    GATEWAY_ERROR: 'GATEWAY_ERROR',
    SERVER_ERROR: 'SERVER_ERROR'
};
const logger = {
    info: (message, data) => console.log(message, data),
    warn: (message, data) => console.warn(message, data),
    error: (message, data) => console.error(message, data),
    debug: (message, data) => console.debug(message, data)
};
/**
 * Razorpay Service Error
 */
class RazorpayServiceError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code = 'RAZORPAY_ERROR', statusCode = 500, details) {
        super(message);
        this.name = 'RazorpayServiceError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, RazorpayServiceError.prototype);
    }
}
exports.RazorpayServiceError = RazorpayServiceError;
/**
 * Razorpay Integration Service
 * Singleton service for handling all Razorpay payment operations
 */
class RazorpayService {
    static instance;
    razorpayClient;
    keyId;
    keySecret;
    webhookSecret;
    environment;
    baseUrl;
    constructor() {
        this.keyId = razorpay_config_1.razorpayConfig.keyId;
        this.keySecret = razorpay_config_1.razorpayConfig.keySecret;
        this.webhookSecret = razorpay_config_1.razorpayConfig.webhookSecret;
        this.environment = razorpay_config_1.razorpayConfig.environment || 'test';
        this.baseUrl = razorpay_config_1.razorpayConfig.baseUrl || 'https://api.razorpay.com';
        // Validate configuration before initialization
        this.validateConfiguration();
        // Initialize Razorpay client
        this.razorpayClient = new razorpay_1.default({
            key_id: this.keyId,
            key_secret: this.keySecret,
        });
        logger.info('Razorpay service initialized', {
            environment: this.environment,
            keyId: this.keyId.substring(0, 8) + '...',
            baseUrl: this.baseUrl
        });
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!RazorpayService.instance) {
            RazorpayService.instance = new RazorpayService();
        }
        return RazorpayService.instance;
    }
    /**
     * Validate Razorpay configuration
     */
    validateConfiguration() {
        const errors = [];
        if (!this.keyId) {
            errors.push('Razorpay Key ID is required');
        }
        if (!this.keySecret) {
            errors.push('Razorpay Key Secret is required');
        }
        if (!this.webhookSecret) {
            errors.push('Razorpay Webhook Secret is required');
        }
        // Validate key format (Razorpay keys have specific patterns)
        if (this.keyId && !this.keyId.match(/^rzp_(test|live)_[A-Za-z0-9]{14}$/)) {
            errors.push('Invalid Razorpay Key ID format');
        }
        // Production-specific validations
        if (razorpay_config_1.razorpayConfig.environment === 'live') {
            if (this.keyId && !this.keyId.startsWith('rzp_live_')) {
                errors.push('Live environment requires live API key');
            }
            if (this.webhookSecret.length < 32) {
                errors.push('Webhook secret must be at least 32 characters for live environment');
            }
        }
        if (errors.length > 0) {
            throw new RazorpayServiceError(`Razorpay configuration validation failed: ${errors.join(', ')}`, 'CONFIGURATION_ERROR', 500, { errors });
        }
    }
    /**
     * Create a new payment order
     */
    async createOrder(options) {
        try {
            // Validate order amount
            this.validateOrderAmount(options.amount);
            // Generate receipt if not provided
            if (!options.receipt) {
                options.receipt = this.generateReceiptId();
            }
            logger.info('Creating Razorpay order', {
                amount: options.amount,
                currency: options.currency,
                receipt: options.receipt
            });
            const order = await this.razorpayClient.orders.create({
                amount: options.amount,
                currency: options.currency,
                receipt: options.receipt,
                notes: options.notes || {},
                payment_capture: options.payment_capture !== undefined ? Boolean(options.payment_capture) : true,
                partial_payment: options.partial_payment || false
            });
            logger.info('Razorpay order created successfully', {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
            });
            return order;
        }
        catch (error) {
            logger.error('Failed to create Razorpay order', {
                error: error.message,
                errorCode: error.error?.code,
                options
            });
            throw new RazorpayServiceError(`Failed to create order: ${error.message}`, error.error?.code || 'ORDER_CREATION_FAILED', error.statusCode || 500, error.error);
        }
    }
    /**
     * Verify payment signature
     */
    verifyPaymentSignature(data) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
            // Create signature verification body
            const signatureBody = `${razorpay_order_id}|${razorpay_payment_id}`;
            // Generate expected signature
            const expectedSignature = crypto_1.default
                .createHmac('sha256', this.keySecret)
                .update(signatureBody)
                .digest('hex');
            // Verify signature
            const isValid = crypto_1.default.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(razorpay_signature, 'hex'));
            logger.info('Payment signature verification', {
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                isValid
            });
            return isValid;
        }
        catch (error) {
            logger.error('Failed to verify payment signature', {
                error: error.message,
                data
            });
            return false;
        }
    }
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(data) {
        try {
            const { signature, body, webhookSecret } = data;
            // Generate expected signature
            const expectedSignature = crypto_1.default
                .createHmac('sha256', webhookSecret || this.webhookSecret)
                .update(body)
                .digest('hex');
            // Verify signature
            const isValid = crypto_1.default.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(signature, 'hex'));
            logger.info('Webhook signature verification', {
                isValid,
                signatureProvided: !!signature,
                bodyLength: body.length
            });
            return isValid;
        }
        catch (error) {
            logger.error('Failed to verify webhook signature', {
                error: error.message
            });
            return false;
        }
    }
    /**
     * Get payment details by payment ID
     */
    async getPayment(paymentId) {
        try {
            if (!paymentId) {
                throw new RazorpayServiceError('Payment ID is required', 'INVALID_PAYMENT_ID', 400);
            }
            logger.info('Fetching payment details', { paymentId });
            const payment = await this.razorpayClient.payments.fetch(paymentId);
            logger.info('Payment details fetched successfully', {
                paymentId: payment.id,
                status: payment.status,
                amount: payment.amount,
                method: payment.method
            });
            return payment;
        }
        catch (error) {
            logger.error('Failed to fetch payment details', {
                error: error.message,
                errorCode: error.error?.code,
                paymentId
            });
            throw new RazorpayServiceError(`Failed to fetch payment: ${error.message}`, error.error?.code || 'PAYMENT_FETCH_FAILED', error.statusCode || 500, error.error);
        }
    }
    /**
     * Get order details by order ID
     */
    async getOrder(orderId) {
        try {
            if (!orderId) {
                throw new RazorpayServiceError('Order ID is required', 'INVALID_ORDER_ID', 400);
            }
            logger.info('Fetching order details', { orderId });
            const order = await this.razorpayClient.orders.fetch(orderId);
            logger.info('Order details fetched successfully', {
                orderId: order.id,
                status: order.status,
                amount: order.amount,
                amountPaid: order.amount_paid
            });
            return order;
        }
        catch (error) {
            logger.error('Failed to fetch order details', {
                error: error.message,
                errorCode: error.error?.code,
                orderId
            });
            throw new RazorpayServiceError(`Failed to fetch order: ${error.message}`, error.error?.code || 'ORDER_FETCH_FAILED', error.statusCode || 500, error.error);
        }
    }
    /**
     * Process payment refund
     */
    async refundPayment(paymentId, options = {}) {
        try {
            if (!paymentId) {
                throw new RazorpayServiceError('Payment ID is required for refund', 'INVALID_PAYMENT_ID', 400);
            }
            // Get payment details to validate refund eligibility
            const payment = await this.getPayment(paymentId);
            if (!['captured', 'authorized'].includes(payment.status)) {
                throw new RazorpayServiceError(`Payment cannot be refunded in current status: ${payment.status}`, 'INVALID_PAYMENT_STATUS', 400, { paymentStatus: payment.status });
            }
            // Validate refund amount
            if (options.amount && options.amount > payment.amount) {
                throw new RazorpayServiceError('Refund amount cannot exceed payment amount', 'INVALID_REFUND_AMOUNT', 400, { paymentAmount: payment.amount, refundAmount: options.amount });
            }
            logger.info('Processing payment refund', {
                paymentId,
                refundAmount: options.amount || payment.amount,
                speed: options.speed
            });
            const refundData = {
                notes: options.notes || {}
            };
            if (options.amount) {
                refundData.amount = options.amount;
            }
            if (options.speed) {
                refundData.speed = options.speed;
            }
            if (options.receipt) {
                refundData.receipt = options.receipt;
            }
            const refund = await this.razorpayClient.payments.refund(paymentId, refundData);
            logger.info('Payment refund processed successfully', {
                refundId: refund.id,
                paymentId: refund.payment_id,
                amount: refund.amount,
                status: refund.status
            });
            return refund;
        }
        catch (error) {
            logger.error('Failed to process payment refund', {
                error: error.message,
                errorCode: error.error?.code,
                paymentId,
                options
            });
            // Handle specific Razorpay refund errors
            if (error instanceof RazorpayServiceError) {
                throw error;
            }
            throw new RazorpayServiceError(`Failed to process refund: ${error.message}`, error.error?.code || 'REFUND_FAILED', error.statusCode || 500, error.error);
        }
    }
    /**
     * Get refund details by refund ID
     */
    async getRefund(refundId) {
        try {
            if (!refundId) {
                throw new RazorpayServiceError('Refund ID is required', 'INVALID_REFUND_ID', 400);
            }
            logger.info('Fetching refund details', { refundId });
            const refund = await this.razorpayClient.refunds.fetch(refundId);
            logger.info('Refund details fetched successfully', {
                refundId: refund.id,
                status: refund.status,
                amount: refund.amount,
                paymentId: refund.payment_id
            });
            return refund;
        }
        catch (error) {
            logger.error('Failed to fetch refund details', {
                error: error.message,
                errorCode: error.error?.code,
                refundId
            });
            throw new RazorpayServiceError(`Failed to fetch refund: ${error.message}`, error.error?.code || 'REFUND_FETCH_FAILED', error.statusCode || 500, error.error);
        }
    }
    /**
     * Capture authorized payment
     */
    async capturePayment(paymentId, amount, currency = 'INR') {
        try {
            if (!paymentId) {
                throw new RazorpayServiceError('Payment ID is required for capture', 'INVALID_PAYMENT_ID', 400);
            }
            // Get payment details to validate capture eligibility
            const payment = await this.getPayment(paymentId);
            if (payment.status !== 'authorized') {
                throw new RazorpayServiceError(`Payment cannot be captured in current status: ${payment.status}`, 'INVALID_PAYMENT_STATUS', 400, { paymentStatus: payment.status });
            }
            const captureAmount = amount || payment.amount;
            // Validate capture amount
            if (captureAmount > payment.amount) {
                throw new RazorpayServiceError('Capture amount cannot exceed authorized amount', 'INVALID_CAPTURE_AMOUNT', 400, { authorizedAmount: payment.amount, captureAmount });
            }
            logger.info('Capturing authorized payment', {
                paymentId,
                captureAmount,
                currency
            });
            const capturedPayment = await this.razorpayClient.payments.capture(paymentId, captureAmount, currency);
            logger.info('Payment captured successfully', {
                paymentId: capturedPayment.id,
                status: capturedPayment.status,
                amount: capturedPayment.amount,
                captured: capturedPayment.captured
            });
            return capturedPayment;
        }
        catch (error) {
            logger.error('Failed to capture payment', {
                error: error.message,
                errorCode: error.error?.code,
                paymentId,
                amount,
                currency
            });
            // Handle specific Razorpay capture errors
            if (error instanceof RazorpayServiceError) {
                throw error;
            }
            throw new RazorpayServiceError(`Failed to capture payment: ${error.message}`, error.error?.code || 'PAYMENT_CAPTURE_FAILED', error.statusCode || 500, error.error);
        }
    }
    /**
     * Validate order amount against platform limits
     */
    validateOrderAmount(amount) {
        if (!amount || amount <= 0) {
            throw new RazorpayServiceError('Order amount must be greater than zero', 'INVALID_AMOUNT', 400, { amount });
        }
        if (amount < razorpay_config_1.razorpayConfig.limits.minAmount) {
            throw new RazorpayServiceError(`Amount must be at least ₹${razorpay_config_1.razorpayConfig.limits.minAmount / 100}`, 'AMOUNT_TOO_LOW', 400, { amount, minAmount: razorpay_config_1.razorpayConfig.limits.minAmount });
        }
        if (amount > razorpay_config_1.razorpayConfig.limits.maxAmount) {
            throw new RazorpayServiceError(`Amount cannot exceed ₹${razorpay_config_1.razorpayConfig.limits.maxAmount / 100}`, 'AMOUNT_TOO_HIGH', 400, { amount, maxAmount: razorpay_config_1.razorpayConfig.limits.maxAmount });
        }
    }
    /**
     * Generate unique receipt ID
     */
    generateReceiptId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `rcpt_${timestamp}_${random}`;
    }
    /**
     * Extract webhook event from API Gateway event
     */
    extractWebhookEvent(event) {
        try {
            if (!event.body) {
                throw new RazorpayServiceError('Webhook body is required', 'INVALID_WEBHOOK_BODY', 400);
            }
            const webhookEvent = JSON.parse(event.body);
            // Verify webhook signature
            const signature = event.headers['x-razorpay-signature'] ||
                event.headers['X-Razorpay-Signature'] || '';
            if (!signature) {
                throw new RazorpayServiceError('Webhook signature is required', 'MISSING_WEBHOOK_SIGNATURE', 400);
            }
            const isValidSignature = this.verifyWebhookSignature({
                signature,
                body: event.body,
                webhookSecret: this.webhookSecret
            });
            if (!isValidSignature) {
                throw new RazorpayServiceError('Invalid webhook signature', 'INVALID_WEBHOOK_SIGNATURE', 401);
            }
            logger.info('Webhook event extracted and verified', {
                eventType: webhookEvent.event,
                entityType: webhookEvent.payload?.payment?.entity || webhookEvent.payload?.order?.entity,
                entityId: webhookEvent.payload?.payment?.id || webhookEvent.payload?.order?.id
            });
            return webhookEvent;
        }
        catch (error) {
            logger.error('Failed to extract webhook event', {
                error: error.message,
                headers: event.headers,
                bodyLength: event.body?.length
            });
            // Handle specific webhook extraction errors
            if (error instanceof RazorpayServiceError) {
                throw error;
            }
            throw new RazorpayServiceError(`Failed to extract webhook event: ${error.message}`, 'WEBHOOK_EXTRACTION_FAILED', 500, error);
        }
    }
    /**
     * Health check for Razorpay service
     */
    async healthCheck() {
        const healthData = {
            status: 'healthy',
            timestamp: Date.now(),
            environment: this.environment,
            keyId: this.keyId.substring(0, 8) + '...',
            configuration: {
                webhookSecret: !!this.webhookSecret,
                limits: razorpay_config_1.razorpayConfig.limits,
                baseUrl: this.baseUrl
            }
        };
        try {
            // Test connectivity by fetching a non-existent order (should return 400)
            const startTime = Date.now();
            try {
                await this.razorpayClient.orders.fetch('order_test_connectivity');
            }
            catch (connectivityError) {
                // Expected error for non-existent order - indicates API is reachable
                if (connectivityError.error?.code === 'BAD_REQUEST_ERROR') {
                    const responseTime = Date.now() - startTime;
                    return {
                        ...healthData,
                        connectivity: {
                            razorpayApi: true,
                            responseTime
                        }
                    };
                }
                throw connectivityError;
            }
            return {
                ...healthData,
                connectivity: {
                    razorpayApi: true,
                    responseTime: Date.now() - startTime
                }
            };
        }
        catch (error) {
            logger.error('Razorpay service health check failed', {
                error: error.message,
                errorCode: error.error?.code
            });
            return {
                ...healthData,
                status: 'unhealthy',
                connectivity: {
                    razorpayApi: false
                },
                error: error.message
            };
        }
    }
    /**
     * Get service configuration (safe for logging)
     */
    getServiceInfo() {
        return {
            environment: this.environment,
            keyId: this.keyId.substring(0, 8) + '...',
            baseUrl: this.baseUrl,
            limits: razorpay_config_1.razorpayConfig.limits,
            webhookConfigured: !!this.webhookSecret
        };
    }
}
exports.RazorpayService = RazorpayService;
// Export singleton instance
exports.razorpayService = RazorpayService.getInstance();
