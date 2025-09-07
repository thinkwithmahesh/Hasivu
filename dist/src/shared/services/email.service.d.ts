export interface EmailMessage {
    to: string | string[];
    from?: string;
    subject: string;
    text?: string;
    html?: string;
    templateId?: string;
    dynamicTemplateData?: Record<string, any>;
    attachments?: EmailAttachment[];
    categories?: string[];
    customArgs?: Record<string, string>;
    sendAt?: number;
    batchId?: string;
    asm?: {
        groupId: number;
        groupsToDisplay?: number[];
    };
    ipPoolName?: string;
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
export interface EmailAttachment {
    content: string;
    filename: string;
    type?: string;
    disposition?: 'attachment' | 'inline';
    contentId?: string;
}
export interface EmailSendResult {
    messageId: string;
    success: boolean;
    statusCode: number;
    timestamp: number;
    recipient: string | string[];
    subject: string;
    templateId?: string;
    error?: string;
}
export interface WelcomeEmailData {
    userName: string;
    loginUrl: string;
    supportEmail: string;
}
export interface OrderConfirmationData {
    userName: string;
    orderNumber: string;
    totalAmount: string;
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
    amount: string;
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
export declare class EmailServiceError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details: any;
    constructor(message: string, code?: string, statusCode?: number, details?: any);
}
export declare class EmailService {
    private static instance;
    private readonly apiKey;
    private readonly fromEmail;
    private readonly fromName;
    private readonly environment;
    private initialized;
    private constructor();
    static getInstance(): EmailService;
    private initialize;
    sendEmail(message: EmailMessage): Promise<EmailSendResult>;
    sendTemplateEmail<T = any>(to: string | string[], templateId: string, templateData: T, options?: Partial<EmailMessage>): Promise<EmailSendResult>;
    sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<EmailSendResult>;
    sendOrderConfirmation(to: string, data: OrderConfirmationData): Promise<EmailSendResult>;
    sendPaymentReceipt(to: string, data: PaymentReceiptData): Promise<EmailSendResult>;
    sendPasswordReset(to: string, data: PasswordResetData): Promise<EmailSendResult>;
    sendSubscriptionNotification(to: string, data: SubscriptionNotificationData): Promise<EmailSendResult>;
    sendBulkEmails(messages: EmailMessage[], batchSize?: number, delayBetweenBatches?: number): Promise<EmailSendResult[]>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        timestamp: number;
        configuration: {
            initialized: boolean;
            apiKeyConfigured: boolean;
            fromEmailConfigured: boolean;
            environment: string;
        };
        error?: string;
    }>;
    getServiceInfo(): {
        environment: string;
        fromEmail: string;
        fromName: string;
        initialized: boolean;
        apiKeyConfigured: boolean;
    };
}
export declare const emailService: EmailService;
//# sourceMappingURL=email.service.d.ts.map