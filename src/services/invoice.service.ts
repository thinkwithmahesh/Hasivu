import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export type InvoiceSourceType = 'order' | 'subscription_cycle' | 'wallet_top_up';

export class InvoiceService {
  private static instance: InvoiceService;

  constructor(private readonly prisma: PrismaClient = new PrismaClient()) {
    logger.info('InvoiceService initialized');
  }

  static getInstance(): InvoiceService {
    if (!InvoiceService.instance) {
      InvoiceService.instance = new InvoiceService();
    }
    return InvoiceService.instance;
  }

  async generate(args: {
    schoolId: string;
    userId: string;
    sourceType: InvoiceSourceType;
    sourceId: string;
    dueDate?: Date;
  }) {
    if (args.sourceType !== 'order') {
      throw Object.assign(new Error('Invoice source type is not enabled yet'), {
        code: 'FEATURE_DEFERRED',
        statusCode: 501,
      });
    }

    const order = await this.prisma.order.findFirst({
      where: {
        id: args.sourceId,
        schoolId: args.schoolId,
        userId: args.userId,
      },
      include: {
        orderItems: {
          include: { menuItem: true },
        },
      },
    });

    if (!order) {
      throw Object.assign(new Error('Order not found for invoice generation'), {
        code: 'ORDER_NOT_FOUND',
        statusCode: 404,
      });
    }

    const existing = await this.prisma.invoice.findFirst({
      where: {
        schoolId: args.schoolId,
        userId: args.userId,
        invoiceItems: {
          some: { orderId: order.id },
        },
      },
      include: { invoiceItems: true },
    });

    if (existing) {
      return existing;
    }

    const invoiceNumber = await this.nextInvoiceNumber(args.schoolId);
    const subtotal = Number(order.totalAmount);
    const taxAmount = 0;
    const totalAmount = subtotal + taxAmount;

    return this.prisma.invoice.create({
      data: {
        schoolId: args.schoolId,
        userId: args.userId,
        invoiceNumber,
        dueDate: args.dueDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        subtotal,
        taxAmount,
        totalAmount,
        currency: order.currency,
        status: order.paymentStatus === 'paid' ? 'paid' : 'generated',
        paidDate: order.paymentStatus === 'paid' ? new Date() : undefined,
        invoiceItems: {
          create: order.orderItems.map(item => ({
            orderId: order.id,
            description: item.menuItem.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            itemType: 'meal_order',
            itemCode: item.menuItemId,
          })),
        },
      },
      include: { invoiceItems: true },
    });
  }

  async generateInvoice(orderId: string): Promise<unknown> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw Object.assign(new Error('Order not found'), {
        code: 'ORDER_NOT_FOUND',
        statusCode: 404,
      });
    }

    return this.generate({
      schoolId: order.schoolId,
      userId: order.userId,
      sourceType: 'order',
      sourceId: order.id,
    });
  }

  async getInvoice(invoiceId: string): Promise<unknown> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { invoiceItems: true, emailLogs: true },
    });

    if (!invoice) {
      throw Object.assign(new Error('Invoice not found'), {
        code: 'INVOICE_NOT_FOUND',
        statusCode: 404,
      });
    }

    return invoice;
  }

  async findById(invoiceId: string, schoolId: string, userId?: string) {
    return this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        schoolId,
        ...(userId ? { userId } : {}),
      },
      include: { invoiceItems: true, emailLogs: true },
    });
  }

  async listForUser(schoolId: string, userId: string) {
    return this.prisma.invoice.findMany({
      where: { schoolId, userId },
      include: { invoiceItems: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async nextInvoiceNumber(schoolId: string): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { schoolId } });
    return `INV-${schoolId.slice(-4).toUpperCase()}-${String(count + 1).padStart(6, '0')}`;
  }
}

const invoiceServiceInstance = new InvoiceService();
export const invoiceService = invoiceServiceInstance;
export const _invoiceService = invoiceServiceInstance;
export default invoiceServiceInstance;
