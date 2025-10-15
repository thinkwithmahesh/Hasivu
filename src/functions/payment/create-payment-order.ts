/**
 * HASIVU Platform - Create Payment Order Lambda Function
 * Handles: POST /payments/orders
 * Creates Razorpay payment orders for HASIVU meal orders
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '../../utils/logger';
import {
  createSuccessResponse,
  createErrorResponse,
  handleError,
} from '../../shared/response.utils';
import { PrismaClient } from '@prisma/client';
import { razorpayService, RazorpayOrderOptions } from '../shared/razorpay.service';
import { authenticateLambda } from '../../shared/middleware/lambda-auth.middleware';

const prisma = new PrismaClient();

/**
 * Create payment order request interface
 */
interface CreatePaymentOrderRequest {
  orderId: string;
  amount?: number; // Optional override, defaults to order total
  currency?: string; // Optional override, defaults to INR
}

/**
 * Payment order response interface
 */
interface PaymentOrderResponse {
  id: string;
  razorpayOrderId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Validate order exists and can be paid for
 */
async function validateOrderForPayment(orderId: string, userId: string): Promise<any> {
  // Get order with relations
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      student: true,
      school: true,
      payments: {
        where: {
          status: { in: ['paid', 'captured'] },
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Check if user owns this order
  if (order.userId !== userId) {
    // Allow school admin access
    const adminUser = await prisma.user.findFirst({
      where: {
        id: userId,
        schoolId: order.schoolId,
        role: { in: ['school_admin', 'admin', 'super_admin'] },
        isActive: true,
      },
    });

    if (!adminUser) {
      throw new Error('Not authorized to create payment for this order');
    }
  }

  // Check order status
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new Error(`Order cannot be paid for in current status: ${order.status}`);
  }

  // Check if already paid
  if (order.payments.length > 0) {
    throw new Error('Order has already been paid');
  }

  // Check if payment status is pending
  if (order.paymentStatus !== 'pending') {
    throw new Error(`Order payment status is ${order.paymentStatus}`);
  }

  return order;
}

/**
 * Create payment order handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    // Authenticate request
    const authenticatedUser = await authenticateLambda(event as any);

    // Only allow POST method
    if (event.httpMethod !== 'POST') {
      return createErrorResponse('Method not allowed', 'Only POST method is allowed', 405);
    }

    // Parse request body
    const body: CreatePaymentOrderRequest = JSON.parse(event.body || '{}');

    if (!body.orderId) {
      return createErrorResponse('Missing order ID', 'orderId is required', 400);
    }

    // Extract userId from authenticated user
    const userId = authenticatedUser.user!.id;

    logger.info('Creating payment order', { orderId: body.orderId, userId });

    // Validate order
    const order = await validateOrderForPayment(body.orderId, userId);

    // Determine payment amount
    const amount = body.amount || Number(order.totalAmount);
    const currency = body.currency || order.currency || 'INR';

    // Convert to paise for Razorpay (smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay order
    const razorpayOrderOptions: RazorpayOrderOptions = {
      amount: amountInPaise,
      currency,
      receipt: `order_${order.orderNumber}`,
      payment_capture: true,
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        studentId: order.studentId,
        schoolId: order.schoolId,
      },
    };

    const razorpayOrder = await razorpayService.createOrder(razorpayOrderOptions);

    // Create payment order record in database
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        id: razorpayOrder.id,
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency,
        status: razorpayOrder.status,
        userId: order.userId,
        orderId: order.id,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
        metadata: JSON.stringify({
          orderNumber: order.orderNumber,
          studentName: `${order.student.firstName} ${order.student.lastName}`,
          schoolName: order.school.name,
        }),
      },
    });

    // Update order payment status to processing
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'processing',
      },
    });

    const response: PaymentOrderResponse = {
      id: paymentOrder.id,
      razorpayOrderId: paymentOrder.razorpayOrderId,
      orderId: paymentOrder.orderId!,
      amount: Number(paymentOrder.amount),
      currency: paymentOrder.currency,
      status: paymentOrder.status,
      expiresAt: paymentOrder.expiresAt,
      createdAt: paymentOrder.createdAt,
    };

    logger.info('Payment order created successfully', {
      paymentOrderId: paymentOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount,
      orderId: order.id,
    });

    return createSuccessResponse({
      data: {
        paymentOrder: response,
        razorpayKey: process.env.RAZORPAY_KEY_ID, // Frontend needs this for checkout
      },
      message: 'Payment order created successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to create payment order', undefined, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return handleError(error as Error);
  } finally {
    await prisma.$disconnect();
  }
};
