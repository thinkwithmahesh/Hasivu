// Order cancellation types
export interface OrderCancellationRequest {
  reason: string;
  refundRequested: boolean;
  cancelledBy: string;
}

export interface OrderCancellationResponse {
  success: boolean;
  data?: {
    refundEligible: boolean;
    refundAmount?: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

// Order status types
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled'
  | 'out_for_delivery';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Order item interface
export interface OrderItem {
  menuItemId: string;
  quantity: number;
  price: number;
}

// Order status history entry
export interface OrderStatusEntry {
  status: OrderStatus;
  timestamp: string;
  message?: string;
}

// Complete order interface
export interface Order {
  id: string;
  orderNumber: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  statusHistory: OrderStatusEntry[];
  placedAt: string;
  estimatedDelivery?: string;
  location: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  notes?: string;
  rfidVerified?: boolean;
}

// Order card props
export interface OrderCardProps {
  order: Order;
  onOrderUpdate?: (orderId: string, updates: Partial<Order>) => void;
  onOrderCancel?: (orderId: string, result: OrderCancellationResponse) => void;
  onViewDetails?: (orderId: string) => void;
  showActions?: boolean;
  className?: string;
}

// Order cancellation modal props
export interface OrderCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  orderAmount: number;
  onCancellationComplete: (result: OrderCancellationResponse) => void;
}
