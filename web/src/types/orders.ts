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
export type _OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type _PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Order item interface
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  customizations?: string[];
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
