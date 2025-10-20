// Production-level Order Service for HASIVU Platform
// Maps all 8 order management backend API endpoints to TypeScript service methods
// Complete parent order journey: menu browse → cart → order → payment → tracking
// Integrates with payment.service.ts and nutrition.service.ts

import apiClient from './api';
import type {
  AllergenType,
  Allergen,
  NutritionalInfo,
  DietaryInfo
} from './nutrition.service';

// ============================================================================
// Type Definitions & Interfaces
// ============================================================================

/**
 * Generic API response wrapper
 */
interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Order lifecycle status
 * Represents the complete journey from cart to delivery
 */
export type OrderStatus =
  | 'draft'            // Shopping cart not yet confirmed
  | 'confirmed'        // Order placed, awaiting payment
  | 'paid'             // Payment successful, awaiting kitchen
  | 'preparing'        // Kitchen preparing meal
  | 'ready'            // Meal ready for pickup/delivery
  | 'out_for_delivery' // Being delivered to student
  | 'delivered'        // Delivered to student
  | 'completed'        // Confirmed received by parent/student
  | 'cancelled'        // Order cancelled
  | 'failed';          // Payment or fulfillment failed

/**
 * Payment status tracking
 */
export type PaymentStatus =
  | 'pending'    // Payment not yet initiated
  | 'processing' // Payment being processed
  | 'completed'  // Payment successful
  | 'failed'     // Payment failed
  | 'refunded';  // Payment refunded

/**
 * Meal types for delivery scheduling
 */
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

/**
 * Delivery time slot for order scheduling
 */
export interface DeliverySlot {
  id: string;
  time: string; // Format: "HH:MM - HH:MM" (e.g., "08:00 - 08:30")
  mealType: MealType;
  capacity: number;         // Maximum orders for this slot
  currentBookings: number;  // Current number of bookings
  available: boolean;       // Whether slot is available for booking
  schoolId: string;         // School this slot belongs to
}

/**
 * Order item with complete nutrition and allergen information
 */
export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  menuItemDescription?: string;
  quantity: number;
  unitPrice: number;        // Price per item in INR
  totalPrice: number;       // quantity * unitPrice
  nutrition: NutritionalInfo;
  allergens: Allergen[];
  dietary: DietaryInfo;
  customizations?: string[]; // Custom requests (e.g., "extra sauce", "no onions")
  specialInstructions?: string;
  imageUrl?: string;
}

/**
 * Aggregated nutrition summary for entire order
 */
export interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;      // grams
  totalCarbs: number;        // grams
  totalFat: number;          // grams
  totalFiber: number;        // grams
  totalSugar: number;        // grams
  totalSodium: number;       // mg
  totalCholesterol: number;  // mg
  meetsGuidelines: boolean;  // Whether order meets nutritional guidelines
  guidelineNotes?: string[]; // Any nutritional concerns or recommendations
}

/**
 * Complete order structure
 */
export interface Order {
  id: string;
  orderNumber: string;       // Human-readable order number (e.g., "ORD-2024-001234")

  // Student and school information
  studentId: string;
  studentName: string;
  studentClass?: string;
  studentSection?: string;
  schoolId: string;
  schoolName: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;

  // Delivery information
  deliveryDate: string;      // ISO date string
  deliverySlot: DeliverySlot;
  deliveryInstructions?: string;

  // Order items and pricing
  items: OrderItem[];
  subtotal: number;          // Sum of all item prices
  tax: number;               // GST/tax amount
  taxRate: number;           // Tax percentage (e.g., 5 for 5%)
  deliveryFee: number;       // Delivery charge
  discount: number;          // Discount amount if any
  total: number;             // Final total amount

  // Order status and lifecycle
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;        // Razorpay payment ID
  razorpayOrderId?: string;  // Razorpay order ID

  // Kitchen assignment and tracking
  assignedTo?: string;       // Kitchen staff ID
  assignedToName?: string;   // Kitchen staff name
  assignedAt?: string;       // ISO timestamp
  preparedAt?: string;       // ISO timestamp
  readyAt?: string;          // ISO timestamp
  deliveredAt?: string;      // ISO timestamp
  completedAt?: string;      // ISO timestamp
  cancelledAt?: string;      // ISO timestamp

  // Additional information
  notes?: string;            // Parent notes
  kitchenNotes?: string;     // Kitchen/staff notes
  cancellationReason?: string;

  // Nutrition and safety
  nutritionSummary: NutritionSummary;
  allergenWarnings: string[]; // List of allergens present in order
  allergenAlerts: {           // Critical allergen alerts for student
    allergenType: AllergenType;
    studentAllergic: boolean;
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }[];

  // Timestamps
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
}

/**
 * Order summary for list views
 */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  studentName: string;
  schoolName: string;
  deliveryDate: string;
  deliveryTime: string;      // Formatted time range
  total: number;
  itemCount: number;         // Total number of items
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

/**
 * Shopping cart item (before order creation)
 */
export interface CartItem {
  menuItemId: string;
  quantity: number;
  customizations?: string[];
  specialInstructions?: string;
}

/**
 * Cart to order conversion request
 */
export interface CartToOrderRequest {
  studentId: string;
  deliveryDate: string;      // ISO date string
  deliverySlotId: string;
  items: CartItem[];
  notes?: string;
  deliveryInstructions?: string;
}

/**
 * Cart calculation response (preview before order creation)
 */
export interface CartCalculation {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  deliveryFee: number;
  discount: number;
  total: number;
  nutritionSummary: NutritionSummary;
  allergenWarnings: string[];
  allergenAlerts: {
    allergenType: AllergenType;
    studentAllergic: boolean;
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }[];
  estimatedDeliveryTime: string;
  deliverySlot: DeliverySlot;
  availablePaymentMethods: string[];
}

/**
 * Order creation request
 */
export interface CreateOrderRequest {
  studentId: string;
  schoolId: string;
  deliveryDate: string;
  deliverySlotId: string;
  items: CartItem[];
  notes?: string;
  deliveryInstructions?: string;
}

/**
 * Order update request
 * Can only update certain fields before order is confirmed
 */
export interface UpdateOrderRequest {
  deliveryDate?: string;
  deliverySlotId?: string;
  items?: CartItem[];
  notes?: string;
  deliveryInstructions?: string;
}

/**
 * Order status update request
 */
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string;
  reason?: string; // Required for cancellation
}

/**
 * Order assignment request
 */
export interface AssignOrderRequest {
  staffId: string;
  notes?: string;
}

/**
 * Order list filters
 */
export interface OrderFilters {
  status?: OrderStatus | OrderStatus[];
  paymentStatus?: PaymentStatus;
  studentId?: string;
  schoolId?: string;
  parentId?: string;
  assignedTo?: string;
  deliveryDate?: string;      // Filter by specific date
  dateFrom?: string;          // Filter by date range
  dateTo?: string;
  search?: string;            // Search by order number, student name, etc.
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'deliveryDate' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Order statistics
 */
export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  statusBreakdown: Record<OrderStatus, number>;
  paymentBreakdown: Record<PaymentStatus, number>;
  topStudents: {
    studentId: string;
    studentName: string;
    orderCount: number;
    totalSpent: number;
  }[];
  topMenuItems: {
    menuItemId: string;
    menuItemName: string;
    orderCount: number;
    quantity: number;
  }[];
  revenueByDate: {
    date: string;
    revenue: number;
    orderCount: number;
  }[];
}

/**
 * Delivery slot availability request
 */
export interface DeliverySlotQuery {
  schoolId: string;
  date: string;              // ISO date string
  mealType?: MealType;
}

// ============================================================================
// Order Service Class
// ============================================================================

/**
 * Order Service
 * Handles all order management operations including:
 * - Cart calculation and preview
 * - Order creation from shopping cart
 * - Order retrieval and filtering
 * - Order updates (before confirmed status)
 * - Order cancellation (before preparing status)
 * - Order status lifecycle management
 * - Kitchen staff assignment
 * - Order completion tracking
 *
 * Integration points:
 * - Payment service: Order → Payment → Confirmation flow
 * - Nutrition service: Allergen and nutrition aggregation
 * - Menu service: Item details and pricing
 */
class OrderService {

  // ==========================================================================
  // Cart Operations (Pre-Order)
  // ==========================================================================

  /**
   * Calculate cart totals and preview order before creation
   * Shows complete pricing, nutrition, and allergen information
   *
   * @param request - Cart calculation request
   * @returns Cart calculation with totals, nutrition, and allergen warnings
   *
   * @example
   * ```typescript
   * const preview = await orderService.calculateCart({
   *   studentId: 'student123',
   *   deliveryDate: '2024-10-20',
   *   deliverySlotId: 'slot456',
   *   items: [
   *     { menuItemId: 'item1', quantity: 2 },
   *     { menuItemId: 'item2', quantity: 1 }
   *   ]
   * });
   * console.log(`Total: ₹${preview.total}`);
   * console.log(`Allergen warnings: ${preview.allergenWarnings.join(', ')}`);
   * ```
   */
  async calculateCart(request: CartToOrderRequest): Promise<CartCalculation> {
    try {
      const response = await apiClient.post<ApiResponse<CartCalculation>>(
        '/orders/calculate',
        request
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to calculate cart:', error);
      throw new Error('Unable to calculate cart totals. Please try again.');
    }
  }

  /**
   * Get available delivery slots for a specific date and school
   * Used for scheduling order delivery
   *
   * @param query - Delivery slot query parameters
   * @returns List of available delivery slots
   *
   * @example
   * ```typescript
   * const slots = await orderService.getDeliverySlots({
   *   schoolId: 'school123',
   *   date: '2024-10-20',
   *   mealType: 'lunch'
   * });
   * console.log(`Available slots: ${slots.length}`);
   * ```
   */
  async getDeliverySlots(query: DeliverySlotQuery): Promise<DeliverySlot[]> {
    try {
      const response = await apiClient.get<ApiResponse<DeliverySlot[]>>(
        '/orders/delivery-slots',
        { params: query }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch delivery slots:', error);
      throw new Error('Unable to fetch delivery slots. Please try again.');
    }
  }

  // ==========================================================================
  // Order CRUD Operations
  // ==========================================================================

  /**
   * Endpoint: POST /orders
   * Create new order from shopping cart
   * Converts cart items to order, calculates totals, and creates order record
   * Order status: 'confirmed', Payment status: 'pending'
   *
   * @param request - Order creation request
   * @returns Created order with all details
   *
   * @example
   * ```typescript
   * const order = await orderService.createOrder({
   *   studentId: 'student123',
   *   schoolId: 'school456',
   *   deliveryDate: '2024-10-20',
   *   deliverySlotId: 'slot789',
   *   items: [
   *     { menuItemId: 'item1', quantity: 2 },
   *     { menuItemId: 'item2', quantity: 1, customizations: ['extra sauce'] }
   *   ],
   *   notes: 'Please call when arriving'
   * });
   * console.log(`Order created: ${order.orderNumber}`);
   * ```
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    try {
      const response = await apiClient.post<ApiResponse<Order>>(
        '/orders',
        request
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw new Error('Unable to create order. Please try again.');
    }
  }

  /**
   * Endpoint: GET /orders
   * List orders with optional filters
   * Supports pagination, filtering by status, student, school, date range
   * Returns order summaries for list views
   *
   * @param filters - Order list filters
   * @returns Paginated list of order summaries
   *
   * @example
   * ```typescript
   * // Get all pending orders for a student
   * const orders = await orderService.listOrders({
   *   studentId: 'student123',
   *   status: ['confirmed', 'paid', 'preparing'],
   *   sortBy: 'deliveryDate',
   *   sortOrder: 'asc'
   * });
   *
   * // Get orders for a specific date range
   * const recentOrders = await orderService.listOrders({
   *   dateFrom: '2024-10-01',
   *   dateTo: '2024-10-31',
   *   page: 1,
   *   limit: 20
   * });
   * ```
   */
  async listOrders(filters?: OrderFilters): Promise<{
    orders: OrderSummary[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        orders: OrderSummary[];
        meta: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>>('/orders', { params: filters });
      return response.data.data;
    } catch (error) {
      console.error('Failed to list orders:', error);
      throw new Error('Unable to fetch orders. Please try again.');
    }
  }

  /**
   * Endpoint: GET /orders/:id
   * Get single order details with all items, nutrition, and tracking info
   * Returns complete order information including lifecycle timestamps
   *
   * @param orderId - Order ID
   * @returns Complete order details
   *
   * @example
   * ```typescript
   * const order = await orderService.getOrder('order123');
   * console.log(`Status: ${order.status}`);
   * console.log(`Total items: ${order.items.length}`);
   * console.log(`Calories: ${order.nutritionSummary.totalCalories}`);
   * if (order.allergenWarnings.length > 0) {
   *   console.log(`⚠️ Allergens: ${order.allergenWarnings.join(', ')}`);
   * }
   * ```
   */
  async getOrder(orderId: string): Promise<Order> {
    try {
      const response = await apiClient.get<ApiResponse<Order>>(
        `/orders/${orderId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to get order:', error);
      throw new Error('Unable to fetch order details. Please try again.');
    }
  }

  /**
   * Endpoint: PUT /orders/:id
   * Update order details
   * Can only update certain fields before order is confirmed
   * Restrictions:
   * - Can update items, delivery details before 'confirmed' status
   * - Cannot update after 'preparing' status
   * - Cannot change total without changing items
   *
   * @param orderId - Order ID
   * @param updates - Fields to update
   * @returns Updated order
   *
   * @example
   * ```typescript
   * // Update delivery instructions
   * const updated = await orderService.updateOrder('order123', {
   *   deliveryInstructions: 'Leave at front desk',
   *   notes: 'Updated delivery preference'
   * });
   *
   * // Add more items (only if not confirmed yet)
   * const updated = await orderService.updateOrder('order123', {
   *   items: [
   *     ...existingItems,
   *     { menuItemId: 'item3', quantity: 1 }
   *   ]
   * });
   * ```
   */
  async updateOrder(orderId: string, updates: UpdateOrderRequest): Promise<Order> {
    try {
      const response = await apiClient.put<ApiResponse<Order>>(
        `/orders/${orderId}`,
        updates
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to update order:', error);
      throw new Error('Unable to update order. Please try again.');
    }
  }

  /**
   * Endpoint: DELETE /orders/:id
   * Cancel order
   * Restrictions:
   * - Can cancel before 'preparing' status
   * - Cannot cancel after kitchen starts preparing
   * - Payment refund initiated automatically if already paid
   *
   * @param orderId - Order ID
   * @param reason - Cancellation reason (required)
   * @returns Cancellation confirmation
   *
   * @example
   * ```typescript
   * await orderService.cancelOrder('order123', 'Student absent from school');
   * ```
   */
  async cancelOrder(orderId: string, reason: string): Promise<{
    success: boolean;
    message: string;
    refundInitiated: boolean;
    refundAmount?: number;
  }> {
    try {
      const response = await apiClient.delete<ApiResponse<{
        success: boolean;
        message: string;
        refundInitiated: boolean;
        refundAmount?: number;
      }>>(`/orders/${orderId}`, {
        data: { reason }
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      throw new Error('Unable to cancel order. Please try again.');
    }
  }

  // ==========================================================================
  // Order Lifecycle Management
  // ==========================================================================

  /**
   * Endpoint: PATCH /orders/:id/status
   * Update order status (lifecycle transitions)
   * Valid transitions:
   * - confirmed → paid (after payment)
   * - paid → preparing (kitchen starts)
   * - preparing → ready (meal ready)
   * - ready → out_for_delivery (delivery started)
   * - out_for_delivery → delivered (delivered to student)
   * - delivered → completed (confirmed by parent/student)
   * - any → cancelled (with reason)
   * - any → failed (with reason)
   *
   * @param orderId - Order ID
   * @param statusUpdate - New status and optional notes
   * @returns Updated order
   *
   * @example
   * ```typescript
   * // Mark order as paid after payment success
   * await orderService.updateOrderStatus('order123', {
   *   status: 'paid',
   *   notes: 'Payment successful via Razorpay'
   * });
   *
   * // Kitchen starts preparing
   * await orderService.updateOrderStatus('order123', {
   *   status: 'preparing'
   * });
   *
   * // Mark as ready for delivery
   * await orderService.updateOrderStatus('order123', {
   *   status: 'ready',
   *   notes: 'Meal packed and ready'
   * });
   * ```
   */
  async updateOrderStatus(
    orderId: string,
    statusUpdate: UpdateOrderStatusRequest
  ): Promise<Order> {
    try {
      const response = await apiClient.patch<ApiResponse<Order>>(
        `/orders/${orderId}/status`,
        statusUpdate
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw new Error('Unable to update order status. Please try again.');
    }
  }

  /**
   * Endpoint: PATCH /orders/:id/assign
   * Assign order to kitchen staff
   * Assigns order to specific kitchen staff member for preparation
   * Automatically updates status to 'preparing' if currently 'paid'
   *
   * @param orderId - Order ID
   * @param assignment - Staff assignment details
   * @returns Updated order with assignment
   *
   * @example
   * ```typescript
   * const assigned = await orderService.assignOrder('order123', {
   *   staffId: 'staff456',
   *   notes: 'Assigned to senior chef for special dietary requirements'
   * });
   * console.log(`Assigned to: ${assigned.assignedToName}`);
   * ```
   */
  async assignOrder(
    orderId: string,
    assignment: AssignOrderRequest
  ): Promise<Order> {
    try {
      const response = await apiClient.patch<ApiResponse<Order>>(
        `/orders/${orderId}/assign`,
        assignment
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to assign order:', error);
      throw new Error('Unable to assign order. Please try again.');
    }
  }

  /**
   * Endpoint: PATCH /orders/:id/complete
   * Mark order as completed
   * Final step in order lifecycle - confirms delivery and receipt
   * Automatically updates status to 'completed' and records completion time
   * Used by parents to confirm order received successfully
   *
   * @param orderId - Order ID
   * @param feedback - Optional feedback and notes
   * @returns Completed order
   *
   * @example
   * ```typescript
   * const completed = await orderService.completeOrder('order123', {
   *   notes: 'Meal received in good condition',
   *   rating: 5
   * });
   * ```
   */
  async completeOrder(
    orderId: string,
    feedback?: {
      notes?: string;
      rating?: number; // 1-5 rating
    }
  ): Promise<Order> {
    try {
      const response = await apiClient.patch<ApiResponse<Order>>(
        `/orders/${orderId}/complete`,
        feedback
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to complete order:', error);
      throw new Error('Unable to complete order. Please try again.');
    }
  }

  // ==========================================================================
  // Analytics and Reporting
  // ==========================================================================

  /**
   * Get order statistics and analytics
   * Provides aggregated data for dashboards and reporting
   *
   * @param filters - Optional filters for statistics
   * @returns Order statistics
   *
   * @example
   * ```typescript
   * const stats = await orderService.getOrderStats({
   *   schoolId: 'school123',
   *   dateFrom: '2024-10-01',
   *   dateTo: '2024-10-31'
   * });
   * console.log(`Total revenue: ₹${stats.totalRevenue}`);
   * console.log(`Average order value: ₹${stats.averageOrderValue}`);
   * ```
   */
  async getOrderStats(filters?: Partial<OrderFilters>): Promise<OrderStats> {
    try {
      const response = await apiClient.get<ApiResponse<OrderStats>>(
        '/orders/stats',
        { params: filters }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to get order statistics:', error);
      throw new Error('Unable to fetch order statistics. Please try again.');
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Check if order can be modified
   * Orders can only be modified before they reach 'confirmed' status
   *
   * @param order - Order to check
   * @returns Whether order can be modified
   */
  canModifyOrder(order: Order): boolean {
    const nonModifiableStatuses: OrderStatus[] = [
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'completed'
    ];
    return !nonModifiableStatuses.includes(order.status);
  }

  /**
   * Check if order can be cancelled
   * Orders can only be cancelled before kitchen starts preparing
   *
   * @param order - Order to check
   * @returns Whether order can be cancelled
   */
  canCancelOrder(order: Order): boolean {
    const nonCancellableStatuses: OrderStatus[] = [
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'completed',
      'cancelled'
    ];
    return !nonCancellableStatuses.includes(order.status);
  }

  /**
   * Get human-readable status label
   * Converts status enum to user-friendly text
   *
   * @param status - Order status
   * @returns Human-readable status text
   */
  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      draft: 'Draft',
      confirmed: 'Confirmed',
      paid: 'Payment Successful',
      preparing: 'Being Prepared',
      ready: 'Ready for Delivery',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled',
      failed: 'Failed'
    };
    return labels[status] || status;
  }

  /**
   * Get status color for UI
   * Returns color code for status badges
   *
   * @param status - Order status
   * @returns Color code (success, warning, error, info)
   */
  getStatusColor(status: OrderStatus): 'success' | 'warning' | 'error' | 'info' {
    const colors: Record<OrderStatus, 'success' | 'warning' | 'error' | 'info'> = {
      draft: 'info',
      confirmed: 'info',
      paid: 'success',
      preparing: 'warning',
      ready: 'success',
      out_for_delivery: 'warning',
      delivered: 'success',
      completed: 'success',
      cancelled: 'error',
      failed: 'error'
    };
    return colors[status] || 'info';
  }

  /**
   * Calculate estimated delivery time
   * Estimates when order will be delivered based on current time and delivery slot
   *
   * @param deliverySlot - Selected delivery slot
   * @param orderStatus - Current order status
   * @returns Estimated delivery time message
   */
  getEstimatedDeliveryTime(deliverySlot: DeliverySlot, orderStatus: OrderStatus): string {
    const statusMessages: Record<OrderStatus, string> = {
      draft: `Estimated delivery: ${deliverySlot.time}`,
      confirmed: `Estimated delivery: ${deliverySlot.time}`,
      paid: `Estimated delivery: ${deliverySlot.time}`,
      preparing: `Being prepared, delivery: ${deliverySlot.time}`,
      ready: `Ready! Delivery: ${deliverySlot.time}`,
      out_for_delivery: 'Out for delivery - arriving soon',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled',
      failed: 'Failed'
    };
    return statusMessages[orderStatus] || deliverySlot.time;
  }

  /**
   * Format order total in INR currency
   *
   * @param amount - Amount to format
   * @returns Formatted currency string
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }
}

// ============================================================================
// Export Service Instance
// ============================================================================

/**
 * Singleton instance of OrderService
 * Use this for all order management operations
 */
export const orderService = new OrderService();

/**
 * Export service class for testing and extension
 */
export default OrderService;

// ============================================================================
// Export All Types
// ============================================================================

export type {
  Order,
  OrderSummary,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  MealType,
  DeliverySlot,
  CartItem,
  CartToOrderRequest,
  CartCalculation,
  CreateOrderRequest,
  UpdateOrderRequest,
  UpdateOrderStatusRequest,
  AssignOrderRequest,
  OrderFilters,
  OrderStats,
  DeliverySlotQuery,
  NutritionSummary,
  ApiResponse
};
