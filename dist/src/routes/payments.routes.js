"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const api_middleware_1 = require("../middleware/api.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const payment_service_1 = require("../services/payment.service");
const audit_service_1 = require("../services/audit.service");
const cache_service_1 = require("../services/cache.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const router = express_1.default.Router();
const paymentService = payment_service_1.PaymentService.getInstance();
const auditService = new audit_service_1.AuditService();
const cacheService = new cache_service_1.CacheService();
const readRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 150, windowMs: 60000 });
const writeRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 30, windowMs: 60000 });
const webhookRateLimit = (0, api_middleware_1.createRateLimiter)({ requests: 1000, windowMs: 60000 });
const createPaymentOrderSchema = zod_1.z.object({
    amount: zod_1.z
        .number()
        .min(100, 'Amount must be at least ₹1 (100 paise)')
        .max(10000000, 'Amount too high'),
    currency: zod_1.z.string().default('INR'),
    notes: zod_1.z.object({}).optional(),
    receipt: zod_1.z.string().optional(),
    orderId: zod_1.z.string().uuid().optional(),
});
const processPaymentSchema = zod_1.z.object({
    paymentMethod: zod_1.z.enum(['razorpay', 'stripe', 'paypal']),
    paymentDetails: zod_1.z.object({}).optional(),
});
const refundPaymentSchema = zod_1.z.object({
    amount: zod_1.z.number().min(100).optional(),
    reason: zod_1.z.string().min(1, 'Refund reason is required').max(300),
});
const paymentQuerySchema = zod_1.z.object({
    page: zod_1.z.string().regex(/^\d+$/).optional(),
    limit: zod_1.z.string().regex(/^\d+$/).optional(),
    status: zod_1.z.enum(['pending', 'completed', 'failed', 'refunded', 'cancelled']).optional(),
    paymentMethod: zod_1.z
        .enum(['razorpay', 'stripe', 'paypal', 'wallet', 'card', 'upi', 'cash'])
        .optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    minAmount: zod_1.z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/)
        .optional(),
    maxAmount: zod_1.z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/)
        .optional(),
});
const paymentParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid payment ID'),
});
const webhookSchema = zod_1.z.object({
    event: zod_1.z.string(),
    payload: zod_1.z.object({
        payment: zod_1.z.object({
            entity: zod_1.z.object({
                id: zod_1.z.string(),
                order_id: zod_1.z.string().optional(),
                amount: zod_1.z.number(),
                currency: zod_1.z.string(),
                status: zod_1.z.string(),
                method: zod_1.z.string(),
            }),
        }),
    }),
    created_at: zod_1.z.number(),
});
router.post('/orders', writeRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({ body: createPaymentOrderSchema }), async (req, res) => {
    try {
        const paymentData = req.body;
        const currentUser = req.user;
        const paymentOrder = await paymentService.createPaymentOrder({
            userId: currentUser.id,
            amount: paymentData.amount,
            currency: paymentData.currency,
            notes: paymentData.notes,
            receipt: paymentData.receipt,
        });
        await cacheService.invalidatePattern('payments:*');
        await auditService.log(currentUser.id, 'payments.create_order', {
            paymentOrderId: paymentOrder.id,
            amount: paymentData.amount,
            currency: paymentData.currency,
            requestId: req.requestId,
        });
        logger_1.logger.info('Payment order created successfully', {
            paymentOrderId: paymentOrder.id,
            amount: paymentData.amount,
            userId: currentUser.id,
            requestId: req.requestId,
        });
        res.status(201).json({
            data: paymentOrder,
            message: 'Payment order created successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create payment order', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.get('/orders/:id', readRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({ params: paymentParamsSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        const paymentOrder = await paymentService.getPaymentOrder(id);
        if (!paymentOrder) {
            throw new errors_1.AppError('Payment order not found', 404);
        }
        if (paymentOrder.userId !== currentUser.id &&
            !['admin', 'school_admin'].includes(currentUser.role)) {
            throw new errors_1.AppError('You do not have permission to view this payment order', 403);
        }
        res.json({
            data: paymentOrder,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get payment order', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            paymentId: req.params.id,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.post('/:id/process', writeRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({
    params: paymentParamsSchema,
    body: processPaymentSchema,
}), async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod, paymentDetails } = req.body;
        const currentUser = req.user;
        const payment = await paymentService.findById(id);
        if (!payment) {
            throw new errors_1.AppError('Payment not found', 404);
        }
        if (payment.userId !== currentUser.id &&
            !['admin', 'school_admin'].includes(currentUser.role)) {
            throw new errors_1.AppError('You do not have permission to process this payment', 403);
        }
        const processedPayment = await paymentService.processPayment(id);
        await cacheService.invalidatePattern('payments:*');
        await auditService.log(currentUser.id, 'payments.process', {
            paymentId: id,
            paymentMethod,
            amount: payment.amount,
            requestId: req.requestId,
        });
        logger_1.logger.info('Payment processed successfully', {
            paymentId: id,
            paymentMethod,
            amount: payment.amount,
            userId: currentUser.id,
            requestId: req.requestId,
        });
        res.json({
            data: processedPayment,
            message: 'Payment processed successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to process payment', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            paymentId: req.params.id,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.post('/:id/refund', writeRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['admin', 'school_admin']), (0, api_middleware_1.validateRequest)({
    params: paymentParamsSchema,
    body: refundPaymentSchema,
}), async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, reason } = req.body;
        const currentUser = req.user;
        const payment = await paymentService.findById(id);
        if (!payment) {
            throw new errors_1.AppError('Payment not found', 404);
        }
        const canRefund = await payment_service_1.PaymentService.validateRefund(id, amount);
        if (!canRefund) {
            throw new errors_1.AppError('Payment is not eligible for refund', 400);
        }
        const refundResult = await paymentService.refund(id, amount);
        await cacheService.invalidatePattern('payments:*');
        await auditService.log(currentUser.id, 'payments.refund', {
            paymentId: id,
            refundAmount: amount,
            reason,
            requestId: req.requestId,
        });
        logger_1.logger.info('Payment refunded successfully', {
            paymentId: id,
            refundAmount: amount,
            reason,
            refundedBy: currentUser.id,
            requestId: req.requestId,
        });
        res.json({
            data: refundResult,
            message: 'Payment refunded successfully',
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to refund payment', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            paymentId: req.params.id,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.get('/analytics', readRateLimit, auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['admin', 'school_admin']), (0, api_middleware_1.validateRequest)({
    query: zod_1.z.object({
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        schoolId: zod_1.z.string().uuid().optional(),
        paymentMethod: zod_1.z
            .enum(['razorpay', 'stripe', 'paypal', 'wallet', 'card', 'upi', 'cash'])
            .optional(),
    }),
}), async (req, res) => {
    try {
        const { startDate, endDate, schoolId, paymentMethod } = req.query;
        const currentUser = req.user;
        let targetSchoolId = schoolId;
        if (currentUser.role === 'school_admin') {
            targetSchoolId = currentUser.schoolId;
        }
        const analytics = await paymentService.getPaymentAnalytics({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            schoolId: targetSchoolId,
            paymentMethod,
        });
        res.json({
            data: analytics,
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get payment analytics', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.get('/', readRateLimit, auth_middleware_1.authMiddleware, (0, api_middleware_1.validateRequest)({ query: paymentQuerySchema }), async (req, res) => {
    try {
        const currentUser = req.user;
        const { status, paymentMethod, startDate, endDate, minAmount, maxAmount, page = '1', limit = '20', } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = Math.min(parseInt(limit, 10), 100);
        const filters = {};
        switch (currentUser.role) {
            case 'student':
            case 'parent':
                filters.userId = currentUser.id;
                break;
            case 'school_admin':
                break;
        }
        if (status)
            filters.status = status;
        if (paymentMethod)
            filters.method = paymentMethod;
        if (startDate || endDate) {
            filters.createdAt = {};
            if (startDate)
                filters.createdAt.gte = new Date(startDate);
            if (endDate)
                filters.createdAt.lte = new Date(endDate);
        }
        if (minAmount || maxAmount) {
            filters.amount = {};
            if (minAmount)
                filters.amount.gte = parseFloat(minAmount);
            if (maxAmount)
                filters.amount.lte = parseFloat(maxAmount);
        }
        const payments = await paymentService.findAll(filters);
        const offset = (pageNum - 1) * limitNum;
        const paginatedPayments = payments.slice(offset, offset + limitNum);
        res.json({
            data: paginatedPayments,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: payments.length,
                totalPages: Math.ceil(payments.length / limitNum),
                hasNext: pageNum < Math.ceil(payments.length / limitNum),
                hasPrev: pageNum > 1,
            },
            requestId: req.requestId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to list payments', error instanceof Error ? error : undefined, {
            requestId: req.requestId,
            userId: req.user?.id,
        });
        throw error;
    }
});
router.post('/webhook', webhookRateLimit, async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const body = JSON.stringify(req.body);
        if (!signature) {
            res.status(400).json({ error: 'Missing webhook signature' });
            return;
        }
        const result = await paymentService.handleWebhook(body, signature);
        if (!result.success) {
            logger_1.logger.warn('Webhook processing failed', { error: result.message });
            res.status(400).json({ error: result.message });
            return;
        }
        res.json({ status: 'ok' });
    }
    catch (error) {
        logger_1.logger.error('Webhook processing error', error instanceof Error ? error : undefined);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=payments.routes.js.map