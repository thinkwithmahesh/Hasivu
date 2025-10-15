/**
 * HASIVU Platform - Retry Payment Lambda Function
 * Handles: POST /payments/retry/{paymentId}
 * Retries failed payments with intelligent retry logic and exponential backoff
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

const prisma = new PrismaClient();

// Retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS_MINUTES = [5, 30, 120]; // 5 min, 30 min, 2 hours

/**
 * Retry payment request interface
 */
interface RetryPaymentRequest {
  paymentMethodId?: string; // Optional new payment method
  retryReason?: string; // Reason for retry
}

/**
 * Retry payment response interface
 */
interface RetryPaymentResponse {
  paymentOrderId: string;
  razorpayOrderId: string;
  orderId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  attemptNumber: number;
  status: string;
  expiresAt: Date;
  retryScheduledFor?: Date;
}

/**
 * Validate payment can be retried
 */
async function validatePaymentRetry(paymentId: string, userId: string): Promise<any> {
  // Get payment transaction with related data
  const paymentTransaction = await prisma.paymentTransaction.findUnique({
    where: { id: paymentId },
    include: {
      paymentOrder: {
        include: {
          paymentTransactions: true,
        },
      },
      refunds: true,
    },
  });

  if (!paymentTransaction) {
    throw new Error('Payment transaction not found');
  }

  // Check if payment can be retried
  if (!['failed', 'created'].includes(paymentTransaction.status)) {
    throw new Error(`Payment with status '${paymentTransaction.status}' cannot be retried`);
  }

  // Check if payment was refunded
  if (paymentTransaction.refunds && paymentTransaction.refunds.length > 0) {
    throw new Error('Refunded payments cannot be retried');
  }

  // Get payment order
  const { paymentOrder } = paymentTransaction;
  if (!paymentOrder) {
    throw new Error('Payment order not found');
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
        schoolId: order?.schoolId,
        role: { in: ['school_admin', 'admin', 'super_admin'] },
        isActive: true,
      },
    });

    if (!adminUser) {
      throw new Error('Not authorized to retry this payment');
    }
  }

  // Count existing retry attempts
  const existingRetries = await prisma.paymentRetry.count({
    where: { paymentId },
  });

  if (existingRetries >= MAX_RETRY_ATTEMPTS) {
    throw new Error(`Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) exceeded`);
  }

  // Check if order is still valid
  if (paymentOrder.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: paymentOrder.orderId },
    });

    if (!order || !['pending', 'confirmed'].includes(order.status)) {
      throw new Error('Order is no longer valid for payment retry');
    }
  }

  // Check if subscription is still valid
  if (paymentOrder.subscriptionId) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: paymentOrder.subscriptionId },
    });

    if (!subscription || !['active', 'suspended', 'trialing'].includes(subscription.status)) {
      throw new Error('Subscription is no longer valid for payment retry');
    }
  }

  return {
    paymentTransaction,
    paymentOrder,
    existingRetries,
  };
}

/**
 * Retry payment handler
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

    // Parse request body
    const body: RetryPaymentRequest = JSON.parse(event.body || '{}');

    // Extract userId from event context
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse('Authentication required', 'User authentication required', 401);
    }

    logger.info('Retrying payment', { paymentId, userId });

    // Validate payment can be retried
    const { paymentTransaction, paymentOrder, existingRetries } = await validatePaymentRetry(
      paymentId,
      userId
    );

    const attemptNumber = existingRetries + 1;
    const retryDelay =
      RETRY_DELAYS_MINUTES[Math.min(existingRetries, RETRY_DELAYS_MINUTES.length - 1)];
    const retryAt = new Date(Date.now() + retryDelay * 60 * 1000);

    // Create new Razorpay order for retry
    const razorpayOrderOptions: RazorpayOrderOptions = {
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      receipt: `retry_${paymentOrder.razorpayOrderId}_attempt_${attemptNumber}`,
      payment_capture: true,
      notes: {
        originalOrderId: paymentOrder.razorpayOrderId,
        originalPaymentId: paymentTransaction.razorpayPaymentId,
        retryAttempt: String(attemptNumber),
        orderId: paymentOrder.orderId || '',
        subscriptionId: paymentOrder.subscriptionId || '',
        userId: paymentOrder.userId,
      },
    };

    const razorpayOrder = await razorpayService.createOrder(razorpayOrderOptions);

    // Create new payment order for retry
    const newPaymentOrder = await prisma.paymentOrder.create({
      data: {
        id: razorpayOrder.id,
        razorpayOrderId: razorpayOrder.id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        status: razorpayOrder.status,
        userId: paymentOrder.userId,
        orderId: paymentOrder.orderId,
        subscriptionId: paymentOrder.subscriptionId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
        metadata: JSON.stringify({
          ...JSON.parse(paymentOrder.metadata),
          retryAttempt: attemptNumber,
          originalOrderId: paymentOrder.razorpayOrderId,
        }),
      },
    });

    // Create payment retry record
    await prisma.paymentRetry.create({
      data: {
        paymentId,
        attemptNumber,
        retryAt,
        retryReason: body.retryReason || 'User initiated retry',
        retryMethod: body.paymentMethodId || null,
        status: 'pending',
      },
    });

    // Update original payment transaction
    await prisma.paymentTransaction.update({
      where: { id: paymentId },
      data: {
        status: 'retry_initiated',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'PaymentTransaction',
        entityId: paymentId,
        action: 'PAYMENT_RETRY',
        changes: JSON.stringify({
          attemptNumber,
          newOrderId: razorpayOrder.id,
          retryAt: retryAt.toISOString(),
        }),
        userId,
        createdById: userId,
        metadata: JSON.stringify({
          action: 'PAYMENT_RETRY_INITIATED',
          originalPaymentId: paymentId,
          newPaymentOrderId: newPaymentOrder.id,
        }),
      },
    });

    const response: RetryPaymentResponse = {
      paymentOrderId: newPaymentOrder.id,
      razorpayOrderId: newPaymentOrder.razorpayOrderId,
      orderId: paymentOrder.orderId || undefined,
      subscriptionId: paymentOrder.subscriptionId || undefined,
      amount: Number(newPaymentOrder.amount),
      currency: newPaymentOrder.currency,
      attemptNumber,
      status: newPaymentOrder.status,
      expiresAt: newPaymentOrder.expiresAt,
      retryScheduledFor: retryAt,
    };

    logger.info('Payment retry initiated successfully', {
      originalPaymentId: paymentId,
      newPaymentOrderId: newPaymentOrder.id,
      attemptNumber,
      retryAt: retryAt.toISOString(),
    });

    return createSuccessResponse({
      data: {
        retry: response,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
      },
      message: `Payment retry initiated successfully (Attempt ${attemptNumber}/${MAX_RETRY_ATTEMPTS})`,
    });
  } catch (error: unknown) {
    logger.error('Failed to retry payment', undefined, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return handleError(error as Error);
  } finally {
    await prisma.$disconnect();
  }
};
