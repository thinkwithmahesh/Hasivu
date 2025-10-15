import { Notification } from '@prisma/client';
export interface NotificationFilters {
    userId?: string;
    type?: string;
    status?: string;
    isRead?: boolean;
}
export interface CreateNotificationData {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    scheduledFor?: Date;
}
export declare const NotificationStatus: {
    readonly PENDING: "pending";
    readonly SENT: "sent";
    readonly DELIVERED: "delivered";
    readonly READ: "read";
    readonly FAILED: "failed";
    readonly EXPIRED: "expired";
};
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];
export declare const NotificationPriority: {
    readonly LOW: "low";
    readonly NORMAL: "normal";
    readonly HIGH: "high";
    readonly URGENT: "urgent";
};
export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority];
export type NotificationChannel = 'push' | 'email' | 'sms' | 'whatsapp' | 'in_app' | 'socket';
export interface NotificationRequest {
    templateId: string;
    recipientId: string;
    recipientType: 'parent' | 'student' | 'staff';
    channels?: NotificationChannel[];
    variables?: Record<string, any>;
    priority?: NotificationPriority;
    expiresAt?: Date;
}
export interface BulkNotificationRequest {
    templateId: string;
    recipients: Array<{
        recipientId: string;
        recipientType: 'parent' | 'student' | 'staff';
        variables: Record<string, any>;
    }>;
    channels?: NotificationChannel[];
    priority?: NotificationPriority;
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
export interface NotificationPreferences {
    channels: {
        push: boolean;
        email: boolean;
        sms: boolean;
        whatsapp: boolean;
        in_app: boolean;
        socket: boolean;
    };
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
        whatsapp: 'immediate' | 'batched';
    };
    topics: {
        orderUpdates: boolean;
        paymentUpdates: boolean;
        systemAnnouncements: boolean;
        promotions: boolean;
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
    templateStats: Record<string, {
        sent: number;
        delivered: number;
        read: number;
    }>;
    timeSeries: Array<{
        date: string;
        sent: number;
        delivered: number;
        read: number;
    }>;
}
export declare class NotificationService {
    private static instance;
    private prisma;
    private constructor();
    static getInstance(): NotificationService;
    findById(id: string): Promise<Notification | null>;
    findByUser(userId: string): Promise<Notification[]>;
    findUnread(userId: string): Promise<Notification[]>;
    findAll(filters?: NotificationFilters): Promise<Notification[]>;
    create(data: CreateNotificationData): Promise<Notification>;
    markAsRead(id: string): Promise<Notification>;
    markAllAsRead(userId: string): Promise<number>;
    delete(id: string): Promise<Notification>;
    deleteOld(daysOld?: number): Promise<number>;
    sendPushNotification(userId: string, notification: CreateNotificationData): Promise<void>;
    static sendOrderStatusUpdate(data: {
        orderId: string;
        studentId: string;
        parentId: string;
        newStatus: string;
        message?: string;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: {
            message: string;
            code: string;
        };
    }>;
    static sendNotification(request: NotificationRequest): Promise<{
        success: boolean;
        data?: any;
        error?: {
            message: string;
            code: string;
        };
    }>;
    static sendBulkNotifications(request: BulkNotificationRequest): Promise<{
        success: boolean;
        data?: {
            successful: number;
            failed: number;
            details: {
                successful: any[];
                failed: any[];
            };
        };
        error?: {
            message: string;
            code: string;
        };
    }>;
    static sendOrderConfirmation(data: OrderConfirmationData): Promise<void>;
    static markAsRead(notificationId: string, userId: string): Promise<{
        success: boolean;
        data?: any;
        error?: {
            message: string;
            code: string;
        };
    }>;
    static getUserNotifications(userId: string, options?: {
        page?: number;
        limit?: number;
        status?: NotificationStatus;
        unreadOnly?: boolean;
        priority?: NotificationPriority;
    }): Promise<{
        success: boolean;
        data?: {
            notifications: any[];
            pagination: any;
        };
        error?: {
            message: string;
            code: string;
        };
    }>;
    static updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<{
        success: boolean;
        data?: NotificationPreferences;
        error?: {
            message: string;
            code: string;
        };
    }>;
    static getNotificationAnalytics(_filters?: {
        startDate?: Date;
        endDate?: Date;
        templateId?: string;
        userId?: string;
    }): Promise<{
        success: boolean;
        data?: NotificationAnalytics;
        error?: {
            message: string;
            code: string;
        };
    }>;
}
export declare const notificationService: NotificationService;
export default NotificationService;
//# sourceMappingURL=notification.service.d.ts.map