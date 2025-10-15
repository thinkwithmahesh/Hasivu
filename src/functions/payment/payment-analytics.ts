/**
 * HASIVU Platform - Payment Analytics Lambda Function
 * Handles: GET /payments/analytics
 * Provides payment analytics and insights
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
 * Payment analytics response interface
 */
interface PaymentAnalyticsResponse {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  refundedAmount: number;
  averagePaymentAmount: number;
  paymentsByMethod: Record<string, number>;
  paymentsByStatus: Record<string, number>;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    method?: string;
    createdAt: Date;
  }>;
}

/**
 * Get payment analytics handler
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

    // Extract userId from event context
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse('Authentication required', 'User authentication required', 401);
    }

    logger.info('Getting payment analytics', { userId });

    // Get user's school for filtering
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true, role: true },
    });

    if (!user) {
      return createErrorResponse('User not found', 'User not found', 404);
    }

    // Build where clause based on user role
    let whereClause: any = {};
    if (!['admin', 'super_admin'].includes(user.role)) {
      whereClause = {
        paymentOrder: {
          order: {
            schoolId: user.schoolId,
          },
        },
      };
    }

    // Get payment statistics
    const [
      totalPayments,
      successfulPayments,
      failedPayments,
      totalAmountResult,
      refundedAmountResult,
      paymentsByMethod,
      paymentsByStatus,
      recentPayments,
    ] = await Promise.all([
      // Total payments count
      prisma.paymentTransaction.count({ where: whereClause }),

      // Successful payments count
      prisma.paymentTransaction.count({
        where: {
          ...whereClause,
          status: 'captured',
        },
      }),

      // Failed payments count
      prisma.paymentTransaction.count({
        where: {
          ...whereClause,
          status: 'failed',
        },
      }),

      // Total amount
      prisma.paymentTransaction.aggregate({
        where: whereClause,
        _sum: { amount: true },
      }),

      // Refunded amount
      prisma.paymentRefund.aggregate({
        _sum: { amount: true },
      }),

      // Payments by method
      prisma.paymentTransaction.groupBy({
        by: ['method'],
        where: whereClause,
        _count: true,
      }),

      // Payments by status
      prisma.paymentTransaction.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true,
      }),

      // Recent payments
      prisma.paymentTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          status: true,
          method: true,
          createdAt: true,
        },
      }),
    ]);

    // Calculate analytics
    const totalAmount = Number(totalAmountResult._sum.amount || 0);
    const refundedAmount = Number(refundedAmountResult._sum.amount || 0);
    const averagePaymentAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

    // Format grouped data
    const paymentsByMethodMap: Record<string, number> = {};
    paymentsByMethod.forEach(item => {
      paymentsByMethodMap[item.method || 'unknown'] = item._count;
    });

    const paymentsByStatusMap: Record<string, number> = {};
    paymentsByStatus.forEach(item => {
      paymentsByStatusMap[item.status] = item._count;
    });

    const response: PaymentAnalyticsResponse = {
      totalPayments,
      totalAmount,
      successfulPayments,
      failedPayments,
      refundedAmount,
      averagePaymentAmount: Math.round(averagePaymentAmount * 100) / 100,
      paymentsByMethod: paymentsByMethodMap,
      paymentsByStatus: paymentsByStatusMap,
      recentPayments: recentPayments.map(p => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        method: p.method || undefined,
        createdAt: p.createdAt,
      })),
    };

    logger.info('Payment analytics retrieved', {
      totalPayments,
      totalAmount,
      userId,
    });

    return createSuccessResponse({
      data: {
        analytics: response,
      },
      message: 'Payment analytics retrieved successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to get payment analytics', undefined, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return handleError(error as Error);
  } finally {
    await prisma.$disconnect();
  }
};
