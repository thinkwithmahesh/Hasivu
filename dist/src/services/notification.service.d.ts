import { Notification } from '@prisma/client';
export type NotificationChannel = 'push' | 'email' | 'sms' | 'whatsapp' | 'in_app' | 'socket';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'expired';
export interface NotificationChannelStatus {
    status: NotificationStatus;
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
    error?: string;
}
export interface NotificationDeliveryStatus {
    push: NotificationChannelStatus;
    email: NotificationChannelStatus;
    sms: NotificationChannelStatus;
    whatsapp: NotificationChannelStatus;
    in_app: NotificationChannelStatus;
    socket: NotificationChannelStatus;
}
export interface NotificationTemplate {
    id: string;
    name: string;
    subject?: string;
    body: string;
    channel: NotificationChannel;
    variables?: Record<string, any>;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface NotificationTemplateData {
    id: string;
    name: string;
    type: string;
    channels: NotificationChannel[];
    content: Record<NotificationChannel, {
        subject?: string;
        body: string;
        buttonText?: string;
        buttonUrl?: string;
    }>;
    variables: string[];
    isActive: boolean;
    conditions?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface NotificationRequest {
    templateId: string;
    recipientId: string;
    recipientType: 'user' | 'parent' | 'student' | 'admin';
    channels?: NotificationChannel[];
    variables?: Record<string, any>;
    priority?: NotificationPriority;
    scheduledAt?: Date;
    expiresAt?: Date;
    metadata?: Record<string, any>;
}
export interface NotificationData extends Notification {
    templateData?: NotificationTemplateData;
    deliveryStatus: Record<NotificationChannel, {
        status: NotificationStatus;
        sentAt?: Date;
        deliveredAt?: Date;
        readAt?: Date;
        error?: string;
    }>;
}
export interface NotificationPreferences {
    channels: Record<NotificationChannel, boolean>;
    quietHours: {
        enabled: boolean;
        startTime: string;
        endTime: string;
        timezone: string;
    };
    frequency: {
        email: 'immediate' | 'daily' | 'weekly';
        push: 'immediate' | 'batched';
        sms: 'immediate' | 'urgent_only';
        whatsapp: 'immediate' | 'daily';
    };
    topics: Record<string, boolean>;
}
export interface BulkNotificationRequest {
    templateId: string;
    recipients: Array<{
        recipientId: string;
        recipientType: 'user' | 'parent' | 'student' | 'admin';
        variables?: Record<string, any>;
    }>;
    channels?: NotificationChannel[];
    priority?: NotificationPriority;
    scheduledAt?: Date;
    metadata?: Record<string, any>;
}
export interface OrderConfirmationData {
    orderId: string;
    studentId: string;
    parentId: string;
    totalAmount: number;
    deliveryDate: Date;
}
export interface OrderStatusUpdateData {
    orderId: string;
    studentId: string;
    parentId: string;
    newStatus: string;
    message?: string;
}
export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
        details?: any;
    };
}
export interface NotificationAnalytics {
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    deliveryRate: number;
    readRate: number;
    channelStats: Record<NotificationChannel, {
        sent: number;
        delivered: number;
        read: number;
        failed: number;
    }>;
    templateStats: Array<{
        templateId: string;
        templateName: string;
        sent: number;
        deliveryRate: number;
        readRate: number;
    }>;
}
export declare class NotificationService {
    private static readonly CACHE_TTL;
    private static readonly RETRY_ATTEMPTS;
    private static readonly BATCH_SIZE;
    private static readonly QUIET_HOURS_BUFFER;
    static sendNotification(request: NotificationRequest): Promise<ServiceResponse<NotificationData>>;
    static sendBulkNotifications(request: BulkNotificationRequest): Promise<ServiceResponse<{
        successful: number;
        failed: number;
        details: {
            successful: any[];
            failed: any[];
        };
    }>>;
    static sendOrderConfirmation(data: OrderConfirmationData): Promise<ServiceResponse<NotificationData>>;
    static sendOrderStatusUpdate(data: OrderStatusUpdateData): Promise<ServiceResponse<NotificationData>>;
    static markAsRead(notificationId: string, userId: string): Promise<ServiceResponse<Notification>>;
    static getUserNotifications(userId: string, options?: {
        page?: number;
        limit?: number;
        status?: NotificationStatus;
        priority?: NotificationPriority;
        unreadOnly?: boolean;
    }): Promise<ServiceResponse<{
        notifications: Notification[];
        pagination: any;
    }>>;
    static updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<ServiceResponse<NotificationPreferences>>;
    static getNotificationAnalytics(filters: {
        startDate: Date;
        endDate: Date;
        templateId?: string;
        userId?: string;
    }): Promise<ServiceResponse<NotificationAnalytics>>;
    private static getTemplate;
    private static getRecipient;
    private static getUserPreferences;
    private static determineChannels;
    private static isQuietHours;
    private static calculatePostQuietHoursTime;
    private static scheduleNotification;
    private static processTemplate;
    private static replaceVariables;
    private static initializeDeliveryStatus;
    private static sendThroughChannels;
    private static sendThroughChannel;
    private static updateDeliveryStatus;
    private static updateUnreadCount;
    private static getDefaultPreferences;
    private static getMockTemplate;
    private static processNotificationAnalytics;
    clearQueue(): Promise<void>;
    disconnect(): Promise<void>;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification.service.d.ts.map