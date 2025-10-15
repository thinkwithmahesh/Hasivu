/**
 * Order Service
 * Business logic for order management
 */

import { PrismaClient, Order } from '@prisma/client';
import { OrderRepository } from '../repositories/order.repository';
import { MenuItemRepository } from '../repositories/menuItem.repository';
import { UserRepository } from '../repositories/user.repository';
import { RedisService } from './redis.service';
import { NotificationService } from './notification.service';
import { PaymentService } from './payment.service';
import { PaymentOrderRepository } from '../repositories/paymentOrder.repository';
import { OrderItemRepository } from '../repositories/orderItem.repository';

export interface OrderFilters {
  schoolId?: string;
  studentId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

// Export OrderStatus enum for tests
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export interface CreateOrderData {
  schoolId: string;
  studentId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  deliveryTime?: Date;
}

export class OrderService {
  private static instance: OrderService;
  private prisma: PrismaClient;
  private orderRepo: OrderRepository;
  private menuItemRepo: MenuItemRepository;
  private userRepo: UserRepository;

  protected constructor() {
    this.prisma = new PrismaClient();
    this.orderRepo = new OrderRepository();
    this.menuItemRepo = new MenuItemRepository();
    this.userRepo = new UserRepository();
  }

  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  // Static methods for test compatibility
  public static async createOrder(orderData: {
    studentId: string;
    parentId: string;
    schoolId: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
      specialInstructions?: string;
    }>;
    deliveryDate: Date;
    deliveryType: 'delivery' | 'pickup';
    deliveryAddress?: string;
  }): Promise<{ success: boolean; data?: any; error?: { message: string; code: string } }> {
    try {
      // Validate delivery date
      if (orderData.deliveryDate <= new Date()) {
        return {
          success: false,
          error: { message: 'Delivery date cannot be in the past', code: 'INVALID_DELIVERY_DATE' },
        };
      }

      // Get menu items to calculate total
      const menuItemIds = orderData.items.map(item => item.menuItemId);
      const menuItemsResult = await MenuItemRepository.findMany({
        filters: { schoolId: orderData.schoolId, available: true, ids: menuItemIds },
      });

      if (menuItemsResult.items.length !== orderData.items.length) {
        return {
          success: false,
          error: { message: 'Some menu items are not available', code: 'ITEMS_UNAVAILABLE' },
        };
      }

      // Calculate total
      let totalAmount = 0;
      const itemsWithPrices = orderData.items.map(item => {
        const menuItem = menuItemsResult.items.find((mi: any) => mi.id === item.menuItemId);
        if (!menuItem) throw new Error('Menu item not found');
        const price = Number(menuItem.price);
        totalAmount += price * item.quantity;
        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price,
        };
      });

      const createData: CreateOrderData = {
        schoolId: orderData.schoolId,
        studentId: orderData.studentId,
        items: itemsWithPrices,
        totalAmount,
        deliveryTime: orderData.deliveryDate,
      };

      const order = await this.getInstance().create(createData);
      return { success: true, data: order };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to create order',
          code: 'ORDER_CREATION_FAILED',
        },
      };
    }
  }

  public static async addToCart(cartData: {
    studentId: string;
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }): Promise<{ success: boolean; data?: any; error?: { message: string; code: string } }> {
    try {
      // Validate menu item exists
      const menuItem = await MenuItemRepository.findById(cartData.menuItemId);
      if (!menuItem || !menuItem.available) {
        return {
          success: false,
          error: { message: 'Menu item not available', code: 'ITEM_UNAVAILABLE' },
        };
      }

      const cartKey = `cart:${cartData.studentId}`;
      let cart: {
        items: Array<{
          menuItemId: string;
          quantity: number;
          price: number;
          specialInstructions?: string;
        }>;
        totalAmount: number;
        lastUpdated: Date;
        expiresAt: Date;
      } = {
        items: [],
        totalAmount: 0,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      // Get existing cart
      const existingCart = await RedisService.get(cartKey);
      if (existingCart) {
        const parsed = JSON.parse(existingCart);
        cart = {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated),
          expiresAt: new Date(parsed.expiresAt),
        };
      }

      // Find existing item or add new
      const existingItemIndex = cart.items.findIndex(
        item => item.menuItemId === cartData.menuItemId
      );
      if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity += cartData.quantity;
      } else {
        cart.items.push({
          menuItemId: cartData.menuItemId,
          quantity: cartData.quantity,
          price: Number(menuItem.price),
          specialInstructions: cartData.specialInstructions,
        });
      }

      // Recalculate total
      cart.totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      cart.lastUpdated = new Date();
      cart.expiresAt = new Date(Date.now() + 3600000); // 1 hour

      // Save cart
      await RedisService.set(cartKey, JSON.stringify(cart), 3600);

      return { success: true, data: cart };
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message || 'Failed to add to cart', code: 'CART_UPDATE_FAILED' },
      };
    }
  }

  public static async updateOrderStatus(
    orderId: string,
    newStatus: string,
    message?: string
  ): Promise<{ success: boolean; data?: any; error?: { message: string; code: string } }> {
    try {
      // Get current order
      const order = await this.getInstance().orderRepo.findById(orderId);
      if (!order) {
        return {
          success: false,
          error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' },
        };
      }

      // Validate status transition
      if (!this.isValidStatusTransition(order.status, newStatus)) {
        return {
          success: false,
          error: { message: 'Invalid status transition', code: 'INVALID_STATUS_TRANSITION' },
        };
      }

      // Update status
      const updatedOrder = await this.getInstance().orderRepo.updateStatus(orderId, newStatus);

      // Send notification
      await NotificationService.sendOrderStatusUpdate({
        orderId,
        studentId: order.studentId,
        parentId: order.userId,
        newStatus,
        message,
      });

      return { success: true, data: updatedOrder };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to update order status',
          code: 'STATUS_UPDATE_FAILED',
        },
      };
    }
  }

  public static async processOrderPayment(paymentData: {
    orderId: string;
    paymentMethod: 'razorpay' | 'stripe' | 'paypal';
    paymentDetails?: any;
  }): Promise<{ success: boolean; data?: any; error?: { message: string; code: string } }> {
    try {
      // Get order
      const order = await this.getInstance().orderRepo.findById(paymentData.orderId);
      if (!order) {
        return {
          success: false,
          error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' },
        };
      }

      // Create payment order record
      await PaymentOrderRepository.create({
        razorpayOrderId: `order_${paymentData.orderId}_${Date.now()}`,
        amount: Math.round(order.totalAmount * 100), // Convert to paisa
        currency: 'INR',
        status: 'created',
        userId: order.userId,
        orderId: paymentData.orderId,
        metadata: JSON.stringify(paymentData.paymentDetails || {}),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      });

      // Process payment
      const paymentResult = await PaymentService.processPayment({
        orderId: paymentData.orderId,
        amount: order.totalAmount,
        currency: 'INR',
        paymentMethod: paymentData.paymentMethod,
        paymentDetails: paymentData.paymentDetails,
      });

      if (!paymentResult.success) {
        return {
          success: false,
          error: {
            message: paymentResult.error?.message || 'Payment failed',
            code: 'PAYMENT_FAILED',
          },
        };
      }

      // Update order status to confirmed
      await this.updateOrderStatus(paymentData.orderId, 'confirmed');

      return {
        success: true,
        data: {
          paymentStatus: 'captured',
          paymentId: paymentResult.data?.paymentId,
          orderId: paymentData.orderId,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Payment processing failed',
          code: 'PAYMENT_PROCESSING_FAILED',
        },
      };
    }
  }

  public static async getOrderTracking(
    orderId: string
  ): Promise<{ success: boolean; data?: any; error?: { message: string; code: string } }> {
    try {
      const order = (await this.getInstance().orderRepo.findByIdWithIncludes(orderId)) as any;

      if (!order) {
        return {
          success: false,
          error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' },
        };
      }

      // Build timeline based on status
      const timeline = this.buildOrderTimeline(order);

      // Calculate estimated delivery
      const estimatedDelivery = order.deliveryDate
        ? new Date(order.deliveryDate.getTime() + 30 * 60 * 1000)
        : null; // 30 minutes after delivery time

      // Check if order can be cancelled
      const canCancel = ['pending', 'confirmed'].includes(order.status);

      const trackingData: any = {
        id: order.id,
        status: order.status,
        timeline,
        estimatedDelivery,
        canCancel,
        items:
          order.orderItems?.map((item: any) => ({
            name: item.menuItem?.name,
            quantity: item.quantity,
          })) || [],
      };

      // Add delivery details if delivered
      if (order.status === 'delivered' && order.deliveryVerifications?.length > 0) {
        const verification = order.deliveryVerifications[0];
        trackingData.deliveryDetails = {
          verifiedAt: verification.verifiedAt,
          location: verification.location,
          cardNumber: verification.card?.cardNumber,
        };
      }

      return { success: true, data: trackingData };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get order tracking',
          code: 'TRACKING_FAILED',
        },
      };
    }
  }

  public static async getOrdersByStudent(
    studentId: string,
    query: { page?: number; limit?: number; status?: string }
  ): Promise<{ success: boolean; data?: any; error?: { message: string; code: string } }> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      const result = await this.getInstance().orderRepo.findMany({
        filters: {
          studentId,
          ...(query.status && { status: query.status }),
        },
        skip,
        take: limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      const totalPages = Math.ceil(result.total / limit);

      return {
        success: true,
        data: {
          orders: result.items,
          pagination: {
            total: result.total,
            page,
            limit,
            totalPages,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message || 'Failed to get orders', code: 'ORDERS_FETCH_FAILED' },
      };
    }
  }

  public static async cancelOrder(
    orderId: string,
    cancellationReason: string
  ): Promise<{ success: boolean; data?: any; error?: { message: string; code: string } }> {
    try {
      const order = await this.getInstance().findById(orderId);

      if (!order) {
        return {
          success: false,
          error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' },
        };
      }

      if (order.status === 'completed' || order.status === 'cancelled') {
        return {
          success: false,
          error: {
            message: `Cannot cancel ${order.status} order`,
            code: 'CANCELLATION_NOT_ALLOWED',
          },
        };
      }

      // Cancel the order
      const cancelledOrder = await this.getInstance().updateStatus(orderId, 'cancelled');

      let paymentStatus = 'none';

      // Check if payment exists and process refund
      const paymentOrder = await PaymentOrderRepository.findByOrderId(orderId);
      if (paymentOrder && paymentOrder.status === 'captured') {
        // Process refund
        const refundResult = await PaymentService.refundPayment({
          paymentId: paymentOrder.razorpayPaymentId || paymentOrder.id,
          amount: paymentOrder.amount / 100, // Convert from paisa
          reason: cancellationReason,
        });

        if (refundResult.success) {
          paymentStatus = 'refunded';
          await PaymentOrderRepository.update(paymentOrder.id, { status: 'refunded' });
        }
      }

      return {
        success: true,
        data: {
          ...cancelledOrder,
          paymentStatus,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message || 'Failed to cancel order', code: 'CANCELLATION_FAILED' },
      };
    }
  }

  public static async getOrderAnalytics(query: {
    schoolId: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ success: boolean; data?: any; error?: { message: string; code: string } }> {
    try {
      const analytics = await this.getInstance().orderRepo.getAnalytics(
        query.schoolId,
        query.startDate,
        query.endDate
      );

      const deliveryRate =
        analytics.totalOrders > 0 ? (analytics.deliveredOrders / analytics.totalOrders) * 100 : 0;
      const cancellationRate =
        analytics.totalOrders > 0 ? (analytics.cancelledOrders / analytics.totalOrders) * 100 : 0;
      const averageOrderValue =
        analytics.totalOrders > 0 ? analytics.totalRevenue / analytics.totalOrders : 0;

      return {
        success: true,
        data: {
          ...analytics,
          deliveryRate,
          cancellationRate,
          averageOrderValue,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message || 'Failed to get analytics', code: 'ANALYTICS_FAILED' },
      };
    }
  }

  public static async getPopularItems(query: {
    schoolId: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<{ success: boolean; data?: any; error?: { message: string; code: string } }> {
    try {
      const popularItems = await OrderItemRepository.getPopularItems(query);

      return {
        success: true,
        data: popularItems,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get popular items',
          code: 'POPULAR_ITEMS_FAILED',
        },
      };
    }
  }

  private static buildOrderTimeline(
    order: any
  ): Array<{ status: string; timestamp: Date; description: string }> {
    const timeline: Array<{ status: string; timestamp: Date; description: string }> = [];

    // Add current status
    timeline.push({
      status: order.status,
      timestamp: order.updatedAt || order.createdAt,
      description: this.getStatusDescription(order.status),
    });

    // Add previous statuses based on creation time
    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed'];
    const currentIndex = statusOrder.indexOf(order.status);

    for (let i = 0; i < currentIndex; i++) {
      timeline.unshift({
        status: statusOrder[i],
        timestamp: new Date(order.createdAt.getTime() + i * 10 * 60 * 1000), // 10 minutes apart
        description: this.getStatusDescription(statusOrder[i]),
      });
    }

    return timeline;
  }

  private static getStatusDescription(status: string): string {
    const descriptions: { [key: string]: string } = {
      pending: 'Order placed successfully',
      confirmed: 'Order confirmed by kitchen',
      preparing: 'Order is being prepared',
      ready: 'Order is ready for delivery',
      delivered: 'Order delivered successfully',
      completed: 'Order completed',
      cancelled: 'Order cancelled',
    };
    return descriptions[status] || 'Status updated';
  }

  private static isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: { [key: string]: string[] } = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['delivered'],
      delivered: ['completed'],
      cancelled: [],
      completed: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  async findById(id: string): Promise<Order | null> {
    return await this.orderRepo.findById(id);
  }

  async findBySchool(schoolId: string): Promise<Order[]> {
    return await this.orderRepo.findBySchool(schoolId);
  }

  async findByStudent(studentId: string): Promise<Order[]> {
    return await this.orderRepo.findByStudent(studentId);
  }

  async findByStatus(schoolId: string, status: string): Promise<Order[]> {
    return await this.orderRepo.findByStatus(schoolId, status);
  }

  async findAll(filters?: OrderFilters): Promise<Order[]> {
    if (filters?.startDate && filters?.endDate && filters?.schoolId) {
      return await this.orderRepo.findByDateRange(
        filters.schoolId,
        filters.startDate,
        filters.endDate
      );
    }

    if (filters?.status && filters?.schoolId) {
      return await this.orderRepo.findByStatus(filters.schoolId, filters.status);
    }

    if (filters?.studentId) {
      return await this.orderRepo.findByStudent(filters.studentId);
    }

    if (filters?.schoolId) {
      return await this.orderRepo.findBySchool(filters.schoolId);
    }

    return await this.orderRepo.findAll();
  }

  async create(data: CreateOrderData): Promise<Order> {
    // Create order with items
    const order = await this.orderRepo.create({
      schoolId: data.schoolId,
      studentId: data.studentId,
      totalAmount: data.totalAmount,
      status: 'pending',
      deliveryTime: data.deliveryTime,
      items: JSON.stringify(data.items),
    } as any);

    return order;
  }

  async updateStatus(id: string, status: string): Promise<Order> {
    return await this.orderRepo.updateStatus(id, status);
  }

  async confirmOrder(id: string): Promise<Order> {
    return await this.updateStatus(id, 'confirmed');
  }

  async prepareOrder(id: string): Promise<Order> {
    return await this.updateStatus(id, 'preparing');
  }

  async completeOrder(id: string): Promise<Order> {
    return await this.updateStatus(id, 'completed');
  }

  async cancelOrder(id: string): Promise<Order> {
    const order = await this.findById(id);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new Error(`Cannot cancel ${order.status} order`);
    }

    return await this.updateStatus(id, 'cancelled');
  }

  async getPendingOrders(schoolId: string): Promise<Order[]> {
    return await this.orderRepo.getPendingOrders(schoolId);
  }

  async getActiveOrders(schoolId: string): Promise<Order[]> {
    return await this.orderRepo.getActiveOrders(schoolId);
  }

  async getOrderStats(
    schoolId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    statusBreakdown: { [status: string]: number };
  }> {
    const orders =
      startDate && endDate
        ? await this.orderRepo.findByDateRange(schoolId, startDate, endDate)
        : await this.orderRepo.findBySchool(schoolId);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusBreakdown: { [status: string]: number } = {};
    orders.forEach(order => {
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    });

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      statusBreakdown,
    };
  }

  /**
   * Get parent children for order access
   */
  async getParentChildren(parentId: string): Promise<any[]> {
    const parentChildren = await this.prisma.parentChild.findMany({
      where: { parentId },
      include: { child: true },
    });
    return parentChildren.map(pc => pc.child);
  }

  /**
   * Find many orders with filters
   */
  async findMany(
    filters: OrderFilters & {
      skip?: number;
      take?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ items: Order[]; total: number }> {
    const where: any = {};

    if (filters.schoolId) where.schoolId = filters.schoolId;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.status) where.status = filters.status;
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    }

    const total = await this.prisma.order.count({ where });
    const items = await this.prisma.order.findMany({
      where,
      skip: filters.skip || 0,
      take: filters.take || 10,
      orderBy: filters.sortBy
        ? { [filters.sortBy]: filters.sortOrder || 'desc' }
        : { createdAt: 'desc' },
    });

    return { items, total };
  }

  /**
   * Get tracking info for order
   */
  async getTrackingInfo(orderId: string): Promise<any> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) return null;

    return {
      id: order.id,
      status: order.status,
      estimatedDelivery: order.deliveryDate,
      trackingNumber: `TRK${order.id.substring(0, 8).toUpperCase()}`,
    };
  }

  /**
   * Estimate delivery time
   */
  async estimateDeliveryTime(orderId: string): Promise<Date | null> {
    const order = await this.findById(orderId);
    if (!order) return null;

    // Estimate 30 minutes from order time
    return new Date(order.createdAt.getTime() + 30 * 60 * 1000);
  }

  /**
   * Get status counts
   */
  async getStatusCounts(schoolId: string): Promise<{ [status: string]: number }> {
    const orders = await this.findByStatus(schoolId, '');
    const counts: { [status: string]: number } = {};

    orders.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });

    return counts;
  }

  /**
   * Get detailed tracking info
   */
  async getDetailedTrackingInfo(orderId: string): Promise<any> {
    const order = await this.findById(orderId);
    if (!order) return null;

    return {
      id: order.id,
      status: order.status,
      timeline: [
        { status: 'pending', timestamp: order.createdAt, description: 'Order placed' },
        { status: order.status, timestamp: order.updatedAt, description: 'Current status' },
      ],
      estimatedDelivery: order.deliveryDate,
    };
  }

  /**
   * Get delivery status
   */
  async getDeliveryStatus(orderId: string): Promise<string> {
    const order = await this.findById(orderId);
    return order?.status || 'unknown';
  }

  /**
   * Get preparation info
   */
  async getPreparationInfo(orderId: string): Promise<any> {
    const order = await this.findById(orderId);
    if (!order) return null;

    return {
      id: order.id,
      status: order.status,
      preparationStart: order.createdAt,
      estimatedReady: new Date(order.createdAt.getTime() + 15 * 60 * 1000),
    };
  }

  /**
   * Check if user can access order
   */
  async canUserAccessOrder(userId: string, orderId: string): Promise<boolean> {
    const order = await this.findById(orderId);
    if (!order) return false;

    // Parent can access child's orders
    if (order.userId === userId) return true;

    // Check if user is parent of student
    const children = await this.getParentChildren(userId);
    return children.some((child: any) => child.id === order.studentId);
  }

  /**
   * Check if order can be cancelled
   */
  async canCancelOrder(orderId: string): Promise<boolean> {
    const order = await this.findById(orderId);
    if (!order) return false;

    return ['pending', 'confirmed'].includes(order.status);
  }

  /**
   * Check if order can be modified
   */
  async canModifyOrder(orderId: string): Promise<boolean> {
    const order = await this.findById(orderId);
    if (!order) return false;

    return order.status === 'pending';
  }

  /**
   * Check if order is refund eligible
   */
  async isRefundEligible(orderId: string): Promise<boolean> {
    const order = await this.findById(orderId);
    if (!order) return false;

    return ['cancelled', 'pending'].includes(order.status);
  }

  /**
   * Validate delivery slot
   */
  async validateDeliverySlot(
    deliveryDate: Date,
    deliveryTimeSlot: string
  ): Promise<{ valid: boolean; message?: string }> {
    const now = new Date();
    const minAdvanceTime = 2 * 60 * 60 * 1000; // 2 hours
    const maxAdvanceTime = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (deliveryDate <= new Date(now.getTime() + minAdvanceTime)) {
      return { valid: false, message: 'Delivery slot must be at least 2 hours in advance' };
    }

    if (deliveryDate > new Date(now.getTime() + maxAdvanceTime)) {
      return { valid: false, message: 'Delivery slot cannot be more than 7 days in advance' };
    }

    // Validate time slot
    const validTimeSlots = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validTimeSlots.includes(deliveryTimeSlot)) {
      return { valid: false, message: 'Invalid delivery time slot' };
    }

    return { valid: true };
  }

  /**
   * Validate order items
   */
  async validateOrderItems(items: any[]): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    for (const item of items) {
      if (!item.menuItemId) {
        errors.push('Menu item ID is required');
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push('Quantity must be greater than 0');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Calculate order pricing
   */
  async calculateOrderPricing(
    items: any[]
  ): Promise<{ subtotal: number; tax: number; total: number }> {
    let subtotal = 0;

    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    return { subtotal, tax, total };
  }

  /**
   * Validate payment method
   */
  async validatePaymentMethod(
    paymentMethodId: string
  ): Promise<{ valid: boolean; message?: string }> {
    // Mock validation
    return { valid: true };
  }

  /**
   * Process refund
   */
  async processRefund(
    orderId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      // Mock refund processing
      return {
        success: true,
        refundId: `refund_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Refund processing failed',
      };
    }
  }

  /**
   * Check if user can update order
   */
  async canUserUpdateOrder(userId: string, orderId: string): Promise<boolean> {
    const order = await this.findById(orderId);
    if (!order) return false;

    return order.userId === userId && order.status === 'pending';
  }

  /**
   * Check if status can be changed
   */
  async canChangeStatus(orderId: string, newStatus: string): Promise<boolean> {
    const order = await this.findById(orderId);
    if (!order) return false;

    const validTransitions: { [key: string]: string[] } = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['delivered'],
      delivered: ['completed'],
    };

    return validTransitions[order.status]?.includes(newStatus) ?? false;
  }

  /**
   * Validate item modification
   */
  async validateItemModification(
    orderId: string,
    modifications: any
  ): Promise<{ valid: boolean; errors?: string[] }> {
    const order = await this.findById(orderId);
    if (!order) {
      return { valid: false, errors: ['Order not found'] };
    }

    if (order.status !== 'pending') {
      return { valid: false, errors: ['Order cannot be modified at this stage'] };
    }

    return { valid: true };
  }

  /**
   * Update order
   */
  async update(orderId: string, updates: any): Promise<Order> {
    return await this.orderRepo.update(orderId, updates);
  }

  /**
   * Handle status update
   */
  async handleStatusUpdate(orderId: string, newStatus: string): Promise<void> {
    await this.updateStatus(orderId, newStatus);
    // Additional logic for status updates
  }

  /**
   * Check if parent can order for student
   */
  async canParentOrderForStudent(parentId: string, studentId: string): Promise<boolean> {
    const children = await this.getParentChildren(parentId);
    return children.some(child => child.id === studentId);
  }

  /**
   * Create order (instance method version)
   */
  async createOrder(orderData: any): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const order = await this.create(orderData);
      return { success: true, data: order };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Failed to create order',
          code: 'ORDER_CREATION_FAILED',
        },
      };
    }
  }

  /**
   * Get comprehensive tracking info
   */
  async getComprehensiveTrackingInfo(orderId: string): Promise<any> {
    const order = await this.findById(orderId);
    if (!order) return null;

    return {
      id: order.id,
      status: order.status,
      timeline: [
        { status: 'pending', timestamp: order.createdAt, description: 'Order placed' },
        { status: order.status, timestamp: order.updatedAt, description: 'Current status' },
      ],
      estimatedDelivery: order.deliveryDate,
    };
  }
}

export const orderService = OrderService.getInstance();
export default OrderService;
