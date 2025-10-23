"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
const client_1 = require("@prisma/client");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
class PaymentService {
    static instance;
    prisma;
    razorpay;
    webhookSecret;
    isRazorpayAvailable() {
        return true;
    }
    constructor() {
        this.prisma = new client_1.PrismaClient();
        this.razorpay = new razorpay_1.default({
            key_id: process.env.RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET || '',
        });
        this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    }
    static getInstance() {
        if (!PaymentService.instance) {
            PaymentService.instance = new PaymentService();
        }
        return PaymentService.instance;
    }
    async findById(id) {
        return await this.prisma.payment.findUnique({
            where: { id },
        });
    }
    async findByOrder(orderId) {
        return await this.prisma.payment.findMany({
            where: { orderId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findByUser(userId) {
        return await this.prisma.payment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters?.userId) {
            where.userId = filters.userId;
        }
        if (filters?.orderId) {
            where.orderId = filters.orderId;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.method) {
            where.method = filters.method;
        }
        return await this.prisma.payment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return await this.prisma.payment.create({
            data: {
                orderId: data.orderId,
                userId: data.userId,
                amount: data.amount,
                currency: data.currency || 'INR',
                method: data.method,
                transactionId: data.transactionId,
                status: 'pending',
            },
        });
    }
    async updateStatus(id, status, transactionId) {
        return await this.prisma.payment.update({
            where: { id },
            data: {
                status,
                ...(transactionId && { transactionId }),
            },
        });
    }
    async processPayment(paymentId) {
        const payment = await this.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }
        if (payment.status !== 'pending') {
            throw new Error(`Payment already ${payment.status}`);
        }
        return await this.updateStatus(paymentId, 'completed', `txn_${Date.now()}`);
    }
    async refund(paymentId, amount) {
        const payment = await this.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }
        if (payment.status !== 'completed') {
            throw new Error('Can only refund completed payments');
        }
        const refundAmount = amount || payment.amount;
        if (refundAmount > payment.amount) {
            throw new Error('Refund amount cannot exceed payment amount');
        }
        return await this.updateStatus(paymentId, 'refunded');
    }
    async getTotalRevenue(filters) {
        const where = { status: 'completed' };
        if (filters?.userId) {
            where.userId = filters.userId;
        }
        if (filters?.orderId) {
            where.orderId = filters.orderId;
        }
        const result = await this.prisma.payment.aggregate({
            where,
            _sum: {
                amount: true,
            },
        });
        return result._sum.amount || 0;
    }
    async initialize() {
        try {
            await this.razorpay.orders.all({ count: 1 });
        }
        catch (error) {
            throw new Error('Payment service initialization failed');
        }
    }
    async createPaymentOrder(data) {
        if (data.amount < 100) {
            throw new Error('Amount must be at least ₹1 (100 paise)');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: data.userId },
            select: { id: true, email: true, phone: true },
        });
        if (!user) {
            throw new Error('User not found');
        }
        try {
            const razorpayOrder = await this.razorpay.orders.create({
                amount: data.amount,
                currency: data.currency || 'INR',
                receipt: data.receipt || `receipt_${Date.now()}`,
                notes: {
                    ...data.notes,
                    userId: data.userId,
                    userEmail: user.email,
                },
            });
            const payment = await this.create({
                orderId: razorpayOrder.id,
                userId: data.userId,
                amount: data.amount,
                currency: data.currency || 'INR',
                method: 'razorpay',
                transactionId: razorpayOrder.id,
            });
            return {
                id: payment.id,
                razorpayOrderId: razorpayOrder.id,
                userId: data.userId,
                amount: data.amount,
                currency: data.currency || 'INR',
                status: 'created',
                notes: data.notes || {},
                receipt: data.receipt || `receipt_${Date.now()}`,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            };
        }
        catch (error) {
            throw new Error(error.message || 'Failed to create payment order');
        }
    }
    verifyPaymentSignature(orderId, paymentId, signature) {
        try {
            const body = `${orderId}|${paymentId}`;
            const expectedSignature = crypto_1.default
                .createHmac('sha256', this.webhookSecret)
                .update(body)
                .digest('hex');
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        }
        catch (error) {
            return false;
        }
    }
    async capturePayment(orderId, paymentId, signature) {
        if (!this.verifyPaymentSignature(orderId, paymentId, signature)) {
            throw new Error('Invalid payment signature');
        }
        const payment = await this.findByOrder(orderId);
        if (!payment || payment.length === 0) {
            throw new Error('Payment order not found');
        }
        const existingPayment = payment[0];
        const updatedPayment = await this.updateStatus(existingPayment.id, 'completed', paymentId);
        return {
            id: updatedPayment.id,
            orderId: existingPayment.orderId,
            razorpayPaymentId: paymentId,
            amount: existingPayment.amount,
            status: 'captured',
            capturedAt: new Date(),
        };
    }
    async createRefund(paymentId, amount, reason) {
        const payment = await this.findById(paymentId);
        if (!payment) {
            throw new Error('Payment transaction not found');
        }
        if (payment.status !== 'completed') {
            throw new Error('Can only refund completed payments');
        }
        const refundAmount = amount || payment.amount;
        if (refundAmount > payment.amount) {
            throw new Error('Refund amount cannot exceed payment amount');
        }
        await this.updateStatus(paymentId, 'refunded');
        return {
            id: `refund_${Date.now()}`,
            paymentId,
            razorpayRefundId: `rfnd_${Date.now()}`,
            amount: refundAmount,
            currency: payment.currency,
            status: 'pending',
            reason: reason || 'Customer request',
        };
    }
    async createSubscriptionPlan(data) {
        return {
            id: `plan_${Date.now()}`,
            interval: data.interval,
            period: data.period,
            item: {
                amount: data.amount,
                currency: data.currency || 'INR',
            },
        };
    }
    async createSubscription(data) {
        return {
            id: `subscription_${Date.now()}`,
            razorpaySubscriptionId: `sub_${Date.now()}`,
            userId: data.userId,
            planId: data.planId,
            status: 'created',
            currentStart: new Date(),
            currentEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };
    }
    async handleWebhook(body, signature) {
        try {
            const expectedSignature = crypto_1.default
                .createHmac('sha256', this.webhookSecret)
                .update(body)
                .digest('hex');
            if (!crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
                return { success: false, message: 'Invalid webhook signature' };
            }
            const payload = JSON.parse(body);
            switch (payload.event) {
                case 'payment.captured': {
                    const paymentId = payload.payload.payment.entity.id;
                    await this.prisma.paymentTransaction.updateMany({
                        where: { razorpayPaymentId: paymentId },
                        data: {
                            status: 'captured',
                            capturedAt: new Date(),
                        },
                    });
                    break;
                }
                default:
                    break;
            }
            return { success: true, message: 'Webhook processed successfully' };
        }
        catch (error) {
            return { success: false, message: error.message || 'Webhook processing failed' };
        }
    }
    async getPaymentOrder(orderId) {
        const payments = await this.findByOrder(orderId);
        return payments.length > 0 ? payments[0] : null;
    }
    async updateOrder(_orderId, _updates) {
        return Promise.resolve();
    }
    async getAllOrders(_filters) {
        return [];
    }
    async getPaymentAnalytics(_filters) {
        return {
            totalRevenue: await this.getTotalRevenue(),
            totalPayments: 0,
            successRate: 0,
        };
    }
    async createOrder(data) {
        return {
            id: `order_${Date.now()}`,
            ...data,
            status: 'created',
        };
    }
    static async processPayment(paymentData) {
        try {
            const payment = await this.getInstance().create({
                orderId: paymentData.orderId,
                userId: 'user-from-order',
                amount: paymentData.amount,
                currency: paymentData.currency,
                method: paymentData.paymentMethod,
            });
            const processedPayment = await this.getInstance().processPayment(payment.id);
            return {
                success: true,
                data: {
                    paymentId: processedPayment.razorpayPaymentId || payment.id,
                    status: 'captured',
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: { message: error.message || 'Payment processing failed', code: 'PAYMENT_FAILED' },
            };
        }
    }
    static async refundPayment(refundData) {
        try {
            await this.getInstance().refund(refundData.paymentId, refundData.amount);
            return {
                success: true,
                data: {
                    refundId: `refund_${Date.now()}`,
                    status: 'processed',
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: { message: error.message || 'Refund failed', code: 'REFUND_FAILED' },
            };
        }
    }
    static async getUserPaymentIds(userId) {
        const payments = await this.getInstance().findByUser(userId);
        return payments.map(p => p.id);
    }
    static async findMany(filters) {
        return await this.getInstance().findAll(filters);
    }
    static async validatePaymentOrder(paymentMethod) {
        const validMethods = ['wallet', 'card', 'upi', 'cash', 'subscription'];
        return validMethods.includes(paymentMethod);
    }
    static async checkDuplicatePayment(orderId, amount) {
        const payments = await this.getInstance().findByOrder(orderId);
        return payments.some(p => p.amount === amount && p.status === 'completed');
    }
    static async initiatePayment(paymentData) {
        try {
            const payment = await this.getInstance().create({
                orderId: paymentData.orderId,
                userId: 'user-from-order',
                amount: paymentData.amount,
                method: paymentData.paymentMethod,
            });
            return {
                success: true,
                data: {
                    paymentId: payment.id,
                    status: 'initiated',
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: { message: error.message || 'Payment initiation failed', code: 'INITIATE_FAILED' },
            };
        }
    }
    static async createPaymentRecord(data) {
        return await this.getInstance().create(data);
    }
    static async findById(id) {
        return await this.getInstance().findById(id);
    }
    static async canUserVerifyPayment(userId, paymentId) {
        const payment = await this.getInstance().findById(paymentId);
        return payment?.userId === userId;
    }
    static async completePayment(paymentId) {
        return await this.getInstance().updateStatus(paymentId, 'completed');
    }
    static async updateOrderAfterPayment(_orderId, _paymentId) {
        return Promise.resolve();
    }
    static async validateRefund(paymentId, amount) {
        const payment = await this.getInstance().findById(paymentId);
        if (!payment || payment.status !== 'completed') {
            return false;
        }
        if (amount && amount > payment.amount) {
            return false;
        }
        return true;
    }
    static async updateOrderAfterRefund(_orderId, _refundId) {
        return Promise.resolve();
    }
    static async createPaymentOrder(data) {
        return await this.getInstance().createPaymentOrder(data);
    }
    static async updateOrder(_orderId, _updates) {
        return Promise.resolve();
    }
    static async getPaymentOrder(orderId) {
        return await this.getInstance().getPaymentOrder(orderId);
    }
    static async getAllOrders(_filters) {
        return [];
    }
    static async getPaymentAnalytics(_filters) {
        return {
            totalRevenue: 0,
            totalPayments: 0,
            successRate: 0,
        };
    }
    static getPaymentStatus(_orderId) {
        return 'pending';
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = PaymentService.getInstance();
exports.default = PaymentService;
//# sourceMappingURL=payment.service.js.map