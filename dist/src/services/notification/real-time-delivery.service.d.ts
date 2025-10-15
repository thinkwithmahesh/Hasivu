/// <reference types="node" />
import { EventEmitter } from 'events';
export interface DeliveryNotificationPayload {
    verificationId: string;
    studentId: string;
    studentName: string;
    parentId: string;
    orderId: string;
    orderNumber: string;
    schoolId: string;
    schoolName: string;
    deliveryTime: Date;
    readerLocation: string;
    readerName: string;
    cardNumber: string;
    mealDetails?: {
        items: string[];
        totalAmount: number;
        currency: string;
    };
    metadata?: Record<string, any>;
}
export declare enum NotificationChannel {
    PUSH = "push",
    SMS = "sms",
    EMAIL = "email",
    WHATSAPP = "whatsapp",
    IN_APP = "in_app"
}
export interface NotificationDeliveryResult {
    channel: NotificationChannel;
    success: boolean;
    messageId?: string;
    deliveredAt?: Date;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    responseTime: number;
}
export interface BulkNotificationResult {
    notificationId: string;
    totalRecipients: number;
    deliveryResults: NotificationDeliveryResult[];
    overallSuccess: boolean;
    averageResponseTime: number;
    metadata: {
        startTime: Date;
        endTime: Date;
        duration: number;
    };
}
export declare class RealTimeDeliveryNotificationService extends EventEmitter {
    private static instance;
    private snsClient;
    private sesClient;
    private notificationQueue;
    private deliveryHistory;
    private readonly maxHistorySize;
    private constructor();
    static getInstance(): RealTimeDeliveryNotificationService;
    sendDeliveryNotification(payload: DeliveryNotificationPayload): Promise<BulkNotificationResult>;
    private sendPushNotification;
    private sendSMSNotification;
    private sendWhatsAppNotification;
    private sendEmailNotificationAsync;
    private sendEmailNotification;
    private sendInAppNotification;
    private getParentContactInfo;
    private getParentDevices;
    private createNotificationTemplates;
    private recordDeliveryAnalytics;
    private addToDeliveryHistory;
    private setupEventListeners;
    getDeliveryHistory(notificationId: string): NotificationDeliveryResult[] | undefined;
    getDeliveryStatistics(timeRange: {
        start: Date;
        end: Date;
    }): Promise<{
        totalNotifications: number;
        averageResponseTime: number;
        successRate: number;
        channelPerformance: Record<NotificationChannel, {
            attempts: number;
            successes: number;
            averageResponseTime: number;
        }>;
        targetComplianceRate: number;
    }>;
}
export declare const realTimeDeliveryNotificationService: RealTimeDeliveryNotificationService;
//# sourceMappingURL=real-time-delivery.service.d.ts.map