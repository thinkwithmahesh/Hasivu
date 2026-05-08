/**
 * PaymentService unit tests aligned with Prisma + Razorpay implementation.
 */

jest.mock('@prisma/client', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
    },
    paymentTransaction: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };
  (globalThis as { __paymentPrismaMock?: typeof prisma }).__paymentPrismaMock = prisma;
  return {
    PrismaClient: jest.fn().mockImplementation(() => prisma),
  };
});

jest.mock('razorpay', () => {
  const instance = {
    orders: { create: jest.fn(), all: jest.fn() },
    payments: { fetch: jest.fn(), capture: jest.fn(), refund: jest.fn() },
    plans: { create: jest.fn() },
    subscriptions: { create: jest.fn() },
  };
  return jest.fn().mockImplementation(() => instance);
});

jest.mock('crypto', () => ({
  createHmac: jest.fn(),
  timingSafeEqual: jest.fn(),
}));

import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PaymentService } from '../../../src/services/payment.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPrismaMock(): any {
  return (globalThis as { __paymentPrismaMock?: unknown }).__paymentPrismaMock;
}

function stubPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pay-row-1',
    userId: 'user-123',
    orderId: 'order_razorpay_123',
    amount: 10000,
    currency: 'INR',
    status: 'pending',
    method: 'razorpay',
    transactionId: 'order_razorpay_123',
    ...overrides,
  };
}

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockRazorpay: ReturnType<typeof Razorpay> & {
    orders: { create: jest.Mock; all: jest.Mock };
  };

  const mockHmac = {
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('expected_hex_sig'),
  };

  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = 'test_key_id';
    process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';

    PaymentService.resetInstanceForTests();
    jest.clearAllMocks();

    paymentService = new PaymentService();
    mockRazorpay = new (Razorpay as unknown as jest.Mock)() as typeof mockRazorpay;
    paymentService['razorpay'] = mockRazorpay as never;

    const p = getPrismaMock();
    if (p) {
      p.user.findUnique.mockResolvedValue({ id: 'user-123', email: 'a@b.com', phone: '+1' });
      p.payment.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      p.paymentTransaction.updateMany.mockResolvedValue({ count: 1 });
    }

    (crypto.createHmac as jest.Mock).mockReturnValue(mockHmac);
    (crypto.timingSafeEqual as jest.Mock).mockReturnValue(true);
    mockHmac.digest.mockReturnValue('expected_hex_sig');
  });

  afterEach(() => {
    PaymentService.resetInstanceForTests();
  });

  describe('initialize', () => {
    it('resolves when Razorpay orders.all succeeds', async () => {
      mockRazorpay.orders.all.mockResolvedValue([]);
      await expect(paymentService.initialize()).resolves.toBeUndefined();
    });

    it('rejects when Razorpay orders.all fails', async () => {
      mockRazorpay.orders.all.mockRejectedValue(new Error('down'));
      await expect(paymentService.initialize()).rejects.toThrow('Payment service initialization failed');
    });
  });

  describe('isRazorpayAvailable', () => {
    it('returns true (gateway client is always constructed)', () => {
      expect(paymentService.isRazorpayAvailable()).toBe(true);
    });
  });

  describe('createPaymentOrder', () => {
    const valid = {
      userId: 'user-123',
      amount: 10000,
      currency: 'INR' as const,
      notes: { k: 'v' },
      receipt: 'rcpt_1',
    };

    beforeEach(() => {
      mockRazorpay.orders.create.mockResolvedValue({
        id: 'order_razorpay_123',
        amount: 10000,
        currency: 'INR',
        receipt: 'rcpt_1',
        notes: {},
      });
      const p = getPrismaMock();
      p.payment.create.mockResolvedValue(stubPayment({ id: 'db-pay-1' }));
    });

    it('creates Razorpay order and payment row', async () => {
      const result = await paymentService.createPaymentOrder(valid);
      expect(result.razorpayOrderId).toBe('order_razorpay_123');
      expect(result.userId).toBe('user-123');
      expect(getPrismaMock().payment.create).toHaveBeenCalled();
    });

    it('rejects amount below minimum', async () => {
      await expect(paymentService.createPaymentOrder({ ...valid, amount: 50 })).rejects.toThrow(
        'Amount must be at least ₹1 (100 paise)'
      );
    });

    it('rejects when user is missing', async () => {
      getPrismaMock().user.findUnique.mockResolvedValue(null);
      await expect(paymentService.createPaymentOrder(valid)).rejects.toThrow('User not found');
    });

    it('wraps Razorpay errors', async () => {
      mockRazorpay.orders.create.mockRejectedValue(new Error('Razorpay API error'));
      await expect(paymentService.createPaymentOrder(valid)).rejects.toThrow('Razorpay API error');
    });
  });

  describe('verifyPaymentSignature', () => {
    it('returns true when HMAC matches', () => {
      (crypto.timingSafeEqual as jest.Mock).mockReturnValue(true);
      expect(paymentService.verifyPaymentSignature('o1', 'p1', 'sig')).toBe(true);
      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', 'test_webhook_secret');
    });

    it('returns false when timingSafeEqual is false', () => {
      (crypto.timingSafeEqual as jest.Mock).mockReturnValue(false);
      expect(paymentService.verifyPaymentSignature('o1', 'p1', 'sig')).toBe(false);
    });

    it('returns false when crypto throws', () => {
      (crypto.createHmac as jest.Mock).mockImplementationOnce(() => {
        throw new Error('bad');
      });
      expect(paymentService.verifyPaymentSignature('o1', 'p1', 'sig')).toBe(false);
    });
  });

  describe('capturePayment', () => {
    it('rejects invalid signature', async () => {
      jest.spyOn(paymentService, 'verifyPaymentSignature').mockReturnValue(false);
      await expect(paymentService.capturePayment('ord', 'pay', 'sig')).rejects.toThrow(
        'Invalid payment signature'
      );
    });

    it('rejects when no payment exists for order', async () => {
      jest.spyOn(paymentService, 'verifyPaymentSignature').mockReturnValue(true);
      getPrismaMock().payment.findMany.mockResolvedValue([]);
      await expect(paymentService.capturePayment('ord', 'pay', 'sig')).rejects.toThrow(
        'Payment order not found'
      );
    });

    it('updates status to completed on success', async () => {
      jest.spyOn(paymentService, 'verifyPaymentSignature').mockReturnValue(true);
      const existing = stubPayment({ id: 'pay-row-1', status: 'pending' });
      getPrismaMock().payment.findMany.mockResolvedValue([existing]);
      getPrismaMock().payment.update.mockResolvedValue({ ...existing, status: 'completed' });

      const result = await paymentService.capturePayment('order_razorpay_123', 'pay_1', 'sig');
      expect(result.status).toBe('captured');
      expect(getPrismaMock().payment.update).toHaveBeenCalled();
    });
  });

  describe('createRefund', () => {
    it('refunds a completed payment', async () => {
      getPrismaMock().payment.findUnique.mockResolvedValue(
        stubPayment({ id: 'p1', status: 'completed', amount: 500 })
      );
      getPrismaMock().payment.update.mockResolvedValue(stubPayment({ status: 'refunded' }));

      const result = await paymentService.createRefund('p1', 100, 'reason');
      expect(result.status).toBe('pending');
      expect(getPrismaMock().payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: expect.objectContaining({ status: 'refunded' }),
        })
      );
    });

    it('throws when payment missing', async () => {
      getPrismaMock().payment.findUnique.mockResolvedValue(null);
      await expect(paymentService.createRefund('missing')).rejects.toThrow('Payment transaction not found');
    });
  });

  describe('handleWebhook', () => {
    it('rejects invalid signature', async () => {
      (crypto.timingSafeEqual as jest.Mock).mockReturnValue(false);
      const result = await paymentService.handleWebhook('{}', 'bad');
      expect(result.success).toBe(false);
    });

    it('accepts payment.captured and updates transactions', async () => {
      (crypto.timingSafeEqual as jest.Mock).mockReturnValue(true);
      const body = JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_xyz' } } },
      });
      const result = await paymentService.handleWebhook(body, 'expected_hex_sig');
      expect(result.success).toBe(true);
      expect(getPrismaMock().paymentTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { razorpayPaymentId: 'pay_xyz' },
          data: expect.objectContaining({ status: 'captured' }),
        })
      );
    });
  });

  describe('getPaymentOrder', () => {
    it('returns first payment or null', async () => {
      getPrismaMock().payment.findMany.mockResolvedValueOnce([]);
      expect(await paymentService.getPaymentOrder('ord')).toBeNull();

      getPrismaMock().payment.findMany.mockResolvedValueOnce([stubPayment()]);
      expect(await paymentService.getPaymentOrder('ord')).toMatchObject({ id: 'pay-row-1' });
    });
  });

  describe('createSubscriptionPlan / createSubscription', () => {
    it('returns a plan-shaped object', async () => {
      const plan = await paymentService.createSubscriptionPlan({
        interval: 'monthly',
        period: 1,
        amount: 999,
      });
      expect(plan.item.currency).toBe('INR');
      expect(plan.id).toMatch(/^plan_/);
    });

    it('returns a subscription-shaped object', async () => {
      const sub = await paymentService.createSubscription({ userId: 'u1', planId: 'p1' });
      expect(sub.userId).toBe('u1');
      expect(sub.status).toBe('created');
    });
  });

  describe('static processPayment', () => {
    it('creates and completes a payment via getInstance', async () => {
      PaymentService.resetInstanceForTests();
      const p = getPrismaMock();
      p.payment.create.mockResolvedValueOnce(stubPayment({ id: 'new1', status: 'pending' }));
      p.payment.findUnique.mockResolvedValueOnce(stubPayment({ id: 'new1', status: 'pending' }));
      p.payment.update.mockResolvedValueOnce(stubPayment({ id: 'new1', status: 'completed' }));

      const out = await PaymentService.processPayment({
        orderId: 'ord-1',
        amount: 100,
        currency: 'INR',
        paymentMethod: 'card',
      });
      expect(out.success).toBe(true);
      expect(out.data?.status).toBe('captured');
    });
  });
});
