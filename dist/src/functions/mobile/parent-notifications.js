"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentNotificationsHandler = exports.sendDeliveryConfirmation = exports.NotificationType = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const joi_1 = __importDefault(require("joi"));
const prisma = new client_1.PrismaClient();
var NotificationType;
(function (NotificationType) {
    NotificationType["DELIVERY_CONFIRMATION"] = "delivery_confirmation";
    NotificationType["ORDER_READY"] = "order_ready";
    NotificationType["ORDER_OUT_FOR_DELIVERY"] = "order_out_for_delivery";
    NotificationType["DELIVERY_FAILED"] = "delivery_failed";
    NotificationType["CARD_ISSUE"] = "card_issue";
    NotificationType["ACCOUNT_UPDATE"] = "account_update";
    NotificationType["PAYMENT_REMINDER"] = "payment_reminder";
    NotificationType["WEEKLY_SUMMARY"] = "weekly_summary";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
const pushNotificationSchema = joi_1.default.object({
    parentIds: joi_1.default.array().items(joi_1.default.string().uuid()).min(1).max(100).required(),
    notificationType: joi_1.default.string().valid(...Object.values(NotificationType)).required(),
    title: joi_1.default.string().required().min(1).max(100),
    message: joi_1.default.string().required().min(1).max(500),
    data: joi_1.default.object().optional().default({}),
    deliveryTime: joi_1.default.date().optional(),
    priority: joi_1.default.string().valid('low', 'normal', 'high', 'urgent').optional().default('normal'),
    schoolId: joi_1.default.string().uuid().optional(),
    studentId: joi_1.default.string().uuid().optional(),
    orderId: joi_1.default.string().uuid().optional()
});
const getNotificationsSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional().default(1),
    limit: joi_1.default.number().integer().min(1).max(50).optional().default(20),
    status: joi_1.default.string().valid('unread', 'read', 'all').optional().default('all'),
    notificationType: joi_1.default.string().valid(...Object.values(NotificationType)).optional(),
    dateFrom: joi_1.default.date().optional(),
    dateTo: joi_1.default.date().optional()
});
async function validateParentAccess(parentId, requestingUser) {
    if (['super_admin', 'admin'].includes(requestingUser.role)) {
        const parent = await prisma.user.findUnique({
            where: { id: parentId, role: 'parent' },
            include: {
                school: {
                    select: { id: true, name: true, code: true }
                }
            }
        });
        if (!parent) {
            throw new Error('Parent not found');
        }
        return parent;
    }
    if (requestingUser.role === 'parent') {
        if (requestingUser.id !== parentId) {
            throw new Error('Access denied: Can only access your own notifications');
        }
        const parent = await prisma.user.findUnique({
            where: { id: parentId },
            include: {
                school: {
                    select: { id: true, name: true, code: true }
                }
            }
        });
        if (!parent) {
            throw new Error('Parent not found');
        }
        return parent;
    }
    if (['school_admin', 'staff', 'teacher'].includes(requestingUser.role)) {
        const parent = await prisma.user.findUnique({
            where: {
                id: parentId,
                role: 'parent',
                schoolId: requestingUser.schoolId
            },
            include: {
                school: {
                    select: { id: true, name: true, code: true }
                }
            }
        });
        if (!parent) {
            throw new Error('Parent not found or not in your school');
        }
        return parent;
    }
    throw new Error('Insufficient permissions');
}
async function sendPushNotification(deviceToken, title, message, data, priority) {
    try {
        const logger = logger_service_1.LoggerService.getInstance();
        logger.info('Push notification sent', {
            deviceToken: deviceToken.substring(0, 10) + '...',
            title,
            priority,
            dataKeys: Object.keys(data)
        });
        return true;
    }
    catch (error) {
        logger_service_1.LoggerService.getInstance().error('Push notification failed', {
            error: error.message,
            deviceToken: deviceToken.substring(0, 10) + '...'
        });
        return false;
    }
}
async function createMobileNotification(parentId, notificationData, deliveryStatus = 'sent') {
    const notification = await prisma.notification.create({
        data: {
            userId: parentId,
            type: notificationData.notificationType,
            title: notificationData.title,
            body: notificationData.message,
            message: notificationData.message,
            data: JSON.stringify({
                ...(notificationData.data || {}),
                schoolId: notificationData.schoolId || null,
                studentId: notificationData.studentId || null,
                orderId: notificationData.orderId || null,
                mobileNotification: true,
                deviceDelivery: deliveryStatus,
                timestamp: new Date().toISOString()
            }),
            priority: notificationData.priority || 'normal',
            status: deliveryStatus,
            deliveredAt: deliveryStatus === 'sent' ? new Date() : null
        }
    });
    return notification;
}
async function sendDeliveryConfirmation(parentId, studentName, orderNumber, deliveryLocation, deliveryTime) {
    const title = 'Meal Delivered Successfully';
    const message = `${studentName}'s meal (Order #${orderNumber}) has been delivered at ${deliveryLocation}`;
    const notificationData = {
        parentIds: [parentId],
        notificationType: NotificationType.DELIVERY_CONFIRMATION,
        title,
        message,
        priority: 'high',
        data: {
            orderNumber,
            studentName,
            deliveryLocation,
            deliveryTime: deliveryTime.toISOString(),
            actionType: 'delivery_confirmation'
        }
    };
    const parent = await prisma.user.findUnique({
        where: { id: parentId },
        select: {
            id: true,
            deviceTokens: true,
            preferences: true
        }
    });
    if (parent?.deviceTokens) {
        let deviceTokens = [];
        try {
            deviceTokens = JSON.parse(parent.deviceTokens);
        }
        catch (error) {
            deviceTokens = [];
        }
        for (const token of deviceTokens) {
            await sendPushNotification(token, title, message, notificationData.data, 'high');
        }
    }
    await createMobileNotification(parentId, notificationData, 'sent');
}
exports.sendDeliveryConfirmation = sendDeliveryConfirmation;
async function getMobileNotifications(parentId, filters) {
    const { page = 1, limit = 20, status = 'all', notificationType, dateFrom, dateTo } = filters;
    const skip = (page - 1) * limit;
    let whereClause = {
        userId: parentId,
        type: { in: Object.values(NotificationType) }
    };
    if (status !== 'all') {
        if (status === 'read') {
            whereClause.readAt = { not: null };
        }
        else if (status === 'unread') {
            whereClause.readAt = null;
        }
    }
    if (notificationType) {
        whereClause.type = notificationType;
    }
    if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom)
            whereClause.createdAt.gte = dateFrom;
        if (dateTo)
            whereClause.createdAt.lte = dateTo;
    }
    const [notifications, totalCount] = await Promise.all([
        prisma.notification.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.notification.count({ where: whereClause })
    ]);
    const formattedNotifications = notifications.map(notification => {
        let data = {};
        try {
            data = JSON.parse(notification.data || '{}');
        }
        catch (error) {
            data = {};
        }
        return {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data,
            priority: notification.priority,
            status: notification.status,
            createdAt: notification.createdAt,
            readAt: notification.readAt || undefined,
            deliveredAt: notification.deliveredAt || undefined,
            student: notification.student ? {
                id: notification.student.id,
                name: `${notification.student.firstName} ${notification.student.lastName}`,
                firstName: notification.student.firstName,
                lastName: notification.student.lastName
            } : undefined,
            order: notification.order ? {
                id: notification.order.id,
                orderNumber: notification.order.orderNumber,
                status: notification.order.status,
                totalAmount: notification.order.totalAmount
            } : undefined
        };
    });
    return {
        notifications: formattedNotifications,
        pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit)
        }
    };
}
async function markNotificationAsRead(notificationId, parentId) {
    await prisma.notification.updateMany({
        where: {
            id: notificationId,
            userId: parentId
        },
        data: {
            readAt: new Date(),
            status: 'read'
        }
    });
}
function canSendNotifications(requestingUser) {
    return ['super_admin', 'admin', 'school_admin', 'staff'].includes(requestingUser.role);
}
const parentNotificationsHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const httpMethod = event.httpMethod;
    try {
        logger.info('Parent mobile notifications request started', { requestId, httpMethod });
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        switch (httpMethod) {
            case 'POST':
                return await handleSendNotification(event, requestId, authenticatedUser);
            case 'GET':
                return await handleGetNotifications(event, requestId, authenticatedUser);
            case 'PUT':
                return await handleMarkAsRead(event, requestId, authenticatedUser);
            default:
                return (0, response_utils_1.createErrorResponse)(405, 'Method not allowed');
        }
    }
    catch (error) {
        logger.error('Parent mobile notifications failed', {
            requestId,
            httpMethod,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Failed to process mobile notification request');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.parentNotificationsHandler = parentNotificationsHandler;
async function handleSendNotification(event, requestId, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    if (!canSendNotifications(authenticatedUser)) {
        logger.warn('Unauthorized notification sending attempt', {
            requestId,
            userId: authenticatedUser.id,
            userRole: authenticatedUser.role
        });
        return (0, response_utils_1.createErrorResponse)(403, 'Insufficient permissions to send notifications');
    }
    const requestBody = JSON.parse(event.body || '{}');
    const { error, value: notificationData } = pushNotificationSchema.validate(requestBody);
    if (error) {
        logger.warn('Invalid notification request data', { requestId, error: error.details });
        return (0, response_utils_1.createErrorResponse)(400, 'Invalid request data', error.details);
    }
    const { parentIds, ...notificationDetails } = notificationData;
    const results = [];
    for (const parentId of parentIds) {
        try {
            const parent = await validateParentAccess(parentId, authenticatedUser);
            let deviceTokens = [];
            if (parent.deviceTokens) {
                try {
                    deviceTokens = JSON.parse(parent.deviceTokens);
                }
                catch (error) {
                    deviceTokens = [];
                }
            }
            let deliveryStatus = 'sent';
            if (deviceTokens.length > 0) {
                const pushResults = await Promise.all(deviceTokens.map(token => sendPushNotification(token, notificationDetails.title, notificationDetails.message, notificationDetails.data || {}, notificationDetails.priority || 'normal')));
                if (pushResults.every(result => !result)) {
                    deliveryStatus = 'failed';
                }
            }
            const notification = await createMobileNotification(parentId, { parentIds: [parentId], ...notificationDetails }, deliveryStatus);
            results.push({
                parentId,
                notificationId: notification.id,
                status: deliveryStatus,
                deviceCount: deviceTokens.length
            });
        }
        catch (error) {
            results.push({
                parentId,
                status: 'failed',
                error: error.message
            });
        }
    }
    logger.info('Mobile notifications sent', {
        requestId,
        totalParents: parentIds.length,
        successCount: results.filter(r => r.status === 'sent').length,
        failureCount: results.filter(r => r.status === 'failed').length
    });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Mobile notifications processed',
        data: {
            totalParents: parentIds.length,
            results
        }
    });
}
async function handleGetNotifications(event, requestId, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    const parentId = event.pathParameters?.parentId;
    if (!parentId) {
        return (0, response_utils_1.createErrorResponse)(400, 'Parent ID is required');
    }
    await validateParentAccess(parentId, authenticatedUser);
    const queryParams = event.queryStringParameters || {};
    const { error, value: filters } = getNotificationsSchema.validate(queryParams);
    if (error) {
        logger.warn('Invalid get notifications parameters', { requestId, error: error.details });
        return (0, response_utils_1.createErrorResponse)(400, 'Invalid query parameters', error.details);
    }
    const result = await getMobileNotifications(parentId, filters);
    logger.info('Mobile notifications retrieved', {
        requestId,
        parentId,
        notificationCount: result.notifications.length,
        total: result.pagination.total
    });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Mobile notifications retrieved successfully',
        data: result.notifications,
        pagination: result.pagination
    });
}
async function handleMarkAsRead(event, requestId, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    const notificationId = event.pathParameters?.notificationId;
    if (!notificationId) {
        return (0, response_utils_1.createErrorResponse)(400, 'Notification ID is required');
    }
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        select: { userId: true }
    });
    if (!notification) {
        return (0, response_utils_1.createErrorResponse)(404, 'Notification not found');
    }
    await validateParentAccess(notification.userId, authenticatedUser);
    await markNotificationAsRead(notificationId, notification.userId);
    logger.info('Notification marked as read', {
        requestId,
        notificationId,
        parentId: notification.userId
    });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Notification marked as read successfully'
    });
}
//# sourceMappingURL=parent-notifications.js.map