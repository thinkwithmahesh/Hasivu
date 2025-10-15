/**
 * Notification System Component
 * Uses Sonner for modern toast notifications with order status updates
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Bell,
  _ShoppingCart,
  CreditCard,
  Utensils,
  MapPin,
  Star,
  Gift,
  _TrendingUp,
  Shield,
  Info,
  _Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import type {
  _OrderHistoryItem,
  StudentInfo,
  MealItem,
  _RFIDPickupInfo,
  OrderStatus,
} from './types';

export interface NotificationSystemProps {
  student: StudentInfo;
  onOrderStatusUpdate?: (orderId: string, status: OrderStatus) => void;
  onNotificationClick?: (notificationId: string) => void;
  className?: string;
}

// Notification types and their configurations
const NOTIFICATION_CONFIG = {
  orderPlaced: {
    icon: <CheckCircle className="w-4 h-4" />,
    style: 'success',
    duration: 4000,
    sound: true,
  },
  orderConfirmed: {
    icon: <Clock className="w-4 h-4" />,
    style: 'default',
    duration: 3000,
    sound: true,
  },
  orderPreparing: {
    icon: <Utensils className="w-4 h-4" />,
    style: 'default',
    duration: 3000,
    sound: false,
  },
  orderReady: {
    icon: <Bell className="w-4 h-4" />,
    style: 'success',
    duration: 0, // Persistent
    sound: true,
  },
  orderDelivered: {
    icon: <MapPin className="w-4 h-4" />,
    style: 'success',
    duration: 4000,
    sound: true,
  },
  orderCancelled: {
    icon: <XCircle className="w-4 h-4" />,
    style: 'error',
    duration: 5000,
    sound: true,
  },
  paymentSuccess: {
    icon: <CreditCard className="w-4 h-4" />,
    style: 'success',
    duration: 3000,
    sound: true,
  },
  paymentFailed: {
    icon: <AlertTriangle className="w-4 h-4" />,
    style: 'error',
    duration: 6000,
    sound: true,
  },
  lowBalance: {
    icon: <AlertTriangle className="w-4 h-4" />,
    style: 'warning',
    duration: 5000,
    sound: false,
  },
  mealRecommendation: {
    icon: <Star className="w-4 h-4" />,
    style: 'default',
    duration: 6000,
    sound: false,
  },
  specialOffer: {
    icon: <Gift className="w-4 h-4" />,
    style: 'default',
    duration: 8000,
    sound: false,
  },
  rfidVerification: {
    icon: <Shield className="w-4 h-4" />,
    style: 'success',
    duration: 3000,
    sound: true,
  },
  systemAlert: {
    icon: <Info className="w-4 h-4" />,
    style: 'default',
    duration: 5000,
    sound: false,
  },
} as const;

type NotificationType = keyof typeof NOTIFICATION_CONFIG;

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private soundEnabled = true;
  private notificationQueue: Array<() => void> = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  initialize(student: StudentInfo) {
    if (this.isInitialized) return;

    this.isInitialized = true;
    this.soundEnabled = localStorage.getItem('hasivu-sound-enabled') !== 'false';

    // Process any queued notifications
    this.notificationQueue.forEach(notification => notification());
    this.notificationQueue = [];

    // Welcome notification
    this.showNotification('systemAlert', {
      title: `Welcome back, ${student.name}!`,
      description: `You have ₹${student.walletBalance} in your wallet`,
      action: {
        label: 'View Menu',
      },
    });
  }

  toggleSound(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('hasivu-sound-enabled', enabled.toString());
  }

  private playNotificationSound(type: NotificationType) {
    if (!this.soundEnabled || !NOTIFICATION_CONFIG[type].sound) return;

    // Create audio context for notification sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different tones for different notification types
      const frequencies = {
        success: [523.25, 659.25, 783.99], // C5-E5-G5
        error: [220.0, 185.0], // A3-F#3
        warning: [293.66, 349.23], // D4-F4
        default: [440.0], // A4
      };

      const config = NOTIFICATION_CONFIG[type];
      const tones = frequencies[config.style as keyof typeof frequencies] || frequencies.default;

      tones.forEach((freq, index) => {
        setTimeout(() => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();

          osc.connect(gain);
          gain.connect(audioContext.destination);

          osc.frequency.setValueAtTime(freq, audioContext.currentTime);
          gain.gain.setValueAtTime(0.1, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.2);
        }, index * 100);
      });
    } catch (error) {
      // Error handled silently
    }
  }

  showNotification(
    type: NotificationType,
    options: {
      title: string;
      description?: string;
      action?: {
        label: string;
        onClick: () => void;
      };
      data?: any;
    }
  ) {
    const config = NOTIFICATION_CONFIG[type];

    if (!this.isInitialized) {
      // Queue notification for later
      this.notificationQueue.push(() => this.showNotification(type, options));
      return;
    }

    this.playNotificationSound(type);

    const toastOptions: any = {
      duration: config.duration,
      icon: config.icon,
      description: options.description,
      action: options.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
      className: `notification-${config.style}`,
    };

    switch (config.style) {
      case 'success':
        toast.success(options.title, toastOptions);
        break;
      case 'error':
        toast.error(options.title, toastOptions);
        break;
      case 'warning':
        toast.warning(options.title, toastOptions);
        break;
      default:
        toast(options.title, toastOptions);
    }
  }

  // Predefined notification methods
  orderPlaced(orderData: { orderId: string; items: string[]; total: number }) {
    this.showNotification('orderPlaced', {
      title: 'Order placed successfully!',
      description: `Order #${orderData.orderId} • ${orderData.items.length} items • ₹${orderData.total}`,
      action: {
        label: 'Track Order',
      },
    });
  }

  orderStatusUpdate(orderId: string, status: OrderStatus, estimatedTime?: string) {
    const statusMessages = {
      pending: 'Order received and being processed',
      confirmed: `Order confirmed${estimatedTime ? ` • Ready in ${estimatedTime}` : ''}`,
      preparing: 'Your order is being prepared',
      ready: 'Order ready for pickup!',
      delivered: 'Order delivered successfully',
      cancelled: 'Order has been cancelled',
    };

    const notificationTypes: Record<OrderStatus, NotificationType> = {
      pending: 'orderConfirmed',
      confirmed: 'orderConfirmed',
      preparing: 'orderPreparing',
      ready: 'orderReady',
      delivered: 'orderDelivered',
      cancelled: 'orderCancelled',
    };

    this.showNotification(notificationTypes[status], {
      title: statusMessages[status],
      description: `Order #${orderId}`,
      action:
        status === 'ready'
          ? {
              label: 'Get Directions',
            }
          : undefined,
    });
  }

  paymentUpdate(success: boolean, amount: number, method: string) {
    if (success) {
      this.showNotification('paymentSuccess', {
        title: 'Payment successful',
        description: `₹${amount} charged to ${method}`,
      });
    } else {
      this.showNotification('paymentFailed', {
        title: 'Payment failed',
        description: `Unable to process ₹${amount} via ${method}`,
        action: {
          label: 'Retry',
        },
      });
    }
  }

  lowBalance(currentBalance: number, requiredAmount: number) {
    this.showNotification('lowBalance', {
      title: 'Low wallet balance',
      description: `Balance: ₹${currentBalance} • Required: ₹${requiredAmount}`,
      action: {
        label: 'Add Money',
      },
    });
  }

  mealRecommendation(meal: MealItem, reason: string) {
    this.showNotification('mealRecommendation', {
      title: `Try ${meal.name}!`,
      description: reason,
      action: {
        label: 'View Meal',
      },
    });
  }

  specialOffer(title: string, description: string, offerCode?: string) {
    this.showNotification('specialOffer', {
      title,
      description: `${description}${offerCode ? ` • Code: ${offerCode}` : ''}`,
      action: {
        label: 'View Offers',
      },
    });
  }

  rfidVerification(success: boolean, location?: string) {
    if (success) {
      this.showNotification('rfidVerification', {
        title: 'RFID verification successful',
        description: location ? `Verified at ${location}` : undefined,
      });
    } else {
      this.showNotification('paymentFailed', {
        title: 'RFID verification failed',
        description: 'Please try scanning your card again',
        action: {
          label: 'Retry',
        },
      });
    }
  }

  systemMaintenance(message: string, duration?: string) {
    this.showNotification('systemAlert', {
      title: 'System maintenance',
      description: `${message}${duration ? ` • Duration: ${duration}` : ''}`,
    });
  }
}

export function NotificationSystem({
  student,
  _onOrderStatusUpdate,
  _onNotificationClick,
  className,
}: NotificationSystemProps) {
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    // Initialize notification service with student data
    notificationService.initialize(student);
  }, [student, notificationService]);

  // Example: Listen for order status updates (in real app, this would come from WebSocket/SSE)
  useEffect(() => {
    const _mockStatusUpdates = () => {
      // Simulate receiving order status updates
      setTimeout(() => {
        notificationService.orderStatusUpdate('ORD-123', 'confirmed', '15 mins');
      }, 5000);

      setTimeout(() => {
        notificationService.orderStatusUpdate('ORD-123', 'preparing');
      }, 10000);

      setTimeout(() => {
        notificationService.orderStatusUpdate('ORD-123', 'ready');
      }, 15000);
    };

    // Only run mock updates in development
    if (process.env.NODE_ENV === 'development') {
      // mockStatusUpdates()
    }
  }, [notificationService]);

  // Expose notification methods for use by other components
  const showOrderNotification = useCallback(
    (orderId: string, items: string[], total: number) => {
      notificationService.orderPlaced({ orderId, items, total });
    },
    [notificationService]
  );

  const showPaymentNotification = useCallback(
    (success: boolean, amount: number, method: string) => {
      notificationService.paymentUpdate(success, amount, method);
    },
    [notificationService]
  );

  const showBalanceWarning = useCallback(() => {
    if (student.walletBalance < 100) {
      notificationService.lowBalance(student.walletBalance, 100);
    }
  }, [student.walletBalance, notificationService]);

  // Check for low balance on mount
  useEffect(() => {
    if (student.walletBalance < 50) {
      setTimeout(() => showBalanceWarning(), 2000);
    }
  }, [student.walletBalance, showBalanceWarning]);

  // Provide context methods for child components to use
  React.useEffect(() => {
    // Attach notification methods to window for global access (development only)
    if (process.env.NODE_ENV === 'development') {
      (window as any).hasivu_notifications = {
        orderPlaced: showOrderNotification,
        paymentUpdate: showPaymentNotification,
        balanceWarning: showBalanceWarning,
        mealRecommendation: (meal: MealItem, reason: string) =>
          notificationService.mealRecommendation(meal, reason),
        specialOffer: (title: string, description: string, code?: string) =>
          notificationService.specialOffer(title, description, code),
        rfidVerification: (success: boolean, location?: string) =>
          notificationService.rfidVerification(success, location),
      };
    }
  }, [showOrderNotification, showPaymentNotification, showBalanceWarning, notificationService]);

  return (
    <div className={className}>
      {/* Settings panel for notification preferences */}
      <div className="hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => notificationService.toggleSound(!notificationService['soundEnabled'])}
        >
          {notificationService['soundEnabled'] ? 'Mute' : 'Unmute'} Sounds
        </Button>
      </div>
    </div>
  );
}

// Export the service instance for use in other components
export const notificationService = NotificationService.getInstance();

export default NotificationSystem;
