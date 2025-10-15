/**
 * HASIVU Platform - Notification Center Component
 * Epic 6: Notifications & Communication System - Story 6.3
 *
 * In-app notification system with real-time updates, categorization,
 * and user interaction management
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription as _CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Avatar as _Avatar,
  AvatarFallback as _AvatarFallback,
  AvatarImage as _AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  MoreHorizontal,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  CreditCard,
  ShoppingCart,
  Star,
  RefreshCw,
} from 'lucide-react';
import { NotificationService } from '@/services/notification.service';
import { notificationsApi, handleApiError as _handleApiError, wsManager } from '@/services/api';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'payment' | 'system' | 'promotion';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface NotificationCenterProps {
  userId: string;
  className?: string;
  maxHeight?: string;
  showHeader?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const NOTIFICATION_TYPES = {
  info: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  success: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  warning: { icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  error: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
  order: { icon: ShoppingCart, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  payment: { icon: CreditCard, color: 'text-green-600', bgColor: 'bg-green-50' },
  system: { icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  promotion: { icon: Star, color: 'text-orange-600', bgColor: 'bg-orange-50' },
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  className,
  maxHeight = '400px',
  showHeader = true,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const refreshTimerRef = useRef<NodeJS.Timeout>();

  const _notificationService = NotificationService.getInstance();

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getNotifications({
        page: 1,
        limit: 50,
      });

      if (response.success && response.data) {
        // Transform API response to match component interface
        const transformedNotifications: NotificationItem[] = response.data.map(
          (notification: any) => ({
            id: notification.id,
            type: notification.type || 'info',
            title: notification.title || 'Notification',
            message: notification.body || notification.message || '',
            timestamp: notification.createdAt || notification.timestamp || new Date().toISOString(),
            read: notification.status === 'read',
            actionUrl: notification.actionUrl,
            actionText: notification.actionText,
            metadata: notification.metadata,
            priority: notification.priority || 'medium',
          })
        );

        setNotifications(transformedNotifications);
        setUnreadCount(transformedNotifications.filter(n => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh notifications
  useEffect(() => {
    loadNotifications();

    if (autoRefresh) {
      refreshTimerRef.current = setInterval(loadNotifications, refreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [userId, autoRefresh, refreshInterval]);

  // WebSocket setup for real-time notifications
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      wsManager.connect(token);

      // Subscribe to notification events
      wsManager.subscribe('notification', (data: any) => {
        const newNotification: NotificationItem = {
          id: data.id,
          type: data.type || 'info',
          title: data.title || 'New Notification',
          message: data.message || '',
          timestamp: data.timestamp || new Date().toISOString(),
          read: false,
          actionUrl: data.actionUrl,
          actionText: data.actionText,
          metadata: data.metadata,
          priority: data.priority || 'medium',
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      // Subscribe to notification updates (mark as read, etc.)
      wsManager.subscribe('notification_update', (data: any) => {
        if (data.action === 'mark_read') {
          setNotifications(prev =>
            prev.map(notification =>
              data.notificationIds.includes(notification.id)
                ? { ...notification, read: true }
                : notification
            )
          );
          setUnreadCount(prev => Math.max(0, prev - data.notificationIds.length));
        } else if (data.action === 'delete') {
          setNotifications(prev =>
            prev.filter(notification => !data.notificationIds.includes(notification.id))
          );
          // Update unread count based on deleted notifications
          const deletedUnread = notifications.filter(
            n => data.notificationIds.includes(n.id) && !n.read
          ).length;
          setUnreadCount(prev => Math.max(0, prev - deletedUnread));
        }
      });
    }

    return () => {
      wsManager.unsubscribe('notification');
      wsManager.unsubscribe('notification_update');
    };
  }, [userId]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // Optimistically update UI first
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Make API call
      const response = await notificationsApi.markAsRead([notificationId]);
      if (!response.success) {
        // Revert optimistic update on failure
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId ? { ...notification, read: false } : notification
          )
        );
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      // Revert optimistic update on error
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId ? { ...notification, read: false } : notification
        )
      );
      setUnreadCount(prev => prev + 1);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      // Optimistically update UI first
      const unreadNotificationIds = notifications.filter(n => !n.read).map(n => n.id);

      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);

      // Make API call
      const response = await notificationsApi.markAllAsRead();
      if (!response.success) {
        // Revert optimistic update on failure
        setNotifications(prev => prev.map(notification => ({ ...notification, read: false })));
        setUnreadCount(unreadNotificationIds.length);
      }
    } catch (error) {
      // Revert optimistic update on error
      const unreadNotificationIds = notifications.filter(n => !n.read).map(n => n.id);
      setNotifications(prev => prev.map(notification => ({ ...notification, read: false })));
      setUnreadCount(unreadNotificationIds.length);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;

      // Optimistically update UI first
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Make API call
      const response = await notificationsApi.deleteNotification(notificationId);
      if (!response.success) {
        // Revert optimistic update on failure - would need to restore the notification
        // For now, just log the error since we can't easily restore deleted items
        loadNotifications(); // Reload to get current state
      }
    } catch (error) {
      // Revert optimistic update on error
      loadNotifications(); // Reload to get current state
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Filter notifications based on active tab and additional filters
  const filteredNotifications = notifications.filter(notification => {
    // First apply tab filter
    let passesTabFilter = true;
    switch (activeTab) {
      case 'unread':
        passesTabFilter = !notification.read;
        break;
      case 'orders':
        passesTabFilter = notification.type === 'order';
        break;
      case 'payments':
        passesTabFilter = notification.type === 'payment';
        break;
      case 'system':
        passesTabFilter = ['system', 'warning', 'error'].includes(notification.type);
        break;
      case 'promotions':
        passesTabFilter = notification.type === 'promotion';
        break;
      default:
        passesTabFilter = true;
    }

    return passesTabFilter;
  });

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Get notification icon and colors
  const getNotificationStyle = (type: string) => {
    return NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES] || NOTIFICATION_TYPES.info;
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={loadNotifications}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={clearAllNotifications}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear all
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6 pb-2">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all" className="text-xs">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                Unread ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="orders" className="text-xs">
                Orders
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs">
                Payments
              </TabsTrigger>
              <TabsTrigger value="promotions" className="text-xs">
                Promotions
              </TabsTrigger>
              <TabsTrigger value="system" className="text-xs">
                System
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className={cn('px-6', maxHeight ? `h-[${maxHeight}]` : 'h-96')}>
              {filteredNotifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">
                    {activeTab === 'unread'
                      ? 'No unread notifications'
                      : activeTab === 'all'
                        ? 'No notifications yet'
                        : activeTab === 'promotions'
                          ? 'No promotional notifications'
                          : `No ${activeTab} notifications`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pb-4">
                  {filteredNotifications.map(notification => {
                    const style = getNotificationStyle(notification.type);
                    const IconComponent = style.icon;

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-4 rounded-lg border transition-all hover:shadow-sm',
                          !notification.read && 'bg-blue-50 border-blue-200',
                          style.bgColor
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn('p-2 rounded-full', style.bgColor)}>
                            <IconComponent className={cn('h-4 w-4', style.color)} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm leading-tight">
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-gray-500">
                                    {formatRelativeTime(notification.timestamp)}
                                  </span>
                                  {notification.priority === 'urgent' && (
                                    <Badge variant="destructive" className="text-xs">
                                      Urgent
                                    </Badge>
                                  )}
                                  {notification.priority === 'high' && (
                                    <Badge variant="outline" className="text-xs">
                                      High
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 ml-2">
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {!notification.read && (
                                      <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                        <Check className="h-4 w-4 mr-2" />
                                        Mark as read
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => deleteNotification(notification.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {notification.actionUrl && notification.actionText && (
                              <div className="mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(notification.actionUrl, '_blank')}
                                >
                                  {notification.actionText}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
