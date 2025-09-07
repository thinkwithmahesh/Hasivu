/**
 * HASIVU Platform - Email Service
 * Production-ready email delivery service with template support and comprehensive error handling
 * Integrates with SendGrid for transactional emails and notifications
 */

import type { MailDataRequired } from '@sendgrid/mail';
const sgMail = require('@sendgrid/mail');
// import { LoggerService } from '../logger.service';  // Logger import temporarily unavailable
const logger = {
  info: (message: string, data?: any) => console.log(message, data),
  warn: (message: string, data?: any) => console.warn(message, data),
  error: (message: string, data?: any) => console.error(message, data),
  debug: (message: string, data?: any) => console.debug(message, data)
};
import { config } from '../../config/environment';

/**
 * Email Message Configuration
 */
export interface EmailMessage {
  to: string | string[]; // Recipient email(s)
  from?: string; // Sender email (optional, uses default)
  subject: string; // Email subject
  text?: string; // Plain text content
  html?: string; // HTML content
  templateId?: string; // SendGrid template ID
  dynamicTemplateData?: Record<string, any>; // Template variables
  attachments?: EmailAttachment[]; // File attachments
  categories?: string[]; // Email categories for tracking
  customArgs?: Record<string, string>; // Custom tracking arguments
  sendAt?: number; // Scheduled send time (UNIX timestamp)
  batchId?: string; // Batch ID for grouping
  asm?: { // Unsubscribe management
    groupId: number;
    groupsToDisplay?: number[];
  };
  ipPoolName?: string; // IP pool for sending
  mailSettings?: {
    footer?: {
      enable: boolean;
      text?: string;
      html?: string;
    };
    sandboxMode?: {
      enable: boolean;
    };
  };
  trackingSettings?: {
    openTracking?: {
      enable: boolean;
      substitutionTag?: string;
    };
    subscriptionTracking?: {
      enable: boolean;
      text?: string;
      html?: string;
      substitutionTag?: string;
    };
    ganalytics?: {
      enable: boolean;
      utmSource?: string;
      utmMedium?: string;
      utmTerm?: string;
      utmContent?: string;
      utmCampaign?: string;
    };
  };
}

/**
 * Email Attachment
 */
export interface EmailAttachment {
  content: string; // Base64 encoded content
  filename: string; // File name
  type?: string; // MIME type
  disposition?: 'attachment' | 'inline'; // Attachment disposition
  contentId?: string; // Content ID for inline attachments
}

/**
 * Email Send Result
 */
export interface EmailSendResult {
  messageId: string; // SendGrid message ID
  success: boolean; // Send success status
  statusCode: number; // HTTP status code
  timestamp: number; // Send timestamp
  recipient: string | string[]; // Recipient(s)
  subject: string; // Email subject
  templateId?: string; // Template ID used
  error?: string; // Error message if failed
}

/**
 * Email Template Data for common email types
 */
export interface WelcomeEmailData {
  userName: string;
  loginUrl: string;
  supportEmail: string;
}

export interface OrderConfirmationData {
  userName: string;
  orderNumber: string;
  totalAmount: string; // Formatted currency
  orderItems: {
    name: string;
    quantity: number;
    price: string;
  }[];
  orderUrl: string;
  estimatedDelivery?: string;
}

export interface PaymentReceiptData {
  userName: string;
  paymentId: string;
  amount: string; // Formatted currency
  paymentMethod: string;
  transactionDate: string;
  orderUrl: string;
  receiptUrl?: string;
}

export interface PasswordResetData {
  userName: string;
  resetUrl: string;
  expiryTime: string;
  supportEmail: string;
}

export interface SubscriptionNotificationData {
  userName: string;
  subscriptionName: string;
  amount: string;
  renewalDate: string;
  manageUrl: string;
}

/**
 * Email Service Error
 */
export class EmailServiceError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: any;

  constructor(message: string, code: string = 'EMAIL_ERROR', statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'EmailServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EmailServiceError.prototype);
  }
}

/**
 * Email Service
 * Singleton service for handling all email operations
 */
export class EmailService {
  private static instance: EmailService;
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly environment: string;
  private initialized: boolean = false;

  private constructor() {
    this.apiKey = config.sendgrid.apiKey;
    this.fromEmail = config.sendgrid.fromEmail;
    this.fromName = config.sendgrid.fromName;
    this.environment = (config as any).environment || 'development';

    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Initialize SendGrid client
   */
  private initialize(): void {
    try {
      // Validate configuration
      if (!this.apiKey) {
        throw new EmailServiceError(
          'SendGrid API key is required',
          'MISSING_API_KEY',
          500
        );
      }

      if (!this.fromEmail) {
        throw new EmailServiceError(
          'From email address is required',
          'MISSING_FROM_EMAIL',
          500
        );
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
    } catch (error: any) {
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
  public async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    try {
      if (!this.initialized) {
        throw new EmailServiceError(
          'Email service not initialized',
          'SERVICE_NOT_INITIALIZED',
          500
        );
      }

      // Build email message
      const emailMessage: MailDataRequired = {
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
        throw new EmailServiceError(
          'Recipient email address is required',
          'MISSING_RECIPIENT',
          400
        );
      }

      if (!emailMessage.subject) {
        throw new EmailServiceError(
          'Email subject is required',
          'MISSING_SUBJECT',
          400
        );
      }

      if (!emailMessage.text && !emailMessage.html && !emailMessage.templateId) {
        throw new EmailServiceError(
          'Email must have text, html, or template content',
          'MISSING_CONTENT',
          400
        );
      }

      // Send email through SendGrid
      const [response] = await sgMail.send(emailMessage);

      const result: EmailSendResult = {
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
    } catch (error: any) {
      // Handle SendGrid-specific errors
      if (error.response) {
        const { statusCode, body } = error.response;
        
        switch (statusCode) {
          case 400:
            throw new EmailServiceError(
              `Bad request: ${body?.errors?.[0]?.message || 'Invalid email parameters'}`,
              'BAD_REQUEST',
              400,
              body
            );
          case 401:
            throw new EmailServiceError(
              'Unauthorized: Invalid SendGrid API key',
              'UNAUTHORIZED',
              401,
              body
            );
          case 403:
            throw new EmailServiceError(
              'Forbidden: SendGrid account suspended or restricted',
              'FORBIDDEN',
              403,
              body
            );
          case 413:
            throw new EmailServiceError(
              'Email payload too large',
              'PAYLOAD_TOO_LARGE',
              413,
              body
            );
          case 429:
            throw new EmailServiceError(
              'Rate limit exceeded',
              'RATE_LIMITED',
              429,
              body
            );
          default:
            throw new EmailServiceError(
              `SendGrid API error (${statusCode}): ${body?.errors?.[0]?.message || 'Unknown error'}`,
              'SENDGRID_ERROR',
              statusCode,
              body
            );
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

      throw new EmailServiceError(
        `Failed to send email: ${error.message}`,
        'SEND_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Send email using template
   */
  public async sendTemplateEmail<T = any>(
    to: string | string[],
    templateId: string,
    templateData: T,
    options: Partial<EmailMessage> = {}
  ): Promise<EmailSendResult> {
    // Validate template exists (basic check)
    if (!templateId || templateId.trim().length === 0) {
      throw new EmailServiceError(
        `Email template not found or inactive: ${templateId}`,
        'TEMPLATE_NOT_FOUND',
        404
      );
    }

    const message: EmailMessage = {
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
  public async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<EmailSendResult> {
    const templateData = {
      ...data,
      loginUrl: `${config.server.baseUrl}/login`,
      supportEmail: config.sendgrid.fromEmail
    };

    return this.sendTemplateEmail(
      to,
      (config as any).emailTemplates.welcome,
      templateData,
      {
        subject: 'Welcome to HASIVU Platform!',
        categories: ['welcome', 'onboarding']
      }
    );
  }

  /**
   * Send order confirmation email
   */
  public async sendOrderConfirmation(to: string, data: OrderConfirmationData): Promise<EmailSendResult> {
    const templateData = {
      ...data,
      totalAmount: `₹${(parseInt(data.totalAmount) / 100).toFixed(2)}`,
      orderUrl: `${config.server.baseUrl}/orders/${data.orderNumber}`
    };

    return this.sendTemplateEmail(
      to,
      (config as any).emailTemplates.orderConfirmation,
      templateData,
      {
        subject: `Order Confirmation - ${data.orderNumber}`,
        categories: ['order', 'confirmation']
      }
    );
  }

  /**
   * Send payment receipt email
   */
  public async sendPaymentReceipt(to: string, data: PaymentReceiptData): Promise<EmailSendResult> {
    const templateData = {
      ...data,
      amount: `₹${(parseInt(data.amount) / 100).toFixed(2)}`,
      orderUrl: `${config.server.baseUrl}/orders/${data.paymentId}`
    };

    return this.sendTemplateEmail(
      to,
      (config as any).emailTemplates.paymentReceipt,
      templateData,
      {
        subject: `Payment Receipt - ₹${templateData.amount}`,
        categories: ['payment', 'receipt']
      }
    );
  }

  /**
   * Send password reset email
   */
  public async sendPasswordReset(to: string, data: PasswordResetData): Promise<EmailSendResult> {
    return this.sendTemplateEmail(
      to,
      (config as any).emailTemplates.passwordReset,
      data,
      {
        subject: 'Reset Your Password',
        categories: ['password', 'reset']
      }
    );
  }

  /**
   * Send subscription notification email
   */
  public async sendSubscriptionNotification(to: string, data: SubscriptionNotificationData): Promise<EmailSendResult> {
    const templateData = {
      ...data,
      amount: `₹${(parseInt(data.amount) / 100).toFixed(2)}`,
      manageUrl: `${config.server.baseUrl}/subscriptions/${data.subscriptionName}`
    };

    return this.sendTemplateEmail(
      to,
      (config as any).emailTemplates.subscriptionNotification,
      templateData,
      {
        subject: `Subscription Update - ${data.subscriptionName}`,
        categories: ['subscription', 'notification']
      }
    );
  }

  /**
   * Send bulk emails with rate limiting
   */
  public async sendBulkEmails(
    messages: EmailMessage[],
    batchSize: number = 100,
    delayBetweenBatches: number = 1000
  ): Promise<EmailSendResult[]> {
    const results: EmailSendResult[] = [];
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      // Process batch concurrently
      const batchPromises = batch.map(message => this.sendEmail(message));
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Collect results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
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
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: number;
    configuration: {
      initialized: boolean;
      apiKeyConfigured: boolean;
      fromEmailConfigured: boolean;
      environment: string;
    };
    error?: string;
  }> {
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
    } catch (error: any) {
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
  public getServiceInfo(): {
    environment: string;
    fromEmail: string;
    fromName: string;
    initialized: boolean;
    apiKeyConfigured: boolean;
  } {
    return {
      environment: this.environment,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      initialized: this.initialized,
      apiKeyConfigured: !!this.apiKey
    };
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();