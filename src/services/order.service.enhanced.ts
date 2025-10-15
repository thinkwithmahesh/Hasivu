/**
 * Enhanced Order Service
 * Advanced order management with analytics and batch operations
 */

import { Order } from '@prisma/client';
import { OrderService } from './order.service';
import { NotificationService } from './notification.service';
import { PaymentService } from './payment.service';

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: { [status: string]: number };
  ordersByDay: { [date: string]: number };
  topStudents: Array<{ studentId: string; orderCount: number; totalSpent: number }>;
}

export interface BulkOrderResult {
  successful: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
}

export class EnhancedOrderService extends OrderService {
  private static enhancedInstance: EnhancedOrderService;
  private notificationService: NotificationService;
  private paymentService: PaymentService;

  private constructor() {
    super();
    this.notificationService = NotificationService.getInstance();
    this.paymentService = PaymentService.getInstance();
  }

  public static getInstance(): EnhancedOrderService {
    if (!EnhancedOrderService.enhancedInstance) {
      EnhancedOrderService.enhancedInstance = new EnhancedOrderService();
    }
    return EnhancedOrderService.enhancedInstance;
  }

  async createWithNotification(data: any, notifyStudent: boolean = true): Promise<Order> {
    const order = await this.create(data);

    if (notifyStudent) {
      await this.notificationService.create({
        userId: data.studentId,
        type: 'order_created',
        title: 'Order Placed',
        message: `Your order #${order.id} has been placed successfully`,
        data: { orderId: order.id },
      });
    }

    return order;
  }

  async updateStatusWithNotification(id: string, status: string): Promise<Order> {
    const order = await this.updateStatus(id, status);

    // Send notification about status change
    await this.notificationService.create({
      userId: order.studentId,
      type: 'order_status_updated',
      title: 'Order Status Updated',
      message: `Your order #${id} is now ${status}`,
      data: { orderId: id, status },
    });

    return order;
  }

  async getAnalytics(schoolId: string, startDate?: Date, endDate?: Date): Promise<OrderAnalytics> {
    const orders =
      startDate && endDate
        ? await this.findAll({ schoolId, startDate, endDate })
        : await this.findBySchool(schoolId);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Orders by status
    const ordersByStatus: { [status: string]: number } = {};
    orders.forEach(order => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    // Orders by day
    const ordersByDay: { [date: string]: number } = {};
    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      ordersByDay[dateKey] = (ordersByDay[dateKey] || 0) + 1;
    });

    // Top students
    const studentStats: {
      [studentId: string]: { orderCount: number; totalSpent: number };
    } = {};

    orders.forEach(order => {
      if (!studentStats[order.studentId]) {
        studentStats[order.studentId] = { orderCount: 0, totalSpent: 0 };
      }
      studentStats[order.studentId].orderCount++;
      studentStats[order.studentId].totalSpent += order.totalAmount;
    });

    const topStudents = Object.entries(studentStats)
      .map(([studentId, stats]) => ({ studentId, ...stats }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      ordersByDay,
      topStudents,
    };
  }

  async bulkCreate(orders: any[]): Promise<BulkOrderResult> {
    const result: BulkOrderResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < orders.length; i++) {
      try {
        await this.create(orders[i]);
        result.successful++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  async bulkUpdateStatus(orderIds: string[], status: string): Promise<BulkOrderResult> {
    const result: BulkOrderResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < orderIds.length; i++) {
      try {
        await this.updateStatus(orderIds[i], status);
        result.successful++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  async getRevenueByDateRange(
    schoolId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: string; revenue: number }[]> {
    const orders = await this.findAll({ schoolId, startDate, endDate });

    const revenueByDate: { [date: string]: number } = {};

    orders
      .filter(order => order.status === 'completed')
      .forEach(order => {
        const dateKey = order.createdAt.toISOString().split('T')[0];
        revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + order.totalAmount;
      });

    return Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getOrderFulfillmentRate(schoolId: string): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    fulfillmentRate: number;
  }> {
    const orders = await this.findBySchool(schoolId);

    const total = orders.length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const fulfillmentRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      cancelled,
      fulfillmentRate,
    };
  }

  static async getCart(userId: string): Promise<any> {
    // Stub implementation - return empty cart
    return {
      userId,
      items: [],
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static async clearCart(_userId: string): Promise<void> {
    // Stub implementation - do nothing
  }
}

export const enhancedOrderService = EnhancedOrderService.getInstance();
export default EnhancedOrderService;
