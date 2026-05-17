/**
 * Order Management TypeScript Interfaces
 * Aligned with Epic 3 Lambda functions (create-order, get-order, update-order, update-status)
 */

import { MenuItem } from './menu';

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem; // Populated in responses
  quantity: number;
  unitPrice: number;
  totalPrice: number; // quantity * unitPrice
  specialInstructions?: string;
  customizations?: Record<string, any>;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  studentId: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    grade?: string;
    section?: string;
    schoolId: string;
  };
  school: {
    id: string;
    name: string;
  };
  deliveryDate: string; // ISO date string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  orderItems: OrderItem[];
  deliveryInstructions?: string;
  contactPhone?: string;
  allergyInfo?: string;
  statusHistory: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: Order['status'];
  notes?: string;
  updatedBy: string;
  timestamp: string;
}

// Create order request (matches Epic 3 create-order Lambda)
export interface CreateOrderRequest {
  studentId: string;
  deliveryDate: string; // ISO date string
  orderItems: {
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
    customizations?: Record<string, any>;
  }[];
  deliveryInstructions?: string;
  contactPhone?: string;
  specialInstructions?: string;
  allergyInfo?: string;
}

// Update order request (matches Epic 3 update-order Lambda)
export interface UpdateOrderRequest {
  deliveryDate?: string;
  deliveryInstructions?: string;
  contactPhone?: string;
  allergyInfo?: string;
  orderItems?: {
    id?: string; // If updating existing item
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
    customizations?: Record<string, any>;
  }[];
}

// Update status request (matches Epic 3 update-status Lambda)
export interface UpdateOrderStatusRequest {
  status: Order['status'];
  notes?: string;
  reason?: string;
}

// Order list request (matches Epic 3 get-orders Lambda)
export interface GetOrdersRequest {
  studentId?: string;
  schoolId?: string;
  status?: Order['status'] | Order['status'][];
  paymentStatus?: Order['paymentStatus'];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'deliveryDate' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

// Order list response
export interface GetOrdersResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Order tracking
export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  status: Order['status'];
  estimatedDeliveryTime?: string;
  currentLocation?: string;
  updates: {
    timestamp: string;
    status: Order['status'];
    message: string;
    location?: string;
  }[];
}
