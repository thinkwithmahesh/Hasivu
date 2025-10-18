import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  Shield,
  Radio,
  CreditCard,
  Activity,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'security' | 'rfid' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, string | number | boolean>;
  userId?: string;
  schoolId?: string;
  expiresAt?: string;
}

interface NotificationSystemProps {
  userId?: string;
  schoolId?: string;
  onNotificationClick?: (notification: Notification) => void;
  maxVisible?: number;
  enableWebSocket?: boolean;
}

interface WebSocketMessage {
  type: 'notification' | 'notification_update' | 'notification_delete' | 'heartbeat';
  data?: {
    status?: string;
    count?: number;
    timestamp?: string;
    message?: string;
  };
  notification?: Notification;
  notificationId?: string;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  userId,
  schoolId,
  onNotificationClick,
  maxVisible = 5,
  enableWebSocket = true,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize notifications and WebSocket connection
  useEffect(() => {
    loadNotifications();

    if (enableWebSocket) {
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [userId, schoolId, enableWebSocket]);

  // Update unread count when notifications change
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      // In a real implementation, this would fetch from your backend
      // For demo purposes, we'll generate some mock notifications
      const mockNotifications = generateMockNotifications();
      setNotifications(mockNotifications);
    } catch (error) {
      toast.error('Failed to load notifications');
    }
  };

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Replace with your actual WebSocket URL from environment variables
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://api.hasivu.com/notifications';
      const ws = new WebSocket(`${wsUrl}?userId=${userId}&schoolId=${schoolId}`);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, 30000);
      };

      ws.onmessage = event => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {}
      };

      ws.onclose = event => {
        setIsConnected(false);

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            // Attempting to reconnect silently
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = error => {
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      setIsConnected(false);
    }
  }, [userId, schoolId]);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'notification':
        if (message.notification) {
          addNotification(message.notification);
          showToastForNotification(message.notification);
        }
        break;

      case 'notification_update':
        if (message.notification) {
          updateNotification(message.notification);
        }
        break;

      case 'notification_delete':
        if (message.notificationId) {
          removeNotification(message.notificationId);
        }
        break;

      case 'heartbeat':
        // Heartbeat received, connection is healthy
        break;

      default:
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => {
      // Check if notification already exists
      const exists = prev.find(n => n.id === notification.id);
      if (exists) return prev;

      // Add to beginning of array and limit total
      const updated = [notification, ...prev];
      return updated.slice(0, 100); // Keep max 100 notifications
    });
  };

  const updateNotification = (updatedNotification: Notification) => {
    setNotifications(prev =>
      prev.map(n => (n.id === updatedNotification.id ? updatedNotification : n))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const showToastForNotification = (notification: Notification) => {
    const config = {
      duration: notification.priority === 'urgent' ? 8000 : 4000,
      position: 'top-right' as const,
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, config);
        break;
      case 'warning':
        toast.error(notification.title, config);
        break;
      case 'error':
        toast.error(notification.title, config);
        break;
      default:
        toast(notification.title, config);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Update locally first for immediate feedback
      setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));

      // Send to backend (would be actual API call in real implementation)
    } catch (error) {}
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      removeNotification(notificationId);
    } catch (error) {}
  };

  const generateMockNotifications = (): Notification[] => {
    const now = new Date();
    const notifications: Notification[] = [
      {
        id: '1',
        type: 'security',
        title: 'Fraud Attempt Blocked',
        message:
          'Suspicious payment activity detected and automatically blocked for student ID 1234',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        read: false,
        priority: 'high',
        actionUrl: '/security/fraud-alerts',
        actionLabel: 'View Details',
      },
      {
        id: '2',
        type: 'rfid',
        title: 'RFID Reader Offline',
        message: 'Main cafeteria RFID reader has gone offline. Last seen 10 minutes ago.',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        read: false,
        priority: 'medium',
        actionUrl: '/rfid/readers',
        actionLabel: 'Check Status',
      },
      {
        id: '3',
        type: 'success',
        title: 'Daily Revenue Target Met',
        message: "Congratulations! Today's revenue target of $2,500 has been achieved.",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        read: true,
        priority: 'low',
      },
      {
        id: '4',
        type: 'payment',
        title: 'Low Balance Alert',
        message: '15 students have account balances below $5.00 and may need to add funds.',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        read: false,
        priority: 'medium',
        actionUrl: '/payments/low-balance',
        actionLabel: 'View Students',
      },
      {
        id: '5',
        type: 'system',
        title: 'System Maintenance Scheduled',
        message: 'Scheduled maintenance will occur tomorrow from 2:00 AM to 4:00 AM EST.',
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        read: true,
        priority: 'low',
      },
    ];

    return notifications;
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { className: 'w-5 h-5' };

    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-red-600" />;
      case 'security':
        return <Shield {...iconProps} className="w-5 h-5 text-purple-600" />;
      case 'rfid':
        return <Radio {...iconProps} className="w-5 h-5 text-blue-600" />;
      case 'payment':
        return <CreditCard {...iconProps} className="w-5 h-5 text-green-600" />;
      case 'system':
        return <Activity {...iconProps} className="w-5 h-5 text-gray-600" />;
      default:
        return <Info {...iconProps} className="w-5 h-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const visibleNotifications = showAll ? notifications : notifications.slice(0, maxVisible);

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
          {!isConnected && enableWebSocket && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white" />
          )}
        </button>

        {/* Notification Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Mark all read
                    </button>
                  )}

                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Connection Status */}
              {enableWebSocket && (
                <div
                  className={`px-4 py-2 text-xs border-b border-gray-200 ${
                    isConnected ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    />
                    <span>
                      {isConnected
                        ? 'Real-time updates active'
                        : 'Connecting to real-time updates...'}
                    </span>
                  </div>
                </div>
              )}

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {visibleNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {visibleNotifications.map(notification => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${
                          notification.read ? 'opacity-75' : ''
                        } ${getPriorityColor(notification.priority)}`}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                          if (onNotificationClick) {
                            onNotificationClick(notification);
                          }
                          if (notification.actionUrl) {
                            window.location.href = notification.actionUrl;
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p
                                className={`text-sm font-medium ${
                                  notification.read ? 'text-gray-700' : 'text-gray-900'
                                }`}
                              >
                                {notification.title}
                              </p>

                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(notification.timestamp)}
                                </span>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2">
                              {notification.message}
                            </p>

                            {notification.actionLabel && (
                              <div className="mt-2 flex items-center text-xs text-blue-600 hover:text-blue-800">
                                <span>{notification.actionLabel}</span>
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > maxVisible && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showAll ? 'Show less' : `View all ${notifications.length} notifications`}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </>
  );
};

export default NotificationSystem;
