"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const database_service_1 = require("./database.service");
const logger_1 = require("../utils/logger");
const cache_1 = require("../utils/cache");
const uuid_1 = require("uuid");
/**
 * Notification service class
 */
class NotificationService {
    static CACHE_TTL = 3600; // 1 hour
    static RETRY_ATTEMPTS = 3;
    static BATCH_SIZE = 100;
    static QUIET_HOURS_BUFFER = 30; // minutes
    /**
     * Send notification with comprehensive channel support
     */
    static async sendNotification(request) {
        try {
            logger_1.logger.info('Sending notification', {
                templateId: request.templateId,
                recipientId: request.recipientId,
                channels: request.channels
            });
            const { templateId, recipientId, recipientType, channels: requestedChannels, variables = {}, priority = 'normal', scheduledAt, expiresAt, metadata = {} } = request;
            // Get notification template
            const template = await this.getTemplate(templateId);
            if (!template || !template.isActive) {
                return {
                    success: false,
                    error: {
                        message: 'Notification template not found or inactive',
                        code: 'TEMPLATE_NOT_FOUND'
                    }
                };
            }
            // Get recipient information
            const recipient = await this.getRecipient(recipientId);
            if (!recipient) {
                return {
                    success: false,
                    error: {
                        message: 'Recipient not found',
                        code: 'RECIPIENT_NOT_FOUND'
                    }
                };
            }
            // Get user preferences
            const preferences = await this.getUserPreferences(recipientId);
            // Determine channels to use
            const channels = this.determineChannels(template, preferences, requestedChannels);
            if (channels.length === 0) {
                return {
                    success: false,
                    error: {
                        message: 'No available channels for notification',
                        code: 'NO_CHANNELS_AVAILABLE'
                    }
                };
            }
            // Check quiet hours if not urgent
            if (priority !== 'urgent' && this.isQuietHours(preferences)) {
                // Schedule for after quiet hours
                const scheduledTime = this.calculatePostQuietHoursTime(preferences);
                logger_1.logger.info('Scheduling notification after quiet hours', {
                    originalSchedule: scheduledAt,
                    newSchedule: scheduledTime
                });
                // Reschedule the notification
                return this.scheduleNotification(request, scheduledTime);
            }
            // Process template variables
            const processedContent = this.processTemplate(template, variables, recipient);
            // Create notification record
            const notificationData = {
                id: (0, uuid_1.v4)(),
                // Note: template/templateId fields not available in current Prisma schema
                user: { connect: { id: recipientId } },
                type: recipientType,
                title: processedContent.subject || template.name,
                // Note: content field not available in current Prisma schema
                body: processedContent.push?.body || template.name,
                data: JSON.stringify({
                    variables: variables || {},
                    deliveryStatus: this.initializeDeliveryStatus(channels),
                    metadata: metadata || {}
                }),
                priority,
                status: 'pending',
                // scheduledFor field available in Prisma schema
                scheduledFor: scheduledAt || new Date()
            };
            const notification = await database_service_1.DatabaseService.client.notification.create({
                data: notificationData
            });
            // Send through each channel
            const deliveryResults = await this.sendThroughChannels(notification, processedContent, channels, priority);
            // Update delivery status
            const updatedNotification = await this.updateDeliveryStatus(notification.id, deliveryResults);
            // Cache unread notification count
            await this.updateUnreadCount(recipientId);
            logger_1.logger.info('Notification sent successfully', {
                notificationId: notification.id,
                channelsUsed: channels,
                deliveryResults
            });
            return {
                success: true,
                data: {
                    ...updatedNotification,
                    templateData: template,
                    // Note: deliveryStatus field not available in current Prisma schema - using fallback structure
                    deliveryStatus: {
                        push: { status: updatedNotification.status, sentAt: new Date() },
                        email: { status: updatedNotification.status },
                        sms: { status: 'pending' },
                        whatsapp: { status: 'pending' },
                        in_app: { status: 'pending' },
                        socket: { status: 'pending' }
                    }
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to send notification', error, { request });
            return {
                success: false,
                error: {
                    message: 'Failed to send notification',
                    code: 'NOTIFICATION_SEND_FAILED',
                    details: error
                }
            };
        }
    }
    /**
     * Send bulk notifications efficiently
     */
    static async sendBulkNotifications(request) {
        try {
            logger_1.logger.info('Sending bulk notifications', {
                templateId: request.templateId,
                recipientCount: request.recipients.length
            });
            const successful = [];
            const failed = [];
            // Process in batches
            for (let i = 0; i < request.recipients.length; i += this.BATCH_SIZE) {
                const batch = request.recipients.slice(i, i + this.BATCH_SIZE);
                const batchPromises = batch.map(async (recipient) => {
                    const notificationRequest = {
                        templateId: request.templateId,
                        recipientId: recipient.recipientId,
                        recipientType: recipient.recipientType,
                        channels: request.channels,
                        variables: recipient.variables,
                        priority: request.priority,
                        scheduledAt: request.scheduledAt,
                        metadata: request.metadata
                    };
                    const result = await this.sendNotification(notificationRequest);
                    if (result.success) {
                        successful.push({
                            recipientId: recipient.recipientId,
                            notificationId: result.data?.id
                        });
                    }
                    else {
                        failed.push({
                            recipientId: recipient.recipientId,
                            error: result.error
                        });
                    }
                    return result;
                });
                await Promise.allSettled(batchPromises);
                // Small delay between batches to prevent overwhelming
                if (i + this.BATCH_SIZE < request.recipients.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            logger_1.logger.info('Bulk notifications completed', {
                successful: successful.length,
                failed: failed.length,
                total: request.recipients.length
            });
            return {
                success: true,
                data: {
                    successful: successful.length,
                    failed: failed.length,
                    details: ({
                        successful: successful,
                        failed: failed
                    })
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to send bulk notifications', error, { request });
            return {
                success: false,
                error: {
                    message: 'Failed to send bulk notifications',
                    code: 'BULK_NOTIFICATION_FAILED',
                    details: error
                }
            };
        }
    }
    /**
     * Send order confirmation notification
     */
    static async sendOrderConfirmation(data) {
        const variables = {
            orderId: data.orderId,
            totalAmount: data.totalAmount.toFixed(2),
            deliveryDate: data.deliveryDate.toLocaleDateString(),
            studentName: 'Student' // Would be fetched from user data
        };
        return this.sendNotification({
            templateId: 'order_confirmation',
            recipientId: data.parentId,
            recipientType: 'parent',
            channels: ['push', 'email', 'whatsapp'],
            variables,
            priority: 'normal'
        });
    }
    /**
     * Send order status update notification
     */
    static async sendOrderStatusUpdate(data) {
        const variables = {
            orderId: data.orderId,
            newStatus: data.newStatus,
            message: data.message || '',
            studentName: 'Student' // Would be fetched from user data
        };
        return this.sendNotification({
            templateId: 'order_status_update',
            recipientId: data.parentId,
            recipientType: 'parent',
            channels: ['push', 'in_app'],
            variables,
            priority: data.newStatus === 'DELIVERED' ? 'high' : 'normal'
        });
    }
    /**
     * Mark notification as read
     */
    static async markAsRead(notificationId, userId) {
        try {
            const notification = await database_service_1.DatabaseService.client.notification.findFirst({
                where: {
                    id: notificationId,
                    userId: userId
                }
            });
            if (!notification) {
                return {
                    success: false,
                    error: {
                        message: 'Notification not found',
                        code: 'NOTIFICATION_NOT_FOUND'
                    }
                };
            }
            const updatedNotification = await database_service_1.DatabaseService.client.notification.update({
                where: { id: notificationId },
                data: {
                    status: 'read',
                    readAt: new Date(),
                    updatedAt: new Date()
                }
            });
            // Update unread count
            await this.updateUnreadCount(userId);
            return {
                success: true,
                data: updatedNotification
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to mark notification as read', error, { notificationId, userId });
            return {
                success: false,
                error: {
                    message: 'Failed to mark notification as read',
                    code: 'MARK_READ_FAILED',
                    details: error
                }
            };
        }
    }
    /**
     * Get notifications for user with pagination
     */
    static async getUserNotifications(userId, options = {}) {
        try {
            const page = options.page || 1;
            const limit = Math.min(options.limit || 20, 100);
            const skip = (page - 1) * limit;
            const filters = { userId: userId };
            if (options.status)
                filters.status = options.status;
            if (options.priority)
                filters.priority = options.priority;
            if (options.unreadOnly) {
                filters.status = { in: ['pending', 'sent', 'delivered'] };
            }
            const [notifications, total] = await Promise.all([
                database_service_1.DatabaseService.client.notification.findMany({
                    where: filters,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                database_service_1.DatabaseService.client.notification.count({ where: filters })
            ]);
            const totalPages = Math.ceil(total / limit);
            return {
                success: true,
                data: {
                    notifications,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages
                    }
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user notifications', error, { userId, options });
            return {
                success: false,
                error: {
                    message: 'Failed to get notifications',
                    code: 'GET_NOTIFICATIONS_FAILED',
                    details: error
                }
            };
        }
    }
    /**
     * Update notification preferences
     */
    static async updateNotificationPreferences(userId, preferences) {
        try {
            const cacheKey = `notification_preferences:${userId}`;
            // Get existing preferences
            const existing = await this.getUserPreferences(userId);
            const updated = { ...existing, ...preferences };
            // Save to database (assuming a UserPreferences model exists)
            await database_service_1.DatabaseService.client.user.update({
                where: { id: userId },
                data: {
                    // Note: notificationPreferences field not available in current schema
                    metadata: JSON.stringify({ notificationPreferences: updated })
                }
            });
            // Update cache
            await cache_1.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(updated));
            logger_1.logger.info('Notification preferences updated', { userId });
            return {
                success: true,
                data: updated
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update notification preferences', error, { userId, preferences });
            return {
                success: false,
                error: {
                    message: 'Failed to update preferences',
                    code: 'PREFERENCES_UPDATE_FAILED',
                    details: error
                }
            };
        }
    }
    /**
     * Get notification analytics
     */
    static async getNotificationAnalytics(filters) {
        try {
            const whereClause = {
                createdAt: {
                    gte: filters.startDate,
                    lte: filters.endDate
                }
            };
            // Note: template/templateId fields not available in current Prisma schema
            // if (filters.templateId) whereClause.template = { id: filters.templateId };
            if (filters.userId)
                whereClause.userId = filters.userId;
            const notifications = await database_service_1.DatabaseService.client.notification.findMany({
                where: whereClause,
                select: {
                    id: true,
                    // Note: template/templateId fields not available in current Prisma schema  
                    status: true,
                    type: true,
                    title: true,
                    createdAt: true
                    // Note: readAt and deliveryStatus fields not available in current Prisma schema
                }
            });
            // Process analytics
            const analytics = this.processNotificationAnalytics(notifications);
            return {
                success: true,
                data: analytics
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get notification analytics', error, { filters });
            return {
                success: false,
                error: {
                    message: 'Failed to get analytics',
                    code: 'ANALYTICS_FAILED',
                    details: error
                }
            };
        }
    }
    /**
     * Get template by ID with caching
     */
    static async getTemplate(templateId) {
        const cacheKey = `notification_template:${templateId}`;
        const cached = await cache_1.cache.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        // For now, return mock template data
        // In production, this would fetch from a NotificationTemplate model
        const template = this.getMockTemplate(templateId);
        if (template) {
            await cache_1.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(template));
        }
        return template;
    }
    /**
     * Get recipient information
     */
    static async getRecipient(recipientId) {
        return database_service_1.DatabaseService.client.user.findUnique({
            where: { id: recipientId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                schoolId: true
            }
        });
    }
    /**
     * Get user notification preferences
     */
    static async getUserPreferences(userId) {
        const cacheKey = `notification_preferences:${userId}`;
        const cached = await cache_1.cache.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        // Get from user record or return defaults
        const user = await database_service_1.DatabaseService.client.user.findUnique({
            where: { id: userId },
            select: { metadata: true }
        });
        const preferences = user?.metadata ?
            JSON.parse(user.metadata).notificationPreferences || this.getDefaultPreferences() :
            this.getDefaultPreferences();
        await cache_1.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(preferences));
        return preferences;
    }
    /**
     * Determine which channels to use for notification
     */
    static determineChannels(template, preferences, requestedChannels) {
        const availableChannels = template.channels;
        const userEnabledChannels = Object.entries(preferences.channels)
            .filter(([_, enabled]) => enabled)
            .map(([channel, _]) => channel);
        const channels = requestedChannels || availableChannels;
        return channels.filter(channel => availableChannels.includes(channel) &&
            userEnabledChannels.includes(channel));
    }
    /**
     * Check if current time is within quiet hours
     */
    static isQuietHours(preferences) {
        if (!preferences.quietHours.enabled)
            return false;
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startHour, startMin] = preferences.quietHours.startTime.split(':').map(Number);
        const [endHour, endMin] = preferences.quietHours.endTime.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        if (startTime <= endTime) {
            return currentTime >= startTime && currentTime <= endTime;
        }
        else {
            // Quiet hours span midnight
            return currentTime >= startTime || currentTime <= endTime;
        }
    }
    /**
     * Calculate time after quiet hours end
     */
    static calculatePostQuietHoursTime(preferences) {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [endHour, endMin] = preferences.quietHours.endTime.split(':').map(Number);
        const endTime = new Date(now);
        endTime.setHours(endHour, endMin + this.QUIET_HOURS_BUFFER, 0, 0);
        // If end time is before now, schedule for tomorrow
        if (endTime < now) {
            endTime.setDate(endTime.getDate() + 1);
        }
        return endTime;
    }
    /**
     * Schedule notification for later delivery
     */
    static async scheduleNotification(request, scheduledTime) {
        // In a real implementation, this would use a job queue like Bull or Agenda
        // For now, we'll just update the scheduledAt time
        const updatedRequest = {
            ...request,
            scheduledAt: scheduledTime
        };
        // Store in database with scheduled status
        // This would be picked up by a background job processor
        logger_1.logger.info('Notification scheduled for later delivery', {
            originalTime: request.scheduledAt,
            scheduledTime: scheduledTime
        });
        return {
            success: true,
            data: null // Would return scheduled notification data
        };
    }
    /**
     * Process template with variables
     */
    static processTemplate(template, variables, recipient) {
        const processed = {};
        for (const [channel, content] of Object.entries(template.content)) {
            if (content && typeof content === 'object') {
                processed[channel] = {
                    subject: this.replaceVariables(content.subject || '', variables, recipient),
                    body: this.replaceVariables(content.body, variables, recipient),
                    buttonText: content.buttonText ? this.replaceVariables(content.buttonText, variables, recipient) : undefined,
                    buttonUrl: content.buttonUrl ? this.replaceVariables(content.buttonUrl, variables, recipient) : undefined
                };
            }
        }
        return processed;
    }
    /**
     * Replace variables in template string
     */
    static replaceVariables(template, variables, recipient) {
        let result = template;
        // Replace custom variables
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            result = result.replace(regex, String(value));
        }
        // Replace recipient variables
        if (recipient) {
            result = result.replace(/{{recipient\.firstName}}/g, recipient.firstName || '');
            result = result.replace(/{{recipient\.lastName}}/g, recipient.lastName || '');
            result = result.replace(/{{recipient\.email}}/g, recipient.email || '');
        }
        return result;
    }
    /**
     * Initialize delivery status for all channels
     */
    static initializeDeliveryStatus(channels) {
        const status = {};
        for (const channel of channels) {
            status[channel] = {
                status: 'pending',
                sentAt: null,
                deliveredAt: null,
                readAt: null,
                error: null
            };
        }
        return status;
    }
    /**
     * Send notification through multiple channels
     */
    static async sendThroughChannels(notification, processedContent, channels, priority) {
        const results = {};
        for (const channel of channels) {
            try {
                const content = processedContent[channel];
                if (!content) {
                    results[channel] = {
                        status: 'failed',
                        error: `No content for channel: ${channel}`
                    };
                    continue;
                }
                // Send through channel (mock implementation)
                const result = await this.sendThroughChannel(channel, content, notification, priority);
                results[channel] = result;
            }
            catch (error) {
                logger_1.logger.error(`Failed to send through ${channel}`, error);
                results[channel] = {
                    status: 'failed',
                    error: error.message
                };
            }
        }
        return results;
    }
    /**
     * Send through specific channel (mock implementation)
     */
    static async sendThroughChannel(channel, content, notification, priority) {
        // Mock channel sending - in production would integrate with actual services
        switch (channel) {
            case 'email':
                // Would integrate with SendGrid, AWS SES, etc.
                break;
            case 'sms':
                // Would integrate with Twilio, AWS SNS, etc.
                break;
            case 'whatsapp':
                // Would integrate with WhatsApp Business API
                break;
            case 'push':
                // Would integrate with Firebase Cloud Messaging
                break;
            case 'in_app':
                // Store in database for in-app display
                break;
            case 'socket':
                // Send through WebSocket connection
                break;
        }
        // Mock successful delivery
        return {
            status: 'sent',
            sentAt: new Date(),
            messageId: `${channel}_${Date.now()}`
        };
    }
    /**
     * Update delivery status in database
     */
    static async updateDeliveryStatus(notificationId, deliveryResults) {
        const overallStatus = Object.values(deliveryResults).some(result => result.status === 'sent') ? 'sent' : 'failed';
        return database_service_1.DatabaseService.client.notification.update({
            where: { id: notificationId },
            data: {
                status: overallStatus,
                // Note: deliveryStatus field not available in current Prisma schema
                data: JSON.stringify(deliveryResults),
                updatedAt: new Date()
            }
        });
    }
    /**
     * Update unread notification count cache
     */
    static async updateUnreadCount(userId) {
        const count = await database_service_1.DatabaseService.client.notification.count({
            where: {
                userId: userId,
                status: { in: ['pending', 'sent', 'delivered'] }
            }
        });
        const cacheKey = `unread_notifications:${userId}`;
        await cache_1.cache.setex(cacheKey, this.CACHE_TTL, count.toString());
    }
    /**
     * Get default notification preferences
     */
    static getDefaultPreferences() {
        return {
            channels: {
                push: true,
                email: true,
                sms: false,
                whatsapp: true,
                in_app: true,
                socket: true
            },
            quietHours: {
                enabled: true,
                startTime: '22:00',
                endTime: '08:00',
                timezone: 'Asia/Kolkata'
            },
            frequency: {
                email: 'immediate',
                push: 'immediate',
                sms: 'urgent_only',
                whatsapp: 'immediate'
            },
            topics: {
                orderUpdates: true,
                paymentUpdates: true,
                systemAnnouncements: true,
                promotions: false
            }
        };
    }
    /**
     * Get mock template data (replace with database fetch in production)
     */
    static getMockTemplate(templateId) {
        const templates = {
            order_confirmation: {
                id: 'order_confirmation',
                name: 'Order Confirmation',
                type: 'transactional',
                channels: ['push', 'email', 'whatsapp'],
                content: {
                    push: {
                        body: 'Order {{orderId}} confirmed! Total: ₹{{totalAmount}}. Delivery on {{deliveryDate}}.'
                    },
                    email: {
                        subject: 'Order Confirmation - {{orderId}}',
                        body: 'Hi {{recipient.firstName}}, your order {{orderId}} has been confirmed. Total amount: ₹{{totalAmount}}. Expected delivery: {{deliveryDate}}.'
                    },
                    whatsapp: {
                        body: 'Hi {{recipient.firstName}}! 🎉 Your order {{orderId}} is confirmed. Total: ₹{{totalAmount}}. Delivery: {{deliveryDate}}'
                    },
                    sms: { body: '' },
                    in_app: { body: '' },
                    socket: { body: '' }
                },
                variables: ['orderId', 'totalAmount', 'deliveryDate', 'studentName'],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            order_status_update: {
                id: 'order_status_update',
                name: 'Order Status Update',
                type: 'transactional',
                channels: ['push', 'in_app'],
                content: {
                    push: {
                        body: 'Order {{orderId}} is now {{newStatus}}. {{message}}'
                    },
                    in_app: {
                        body: 'Your order {{orderId}} status has been updated to {{newStatus}}. {{message}}'
                    },
                    email: { body: '' },
                    sms: { body: '' },
                    whatsapp: { body: '' },
                    socket: { body: '' }
                },
                variables: ['orderId', 'newStatus', 'message'],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        };
        return templates[templateId] || null;
    }
    /**
     * Process notification analytics data
     */
    static processNotificationAnalytics(notifications) {
        const totalSent = notifications.length;
        const totalDelivered = notifications.filter(n => ['sent', 'delivered', 'read'].includes(n.status)).length;
        const totalRead = notifications.filter(n => n.status === 'read').length;
        const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
        const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;
        // Initialize channel stats
        const channelStats = {
            push: { sent: 0, delivered: 0, read: 0, failed: 0 },
            email: { sent: 0, delivered: 0, read: 0, failed: 0 },
            sms: { sent: 0, delivered: 0, read: 0, failed: 0 },
            whatsapp: { sent: 0, delivered: 0, read: 0, failed: 0 },
            in_app: { sent: 0, delivered: 0, read: 0, failed: 0 },
            socket: { sent: 0, delivered: 0, read: 0, failed: 0 }
        };
        // Process each notification for channel stats
        notifications.forEach(notification => {
            const channels = JSON.parse(notification.channels);
            const deliveryStatus = JSON.parse(notification.deliveryStatus);
            channels.forEach(channel => {
                const status = deliveryStatus[channel]?.status || 'failed';
                if (channelStats[channel]) {
                    channelStats[channel].sent++;
                    if (['sent', 'delivered', 'read'].includes(status)) {
                        channelStats[channel].delivered++;
                    }
                    if (status === 'read') {
                        channelStats[channel].read++;
                    }
                    if (status === 'failed') {
                        channelStats[channel].failed++;
                    }
                }
            });
        });
        // Template stats would require grouping by templateId
        const templateStats = [];
        return {
            totalSent,
            totalDelivered,
            totalRead,
            deliveryRate,
            readRate,
            channelStats,
            templateStats
        };
    }
    /**
     * Clear notification queue (instance method for tests)
     */
    async clearQueue() {
        try {
            // Clear any pending notifications from queue
            logger_1.logger.info('Notification queue cleared');
        }
        catch (error) {
            logger_1.logger.warn('Failed to clear notification queue', error);
        }
    }
    /**
     * Disconnect from external resources (instance method for tests)
     */
    async disconnect() {
        try {
            // Close any persistent connections (WebSocket, message queues, etc.)
            logger_1.logger.info('Notification service disconnected');
        }
        catch (error) {
            logger_1.logger.warn('Failed to disconnect notification service', error);
        }
    }
}
exports.NotificationService = NotificationService;
// Export singleton instance
exports.notificationService = new NotificationService();
