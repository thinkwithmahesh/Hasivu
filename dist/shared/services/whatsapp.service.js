"use strict";
/**
 * HASIVU Platform - WhatsApp Business API Service
 * Production-ready WhatsApp message delivery service with template support and webhook handling
 * Integrates with WhatsApp Business API for customer communication and notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = exports.WhatsAppService = exports.WhatsAppServiceError = void 0;
const axios_1 = require("axios");
const crypto_1 = require("crypto");
// import { LoggerService } from '../logger.service';  // Logger import temporarily unavailable
const logger = {
    info: (message, data) => console.log(message, data),
    warn: (message, data) => console.warn(message, data),
    error: (message, data) => console.error(message, data),
    debug: (message, data) => console.debug(message, data)
};
const environment_1 = require("../../config/environment");
/**
 * WhatsApp Service Error
 */
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
        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, WhatsAppServiceError.prototype);
    }
}
exports.WhatsAppServiceError = WhatsAppServiceError;
/**
 * WhatsApp Business API Service
 * Singleton service for handling all WhatsApp operations
 */
class WhatsAppService {
    static instance;
    client;
    phoneNumberId;
    accessToken;
    webhookVerifyToken;
    apiVersion = 'v18.0';
    baseUrl;
    // Message templates cache
    templateCache = new Map();
    templateCacheExpiry = new Map();
    templateCacheDuration = 3600000; // 1 hour
    constructor() {
        this.phoneNumberId = environment_1.config.whatsapp.phoneNumberId;
        this.accessToken = environment_1.config.whatsapp.accessToken;
        this.webhookVerifyToken = environment_1.config.whatsapp.webhookVerifyToken;
        this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
        // Validate configuration
        if (!this.phoneNumberId || !this.accessToken) {
            throw new WhatsAppServiceError('WhatsApp configuration missing: phoneNumberId and accessToken required', 'MISSING_CONFIG', 500);
        }
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 seconds
        });
        // Request interceptor for logging
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
            logger.error('WhatsApp API Request Error', { error: error.message });
            return Promise.reject(error);
        });
        // Response interceptor for logging
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
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!WhatsAppService.instance) {
            WhatsAppService.instance = new WhatsAppService();
        }
        return WhatsAppService.instance;
    }
    /**
     * Send a text message
     */
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
    /**
     * Send a template message
     */
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
    /**
     * Send media message
     */
    async sendMediaMessage(to, mediaType, media, caption, contextMessageId) {
        try {
            const message = {
                messaging_product: 'whatsapp',
                to,
                type: mediaType
            };
            // Set media object based on type
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
    /**
     * Send interactive message
     */
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
    /**
     * Send location message
     */
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
    /**
     * Send contact message
     */
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
    /**
     * Upload media to WhatsApp
     */
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
    /**
     * Get media URL
     */
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
    /**
     * Download media
     */
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
    /**
     * Verify webhook signature
     */
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
                error: error.message
            });
            return false;
        }
    }
    /**
     * Process webhook event
     */
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
                error: error.message
            });
            return { messages: [], statuses: [] };
        }
    }
    /**
     * Get message templates
     */
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
            // Cache the templates
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
    /**
     * Handle API errors
     */
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
        return new WhatsAppServiceError(`${defaultMessage}: ${error.message}`, 'UNKNOWN_ERROR', 500);
    }
    /**
     * Health check for WhatsApp service
     */
    async healthCheck() {
        try {
            // Try to get account info as a health check
            const response = await this.client.get(`/${this.phoneNumberId}`, {
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
                error: error.message
            });
            return {
                status: 'unhealthy',
                timestamp: Date.now(),
                phoneNumberId: this.phoneNumberId,
                apiVersion: this.apiVersion,
                error: error.message
            };
        }
    }
    /**
     * Get service configuration (safe for logging)
     */
    getServiceInfo() {
        return {
            phoneNumberId: this.phoneNumberId,
            apiVersion: this.apiVersion,
            baseUrl: this.baseUrl,
            templateCacheSize: this.templateCache.size,
            configured: !!(this.phoneNumberId && this.accessToken)
        };
    }
    /**
     * Clear template cache
     */
    clearTemplateCache() {
        this.templateCache.clear();
        this.templateCacheExpiry.clear();
        logger.info('WhatsApp template cache cleared');
    }
}
exports.WhatsAppService = WhatsAppService;
// Export singleton instance
exports.whatsappService = WhatsAppService.getInstance();
