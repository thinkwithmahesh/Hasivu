/**
 * Enhanced Webhook Handler Unit Tests
 * Tests webhook signature verification, replay attack protection, and event processing
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import crypto from 'crypto';
import { handler } from '../../../../src/functions/payment/webhook-handler';
import { prisma } from '../../../../src/database/DatabaseManager';
import { razorpayService } from '../../../../src/functions/shared/razorpay.service';

// Mock dependencies
jest.mock('../../../../src/database/DatabaseManager', () => ({
  prisma: {
    paymentTransaction: {
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    paymentOrder: {
      updateMany: jest.fn(),
      findFirst: jest.fn(),
    },
    order: {
      update: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    billingCycle: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    paymentRefund: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../../../src/functions/shared/razorpay.service', () => ({
  razorpayService: {
    verifyWebhookSignature: jest.fn(),
  },
}));

describe('Enhanced Webhook Handler', () => {
  const mockContext = {
    awsRequestId: 'test-request-id',
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'webhook-handler',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:region:account:function:webhook-handler',
    memoryLimitInMB: '512',
    logGroupName: '/aws/lambda/webhook-handler',
    logStreamName: '2024/01/01/[$LATEST]test',
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
  });

  afterEach(() => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
  });

  describe('Security - Signature Verification', () => {
    it('should reject requests without signature header', async () => {
      const event = {
        httpMethod: 'POST',
        headers: {},
        body: JSON.stringify({
          event: 'payment.captured',
          id: 'webhook_test_123',
        }),
      } as any;

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('signature');
    });

    it('should reject requests with invalid signature', async () => {
      jest.mocked(razorpayService.verifyWebhookSignature).mockReturnValue(false);

      const event = {
        httpMethod: 'POST',
        headers: {
          'x-razorpay-signature': 'invalid_signature',
        },
        body: JSON.stringify({
          event: 'payment.captured',
          id: 'webhook_test_123',
        }),
      } as any;

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).error).toContain('signature');
    });

    it('should accept requests with valid signature', async () => {
      jest.mocked(razorpayService.verifyWebhookSignature).mockReturnValue(true);
      jest.mocked(prisma.paymentOrder.findFirst).mockResolvedValue({
        id: 'order_123',
        razorpayOrderId: 'order_razorpay_123',
        orderId: 'meal_order_123',
      } as any);

      const event = {
        httpMethod: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
        },
        body: JSON.stringify({
          event: 'payment.captured',
          id: 'webhook_test_123',
          payment: {
            entity: {
              id: 'pay_123',
              order_id: 'order_123',
              amount: 50000,
              status: 'captured',
            },
          },
        }),
      } as any;

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(razorpayService.verifyWebhookSignature).toHaveBeenCalledWith(
        event.body,
        'valid_signature',
        'test_webhook_secret'
      );
    });
  });

  describe('Security - Replay Attack Protection', () => {
    it('should process webhook only once (replay protection)', async () => {
      jest.mocked(razorpayService.verifyWebhookSignature).mockReturnValue(true);
      jest.mocked(prisma.paymentOrder.findFirst).mockResolvedValue({
        id: 'order_123',
        razorpayOrderId: 'order_razorpay_123',
        orderId: 'meal_order_123',
      } as any);

      const webhookBody = {
        event: 'payment.captured',
        id: 'webhook_test_replay',
        payment: {
          entity: {
            id: 'pay_123',
            order_id: 'order_123',
            amount: 50000,
          },
        },
      };

      const event = {
        httpMethod: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
        },
        body: JSON.stringify(webhookBody),
      } as any;

      // First request - should process
      const result1 = await handler(event, mockContext);
      expect(result1.statusCode).toBe(200);
      expect(JSON.parse(result1.body).message).toBe('Webhook processed successfully');

      // Second request - should be detected as replay
      jest.clearAllMocks();
      const result2 = await handler(event, mockContext);
      expect(result2.statusCode).toBe(200);
      expect(JSON.parse(result2.body).message).toBe('Webhook already processed');

      // Verify database was not updated second time
      expect(prisma.paymentTransaction.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('Event Processing - Payment Captured', () => {
    it('should update payment transaction and order status on payment.captured', async () => {
      jest.mocked(razorpayService.verifyWebhookSignature).mockReturnValue(true);
      jest.mocked(prisma.paymentOrder.findFirst).mockResolvedValue({
        id: 'order_123',
        razorpayOrderId: 'order_razorpay_123',
        orderId: 'meal_order_123',
        subscriptionId: null,
      } as any);

      const event = {
        httpMethod: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
        },
        body: JSON.stringify({
          event: 'payment.captured',
          id: 'webhook_captured_123',
          payment: {
            entity: {
              id: 'pay_123',
              order_id: 'order_razorpay_123',
              amount: 50000,
            },
          },
        }),
      } as any;

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);

      // Verify payment transaction updated
      expect(prisma.paymentTransaction.updateMany).toHaveBeenCalledWith({
        where: { razorpayPaymentId: 'pay_123' },
        data: expect.objectContaining({
          status: 'captured',
        }),
      });

      // Verify payment order updated
      expect(prisma.paymentOrder.updateMany).toHaveBeenCalledWith({
        where: { razorpayOrderId: 'order_razorpay_123' },
        data: { status: 'captured' },
      });

      // Verify order status updated
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'meal_order_123' },
        data: {
          paymentStatus: 'paid',
          status: 'confirmed',
        },
      });

      // Verify audit log created
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should update subscription billing cycle on subscription payment captured', async () => {
      jest.mocked(razorpayService.verifyWebhookSignature).mockReturnValue(true);
      jest.mocked(prisma.paymentOrder.findFirst).mockResolvedValue({
        id: 'order_123',
        razorpayOrderId: 'order_razorpay_123',
        subscriptionId: 'sub_123',
        orderId: null,
      } as any);
      jest.mocked(prisma.billingCycle.findFirst).mockResolvedValue({
        id: 'cycle_123',
        subscriptionId: 'sub_123',
        status: 'processing',
      } as any);

      const event = {
        httpMethod: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
        },
        body: JSON.stringify({
          event: 'payment.captured',
          id: 'webhook_sub_captured_123',
          payment: {
            entity: {
              id: 'pay_sub_123',
              order_id: 'order_razorpay_123',
              amount: 500000,
            },
          },
        }),
      } as any;

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);

      // Verify billing cycle updated
      expect(prisma.billingCycle.update).toHaveBeenCalledWith({
        where: { id: 'cycle_123' },
        data: expect.objectContaining({
          status: 'paid',
          paymentId: 'order_123',
        }),
      });

      // Verify subscription updated
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub_123' },
        data: expect.objectContaining({
          status: 'active',
          dunningAttempts: 0,
        }),
      });
    });
  });

  describe('Event Processing - Payment Failed', () => {
    it('should cancel order on payment.failed', async () => {
      jest.mocked(razorpayService.verifyWebhookSignature).mockReturnValue(true);
      jest.mocked(prisma.paymentOrder.findFirst).mockResolvedValue({
        id: 'order_123',
        razorpayOrderId: 'order_razorpay_123',
        orderId: 'meal_order_123',
        subscriptionId: null,
      } as any);

      const event = {
        httpMethod: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
        },
        body: JSON.stringify({
          event: 'payment.failed',
          id: 'webhook_failed_123',
          payment: {
            entity: {
              id: 'pay_failed_123',
              order_id: 'order_razorpay_123',
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'Payment failed',
            },
          },
        }),
      } as any;

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);

      // Verify order cancelled
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'meal_order_123' },
        data: {
          paymentStatus: 'failed',
          status: 'cancelled',
        },
      });
    });

    it('should handle subscription dunning on payment failure', async () => {
      jest.mocked(razorpayService.verifyWebhookSignature).mockReturnValue(true);
      jest.mocked(prisma.paymentOrder.findFirst).mockResolvedValue({
        id: 'order_123',
        razorpayOrderId: 'order_razorpay_123',
        subscriptionId: 'sub_123',
        orderId: null,
      } as any);
      jest.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: 'sub_123',
        dunningAttempts: 2,
        maxDunningAttempts: 3,
        status: 'active',
      } as any);

      const event = {
        httpMethod: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
        },
        body: JSON.stringify({
          event: 'payment.failed',
          id: 'webhook_sub_failed_123',
          payment: {
            entity: {
              id: 'pay_sub_failed_123',
              order_id: 'order_razorpay_123',
              error_code: 'GATEWAY_ERROR',
            },
          },
        }),
      } as any;

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);

      // Verify subscription suspended after max dunning attempts
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub_123' },
        data: expect.objectContaining({
          dunningAttempts: 3,
          status: 'suspended',
          suspendedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('Event Processing - Refund Created', () => {
    it('should create refund record on refund.created', async () => {
      jest.mocked(razorpayService.verifyWebhookSignature).mockReturnValue(true);
      jest.mocked(prisma.paymentRefund.findUnique).mockResolvedValue(null);
      jest.mocked(prisma.paymentTransaction.findFirst).mockResolvedValue({
        id: 'payment_txn_123',
        razorpayPaymentId: 'pay_123',
      } as any);

      const event = {
        httpMethod: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
        },
        body: JSON.stringify({
          event: 'refund.created',
          id: 'webhook_refund_123',
          refund: {
            entity: {
              id: 'rfnd_123',
              payment_id: 'pay_123',
              amount: 50000,
              currency: 'INR',
              status: 'processed',
              notes: { reason: 'Customer request' },
            },
          },
        }),
      } as any;

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);

      // Verify refund created
      expect(prisma.paymentRefund.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          razorpayRefundId: 'rfnd_123',
          paymentId: 'payment_txn_123',
          amount: 50000,
          currency: 'INR',
          status: 'processed',
        }),
      });

      // Verify payment transaction updated
      expect(prisma.paymentTransaction.update).toHaveBeenCalledWith({
        where: { id: 'payment_txn_123' },
        data: expect.objectContaining({
          refundedAt: expect.any(Date),
        }),
      });
    });

    it('should skip creating duplicate refund records', async () => {
      jest.mocked(razorpayService.verifyWebhookSignature).mockReturnValue(true);
      jest.mocked(prisma.paymentRefund.findUnique).mockResolvedValue({
        id: 'existing_refund_123',
        razorpayRefundId: 'rfnd_123',
      } as any);

      const event = {
        httpMethod: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
        },
        body: JSON.stringify({
          event: 'refund.created',
          id: 'webhook_duplicate_refund',
          refund: {
            entity: {
              id: 'rfnd_123',
              payment_id: 'pay_123',
              amount: 50000,
            },
          },
        }),
      } as any;

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);

      // Verify refund creation was skipped
      expect(prisma.paymentRefund.create).not.toHaveBeenCalled();
    });
  });

  describe('Method Validation', () => {
    it('should only accept POST requests', async () => {
      const event = {
        httpMethod: 'GET',
        headers: {},
        body: null,
      } as any;

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(405);
      expect(JSON.parse(result.body).error).toContain('Method not allowed');
    });
  });

  describe('Error Handling', () => {
    it('should return 200 even on processing errors (idempotency)', async () => {
      jest.mocked(razorpayService.verifyWebhookSignature).mockReturnValue(true);
      jest.mocked(prisma.paymentTransaction.updateMany).mockRejectedValue(
        new Error('Database error')
      );

      const event = {
        httpMethod: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
        },
        body: JSON.stringify({
          event: 'payment.captured',
          id: 'webhook_error_123',
          payment: {
            entity: {
              id: 'pay_error_123',
              order_id: 'order_error_123',
              amount: 50000,
            },
          },
        }),
      } as any;

      const result = await handler(event, mockContext);

      // Should return 200 to prevent Razorpay from retrying
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).message).toContain('failed, but acknowledged');
    });
  });
});
