"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_service_1 = require("../services/payment.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_middleware_1 = require("../middleware/rateLimiter.middleware");
const logger_1 = require("../utils/logger");
const response_utils_1 = require("../shared/response.utils");
const router = (0, express_1.Router)();
router.use(rateLimiter_middleware_1.paymentRateLimit);
router.use(auth_middleware_1.authMiddleware);
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency, notes, receipt } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res
                .status(401)
                .json((0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'Authentication required', 401));
        }
        const paymentOrder = await payment_service_1.PaymentService.createPaymentOrder({
            userId,
            amount,
            currency,
            notes,
            receipt,
        });
        res.status(201).json((0, response_utils_1.createSuccessResponse)({
            data: paymentOrder,
            message: 'Payment order created successfully',
        }));
    }
    catch (error) {
        logger_1.logger.error('Failed to create payment order', undefined, { error, userId: req.user?.id });
        res.status(500).json((0, response_utils_1.handleError)(error, 'Failed to create payment order'));
    }
});
router.get('/status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res
                .status(401)
                .json((0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'Authentication required', 401));
        }
        const status = payment_service_1.PaymentService.getPaymentStatus(orderId);
        res.json((0, response_utils_1.createSuccessResponse)({
            data: { status },
            message: 'Payment status retrieved successfully',
        }));
    }
    catch (error) {
        logger_1.logger.error('Failed to get payment status', undefined, { error, orderId: req.params.orderId });
        res.status(500).json((0, response_utils_1.handleError)(error, 'Failed to get payment status'));
    }
});
router.post('/process/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { paymentMethodId } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res
                .status(401)
                .json((0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'Authentication required', 401));
        }
        const payment = await payment_service_1.PaymentService.getInstance().processPayment(paymentId);
        res.json((0, response_utils_1.createSuccessResponse)({
            data: payment,
            message: 'Payment processed successfully',
        }));
    }
    catch (error) {
        logger_1.logger.error('Failed to process payment', undefined, {
            error,
            paymentId: req.params.paymentId,
        });
        res.status(500).json((0, response_utils_1.handleError)(error, 'Failed to process payment'));
    }
});
router.post('/refund/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { amount, reason } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res
                .status(401)
                .json((0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'Authentication required', 401));
        }
        const refund = await payment_service_1.PaymentService.getInstance().refund(paymentId, amount);
        res.json((0, response_utils_1.createSuccessResponse)({
            data: refund,
            message: 'Payment refunded successfully',
        }));
    }
    catch (error) {
        logger_1.logger.error('Failed to refund payment', undefined, { error, paymentId: req.params.paymentId });
        res.status(500).json((0, response_utils_1.handleError)(error, 'Failed to refund payment'));
    }
});
router.get('/analytics', async (req, res) => {
    try {
        const userId = req.user?.id;
        const filters = req.query;
        if (!userId) {
            return res
                .status(401)
                .json((0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'Authentication required', 401));
        }
        const analytics = await payment_service_1.PaymentService.getPaymentAnalytics(filters);
        res.json((0, response_utils_1.createSuccessResponse)({
            data: analytics,
            message: 'Payment analytics retrieved successfully',
        }));
    }
    catch (error) {
        logger_1.logger.error('Failed to get payment analytics', undefined, {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json((0, response_utils_1.handleError)(error, 'Failed to get payment analytics'));
    }
});
router.get('/user/:userId?', async (req, res) => {
    try {
        const targetUserId = req.params.userId || req.user?.id;
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            return res
                .status(401)
                .json((0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'Authentication required', 401));
        }
        if (targetUserId !== currentUserId && req.user?.role !== 'admin') {
            return res.status(403).json((0, response_utils_1.createErrorResponse)('FORBIDDEN', 'Access denied', 403));
        }
        const payments = await payment_service_1.PaymentService.getInstance().findByUser(targetUserId || req.user.id);
        res.json((0, response_utils_1.createSuccessResponse)({
            data: payments,
            message: 'User payments retrieved successfully',
        }));
    }
    catch (error) {
        logger_1.logger.error('Failed to get user payments', undefined, { error, userId: req.params.userId });
        res.status(500).json((0, response_utils_1.handleError)(error, 'Failed to get user payments'));
    }
});
exports.default = router;
//# sourceMappingURL=payments.routes.js.map