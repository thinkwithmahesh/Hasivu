"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockNotificationProvider = void 0;
class MockNotificationProvider {
    config;
    sentNotifications = new Map();
    notificationCounter = 0;
    deliveryQueue = [];
    constructor(config = {}) {
        this.config = {
            successRate: config.successRate ?? 0.98,
            averageDeliveryTime: config.averageDeliveryTime ?? 200,
            maxDeliveryTime: config.maxDeliveryTime ?? 1000,
            enableRandomFailures: config.enableRandomFailures ?? true,
            enableDeliveryDelay: config.enableDeliveryDelay ?? true,
            supportedChannels: config.supportedChannels ?? ['email', 'sms', 'whatsapp', 'push'],
            ...config
        };
        this.startDeliverySimulation();
    }
    async sendNotification(data) {
        if (this.config.enableDeliveryDelay) {
            await this.simulateProcessingDelay();
        }
        const messageId = `mock_msg_${++this.notificationCounter}_${Date.now()}`;
        if (!this.config.supportedChannels.includes(data.channel)) {
            return {
                success: false,
                error: 'unsupported_channel',
                message: `Channel ${data.channel} is not supported`
            };
        }
        if (!data.to || (Array.isArray(data.to) && data.to.length === 0)) {
            return {
                success: false,
                error: 'invalid_recipient',
                message: 'Recipient is required'
            };
        }
        const shouldSucceed = this.config.enableRandomFailures
            ? Math.random() < this.config.successRate
            : true;
        if (!shouldSucceed) {
            const failureReason = this.getRandomFailureReason(data.channel);
            const notification = {
                id: messageId,
                ...data,
                status: 'failed',
                error: failureReason,
                sentAt: new Date(),
                deliveredAt: null,
                metadata: {
                    ...data.metadata,
                    provider: 'MockNotificationProvider',
                    attempts: 1,
                    failureReason
                }
            };
            this.sentNotifications.set(messageId, notification);
            return {
                success: false,
                messageId,
                error: failureReason,
                message: `Notification failed: ${failureReason}`,
                deliveryStatus: 'failed',
                timestamp: new Date()
            };
        }
        const notification = {
            id: messageId,
            ...data,
            status: 'sent',
            sentAt: new Date(),
            deliveredAt: null,
            metadata: {
                ...data.metadata,
                provider: 'MockNotificationProvider',
                attempts: 1,
                channel: data.channel,
                recipientCount: Array.isArray(data.to) ? data.to.length : 1
            }
        };
        this.sentNotifications.set(messageId, notification);
        const deliveryTime = Date.now() + this.getRandomDeliveryTime();
        this.deliveryQueue.push({ messageId, deliveryTime });
        return {
            success: true,
            messageId,
            message: 'Notification sent successfully',
            deliveryStatus: 'sent',
            timestamp: new Date()
        };
    }
    async sendBulkNotifications(notifications) {
        const results = [];
        for (const notification of notifications) {
            const result = await this.sendNotification(notification);
            results.push(result);
        }
        return results;
    }
    async sendEmail(to, subject, body, options) {
        return this.sendNotification({
            to,
            channel: 'email',
            subject,
            message: body,
            ...options
        });
    }
    async sendSMS(to, message, options) {
        return this.sendNotification({
            to,
            channel: 'sms',
            message,
            ...options
        });
    }
    async sendWhatsApp(to, message, options) {
        return this.sendNotification({
            to,
            channel: 'whatsapp',
            message,
            ...options
        });
    }
    async sendPushNotification(to, title, body, options) {
        return this.sendNotification({
            to,
            channel: 'push',
            subject: title,
            message: body,
            ...options
        });
    }
    async getNotificationStatus(messageId) {
        const notification = this.sentNotifications.get(messageId);
        if (!notification) {
            return {
                success: false,
                error: 'notification_not_found',
                message: `Notification with ID ${messageId} not found`
            };
        }
        return {
            success: true,
            messageId,
            deliveryStatus: notification.status,
            message: `Notification status: ${notification.status}`,
            timestamp: notification.deliveredAt || notification.sentAt
        };
    }
    getStatistics() {
        const notifications = Array.from(this.sentNotifications.values());
        const totalNotifications = notifications.length;
        const sentNotifications = notifications.filter(n => n.status === 'sent' || n.status === 'delivered').length;
        const deliveredNotifications = notifications.filter(n => n.status === 'delivered').length;
        const failedNotifications = notifications.filter(n => n.status === 'failed').length;
        const channelStats = this.config.supportedChannels.reduce((stats, channel) => {
            const channelNotifications = notifications.filter(n => n.channel === channel);
            stats[channel] = {
                total: channelNotifications.length,
                sent: channelNotifications.filter(n => n.status === 'sent' || n.status === 'delivered').length,
                delivered: channelNotifications.filter(n => n.status === 'delivered').length,
                failed: channelNotifications.filter(n => n.status === 'failed').length
            };
            return stats;
        }, {});
        return {
            totalNotifications,
            sentNotifications,
            deliveredNotifications,
            failedNotifications,
            sendSuccessRate: totalNotifications > 0 ? (sentNotifications / totalNotifications) * 100 : 0,
            deliveryRate: sentNotifications > 0 ? (deliveredNotifications / sentNotifications) * 100 : 0,
            channelStats,
            averageDeliveryTime: this.config.averageDeliveryTime,
            configuration: {
                successRate: this.config.successRate * 100,
                averageDeliveryTime: this.config.averageDeliveryTime,
                supportedChannels: this.config.supportedChannels
            }
        };
    }
    getAllNotifications() {
        return Array.from(this.sentNotifications.values());
    }
    getNotificationsByChannel(channel) {
        return this.getAllNotifications().filter(n => n.channel === channel);
    }
    getNotificationsByStatus(status) {
        return this.getAllNotifications().filter(n => n.status === status);
    }
    reset() {
        this.sentNotifications.clear();
        this.deliveryQueue.length = 0;
        this.notificationCounter = 0;
    }
    configure(config) {
        this.config = { ...this.config, ...config };
    }
    hasNotification(messageId) {
        return this.sentNotifications.has(messageId);
    }
    getNotificationCount() {
        return this.sentNotifications.size;
    }
    async simulateProcessingDelay() {
        const delay = Math.min(this.config.averageDeliveryTime / 4, 100);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    getRandomDeliveryTime() {
        return Math.min(this.config.averageDeliveryTime + (Math.random() * 200 - 100), this.config.maxDeliveryTime);
    }
    getRandomFailureReason(channel) {
        const commonReasons = [
            'network_error',
            'service_unavailable',
            'rate_limit_exceeded',
            'authentication_failed'
        ];
        const channelSpecificReasons = {
            email: ['invalid_email', 'blocked_recipient', 'spam_detected', 'mailbox_full'],
            sms: ['invalid_number', 'number_blocked', 'carrier_rejected', 'insufficient_credits'],
            whatsapp: ['number_not_registered', 'template_rejected', 'policy_violation', 'user_blocked'],
            push: ['invalid_token', 'app_uninstalled', 'device_unreachable', 'token_expired']
        };
        const allReasons = [...commonReasons, ...(channelSpecificReasons[channel] || [])];
        return allReasons[Math.floor(Math.random() * allReasons.length)];
    }
    startDeliverySimulation() {
        setInterval(() => {
            const now = Date.now();
            const readyForDelivery = this.deliveryQueue.filter(item => item.deliveryTime <= now);
            readyForDelivery.forEach(item => {
                const notification = this.sentNotifications.get(item.messageId);
                if (notification && notification.status === 'sent') {
                    const deliverySucceeded = Math.random() < 0.99;
                    if (deliverySucceeded) {
                        notification.status = 'delivered';
                        notification.deliveredAt = new Date();
                    }
                    else {
                        notification.status = 'failed';
                        notification.error = 'delivery_failed';
                        notification.metadata.failureReason = 'delivery_timeout';
                    }
                    this.sentNotifications.set(item.messageId, notification);
                }
            });
            this.deliveryQueue = this.deliveryQueue.filter(item => item.deliveryTime > now);
        }, 100);
    }
}
exports.MockNotificationProvider = MockNotificationProvider;
//# sourceMappingURL=MockNotificationProvider.js.map