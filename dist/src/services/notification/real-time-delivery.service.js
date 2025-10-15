"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realTimeDeliveryNotificationService = exports.RealTimeDeliveryNotificationService = exports.NotificationChannel = void 0;
const events_1 = require("events");
const database_service_1 = require("../database.service");
const logger_1 = require("../../utils/logger");
const cache_1 = require("../../utils/cache");
const uuid_1 = require("uuid");
const client_sns_1 = require("@aws-sdk/client-sns");
const client_ses_1 = require("@aws-sdk/client-ses");
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["PUSH"] = "push";
    NotificationChannel["SMS"] = "sms";
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["WHATSAPP"] = "whatsapp";
    NotificationChannel["IN_APP"] = "in_app";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
class RealTimeDeliveryNotificationService extends events_1.EventEmitter {
    static instance;
    snsClient;
    sesClient;
    notificationQueue = new Map();
    deliveryHistory = new Map();
    maxHistorySize = 1000;
    constructor() {
        super();
        this.snsClient = new client_sns_1.SNSClient({ region: process.env.AWS_REGION || 'ap-south-1' });
        this.sesClient = new client_ses_1.SESClient({ region: process.env.AWS_REGION || 'ap-south-1' });
        this.setupEventListeners();
    }
    static getInstance() {
        if (!RealTimeDeliveryNotificationService.instance) {
            RealTimeDeliveryNotificationService.instance = new RealTimeDeliveryNotificationService();
        }
        return RealTimeDeliveryNotificationService.instance;
    }
    async sendDeliveryNotification(payload) {
        const startTime = Date.now();
        const notificationId = (0, uuid_1.v4)();
        try {
            logger_1.logger.info('Sending delivery notification', {
                notificationId,
                verificationId: payload.verificationId,
                studentId: payload.studentId,
                parentId: payload.parentId
            });
            const parentInfo = await this.getParentContactInfo(payload.parentId);
            if (!parentInfo) {
                throw new Error('Parent contact information not found');
            }
            const parentDevices = await this.getParentDevices(payload.parentId);
            const templates = this.createNotificationTemplates(payload);
            const deliveryPromises = [];
            if (parentDevices.length > 0) {
                for (const device of parentDevices) {
                    deliveryPromises.push(this.sendPushNotification(device, templates.push));
                }
            }
            if (parentInfo.phone && parentInfo.preferences.smsEnabled) {
                deliveryPromises.push(this.sendSMSNotification(parentInfo.phone, templates.sms));
            }
            if (parentInfo.phone && parentInfo.preferences.whatsappEnabled) {
                deliveryPromises.push(this.sendWhatsAppNotification(parentInfo.phone, templates.whatsapp));
            }
            if (parentInfo.email && parentInfo.preferences.emailEnabled) {
                this.sendEmailNotificationAsync(parentInfo.email, templates.email, notificationId);
            }
            deliveryPromises.push(this.sendInAppNotification(payload.parentId, templates.inApp));
            const deliveryResults = await Promise.allSettled(deliveryPromises);
            const successfulDeliveries = deliveryResults
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value)
                .filter(result => result.success);
            const failedDeliveries = deliveryResults
                .filter(result => result.status === 'rejected' ||
                (result.status === 'fulfilled' && !result.value.success))
                .map(result => {
                if (result.status === 'rejected') {
                    return {
                        channel: NotificationChannel.PUSH,
                        success: false,
                        error: {
                            code: 'DELIVERY_FAILED',
                            message: result.reason?.message || 'Unknown error'
                        },
                        responseTime: Date.now() - startTime
                    };
                }
                return result.value;
            });
            const endTime = Date.now();
            const duration = endTime - startTime;
            const result = {
                notificationId,
                totalRecipients: 1,
                deliveryResults: [...successfulDeliveries, ...failedDeliveries],
                overallSuccess: successfulDeliveries.length > 0,
                averageResponseTime: duration,
                metadata: {
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                    duration
                }
            };
            this.addToDeliveryHistory(notificationId, result.deliveryResults);
            await cache_1.cache.setex(`delivery_notification:${notificationId}`, 3600, JSON.stringify(result));
            await this.recordDeliveryAnalytics(payload, result);
            this.emit('notification_delivered', {
                notificationId,
                payload,
                result,
                duration
            });
            logger_1.logger.info('Delivery notification completed', {
                notificationId,
                verificationId: payload.verificationId,
                successfulChannels: successfulDeliveries.length,
                failedChannels: failedDeliveries.length,
                duration,
                responseTimeTarget: duration < 2000 ? 'MET' : 'MISSED'
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.logger.error('Delivery notification failed', error, {
                notificationId,
                payload,
                duration
            });
            this.emit('notification_failed', {
                notificationId,
                payload,
                error,
                duration
            });
            throw error;
        }
    }
    async sendPushNotification(device, template) {
        const startTime = Date.now();
        try {
            const payload = {
                default: template.body,
                APNS: JSON.stringify({
                    aps: {
                        alert: {
                            title: template.title,
                            body: template.body
                        },
                        badge: template.badge || 1,
                        sound: template.sound || 'default'
                    },
                    data: template.data
                }),
                GCM: JSON.stringify({
                    data: {
                        title: template.title,
                        body: template.body,
                        icon: template.icon || 'meal_delivered',
                        sound: template.sound || 'default',
                        ...template.data
                    }
                })
            };
            const messageAttributes = {
                deviceType: {
                    DataType: 'String',
                    StringValue: device.deviceType
                }
            };
            if (device.fcmToken) {
                messageAttributes.fcmToken = {
                    DataType: 'String',
                    StringValue: device.fcmToken
                };
            }
            if (device.apnsToken) {
                messageAttributes.apnsToken = {
                    DataType: 'String',
                    StringValue: device.apnsToken
                };
            }
            const command = new client_sns_1.PublishCommand({
                TopicArn: process.env.PUSH_NOTIFICATION_TOPIC_ARN,
                Message: JSON.stringify(payload),
                MessageStructure: 'json',
                MessageAttributes: messageAttributes
            });
            const response = await this.snsClient.send(command);
            return {
                channel: NotificationChannel.PUSH,
                success: true,
                messageId: response.MessageId,
                deliveredAt: new Date(),
                responseTime: Date.now() - startTime
            };
        }
        catch (error) {
            logger_1.logger.error('Push notification failed', error, { device, template });
            return {
                channel: NotificationChannel.PUSH,
                success: false,
                error: {
                    code: 'PUSH_FAILED',
                    message: error instanceof Error ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : 'Unknown push error',
                    details: error
                },
                responseTime: Date.now() - startTime
            };
        }
    }
    async sendSMSNotification(phoneNumber, template) {
        const startTime = Date.now();
        try {
            const message = `${template.title}\n\n${template.body}\n\n- HASIVU Platform`;
            const command = new client_sns_1.PublishCommand({
                PhoneNumber: phoneNumber,
                Message: message,
                MessageAttributes: {
                    'AWS.SNS.SMS.SMSType': {
                        DataType: 'String',
                        StringValue: 'Transactional'
                    }
                }
            });
            const response = await this.snsClient.send(command);
            return {
                channel: NotificationChannel.SMS,
                success: true,
                messageId: response.MessageId,
                deliveredAt: new Date(),
                responseTime: Date.now() - startTime
            };
        }
        catch (error) {
            logger_1.logger.error('SMS notification failed', error, { phoneNumber, template });
            return {
                channel: NotificationChannel.SMS,
                success: false,
                error: {
                    code: 'SMS_FAILED',
                    message: error instanceof Error ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : 'Unknown SMS error',
                    details: error
                },
                responseTime: Date.now() - startTime
            };
        }
    }
    async sendWhatsAppNotification(phoneNumber, template) {
        const startTime = Date.now();
        try {
            const whatsappMessage = {
                to: phoneNumber,
                type: 'template',
                template: {
                    name: 'delivery_confirmation',
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: template.title },
                                { type: 'text', text: template.body }
                            ]
                        }
                    ]
                }
            };
            return {
                channel: NotificationChannel.WHATSAPP,
                success: true,
                messageId: (0, uuid_1.v4)(),
                deliveredAt: new Date(),
                responseTime: Date.now() - startTime
            };
        }
        catch (error) {
            logger_1.logger.error('WhatsApp notification failed', error, { phoneNumber, template });
            return {
                channel: NotificationChannel.WHATSAPP,
                success: false,
                error: {
                    code: 'WHATSAPP_FAILED',
                    message: error instanceof Error ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : 'Unknown WhatsApp error',
                    details: error
                },
                responseTime: Date.now() - startTime
            };
        }
    }
    async sendEmailNotificationAsync(email, template, notificationId) {
        try {
            setTimeout(async () => {
                const result = await this.sendEmailNotification(email, template);
                const history = this.deliveryHistory.get(notificationId) || [];
                history.push(result);
                this.deliveryHistory.set(notificationId, history);
                logger_1.logger.info('Email notification sent asynchronously', {
                    notificationId,
                    email,
                    success: result.success,
                    responseTime: result.responseTime
                });
            }, 0);
        }
        catch (error) {
            logger_1.logger.error('Async email notification failed', error, { email, notificationId });
        }
    }
    async sendEmailNotification(email, template) {
        const startTime = Date.now();
        try {
            const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5530;">${template.title}</h2>
          <p style="font-size: 16px; line-height: 1.5;">${template.body}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              Best regards,<br>
              HASIVU Platform Team
            </p>
          </div>
        </div>
      `;
            const command = new client_ses_1.SendEmailCommand({
                Source: process.env.FROM_EMAIL || 'notifications@hasivu.com',
                Destination: {
                    ToAddresses: [email]
                },
                Message: {
                    Subject: {
                        Data: template.title,
                        Charset: 'UTF-8'
                    },
                    Body: {
                        Html: {
                            Data: htmlBody,
                            Charset: 'UTF-8'
                        },
                        Text: {
                            Data: template.body,
                            Charset: 'UTF-8'
                        }
                    }
                }
            });
            const response = await this.sesClient.send(command);
            return {
                channel: NotificationChannel.EMAIL,
                success: true,
                messageId: response.MessageId,
                deliveredAt: new Date(),
                responseTime: Date.now() - startTime
            };
        }
        catch (error) {
            logger_1.logger.error('Email notification failed', error, { email, template });
            return {
                channel: NotificationChannel.EMAIL,
                success: false,
                error: {
                    code: 'EMAIL_FAILED',
                    message: error instanceof Error ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : 'Unknown email error',
                    details: error
                },
                responseTime: Date.now() - startTime
            };
        }
    }
    async sendInAppNotification(parentId, template) {
        const startTime = Date.now();
        try {
            await database_service_1.DatabaseService.client.notification.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    userId: parentId,
                    title: template.title,
                    body: template.body,
                    type: 'delivery_confirmation',
                    priority: 'high',
                    data: JSON.stringify(template.data || {}),
                    status: 'sent',
                    sentAt: new Date()
                }
            });
            this.emit('in_app_notification', {
                userId: parentId,
                title: template.title,
                body: template.body,
                data: template.data
            });
            return {
                channel: NotificationChannel.IN_APP,
                success: true,
                messageId: (0, uuid_1.v4)(),
                deliveredAt: new Date(),
                responseTime: Date.now() - startTime
            };
        }
        catch (error) {
            logger_1.logger.error('In-app notification failed', error, { parentId, template });
            return {
                channel: NotificationChannel.IN_APP,
                success: false,
                error: {
                    code: 'IN_APP_FAILED',
                    message: error instanceof Error ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : 'Unknown in-app error',
                    details: error
                },
                responseTime: Date.now() - startTime
            };
        }
    }
    async getParentContactInfo(parentId) {
        try {
            const parent = await database_service_1.DatabaseService.client.user.findUnique({
                where: { id: parentId },
                select: {
                    email: true,
                    phone: true,
                    preferences: true
                }
            });
            if (!parent) {
                return null;
            }
            const preferences = JSON.parse(parent.preferences || '{}');
            return {
                email: parent.email,
                phone: parent.phone || '',
                preferences: {
                    pushEnabled: preferences.pushNotifications !== false,
                    smsEnabled: preferences.smsNotifications === true,
                    emailEnabled: preferences.emailNotifications !== false,
                    whatsappEnabled: preferences.whatsappNotifications === true
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get parent contact info', error, { parentId });
            return null;
        }
    }
    async getParentDevices(parentId) {
        try {
            const devices = await database_service_1.DatabaseService.client.userDevice.findMany({
                where: {
                    userId: parentId,
                    isActive: true,
                    notificationsEnabled: true
                },
                select: {
                    deviceId: true,
                    deviceType: true,
                    fcmToken: true,
                    apnsToken: true,
                    isActive: true,
                    lastSeen: true
                }
            });
            return devices.map(device => ({
                deviceId: device.deviceId,
                deviceType: device.deviceType,
                fcmToken: device.fcmToken || undefined,
                apnsToken: device.apnsToken || undefined,
                isActive: device.isActive,
                lastSeen: device.lastSeen || new Date()
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get parent devices', error, { parentId });
            return [];
        }
    }
    createNotificationTemplates(payload) {
        const baseTitle = `🍽️ Meal Delivered!`;
        const baseBody = `${payload.studentName}'s meal has been delivered successfully at ${payload.readerLocation}.`;
        const detailedBody = `${payload.studentName}'s meal order #${payload.orderNumber} has been delivered successfully at ${payload.readerLocation} on ${payload.deliveryTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.`;
        const data = {
            type: 'delivery_confirmation',
            verificationId: payload.verificationId,
            studentId: payload.studentId,
            orderId: payload.orderId,
            deliveryTime: payload.deliveryTime.toISOString(),
            schoolId: payload.schoolId
        };
        return {
            push: {
                title: baseTitle,
                body: baseBody,
                icon: 'meal_delivered',
                sound: 'delivery_success',
                badge: 1,
                data
            },
            sms: {
                title: baseTitle,
                body: detailedBody,
                data
            },
            email: {
                title: `${baseTitle} - ${payload.studentName}`,
                body: `
          Dear Parent,

          ${detailedBody}

          School: ${payload.schoolName}
          Verification Method: RFID Card
          Card Number: ${payload.cardNumber}

          You can view more details about your child's meal orders in the HASIVU app.
        `,
                data
            },
            whatsapp: {
                title: baseTitle,
                body: detailedBody,
                data
            },
            inApp: {
                title: baseTitle,
                body: detailedBody,
                data: {
                    ...data,
                    mealDetails: payload.mealDetails,
                    readerName: payload.readerName
                }
            }
        };
    }
    async recordDeliveryAnalytics(payload, result) {
        try {
            const analyticsData = {
                verificationId: payload.verificationId,
                studentId: payload.studentId,
                parentId: payload.parentId,
                schoolId: payload.schoolId,
                notificationId: result.notificationId,
                channelsAttempted: result.deliveryResults.length,
                channelsSuccessful: result.deliveryResults.filter(r => r.success).length,
                averageResponseTime: result.averageResponseTime,
                targetMet: result.averageResponseTime < 2000,
                deliveredAt: new Date()
            };
            await cache_1.cache.setex(`delivery_analytics:${payload.verificationId}`, 86400, JSON.stringify(analyticsData));
            logger_1.logger.info('Delivery analytics recorded', analyticsData);
        }
        catch (error) {
            logger_1.logger.error('Failed to record delivery analytics', error, { payload, result });
        }
    }
    addToDeliveryHistory(notificationId, results) {
        this.deliveryHistory.set(notificationId, results);
        if (this.deliveryHistory.size > this.maxHistorySize) {
            const firstKey = this.deliveryHistory.keys().next().value;
            this.deliveryHistory.delete(firstKey);
        }
    }
    setupEventListeners() {
        this.on('notification_delivered', (event) => {
            logger_1.logger.info('Notification delivery event', {
                notificationId: event.notificationId,
                verificationId: event.payload.verificationId,
                duration: event.duration
            });
        });
        this.on('notification_failed', (event) => {
            logger_1.logger.error('Notification failure event', {
                notificationId: event.notificationId,
                error: event.error,
                duration: event.duration
            });
        });
    }
    getDeliveryHistory(notificationId) {
        return this.deliveryHistory.get(notificationId);
    }
    async getDeliveryStatistics(timeRange) {
        return {
            totalNotifications: 0,
            averageResponseTime: 0,
            successRate: 0,
            channelPerformance: {},
            targetComplianceRate: 0
        };
    }
}
exports.RealTimeDeliveryNotificationService = RealTimeDeliveryNotificationService;
exports.realTimeDeliveryNotificationService = RealTimeDeliveryNotificationService.getInstance();
//# sourceMappingURL=real-time-delivery.service.js.map