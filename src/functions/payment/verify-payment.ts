/**
 * HASIVU Platform - Verify Payment Lambda Function
 * Handles: POST /payments/verify
 * Verifies Razorpay payment signatures and updates payment status
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '../../utils/logger';
import {
  createSuccessResponse,
  createErrorResponse,
  handleError,
} from '../../shared/response.utils';
import { PrismaClient } from '@prisma/client';
import { razorpayService } from '../shared/razorpay.service';

const prisma = new PrismaClient();

/**
 * Verify payment request interface
 */
interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

/**
 * Payment verification response interface
 */
interface PaymentVerificationResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  verifiedAt: Date;
}

/**
 * Verify payment signature and process payment
 */
async function verifyAndProcessPayment(
  orderId: string,
  paymentId: string,
  signature: string,
  userId: string
): Promise<any> {
  // Verify signature
  const isValidSignature = razorpayService.verifyPaymentSignature(orderId, paymentId, signature);

  if (!isValidSignature) {
    throw new Error('Invalid payment signature');
  }

  // Get payment details from Razorpay
  const razorpayPayment = await razorpayService.fetchPayment(paymentId);

  // Get payment order from database
  const paymentOrder = await prisma.paymentOrder.findUnique({
    where: { razorpayOrderId: orderId },
  });

  if (!paymentOrder) {
    throw new Error('Payment order not found');
  }

  // Get the associated order
  const order = paymentOrder.orderId
    ? await prisma.order.findUnique({
        where: { id: paymentOrder.orderId },
        include: {
          user: true,
          student: true,
          school: true,
        },
      })
    : null;

  // Verify payment belongs to user
  if (paymentOrder.userId !== userId && order?.userId !== userId) {
    throw new Error('Not authorized to verify this payment');
  }

  // Check if payment is already processed
  const existingTransaction = await prisma.paymentTransaction.findUnique({
    where: { razorpayPaymentId: paymentId },
  });

  if (existingTransaction) {
    // Return existing verification result
    return {
      success: existingTransaction.status === 'captured',
      paymentId: existingTransaction.id,
      orderId: paymentOrder.orderId!,
      amount: Number(existingTransaction.amount),
      currency: existingTransaction.currency,
      status: existingTransaction.status,
      verifiedAt: existingTransaction.createdAt,
    };
  }

  // Create payment transaction record
  const transaction = await prisma.paymentTransaction.create({
    data: {
      razorpayPaymentId: paymentId,
      paymentOrderId: paymentOrder.id,
      amount: razorpayPayment.amount,
      currency: razorpayPayment.currency,
      status: razorpayPayment.status,
      method: razorpayPayment.method,
      gateway: 'razorpay',
      fees: JSON.stringify({
        fee: razorpayPayment.fee || 0,
        tax: razorpayPayment.tax || 0,
      }),
      capturedAt: razorpayPayment.captured ? new Date(razorpayPayment.created_at * 1000) : null,
    },
  });

  // Update payment order status
  await prisma.paymentOrder.update({
    where: { id: paymentOrder.id },
    data: {
      status: razorpayPayment.status,
    },
  });

  // Update order status if payment was successful
  if (razorpayPayment.status === 'captured' || razorpayPayment.status === 'authorized') {
    await prisma.order.update({
      where: { id: paymentOrder.orderId! },
      data: {
        paymentStatus: 'paid',
        status: 'confirmed', // Move order to confirmed status
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'Order',
        entityId: paymentOrder.orderId!,
        action: 'PAYMENT_COMPLETED',
        changes: JSON.stringify({
          paymentId,
          amount: razorpayPayment.amount,
          method: razorpayPayment.method,
        }),
        userId,
        createdById: userId,
        metadata: JSON.stringify({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
        }),
      },
    });

    logger.info('Payment verified and order updated', {
      orderId: paymentOrder.orderId,
      paymentId,
      amount: razorpayPayment.amount,
    });
  }

  return {
    success: razorpayPayment.status === 'captured',
    paymentId: transaction.id,
    orderId: paymentOrder.orderId!,
    amount: Number(razorpayPayment.amount),
    currency: razorpayPayment.currency,
    status: razorpayPayment.status,
    verifiedAt: transaction.createdAt,
  };
}

/**
 * Verify payment handler
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

    // Parse request body
    const body: VerifyPaymentRequest = JSON.parse(event.body || '{}');

    if (!body.razorpayOrderId || !body.razorpayPaymentId || !body.razorpaySignature) {
      return createErrorResponse(
        'Missing required fields',
        'razorpayOrderId, razorpayPaymentId, and razorpaySignature are required',
        400
      );
    }

    // Extract userId from event context
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse('Authentication required', 'User authentication required', 401);
    }

    logger.info('Verifying payment', {
      razorpayOrderId: body.razorpayOrderId,
      razorpayPaymentId: body.razorpayPaymentId,
      userId,
    });

    // Verify and process payment
    const verificationResult = await verifyAndProcessPayment(
      body.razorpayOrderId,
      body.razorpayPaymentId,
      body.razorpaySignature,
      userId
    );

    const response: PaymentVerificationResponse = {
      success: verificationResult.success,
      paymentId: verificationResult.paymentId,
      orderId: verificationResult.orderId,
      amount: verificationResult.amount,
      currency: verificationResult.currency,
      status: verificationResult.status,
      verifiedAt: verificationResult.verifiedAt,
    };

    logger.info('Payment verification completed', {
      success: verificationResult.success,
      paymentId: verificationResult.paymentId,
      status: verificationResult.status,
    });

    return createSuccessResponse({
      data: {
        verification: response,
      },
      message: verificationResult.success
        ? 'Payment verified successfully'
        : 'Payment verification completed',
    });
  } catch (error: unknown) {
    logger.error('Payment verification failed', undefined, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return handleError(error as Error);
  } finally {
    await prisma.$disconnect();
  }
};
