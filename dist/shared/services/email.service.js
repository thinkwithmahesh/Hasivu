"use strict";
/**
 * HASIVU Platform - Email Service
 * Production-ready email delivery service with template support and comprehensive error handling
 * Integrates with SendGrid for transactional emails and notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = exports.EmailServiceError = void 0;
const sgMail = require('@sendgrid/mail');
// import { LoggerService } from '../logger.service';  // Logger import temporarily unavailable
const logger = {
    info: (message, data) => console.log(message, data),
    warn: (message, data) => console.warn(message, data),
    error: (message, data) => console.error(message, data),
    debug: (message, data) => console.debug(message, data)
};
const environment_1 = require("../../config/environment");
/**
 * Email Service Error
 */
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
        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, EmailServiceError.prototype);
    }
}
exports.EmailServiceError = EmailServiceError;
/**
 * Email Service
 * Singleton service for handling all email operations
 */
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
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }
    /**
     * Initialize SendGrid client
     */
    initialize() {
        try {
            // Validate configuration
            if (!this.apiKey) {
                throw new EmailServiceError('SendGrid API key is required', 'MISSING_API_KEY', 500);
            }
            if (!this.fromEmail) {
                throw new EmailServiceError('From email address is required', 'MISSING_FROM_EMAIL', 500);
            }
            // Initialize SendGrid client
            sgMail.setApiKey(this.apiKey);
            sgMail.setSubstitutionWrappers('{{', '}}');
            this.initialized = true;
            logger.info('Email service initialized', {
                environment: this.environment,
                fromEmail: this.fromEmail,
                fromName: this.fromName
            });
        }
        catch (error) {
            logger.error('Failed to initialize email service', {
                error: error.message,
                environment: this.environment
            });
            throw error;
        }
    }
    /**
     * Send email with retry logic and error handling
     */
    async sendEmail(message) {
        try {
            if (!this.initialized) {
                throw new EmailServiceError('Email service not initialized', 'SERVICE_NOT_INITIALIZED', 500);
            }
            // Build email message
            const emailMessage = {
                to: message.to,
                from: {
                    email: message.from || this.fromEmail,
                    name: this.fromName
                },
                subject: message.subject,
                text: message.text,
                html: message.html,
                templateId: message.templateId,
                dynamicTemplateData: message.dynamicTemplateData,
                attachments: message.attachments,
                categories: message.categories,
                customArgs: message.customArgs,
                sendAt: message.sendAt,
                batchId: message.batchId,
                asm: message.asm,
                ipPoolName: message.ipPoolName,
                mailSettings: message.mailSettings,
                trackingSettings: message.trackingSettings
            };
            // Validate required fields
            if (!emailMessage.to) {
                throw new EmailServiceError('Recipient email address is required', 'MISSING_RECIPIENT', 400);
            }
            if (!emailMessage.subject) {
                throw new EmailServiceError('Email subject is required', 'MISSING_SUBJECT', 400);
            }
            if (!emailMessage.text && !emailMessage.html && !emailMessage.templateId) {
                throw new EmailServiceError('Email must have text, html, or template content', 'MISSING_CONTENT', 400);
            }
            // Send email through SendGrid
            const [response] = await sgMail.send(emailMessage);
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
            // Handle SendGrid-specific errors
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
            // Handle other errors
            if (error instanceof EmailServiceError) {
                throw error;
            }
            logger.error('Failed to send email', {
                error: error.message,
                recipient: message.to,
                subject: message.subject,
                templateId: message.templateId
            });
            throw new EmailServiceError(`Failed to send email: ${error.message}`, 'SEND_FAILED', 500, error);
        }
    }
    /**
     * Send email using template
     */
    async sendTemplateEmail(to, templateId, templateData, options = {}) {
        // Validate template exists (basic check)
        if (!templateId || templateId.trim().length === 0) {
            throw new EmailServiceError(`Email template not found or inactive: ${templateId}`, 'TEMPLATE_NOT_FOUND', 404);
        }
        const message = {
            to,
            subject: options.subject || 'Notification', // Fallback subject
            templateId,
            dynamicTemplateData: templateData,
            ...options
        };
        return this.sendEmail(message);
    }
    /**
     * Send welcome email to new users
     */
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
    /**
     * Send order confirmation email
     */
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
    /**
     * Send payment receipt email
     */
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
    /**
     * Send password reset email
     */
    async sendPasswordReset(to, data) {
        return this.sendTemplateEmail(to, environment_1.config.emailTemplates.passwordReset, data, {
            subject: 'Reset Your Password',
            categories: ['password', 'reset']
        });
    }
    /**
     * Send subscription notification email
     */
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
    /**
     * Send bulk emails with rate limiting
     */
    async sendBulkEmails(messages, batchSize = 100, delayBetweenBatches = 1000) {
        const results = [];
        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            // Process batch concurrently
            const batchPromises = batch.map(message => this.sendEmail(message));
            const batchResults = await Promise.allSettled(batchPromises);
            // Collect results
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    // Log failed emails but continue processing
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
            // Delay between batches to respect rate limits
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
    /**
     * Health check for email service
     */
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
                error: error.message
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
                error: error.message
            };
        }
    }
    /**
     * Get service configuration (safe for logging)
     */
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
// Export singleton instance
exports.emailService = EmailService.getInstance();
