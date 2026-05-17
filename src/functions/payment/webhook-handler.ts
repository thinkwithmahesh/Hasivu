/**
 * Payment Webhook Handler Lambda Function
 * Handles: POST /payments/webhook
 * Implements Epic 5: Payment Processing - Webhook Event Processing
 *
 * HASIVU Platform - Payment Webhook Processing Service
 * Critical payment verification and order status updates
 * Security-hardened with signature verification and replay protection
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '../../shared/utils/logger';
import {
  createSuccessResponse,
  createErrorResponse,
  handleError,
} from '../../shared/response.utils';
import { prisma } from '../../database/DatabaseManager';
import { razorpayService } from '../shared/razorpay.service';
import * as crypto from 'crypto';

/**
 * Razorpay webhook event types we handle
 */
const SUPPORTED_EVENTS = [
  'payment.captured',
  'payment.failed',
  'payment.authorized',
  'order.paid',
  'refund.created',
  'refund.processed',
];

// Webhook replay protection - store processed webhook IDs
const WEBHOOK_EXPIRY_MINUTES = 10;
const processedWebhooks = new Map<string, number>();

/**
 * Check if webhook was already processed (replay attack protection)
 */
function isWebhookProcessed(webhookId: string): boolean {
  const now = Date.now();

  // Clean up expired entries
  for (const [id, timestamp] of processedWebhooks.entries()) {
    if (now - timestamp > WEBHOOK_EXPIRY_MINUTES * 60 * 1000) {
      processedWebhooks.delete(id);
    }
  }

  // Check if webhook was already processed
  if (processedWebhooks.has(webhookId)) {
    return true;
  }

  // Mark as processed
  processedWebhooks.set(webhookId, now);
  return false;
}

/**
 * Process payment captured event
 */
async function processPaymentCaptured(eventData: any): Promise<void> {
  const paymentEntity = eventData.payment.entity;

  logger.info('Processing payment.captured event', {
    paymentId: paymentEntity.id,
    orderId: paymentEntity.order_id,
    amount: paymentEntity.amount,
  });

  // Update payment transaction status
  await prisma.paymentTransaction.updateMany({
    where: { razorpayPaymentId: paymentEntity.id },
    data: {
      status: 'captured',
      capturedAt: new Date(),
    },
  });

  // Update payment order status
  await prisma.paymentOrder.updateMany({
    where: { razorpayOrderId: paymentEntity.order_id },
    data: { status: 'captured' },
  });

  // Get payment order to check for linked order or subscription
  const paymentOrder = await prisma.paymentOrder.findFirst({
    where: { razorpayOrderId: paymentEntity.order_id },
  });

  if (!paymentOrder) {
    logger.warn('Payment order not found for captured payment', {
      razorpayOrderId: paymentEntity.order_id,
    });
    return;
  }

  // Update order status if exists
  if (paymentOrder.orderId) {
    await prisma.order.update({
      where: { id: paymentOrder.orderId },
      data: {
        paymentStatus: 'paid',
        status: 'confirmed',
      },
    });

    logger.info('Order status updated to confirmed', {
      orderId: paymentOrder.orderId,
      paymentId: paymentEntity.id,
    });
  }

  // Update subscription billing cycle if exists
  if (paymentOrder.subscriptionId) {
    // Find the billing cycle being paid
    const billingCycle = await prisma.billingCycle.findFirst({
      where: {
        subscriptionId: paymentOrder.subscriptionId,
        status: 'processing',
      },
      orderBy: {
        cycleStart: 'asc',
      },
    });

    if (billingCycle) {
      await prisma.billingCycle.update({
        where: { id: billingCycle.id },
        data: {
          status: 'paid',
          paidDate: new Date(),
          paymentId: paymentOrder.id,
        },
      });

      // Update subscription status
      await prisma.subscription.update({
        where: { id: paymentOrder.subscriptionId },
        data: {
          status: 'active',
          dunningAttempts: 0, // Reset dunning attempts on successful payment
        },
      });

      logger.info('Subscription billing cycle updated', {
        subscriptionId: paymentOrder.subscriptionId,
        billingCycleId: billingCycle.id,
      });
    }
  }
}

/**
 * Process payment failed event
 */
async function processPaymentFailed(eventData: any): Promise<void> {
  const paymentEntity = eventData.payment.entity;

  logger.info('Processing payment.failed event', {
    paymentId: paymentEntity.id,
    orderId: paymentEntity.order_id,
    errorCode: paymentEntity.error_code,
    errorDescription: paymentEntity.error_description,
  });

  // Update payment transaction status
  await prisma.paymentTransaction.updateMany({
    where: { razorpayPaymentId: paymentEntity.id },
    data: {
      status: 'failed',
    },
  });

  // Update payment order status
  await prisma.paymentOrder.updateMany({
    where: { razorpayOrderId: paymentEntity.order_id },
    data: { status: 'failed' },
  });

  // Get payment order
  const paymentOrder = await prisma.paymentOrder.findFirst({
    where: { razorpayOrderId: paymentEntity.order_id },
  });

  if (!paymentOrder) {
    logger.warn('Payment order not found for failed payment', {
      razorpayOrderId: paymentEntity.order_id,
    });
    return;
  }

  // Update order status if exists
  if (paymentOrder.orderId) {
    await prisma.order.update({
      where: { id: paymentOrder.orderId },
      data: {
        paymentStatus: 'failed',
        status: 'cancelled',
      },
    });

    logger.info('Order status updated to cancelled due to payment failure', {
      orderId: paymentOrder.orderId,
      paymentId: paymentEntity.id,
    });
  }

  // Handle subscription payment failure
  if (paymentOrder.subscriptionId) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: paymentOrder.subscriptionId },
    });

    if (subscription) {
      const newDunningAttempts = subscription.dunningAttempts + 1;
      const shouldSuspend = newDunningAttempts >= subscription.maxDunningAttempts;

      await prisma.subscription.update({
        where: { id: paymentOrder.subscriptionId },
        data: {
          dunningAttempts: newDunningAttempts,
          status: shouldSuspend ? 'suspended' : subscription.status,
          suspendedAt: shouldSuspend ? new Date() : undefined,
        },
      });

      logger.info('Subscription dunning attempt recorded', {
        subscriptionId: paymentOrder.subscriptionId,
        dunningAttempts: newDunningAttempts,
        suspended: shouldSuspend,
      });
    }
  }
}

/**
 * Process refund created event
 */
async function processRefundCreated(eventData: any): Promise<void> {
  const refundEntity = eventData.refund.entity;

  logger.info('Processing refund.created event', {
    refundId: refundEntity.id,
    paymentId: refundEntity.payment_id,
    amount: refundEntity.amount,
  });

  // Check if refund already exists
  const existingRefund = await prisma.paymentRefund.findUnique({
    where: { razorpayRefundId: refundEntity.id },
  });

  if (existingRefund) {
    logger.info('Refund already exists, skipping creation', {
      refundId: refundEntity.id,
    });
    return;
  }

  // Find the payment transaction
  const paymentTransaction = await prisma.paymentTransaction.findFirst({
    where: { razorpayPaymentId: refundEntity.payment_id },
  });

  if (!paymentTransaction) {
    logger.warn('Payment transaction not found for refund', {
      paymentId: refundEntity.payment_id,
    });
    return;
  }

  // Create refund record
  await prisma.paymentRefund.create({
    data: {
      razorpayRefundId: refundEntity.id,
      paymentId: paymentTransaction.id,
      amount: refundEntity.amount,
      currency: refundEntity.currency,
      status: refundEntity.status,
      reason: 'webhook_refund',
      notes: JSON.stringify(refundEntity.notes || {}),
      processedAt: new Date(),
    },
  });

  // Update payment transaction
  await prisma.paymentTransaction.update({
    where: { id: paymentTransaction.id },
    data: {
      refundedAt: new Date(),
    },
  });

  logger.info('Refund record created', {
    refundId: refundEntity.id,
    paymentId: refundEntity.payment_id,
  });
}

/**
 * Process webhook event
 */
async function processWebhookEvent(eventType: string, eventData: any): Promise<void> {
  switch (eventType) {
    case 'payment.captured':
      await processPaymentCaptured(eventData);
      break;

    case 'payment.failed':
      await processPaymentFailed(eventData);
      break;

    case 'payment.authorized':
      // Payment authorized but not yet captured
      logger.info('Payment authorized (not captured yet)', {
        paymentId: eventData.payment.entity.id,
      });
      break;

    case 'order.paid':
      // Order marked as paid
      logger.info('Order marked as paid', {
        orderId: eventData.order.entity.id,
      });
      break;

    case 'refund.created':
      await processRefundCreated(eventData);
      break;

    case 'refund.processed':
      // Refund processed
      logger.info('Refund processed', {
        refundId: eventData.refund.entity.id,
      });
      break;

    default:
      logger.warn('Unhandled webhook event type', { eventType });
  }
}

/**
 * Validate webhook signature
 */
function validateWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    return razorpayService.verifyWebhookSignature(body, signature, secret);
  } catch (error) {
    logger.error('Webhook signature validation failed', undefined, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Webhook handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;

  try {
    // Only allow POST method
    if (event.httpMethod !== 'POST') {
      return createErrorResponse('Method not allowed', 'Only POST method is allowed', 405);
    }

    // Get webhook signature from headers
    const signature = event.headers['x-razorpay-signature'];
    if (!signature) {
      logger.warn('Missing Razorpay signature header', { requestId });
      return createErrorResponse('Missing signature', 'X-Razorpay-Signature header required', 400);
    }

    // Parse webhook body
    const { body } = event;
    if (!body) {
      return createErrorResponse('Missing body', 'Request body required', 400);
    }

    // Validate webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return createErrorResponse('Configuration error', 'Webhook secret not configured', 500);
    }

    const isValidSignature = validateWebhookSignature(body, signature, webhookSecret);
    if (!isValidSignature) {
      logger.warn('Invalid webhook signature', { requestId });
      return createErrorResponse('Invalid signature', 'Webhook signature verification failed', 401);
    }

    // Parse webhook payload
    const webhookData = JSON.parse(body);
    const eventType = webhookData.event;
    const webhookId = webhookData.id || `${webhookData.event}_${Date.now()}`;
    const eventData = webhookData;

    // Check for replay attacks
    if (isWebhookProcessed(webhookId)) {
      logger.warn('Duplicate webhook detected (replay attack prevention)', {
        webhookId,
        eventType,
        requestId,
      });
      return createSuccessResponse({
        message: 'Webhook already processed',
      });
    }

    logger.info('Received valid Razorpay webhook', {
      requestId,
      eventType,
      eventId: webhookData.id,
      webhookId,
    });

    // Check if event type is supported
    if (!SUPPORTED_EVENTS.includes(eventType)) {
      logger.info('Ignoring unsupported webhook event', { eventType, requestId });
      return createSuccessResponse({
        message: 'Event type not supported, ignored',
      });
    }

    // Process the webhook event
    await processWebhookEvent(eventType, eventData);

    // Create webhook log for audit
    await prisma.auditLog.create({
      data: {
        entityType: 'Webhook',
        entityId: webhookData.id || webhookId,
        action: 'WEBHOOK_RECEIVED',
        changes: JSON.stringify({
          eventType,
          eventId: webhookData.id,
          webhookId,
          processedAt: new Date().toISOString(),
        }),
        userId: 'system', // Webhooks are system events
        createdById: 'system',
        metadata: JSON.stringify({
          source: 'razorpay',
          signature: `${signature.substring(0, 10)}...`, // Log partial signature for debugging
          requestId,
        }),
      },
    });

    logger.info('Webhook processed successfully', {
      requestId,
      eventType,
      eventId: webhookData.id,
      webhookId,
    });

    return createSuccessResponse({
      message: 'Webhook processed successfully',
    });
  } catch (error: unknown) {
    logger.error('Webhook processing failed', error as Error, { requestId });
    // Return 200 to prevent Razorpay from retrying (idempotent)
    return createSuccessResponse({
      message: 'Webhook processing failed, but acknowledged',
    });
  } finally {
    await prisma.$disconnect();
  }
};
