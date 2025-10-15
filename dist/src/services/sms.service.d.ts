export type SMSMessageStatus = 'queued' | 'sent' | 'delivered' | 'failed';
export interface SMSMessage {
    id: string;
    to: string;
    from: string;
    body: string;
    status: SMSMessageStatus;
    messageSid?: string;
    timestamp: Date;
    deliveredAt?: Date;
    failedAt?: Date;
    errorCode?: string;
    errorMessage?: string;
    retryCount: number;
    businessData?: Record<string, any>;
    cost?: number;
}
export interface SMSServiceConfig {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    apiVersion: string;
    retryCount: number;
    retryDelay: number;
    rateLimitPerSecond: number;
}
export interface SMSDeliveryMetrics {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    deliveryRate: number;
    averageDeliveryTime: number;
    failureReasons: Record<string, number>;
    totalCost: number;
}
export declare class SMSService {
    private static instance;
    private client;
    private prisma;
    private accountSid;
    private authToken;
    private phoneNumber;
    private rateLimitKey;
    private constructor();
    static getInstance(): SMSService;
    sendMessage(to: string, body: string, options?: {
        businessData?: Record<string, any>;
    }): Promise<SMSMessage>;
    sendBulkMessages(messages: Array<{
        to: string;
        body: string;
        businessData?: Record<string, any>;
    }>): Promise<SMSMessage[]>;
    handleStatusWebhook(messageSid: string, messageStatus: string, errorCode?: string, errorMessage?: string): Promise<void>;
    getDeliveryMetrics(startDate: Date, endDate: Date): Promise<SMSDeliveryMetrics>;
    private checkRateLimit;
    private normalizePhoneNumber;
    private mapTwilioStatus;
    private storeMessage;
    getConfiguration(): SMSServiceConfig;
    isConfigured(): boolean;
}
export default SMSService;
//# sourceMappingURL=sms.service.d.ts.map