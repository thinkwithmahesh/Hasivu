/**
 * HASIVU Platform - WebSocket Context Provider
 * Manages WebSocket connection for real-time features
 * Handles orders, notifications, RFID events, and system updates
 */

import React, { createContext, useContext, useEffect, useCallback, useRef, ReactNode, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { useAppDispatch } from '@/store';
import { updateOrder, addOrder } from '@/store/slices/orderSlice';

// WebSocket message types
export type SocketEventType = 
  | 'order_status_update'
  | 'new_order'
  | 'order_cancelled'
  | 'payment_update'
  | 'rfid_scan'
  | 'delivery_update'
  | 'kitchen_update'
  | 'notification'
  | 'system_message'
  | 'user_connected'
  | 'user_disconnected'
  | 'ping'
  | 'pong'
  | 'join_room'
  | 'leave_room';

// WebSocket message interface
export interface SocketMessage {
  type: SocketEventType;
  payload: any;
  timestamp: number;
  userId?: string;
  schoolId?: string;
}

// Order status update payload
export interface OrderStatusUpdate {
  orderId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  estimatedTime?: number;
  message?: string;
  kitchen_notes?: string;
}

// RFID scan event payload
export interface RFIDScanEvent {
  cardId: string;
  studentId: string;
  schoolId: string;
  timestamp: number;
  location: string;
  action: 'entry' | 'exit' | 'meal_verification' | 'access_granted' | 'access_denied';
  orderId?: string;
}

// Notification payload
export interface NotificationPayload {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  userId?: string;
  schoolId?: string;
  actions?: {
    label: string;
    action: string;
    url?: string;
  }[];
  persistent?: boolean;
  autoClose?: number;
}

// Connection states
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

// Socket context interface
export interface SocketContextType {
  // Connection state
  isConnected: boolean;
  connectionState: ConnectionState;
  lastConnected?: Date;
  reconnectAttempts: number;

  // Socket methods
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Messaging methods
  sendMessage: (type: SocketEventType, payload: any) => void;
  subscribe: (eventType: SocketEventType, callback: (data: any) => void) => () => void;
  
  // Room management
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  joinSchoolRoom: () => void;
  joinUserRoom: () => void;
  
  // Utility methods
  getConnectionStats: () => ConnectionStats;
  clearReconnectAttempts: () => void;
}

export interface ConnectionStats {
  isConnected: boolean;
  connectionState: ConnectionState;
  lastConnected?: Date;
  reconnectAttempts: number;
  totalReconnects: number;
  uptime?: number;
  latency?: number;
}

// Create context
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Socket configuration
const SOCKET_CONFIG = {
  url: process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:8001/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
};

/**
 * Socket Provider Component
 */
export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  
  // Socket state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastConnected, setLastConnected] = useState<Date | undefined>();
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [totalReconnects, setTotalReconnects] = useState(0);
  
  // Refs for socket and timers
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<Map<SocketEventType, Set<(data: any) => void>>>(new Map());
  const connectTimeRef = useRef<Date | null>(null);
  const latencyRef = useRef<number | undefined>();

  /**
   * Clear all timers
   */
  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  /**
   * Start heartbeat to keep connection alive
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }
    
    heartbeatTimerRef.current = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        const pingTime = Date.now();
        sendMessage('ping', { timestamp: pingTime });
      }
    }, SOCKET_CONFIG.heartbeatInterval);
  }, []);

  /**
   * Handle WebSocket connection
   */
  const connect = useCallback(() => {
    if (!isAuthenticated || !token) return;
    
    if (socketRef.current?.readyState === WebSocket.OPEN || 
        socketRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    clearTimers();
    setConnectionState('connecting');
    connectTimeRef.current = new Date();

    try {
      const wsUrl = `${SOCKET_CONFIG.url}?token=${encodeURIComponent(token)}&userId=${user?.id}`;
      socketRef.current = new WebSocket(wsUrl);

      // Connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
          socketRef.current?.close();
          setConnectionState('error');
          handleReconnect();
        }
      }, SOCKET_CONFIG.connectionTimeout);

      // Connection opened
      socketRef.current.onopen = () => {
        clearTimeout(connectionTimeoutRef.current!);
        setIsConnected(true);
        setConnectionState('connected');
        setLastConnected(new Date());
        setReconnectAttempts(0);
        startHeartbeat();
        
        // Join relevant rooms
        joinUserRoom();
        if (user?.schoolId) {
          joinSchoolRoom();
        }
        
        toast.success('Connected to real-time updates');
      };

      // Message received
      socketRef.current.onmessage = (event) => {
        try {
          const message: SocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse socket message:', error);
        }
      };

      // Connection closed
      socketRef.current.onclose = (event) => {
        setIsConnected(false);
        setConnectionState('disconnected');
        clearTimers();
        
        if (!event.wasClean && isAuthenticated) {
          handleReconnect();
        }
      };

      // Connection error
      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState('error');
        if (isConnected) {
          toast.error('Connection lost. Attempting to reconnect...');
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState('error');
      handleReconnect();
    }
  }, [isAuthenticated, token, user?.id, user?.schoolId, isConnected]);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    clearTimers();
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnected');
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('disconnected');
  }, [clearTimers]);

  /**
   * Handle reconnection logic
   */
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts >= SOCKET_CONFIG.maxReconnectAttempts) {
      setConnectionState('error');
      toast.error('Unable to connect to real-time updates');
      return;
    }

    setConnectionState('reconnecting');
    setReconnectAttempts(prev => prev + 1);
    setTotalReconnects(prev => prev + 1);

    reconnectTimerRef.current = setTimeout(() => {
      connect();
    }, SOCKET_CONFIG.reconnectInterval * Math.pow(1.5, reconnectAttempts));
  }, [reconnectAttempts, connect]);

  /**
   * Manual reconnect
   */
  const reconnect = useCallback(() => {
    disconnect();
    setReconnectAttempts(0);
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  /**
   * Send message through WebSocket
   */
  const sendMessage = useCallback((type: SocketEventType, payload: any) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    const message: SocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      userId: user?.id,
      schoolId: user?.schoolId,
    };

    try {
      socketRef.current.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  }, [user?.id, user?.schoolId]);

  /**
   * Subscribe to specific event types
   */
  const subscribe = useCallback((eventType: SocketEventType, callback: (data: any) => void) => {
    if (!subscriptionsRef.current.has(eventType)) {
      subscriptionsRef.current.set(eventType, new Set());
    }
    
    subscriptionsRef.current.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = subscriptionsRef.current.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          subscriptionsRef.current.delete(eventType);
        }
      }
    };
  }, []);

  /**
   * Handle incoming messages
   */
  const handleMessage = useCallback((message: SocketMessage) => {
    // Calculate latency for pong messages
    if (message.type === 'pong' && message.payload?.timestamp) {
      latencyRef.current = Date.now() - message.payload.timestamp;
    }

    // Handle specific message types
    switch (message.type) {
      case 'order_status_update':
        handleOrderStatusUpdate(message.payload as OrderStatusUpdate);
        break;
      case 'new_order':
        dispatch(addOrder(message.payload));
        toast.success('New order received!');
        break;
      case 'notification':
        handleNotification(message.payload as NotificationPayload);
        break;
      case 'rfid_scan':
        handleRFIDScan(message.payload as RFIDScanEvent);
        break;
      default:
        // Generic handling for subscribed events
        const callbacks = subscriptionsRef.current.get(message.type);
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback(message.payload);
            } catch (error) {
              console.error(`Error in socket callback for ${message.type}:`, error);
            }
          });
        }
    }
  }, [dispatch]);

  /**
   * Handle order status updates
   */
  const handleOrderStatusUpdate = useCallback((update: OrderStatusUpdate) => {
    dispatch(updateOrder({ 
      id: update.orderId, 
      status: update.status,
      estimatedTime: update.estimatedTime,
    } as any));
    
    const statusMessages = {
      confirmed: 'Your order has been confirmed!',
      preparing: 'Your order is being prepared',
      ready: 'Your order is ready for pickup!',
      out_for_delivery: 'Your order is on the way!',
      delivered: 'Your order has been delivered!',
      cancelled: 'Your order has been cancelled',
    };
    
    const message = statusMessages[update.status];
    if (message) {
      toast.success(message);
    }
  }, [dispatch]);

  /**
   * Handle notifications
   */
  const handleNotification = useCallback((notification: NotificationPayload) => {
    const toastOptions = {
      duration: notification.autoClose || 4000,
      id: notification.id,
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.message, toastOptions);
        break;
      case 'error':
        toast.error(notification.message, toastOptions);
        break;
      case 'warning':
        toast.error(notification.message, toastOptions); // Use error for warnings to make them more visible
        break;
      default:
        toast(notification.message, toastOptions);
    }
  }, []);

  /**
   * Handle RFID scan events
   */
  const handleRFIDScan = useCallback((scan: RFIDScanEvent) => {
    const actions = {
      meal_verification: 'Meal verified successfully!',
      access_granted: 'Access granted',
      access_denied: 'Access denied',
      entry: 'Entry recorded',
      exit: 'Exit recorded',
    };
    
    const message = actions[scan.action];
    if (message) {
      toast.success(`RFID: ${message}`);
    }
  }, []);

  /**
   * Join user-specific room
   */
  const joinUserRoom = useCallback(() => {
    if (user?.id) {
      sendMessage('join_room', { room: `user_${user.id}` });
    }
  }, [user?.id, sendMessage]);

  /**
   * Join school-specific room
   */
  const joinSchoolRoom = useCallback(() => {
    if (user?.schoolId) {
      sendMessage('join_room', { room: `school_${user.schoolId}` });
    }
  }, [user?.schoolId, sendMessage]);

  /**
   * Join specific room
   */
  const joinRoom = useCallback((roomId: string) => {
    sendMessage('join_room', { room: roomId });
  }, [sendMessage]);

  /**
   * Leave specific room
   */
  const leaveRoom = useCallback((roomId: string) => {
    sendMessage('leave_room', { room: roomId });
  }, [sendMessage]);

  /**
   * Get connection statistics
   */
  const getConnectionStats = useCallback((): ConnectionStats => {
    return {
      isConnected,
      connectionState,
      lastConnected,
      reconnectAttempts,
      totalReconnects,
      uptime: connectTimeRef.current ? Date.now() - connectTimeRef.current.getTime() : undefined,
      latency: latencyRef.current,
    };
  }, [isConnected, connectionState, lastConnected, reconnectAttempts, totalReconnects]);

  /**
   * Clear reconnect attempts
   */
  const clearReconnectAttempts = useCallback(() => {
    setReconnectAttempts(0);
  }, []);

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      disconnect();
    };
  }, [clearTimers, disconnect]);

  // Context value
  const contextValue: SocketContextType = {
    // Connection state
    isConnected,
    connectionState,
    lastConnected,
    reconnectAttempts,

    // Socket methods
    connect,
    disconnect,
    reconnect,

    // Messaging methods
    sendMessage,
    subscribe,

    // Room management
    joinRoom,
    leaveRoom,
    joinSchoolRoom,
    joinUserRoom,

    // Utility methods
    getConnectionStats,
    clearReconnectAttempts,
  };

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};

/**
 * Custom hook to use Socket context
 */
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Helper hooks
export const useSocketConnection = () => {
  const { isConnected, connectionState, reconnect } = useSocket();
  return { isConnected, connectionState, reconnect };
};

export const useSocketSubscription = (eventType: SocketEventType, callback: (data: any) => void) => {
  const { subscribe } = useSocket();
  
  useEffect(() => {
    const unsubscribe = subscribe(eventType, callback);
    return unsubscribe;
  }, [subscribe, eventType, callback]);
};

export const useRealTimeOrders = () => {
  const dispatch = useAppDispatch();
  
  useSocketSubscription('order_status_update', (update: OrderStatusUpdate) => {
    dispatch(updateOrder({ 
      id: update.orderId, 
      status: update.status,
      estimatedTime: update.estimatedTime,
    } as any));
  });
  
  useSocketSubscription('new_order', (order: any) => {
    dispatch(addOrder(order));
  });
};

export default SocketContext;