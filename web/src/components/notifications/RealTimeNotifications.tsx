"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  Info,
  Clock,
  ChefHat,
  Package,
  Users,
  TrendingUp,
  Settings,
  Volume2,
  VolumeX,
  Filter
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Notification types and interfaces
interface Notification {
  id: string;
  type: 'order' | 'inventory' | 'staff' | 'system' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionRequired?: boolean;
  metadata?: Record<string, any>;
  source: string;
  category: string;
}

interface NotificationSettings {
  soundEnabled: boolean;
  showDesktop: boolean;
  autoMarkRead: boolean;
  filterByPriority: string[];
  filterByType: string[];
}

interface WebSocketMessage {
  type: 'notification' | 'order_update' | 'inventory_alert' | 'staff_update';
  data: any;
  timestamp: string;
}

// Real-time notification hook
export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    showDesktop: true,
    autoMarkRead: false,
    filterByPriority: ['medium', 'high', 'urgent'],
    filterByType: ['order', 'inventory', 'staff', 'alert']
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
        // Send authentication token if needed
        const token = localStorage.getItem('authToken');
        if (token) {
          wsRef.current?.send(JSON.stringify({
            type: 'auth',
            token
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected, attempting to reconnect...');
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    // Initialize audio for notifications
    audioRef.current = new Audio('/sounds/notification.mp3');

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'notification':
        addNotification(message.data);
        break;
      case 'order_update':
        handleOrderUpdate(message.data);
        break;
      case 'inventory_alert':
        handleInventoryAlert(message.data);
        break;
      case 'staff_update':
        handleStaffUpdate(message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  // Add new notification
  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Play sound if enabled
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }

    // Show desktop notification if enabled and supported
    if (settings.showDesktop && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/notification-icon.png',
        tag: notification.id
      });
    }

    // Auto-mark as read after 10 seconds if enabled
    if (settings.autoMarkRead) {
      setTimeout(() => {
        markAsRead(notification.id);
      }, 10000);
    }
  };

  // Handle order updates
  const handleOrderUpdate = (orderData: any) => {
    const notification: Notification = {
      id: `order-${orderData.id}-${Date.now()}`,
      type: 'order',
      priority: orderData.priority || 'medium',
      title: `Order ${orderData.orderNumber} Updated`,
      message: `Status changed to ${orderData.status}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      source: 'kitchen',
      category: 'order_update',
      metadata: orderData
    };
    addNotification(notification);
  };

  // Handle inventory alerts
  const handleInventoryAlert = (inventoryData: any) => {
    const notification: Notification = {
      id: `inventory-${inventoryData.id}-${Date.now()}`,
      type: 'inventory',
      priority: inventoryData.currentStock === 0 ? 'urgent' : 'high',
      title: `Inventory Alert: ${inventoryData.name}`,
      message: inventoryData.currentStock === 0 ? 'Out of stock' : 'Low stock level',
      timestamp: new Date().toISOString(),
      isRead: false,
      actionRequired: true,
      source: 'inventory',
      category: 'stock_alert',
      metadata: inventoryData
    };
    addNotification(notification);
  };

  // Handle staff updates
  const handleStaffUpdate = (staffData: any) => {
    const notification: Notification = {
      id: `staff-${staffData.id}-${Date.now()}`,
      type: 'staff',
      priority: 'low',
      title: `Staff Update: ${staffData.name}`,
      message: `Status changed to ${staffData.status}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      source: 'staff',
      category: 'staff_update',
      metadata: staffData
    };
    addNotification(notification);
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Remove notification
  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Request desktop notification permission
  const requestDesktopPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    settings,
    setSettings,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestDesktopPermission
  };
};

// Notification item component
const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onRemove 
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'order': return <ChefHat className="w-5 h-5" />;
      case 'inventory': return <Package className="w-5 h-5" />;
      case 'staff': return <Users className="w-5 h-5" />;
      case 'alert': return <AlertTriangle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-4 border-l-4 ${
        notification.isRead 
          ? 'border-gray-200 bg-gray-50' 
          : `border-${notification.priority === 'urgent' ? 'red' : notification.priority === 'high' ? 'orange' : 'blue'}-500 bg-white`
      } hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-full ${getPriorityColor()}`}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-medium ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
              {notification.title}
            </h4>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline" 
                className={`${getPriorityColor()} border-0 text-xs`}
              >
                {notification.priority}
              </Badge>
              <span className="text-xs text-gray-500">
                {timeAgo(notification.timestamp)}
              </span>
            </div>
          </div>
          
          <p className={`text-sm ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
            {notification.message}
          </p>
          
          {notification.actionRequired && (
            <div className="mt-2 flex items-center space-x-2">
              <Badge variant="destructive" className="text-xs">
                Action Required
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {!notification.isRead && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMarkAsRead(notification.id)}
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(notification.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Main notification panel component
export const RealTimeNotificationPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    isConnected,
    settings,
    setSettings,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestDesktopPermission
  } = useRealTimeNotifications();

  const [filter, setFilter] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter;
  });

  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-hidden"
    >
      <Card className="h-full rounded-none">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <CardTitle>Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Settings Panel */}
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sound Notifications</span>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Desktop Notifications</span>
                <Switch
                  checked={settings.showDesktop}
                  onCheckedChange={(checked) => handleSettingChange('showDesktop', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto Mark Read</span>
                <Switch
                  checked={settings.autoMarkRead}
                  onCheckedChange={(checked) => handleSettingChange('autoMarkRead', checked)}
                />
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={requestDesktopPermission}
                className="w-full"
              >
                Request Desktop Permission
              </Button>
            </motion.div>
          )}
          
          {/* Filter Bar */}
          <div className="flex items-center space-x-2 mt-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 px-3 py-1 border border-gray-200 rounded-md text-sm"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="order">Orders</option>
              <option value="inventory">Inventory</option>
              <option value="staff">Staff</option>
              <option value="alert">Alerts</option>
            </select>
            
            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={markAllAsRead}>
                Mark All Read
              </Button>
            )}
            
            <Button size="sm" variant="outline" onClick={clearAll}>
              Clear All
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-full overflow-y-auto">
          <AnimatePresence>
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Bell className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onRemove={removeNotification}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Notification bell component for header
export const NotificationBell: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => {
  const { unreadCount, isConnected } = useRealTimeNotifications();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
        <div 
          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} 
        />
      </Button>
    </div>
  );
};

export default RealTimeNotificationPanel;
