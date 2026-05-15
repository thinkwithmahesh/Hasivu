/**
 * Payment Order Repository
 * Data access layer for payment-order associations
 */

import { PaymentOrder, Prisma, PrismaClient } from '@prisma/client';

export class PaymentOrderRepository {
  private static instance: PaymentOrderRepository;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): PaymentOrderRepository {
    if (!PaymentOrderRepository.instance) {
      PaymentOrderRepository.instance = new PaymentOrderRepository();
    }
    return PaymentOrderRepository.instance;
  }

  async findAll(): Promise<PaymentOrder[]> {
    return this.prisma.paymentOrder.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<PaymentOrder | null> {
    return this.prisma.paymentOrder.findUnique({
      where: { id },
    });
  }

  async findByPayment(paymentId: string): Promise<PaymentOrder[]> {
    return this.prisma.paymentOrder.findMany({
      where: {
        paymentTransactions: {
          some: {
            OR: [{ id: paymentId }, { razorpayPaymentId: paymentId }],
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOrder(orderId: string): Promise<PaymentOrder[]> {
    return this.prisma.paymentOrder.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.PaymentOrderUncheckedCreateInput): Promise<PaymentOrder> {
    return this.prisma.paymentOrder.create({
      data: {
        ...data,
        metadata: data.metadata ?? '{}',
      },
    });
  }

  // Static method for test compatibility
  public static async create(data: any): Promise<any> {
    return await this.getInstance().prisma.paymentOrder.create({
      data: data as any,
    });
  }

  public static async findByOrderId(orderId: string): Promise<any> {
    return await this.getInstance().prisma.paymentOrder.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async findByRazorpayOrderId(razorpayOrderId: string): Promise<PaymentOrder | null> {
    return await this.getInstance().prisma.paymentOrder.findUnique({
      where: { razorpayOrderId },
    });
  }

  public static async findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number; status?: string }
  ): Promise<{ items: PaymentOrder[]; total: number }> {
    const where: Prisma.PaymentOrderWhereInput = {
      userId,
      ...(options?.status ? { status: options.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.getInstance().prisma.paymentOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      this.getInstance().prisma.paymentOrder.count({ where }),
    ]);

    return { items, total };
  }

  public static async findExpiredOrders(): Promise<PaymentOrder[]> {
    return await this.getInstance().prisma.paymentOrder.findMany({
      where: {
        expiresAt: { lt: new Date() },
        status: { in: ['created', 'pending'] },
      },
      orderBy: { expiresAt: 'asc' },
    });
  }

  public static async update(id: string, data: any): Promise<any> {
    return await this.getInstance().prisma.paymentOrder.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<PaymentOrder> {
    return this.prisma.paymentOrder.delete({
      where: { id },
    });
  }

  async findByOrderId(orderId: string): Promise<PaymentOrder | null> {
    return PaymentOrderRepository.findByOrderId(orderId);
  }

  async findByRazorpayOrderId(razorpayOrderId: string): Promise<PaymentOrder | null> {
    return PaymentOrderRepository.findByRazorpayOrderId(razorpayOrderId);
  }

  async findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number; status?: string }
  ): Promise<{ items: PaymentOrder[]; total: number }> {
    return PaymentOrderRepository.findByUserId(userId, options);
  }

  async findExpiredOrders(): Promise<PaymentOrder[]> {
    return PaymentOrderRepository.findExpiredOrders();
  }

  async updateStatus(id: string, status: string, metadata?: unknown): Promise<PaymentOrder> {
    const existing = await this.prisma.paymentOrder.findUnique({ where: { id } });
    const existingMetadata = this.parseMetadata(existing?.metadata);

    return this.prisma.paymentOrder.update({
      where: { id },
      data: {
        status,
        ...(metadata
          ? { metadata: JSON.stringify({ ...existingMetadata, statusUpdateMetadata: metadata }) }
          : {}),
      },
    });
  }

  private parseMetadata(metadata: string | null | undefined): Record<string, unknown> {
    if (!metadata) {
      return {};
    }

    try {
      const parsed = JSON.parse(metadata);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
}

export default PaymentOrderRepository;
