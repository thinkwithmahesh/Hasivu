"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayService = exports.RazorpayService = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../utils/logger");
class RazorpayService {
    static instance;
    razorpay;
    keySecret;
    constructor() {
        const keyId = process.env.RAZORPAY_KEY_ID;
        this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
        if (!keyId || !this.keySecret) {
            throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
        }
        this.razorpay = new razorpay_1.default({
            key_id: keyId,
            key_secret: this.keySecret,
        });
        logger_1.logger.info('Razorpay service initialized successfully');
    }
    static getInstance() {
        if (!RazorpayService.instance) {
            RazorpayService.instance = new RazorpayService();
        }
        return RazorpayService.instance;
    }
    async createOrder(options) {
        try {
            logger_1.logger.info('Creating Razorpay order', {
                amount: options.amount,
                currency: options.currency,
                receipt: options.receipt,
            });
            const order = await this.razorpay.orders.create({
                amount: options.amount,
                currency: options.currency,
                receipt: options.receipt,
                payment_capture: options.payment_capture ?? true,
                notes: options.notes || {},
            });
            logger_1.logger.info('Razorpay order created successfully', {
                orderId: order.id,
                amount: order.amount,
                status: order.status,
            });
            return order;
        }
        catch (error) {
            logger_1.logger.error('Failed to create Razorpay order', error, {
                amount: options.amount,
                currency: options.currency,
            });
            throw new Error('Failed to create payment order');
        }
    }
    async fetchPayment(paymentId) {
        try {
            const payment = await this.razorpay.payments.fetch(paymentId);
            return payment;
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch Razorpay payment', error, { paymentId });
            throw new Error('Payment not found');
        }
    }
    async capturePayment(paymentId, amount, currency = 'INR') {
        try {
            logger_1.logger.info('Capturing Razorpay payment', { paymentId, amount, currency });
            const payment = await this.razorpay.payments.capture(paymentId, amount, currency);
            logger_1.logger.info('Payment captured successfully', {
                paymentId,
                amount: payment.amount,
                status: payment.status,
            });
            return payment;
        }
        catch (error) {
            logger_1.logger.error('Failed to capture payment', error, { paymentId, amount });
            throw new Error('Failed to capture payment');
        }
    }
    async createRefund(paymentId, options = {}) {
        try {
            logger_1.logger.info('Creating Razorpay refund', { paymentId, amount: options.amount });
            const refund = await this.razorpay.payments.refund(paymentId, {
                amount: options.amount,
                notes: options.notes || {},
                receipt: options.receipt,
                speed: options.speed || 'normal',
            });
            logger_1.logger.info('Refund created successfully', {
                refundId: refund.id,
                paymentId,
                amount: refund.amount,
                status: refund.status,
            });
            return refund;
        }
        catch (error) {
            logger_1.logger.error('Failed to create refund', error, { paymentId });
            throw new Error('Failed to process refund');
        }
    }
    async fetchRefund(refundId) {
        try {
            const refund = await this.razorpay.refunds.fetch(refundId);
            return refund;
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch refund', error, { refundId });
            throw new Error('Refund not found');
        }
    }
    verifyWebhookSignature(body, signature, secret = this.keySecret) {
        try {
            const expectedSignature = crypto_1.default.createHmac('sha256', secret).update(body).digest('hex');
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        }
        catch (error) {
            logger_1.logger.error('Webhook signature verification failed', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    generateSignature(orderId, paymentId, secret = this.keySecret) {
        const sign = crypto_1.default.createHmac('sha256', secret);
        sign.update(`${orderId}|${paymentId}`);
        return sign.digest('hex');
    }
    verifyPaymentSignature(orderId, paymentId, signature, secret = this.keySecret) {
        try {
            const expectedSignature = this.generateSignature(orderId, paymentId, secret);
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        }
        catch (error) {
            logger_1.logger.error('Payment signature verification failed', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    getRazorpayInstance() {
        return this.razorpay;
    }
    validateConfiguration() {
        const errors = [];
        if (!process.env.RAZORPAY_KEY_ID) {
            errors.push('RAZORPAY_KEY_ID environment variable is not set');
        }
        if (!process.env.RAZORPAY_KEY_SECRET) {
            errors.push('RAZORPAY_KEY_SECRET environment variable is not set');
        }
        if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.startsWith('rzp_')) {
            errors.push('RAZORPAY_KEY_ID appears to be invalid (should start with rzp_)');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.RazorpayService = RazorpayService;
exports.razorpayService = RazorpayService.getInstance();
//# sourceMappingURL=razorpay.service.js.map