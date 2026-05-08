/**
 * Order Repository
 * Data access layer for order operations
 */

import { Order } from '@prisma/client';
import { prisma } from '../database/DatabaseManager';

type OrderFilterValue = string | string[] | Record<string, unknown>;

function applyOrderFilter(where: Record<string, unknown>, key: string, value?: OrderFilterValue) {
  if (Array.isArray(value)) {
    where[key] = { in: value };
  } else if (value && typeof value === 'object') {
    where[key] = value;
  } else if (value) {
    where[key] = value;
  }
}

export class OrderRepository {
  private prisma = prisma;

  async findAll(schoolId?: string): Promise<Order[]> {
    return await this.prisma.order.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Order | null> {
    return await this.prisma.order.findUnique({
      where: { id },
    });
  }

  async findBySchool(schoolId: string): Promise<Order[]> {
    return await this.prisma.order.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStudent(studentId: string): Promise<Order[]> {
    return await this.prisma.order.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(schoolId: string, status: string): Promise<Order[]> {
    return await this.prisma.order.findMany({
      where: {
        schoolId,
        status,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDateRange(schoolId: string, startDate: Date, endDate: Date): Promise<Order[]> {
    return await this.prisma.order.findMany({
      where: {
        schoolId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    return await this.prisma.order.create({
      data: data as any,
    });
  }

  async update(id: string, data: Partial<Order>): Promise<Order> {
    return await this.prisma.order.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: string): Promise<Order> {
    return await this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<Order> {
    return await this.prisma.order.delete({
      where: { id },
    });
  }

  async getPendingOrders(schoolId: string): Promise<Order[]> {
    return await this.prisma.order.findMany({
      where: {
        schoolId,
        status: 'pending',
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getActiveOrders(schoolId: string): Promise<Order[]> {
    return await this.prisma.order.findMany({
      where: {
        schoolId,
        status: {
          in: ['pending', 'confirmed', 'preparing'],
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByIdWithIncludes(id: string, include?: any): Promise<Order | null> {
    return await this.prisma.order.findUnique({
      where: { id },
      include: include || {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        deliveryVerifications: true,
      },
    });
  }

  static async findByIdWithIncludes(id: string, include?: any): Promise<Order | null> {
    return await prisma.order.findUnique({
      where: { id },
      include: include || {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        deliveryVerifications: true,
      },
    });
  }

  static async findById(id: string): Promise<Order | null> {
    return await prisma.order.findUnique({
      where: { id },
    });
  }

  static async update(id: string, data: Partial<Order>): Promise<Order> {
    return await prisma.order.update({
      where: { id },
      data,
    });
  }

  static async findMany(options: {
    filters?: { studentId?: OrderFilterValue; status?: OrderFilterValue; schoolId?: string };
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ items: Order[]; total: number }> {
    const where: any = {};

    applyOrderFilter(where, 'studentId', options.filters?.studentId);
    applyOrderFilter(where, 'status', options.filters?.status);

    if (options.filters?.schoolId) {
      where.schoolId = options.filters.schoolId;
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: options.skip || 0,
        take: options.take || 10,
        orderBy: { [options.sortBy || 'createdAt']: options.sortOrder || 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total };
  }

  static async count(filters?: {
    studentId?: OrderFilterValue;
    status?: OrderFilterValue;
    schoolId?: string;
  }): Promise<number> {
    const where: any = {};

    applyOrderFilter(where, 'studentId', filters?.studentId);
    applyOrderFilter(where, 'status', filters?.status);

    if (filters?.schoolId) {
      where.schoolId = filters.schoolId;
    }

    return await prisma.order.count({ where });
  }

  static async getAnalytics(
    schoolId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalOrders: number;
    totalRevenue: number;
    deliveredOrders: number;
    cancelledOrders: number;
    ordersByStatus: { [status: string]: number };
    revenueByDay: Array<{ date: string; revenue: number }>;
  }> {
    const where: any = { schoolId };

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const orders = await prisma.order.findMany({ where });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    const ordersByStatus: { [status: string]: number } = {};
    orders.forEach(order => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    // Simple revenue by day
    const revenueByDay: Array<{ date: string; revenue: number }> = [];
    const dailyRevenue: { [date: string]: number } = {};

    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + order.totalAmount;
    });

    Object.entries(dailyRevenue).forEach(([date, revenue]) => {
      revenueByDay.push({ date, revenue });
    });

    return {
      totalOrders,
      totalRevenue,
      deliveredOrders,
      cancelledOrders,
      ordersByStatus,
      revenueByDay,
    };
  }

  async findMany(options: {
    filters?: { studentId?: OrderFilterValue; status?: OrderFilterValue };
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ items: Order[]; total: number }> {
    const where: any = {};

    applyOrderFilter(where, 'studentId', options.filters?.studentId);
    applyOrderFilter(where, 'status', options.filters?.status);

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: options.skip || 0,
        take: options.take || 10,
        orderBy: { [options.sortBy || 'createdAt']: options.sortOrder || 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total };
  }

  async count(filters?: {
    studentId?: OrderFilterValue;
    status?: OrderFilterValue;
    schoolId?: OrderFilterValue;
    deliveryDate?: OrderFilterValue;
    createdAt?: OrderFilterValue;
    totalAmount?: OrderFilterValue;
  }): Promise<number> {
    const where: any = {};

    applyOrderFilter(where, 'studentId', filters?.studentId);
    applyOrderFilter(where, 'status', filters?.status);
    applyOrderFilter(where, 'schoolId', filters?.schoolId);
    applyOrderFilter(where, 'deliveryDate', filters?.deliveryDate);
    applyOrderFilter(where, 'createdAt', filters?.createdAt);
    applyOrderFilter(where, 'totalAmount', filters?.totalAmount);

    return await this.prisma.order.count({ where });
  }

  async getAnalytics(
    schoolId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalOrders: number;
    totalRevenue: number;
    deliveredOrders: number;
    cancelledOrders: number;
    ordersByStatus: { [status: string]: number };
    revenueByDay: Array<{ date: string; revenue: number }>;
  }> {
    const where: any = { schoolId };

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const orders = await this.prisma.order.findMany({ where });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    const ordersByStatus: { [status: string]: number } = {};
    orders.forEach(order => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    // Simple revenue by day (would need more complex aggregation in real implementation)
    const revenueByDay: Array<{ date: string; revenue: number }> = [];
    const dailyRevenue: { [date: string]: number } = {};

    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + order.totalAmount;
    });

    Object.entries(dailyRevenue).forEach(([date, revenue]) => {
      revenueByDay.push({ date, revenue });
    });

    return {
      totalOrders,
      totalRevenue,
      deliveredOrders,
      cancelledOrders,
      ordersByStatus,
      revenueByDay,
    };
  }
}

export default OrderRepository;
