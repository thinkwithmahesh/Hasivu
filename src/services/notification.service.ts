/**
 * Notification Service
 * Business logic for notification management
 */

import { PrismaClient, Notification } from '@prisma/client';

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

// Enums
export const NotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  EXPIRED: 'expired',
} as const;

export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

export const NotificationPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority];

export type NotificationChannel = 'push' | 'email' | 'sms' | 'whatsapp' | 'in_app' | 'socket';

// Request/Response types
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
  channelStats: Record<
    NotificationChannel,
    {
      sent: number;
      delivered: number;
      read: number;
      failed: number;
    }
  >;
  templateStats: Record<
    string,
    {
      sent: number;
      delivered: number;
      read: number;
    }
  >;
  timeSeries: Array<{
    date: string;
    sent: number;
    delivered: number;
    read: number;
  }>;
}

export class NotificationService {
  private static instance: NotificationService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async findById(id: string): Promise<Notification | null> {
    return await this.prisma.notification.findUnique({
      where: { id },
    });
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUnread(userId: string): Promise<Notification[]> {
    return await this.prisma.notification.findMany({
      where: {
        userId,
        readAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(filters?: NotificationFilters): Promise<Notification[]> {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    return await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateNotificationData): Promise<Notification> {
    return await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ? JSON.stringify(data.data) : null,
        scheduledFor: data.scheduledFor,
        status: 'pending',
        isRead: false,
      } as any,
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return await this.prisma.notification.update({
      where: { id },
      data: {
        readAt: new Date(),
        status: 'read',
      },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: 'read',
      },
    });
    return result.count;
  }

  async delete(id: string): Promise<Notification> {
    return await this.prisma.notification.delete({
      where: { id },
    });
  }

  async deleteOld(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        readAt: { not: null },
      },
    });

    return result.count;
  }

  async sendPushNotification(userId: string, notification: CreateNotificationData): Promise<void> {
    // Stub for push notification integration (e.g., Firebase, OneSignal)
    // Would integrate with push service here
    // await pushService.send(userId, notification);
  }

  // Static methods for order notifications
  public static async sendOrderStatusUpdate(data: {
    orderId: string;
    studentId: string;
    parentId: string;
    newStatus: string;
    message?: string;
  }): Promise<{ success: boolean; data?: any; error?: { message: string; code: string } }> {
    try {
      const notificationData: CreateNotificationData = {
        userId: data.parentId,
        type: 'order_status_update',
        title: `Order Status Update`,
        message:
          data.message || `Your order ${data.orderId} status has been updated to ${data.newStatus}`,
        data: {
          orderId: data.orderId,
          studentId: data.studentId,
          newStatus: data.newStatus,
        },
      };

      const notification = await this.getInstance().create(notificationData);
      await this.getInstance().sendPushNotification(data.parentId, notificationData);

      return { success: true, data: notification };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to send notification',
          code: 'NOTIFICATION_FAILED',
        },
      };
    }
  }

  // Main notification sending methods
  public static async sendNotification(
    request: NotificationRequest
  ): Promise<{ success: boolean; data?: any; error?: { message: string; code: string } }> {
    try {
      // Get user preferences
      const userPrefs = await this.getUserNotificationPreferences(request.recipientId);

      // Get template content (stub - would integrate with template system)
      const templateContent = await this.getNotificationTemplate(
        request.templateId,
        request.variables
      );

      if (!templateContent) {
        return {
          success: false,
          error: {
            message: 'Notification template not found',
            code: 'TEMPLATE_NOT_FOUND',
          },
        };
      }

      const notificationData: CreateNotificationData = {
        userId: request.recipientId,
        type: request.templateId,
        title: templateContent.title,
        message: templateContent.message,
        data: {
          ...request.variables,
          channels: request.channels,
          priority: request.priority,
        },
        scheduledFor: request.expiresAt,
      };

      const notification = await this.getInstance().create(notificationData);

      // Send through enabled channels
      const enabledChannels = this.getEnabledChannels(request.channels, userPrefs);
      const deliveryResults = await this.deliverNotification(notification, enabledChannels);

      // Update notification status based on delivery results
      if (deliveryResults.some(r => r.success)) {
        await this.getInstance().prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'sent' },
        });
      }

      return {
        success: true,
        data: {
          notification,
          deliveryResults,
          templateData: templateContent,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to send notification',
          code: 'NOTIFICATION_SEND_FAILED',
        },
      };
    }
  }

  public static async sendBulkNotifications(request: BulkNotificationRequest): Promise<{
    success: boolean;
    data?: { successful: number; failed: number; details: { successful: any[]; failed: any[] } };
    error?: { message: string; code: string };
  }> {
    try {
      let successful = 0;
      let failed = 0;
      const details: { successful: any[]; failed: any[] } = { successful: [], failed: [] };

      // Process in batches of 10 to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < request.recipients.length; i += batchSize) {
        const batch = request.recipients.slice(i, i + batchSize);
        const batchPromises = batch.map(async recipient => {
          try {
            const notificationRequest: NotificationRequest = {
              templateId: request.templateId,
              recipientId: recipient.recipientId,
              recipientType: recipient.recipientType,
              channels: request.channels,
              variables: recipient.variables,
              priority: request.priority,
            };

            const result = await this.sendNotification(notificationRequest);
            if (result.success) {
              successful++;
              details.successful.push({ recipientId: recipient.recipientId });
            } else {
              failed++;
              details.failed.push({ recipientId: recipient.recipientId, error: result.error });
            }
          } catch (error) {
            failed++;
            details.failed.push({
              recipientId: recipient.recipientId,
              error: { message: 'Processing failed' },
            });
          }
        });

        // Wait for current batch to complete before processing next batch
        await Promise.all(batchPromises);
      }

      return { success: true, data: { successful, failed, details } };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to send bulk notifications',
          code: 'BULK_SEND_FAILED',
        },
      };
    }
  }

  public static async sendOrderConfirmation(data: OrderConfirmationData): Promise<void> {
    const notificationRequest: NotificationRequest = {
      templateId: 'order_confirmation',
      recipientId: data.parentId,
      recipientType: 'parent',
      variables: {
        orderId: data.orderId,
        totalAmount: data.totalAmount.toString(),
        deliveryDate: data.deliveryDate.toISOString().split('T')[0],
      },
      priority: 'normal',
    };

    const result = await this.sendNotification(notificationRequest);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to send order confirmation');
    }
  }

  // Notification management methods
  public static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<{ success: boolean; data?: any; error?: { message: string; code: string } }> {
    try {
      const notification = await this.getInstance().findById(notificationId);
      if (!notification) {
        return {
          success: false,
          error: { message: 'Notification not found', code: 'NOTIFICATION_NOT_FOUND' },
        };
      }

      if (notification.userId !== userId) {
        return { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
      }

      const updated = await this.getInstance().markAsRead(notificationId);
      return { success: true, data: updated };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to mark notification as read',
          code: 'MARK_READ_FAILED',
        },
      };
    }
  }

  public static async getUserNotifications(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: NotificationStatus;
      unreadOnly?: boolean;
      priority?: NotificationPriority;
    }
  ): Promise<{
    success: boolean;
    data?: { notifications: any[]; pagination: any };
    error?: { message: string; code: string };
  }> {
    try {
      const page = options?.page || 1;
      const limit = Math.min(options?.limit || 20, 100); // Max 100 per page
      const skip = (page - 1) * limit;

      const where: any = { recipientId: userId };

      if (options?.status) {
        where.status = options.status;
      }

      if (options?.unreadOnly) {
        where.status = { in: ['pending', 'sent', 'delivered'] };
      }

      if (options?.priority) {
        where.priority = options.priority;
      }

      const notifications = await this.getInstance().prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const total = await this.getInstance().prisma.notification.count({ where });

      return {
        success: true,
        data: {
          notifications,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get user notifications',
          code: 'GET_NOTIFICATIONS_FAILED',
        },
      };
    }
  }

  public static async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<{
    success: boolean;
    data?: NotificationPreferences;
    error?: { message: string; code: string };
  }> {
    try {
      // Get current preferences (stub - would get from database/cache)
      const currentPrefs: NotificationPreferences = {
        channels: {
          push: true,
          email: true,
          sms: false,
          whatsapp: true,
          in_app: true,
          socket: true,
        },
        quietHours: { enabled: false, startTime: '22:00', endTime: '08:00', timezone: 'UTC' },
        frequency: {
          email: 'immediate',
          push: 'immediate',
          sms: 'urgent_only',
          whatsapp: 'immediate',
        },
        topics: {
          orderUpdates: true,
          paymentUpdates: true,
          systemAnnouncements: true,
          promotions: false,
        },
      };

      const updatedPrefs = { ...currentPrefs, ...preferences };

      // Update user preferences (stub - would save to database)
      // await this.getInstance().prisma.user.update({ ... })

      return { success: true, data: updatedPrefs };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to update preferences',
          code: 'PREFERENCES_UPDATE_FAILED',
        },
      };
    }
  }

  // Helper methods for notification delivery
  private static async getUserNotificationPreferences(
    userId: string
  ): Promise<NotificationPreferences> {
    // Stub implementation - would fetch from database/cache
    return {
      channels: {
        push: true,
        email: true,
        sms: false,
        whatsapp: true,
        in_app: true,
        socket: true,
      },
      quietHours: { enabled: false, startTime: '22:00', endTime: '08:00', timezone: 'UTC' },
      frequency: {
        email: 'immediate',
        push: 'immediate',
        sms: 'urgent_only',
        whatsapp: 'immediate',
      },
      topics: {
        orderUpdates: true,
        paymentUpdates: true,
        systemAnnouncements: true,
        promotions: false,
      },
    };
  }

  private static async getNotificationTemplate(
    templateId: string,
    variables: Record<string, any> = {}
  ): Promise<{ title: string; message: string } | null> {
    // Stub template system - would integrate with actual template engine
    const templates: Record<string, { title: string; message: string }> = {
      order_confirmation: {
        title: 'Order Confirmed',
        message: `Your order #${variables.orderId || 'N/A'} has been confirmed for ${variables.deliveryDate || 'N/A'}. Total: ₹${variables.totalAmount || 'N/A'}`,
      },
      order_status_update: {
        title: 'Order Status Update',
        message: `Your order status has been updated to: ${variables.newStatus || 'N/A'}`,
      },
      payment_success: {
        title: 'Payment Successful',
        message: `Payment of ₹${variables.amount || 'N/A'} has been processed successfully.`,
      },
      delivery_reminder: {
        title: 'Delivery Reminder',
        message: `Your order will be delivered today at ${variables.deliveryTime || 'N/A'}.`,
      },
    };

    return templates[templateId] || null;
  }

  private static getEnabledChannels(
    requestedChannels: NotificationChannel[] | undefined,
    userPrefs: NotificationPreferences
  ): NotificationChannel[] {
    const defaultChannels: NotificationChannel[] = ['in_app'];
    const availableChannels = requestedChannels || defaultChannels;

    return availableChannels.filter(channel => {
      // Check if channel is enabled in user preferences
      switch (channel) {
        case 'push':
          return userPrefs.channels.push;
        case 'email':
          return userPrefs.channels.email;
        case 'sms':
          return userPrefs.channels.sms;
        case 'whatsapp':
          return userPrefs.channels.whatsapp;
        case 'in_app':
          return userPrefs.channels.in_app;
        case 'socket':
          return userPrefs.channels.socket;
        default:
          return false;
      }
    });
  }

  private static async deliverNotification(
    notification: Notification,
    channels: NotificationChannel[]
  ): Promise<Array<{ channel: NotificationChannel; success: boolean; error?: string }>> {
    const results: Array<{ channel: NotificationChannel; success: boolean; error?: string }> = [];

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'push':
            if (notification.userId && notification.title && notification.message) {
              await this.getInstance().sendPushNotification(notification.userId, {
                userId: notification.userId,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data ? JSON.parse(notification.data) : undefined,
              });
            }
            break;

          case 'email':
            await this.sendEmailNotification(notification);
            break;

          case 'sms':
            await this.sendSMSNotification(notification);
            break;

          case 'whatsapp':
            await this.sendWhatsAppNotification(notification);
            break;

          case 'in_app':
            // Already stored in database, just mark as delivered
            await this.getInstance().prisma.notification.update({
              where: { id: notification.id },
              data: { status: 'delivered' },
            });
            break;

          case 'socket':
            await this.sendSocketNotification(notification);
            break;
        }

        results.push({ channel, success: true });
      } catch (error: any) {
        results.push({ channel, success: false, error: error.message });
      }
    }

    return results;
  }

  private static async sendEmailNotification(notification: Notification): Promise<void> {
    // Stub - would integrate with email service (SendGrid, SES, etc.)
    console.log(`Sending email notification: ${notification.title} to user ${notification.userId}`);
  }

  private static async sendSMSNotification(notification: Notification): Promise<void> {
    // Stub - would integrate with SMS service (Twilio, etc.)
    console.log(`Sending SMS notification: ${notification.title} to user ${notification.userId}`);
  }

  private static async sendWhatsAppNotification(notification: Notification): Promise<void> {
    // Stub - would integrate with WhatsApp Business API
    console.log(
      `Sending WhatsApp notification: ${notification.title} to user ${notification.userId}`
    );
  }

  private static async sendSocketNotification(notification: Notification): Promise<void> {
    // Stub - would integrate with WebSocket service
    console.log(
      `Sending socket notification: ${notification.title} to user ${notification.userId}`
    );
  }

  public static async getNotificationAnalytics(filters?: {
    startDate?: Date;
    endDate?: Date;
    templateId?: string;
    userId?: string;
  }): Promise<{
    success: boolean;
    data?: NotificationAnalytics;
    error?: { message: string; code: string };
  }> {
    try {
      const where: any = {};

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      if (filters?.templateId) {
        where.type = filters.templateId;
      }

      if (filters?.userId) {
        where.userId = filters.userId;
      }

      const notifications = await this.getInstance().prisma.notification.findMany({
        where,
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
        },
      });

      const totalSent = notifications.length;
      const totalDelivered = notifications.filter(n =>
        ['delivered', 'read'].includes(n.status)
      ).length;
      const totalRead = notifications.filter(n => n.status === 'read').length;

      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      const readRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;

      // Channel stats (simplified - would need channel tracking in database)
      const channelStats: NotificationAnalytics['channelStats'] = {
        push: { sent: 0, delivered: 0, read: 0, failed: 0 },
        email: { sent: 0, delivered: 0, read: 0, failed: 0 },
        sms: { sent: 0, delivered: 0, read: 0, failed: 0 },
        whatsapp: { sent: 0, delivered: 0, read: 0, failed: 0 },
        in_app: {
          sent: totalSent,
          delivered: totalDelivered,
          read: totalRead,
          failed: totalSent - totalDelivered,
        },
        socket: { sent: 0, delivered: 0, read: 0, failed: 0 },
      };

      // Template stats
      const templateStats: NotificationAnalytics['templateStats'] = {};
      notifications.forEach(notification => {
        if (!templateStats[notification.type]) {
          templateStats[notification.type] = { sent: 0, delivered: 0, read: 0 };
        }
        templateStats[notification.type].sent++;
        if (['delivered', 'read'].includes(notification.status)) {
          templateStats[notification.type].delivered++;
        }
        if (notification.status === 'read') {
          templateStats[notification.type].read++;
        }
      });

      // Time series (simplified)
      const timeSeries: NotificationAnalytics['timeSeries'] = [];
      // Would group by date in real implementation

      const analytics: NotificationAnalytics = {
        totalSent,
        totalDelivered,
        totalRead,
        deliveryRate,
        readRate,
        channelStats,
        templateStats,
        timeSeries,
      };

      return { success: true, data: analytics };
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message || 'Failed to get analytics', code: 'ANALYTICS_FAILED' },
      };
    }
  }
}

export const notificationService = NotificationService.getInstance();
export default NotificationService;
