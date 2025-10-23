export interface NotificationResult {
    success: boolean;
    messageId?: string;
    message?: string;
    error?: string;
    deliveryStatus?: 'sent' | 'delivered' | 'failed' | 'pending';
    timestamp?: Date;
}
export interface NotificationConfig {
    successRate?: number;
    averageDeliveryTime?: number;
    maxDeliveryTime?: number;
    enableRandomFailures?: boolean;
    enableDeliveryDelay?: boolean;
    supportedChannels?: string[];
}
export interface NotificationData {
    to: string | string[];
    channel: 'email' | 'sms' | 'whatsapp' | 'push';
    subject?: string;
    message: string;
    template?: string;
    templateData?: Record<string, any>;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    metadata?: Record<string, any>;
}
export declare class MockNotificationProvider {
    private config;
    private sentNotifications;
    private notificationCounter;
    private deliveryQueue;
    constructor(config?: Partial<NotificationConfig>);
    sendNotification(data: NotificationData): Promise<NotificationResult>;
    sendBulkNotifications(notifications: NotificationData[]): Promise<NotificationResult[]>;
    sendEmail(to: string | string[], subject: string, body: string, options?: any): Promise<NotificationResult>;
    sendSMS(to: string | string[], message: string, options?: any): Promise<NotificationResult>;
    sendWhatsApp(to: string | string[], message: string, options?: any): Promise<NotificationResult>;
    sendPushNotification(to: string | string[], title: string, body: string, options?: any): Promise<NotificationResult>;
    getNotificationStatus(messageId: string): Promise<NotificationResult>;
    getStatistics(): any;
    getAllNotifications(): any[];
    getNotificationsByChannel(channel: string): any[];
    getNotificationsByStatus(status: string): any[];
    reset(): void;
    configure(config: Partial<NotificationConfig>): void;
    hasNotification(messageId: string): boolean;
    getNotificationCount(): number;
    private simulateProcessingDelay;
    private getRandomDeliveryTime;
    private getRandomFailureReason;
    private startDeliverySimulation;
}
//# sourceMappingURL=MockNotificationProvider.d.ts.map