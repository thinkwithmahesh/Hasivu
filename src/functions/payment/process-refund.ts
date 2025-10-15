/**
 * HASIVU Platform - Process Refund Lambda Function
 * Handles: POST /payments/refund
 * Processes refunds for HASIVU payments via Razorpay
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
 * Process refund request interface
 */
interface ProcessRefundRequest {
  paymentId: string;
  amount?: number; // Optional partial refund, defaults to full amount
  reason: string;
  notes?: string;
}

/**
 * Refund response interface
 */
interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  reason: string;
  notes?: string;
  processedAt: Date;
  createdAt: Date;
}

/**
 * Validate refund request
 */
async function validateRefundRequest(
  paymentId: string,
  amount: number | undefined,
  userId: string
): Promise<any> {
  // Get payment transaction
  const paymentTransaction = await prisma.paymentTransaction.findUnique({
    where: { id: paymentId },
  });

  if (!paymentTransaction) {
    throw new Error('Payment transaction not found');
  }

  // Get associated payment order
  const paymentOrder = paymentTransaction.paymentOrderId
    ? await prisma.paymentOrder.findUnique({
        where: { id: paymentTransaction.paymentOrderId },
      })
    : null;

  // Get associated order if exists
  const order = paymentOrder?.orderId
    ? await prisma.order.findUnique({
        where: { id: paymentOrder.orderId },
      })
    : null;

  // Check if payment was successful
  if (paymentTransaction.status !== 'captured') {
    throw new Error('Only captured payments can be refunded');
  }

  // Check user authorization
  if (paymentOrder?.userId !== userId) {
    // Allow school admin access
    const adminUser = await prisma.user.findFirst({
      where: {
        id: userId,
        schoolId: order?.schoolId,
        role: { in: ['school_admin', 'admin', 'super_admin'] },
        isActive: true,
      },
    });

    if (!adminUser) {
      throw new Error('Not authorized to process refund for this payment');
    }
  }

  // Check if already refunded
  const existingRefund = await prisma.paymentRefund.findFirst({
    where: { paymentId },
  });

  if (existingRefund) {
    throw new Error('Payment has already been refunded');
  }

  // Determine refund amount
  const refundAmount = amount || Number(paymentTransaction.amount);

  // Check refund amount doesn't exceed payment amount
  if (refundAmount > Number(paymentTransaction.amount)) {
    throw new Error('Refund amount cannot exceed payment amount');
  }

  return {
    paymentTransaction,
    refundAmount,
  };
}

/**
 * Process refund handler
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
    const body: ProcessRefundRequest = JSON.parse(event.body || '{}');

    if (!body.paymentId || !body.reason) {
      return createErrorResponse(
        'Missing required fields',
        'paymentId and reason are required',
        400
      );
    }

    // Extract userId from event context
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse('Authentication required', 'User authentication required', 401);
    }

    logger.info('Processing refund request', {
      paymentId: body.paymentId,
      amount: body.amount,
      reason: body.reason,
    });

    // Validate refund request
    const { paymentTransaction, refundAmount } = await validateRefundRequest(
      body.paymentId,
      body.amount,
      userId
    );

    // Process refund via Razorpay
    const razorpayRefund = await razorpayService.createRefund(
      paymentTransaction.razorpayPaymentId,
      {
        amount: refundAmount,
        notes: {
          reason: body.reason,
          notes: body.notes || '',
          processedBy: userId,
        },
      }
    );

    // Create refund record in database
    const refund = await prisma.paymentRefund.create({
      data: {
        razorpayRefundId: razorpayRefund.id,
        paymentId: body.paymentId,
        amount: refundAmount,
        currency: razorpayRefund.currency,
        status: razorpayRefund.status,
        reason: body.reason,
        notes: JSON.stringify({
          reason: body.reason,
          notes: body.notes || '',
          processedBy: userId,
        }),
        processedAt: new Date(),
      },
    });

    // Update payment transaction status
    await prisma.paymentTransaction.update({
      where: { id: body.paymentId },
      data: {
        refundedAt: new Date(),
      },
    });

    // Update order status if fully refunded
    if (paymentTransaction.paymentOrder?.orderId) {
      await prisma.order.update({
        where: { id: paymentTransaction.paymentOrder.orderId },
        data: {
          paymentStatus: 'refunded',
          status: 'cancelled',
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'PaymentRefund',
        entityId: refund.id,
        action: 'CREATE',
        changes: JSON.stringify({
          paymentId: body.paymentId,
          amount: refundAmount,
          reason: body.reason,
          razorpayRefundId: razorpayRefund.id,
        }),
        userId,
        createdById: userId,
        metadata: JSON.stringify({
          action: 'PAYMENT_REFUND_PROCESSED',
          razorpayRefundId: razorpayRefund.id,
        }),
      },
    });

    const response: RefundResponse = {
      id: refund.id,
      paymentId: body.paymentId,
      amount: Number(refund.amount),
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      notes: body.notes,
      processedAt: refund.processedAt || new Date(),
      createdAt: refund.createdAt,
    };

    logger.info('Refund processed successfully', {
      refundId: refund.id,
      paymentId: body.paymentId,
      amount: refundAmount,
      status: refund.status,
    });

    return createSuccessResponse({
      data: {
        refund: response,
      },
      message: 'Refund processed successfully',
    });
  } catch (error: unknown) {
    logger.error('Refund processing failed', undefined, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return handleError(error as Error);
  } finally {
    await prisma.$disconnect();
  }
};
