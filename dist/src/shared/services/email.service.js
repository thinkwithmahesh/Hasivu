"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = exports.EmailServiceError = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const logger = {
    info: (message, data) => console.log(message, data),
    warn: (message, data) => console.warn(message, data),
    error: (message, data) => console.error(message, data),
    debug: (message, data) => console.debug(message, data)
};
const environment_1 = require("../../config/environment");
class EmailServiceError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code = 'EMAIL_ERROR', statusCode = 500, details) {
        super(message);
        this.name = 'EmailServiceError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, EmailServiceError.prototype);
    }
}
exports.EmailServiceError = EmailServiceError;
class EmailService {
    static instance;
    apiKey;
    fromEmail;
    fromName;
    environment;
    initialized = false;
    constructor() {
        this.apiKey = environment_1.config.sendgrid.apiKey;
        this.fromEmail = environment_1.config.sendgrid.fromEmail;
        this.fromName = environment_1.config.sendgrid.fromName;
        this.environment = environment_1.config.environment || 'development';
        this.initialize();
    }
    static getInstance() {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }
    initialize() {
        try {
            if (!this.apiKey) {
                throw new EmailServiceError('SendGrid API key is required', 'MISSING_API_KEY', 500);
            }
            if (!this.fromEmail) {
                throw new EmailServiceError('From email address is required', 'MISSING_FROM_EMAIL', 500);
            }
            mail_1.default.setApiKey(this.apiKey);
            mail_1.default.setSubstitutionWrappers('{{', '}}');
            this.initialized = true;
            logger.info('Email service initialized', {
                environment: this.environment,
                fromEmail: this.fromEmail,
                fromName: this.fromName
            });
        }
        catch (error) {
            logger.error('Failed to initialize email service', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                environment: this.environment
            });
            throw error;
        }
    }
    async sendEmail(message) {
        try {
            if (!this.initialized) {
                throw new EmailServiceError('Email service not initialized', 'SERVICE_NOT_INITIALIZED', 500);
            }
            const emailMessage = {
                to: message.to,
                from: {
                    email: message.from || this.fromEmail,
                    name: this.fromName
                },
                subject: message.subject
            };
            if (message.text)
                emailMessage.text = message.text;
            if (message.html)
                emailMessage.html = message.html;
            if (message.templateId)
                emailMessage.templateId = message.templateId;
            if (message.dynamicTemplateData)
                emailMessage.dynamicTemplateData = message.dynamicTemplateData;
            if (message.attachments)
                emailMessage.attachments = message.attachments;
            if (message.categories)
                emailMessage.categories = message.categories;
            if (message.customArgs)
                emailMessage.customArgs = message.customArgs;
            if (message.sendAt)
                emailMessage.sendAt = message.sendAt;
            if (message.batchId)
                emailMessage.batchId = message.batchId;
            if (message.asm)
                emailMessage.asm = message.asm;
            if (message.ipPoolName)
                emailMessage.ipPoolName = message.ipPoolName;
            if (message.mailSettings)
                emailMessage.mailSettings = message.mailSettings;
            if (message.trackingSettings)
                emailMessage.trackingSettings = message.trackingSettings;
            if (!emailMessage.to) {
                throw new EmailServiceError('Recipient email address is required', 'MISSING_RECIPIENT', 400);
            }
            if (!emailMessage.subject) {
                throw new EmailServiceError('Email subject is required', 'MISSING_SUBJECT', 400);
            }
            if (!emailMessage.text && !emailMessage.html && !emailMessage.templateId) {
                throw new EmailServiceError('Email must have text, html, or template content', 'MISSING_CONTENT', 400);
            }
            const [response] = await mail_1.default.send(emailMessage);
            const result = {
                messageId: response.headers['x-message-id'] || '',
                success: true,
                statusCode: response.statusCode,
                timestamp: Date.now(),
                recipient: message.to,
                subject: message.subject,
                templateId: message.templateId
            };
            logger.info('Email sent successfully', {
                messageId: result.messageId,
                recipient: Array.isArray(message.to) ? message.to.length + ' recipients' : message.to,
                subject: message.subject,
                templateId: message.templateId,
                statusCode: response.statusCode
            });
            return result;
        }
        catch (error) {
            if (error.response) {
                const { statusCode, body } = error.response;
                switch (statusCode) {
                    case 400:
                        throw new EmailServiceError(`Bad request: ${body?.errors?.[0]?.message || 'Invalid email parameters'}`, 'BAD_REQUEST', 400, body);
                    case 401:
                        throw new EmailServiceError('Unauthorized: Invalid SendGrid API key', 'UNAUTHORIZED', 401, body);
                    case 403:
                        throw new EmailServiceError('Forbidden: SendGrid account suspended or restricted', 'FORBIDDEN', 403, body);
                    case 413:
                        throw new EmailServiceError('Email payload too large', 'PAYLOAD_TOO_LARGE', 413, body);
                    case 429:
                        throw new EmailServiceError('Rate limit exceeded', 'RATE_LIMITED', 429, body);
                    default:
                        throw new EmailServiceError(`SendGrid API error (${statusCode}): ${body?.errors?.[0]?.message || 'Unknown error'}`, 'SENDGRID_ERROR', statusCode, body);
                }
            }
            if (error instanceof EmailServiceError) {
                throw error;
            }
            logger.error('Failed to send email', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                recipient: message.to,
                subject: message.subject,
                templateId: message.templateId
            });
            throw new EmailServiceError(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`, 'SEND_FAILED', 500, error);
        }
    }
    async sendTemplateEmail(to, templateId, templateData, options = {}) {
        if (!templateId || templateId.trim().length === 0) {
            throw new EmailServiceError(`Email template not found or inactive: ${templateId}`, 'TEMPLATE_NOT_FOUND', 404);
        }
        const message = {
            to,
            subject: options.subject || 'Notification',
            templateId,
            dynamicTemplateData: templateData,
            ...options
        };
        return this.sendEmail(message);
    }
    async sendWelcomeEmail(to, data) {
        const templateData = {
            ...data,
            loginUrl: `${environment_1.config.server.baseUrl}/login`,
            supportEmail: environment_1.config.sendgrid.fromEmail
        };
        return this.sendTemplateEmail(to, environment_1.config.emailTemplates.welcome, templateData, {
            subject: 'Welcome to HASIVU Platform!',
            categories: ['welcome', 'onboarding']
        });
    }
    async sendOrderConfirmation(to, data) {
        const templateData = {
            ...data,
            totalAmount: `₹${(parseInt(data.totalAmount) / 100).toFixed(2)}`,
            orderUrl: `${environment_1.config.server.baseUrl}/orders/${data.orderNumber}`
        };
        return this.sendTemplateEmail(to, environment_1.config.emailTemplates.orderConfirmation, templateData, {
            subject: `Order Confirmation - ${data.orderNumber}`,
            categories: ['order', 'confirmation']
        });
    }
    async sendPaymentReceipt(to, data) {
        const templateData = {
            ...data,
            amount: `₹${(parseInt(data.amount) / 100).toFixed(2)}`,
            orderUrl: `${environment_1.config.server.baseUrl}/orders/${data.paymentId}`
        };
        return this.sendTemplateEmail(to, environment_1.config.emailTemplates.paymentReceipt, templateData, {
            subject: `Payment Receipt - ₹${templateData.amount}`,
            categories: ['payment', 'receipt']
        });
    }
    async sendPasswordReset(to, data) {
        return this.sendTemplateEmail(to, environment_1.config.emailTemplates.passwordReset, data, {
            subject: 'Reset Your Password',
            categories: ['password', 'reset']
        });
    }
    async sendSubscriptionNotification(to, data) {
        const templateData = {
            ...data,
            amount: `₹${(parseInt(data.amount) / 100).toFixed(2)}`,
            manageUrl: `${environment_1.config.server.baseUrl}/subscriptions/${data.subscriptionName}`
        };
        return this.sendTemplateEmail(to, environment_1.config.emailTemplates.subscriptionNotification, templateData, {
            subject: `Subscription Update - ${data.subscriptionName}`,
            categories: ['subscription', 'notification']
        });
    }
    async sendBulkEmails(messages, batchSize = 100, delayBetweenBatches = 1000) {
        const results = [];
        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            const batchPromises = batch.map(message => this.sendEmail(message));
            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    logger.error('Bulk email failed', {
                        error: result.reason.message,
                        recipient: batch[index].to,
                        subject: batch[index].subject
                    });
                    results.push({
                        messageId: '',
                        success: false,
                        statusCode: 500,
                        timestamp: Date.now(),
                        recipient: batch[index].to,
                        subject: batch[index].subject,
                        error: result.reason.message
                    });
                }
            });
            if (i + batchSize < messages.length && delayBetweenBatches > 0) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }
        logger.info('Bulk email sending completed', {
            totalMessages: messages.length,
            successCount: results.filter(r => r.success).length,
            failureCount: results.filter(r => !r.success).length
        });
        return results;
    }
    async healthCheck() {
        try {
            return {
                status: 'healthy',
                timestamp: Date.now(),
                configuration: {
                    initialized: this.initialized,
                    apiKeyConfigured: !!this.apiKey,
                    fromEmailConfigured: !!this.fromEmail,
                    environment: this.environment
                }
            };
        }
        catch (error) {
            logger.error('Email service health check failed', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            });
            return {
                status: 'unhealthy',
                timestamp: Date.now(),
                configuration: {
                    initialized: this.initialized,
                    apiKeyConfigured: !!this.apiKey,
                    fromEmailConfigured: !!this.fromEmail,
                    environment: this.environment
                },
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            };
        }
    }
    getServiceInfo() {
        return {
            environment: this.environment,
            fromEmail: this.fromEmail,
            fromName: this.fromName,
            initialized: this.initialized,
            apiKeyConfigured: !!this.apiKey
        };
    }
}
exports.EmailService = EmailService;
exports.emailService = EmailService.getInstance();
//# sourceMappingURL=email.service.js.map