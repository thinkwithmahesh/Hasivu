"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const notification_service_1 = require("@/services/notification.service");
const auth_middleware_1 = require("@/middleware/auth.middleware");
const logging_middleware_1 = require("@/middleware/logging.middleware");
const rateLimiter_middleware_1 = require("@/middleware/rateLimiter.middleware");
const router = (0, express_1.Router)();
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array(),
            timestamp: new Date().toISOString(),
            version: '1.0'
        });
        return;
    }
    next();
};
router.use(logging_middleware_1.requestLogger);
router.use(rateLimiter_middleware_1.generalRateLimit);
router.post('/send', auth_middleware_1.authMiddleware, [
    (0, express_validator_1.body)('recipientId')
        .notEmpty()
        .withMessage('Recipient ID is required'),
    (0, express_validator_1.body)('type')
        .notEmpty()
        .withMessage('Notification type is required'),
    (0, express_validator_1.body)('channel')
        .isIn(['push', 'email', 'sms', 'whatsapp', 'in_app', 'socket'])
        .withMessage('Invalid notification channel'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'normal', 'high', 'urgent'])
        .withMessage('Priority must be low, normal, high, or urgent'),
    (0, express_validator_1.body)('variables')
        .optional()
        .isObject()
        .withMessage('Variables must be an object'),
    (0, express_validator_1.body)('scheduledAt')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Scheduled date must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('expiresAt')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Expiry date must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object')
], handleValidationErrors, async (req, res, next) => {
    try {
        const notification = await notification_service_1.NotificationService.sendNotification({
            recipientId: req.body.recipientId,
            templateId: req.body.type,
            recipientType: 'user',
            channels: [req.body.channel],
            priority: req.body.priority || 'normal',
            variables: req.body.variables || {},
            scheduledAt: req.body.scheduledAt,
            expiresAt: req.body.expiresAt,
            metadata: req.body.metadata || {}
        });
        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notification sent successfully',
            timestamp: new Date().toISOString(),
            version: '1.0'
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/bulk', auth_middleware_1.authMiddleware, [
    (0, express_validator_1.body)('notifications')
        .isArray({ min: 1 })
        .withMessage('Notifications array is required with at least one item'),
    (0, express_validator_1.body)('notifications.*.recipientId')
        .notEmpty()
        .withMessage('Each notification must have a recipient ID'),
    (0, express_validator_1.body)('notifications.*.type')
        .notEmpty()
        .withMessage('Each notification must have a type'),
    (0, express_validator_1.body)('notifications.*.channel')
        .isIn(['push', 'email', 'sms', 'whatsapp', 'in_app', 'socket'])
        .withMessage('Each notification must have a valid channel')
], handleValidationErrors, async (req, res, next) => {
    try {
        const results = await notification_service_1.NotificationService.sendBulkNotifications(req.body.notifications.map((n) => ({
            recipientId: n.recipientId,
            templateId: n.type,
            channel: n.channel,
            priority: n.priority || 'normal',
            variables: n.variables || {},
            scheduledAt: n.scheduledAt,
            expiresAt: n.expiresAt,
            metadata: n.metadata || {}
        })));
        res.status(201).json({
            success: true,
            data: results,
            message: 'Bulk notifications processed',
            timestamp: new Date().toISOString(),
            version: '1.0'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/', auth_middleware_1.authMiddleware, [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['pending', 'sent', 'delivered', 'failed', 'expired'])
        .withMessage('Invalid status filter'),
    (0, express_validator_1.query)('channel')
        .optional()
        .isIn(['push', 'email', 'sms', 'whatsapp', 'in_app', 'socket'])
        .withMessage('Invalid channel filter'),
    (0, express_validator_1.query)('priority')
        .optional()
        .isIn(['low', 'normal', 'high', 'urgent'])
        .withMessage('Invalid priority filter'),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .toInt()
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .toInt()
        .withMessage('Limit must be between 1 and 100')
], handleValidationErrors, async (req, res, next) => {
    try {
        const notifications = await notification_service_1.NotificationService.getUserNotifications(req.user.id, {
            status: req.query.status,
            priority: req.query.priority,
            limit: Number(req.query.limit) || 50,
            page: Number(req.query.page) || 1
        });
        res.json({
            success: true,
            data: notifications,
            message: 'Notifications retrieved successfully',
            timestamp: new Date().toISOString(),
            version: '1.0'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', auth_middleware_1.authMiddleware, [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid notification ID')
], handleValidationErrors, async (req, res, next) => {
    try {
        const notifications = await notification_service_1.NotificationService.getUserNotifications(req.user.id, { limit: 1000 });
        const notification = notifications.data?.notifications.find(n => n.id === req.params.id);
        if (!notification) {
            res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
            return;
        }
        res.json({
            success: true,
            data: notification,
            message: 'Notification retrieved successfully',
            timestamp: new Date().toISOString(),
            version: '1.0'
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id/status', auth_middleware_1.authMiddleware, [
    (0, express_validator_1.param)('id')
        .isUUID()
        .withMessage('Invalid notification ID'),
    (0, express_validator_1.body)('status')
        .isIn(['cancelled', 'retrying'])
        .withMessage('Status must be cancelled or retrying')
], handleValidationErrors, async (req, res, next) => {
    try {
        const notification = { id: req.params.id, status: req.body.status };
        res.json({
            success: true,
            data: notification,
            message: 'Notification status updated successfully',
            timestamp: new Date().toISOString(),
            version: '1.0'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/templates', auth_middleware_1.authMiddleware, [
    (0, express_validator_1.query)('type')
        .optional()
        .withMessage('Invalid template type'),
    (0, express_validator_1.query)('channel')
        .optional()
        .isIn(['push', 'email', 'sms', 'whatsapp', 'in_app'])
        .withMessage('Invalid channel filter')
], handleValidationErrors, async (req, res, next) => {
    try {
        const templates = [];
        res.json({
            success: true,
            data: templates,
            message: 'Templates retrieved successfully',
            timestamp: new Date().toISOString(),
            version: '1.0'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/analytics', auth_middleware_1.authMiddleware, [
    (0, express_validator_1.query)('dateFrom')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Date from must be a valid ISO 8601 date'),
    (0, express_validator_1.query)('dateTo')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Date to must be a valid ISO 8601 date'),
    (0, express_validator_1.query)('channel')
        .optional()
        .isIn(['push', 'email', 'sms', 'whatsapp', 'in_app', 'socket'])
        .withMessage('Invalid channel filter')
], handleValidationErrors, async (req, res, next) => {
    try {
        const analytics = await notification_service_1.NotificationService.getNotificationAnalytics({
            startDate: req.query.dateFrom ? new Date(req.query.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: req.query.dateTo ? new Date(req.query.dateTo) : new Date(),
            userId: req.user.id
        });
        res.json({
            success: true,
            data: analytics,
            message: 'Analytics retrieved successfully',
            timestamp: new Date().toISOString(),
            version: '1.0'
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/test', auth_middleware_1.authMiddleware, [
    (0, express_validator_1.body)('channel')
        .isIn(['push', 'email', 'sms', 'whatsapp'])
        .withMessage('Invalid test channel'),
    (0, express_validator_1.body)('recipient')
        .notEmpty()
        .withMessage('Test recipient is required')
], handleValidationErrors, async (req, res, next) => {
    try {
        const result = await notification_service_1.NotificationService.sendNotification({
            recipientId: req.body.recipient,
            templateId: 'test',
            recipientType: 'user',
            channels: [req.body.channel],
            priority: 'normal',
            variables: { message: 'Test notification' },
            metadata: { test: true }
        });
        res.json({
            success: true,
            data: result,
            message: 'Test notification sent successfully',
            timestamp: new Date().toISOString(),
            version: '1.0'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=notification.routes.js.map