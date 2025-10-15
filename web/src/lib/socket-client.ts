/**
 * HASIVU Platform - Enhanced Socket.IO Client
 * Real-time WebSocket client for order updates, notifications, and RFID events
 * Integrates with ShadCN components and Redux store
 */
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

// Socket event types for type safety
interface SocketEvents {
  order_created: (data: { orderId: string; status: string }) => void;
  order_updated: (data: { orderId: string; status: string }) => void;
  order_cancelled: (data: { orderId: string; reason: string }) => void;
  payment_success: (data: { orderId: string; amount: number }) => void;
  payment_failed: (data: { orderId: string; error: string }) => void;
  rfid_scan: (data: { cardId: string; userId: string }) => void;
  notification: (data: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }) => void;
}

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.connect();
  }

  private connect(): void {
    try {
      this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
        transports: ['websocket', 'polling'],
      });

      this.setupEventHandlers();
    } catch (error) {
      // Error handled silently
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {});

    this.socket.on('reconnect_failed', () => {
      toast.error('Unable to connect to server. Please check your connection.');
    });

    this.socket.on('notification', data => {
      const { title, message, type } = data;
      switch (type) {
        case 'success':
          toast.success(`${title}: ${message}`);
          break;
        case 'warning':
          toast.error(`${title}: ${message}`);
          break;
        case 'error':
          toast.error(`${title}: ${message}`);
          break;
        default:
          toast(`${title}: ${message}`);
      }
    });
  }

  // Public methods for socket management
  public on<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]): void {
    if (this.socket) {
      this.socket.on(event as string, handler);
    }
  }

  public emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Authentication methods
  public authenticate(token: string): void {
    if (this.socket?.connected) {
      this.socket.emit('authenticate', { token });
    }
  }

  public joinUserRoom(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_user_room', { userId });
    }
  }

  public leaveUserRoom(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_user_room', { userId });
    }
  }
}

// Export singleton instance
export const socketClient = new SocketClient();
export default socketClient;
