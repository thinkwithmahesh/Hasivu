"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = exports.WhatsAppService = exports.WhatsAppServiceError = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const logger = {
    info: (message, data) => console.log(message, data),
    warn: (message, data) => console.warn(message, data),
    error: (message, data) => console.error(message, data),
    debug: (message, data) => console.debug(message, data)
};
const environment_1 = require("../../config/environment");
class WhatsAppServiceError extends Error {
    code;
    statusCode;
    whatsappCode;
    constructor(message, code = 'WHATSAPP_ERROR', statusCode = 500, whatsappCode) {
        super(message);
        this.name = 'WhatsAppServiceError';
        this.code = code;
        this.statusCode = statusCode;
        this.whatsappCode = whatsappCode;
        Object.setPrototypeOf(this, WhatsAppServiceError.prototype);
    }
}
exports.WhatsAppServiceError = WhatsAppServiceError;
class WhatsAppService {
    static instance;
    client;
    phoneNumberId;
    accessToken;
    webhookVerifyToken;
    apiVersion = 'v18.0';
    baseUrl;
    templateCache = new Map();
    templateCacheExpiry = new Map();
    templateCacheDuration = 3600000;
    constructor() {
        this.phoneNumberId = environment_1.config.whatsapp.phoneNumberId;
        this.accessToken = environment_1.config.whatsapp.accessToken;
        this.webhookVerifyToken = environment_1.config.whatsapp.webhookVerifyToken;
        this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
        if (!this.phoneNumberId || !this.accessToken) {
            throw new WhatsAppServiceError('WhatsApp configuration missing: phoneNumberId and accessToken required', 'MISSING_CONFIG', 500);
        }
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        this.client.interceptors.request.use((config) => {
            logger.info('WhatsApp API Request', {
                method: config.method?.toUpperCase(),
                url: config.url,
                headers: {
                    ...config.headers,
                    Authorization: '[REDACTED]'
                }
            });
            return config;
        }, (error) => {
            logger.error('WhatsApp API Request Error', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => {
            logger.info('WhatsApp API Response', {
                status: response.status,
                url: response.config.url,
                messageId: response.data?.messages?.[0]?.id
            });
            return response;
        }, (error) => {
            logger.error('WhatsApp API Error', {
                status: error.response?.status,
                url: error.config?.url,
                error: error.response?.data
            });
            return Promise.reject(error);
        });
        logger.info('WhatsApp service initialized', {
            phoneNumberId: this.phoneNumberId,
            apiVersion: this.apiVersion,
            baseUrl: this.baseUrl
        });
    }
    static getInstance() {
        if (!WhatsAppService.instance) {
            WhatsAppService.instance = new WhatsAppService();
        }
        return WhatsAppService.instance;
    }
    async sendTextMessage(to, text, previewUrl = false, contextMessageId) {
        try {
            const message = {
                messaging_product: 'whatsapp',
                to,
                type: 'text',
                text: {
                    preview_url: previewUrl,
                    body: text
                }
            };
            if (contextMessageId) {
                message.context = { message_id: contextMessageId };
            }
            const response = await this.client.post(`/${this.phoneNumberId}/messages`, message);
            logger.info('Text message sent successfully', {
                to,
                messageId: response.data.messages[0].id,
                textLength: text.length
            });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error, 'Failed to send text message');
        }
    }
    async sendTemplateMessage(to, templateName, languageCode = 'en_US', components) {
        try {
            const message = {
                messaging_product: 'whatsapp',
                to,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: languageCode },
                    components
                }
            };
            const response = await this.client.post(`/${this.phoneNumberId}/messages`, message);
            logger.info('Template message sent successfully', {
                to,
                templateName,
                languageCode,
                messageId: response.data.messages[0].id
            });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error, 'Failed to send template message');
        }
    }
    async sendMediaMessage(to, mediaType, media, caption, contextMessageId) {
        try {
            const message = {
                messaging_product: 'whatsapp',
                to,
                type: mediaType
            };
            const mediaObject = { ...media };
            if (caption && (mediaType === 'image' || mediaType === 'video' || mediaType === 'document')) {
                mediaObject.caption = caption;
            }
            message[mediaType] = mediaObject;
            if (contextMessageId) {
                message.context = { message_id: contextMessageId };
            }
            const response = await this.client.post(`/${this.phoneNumberId}/messages`, message);
            logger.info('Media message sent successfully', {
                to,
                mediaType,
                messageId: response.data.messages[0].id,
                mediaId: media.id,
                mediaLink: media.link
            });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error, 'Failed to send media message');
        }
    }
    async sendInteractiveMessage(to, interactive, contextMessageId) {
        try {
            const message = {
                messaging_product: 'whatsapp',
                to,
                type: 'interactive',
                interactive
            };
            if (contextMessageId) {
                message.context = { message_id: contextMessageId };
            }
            const response = await this.client.post(`/${this.phoneNumberId}/messages`, message);
            logger.info('Interactive message sent successfully', {
                to,
                interactiveType: interactive.type,
                messageId: response.data.messages[0].id,
                buttonsCount: interactive.action.buttons?.length || 0,
                sectionsCount: interactive.action.sections?.length || 0
            });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error, 'Failed to send interactive message');
        }
    }
    async sendLocationMessage(to, location, contextMessageId) {
        try {
            const message = {
                messaging_product: 'whatsapp',
                to,
                type: 'location',
                location
            };
            if (contextMessageId) {
                message.context = { message_id: contextMessageId };
            }
            const response = await this.client.post(`/${this.phoneNumberId}/messages`, message);
            logger.info('Location message sent successfully', {
                to,
                messageId: response.data.messages[0].id,
                latitude: location.latitude,
                longitude: location.longitude
            });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error, 'Failed to send location message');
        }
    }
    async sendContactMessage(to, contacts, contextMessageId) {
        try {
            const message = {
                messaging_product: 'whatsapp',
                to,
                type: 'contacts',
                contacts
            };
            if (contextMessageId) {
                message.context = { message_id: contextMessageId };
            }
            const response = await this.client.post(`/${this.phoneNumberId}/messages`, message);
            logger.info('Contact message sent successfully', {
                to,
                messageId: response.data.messages[0].id,
                contactsCount: contacts.length
            });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error, 'Failed to send contact message');
        }
    }
    async uploadMedia(file, mimeType, filename) {
        try {
            const formData = new FormData();
            formData.append('file', new Blob([file], { type: mimeType }), filename);
            formData.append('type', mimeType);
            formData.append('messaging_product', 'whatsapp');
            const response = await this.client.post(`/${this.phoneNumberId}/media`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            logger.info('Media uploaded successfully', {
                mediaId: response.data.id,
                mimeType,
                filename
            });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error, 'Failed to upload media');
        }
    }
    async getMediaUrl(mediaId) {
        try {
            const response = await this.client.get(`/${mediaId}`);
            logger.info('Media URL retrieved successfully', {
                mediaId,
                url: response.data.url,
                mimeType: response.data.mime_type
            });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error, 'Failed to get media URL');
        }
    }
    async downloadMedia(mediaUrl) {
        try {
            const response = await this.client.get(mediaUrl, {
                responseType: 'arraybuffer'
            });
            const buffer = Buffer.from(response.data);
            logger.info('Media downloaded successfully', {
                mediaUrl,
                size: buffer.length
            });
            return buffer;
        }
        catch (error) {
            throw this.handleError(error, 'Failed to download media');
        }
    }
    verifyWebhookSignature(payload, signature) {
        try {
            const expectedSignature = crypto_1.default
                .createHmac('sha256', environment_1.config.whatsapp.webhookSecret || '')
                .update(payload, 'utf8')
                .digest('hex');
            const receivedSignature = signature.replace('sha256=', '');
            const isValid = crypto_1.default.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(receivedSignature, 'hex'));
            logger.info('Webhook signature verification', {
                isValid,
                signatureLength: receivedSignature.length
            });
            return isValid;
        }
        catch (error) {
            logger.error('Webhook signature verification failed', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            });
            return false;
        }
    }
    processWebhookEvent(event) {
        const messages = [];
        const statuses = [];
        try {
            for (const entry of event.entry) {
                for (const change of entry.changes) {
                    if (change.field === 'messages') {
                        if (change.value.messages) {
                            messages.push(...change.value.messages);
                        }
                        if (change.value.statuses) {
                            statuses.push(...change.value.statuses);
                        }
                    }
                }
            }
            logger.info('Webhook event processed', {
                messagesCount: messages.length,
                statusesCount: statuses.length
            });
            return { messages, statuses };
        }
        catch (error) {
            logger.error('Failed to process webhook event', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            });
            return { messages: [], statuses: [] };
        }
    }
    async getMessageTemplates(limit = 100) {
        try {
            const cacheKey = `templates_${limit}`;
            const cached = this.templateCache.get(cacheKey);
            const expiry = this.templateCacheExpiry.get(cacheKey);
            if (cached && expiry && Date.now() < expiry) {
                logger.info('Returning cached templates', { count: cached.length });
                return cached;
            }
            const response = await this.client.get(`/${environment_1.config.whatsapp.businessAccountId}/message_templates`, {
                params: {
                    limit,
                    fields: 'name,status,category,language,components'
                }
            });
            const templates = response.data.data || [];
            this.templateCache.set(cacheKey, templates);
            this.templateCacheExpiry.set(cacheKey, Date.now() + this.templateCacheDuration);
            logger.info('Message templates retrieved', {
                count: templates.length,
                cached: true
            });
            return templates;
        }
        catch (error) {
            throw this.handleError(error, 'Failed to get message templates');
        }
    }
    handleError(error, defaultMessage) {
        if (error.response?.data?.error) {
            const whatsappError = error.response.data.error;
            return new WhatsAppServiceError(whatsappError.message || defaultMessage, whatsappError.type || 'WHATSAPP_API_ERROR', error.response.status || 500, whatsappError.code);
        }
        if (error.response) {
            return new WhatsAppServiceError(`${defaultMessage}: HTTP ${error.response.status}`, 'HTTP_ERROR', error.response.status);
        }
        if (error.code === 'ECONNABORTED') {
            return new WhatsAppServiceError(`${defaultMessage}: Request timeout`, 'TIMEOUT_ERROR', 408);
        }
        return new WhatsAppServiceError(`${defaultMessage}: ${error instanceof Error ? error.message : String(error)}`, 'UNKNOWN_ERROR', 500);
    }
    async healthCheck() {
        try {
            await this.client.get(`/${this.phoneNumberId}`, {
                params: {
                    fields: 'display_phone_number,name_status,quality_rating'
                }
            });
            return {
                status: 'healthy',
                timestamp: Date.now(),
                phoneNumberId: this.phoneNumberId,
                apiVersion: this.apiVersion,
                templatesCount: this.templateCache.size
            };
        }
        catch (error) {
            logger.error('WhatsApp health check failed', {
                phoneNumberId: this.phoneNumberId,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            });
            return {
                status: 'unhealthy',
                timestamp: Date.now(),
                phoneNumberId: this.phoneNumberId,
                apiVersion: this.apiVersion,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            };
        }
    }
    getServiceInfo() {
        return {
            phoneNumberId: this.phoneNumberId,
            apiVersion: this.apiVersion,
            baseUrl: this.baseUrl,
            templateCacheSize: this.templateCache.size,
            configured: !!(this.phoneNumberId && this.accessToken)
        };
    }
    clearTemplateCache() {
        this.templateCache.clear();
        this.templateCacheExpiry.clear();
        logger.info('WhatsApp template cache cleared');
    }
}
exports.WhatsAppService = WhatsAppService;
exports.whatsappService = WhatsAppService.getInstance();
//# sourceMappingURL=whatsapp.service.js.map