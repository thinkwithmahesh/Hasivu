/**
 * HASIVU Platform - Invoice Generation Lambda Function
 * Handles: POST /payments/invoice/{paymentId}
 * Generates GST-compliant invoices for payments with PDF support
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '../../utils/logger';
import {
  createSuccessResponse,
  createErrorResponse,
  handleError,
} from '../../shared/response.utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Invoice generation response interface
 */
interface InvoiceGenerationResponse {
  invoiceId: string;
  invoiceNumber: string;
  paymentId: string;
  orderId?: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  invoiceDate: Date;
  dueDate: Date;
  status: string;
  pdfUrl?: string;
}

/**
 * Generate unique invoice number
 */
function generateInvoiceNumber(schoolCode: string, date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const randomSuffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `INV-${schoolCode}-${year}${month}-${randomSuffix}`;
}

/**
 * Calculate GST amount based on Indian GST rates
 */
function calculateGST(amount: number, gstRate: number = 5): { gstAmount: number; total: number } {
  const gstAmount = Math.round((amount * gstRate) / 100);
  const total = amount + gstAmount;
  return { gstAmount, total };
}

/**
 * Validate payment and generate invoice
 */
async function validateAndGenerateInvoice(paymentId: string, userId: string): Promise<any> {
  // Get payment transaction with all related data
  const paymentTransaction = await prisma.paymentTransaction.findUnique({
    where: { id: paymentId },
    include: {
      paymentOrder: {
        include: {
          paymentTransactions: true,
        },
      },
    },
  });

  if (!paymentTransaction) {
    throw new Error('Payment transaction not found');
  }

  // Check if payment was successful
  if (paymentTransaction.status !== 'captured') {
    throw new Error('Only successful payments can have invoices generated');
  }

  // Get payment order
  const { paymentOrder } = paymentTransaction;
  if (!paymentOrder) {
    throw new Error('Payment order not found');
  }

  // Get user and school details
  const user = await prisma.user.findUnique({
    where: { id: paymentOrder.userId },
    include: {
      school: true,
    },
  });

  if (!user || !user.school) {
    throw new Error('User or school information not found');
  }

  // Check user authorization
  if (paymentOrder.userId !== userId) {
    // Allow school admin access
    const order = paymentOrder.orderId
      ? await prisma.order.findUnique({
          where: { id: paymentOrder.orderId },
        })
      : null;

    const adminUser = await prisma.user.findFirst({
      where: {
        id: userId,
        schoolId: order?.schoolId || user.schoolId,
        role: { in: ['school_admin', 'admin', 'super_admin'] },
        isActive: true,
      },
    });

    if (!adminUser) {
      throw new Error('Not authorized to generate invoice for this payment');
    }
  }

  // Check if invoice already exists
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      paymentId: paymentTransaction.id,
    },
  });

  if (existingInvoice) {
    return {
      isExisting: true,
      invoice: existingInvoice,
    };
  }

  // Get order details if exists
  const order = paymentOrder.orderId
    ? await prisma.order.findUnique({
        where: { id: paymentOrder.orderId },
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
          student: true,
        },
      })
    : null;

  return {
    isExisting: false,
    paymentTransaction,
    paymentOrder,
    user,
    order,
  };
}

/**
 * Invoice generation handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    // Only allow POST method
    if (event.httpMethod !== 'POST') {
      return createErrorResponse('Method not allowed', 'Only POST method is allowed', 405);
    }

    const paymentId = event.pathParameters?.paymentId;
    if (!paymentId) {
      return createErrorResponse('Missing payment ID', 'paymentId is required in path', 400);
    }

    // Extract userId from event context
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse('Authentication required', 'User authentication required', 401);
    }

    logger.info('Generating invoice', { paymentId, userId });

    // Validate and get payment data
    const validationResult = await validateAndGenerateInvoice(paymentId, userId);

    // If invoice already exists, return it
    if (validationResult.isExisting) {
      const existingInvoice = validationResult.invoice;
      const response: InvoiceGenerationResponse = {
        invoiceId: existingInvoice.id,
        invoiceNumber: existingInvoice.invoiceNumber,
        paymentId,
        orderId: existingInvoice.orderId || undefined,
        amount: Number(existingInvoice.subtotal),
        taxAmount: Number(existingInvoice.taxAmount),
        totalAmount: Number(existingInvoice.totalAmount),
        currency: existingInvoice.currency,
        invoiceDate: existingInvoice.invoiceDate,
        dueDate: existingInvoice.dueDate,
        status: existingInvoice.status,
        pdfUrl: existingInvoice.pdfUrl || undefined,
      };

      return createSuccessResponse({
        data: { invoice: response },
        message: 'Invoice already exists',
      });
    }

    const { paymentTransaction, paymentOrder, user, order } = validationResult;

    // Calculate amounts
    const amountInRupees = Number(paymentTransaction.amount) / 100; // Convert paise to rupees
    const gstRate = 5; // 5% GST for food services
    const { gstAmount, total } = calculateGST(amountInRupees, gstRate);

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber(user.school!.code, new Date());
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from invoice date

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        schoolId: user.schoolId!,
        userId: paymentOrder.userId,
        invoiceNumber,
        invoiceDate,
        dueDate,
        subtotal: amountInRupees,
        taxAmount: gstAmount,
        discountAmount: 0,
        totalAmount: total,
        currency: 'INR',
        gstRate,
        hsnCode: '996331', // HSN code for canteen/mess services
        placeOfSupply: user.school!.state || 'Not specified',
        status: 'paid', // Payment already captured
        paidDate: paymentTransaction.capturedAt || new Date(),
        paymentId: paymentTransaction.id,
        emailSent: false,
      },
    });

    // Create invoice items from order
    if (order && order.orderItems) {
      for (const orderItem of order.orderItems) {
        const itemTax = calculateGST(Number(orderItem.totalPrice), gstRate);

        await prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            orderId: order.id,
            description: orderItem.menuItem.name,
            quantity: orderItem.quantity,
            unitPrice: Number(orderItem.unitPrice),
            totalPrice: Number(orderItem.totalPrice),
            taxRate: gstRate,
            taxAmount: itemTax.gstAmount,
            itemType: 'meal',
            itemCode: orderItem.menuItemId,
            hsnCode: '996331',
          },
        });
      }
    } else {
      // Create single invoice item for payment
      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          orderId: paymentOrder.orderId || null,
          description: paymentOrder.subscriptionId
            ? 'Subscription Payment'
            : 'Meal Service Payment',
          quantity: 1,
          unitPrice: amountInRupees,
          totalPrice: amountInRupees,
          taxRate: gstRate,
          taxAmount: gstAmount,
          itemType: paymentOrder.subscriptionId ? 'subscription' : 'meal',
          hsnCode: '996331',
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'Invoice',
        entityId: invoice.id,
        action: 'CREATE',
        changes: JSON.stringify({
          invoiceNumber,
          paymentId,
          amount: total,
          status: 'paid',
        }),
        userId,
        createdById: userId,
        metadata: JSON.stringify({
          action: 'INVOICE_GENERATED',
          paymentId,
          invoiceId: invoice.id,
        }),
      },
    });

    const response: InvoiceGenerationResponse = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      paymentId,
      orderId: order?.id,
      amount: amountInRupees,
      taxAmount: gstAmount,
      totalAmount: total,
      currency: 'INR',
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      pdfUrl: undefined, // PDF generation would be handled by a separate service
    };

    logger.info('Invoice generated successfully', {
      invoiceId: invoice.id,
      invoiceNumber,
      paymentId,
      totalAmount: total,
    });

    return createSuccessResponse({
      data: { invoice: response },
      message: 'Invoice generated successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to generate invoice', undefined, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return handleError(error as Error);
  } finally {
    await prisma.$disconnect();
  }
};
