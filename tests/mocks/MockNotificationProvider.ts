/**
 * Mock Notification Provider
 * 
 * Comprehensive mock implementation for notification services
 * used in load testing and integration testing scenarios.
 */

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
  deliveryStatus?: 'sent' | 'delivered' | 'failed' | 'pending';
  timestamp?: Date;
}

export interface NotificationConfig {
  successRate?: number; // 0-1, default 0.98
  averageDeliveryTime?: number; // milliseconds, default 200
  maxDeliveryTime?: number; // milliseconds, default 1000
  enableRandomFailures?: boolean; // default true
  enableDeliveryDelay?: boolean; // default true
  supportedChannels?: string[]; // default ['email', 'sms', 'whatsapp', 'push']
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

export class MockNotificationProvider {
  private config: Required<NotificationConfig>;
  private sentNotifications: Map<string, any> = new Map();
  private notificationCounter = 0;
  private deliveryQueue: Array<{ messageId: string; deliveryTime: number }> = [];

  constructor(config: Partial<NotificationConfig> = {}) {
    this.config = {
      successRate: config.successRate ?? 0.98,
      averageDeliveryTime: config.averageDeliveryTime ?? 200,
      maxDeliveryTime: config.maxDeliveryTime ?? 1000,
      enableRandomFailures: config.enableRandomFailures ?? true,
      enableDeliveryDelay: config.enableDeliveryDelay ?? true,
      supportedChannels: config.supportedChannels ?? ['email', 'sms', 'whatsapp', 'push'],
      ...config
    };

    // Start delivery simulation
    this.startDeliverySimulation();
  }

  /**
   * Send a notification
   */
  async sendNotification(data: NotificationData): Promise<NotificationResult> {
    // Simulate processing delay
    if (this.config.enableDeliveryDelay) {
      await this.simulateProcessingDelay();
    }

    const messageId = `mock_msg_${++this.notificationCounter}_${Date.now()}`;

    // Validate channel support
    if (!this.config.supportedChannels.includes(data.channel)) {
      return {
        success: false,
        error: 'unsupported_channel',
        message: `Channel ${data.channel} is not supported`
      };
    }

    // Validate recipient
    if (!data.to || (Array.isArray(data.to) && data.to.length === 0)) {
      return {
        success: false,
        error: 'invalid_recipient',
        message: 'Recipient is required'
      };
    }

    // Simulate random failures based on success rate
    const shouldSucceed = this.config.enableRandomFailures 
      ? Math.random() < this.config.successRate
      : true;

    if (!shouldSucceed) {
      const failureReason = this.getRandomFailureReason(data.channel);
      const notification = {
        id: messageId,
        ...data,
        status: 'failed',
        error: failureReason,
        sentAt: new Date(),
        deliveredAt: null,
        metadata: {
          ...data.metadata,
          provider: 'MockNotificationProvider',
          attempts: 1,
          failureReason
        }
      };

      this.sentNotifications.set(messageId, notification);

      return {
        success: false,
        messageId,
        error: failureReason,
        message: `Notification failed: ${failureReason}`,
        deliveryStatus: 'failed',
        timestamp: new Date()
      };
    }

    // Create successful notification record
    const notification = {
      id: messageId,
      ...data,
      status: 'sent',
      sentAt: new Date(),
      deliveredAt: null, // Will be set by delivery simulation
      metadata: {
        ...data.metadata,
        provider: 'MockNotificationProvider',
        attempts: 1,
        channel: data.channel,
        recipientCount: Array.isArray(data.to) ? data.to.length : 1
      }
    };

    // Store notification record
    this.sentNotifications.set(messageId, notification);

    // Schedule delivery simulation
    const deliveryTime = Date.now() + this.getRandomDeliveryTime();
    this.deliveryQueue.push({ messageId, deliveryTime });

    return {
      success: true,
      messageId,
      message: 'Notification sent successfully',
      deliveryStatus: 'sent',
      timestamp: new Date()
    };
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications: NotificationData[]): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    
    for (const notification of notifications) {
      const result = await this.sendNotification(notification);
      results.push(result);
    }

    return results;
  }

  /**
   * Send email notification
   */
  async sendEmail(to: string | string[], subject: string, body: string, options?: any): Promise<NotificationResult> {
    return this.sendNotification({
      to,
      channel: 'email',
      subject,
      message: body,
      ...options
    });
  }

  /**
   * Send SMS notification
   */
  async sendSMS(to: string | string[], message: string, options?: any): Promise<NotificationResult> {
    return this.sendNotification({
      to,
      channel: 'sms',
      message,
      ...options
    });
  }

  /**
   * Send WhatsApp notification
   */
  async sendWhatsApp(to: string | string[], message: string, options?: any): Promise<NotificationResult> {
    return this.sendNotification({
      to,
      channel: 'whatsapp',
      message,
      ...options
    });
  }

  /**
   * Send push notification
   */
  async sendPushNotification(to: string | string[], title: string, body: string, options?: any): Promise<NotificationResult> {
    return this.sendNotification({
      to,
      channel: 'push',
      subject: title,
      message: body,
      ...options
    });
  }

  /**
   * Get notification status
   */
  async getNotificationStatus(messageId: string): Promise<NotificationResult> {
    const notification = this.sentNotifications.get(messageId);
    
    if (!notification) {
      return {
        success: false,
        error: 'notification_not_found',
        message: `Notification with ID ${messageId} not found`
      };
    }

    return {
      success: true,
      messageId,
      deliveryStatus: notification.status as any,
      message: `Notification status: ${notification.status}`,
      timestamp: notification.deliveredAt || notification.sentAt
    };
  }

  /**
   * Get delivery statistics
   */
  getStatistics(): any {
    const notifications = Array.from(this.sentNotifications.values());
    const totalNotifications = notifications.length;
    const sentNotifications = notifications.filter(n => n.status === 'sent' || n.status === 'delivered').length;
    const deliveredNotifications = notifications.filter(n => n.status === 'delivered').length;
    const failedNotifications = notifications.filter(n => n.status === 'failed').length;

    // Channel statistics
    const channelStats = this.config.supportedChannels.reduce((stats, channel) => {
      const channelNotifications = notifications.filter(n => n.channel === channel);
      stats[channel] = {
        total: channelNotifications.length,
        sent: channelNotifications.filter(n => n.status === 'sent' || n.status === 'delivered').length,
        delivered: channelNotifications.filter(n => n.status === 'delivered').length,
        failed: channelNotifications.filter(n => n.status === 'failed').length
      };
      return stats;
    }, {} as Record<string, any>);

    return {
      totalNotifications,
      sentNotifications,
      deliveredNotifications,
      failedNotifications,
      sendSuccessRate: totalNotifications > 0 ? (sentNotifications / totalNotifications) * 100 : 0,
      deliveryRate: sentNotifications > 0 ? (deliveredNotifications / sentNotifications) * 100 : 0,
      channelStats,
      averageDeliveryTime: this.config.averageDeliveryTime,
      configuration: {
        successRate: this.config.successRate * 100,
        averageDeliveryTime: this.config.averageDeliveryTime,
        supportedChannels: this.config.supportedChannels
      }
    };
  }

  /**
   * Get all notifications (for testing/debugging)
   */
  getAllNotifications(): any[] {
    return Array.from(this.sentNotifications.values());
  }

  /**
   * Get notifications by channel
   */
  getNotificationsByChannel(channel: string): any[] {
    return this.getAllNotifications().filter(n => n.channel === channel);
  }

  /**
   * Get notifications by status
   */
  getNotificationsByStatus(status: string): any[] {
    return this.getAllNotifications().filter(n => n.status === status);
  }

  /**
   * Reset provider state
   */
  reset(): void {
    this.sentNotifications.clear();
    this.deliveryQueue.length = 0;
    this.notificationCounter = 0;
  }

  /**
   * Configure provider behavior
   */
  configure(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if notification exists
   */
  hasNotification(messageId: string): boolean {
    return this.sentNotifications.has(messageId);
  }

  /**
   * Get notification count
   */
  getNotificationCount(): number {
    return this.sentNotifications.size;
  }

  /**
   * Simulate processing delay
   */
  private async simulateProcessingDelay(): Promise<void> {
    const delay = Math.min(
      this.config.averageDeliveryTime / 4, // Processing is faster than delivery
      100 // Max 100ms processing time
    );
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get random delivery time
   */
  private getRandomDeliveryTime(): number {
    return Math.min(
      this.config.averageDeliveryTime + (Math.random() * 200 - 100), // ±100ms variance
      this.config.maxDeliveryTime
    );
  }

  /**
   * Get random failure reason for realistic testing
   */
  private getRandomFailureReason(channel: string): string {
    const commonReasons = [
      'network_error',
      'service_unavailable',
      'rate_limit_exceeded',
      'authentication_failed'
    ];

    const channelSpecificReasons = {
      email: ['invalid_email', 'blocked_recipient', 'spam_detected', 'mailbox_full'],
      sms: ['invalid_number', 'number_blocked', 'carrier_rejected', 'insufficient_credits'],
      whatsapp: ['number_not_registered', 'template_rejected', 'policy_violation', 'user_blocked'],
      push: ['invalid_token', 'app_uninstalled', 'device_unreachable', 'token_expired']
    };

    const allReasons = [...commonReasons, ...(channelSpecificReasons[channel as keyof typeof channelSpecificReasons] || [])];
    return allReasons[Math.floor(Math.random() * allReasons.length)];
  }

  /**
   * Start delivery simulation background process
   */
  private startDeliverySimulation(): void {
    setInterval(() => {
      const now = Date.now();
      const readyForDelivery = this.deliveryQueue.filter(item => item.deliveryTime <= now);
      
      readyForDelivery.forEach(item => {
        const notification = this.sentNotifications.get(item.messageId);
        if (notification && notification.status === 'sent') {
          // Simulate occasional delivery failures
          const deliverySucceeded = Math.random() < 0.99; // 99% delivery success for sent messages
          
          if (deliverySucceeded) {
            notification.status = 'delivered';
            notification.deliveredAt = new Date();
          } else {
            notification.status = 'failed';
            notification.error = 'delivery_failed';
            notification.metadata.failureReason = 'delivery_timeout';
          }
          
          this.sentNotifications.set(item.messageId, notification);
        }
      });

      // Remove processed items from queue
      this.deliveryQueue = this.deliveryQueue.filter(item => item.deliveryTime > now);
    }, 100); // Check every 100ms
  }
}