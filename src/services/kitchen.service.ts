/**
 * Kitchen Service
 * Database-backed kitchen queue and operational metrics facade.
 */

import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../database/DatabaseManager';
import { logger } from '../utils/logger';

const KITCHEN_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'preparing', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export class KitchenService {
  constructor(private readonly db: PrismaClient = defaultPrisma) {
    logger.info('KitchenService initialized');
  }

  async getOrders(): Promise<any[]> {
    const orders = await this.db.order.findMany({
      include: { orderItems: { include: { menuItem: true } }, assignedStaff: true },
      orderBy: { deliveryDate: 'asc' },
      take: 100,
    });
    return orders.map(order => this.toKitchenOrder(order));
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await this.db.order.update({
      where: { id: orderId },
      data: {
        status,
        deliveredAt: status === 'delivered' ? new Date() : undefined,
      },
    });
  }

  async getKitchenStatus(): Promise<any> {
    const [orders, inProgress] = await Promise.all([
      this.db.order.count(),
      this.db.order.count({
        where: { status: { in: ['pending', 'confirmed', 'preparing', 'ready'] } },
      }),
    ]);
    return { status: 'operational', orders, inProgress };
  }

  async getOrderQueue(schoolId: string, options: any = {}): Promise<any> {
    const where = {
      schoolId,
      ...(options.status ? { status: options.status } : {}),
    };
    const [orders, total, grouped] = await Promise.all([
      this.db.order.findMany({
        where,
        include: { orderItems: { include: { menuItem: true } }, assignedStaff: true },
        orderBy: [{ deliveryDate: 'asc' }, { createdAt: 'asc' }],
        take: Math.min(options.limit || 50, 100),
      }),
      this.db.order.count({ where }),
      this.db.order.groupBy({ by: ['status'], where: { schoolId }, _count: { id: true } }),
    ]);

    const statusCounts = Object.fromEntries(grouped.map(row => [row.status, row._count.id]));
    return {
      data: orders.map(order => this.toKitchenOrder(order)),
      total,
      statusCounts,
      priorityCounts: {},
      avgPreparationTime: await this.averagePreparationTimeMinutes(schoolId),
    };
  }

  async getEquipmentStatus(_schoolId: string): Promise<any> {
    return { operational: 1, maintenance: 0, outOfOrder: 0, utilizationRate: 100 };
  }

  async getPerformanceMetrics(schoolId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [ordersCompleted, activeOrders] = await Promise.all([
      this.db.order.count({ where: { schoolId, status: 'delivered', updatedAt: { gte: today } } }),
      this.db.order.count({
        where: { schoolId, status: { in: ['pending', 'confirmed', 'preparing', 'ready'] } },
      }),
    ]);
    return {
      ordersCompleted,
      activeOrders,
      avgPreparationTime: await this.averagePreparationTimeMinutes(schoolId),
      customerSatisfaction: 0,
      efficiency: activeOrders === 0 ? 100 : Math.max(0, 100 - activeOrders * 5),
    };
  }

  async getOrder(orderId: string): Promise<any> {
    const order = await this.db.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { menuItem: true } }, assignedStaff: true },
    });
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
    return this.toKitchenOrder(order);
  }

  async canTransitionStatus(
    currentStatus: string,
    newStatus: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const allowed = KITCHEN_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
    return allowed
      ? { allowed }
      : { allowed: false, reason: `Cannot transition from ${currentStatus} to ${newStatus}` };
  }

  async updateOrderStatusDetailed(orderId: string, updateData: any): Promise<any> {
    const order = await this.db.order.update({
      where: { id: orderId },
      data: {
        status: updateData.status,
        assignedStaffId: updateData.assignedStaffId,
        assignedAt: updateData.assignedStaffId ? new Date() : undefined,
        metadata: JSON.stringify({
          kitchenNotes: updateData.notes,
          updatedBy: updateData.updatedBy,
        }),
      },
      include: { orderItems: { include: { menuItem: true } }, assignedStaff: true },
    });
    return this.toKitchenOrder(order);
  }

  async startPreparationTimer(orderId: string): Promise<void> {
    await this.db.order.update({
      where: { id: orderId },
      data: {
        status: 'preparing',
        metadata: JSON.stringify({ preparationStartedAt: new Date().toISOString() }),
      },
    });
  }

  async markDispatched(orderId: string, userId: string): Promise<void> {
    await this.db.order.update({
      where: { id: orderId },
      data: {
        status: 'out_for_delivery',
        metadata: JSON.stringify({ dispatchedAt: new Date().toISOString(), dispatchedBy: userId }),
      },
    });
  }

  async getPreparationStatus(orderId: string): Promise<any> {
    const order = await this.db.order.findUnique({ where: { id: orderId } });
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
    return {
      canStart: ['pending', 'confirmed'].includes(order.status),
      status: order.status,
      assignedStaffId: order.assignedStaffId,
    };
  }

  async estimatePreparationTime(items: any[] | undefined, _schoolId: string): Promise<number> {
    if (!items?.length) return 15;
    return items.reduce((sum, item) => sum + (item.preparationTime || item.quantity * 5 || 5), 0);
  }

  private async averagePreparationTimeMinutes(schoolId: string): Promise<number> {
    const delivered = await this.db.order.findMany({
      where: { schoolId, status: 'delivered', deliveredAt: { not: null } },
      select: { createdAt: true, deliveredAt: true },
      take: 50,
      orderBy: { deliveredAt: 'desc' },
    });
    if (!delivered.length) return 0;
    const total = delivered.reduce((sum, order) => {
      return (
        sum +
        ((order.deliveredAt?.getTime() || order.createdAt.getTime()) - order.createdAt.getTime()) /
          60000
      );
    }, 0);
    return Math.round(total / delivered.length);
  }

  private toKitchenOrder(order: any): any {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      schoolId: order.schoolId,
      status: order.status,
      kitchenStatus: order.status,
      customerId: order.userId,
      studentId: order.studentId,
      assignedStaffId: order.assignedStaffId,
      assignedStaff: order.assignedStaff,
      deliveryDate: order.deliveryDate,
      totalAmount: order.totalAmount,
      items:
        order.orderItems?.map((item: any) => ({
          menuItemId: item.menuItemId,
          name: item.menuItem?.name,
          quantity: item.quantity,
          preparationTime: item.menuItem?.preparationTime,
        })) || [],
    };
  }
}

const kitchenServiceInstance = new KitchenService();
export const kitchenService = kitchenServiceInstance;
export const _kitchenService = kitchenServiceInstance;
export default kitchenServiceInstance;
