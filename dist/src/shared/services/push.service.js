"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushNotificationService = exports.PushNotificationService = exports.PushServiceError = void 0;
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
const logger_1 = require("@/utils/logger");
const environment_1 = require("@/config/environment");
class PushServiceError extends Error {
    code;
    retryable;
    details;
    constructor(message, code = 'PUSH_ERROR', retryable = false, details) {
        super(message);
        this.name = 'PushServiceError';
        this.code = code;
        this.retryable = retryable;
        this.details = details;
        Object.setPrototypeOf(this, PushServiceError.prototype);
    }
}
exports.PushServiceError = PushServiceError;
class PushNotificationService {
    static instance;
    app = null;
    messaging = null;
    deviceTokens = new Map();
    templates = new Map();
    rateLimitMap = new Map();
    maxRateLimit = 1000;
    retryConfig = {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000
    };
    constructor() {
        this.initializeFirebase();
        this.loadDefaultTemplates();
        setInterval(() => this.cleanupRateLimits(), 5 * 60 * 1000);
        setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000);
    }
    static getInstance() {
        if (!PushNotificationService.instance) {
            PushNotificationService.instance = new PushNotificationService();
        }
        return PushNotificationService.instance;
    }
    initializeFirebase() {
        try {
            const serviceAccount = {
                projectId: environment_1.config.firebase?.projectId || process.env.FIREBASE_PROJECT_ID || '',
                privateKey: environment_1.config.firebase?.privateKey?.replace(/\\n/g, '\n') || process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
                clientEmail: environment_1.config.firebase?.clientEmail || process.env.FIREBASE_CLIENT_EMAIL || ''
            };
            if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
                throw new PushServiceError('Firebase service account credentials are missing or incomplete', 'INVALID_CREDENTIALS');
            }
            try {
                this.app = (0, app_1.getApp)('push-service');
            }
            catch (error) {
                this.app = (0, app_1.initializeApp)({
                    credential: (0, app_1.cert)(serviceAccount),
                    projectId: serviceAccount.projectId
                }, 'push-service');
            }
            this.messaging = (0, messaging_1.getMessaging)(this.app);
            logger_1.logger.info('Push notification service initialized successfully', {
                projectId: serviceAccount.projectId,
                clientEmail: serviceAccount.clientEmail.split('@')[0] + '@***'
            });
        }
        catch (error) {
            logger_1.logger.error('Push notification service initialization failed', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                stack: error.stack
            });
            throw new PushServiceError(`Push notification service initialization failed: ${error instanceof Error ? error.message : String(error)}`, 'INIT_FAILED', false, error);
        }
    }
    loadDefaultTemplates() {
        const defaultTemplates = [
            {
                id: 'welcome',
                name: 'Welcome Message',
                title: 'Welcome to HASIVU!',
                body: 'Hi {userName}, welcome to HASIVU Platform! Get ready to learn and grow.',
                data: { type: 'welcome', action: 'open_app' },
                sound: 'default',
                badge: '1',
                category: 'onboarding',
                variables: ['userName'],
                defaultLanguage: 'en',
                translations: {
                    'hi': {
                        title: 'HASIVU में आपका स्वागत है!',
                        body: 'नमस्ते {userName}, HASIVU प्लेटफॉर्म में आपका स्वागत है! सीखने और बढ़ने के लिए तैयार हो जाइए।'
                    }
                }
            },
            {
                id: 'assignment_due',
                name: 'Assignment Due Reminder',
                title: 'Assignment Due Soon!',
                body: 'Hi {userName}, your assignment "{assignmentName}" is due in {timeRemaining}.',
                data: { type: 'assignment', action: 'view_assignment' },
                sound: 'default',
                badge: '1',
                category: 'academic',
                variables: ['userName', 'assignmentName', 'timeRemaining'],
                defaultLanguage: 'en',
                translations: {
                    'hi': {
                        title: 'असाइनमेंट जल्दी जमा करें!',
                        body: 'नमस्ते {userName}, आपका असाइनमेंट "{assignmentName}" {timeRemaining} में जमा करना है।'
                    }
                }
            },
            {
                id: 'class_reminder',
                name: 'Class Reminder',
                title: 'Class Starting Soon!',
                body: '{className} starts in {timeRemaining}. Join now to not miss out!',
                data: { type: 'class', action: 'join_class' },
                sound: 'default',
                badge: '1',
                category: 'schedule',
                variables: ['className', 'timeRemaining'],
                defaultLanguage: 'en',
                translations: {
                    'hi': {
                        title: 'कक्षा जल्दी शुरू होगी!',
                        body: '{className} {timeRemaining} में शुरू होगी। अभी जुड़ें ताकि छूटे नहीं!'
                    }
                }
            },
            {
                id: 'achievement_unlocked',
                name: 'Achievement Unlocked',
                title: 'Achievement Unlocked! 🎉',
                body: 'Congratulations {userName}! You\'ve unlocked "{achievementName}". Keep up the great work!',
                data: { type: 'achievement', action: 'view_achievements' },
                sound: 'achievement',
                badge: '1',
                category: 'gamification',
                variables: ['userName', 'achievementName'],
                defaultLanguage: 'en',
                translations: {
                    'hi': {
                        title: 'उपलब्धि हासिल की! 🎉',
                        body: 'बधाई हो {userName}! आपने "{achievementName}" हासिल किया है। बेहतरीन काम जारी रखें!'
                    }
                }
            }
        ];
        for (const template of defaultTemplates) {
            this.templates.set(template.id, template);
        }
        logger_1.logger.info('Default push notification templates loaded', {
            templateCount: defaultTemplates.length
        });
    }
    registerDeviceToken(registration) {
        try {
            if (!registration.deviceToken || registration.deviceToken.length < 10) {
                throw new PushServiceError('Invalid device token format', 'INVALID_TOKEN');
            }
            this.deviceTokens.set(registration.deviceToken, {
                ...registration,
                lastActive: Date.now()
            });
            logger_1.logger.info('Device token registered', {
                userId: registration.userId,
                platform: registration.platform,
                deviceId: registration.deviceId,
                tokenLength: registration.deviceToken.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to register device token', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                userId: registration.userId,
                platform: registration.platform
            });
            throw error;
        }
    }
    unregisterDeviceToken(deviceToken) {
        if (this.deviceTokens.has(deviceToken)) {
            const registration = this.deviceTokens.get(deviceToken);
            this.deviceTokens.delete(deviceToken);
            logger_1.logger.info('Device token unregistered', {
                userId: registration.userId,
                platform: registration.platform,
                deviceId: registration.deviceId
            });
        }
    }
    getUserDeviceTokens(userId) {
        const tokens = [];
        for (const [token, registration] of this.deviceTokens.entries()) {
            if (registration.userId === userId) {
                tokens.push(token);
            }
        }
        return tokens;
    }
    async sendToDevice(deviceToken, payload) {
        try {
            if (!this.messaging) {
                throw new PushServiceError('Push notification service not initialized', 'NOT_INITIALIZED');
            }
            if (this.isRateLimited(deviceToken)) {
                throw new PushServiceError('Rate limit exceeded', 'RATE_LIMITED', true);
            }
            const message = {
                token: deviceToken,
                notification: {
                    title: payload.title,
                    body: payload.body,
                    imageUrl: payload.image
                },
                data: payload.data || {},
                android: {
                    notification: {
                        icon: payload.icon || 'ic_notification',
                        color: '#FF6B35',
                        sound: payload.sound || 'default',
                        tag: payload.tag,
                        clickAction: payload.clickAction
                    },
                    priority: 'high',
                    ttl: 24 * 60 * 60 * 1000
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: payload.title,
                                body: payload.body
                            },
                            sound: payload.sound || 'default',
                            badge: parseInt(payload.badge || '0', 10) || undefined
                        }
                    },
                    headers: {
                        'apns-priority': '10',
                        'apns-expiration': String(Math.floor(Date.now() / 1000) + (24 * 60 * 60))
                    }
                },
                webpush: {
                    notification: {
                        title: payload.title,
                        body: payload.body,
                        icon: payload.icon || '/icons/icon-192x192.png',
                        badge: payload.badge || '/icons/badge-72x72.png',
                        image: payload.image,
                        tag: payload.tag,
                        requireInteraction: true
                    },
                    fcmOptions: {
                        link: payload.clickAction || environment_1.config.server?.baseUrl || 'https://hasivu.com'
                    }
                }
            };
            const response = await this.messaging.send(message);
            this.updateRateLimit(deviceToken);
            logger_1.logger.info('Push notification sent successfully', {
                deviceToken: deviceToken.substring(0, 20) + '...',
                messageId: response,
                title: payload.title
            });
            return {
                messageId: response,
                success: true,
                deviceToken,
                timestamp: Date.now()
            };
        }
        catch (error) {
            const isRetryable = this.isRetryableError(error);
            logger_1.logger.warn('Push notification failed', {
                deviceToken: deviceToken.substring(0, 20) + '...',
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                errorCode: error.code,
                retryable: isRetryable
            });
            if (error.code === 'messaging/registration-token-not-registered' ||
                error.code === 'messaging/invalid-registration-token') {
                this.unregisterDeviceToken(deviceToken);
            }
            return {
                success: false,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                deviceToken,
                timestamp: Date.now(),
                retryable: isRetryable
            };
        }
    }
    async sendToMultipleDevices(request) {
        try {
            if (!this.messaging) {
                throw new PushServiceError('Push notification service not initialized', 'NOT_INITIALIZED');
            }
            if (request.deviceTokens.length === 0) {
                throw new PushServiceError('No device tokens provided', 'EMPTY_TOKENS');
            }
            if (request.deviceTokens.length > 500) {
                throw new PushServiceError('Too many device tokens (max 500)', 'TOO_MANY_TOKENS');
            }
            let payload = request.payload;
            if (request.templateId) {
                payload = await this.applyTemplate(request.templateId, request.templateVariables || {});
            }
            const message = {
                tokens: request.deviceTokens,
                notification: {
                    title: payload.title,
                    body: payload.body,
                    imageUrl: payload.image
                },
                data: payload.data || {},
                android: {
                    notification: {
                        icon: payload.icon || 'ic_notification',
                        color: '#FF6B35',
                        sound: payload.sound || 'default',
                        tag: payload.tag,
                        clickAction: payload.clickAction
                    },
                    priority: request.priority === 'high' ? 'high' : 'normal',
                    ttl: (request.ttl || 24 * 60 * 60) * 1000
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: payload.title,
                                body: payload.body
                            },
                            sound: payload.sound || 'default',
                            badge: parseInt(payload.badge || '0', 10) || undefined
                        }
                    },
                    headers: {
                        'apns-priority': request.priority === 'high' ? '10' : '5',
                        'apns-expiration': String(Math.floor(Date.now() / 1000) + (request.ttl || 24 * 60 * 60))
                    }
                }
            };
            const response = await this.messaging.sendEachForMulticast(message);
            const results = [];
            const invalidTokens = [];
            const retryableTokens = [];
            response.responses.forEach((result, index) => {
                const deviceToken = request.deviceTokens[index];
                if (result.success) {
                    results.push({
                        messageId: result.messageId,
                        success: true,
                        deviceToken,
                        timestamp: Date.now()
                    });
                }
                else {
                    const isRetryable = this.isRetryableError(result.error);
                    results.push({
                        success: false,
                        error: result.error?.message,
                        deviceToken,
                        timestamp: Date.now(),
                        retryable: isRetryable
                    });
                    if (isRetryable) {
                        retryableTokens.push(deviceToken);
                    }
                    else {
                        invalidTokens.push(deviceToken);
                        this.unregisterDeviceToken(deviceToken);
                    }
                }
            });
            logger_1.logger.info('Batch push notification completed', {
                totalSent: request.deviceTokens.length,
                successCount: response.successCount,
                failureCount: response.failureCount,
                invalidTokens: invalidTokens.length,
                retryableTokens: retryableTokens.length
            });
            return {
                successCount: response.successCount,
                failureCount: response.failureCount,
                results,
                invalidTokens,
                retryableTokens
            };
        }
        catch (error) {
            logger_1.logger.error('Batch push notification failed', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                tokenCount: request.deviceTokens.length,
                templateId: request.templateId
            });
            throw new PushServiceError(`Batch push notification failed: ${error instanceof Error ? error.message : String(error)}`, 'BATCH_SEND_FAILED', true, error);
        }
    }
    async sendToTopic(request) {
        try {
            if (!this.messaging) {
                throw new PushServiceError('Push notification service not initialized', 'NOT_INITIALIZED');
            }
            let payload = request.payload;
            if (request.templateId) {
                payload = await this.applyTemplate(request.templateId, request.templateVariables || {});
            }
            const message = {
                topic: request.topic,
                notification: {
                    title: payload.title,
                    body: payload.body,
                    imageUrl: payload.image
                },
                data: payload.data || {},
                ...(request.condition && { condition: request.condition }),
                android: {
                    notification: {
                        icon: payload.icon || 'ic_notification',
                        color: '#FF6B35',
                        sound: payload.sound || 'default',
                        tag: payload.tag,
                        clickAction: payload.clickAction
                    },
                    priority: request.priority === 'high' ? 'high' : 'normal',
                    ttl: 24 * 60 * 60 * 1000
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: payload.title,
                                body: payload.body
                            },
                            sound: payload.sound || 'default'
                        }
                    },
                    headers: {
                        'apns-priority': request.priority === 'high' ? '10' : '5'
                    }
                }
            };
            const response = await this.messaging.send(message);
            logger_1.logger.info('Topic push notification sent', {
                topic: request.topic,
                condition: request.condition,
                messageId: response,
                title: payload.title
            });
            return {
                messageId: response,
                success: true,
                timestamp: Date.now()
            };
        }
        catch (error) {
            logger_1.logger.error('Topic push notification failed', {
                topic: request.topic,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                errorCode: error.code
            });
            throw new PushServiceError(`Topic push notification failed: ${error instanceof Error ? error.message : String(error)}`, 'TOPIC_SEND_FAILED', this.isRetryableError(error), error);
        }
    }
    async subscribeToTopic(deviceTokens, topic) {
        try {
            if (!this.messaging) {
                throw new PushServiceError('Push notification service not initialized', 'NOT_INITIALIZED');
            }
            if (deviceTokens.length === 0) {
                throw new PushServiceError('No device tokens provided', 'EMPTY_TOKENS');
            }
            if (deviceTokens.length > 1000) {
                throw new PushServiceError('Too many device tokens (max 1000)', 'TOO_MANY_TOKENS');
            }
            await this.messaging.subscribeToTopic(deviceTokens, topic);
            logger_1.logger.info('Devices subscribed to topic', {
                topic,
                deviceCount: deviceTokens.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to subscribe devices to topic', {
                topic,
                deviceCount: deviceTokens.length,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            });
            throw new PushServiceError(`Failed to subscribe to topic: ${error instanceof Error ? error.message : String(error)}`, 'TOPIC_SUBSCRIBE_FAILED', true, error);
        }
    }
    async unsubscribeFromTopic(deviceTokens, topic) {
        try {
            if (!this.messaging) {
                throw new PushServiceError('Push notification service not initialized', 'NOT_INITIALIZED');
            }
            await this.messaging.unsubscribeFromTopic(deviceTokens, topic);
            logger_1.logger.info('Devices unsubscribed from topic', {
                topic,
                deviceCount: deviceTokens.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to unsubscribe devices from topic', {
                topic,
                deviceCount: deviceTokens.length,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            });
            throw new PushServiceError(`Failed to unsubscribe from topic: ${error instanceof Error ? error.message : String(error)}`, 'TOPIC_UNSUBSCRIBE_FAILED', true, error);
        }
    }
    async applyTemplate(templateId, variables) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new PushServiceError(`Template not found: ${templateId}`, 'TEMPLATE_NOT_FOUND');
        }
        let title = template.title;
        let body = template.body;
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{${key}}`;
            title = title.replace(new RegExp(placeholder, 'g'), value);
            body = body.replace(new RegExp(placeholder, 'g'), value);
        }
        return {
            title,
            body,
            data: template.data,
            image: template.image,
            sound: template.sound,
            badge: template.badge
        };
    }
    isRetryableError(error) {
        if (!error || !error.code)
            return false;
        const retryableCodes = [
            'messaging/internal-error',
            'messaging/server-unavailable',
            'messaging/timeout',
            'messaging/quota-exceeded',
            'messaging/throttled'
        ];
        return retryableCodes.includes(error.code);
    }
    isRateLimited(deviceToken) {
        const now = Date.now();
        const windowStart = now - 60000;
        const timestamps = this.rateLimitMap.get(deviceToken) || [];
        const recentRequests = timestamps.filter(time => time > windowStart);
        return recentRequests.length >= this.maxRateLimit;
    }
    updateRateLimit(deviceToken) {
        const now = Date.now();
        const windowStart = now - 60000;
        const timestamps = this.rateLimitMap.get(deviceToken) || [];
        const recentRequests = timestamps.filter(time => time > windowStart);
        recentRequests.push(now);
        this.rateLimitMap.set(deviceToken, recentRequests);
    }
    cleanupRateLimits() {
        const now = Date.now();
        const windowStart = now - 60000;
        let cleanedCount = 0;
        for (const [deviceToken, timestamps] of this.rateLimitMap.entries()) {
            const recentRequests = timestamps.filter(time => time > windowStart);
            if (recentRequests.length === 0) {
                this.rateLimitMap.delete(deviceToken);
                cleanedCount++;
            }
            else {
                this.rateLimitMap.set(deviceToken, recentRequests);
            }
        }
        if (cleanedCount > 0) {
            logger_1.logger.debug('Rate limit cleanup completed', { entriesRemoved: cleanedCount });
        }
    }
    cleanupExpiredTokens() {
        const now = Date.now();
        const expiryTime = 30 * 24 * 60 * 60 * 1000;
        let removedCount = 0;
        for (const [token, registration] of this.deviceTokens.entries()) {
            if (now - registration.lastActive > expiryTime) {
                this.deviceTokens.delete(token);
                removedCount++;
            }
        }
        if (removedCount > 0) {
            logger_1.logger.info('Device token cleanup completed', { tokensRemoved: removedCount });
        }
    }
    addTemplate(template) {
        this.templates.set(template.id, template);
        logger_1.logger.info('Push notification template added', { templateId: template.id, templateName: template.name });
    }
    getTemplates() {
        return Array.from(this.templates.values());
    }
    getTemplate(templateId) {
        return this.templates.get(templateId);
    }
    getStatistics() {
        const devicesByPlatform = {};
        for (const registration of this.deviceTokens.values()) {
            devicesByPlatform[registration.platform] = (devicesByPlatform[registration.platform] || 0) + 1;
        }
        return {
            registeredDevices: this.deviceTokens.size,
            activeTemplates: this.templates.size,
            rateLimitEntries: this.rateLimitMap.size,
            devicesByPlatform
        };
    }
    healthCheck() {
        try {
            return {
                status: 'healthy',
                timestamp: Date.now(),
                configuration: {
                    firebaseInitialized: !!this.app,
                    messagingConfigured: !!this.messaging,
                    templatesLoaded: this.templates.size,
                    registeredDevices: this.deviceTokens.size
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                timestamp: Date.now(),
                configuration: {
                    firebaseInitialized: false,
                    messagingConfigured: false,
                    templatesLoaded: 0,
                    registeredDevices: 0
                },
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            };
        }
    }
}
exports.PushNotificationService = PushNotificationService;
exports.pushNotificationService = PushNotificationService.getInstance();
//# sourceMappingURL=push.service.js.map