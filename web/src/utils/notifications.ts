 * HASIVU Platform - Notification Utilities
 * Push notifications, browser notifications, and notification management
 * Handles service worker registration and notification permissions;
import { NOTIFICATION_TYPES, NotificationType } from './constants';
 * Notification permission status;
export type NotificationPermission = 'default' | 'granted' | 'denied';
 * Notification configuration interface;
 * Push subscription configuration;
 * Notification manager class;
   * Initialize notification system;
  async initialize(): Promise<boolean> {}
  // Register service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Notification system initialized');
      return true;
   * Request notification permission;
  async requestPermission(): Promise<NotificationPermission> {}
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission as NotificationPermission;
   * Get current notification permission;
  getPermission(): NotificationPermission {}
    return Notification.permission as NotificationPermission;
   * Check if notifications are supported and permitted;
  isSupported(): boolean {}
   * Show browser notification;
  async showNotification(config: NotificationConfig): Promise<void> {}
      const notification = new Notification(config.title, {}
      // Handle notification click
      // TODO: Refactor this function - it may be too long
      notification.onclick = (event
        notification.close();
  // Auto-close after 5 seconds unless requireInteraction is true
      if (!config.requireInteraction) {}
        }, 5000);
   * Show service worker notification (for push notifications);
  async showServiceWorkerNotification(config: NotificationConfig): Promise<void> {}
      await this.serviceWorkerRegistration.showNotification(config.title, {}
   * Subscribe to push notifications;
  async subscribeToPush(): Promise<PushSubscription | null> {}
      if (!this.vapidPublicKey) {}
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({}
      console.log('Push subscription created:', subscription);
      return subscription;
   * Unsubscribe from push notifications;
  async unsubscribeFromPush(): Promise<boolean> {}
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {}
      return false;
   * Get current push subscription;
  async getPushSubscription(): Promise<PushSubscription | null> {}
      return await this.serviceWorkerRegistration.pushManager.getSubscription();
   * Convert VAPID key to Uint8Array;
  private urlBase64ToUint8Array(base64String: string): Uint8Array {}
    return outputArray;
 * Create singleton notification manager;
export const notificationManager = new NotificationManager();
 * Predefined notification templates for HASIVU platform;
export const notificationTemplates = {}
    body: `Your order ${orderCode} for ${total} has been confirmed and is being prepared.``
    tag: `order-${orderCode}``
      url: `/orders/${orderCode}``
    body: `Your order ${orderCode} is ready for pickup. Please collect it from the designated counter.``
    tag: `order-${orderCode}``
      url: `/orders/${orderCode}``
    body: `Your order ${orderCode} has been successfully delivered. Enjoy your meal!``
    tag: `order-${orderCode}``
      url: `/orders/${orderCode}``
    body: `Your payment of ${amount} has been processed successfully.``
    body: `Your wallet balance is ${balance}. Top up now to avoid payment issues.``
    body: `Check out our new item: ${itemName}. Available now!``
    body: `System maintenance scheduled at ${startTime} for ${duration}. Plan your orders accordingly.``