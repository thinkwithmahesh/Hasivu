"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = exports.NotificationPriority = exports.NotificationStatus = void 0;
const client_1 = require("@prisma/client");
exports.NotificationStatus = {
    PENDING: 'pending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    FAILED: 'failed',
    EXPIRED: 'expired',
};
exports.NotificationPriority = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
};
class NotificationService {
    static instance;
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    static getInstance() {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }
    async findById(id) {
        return await this.prisma.notification.findUnique({
            where: { id },
        });
    }
    async findByUser(userId) {
        return await this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findUnread(userId) {
        return await this.prisma.notification.findMany({
            where: {
                userId,
                readAt: null,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters?.userId) {
            where.userId = filters.userId;
        }
        if (filters?.type) {
            where.type = filters.type;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.isRead !== undefined) {
            where.isRead = filters.isRead;
        }
        return await this.prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return await this.prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                data: data.data ? JSON.stringify(data.data) : null,
                scheduledFor: data.scheduledFor,
                status: 'pending',
                isRead: false,
            },
        });
    }
    async markAsRead(id) {
        return await this.prisma.notification.update({
            where: { id },
            data: {
                readAt: new Date(),
                status: 'read',
            },
        });
    }
    async markAllAsRead(userId) {
        const result = await this.prisma.notification.updateMany({
            where: {
                userId,
                readAt: null,
            },
            data: {
                readAt: new Date(),
                status: 'read',
            },
        });
        return result.count;
    }
    async delete(id) {
        return await this.prisma.notification.delete({
            where: { id },
        });
    }
    async deleteOld(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const result = await this.prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
                readAt: { not: null },
            },
        });
        return result.count;
    }
    async sendPushNotification(userId, notification) {
    }
    static async sendOrderStatusUpdate(data) {
        try {
            const notificationData = {
                userId: data.parentId,
                type: 'order_status_update',
                title: `Order Status Update`,
                message: data.message || `Your order ${data.orderId} status has been updated to ${data.newStatus}`,
                data: {
                    orderId: data.orderId,
                    studentId: data.studentId,
                    newStatus: data.newStatus,
                },
            };
            const notification = await this.getInstance().create(notificationData);
            await this.getInstance().sendPushNotification(data.parentId, notificationData);
            return { success: true, data: notification };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to send notification',
                    code: 'NOTIFICATION_FAILED',
                },
            };
        }
    }
    static async sendNotification(request) {
        try {
            const notificationData = {
                userId: request.recipientId,
                type: request.templateId,
                title: 'Notification',
                message: 'Notification message',
                data: request.variables,
            };
            const notification = await this.getInstance().create(notificationData);
            return { success: true, data: { notification, templateData: {} } };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to send notification',
                    code: 'NOTIFICATION_SEND_FAILED',
                },
            };
        }
    }
    static async sendBulkNotifications(request) {
        try {
            let successful = 0;
            let failed = 0;
            const details = { successful: [], failed: [] };
            for (const recipient of request.recipients) {
                try {
                    const notificationRequest = {
                        templateId: request.templateId,
                        recipientId: recipient.recipientId,
                        recipientType: recipient.recipientType,
                        channels: request.channels,
                        variables: recipient.variables,
                        priority: request.priority,
                    };
                    const result = await this.sendNotification(notificationRequest);
                    if (result.success) {
                        successful++;
                        details.successful.push({ recipientId: recipient.recipientId });
                    }
                    else {
                        failed++;
                        details.failed.push({ recipientId: recipient.recipientId, error: result.error });
                    }
                }
                catch (error) {
                    failed++;
                    details.failed.push({
                        recipientId: recipient.recipientId,
                        error: { message: 'Processing failed' },
                    });
                }
            }
            return { success: true, data: { successful, failed, details } };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to send bulk notifications',
                    code: 'BULK_SEND_FAILED',
                },
            };
        }
    }
    static async sendOrderConfirmation(data) {
        const notificationRequest = {
            templateId: 'order_confirmation',
            recipientId: data.parentId,
            recipientType: 'parent',
            variables: {
                orderId: data.orderId,
                totalAmount: data.totalAmount.toString(),
                deliveryDate: data.deliveryDate.toISOString().split('T')[0],
            },
            priority: 'normal',
        };
        const result = await this.sendNotification(notificationRequest);
        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to send order confirmation');
        }
    }
    static async markAsRead(notificationId, userId) {
        try {
            const notification = await this.getInstance().findById(notificationId);
            if (!notification) {
                return {
                    success: false,
                    error: { message: 'Notification not found', code: 'NOTIFICATION_NOT_FOUND' },
                };
            }
            if (notification.userId !== userId) {
                return { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
            }
            const updated = await this.getInstance().markAsRead(notificationId);
            return { success: true, data: updated };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to mark notification as read',
                    code: 'MARK_READ_FAILED',
                },
            };
        }
    }
    static async getUserNotifications(userId, options) {
        try {
            const page = options?.page || 1;
            const limit = Math.min(options?.limit || 20, 100);
            const skip = (page - 1) * limit;
            const where = { recipientId: userId };
            if (options?.status) {
                where.status = options.status;
            }
            if (options?.unreadOnly) {
                where.status = { in: ['pending', 'sent', 'delivered'] };
            }
            if (options?.priority) {
                where.priority = options.priority;
            }
            const notifications = await this.getInstance().prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            });
            const total = await this.getInstance().prisma.notification.count({ where });
            return {
                success: true,
                data: {
                    notifications,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to get user notifications',
                    code: 'GET_NOTIFICATIONS_FAILED',
                },
            };
        }
    }
    static async updateNotificationPreferences(userId, preferences) {
        try {
            const currentPrefs = {
                channels: {
                    push: true,
                    email: true,
                    sms: false,
                    whatsapp: true,
                    in_app: true,
                    socket: true,
                },
                quietHours: { enabled: false, startTime: '22:00', endTime: '08:00', timezone: 'UTC' },
                frequency: {
                    email: 'immediate',
                    push: 'immediate',
                    sms: 'urgent_only',
                    whatsapp: 'immediate',
                },
                topics: {
                    orderUpdates: true,
                    paymentUpdates: true,
                    systemAnnouncements: true,
                    promotions: false,
                },
            };
            const updatedPrefs = { ...currentPrefs, ...preferences };
            return { success: true, data: updatedPrefs };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to update preferences',
                    code: 'PREFERENCES_UPDATE_FAILED',
                },
            };
        }
    }
    static async getNotificationAnalytics(_filters) {
        try {
            const analytics = {
                totalSent: 0,
                totalDelivered: 0,
                totalRead: 0,
                deliveryRate: 0,
                readRate: 0,
                channelStats: {
                    push: { sent: 0, delivered: 0, read: 0, failed: 0 },
                    email: { sent: 0, delivered: 0, read: 0, failed: 0 },
                    sms: { sent: 0, delivered: 0, read: 0, failed: 0 },
                    whatsapp: { sent: 0, delivered: 0, read: 0, failed: 0 },
                    in_app: { sent: 0, delivered: 0, read: 0, failed: 0 },
                    socket: { sent: 0, delivered: 0, read: 0, failed: 0 },
                },
                templateStats: {},
                timeSeries: [],
            };
            return { success: true, data: analytics };
        }
        catch (error) {
            return {
                success: false,
                error: { message: error.message || 'Failed to get analytics', code: 'ANALYTICS_FAILED' },
            };
        }
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = NotificationService.getInstance();
exports.default = NotificationService;
//# sourceMappingURL=notification.service.js.map