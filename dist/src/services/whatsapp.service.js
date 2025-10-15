"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const axios_1 = __importDefault(require("axios"));
const database_service_1 = require("./database.service");
const redis_service_1 = require("./redis.service");
const logger_1 = require("@/utils/logger");
const environment_1 = require("@/config/environment");
const crypto = __importStar(require("crypto"));
class WhatsAppService {
    static instance;
    client;
    prisma;
    redisService;
    accessToken;
    phoneNumberId;
    businessAccountId;
    rateLimitKey = 'whatsapp:rate_limit';
    messageQueue = 'whatsapp:message_queue';
    constructor() {
        this.accessToken = environment_1.config.whatsapp.accessToken;
        this.phoneNumberId = environment_1.config.whatsapp.phoneNumberId;
        this.businessAccountId = environment_1.config.whatsapp.businessAccountId;
        this.prisma = typeof database_service_1.DatabaseService.getInstance === 'function' && typeof database_service_1.DatabaseService.getInstance().getPrismaClient === 'function'
            ? database_service_1.DatabaseService.getInstance().getPrismaClient()
            : database_service_1.DatabaseService.client;
        this.redisService = redis_service_1.RedisService;
        this.client = axios_1.default.create({
            baseURL: `https://graph.facebook.com/v${environment_1.config.whatsapp.apiVersion || '18.0'}`,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        this.setupInterceptors();
    }
    static getInstance() {
        if (!WhatsAppService.instance) {
            WhatsAppService.instance = new WhatsAppService();
        }
        return WhatsAppService.instance;
    }
    setupInterceptors() {
        this.client.interceptors.request.use(async (config) => {
            await this.checkRateLimit();
            logger_1.logger.debug('WhatsApp API request', {
                url: config.url,
                method: config.method,
                headers: { ...config.headers, Authorization: '[REDACTED]' }
            });
            return config;
        }, (error) => {
            logger_1.logger.error('WhatsApp API request error', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => {
            logger_1.logger.debug('WhatsApp API response', {
                status: response.status,
                data: response.data
            });
            return response;
        }, (error) => {
            logger_1.logger.error('WhatsApp API response error', {
                status: error.response?.status,
                data: error.response?.data,
                message: error instanceof Error ? error.message : String(error)
            });
            return Promise.reject(error);
        });
    }
    async checkRateLimit() {
        const currentCount = await this.redisService.get(this.rateLimitKey);
        const limit = environment_1.config.whatsapp.rateLimitPerMinute || 1000;
        if (currentCount && parseInt(currentCount) >= limit) {
            throw new Error('WhatsApp API rate limit exceeded. Please try again later.');
        }
        await this.redisService.incr(this.rateLimitKey);
        await this.redisService.expire(this.rateLimitKey, 60);
    }
    async sendMessage(to, type, content, options = {}) {
        try {
            const normalizedTo = this.normalizePhoneNumber(to);
            const messageRequest = {
                messaging_product: 'whatsapp',
                to: normalizedTo,
                type,
                ...this.buildMessageContent(type, content, options)
            };
            if (options.context?.messageId) {
                messageRequest.context = {
                    message_id: options.context.messageId
                };
            }
            logger_1.logger.info('Sending WhatsApp message', {
                to: normalizedTo,
                type,
                hasTemplate: !!options.template
            });
            const response = await this.client.post(`/${this.phoneNumberId}/messages`, messageRequest);
            const apiResponse = response.data;
            const messageId = apiResponse.messages[0]?.id;
            if (!messageId) {
                throw new Error('No message ID returned from WhatsApp API');
            }
            const message = {
                id: messageId,
                to: normalizedTo,
                type,
                status: 'sent',
                template: options.template,
                content: type === 'text' ? content.body : JSON.stringify(content),
                timestamp: new Date(),
                retryCount: 0,
                businessData: options.businessData,
                context: options.context
            };
            await this.storeMessage(message);
            await this.queueMessageForTracking(messageId);
            logger_1.logger.info('WhatsApp message sent successfully', {
                messageId,
                to: normalizedTo,
                type
            });
            return message;
        }
        catch (error) {
            logger_1.logger.error('Failed to send WhatsApp message', {
                to,
                type,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            const failedMessage = {
                id: `failed_${Date.now()}_${Math.random()}`,
                to: this.normalizePhoneNumber(to),
                type,
                status: 'failed',
                template: options.template,
                content: type === 'text' ? content.body : JSON.stringify(content),
                timestamp: new Date(),
                retryCount: 0,
                errorMessage: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                businessData: options.businessData,
                context: options.context
            };
            await this.storeMessage(failedMessage);
            throw error;
        }
    }
    async sendTextMessage(to, text, options = {}) {
        return this.sendMessage(to, 'text', {
            body: text,
            preview_url: options.previewUrl || false
        }, options);
    }
    async sendTemplateMessage(to, template, businessData) {
        return this.sendMessage(to, 'template', null, {
            template,
            businessData
        });
    }
    async sendMediaMessage(to, mediaType, mediaUrl, options = {}) {
        const mediaContent = {
            link: mediaUrl
        };
        if (options.caption) {
            mediaContent.caption = options.caption;
        }
        if (options.filename && mediaType === 'document') {
            mediaContent.filename = options.filename;
        }
        return this.sendMessage(to, 'media', { [mediaType]: mediaContent });
    }
    async sendInteractiveMessage(to, body, buttons, options = {}) {
        const interactive = {
            type: 'button',
            body: { text: body },
            action: {
                buttons: buttons.map(button => ({
                    type: 'reply',
                    reply: {
                        id: button.id,
                        title: button.title
                    }
                }))
            }
        };
        if (options.header) {
            interactive.header = {
                type: 'text',
                text: options.header
            };
        }
        if (options.footer) {
            interactive.footer = {
                text: options.footer
            };
        }
        return this.sendMessage(to, 'interactive', interactive);
    }
    buildMessageContent(type, content, options) {
        switch (type) {
            case 'text':
                return { text: content };
            case 'template':
                return { template: options.template };
            case 'media':
                return content;
            case 'interactive':
                return { interactive: content };
            case 'location':
                return { location: content };
            default:
                throw new Error(`Unsupported message type: ${type}`);
        }
    }
    normalizePhoneNumber(phoneNumber) {
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length === 10) {
            return `91${digits}`;
        }
        return digits;
    }
    async storeMessage(message) {
        try {
            await this.prisma.whatsAppMessage.create({
                data: {
                    id: message.id,
                    to: message.to,
                    type: message.type,
                    status: message.status,
                    template: message.template ? JSON.stringify(message.template) : null,
                    content: message.content,
                    mediaUrl: message.mediaUrl,
                    timestamp: message.timestamp,
                    deliveredAt: message.deliveredAt,
                    readAt: message.readAt,
                    errorMessage: message.errorMessage,
                    retryCount: message.retryCount,
                    businessData: message.businessData ? JSON.stringify(message.businessData) : null,
                    context: message.context ? JSON.stringify(message.context) : null
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to store WhatsApp message', {
                messageId: message.id,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async queueMessageForTracking(messageId) {
        try {
            if (typeof this.redisService.lpush === 'function') {
                await this.redisService.lpush(this.messageQueue, messageId);
            }
            else {
                logger_1.logger.debug('Redis lpush method not available, skipping message queue');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to queue message for tracking', {
                messageId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async handleWebhook(event) {
        try {
            logger_1.logger.info('Processing WhatsApp webhook event', {
                entries: event.entry.length
            });
            for (const entry of event.entry) {
                for (const change of entry.changes) {
                    if (change.field === 'messages') {
                        await this.processMessageChanges(change.value);
                    }
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to process WhatsApp webhook', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
    async processMessageChanges(value) {
        if (value.statuses) {
            for (const status of value.statuses) {
                await this.updateMessageStatus(status.id, status.status, {
                    timestamp: new Date(parseInt(status.timestamp) * 1000),
                    conversation: status.conversation,
                    pricing: status.pricing,
                    errors: status.errors
                });
            }
        }
        if (value.messages) {
            for (const message of value.messages) {
                await this.processIncomingMessage(message, value.contacts);
            }
        }
    }
    async updateMessageStatus(messageId, status, metadata) {
        try {
            const updateData = { status };
            if (status === 'delivered') {
                updateData.deliveredAt = metadata.timestamp;
            }
            else if (status === 'read') {
                updateData.readAt = metadata.timestamp;
            }
            else if (status === 'failed' && metadata.errors) {
                updateData.errorMessage = metadata.errors.map((e) => e.title).join(', ');
            }
            await this.prisma.whatsAppMessage.update({
                where: { id: messageId },
                data: updateData
            });
            logger_1.logger.debug('Updated message status', {
                messageId,
                status,
                timestamp: metadata.timestamp
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update message status', {
                messageId,
                status,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async processIncomingMessage(message, contacts) {
        try {
            const contact = contacts?.find(c => c.wa_id === message.from);
            logger_1.logger.info('Received incoming WhatsApp message', {
                messageId: message.id,
                from: message.from,
                type: message.type,
                contactName: contact?.profile?.name
            });
            await this.prisma.whatsAppIncomingMessage.create({
                data: {
                    id: message.id,
                    from: message.from,
                    type: message.type,
                    content: message.text?.body || JSON.stringify(message),
                    timestamp: new Date(parseInt(message.timestamp) * 1000),
                    contactName: contact?.profile?.name,
                    context: message.context ? JSON.stringify(message.context) : null
                }
            });
            await this.triggerAutomatedResponse(message, contact);
        }
        catch (error) {
            logger_1.logger.error('Failed to process incoming message', {
                messageId: message.id,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async triggerAutomatedResponse(message, contact) {
        if (message.text?.body?.toLowerCase().includes('help')) {
            await this.sendTextMessage(message.from, 'Thank you for contacting HASIVU. How can we help you today?');
        }
    }
    async getMessageTemplates() {
        try {
            const response = await this.client.get(`/${this.businessAccountId}/message_templates`);
            return response.data.data || [];
        }
        catch (error) {
            logger_1.logger.error('Failed to get message templates', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
            throw error;
        }
    }
    async getDeliveryMetrics(startDate, endDate) {
        try {
            const messages = await this.prisma.whatsAppMessage.findMany({
                where: {
                    timestamp: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            const totalSent = messages.length;
            const totalDelivered = messages.filter((m) => m.status === 'delivered' || m.status === 'read').length;
            const totalRead = messages.filter((m) => m.status === 'read').length;
            const totalFailed = messages.filter((m) => m.status === 'failed').length;
            const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
            const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;
            const deliveredMessages = messages.filter((m) => m.deliveredAt);
            const averageDeliveryTime = deliveredMessages.length > 0
                ? deliveredMessages.reduce((sum, m) => sum + (m.deliveredAt.getTime() - m.timestamp.getTime()), 0) / deliveredMessages.length
                : 0;
            const failureReasons = {};
            messages.filter((m) => m.status === 'failed' && m.errorMessage).forEach((m) => {
                const reason = m.errorMessage;
                failureReasons[reason] = (failureReasons[reason] || 0) + 1;
            });
            return {
                totalSent,
                totalDelivered,
                totalRead,
                totalFailed,
                deliveryRate: Math.round(deliveryRate * 100) / 100,
                readRate: Math.round(readRate * 100) / 100,
                averageDeliveryTime: Math.round(averageDeliveryTime),
                failureReasons
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get delivery metrics', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
            throw error;
        }
    }
    verifyWebhookSignature(body, signature) {
        try {
            const expectedSignature = crypto
                .createHmac('sha256', environment_1.config.whatsapp.webhookVerifyToken)
                .update(body)
                .digest('hex');
            return `sha256=${expectedSignature}` === signature;
        }
        catch (error) {
            logger_1.logger.error('Failed to verify webhook signature', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
            return false;
        }
    }
    handleWebhookVerification(mode, token, challenge) {
        if (mode === 'subscribe' && token === environment_1.config.whatsapp.webhookVerifyToken) {
            logger_1.logger.info('WhatsApp webhook verified successfully');
            return challenge;
        }
        logger_1.logger.warn('WhatsApp webhook verification failed', { mode, token });
        return null;
    }
    getConfiguration() {
        return {
            accessToken: '[REDACTED]',
            phoneNumberId: this.phoneNumberId,
            businessAccountId: this.businessAccountId,
            webhookVerifyToken: '[REDACTED]',
            webhookUrl: `${environment_1.config.server.baseUrl}/api/v1/webhooks/whatsapp`,
            apiVersion: environment_1.config.whatsapp.apiVersion || '18.0',
            baseUrl: `https://graph.facebook.com/v${environment_1.config.whatsapp.apiVersion || '18.0'}`,
            retryCount: environment_1.config.whatsapp.retryCount || 3,
            retryDelay: environment_1.config.whatsapp.retryDelay || 1000,
            rateLimitPerMinute: environment_1.config.whatsapp.rateLimitPerMinute || 1000
        };
    }
}
exports.WhatsAppService = WhatsAppService;
exports.default = WhatsAppService;
//# sourceMappingURL=whatsapp.service.js.map