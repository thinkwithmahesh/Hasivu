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
            const userPrefs = await this.getUserNotificationPreferences(request.recipientId);
            const templateContent = await this.getNotificationTemplate(request.templateId, request.variables);
            if (!templateContent) {
                return {
                    success: false,
                    error: {
                        message: 'Notification template not found',
                        code: 'TEMPLATE_NOT_FOUND',
                    },
                };
            }
            const notificationData = {
                userId: request.recipientId,
                type: request.templateId,
                title: templateContent.title,
                message: templateContent.message,
                data: {
                    ...request.variables,
                    channels: request.channels,
                    priority: request.priority,
                },
                scheduledFor: request.expiresAt,
            };
            const notification = await this.getInstance().create(notificationData);
            const enabledChannels = this.getEnabledChannels(request.channels, userPrefs);
            const deliveryResults = await this.deliverNotification(notification, enabledChannels);
            if (deliveryResults.some(r => r.success)) {
                await this.getInstance().prisma.notification.update({
                    where: { id: notification.id },
                    data: { status: 'sent' },
                });
            }
            return {
                success: true,
                data: {
                    notification,
                    deliveryResults,
                    templateData: templateContent,
                },
            };
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
            const batchSize = 10;
            for (let i = 0; i < request.recipients.length; i += batchSize) {
                const batch = request.recipients.slice(i, i + batchSize);
                const batchPromises = batch.map(async (recipient) => {
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
                });
                await Promise.all(batchPromises);
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
    static async getUserNotificationPreferences(userId) {
        return {
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
    }
    static async getNotificationTemplate(templateId, variables = {}) {
        const templates = {
            order_confirmation: {
                title: 'Order Confirmed',
                message: `Your order #${variables.orderId || 'N/A'} has been confirmed for ${variables.deliveryDate || 'N/A'}. Total: ₹${variables.totalAmount || 'N/A'}`,
            },
            order_status_update: {
                title: 'Order Status Update',
                message: `Your order status has been updated to: ${variables.newStatus || 'N/A'}`,
            },
            payment_success: {
                title: 'Payment Successful',
                message: `Payment of ₹${variables.amount || 'N/A'} has been processed successfully.`,
            },
            delivery_reminder: {
                title: 'Delivery Reminder',
                message: `Your order will be delivered today at ${variables.deliveryTime || 'N/A'}.`,
            },
        };
        return templates[templateId] || null;
    }
    static getEnabledChannels(requestedChannels, userPrefs) {
        const defaultChannels = ['in_app'];
        const availableChannels = requestedChannels || defaultChannels;
        return availableChannels.filter(channel => {
            switch (channel) {
                case 'push':
                    return userPrefs.channels.push;
                case 'email':
                    return userPrefs.channels.email;
                case 'sms':
                    return userPrefs.channels.sms;
                case 'whatsapp':
                    return userPrefs.channels.whatsapp;
                case 'in_app':
                    return userPrefs.channels.in_app;
                case 'socket':
                    return userPrefs.channels.socket;
                default:
                    return false;
            }
        });
    }
    static async deliverNotification(notification, channels) {
        const results = [];
        for (const channel of channels) {
            try {
                switch (channel) {
                    case 'push':
                        if (notification.userId && notification.title && notification.message) {
                            await this.getInstance().sendPushNotification(notification.userId, {
                                userId: notification.userId,
                                type: notification.type,
                                title: notification.title,
                                message: notification.message,
                                data: notification.data ? JSON.parse(notification.data) : undefined,
                            });
                        }
                        break;
                    case 'email':
                        await this.sendEmailNotification(notification);
                        break;
                    case 'sms':
                        await this.sendSMSNotification(notification);
                        break;
                    case 'whatsapp':
                        await this.sendWhatsAppNotification(notification);
                        break;
                    case 'in_app':
                        await this.getInstance().prisma.notification.update({
                            where: { id: notification.id },
                            data: { status: 'delivered' },
                        });
                        break;
                    case 'socket':
                        await this.sendSocketNotification(notification);
                        break;
                }
                results.push({ channel, success: true });
            }
            catch (error) {
                results.push({ channel, success: false, error: error.message });
            }
        }
        return results;
    }
    static async sendEmailNotification(notification) {
        console.log(`Sending email notification: ${notification.title} to user ${notification.userId}`);
    }
    static async sendSMSNotification(notification) {
        console.log(`Sending SMS notification: ${notification.title} to user ${notification.userId}`);
    }
    static async sendWhatsAppNotification(notification) {
        console.log(`Sending WhatsApp notification: ${notification.title} to user ${notification.userId}`);
    }
    static async sendSocketNotification(notification) {
        console.log(`Sending socket notification: ${notification.title} to user ${notification.userId}`);
    }
    static async getNotificationAnalytics(filters) {
        try {
            const where = {};
            if (filters?.startDate || filters?.endDate) {
                where.createdAt = {};
                if (filters.startDate)
                    where.createdAt.gte = filters.startDate;
                if (filters.endDate)
                    where.createdAt.lte = filters.endDate;
            }
            if (filters?.templateId) {
                where.type = filters.templateId;
            }
            if (filters?.userId) {
                where.userId = filters.userId;
            }
            const notifications = await this.getInstance().prisma.notification.findMany({
                where,
                select: {
                    id: true,
                    type: true,
                    status: true,
                    createdAt: true,
                },
            });
            const totalSent = notifications.length;
            const totalDelivered = notifications.filter(n => ['delivered', 'read'].includes(n.status)).length;
            const totalRead = notifications.filter(n => n.status === 'read').length;
            const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
            const readRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;
            const channelStats = {
                push: { sent: 0, delivered: 0, read: 0, failed: 0 },
                email: { sent: 0, delivered: 0, read: 0, failed: 0 },
                sms: { sent: 0, delivered: 0, read: 0, failed: 0 },
                whatsapp: { sent: 0, delivered: 0, read: 0, failed: 0 },
                in_app: {
                    sent: totalSent,
                    delivered: totalDelivered,
                    read: totalRead,
                    failed: totalSent - totalDelivered,
                },
                socket: { sent: 0, delivered: 0, read: 0, failed: 0 },
            };
            const templateStats = {};
            notifications.forEach(notification => {
                if (!templateStats[notification.type]) {
                    templateStats[notification.type] = { sent: 0, delivered: 0, read: 0 };
                }
                templateStats[notification.type].sent++;
                if (['delivered', 'read'].includes(notification.status)) {
                    templateStats[notification.type].delivered++;
                }
                if (notification.status === 'read') {
                    templateStats[notification.type].read++;
                }
            });
            const timeSeries = [];
            const analytics = {
                totalSent,
                totalDelivered,
                totalRead,
                deliveryRate,
                readRate,
                channelStats,
                templateStats,
                timeSeries,
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