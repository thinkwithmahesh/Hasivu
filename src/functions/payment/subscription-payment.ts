/**
 * HASIVU Platform - Subscription Payment Lambda Function
 * Handles: POST /payments/subscription
 * Processes subscription payments and creates recurring payment orders
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

/**
 * Subscription payment request interface
 */
interface SubscriptionPaymentRequest {
  subscriptionId: string;
  billingCycleId?: string; // Optional, defaults to current cycle
}

/**
 * Subscription payment response interface
 */
interface SubscriptionPaymentResponse {
  paymentOrderId: string;
  razorpayOrderId: string;
  subscriptionId: string;
  billingCycleId: string;
  amount: number;
  currency: string;
  status: string;
  expiresAt: Date;
}

/**
 * Validate subscription and billing cycle
 */
async function validateSubscriptionPayment(
  subscriptionId: string,
  billingCycleId: string | undefined,
  userId: string
): Promise<{ subscription: any; billingCycle: any }> {
  // Get subscription with relations
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: true,
      student: true,
      school: true,
      subscriptionPlan: true,
      billingCycles: {
        where: billingCycleId ? { id: billingCycleId } : { status: 'pending' },
        orderBy: { cycleStart: 'asc' },
        take: 1,
      },
    },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Check if user owns this subscription
  if (subscription.userId !== userId) {
    // Allow school admin access
    const adminUser = await prisma.user.findFirst({
      where: {
        id: userId,
        schoolId: subscription.schoolId,
        role: { in: ['school_admin', 'admin', 'super_admin'] },
        isActive: true,
      },
    });

    if (!adminUser) {
      throw new Error('Not authorized to process payment for this subscription');
    }
  }

  // Check subscription status
  if (!['active', 'trialing'].includes(subscription.status)) {
    throw new Error(`Subscription cannot be paid in current status: ${subscription.status}`);
  }

  // Get billing cycle
  const billingCycle = subscription.billingCycles[0];
  if (!billingCycle) {
    throw new Error('No pending billing cycle found for this subscription');
  }

  // Check if billing cycle is already paid
  if (billingCycle.status === 'paid') {
    throw new Error('Billing cycle has already been paid');
  }

  // Check if billing cycle is due
  const now = new Date();
  if (billingCycle.billingDate > now) {
    throw new Error(
      `Billing cycle is not due yet. Due date: ${billingCycle.billingDate.toISOString()}`
    );
  }

  return { subscription, billingCycle };
}

/**
 * Subscription payment handler
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
    const body: SubscriptionPaymentRequest = JSON.parse(event.body || '{}');

    if (!body.subscriptionId) {
      return createErrorResponse('Missing subscription ID', 'subscriptionId is required', 400);
    }

    // Extract userId from event context
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse('Authentication required', 'User authentication required', 401);
    }

    logger.info('Processing subscription payment', {
      subscriptionId: body.subscriptionId,
      billingCycleId: body.billingCycleId,
      userId,
    });

    // Validate subscription and billing cycle
    const { subscription, billingCycle } = await validateSubscriptionPayment(
      body.subscriptionId,
      body.billingCycleId,
      userId
    );

    // Calculate amount in paise
    const amountInPaise = Math.round(billingCycle.totalAmount * 100);

    // Create Razorpay order
    const razorpayOrderOptions: RazorpayOrderOptions = {
      amount: amountInPaise,
      currency: billingCycle.currency,
      receipt: `subscription_${subscription.id}_cycle_${billingCycle.cycleNumber}`,
      payment_capture: true,
      notes: {
        subscriptionId: subscription.id,
        billingCycleId: billingCycle.id,
        userId: subscription.userId,
        studentId: subscription.studentId || '',
        schoolId: subscription.schoolId,
        planName: subscription.subscriptionPlan.name,
        cycleNumber: String(billingCycle.cycleNumber),
      },
    };

    const razorpayOrder = await razorpayService.createOrder(razorpayOrderOptions);

    // Create payment order record
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        id: razorpayOrder.id,
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: billingCycle.currency,
        status: razorpayOrder.status,
        userId: subscription.userId,
        subscriptionId: subscription.id,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
        metadata: JSON.stringify({
          subscriptionId: subscription.id,
          billingCycleId: billingCycle.id,
          cycleNumber: billingCycle.cycleNumber,
          planName: subscription.subscriptionPlan.name,
          studentName: subscription.student
            ? `${subscription.student.firstName} ${subscription.student.lastName}`
            : undefined,
        }),
      },
    });

    // Update billing cycle status
    await prisma.billingCycle.update({
      where: { id: billingCycle.id },
      data: {
        status: 'processing',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'Subscription',
        entityId: subscription.id,
        action: 'PAYMENT_INITIATED',
        changes: JSON.stringify({
          billingCycleId: billingCycle.id,
          amount: billingCycle.totalAmount,
          razorpayOrderId: razorpayOrder.id,
        }),
        userId,
        createdById: userId,
        metadata: JSON.stringify({
          action: 'SUBSCRIPTION_PAYMENT_INITIATED',
          paymentOrderId: paymentOrder.id,
        }),
      },
    });

    const response: SubscriptionPaymentResponse = {
      paymentOrderId: paymentOrder.id,
      razorpayOrderId: paymentOrder.razorpayOrderId,
      subscriptionId: subscription.id,
      billingCycleId: billingCycle.id,
      amount: Number(paymentOrder.amount),
      currency: paymentOrder.currency,
      status: paymentOrder.status,
      expiresAt: paymentOrder.expiresAt,
    };

    logger.info('Subscription payment order created successfully', {
      paymentOrderId: paymentOrder.id,
      razorpayOrderId: razorpayOrder.id,
      subscriptionId: subscription.id,
      amount: billingCycle.totalAmount,
    });

    return createSuccessResponse({
      data: {
        paymentOrder: response,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
      },
      message: 'Subscription payment order created successfully',
    });
  } catch (error: unknown) {
    logger.error('Failed to process subscription payment', undefined, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return handleError(error as Error);
  } finally {
    await prisma.$disconnect();
  }
};
