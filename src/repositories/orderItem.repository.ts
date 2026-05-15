/**
 * Order Item Repository
 * Data access layer for order items
 */

import { PrismaClient, OrderItem } from '@prisma/client';

export class OrderItemRepository {
  private prisma: PrismaClient;
  private static readonly prisma = new PrismaClient();

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findAll(orderId?: string): Promise<OrderItem[]> {
    return await this.prisma.orderItem.findMany({
      where: orderId ? { orderId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<OrderItem | null> {
    return await this.prisma.orderItem.findUnique({
      where: { id },
    });
  }

  async findByOrder(orderId: string): Promise<OrderItem[]> {
    return await this.prisma.orderItem.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByMenuItem(menuItemId: string): Promise<OrderItem[]> {
    return await this.prisma.orderItem.findMany({
      where: { menuItemId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrderItem> {
    return await this.prisma.orderItem.create({
      data: data as any,
    });
  }

  async update(id: string, data: Partial<OrderItem>): Promise<OrderItem> {
    return await this.prisma.orderItem.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<OrderItem> {
    return await this.prisma.orderItem.delete({
      where: { id },
    });
  }

  async deleteByOrder(orderId: string): Promise<number> {
    const result = await this.prisma.orderItem.deleteMany({
      where: { orderId },
    });
    return result.count;
  }

  async getOrderTotal(orderId: string): Promise<number> {
    const items = await this.findByOrder(orderId);
    return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  }

  static async getPopularItems(query: {
    schoolId: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<
    Array<{
      menuItemId: string;
      menuItemName: string;
      totalQuantity: number;
      orderCount: number;
      revenue: number;
    }>
  > {
    const limit = Math.min(query.limit || 10, 50);
    const groupedItems = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          schoolId: query.schoolId,
          ...(query.startDate || query.endDate
            ? {
                orderDate: {
                  ...(query.startDate ? { gte: query.startDate } : {}),
                  ...(query.endDate ? { lte: query.endDate } : {}),
                },
              }
            : {}),
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      _count: {
        orderId: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    if (groupedItems.length === 0) {
      return [];
    }

    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: groupedItems.map(item => item.menuItemId) },
      },
      select: {
        id: true,
        name: true,
      },
    });
    const menuItemNames = new Map(menuItems.map(item => [item.id, item.name]));

    return groupedItems.map(item => ({
      menuItemId: item.menuItemId,
      menuItemName: menuItemNames.get(item.menuItemId) || 'Unknown item',
      totalQuantity: item._sum.quantity || 0,
      orderCount: item._count.orderId || 0,
      revenue: item._sum.totalPrice || 0,
    }));
  }
}

export default OrderItemRepository;
