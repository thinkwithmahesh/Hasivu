/**
 * HASIVU Platform - Get Payment Status Lambda Function
 * Handles: GET /payments/status/{paymentId}
 * Retrieves payment status and details
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
 * Payment status response interface
 */
interface PaymentStatusResponse {
  id: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  orderId?: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  capturedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
}

/**
 * Get payment status handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    // Only allow GET method
    if (event.httpMethod !== 'GET') {
      return createErrorResponse('Method not allowed', 'Only GET method is allowed', 405);
    }

    // Extract payment ID from path parameters
    const paymentId = event.pathParameters?.paymentId;
    if (!paymentId) {
      return createErrorResponse('Missing payment ID', 'paymentId is required in path', 400);
    }

    // Extract userId from event context
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse('Authentication required', 'User authentication required', 401);
    }

    logger.info('Getting payment status', { paymentId, userId });

    // Get payment transaction
    const paymentTransaction = await prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
      include: {
        paymentOrder: true,
      },
    });

    if (!paymentTransaction) {
      return createErrorResponse('Payment not found', 'Payment transaction not found', 404);
    }

    // Check user authorization
    if (paymentTransaction.paymentOrder?.userId !== userId) {
      // Allow school admin access
      const order = paymentTransaction.paymentOrder?.orderId
        ? await prisma.order.findUnique({
            where: { id: paymentTransaction.paymentOrder.orderId },
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
        return createErrorResponse('Access denied', 'Not authorized to view this payment', 403);
      }
    }

    const response: PaymentStatusResponse = {
      id: paymentTransaction.id,
      razorpayOrderId: paymentTransaction.paymentOrderId,
      razorpayPaymentId: paymentTransaction.razorpayPaymentId,
      orderId: paymentTransaction.paymentOrder?.orderId || undefined,
      amount: Number(paymentTransaction.amount),
      currency: paymentTransaction.currency,
      status: paymentTransaction.status,
      method: paymentTransaction.method || undefined,
      capturedAt: paymentTransaction.capturedAt || undefined,
      refundedAt: paymentTransaction.refundedAt || undefined,
      createdAt: paymentTransaction.createdAt,
    };

    logger.info('Payment status retrieved', {
      paymentId,
      status: paymentTransaction.status,
    });

    return createSuccessResponse({
      data: {
        payment: response,
      },
      message: 'Payment status retrieved successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to get payment status', undefined, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return handleError(error as Error);
  } finally {
    await prisma.$disconnect();
  }
};
