'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  Bell,
  BellOff,
  AlertCircle,
  CheckCircle,
  Settings,
  Clock,
  MessageSquare,
  ShoppingCart,
  Wallet,
  MapPin,
  Loader2,
  Volume2,
  VolumeX,
  Vibrate,
  Smartphone,
  X,
  Check,
} from 'lucide-react';

// Types for notifications
interface NotificationSettings {
  enabled: boolean;
  orders: boolean;
  delivery: boolean;
  wallet: boolean;
  reminders: boolean;
  promotions: boolean;
  emergency: boolean;
  sound: boolean;
  vibration: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag: string;
  timestamp: number;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  silent: boolean;
  requireInteraction: boolean;
  vibrate?: number[];
}

interface NotificationHistory {
  id: string;
  notification: PushNotification;
  status: 'delivered' | 'clicked' | 'dismissed';
  timestamp: number;
}

// Default notification settings
const defaultSettings: NotificationSettings = {
  enabled: false,
  orders: true,
  delivery: true,
  wallet: true,
  reminders: true,
  promotions: false,
  emergency: true,
  sound: true,
  vibration: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
  },
};

// Push notification hook
export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<NotificationHistory[]>([]);

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      const supported =
        'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
        loadSettings();
        loadHistory();
      }
    };

    checkSupport();
  }, []);

  // Load settings from localStorage
  const loadSettings = useCallback(() => {
    try {
      const stored = localStorage.getItem('hasivu-notification-settings');
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch (error) {}
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: NotificationSettings) => {
    try {
      localStorage.setItem('hasivu-notification-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {}
  }, []);

  // Load notification history
  const loadHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem('hasivu-notification-history');
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed.slice(-50)); // Keep last 50 notifications
      }
    } catch (error) {}
  }, []);

  // Save notification to history
  const saveToHistory = useCallback(
    (notification: PushNotification, status: 'delivered' | 'clicked' | 'dismissed') => {
      const historyItem: NotificationHistory = {
        id: `${notification.id}-${Date.now()}`,
        notification,
        status,
        timestamp: Date.now(),
      };

      setHistory(prev => {
        const updated = [historyItem, ...prev].slice(0, 50);
        try {
          localStorage.setItem('hasivu-notification-history', JSON.stringify(updated));
        } catch (error) {}
        return updated;
      });
    },
    []
  );

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    setIsLoading(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // Update settings
        saveSettings({ ...settings, enabled: true });
      }

      return result === 'granted';
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, settings, saveSettings]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || permission !== 'granted') return null;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
        return existingSubscription;
      }

      // Create new subscription
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      setSubscription(newSubscription);

      // Send subscription to server
      await fetch('/api/v1/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: newSubscription.toJSON(),
          settings,
        }),
      });

      return newSubscription;
    } catch (error) {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, settings]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) return false;

    setIsLoading(true);

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Notify server
      await fetch('/api/v1/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      // Update settings
      saveSettings({ ...settings, enabled: false });

      return true;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscription, settings, saveSettings]);

  // Update notification settings
  const updateSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      const updated = { ...settings, ...newSettings };
      saveSettings(updated);

      // If subscribed, update server settings
      if (subscription) {
        try {
          await fetch('/api/v1/notifications/settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
              settings: updated,
            }),
          });
        } catch (error) {}
      }
    },
    [settings, subscription, saveSettings]
  );

  // Show local notification (for testing)
  const showLocalNotification = useCallback(
    async (notification: Partial<PushNotification>) => {
      if (permission !== 'granted') return false;

      try {
        const notif = new Notification(notification.title || 'HASIVU Notification', {
          body: notification.body || '',
          icon: notification.icon || '/icons/icon-192x192.png',
          badge: notification.badge || '/icons/badge-72x72.png',
          tag: notification.tag || 'hasivu-local',
          data: notification.data,
          requireInteraction: notification.requireInteraction || false,
          silent: notification.silent || false,
          vibrate: notification.vibrate || (settings.vibration ? [100, 50, 100] : []),
        });

        // Handle notification events
        notif.onclick = event => {
          event.preventDefault();
          notif.close();

          // Handle notification click
          if (notification.data?.url) {
            window.focus();
            window.location.href = notification.data.url;
          }

          saveToHistory(notification as PushNotification, 'clicked');
        };

        notif.onclose = () => {
          saveToHistory(notification as PushNotification, 'dismissed');
        };

        saveToHistory(notification as PushNotification, 'delivered');

        return true;
      } catch (error) {
        return false;
      }
    },
    [permission, settings.vibration, saveToHistory]
  );

  // Check if in quiet hours
  const isInQuietHours = useCallback(() => {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const { start, end } = settings.quietHours;

    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  }, [settings.quietHours]);

  return {
    isSupported,
    permission,
    subscription,
    settings,
    history,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    updateSettings,
    showLocalNotification,
    isInQuietHours,
  };
};

// Notification Settings Component
interface NotificationSettingsProps {
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className }) => {
  const {
    isSupported,
    permission,
    subscription,
    settings,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    updateSettings,
  } = usePushNotifications();

  const handleToggleNotifications = async () => {
    if (subscription) {
      await unsubscribe();
    } else {
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return;
      }
      await subscribe();
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    updateSettings({ [key]: value });
  };

  const handleQuietHoursChange = (field: 'enabled' | 'start' | 'end', value: boolean | string) => {
    updateSettings({
      quietHours: {
        ...settings.quietHours,
        [field]: value,
      },
    });
  };

  if (!isSupported) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Push notifications are not supported in this browser.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {subscription ? (
              <Bell className="h-5 w-5 text-green-600" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <h3 className="font-semibold">Push Notifications</h3>
              <p className="text-sm text-gray-600">{subscription ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>

          <Button
            onClick={handleToggleNotifications}
            disabled={isLoading}
            variant={subscription ? 'destructive' : 'default'}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : subscription ? (
              'Disable'
            ) : (
              'Enable'
            )}
          </Button>
        </div>

        {permission === 'denied' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Notifications are blocked. Please enable them in your browser settings and refresh the
              page.
            </AlertDescription>
          </Alert>
        )}

        {/* Notification Categories */}
        {subscription && (
          <div className="space-y-4">
            <h4 className="font-medium">Notification Types</h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">Order Updates</div>
                    <div className="text-xs text-gray-600">
                      Order confirmation, preparation, ready for pickup
                    </div>
                  </div>
                </div>
                <Switch
                  checked={settings.orders}
                  onCheckedChange={checked => handleSettingChange('orders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-sm font-medium">Delivery Tracking</div>
                    <div className="text-xs text-gray-600">
                      Live delivery updates and location sharing
                    </div>
                  </div>
                </div>
                <Switch
                  checked={settings.delivery}
                  onCheckedChange={checked => handleSettingChange('delivery', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Wallet className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium">Wallet & Payments</div>
                    <div className="text-xs text-gray-600">
                      Low balance alerts, payment confirmations
                    </div>
                  </div>
                </div>
                <Switch
                  checked={settings.wallet}
                  onCheckedChange={checked => handleSettingChange('wallet', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="text-sm font-medium">Meal Reminders</div>
                    <div className="text-xs text-gray-600">Lunch time reminders, menu updates</div>
                  </div>
                </div>
                <Switch
                  checked={settings.reminders}
                  onCheckedChange={checked => handleSettingChange('reminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-4 w-4 text-pink-600" />
                  <div>
                    <div className="text-sm font-medium">Promotions</div>
                    <div className="text-xs text-gray-600">
                      Special offers, discounts, new menu items
                    </div>
                  </div>
                </div>
                <Switch
                  checked={settings.promotions}
                  onCheckedChange={checked => handleSettingChange('promotions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="text-sm font-medium">Emergency Alerts</div>
                    <div className="text-xs text-gray-600">School closures, safety alerts</div>
                  </div>
                </div>
                <Switch
                  checked={settings.emergency}
                  onCheckedChange={checked => handleSettingChange('emergency', checked)}
                  disabled // Emergency alerts should always be enabled
                />
              </div>
            </div>
          </div>
        )}

        {/* Sound & Vibration Settings */}
        {subscription && (
          <div className="space-y-4">
            <h4 className="font-medium">Sound & Vibration</h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Volume2 className="h-4 w-4" />
                  <span className="text-sm">Sound</span>
                </div>
                <Switch
                  checked={settings.sound}
                  onCheckedChange={checked => handleSettingChange('sound', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Vibrate className="h-4 w-4" />
                  <span className="text-sm">Vibration</span>
                </div>
                <Switch
                  checked={settings.vibration}
                  onCheckedChange={checked => handleSettingChange('vibration', checked)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Quiet Hours */}
        {subscription && (
          <div className="space-y-4">
            <h4 className="font-medium">Quiet Hours</h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enable quiet hours</span>
                <Switch
                  checked={settings.quietHours.enabled}
                  onCheckedChange={checked => handleQuietHoursChange('enabled', checked)}
                />
              </div>

              {settings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">Start</label>
                    <input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={e => handleQuietHoursChange('start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">End</label>
                    <input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={e => handleQuietHoursChange('end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Notification History Component
interface NotificationHistoryProps {
  className?: string;
  limit?: number;
}

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({
  className,
  limit = 10,
}) => {
  const { history } = usePushNotifications();

  const getStatusIcon = (status: NotificationHistory['status']) => {
    switch (status) {
      case 'delivered':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'clicked':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'dismissed':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: NotificationHistory['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-blue-50 text-blue-800';
      case 'clicked':
        return 'bg-green-50 text-green-800';
      case 'dismissed':
        return 'bg-gray-50 text-gray-800';
      default:
        return 'bg-gray-50 text-gray-800';
    }
  };

  const displayHistory = history.slice(0, limit);

  if (displayHistory.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center text-gray-500">
          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No notification history</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-4', className)}>
      <h3 className="font-semibold mb-4">Recent Notifications</h3>

      <div className="space-y-3">
        {displayHistory.map(item => (
          <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium truncate">{item.notification.title}</h4>
                <Badge className={cn('text-xs', getStatusColor(item.status))}>{item.status}</Badge>
              </div>

              <p className="text-sm text-gray-600 mt-1">{item.notification.body}</p>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleString()}
                </span>

                {item.notification.tag && (
                  <Badge variant="outline" className="text-xs">
                    {item.notification.tag}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {history.length > limit && (
        <div className="text-center mt-4">
          <Button variant="ghost" size="sm">
            View All ({history.length})
          </Button>
        </div>
      )}
    </Card>
  );
};

// Test Notification Component
interface TestNotificationProps {
  className?: string;
}

export const TestNotification: React.FC<TestNotificationProps> = ({ className }) => {
  const { showLocalNotification, subscription } = usePushNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const testNotifications = [
    {
      title: 'Order Ready!',
      body: 'Your lunch order #1234 is ready for pickup at the cafeteria.',
      tag: 'order-ready',
      data: { orderId: '1234', url: '/orders/1234' },
      requireInteraction: true,
      vibrate: [200, 100, 200],
    },
    {
      title: 'Delivery Update',
      body: 'Your meal delivery is 5 minutes away. Please be ready!',
      tag: 'delivery-update',
      data: { deliveryId: 'del456', url: '/delivery/del456' },
      vibrate: [100, 50, 100],
    },
    {
      title: 'Low Wallet Balance',
      body: 'Your wallet balance is low (₹25). Please top up to continue ordering.',
      tag: 'wallet-balance',
      data: { balance: 25, url: '/wallet' },
      vibrate: [50],
    },
    {
      title: 'Lunch Reminder',
      body: "Don't forget to order your lunch! Today's special: Butter Chicken Rice.",
      tag: 'meal-reminder',
      data: { url: '/menu' },
      silent: true,
    },
  ];

  const handleTestNotification = async (notification: any) => {
    if (!subscription) return;

    setIsLoading(true);

    try {
      await showLocalNotification({
        ...notification,
        id: `test-${Date.now()}`,
      });
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  if (!subscription) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Enable push notifications to test notification delivery.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={cn('p-4', className)}>
      <h3 className="font-semibold mb-4">Test Notifications</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {testNotifications.map((notification, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => handleTestNotification(notification)}
            disabled={isLoading}
            className="h-auto p-3 text-left justify-start"
          >
            <div>
              <div className="font-medium text-sm">{notification.title}</div>
              <div className="text-xs text-gray-600 mt-1">{notification.body.slice(0, 50)}...</div>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
};
