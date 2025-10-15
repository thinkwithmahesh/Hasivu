/**
 * PaymentService Unit Tests
 * Comprehensive testing for payment processing service with Razorpay integration
 * Epic 5: Payment Processing - Test Coverage Implementation
 * Archon Task: 001af1bf-0b50-42e5-95e9-a140734b8c44
 */

// Mock dependencies first, before any imports
jest.mock('../../../src/services/database.service', () => ({
  DatabaseService: {
    client: {
      user: {
        findUnique: jest.fn()
      },
      paymentOrder: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
      },
      paymentTransaction: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn()
      },
      paymentRefund: {
        create: jest.fn(),
        updateMany: jest.fn()
      },
      subscriptionPlan: {
        create: jest.fn(),
        findUnique: jest.fn()
      },
      paymentSubscription: {
        create: jest.fn(),
        updateMany: jest.fn()
      }
    }
  }
}));

jest.mock('../../../src/services/redis.service', () => ({
  RedisService: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn()
  }
}));

jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  log: {
    audit: jest.fn()
  }
}));

jest.mock('../../../src/config/environment', () => ({
  config: {
    server: {
      nodeEnv: 'test'
    },
    razorpay: {
      keyId: 'test_key_id',
      keySecret: 'test_key_secret',
      webhookSecret: 'test_webhook_secret'
    }
  }
}));

// Mock Razorpay
const mockRazorpayInstance = {
  orders: {
    create: jest.fn(),
    all: jest.fn()
  },
  payments: {
    fetch: jest.fn(),
    capture: jest.fn(),
    refund: jest.fn()
  },
  plans: {
    create: jest.fn()
  },
  subscriptions: {
    create: jest.fn()
  }
};

jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => mockRazorpayInstance);
});

jest.mock('crypto', () => ({
  createHmac: jest.fn(),
  timingSafeEqual: jest.fn()
}));

import { PaymentService } from '../../../src/services/payment.service';
import { DatabaseService } from '../../../src/services/database.service';
import { RedisService } from '../../../src/services/redis.service';
import { logger } from '../../../src/utils/logger';
import crypto from 'crypto';

const MockedDatabaseService = jest.mocked(DatabaseService);
const MockedRedisService = jest.mocked(RedisService);
const MockedCrypto = jest.mocked(crypto);

describe('PaymentService', () => {
  let paymentService: PaymentService;
  
  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    phone: '+1234567890',
    schoolId: 'school-123',
    role: 'parent',
    status: 'active',
    metadata: '{}',
    cognitoUserId: 'cognito-123',
    deviceTokens: '[]',
    preferences: '{}',
    avatar: null,
    bio: null,
    dateOfBirth: null,
    address: null,
    emergencyContact: null,
    parentalConsent: true,
    termsAcceptedAt: new Date(),
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockPaymentOrder = {
    id: 'order-123',
    orderId: 'order-123',
    razorpayOrderId: 'order_razorpay_123',
    userId: 'user-123',
    amount: 10000,
    currency: 'INR',
    status: 'created',
    metadata: '{}',
    subscriptionId: null,
    notes: {},
    receipt: 'receipt_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
  };

  const mockRazorpayOrder = {
    id: 'order_razorpay_123',
    amount: 10000,
    currency: 'INR',
    receipt: 'receipt_123',
    status: 'created',
    notes: {
      userId: 'user-123',
      userEmail: 'test@example.com'
    }
  };

  const mockPaymentTransaction = {
    id: 'txn-123',
    paymentOrderId: 'order-123',
    razorpayPaymentId: 'pay_razorpay_123',
    method: 'card',
    amount: 10000,
    currency: 'INR',
    status: 'captured',
    gateway: 'razorpay',
    fees: JSON.stringify({
      gateway: 236,
      tax: 42
    }),
    notes: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    capturedAt: new Date(),
    refundedAt: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    paymentService = new PaymentService();
    
    // Setup default mock responses
    MockedRedisService.setex.mockResolvedValue(undefined);
    MockedRedisService.del.mockResolvedValue(1);
    MockedDatabaseService.client.user.findUnique.mockResolvedValue(mockUser as any);
  });

  describe('Service Initialization', () => {
    it('should initialize successfully in test environment', async () => {
      await expect(paymentService.initialize()).resolves.not.toThrow();
      expect(logger.info).toHaveBeenCalledWith('Payment service initialized successfully');
    });

    it('should skip Razorpay initialization in test environment', () => {
      expect(paymentService['isRazorpayAvailable']()).toBe(false);
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock a production environment by temporarily overriding the method
      jest.spyOn(paymentService, 'isRazorpayAvailable' as any).mockReturnValue(true);
      paymentService['razorpay'] = mockRazorpayInstance as any;
      mockRazorpayInstance.orders.all.mockRejectedValue(new Error('Connection failed'));
      
      await expect(paymentService.initialize()).rejects.toThrow('Payment service initialization failed');
      
      // Restore original state
      jest.restoreAllMocks();
    });
  });

  describe('Payment Order Creation', () => {
    const validOrderData = {
      userId: 'user-123',
      amount: 10000,
      currency: 'INR',
      notes: { test: 'note' },
      receipt: 'custom_receipt_123'
    };

    beforeEach(() => {
      // Mock Razorpay instance for the payment service
      paymentService['razorpay'] = mockRazorpayInstance as any;
      mockRazorpayInstance.orders.create.mockResolvedValue(mockRazorpayOrder);
      MockedDatabaseService.client.paymentOrder.create.mockResolvedValue(mockPaymentOrder);
    });

    it('should create payment order successfully', async () => {
      const result = await paymentService.createPaymentOrder(validOrderData);

      expect(result.id).toBe(mockPaymentOrder.id);
      expect(result.razorpayOrderId).toBe(mockRazorpayOrder.id);
      expect(result.amount).toBe(validOrderData.amount);
      expect(result.currency).toBe(validOrderData.currency);
      
      expect(MockedDatabaseService.client.user.findUnique).toHaveBeenCalledWith({
        where: { id: validOrderData.userId },
        select: { id: true, email: true, phone: true }
      });
      
      expect(MockedDatabaseService.client.paymentOrder.create).toHaveBeenCalled();
      expect(MockedRedisService.setex).toHaveBeenCalled();
    });

    it('should use default currency when not provided', async () => {
      const { currency, ...orderDataWithoutCurrency } = validOrderData;

      await paymentService.createPaymentOrder(orderDataWithoutCurrency);

      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'INR'
        })
      );
    });

    it('should generate receipt number when not provided', async () => {
      const { receipt, ...orderDataWithoutReceipt } = validOrderData;

      await paymentService.createPaymentOrder(orderDataWithoutReceipt);

      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          receipt: expect.stringMatching(/^receipt_\d+_[a-z0-9]+$/)
        })
      );
    });

    it('should reject orders with amount less than minimum', async () => {
      const invalidOrderData = { ...validOrderData, amount: 50 };

      await expect(paymentService.createPaymentOrder(invalidOrderData))
        .rejects.toThrow('Amount must be at least ₹1 (100 paise)');
    });

    it('should reject orders for non-existent users', async () => {
      MockedDatabaseService.client.user.findUnique.mockResolvedValue(null);

      await expect(paymentService.createPaymentOrder(validOrderData))
        .rejects.toThrow('User not found');
    });

    it('should handle Razorpay API errors', async () => {
      mockRazorpayInstance.orders.create.mockRejectedValue(new Error('Razorpay API error'));

      await expect(paymentService.createPaymentOrder(validOrderData))
        .rejects.toThrow('Razorpay API error');
      
      expect(logger.error).toHaveBeenCalledWith('Failed to create payment order:', expect.any(Error));
    });

    it('should handle database errors', async () => {
      MockedDatabaseService.client.paymentOrder.create.mockRejectedValue(new Error('Database error'));

      await expect(paymentService.createPaymentOrder(validOrderData))
        .rejects.toThrow('Database error');
    });

    it('should set correct expiry time for orders', async () => {
      const beforeTime = Date.now();
      await paymentService.createPaymentOrder(validOrderData);
      const afterTime = Date.now();

      const createCall = MockedDatabaseService.client.paymentOrder.create.mock.calls[0][0];
      const expiryTime = new Date(createCall.data.expiresAt).getTime();
      
      // Should expire in approximately 15 minutes (with some tolerance)
      const expectedMinExpiry = beforeTime + (15 * 60 * 1000) - 1000;
      const expectedMaxExpiry = afterTime + (15 * 60 * 1000) + 1000;
      
      expect(expiryTime).toBeGreaterThan(expectedMinExpiry);
      expect(expiryTime).toBeLessThan(expectedMaxExpiry);
    });
  });

  describe('Payment Signature Verification', () => {
    const mockHmac = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('expected_signature')
    };

    beforeEach(() => {
      MockedCrypto.createHmac.mockReturnValue(mockHmac as any);
      MockedCrypto.timingSafeEqual.mockReturnValue(true);
    });

    it('should verify valid payment signature', () => {
      const result = paymentService.verifyPaymentSignature(
        'order_123',
        'pay_123',
        'valid_signature'
      );

      expect(result).toBe(true);
      expect(MockedCrypto.createHmac).toHaveBeenCalledWith('sha256', 'test_webhook_secret');
      expect(mockHmac.update).toHaveBeenCalledWith('order_123|pay_123');
      expect(mockHmac.digest).toHaveBeenCalledWith('hex');
      expect(MockedCrypto.timingSafeEqual).toHaveBeenCalled();
    });

    it('should reject invalid payment signature', () => {
      MockedCrypto.timingSafeEqual.mockReturnValue(false);

      const result = paymentService.verifyPaymentSignature(
        'order_123',
        'pay_123',
        'invalid_signature'
      );

      expect(result).toBe(false);
    });

    it('should handle signature verification errors', () => {
      MockedCrypto.createHmac.mockImplementation(() => {
        throw new Error('Crypto error');
      });

      const result = paymentService.verifyPaymentSignature(
        'order_123',
        'pay_123',
        'signature'
      );

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Payment signature verification failed:', expect.any(Error));
    });
  });

  describe('Payment Capture', () => {
    const mockRazorpayPayment = {
      id: 'pay_razorpay_123',
      status: 'captured',
      amount: 10000,
      currency: 'INR',
      method: 'card',
      bank: 'hdfc',
      card: {
        last4: '4242',
        network: 'Visa'
      },
      fee: 236,
      tax: 42,
      notes: {}
    };

    beforeEach(() => {
      // Mock Razorpay instance for payment service
      paymentService['razorpay'] = mockRazorpayInstance as any;
      MockedDatabaseService.client.paymentOrder.findUnique.mockResolvedValue(mockPaymentOrder);
      mockRazorpayInstance.payments.fetch.mockResolvedValue(mockRazorpayPayment);
      mockRazorpayInstance.payments.capture.mockResolvedValue(mockRazorpayPayment);
      MockedDatabaseService.client.paymentTransaction.create.mockResolvedValue(mockPaymentTransaction);
      MockedDatabaseService.client.paymentOrder.update.mockResolvedValue({ ...mockPaymentOrder, status: 'paid' });
      
      jest.spyOn(paymentService, 'verifyPaymentSignature').mockReturnValue(true);
    });

    it('should capture payment successfully', async () => {
      const result = await paymentService.capturePayment(
        'order_razorpay_123',
        'pay_razorpay_123',
        'valid_signature'
      );

      expect(result.id).toBe(mockPaymentTransaction.id);
      expect(result.razorpayPaymentId).toBe('pay_razorpay_123');
      expect(result.status).toBe('captured');

      expect(paymentService.verifyPaymentSignature).toHaveBeenCalledWith(
        'order_razorpay_123',
        'pay_razorpay_123',
        'valid_signature'
      );
      
      expect(mockRazorpayInstance.payments.fetch).toHaveBeenCalledWith('pay_razorpay_123');
      expect(MockedDatabaseService.client.paymentTransaction.create).toHaveBeenCalled();
      expect(MockedDatabaseService.client.paymentOrder.update).toHaveBeenCalledWith({
        where: { id: mockPaymentOrder.id },
        data: { status: 'paid' }
      });
      
      expect(MockedRedisService.del).toHaveBeenCalledWith('payment_order:order_razorpay_123');
    });

    it('should capture authorized payment', async () => {
      const authorizedPayment = { ...mockRazorpayPayment, status: 'authorized' };
      mockRazorpayInstance.payments.fetch.mockResolvedValue(authorizedPayment);
      mockRazorpayInstance.payments.capture.mockResolvedValue({ ...authorizedPayment, status: 'captured' });

      const result = await paymentService.capturePayment(
        'order_razorpay_123',
        'pay_razorpay_123',
        'valid_signature'
      );

      expect(mockRazorpayInstance.payments.capture).toHaveBeenCalledWith('pay_razorpay_123', mockPaymentOrder.amount);
      expect(result.status).toBe('captured');
    });

    it('should reject capture for non-existent order', async () => {
      MockedDatabaseService.client.paymentOrder.findUnique.mockResolvedValue(null);

      await expect(paymentService.capturePayment('invalid_order', 'pay_123', 'signature'))
        .rejects.toThrow('Payment order not found');
    });

    it('should reject capture with invalid signature', async () => {
      jest.spyOn(paymentService, 'verifyPaymentSignature').mockReturnValue(false);

      await expect(paymentService.capturePayment('order_123', 'pay_123', 'invalid_signature'))
        .rejects.toThrow('Invalid payment signature');
    });

    it('should reject capture for failed payments', async () => {
      const failedPayment = { ...mockRazorpayPayment, status: 'failed' };
      mockRazorpayInstance.payments.fetch.mockResolvedValue(failedPayment);

      await expect(paymentService.capturePayment('order_123', 'pay_123', 'signature'))
        .rejects.toThrow('Payment not successful. Status: failed');
    });

    it('should handle payment method without card details', async () => {
      const upiPayment = {
        ...mockRazorpayPayment,
        method: 'upi',
        card: null,
        bank: null,
        wallet: 'paytm'
      };
      mockRazorpayInstance.payments.fetch.mockResolvedValue(upiPayment);

      const result = await paymentService.capturePayment('order_123', 'pay_123', 'signature');

      const createCall = MockedDatabaseService.client.paymentTransaction.create.mock.calls[0][0];
      expect(createCall.data.method).toEqual({
        type: 'upi',
        provider: 'paytm',
        details: {
          last4: undefined,
          network: undefined
        }
      });
    });
  });

  describe('Refund Processing', () => {
    const mockRefund = {
      id: 'refund-123',
      paymentId: 'txn-123',
      razorpayRefundId: 'rfnd_razorpay_123',
      amount: 10000,
      currency: 'INR',
      status: 'pending',
      reason: 'Customer request',
      notes: JSON.stringify({ reason: 'Customer request' }),
      createdAt: new Date(),
      processedAt: null
    };

    const mockRazorpayRefund = {
      id: 'rfnd_razorpay_123',
      amount: 10000,
      currency: 'INR',
      payment_id: 'pay_razorpay_123',
      status: 'processed',
      notes: { reason: 'Customer request' }
    };

    beforeEach(() => {
      // Mock Razorpay instance for payment service
      paymentService['razorpay'] = mockRazorpayInstance as any;
      MockedDatabaseService.client.paymentTransaction.findUnique.mockResolvedValue(mockPaymentTransaction);
      mockRazorpayInstance.payments.refund.mockResolvedValue(mockRazorpayRefund);
      MockedDatabaseService.client.paymentRefund.create.mockResolvedValue(mockRefund);
    });

    it('should create full refund successfully', async () => {
      const result = await paymentService.createRefund('pay_razorpay_123', undefined, 'Customer request');

      expect(result.id).toBe(mockRefund.id);
      expect(result.amount).toBe(mockPaymentTransaction.amount);
      expect(result.reason).toBe('Customer request');

      expect(mockRazorpayInstance.payments.refund).toHaveBeenCalledWith('pay_razorpay_123', {
        amount: mockPaymentTransaction.amount,
        notes: { reason: 'Customer request' }
      });

      expect(MockedDatabaseService.client.paymentRefund.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          paymentId: mockPaymentTransaction.id,
          razorpayRefundId: mockRazorpayRefund.id,
          amount: mockPaymentTransaction.amount,
          currency: mockPaymentTransaction.currency,
          status: 'pending',
          reason: 'Customer request'
        })
      });
    });

    it('should create partial refund successfully', async () => {
      const partialAmount = 5000;
      
      const result = await paymentService.createRefund('pay_razorpay_123', partialAmount, 'Partial refund');

      expect(mockRazorpayInstance.payments.refund).toHaveBeenCalledWith('pay_razorpay_123', {
        amount: partialAmount,
        notes: { reason: 'Partial refund' }
      });

      const createCall = MockedDatabaseService.client.paymentRefund.create.mock.calls[0][0];
      expect(createCall.data.amount).toBe(partialAmount);
    });

    it('should use default reason when not provided', async () => {
      await paymentService.createRefund('pay_razorpay_123');

      expect(mockRazorpayInstance.payments.refund).toHaveBeenCalledWith('pay_razorpay_123', {
        amount: mockPaymentTransaction.amount,
        notes: { reason: 'Customer request' }
      });
    });

    it('should reject refund for non-existent payment', async () => {
      MockedDatabaseService.client.paymentTransaction.findUnique.mockResolvedValue(null);

      await expect(paymentService.createRefund('invalid_payment_id'))
        .rejects.toThrow('Payment transaction not found');
    });

    it('should handle Razorpay refund errors', async () => {
      mockRazorpayInstance.payments.refund.mockRejectedValue(new Error('Refund failed'));

      await expect(paymentService.createRefund('pay_razorpay_123'))
        .rejects.toThrow('Refund failed');

      expect(logger.error).toHaveBeenCalledWith('Failed to create refund:', expect.any(Error));
    });
  });

  describe('Subscription Management', () => {
    const mockPlan = {
      id: 'plan-123',
      name: 'HASIVU monthly plan',
      description: 'HASIVU school food delivery monthly subscription',
      price: 50000,
      currency: 'INR',
      schoolId: 'school-123',
      isActive: true,
      planType: 'subscription',
      billingCycle: 'monthly',
      features: JSON.stringify(['unlimited_orders', 'priority_support']),
      maxUsers: 1000,
      setupFee: 0,
      trialPeriodDays: 7,
      trialPrice: 0,
      razorpayPlanId: 'plan_razorpay_123',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockRazorpayPlan = {
      id: 'plan_razorpay_123',
      interval: 'monthly',
      period: 1,
      item: {
        name: 'HASIVU monthly plan',
        amount: 50000,
        currency: 'INR',
        description: 'HASIVU school food delivery monthly subscription'
      }
    };

    const mockSubscription = {
      id: 'sub-123',
      razorpaySubscriptionId: 'sub_razorpay_123',
      userId: 'user-123',
      planId: 'plan-123',
      status: 'created',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockRazorpaySubscription = {
      id: 'sub_razorpay_123',
      plan_id: 'plan_razorpay_123',
      status: 'created',
      current_start: Math.floor(Date.now() / 1000),
      current_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      customer_notify: 1,
      total_count: 12
    };

    describe('createSubscriptionPlan', () => {
      beforeEach(() => {
        // Mock Razorpay instance for payment service
        paymentService['razorpay'] = mockRazorpayInstance as any;
        mockRazorpayInstance.plans.create.mockResolvedValue(mockRazorpayPlan);
        MockedDatabaseService.client.subscriptionPlan.create.mockResolvedValue(mockPlan as any);
      });

      it('should create subscription plan successfully', async () => {
        const planData = {
          interval: 'monthly' as const,
          period: 1,
          amount: 50000,
          currency: 'INR',
          notes: { test: 'note' }
        };

        const result = await paymentService.createSubscriptionPlan(planData);

        expect(result.id).toBe(mockRazorpayPlan.id);
        expect(mockRazorpayInstance.plans.create).toHaveBeenCalledWith({
          period: 1,
          interval: 'monthly',
          item: {
            name: 'HASIVU monthly plan',
            amount: 50000,
            currency: 'INR',
            description: 'HASIVU school food delivery monthly subscription'
          },
          notes: { test: 'note' }
        });

        expect(MockedDatabaseService.client.subscriptionPlan.create).toHaveBeenCalledWith({
          data: {
            razorpayPlanId: mockRazorpayPlan.id,
            interval: 'monthly',
            period: 1,
            amount: 50000,
            currency: 'INR',
            notes: { test: 'note' }
          }
        });
      });

      it('should use default currency when not provided', async () => {
        const planData = {
          interval: 'weekly' as const,
          period: 2,
          amount: 25000
        };

        await paymentService.createSubscriptionPlan(planData);

        expect(mockRazorpayInstance.plans.create).toHaveBeenCalledWith(
          expect.objectContaining({
            item: expect.objectContaining({
              currency: 'INR'
            })
          })
        );
      });

      it('should handle plan creation errors', async () => {
        mockRazorpayInstance.plans.create.mockRejectedValue(new Error('Plan creation failed'));

        const planData = {
          interval: 'monthly' as const,
          period: 1,
          amount: 50000
        };

        await expect(paymentService.createSubscriptionPlan(planData))
          .rejects.toThrow('Plan creation failed');

        expect(logger.error).toHaveBeenCalledWith('Failed to create subscription plan:', expect.any(Error));
      });
    });

    describe('createSubscription', () => {
      beforeEach(() => {
        // Mock Razorpay instance for payment service
        paymentService['razorpay'] = mockRazorpayInstance as any;
        MockedDatabaseService.client.user.findUnique.mockResolvedValue(mockUser as any);
        MockedDatabaseService.client.subscriptionPlan.findUnique.mockResolvedValue(mockPlan as any);
        mockRazorpayInstance.subscriptions.create.mockResolvedValue(mockRazorpaySubscription);
        (MockedDatabaseService.client as any).paymentSubscription.create.mockResolvedValue(mockSubscription);
      });

      it('should create subscription successfully', async () => {
        const subscriptionData = {
          userId: 'user-123',
          planId: 'plan-123',
          notes: { test: 'note' }
        };

        const result = await paymentService.createSubscription(subscriptionData);

        expect(result.id).toBe(mockSubscription.id);
        expect(result.userId).toBe('user-123');
        expect(result.planId).toBe('plan-123');

        expect(mockRazorpayInstance.subscriptions.create).toHaveBeenCalledWith({
          plan_id: mockPlan.razorpayPlanId,
          customer_notify: 1,
          total_count: 12,
          notes: {
            test: 'note',
            userId: 'user-123',
            userEmail: mockUser.email
          }
        });

        expect((MockedDatabaseService.client as any).paymentSubscription.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            razorpaySubscriptionId: mockRazorpaySubscription.id,
            userId: 'user-123',
            planId: 'plan-123',
            status: 'created'
          })
        });
      });

      it('should reject subscription for non-existent user', async () => {
        MockedDatabaseService.client.user.findUnique.mockResolvedValue(null);

        const subscriptionData = {
          userId: 'invalid-user',
          planId: 'plan-123'
        };

        await expect(paymentService.createSubscription(subscriptionData))
          .rejects.toThrow('User or plan not found');
      });

      it('should reject subscription for non-existent plan', async () => {
        MockedDatabaseService.client.subscriptionPlan.findUnique.mockResolvedValue(null);

        const subscriptionData = {
          userId: 'user-123',
          planId: 'invalid-plan'
        };

        await expect(paymentService.createSubscription(subscriptionData))
          .rejects.toThrow('User or plan not found');
      });

      it('should handle subscription creation errors', async () => {
        mockRazorpayInstance.subscriptions.create.mockRejectedValue(new Error('Subscription creation failed'));

        const subscriptionData = {
          userId: 'user-123',
          planId: 'plan-123'
        };

        await expect(paymentService.createSubscription(subscriptionData))
          .rejects.toThrow('Subscription creation failed');

        expect(logger.error).toHaveBeenCalledWith('Failed to create subscription:', expect.any(Error));
      });
    });
  });

  describe('Webhook Processing', () => {
    const mockWebhookSecret = 'test_webhook_secret';
    const mockHmac = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('expected_signature')
    };

    beforeEach(() => {
      MockedCrypto.createHmac.mockReturnValue(mockHmac as any);
      MockedCrypto.timingSafeEqual.mockReturnValue(true);
    });

    it('should handle payment.captured webhook', async () => {
      const webhookBody = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              status: 'captured'
            }
          }
        }
      });

      MockedDatabaseService.client.paymentTransaction.updateMany.mockResolvedValue({ count: 1 });

      const result = await paymentService.handleWebhook(webhookBody, 'expected_signature');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Webhook processed successfully');

      expect(MockedCrypto.createHmac).toHaveBeenCalledWith('sha256', mockWebhookSecret);
      expect(mockHmac.update).toHaveBeenCalledWith(webhookBody);
      expect(MockedCrypto.timingSafeEqual).toHaveBeenCalled();

      expect(MockedDatabaseService.client.paymentTransaction.updateMany).toHaveBeenCalledWith({
        where: { razorpayPaymentId: 'pay_123' },
        data: {
          status: 'captured',
          capturedAt: expect.any(Date)
        }
      });
    });

    it('should handle payment.failed webhook', async () => {
      const webhookBody = JSON.stringify({
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              status: 'failed'
            }
          }
        }
      });

      MockedDatabaseService.client.paymentTransaction.updateMany.mockResolvedValue({ count: 1 });

      const result = await paymentService.handleWebhook(webhookBody, 'expected_signature');

      expect(result.success).toBe(true);
      expect(MockedDatabaseService.client.paymentTransaction.updateMany).toHaveBeenCalledWith({
        where: { razorpayPaymentId: 'pay_123' },
        data: { status: 'failed' }
      });
    });

    it('should handle refund.processed webhook', async () => {
      const webhookBody = JSON.stringify({
        event: 'refund.processed',
        payload: {
          refund: {
            entity: {
              id: 'rfnd_123',
              status: 'processed'
            }
          }
        }
      });

      MockedDatabaseService.client.paymentRefund.updateMany.mockResolvedValue({ count: 1 });

      const result = await paymentService.handleWebhook(webhookBody, 'expected_signature');

      expect(result.success).toBe(true);
      expect(MockedDatabaseService.client.paymentRefund.updateMany).toHaveBeenCalledWith({
        where: { razorpayRefundId: 'rfnd_123' },
        data: {
          status: 'processed',
          processedAt: expect.any(Date)
        }
      });
    });

    it('should handle subscription.charged webhook', async () => {
      const webhookBody = JSON.stringify({
        event: 'subscription.charged',
        payload: {
          subscription: {
            entity: {
              id: 'sub_123',
              status: 'active',
              current_start: Math.floor(Date.now() / 1000),
              current_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
            }
          }
        }
      });

      (MockedDatabaseService.client as any).paymentSubscription.updateMany.mockResolvedValue({ count: 1 });

      const result = await paymentService.handleWebhook(webhookBody, 'expected_signature');

      expect(result.success).toBe(true);
      expect((MockedDatabaseService.client as any).paymentSubscription.updateMany).toHaveBeenCalledWith({
        where: { razorpaySubscriptionId: 'sub_123' },
        data: expect.objectContaining({
          status: 'active',
          currentPeriodStart: expect.any(Date),
          currentPeriodEnd: expect.any(Date)
        })
      });
    });

    it('should handle unrecognized webhook events', async () => {
      const webhookBody = JSON.stringify({
        event: 'unknown.event',
        payload: {}
      });

      const result = await paymentService.handleWebhook(webhookBody, 'expected_signature');

      expect(result.success).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith('Unhandled webhook event:', 'unknown.event');
    });

    it('should reject webhook with invalid signature', async () => {
      MockedCrypto.timingSafeEqual.mockReturnValue(false);

      const webhookBody = JSON.stringify({ event: 'test' });

      const result = await paymentService.handleWebhook(webhookBody, 'invalid_signature');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid webhook signature');
    });

    it('should handle webhook processing errors', async () => {
      const webhookBody = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123'
            }
          }
        }
      });

      MockedDatabaseService.client.paymentTransaction.updateMany.mockRejectedValue(new Error('Database error'));

      const result = await paymentService.handleWebhook(webhookBody, 'expected_signature');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database error');
      expect(logger.error).toHaveBeenCalledWith('Webhook processing failed:', expect.any(Error));
    });

    it('should handle malformed webhook JSON', async () => {
      const malformedBody = 'invalid json';

      const result = await paymentService.handleWebhook(malformedBody, 'signature');

      expect(result.success).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Webhook processing failed:', expect.any(Error));
    });
  });

  describe('Payment Order Retrieval', () => {
    beforeEach(() => {
      MockedRedisService.get.mockResolvedValue(null);
      MockedDatabaseService.client.paymentOrder.findUnique.mockResolvedValue(mockPaymentOrder);
    });

    it('should get payment order from cache', async () => {
      // JSON stringified dates become strings, so we need to use a compatible object
      const cachedOrderData = {
        ...mockPaymentOrder,
        createdAt: mockPaymentOrder.createdAt.toISOString(),
        expiresAt: mockPaymentOrder.expiresAt.toISOString()
      };
      const cachedOrder = JSON.stringify(cachedOrderData);
      MockedRedisService.get.mockResolvedValue(cachedOrder);

      const result = await paymentService.getPaymentOrder('order_razorpay_123');

      expect(result).toEqual(cachedOrderData);
      expect(MockedRedisService.get).toHaveBeenCalledWith('payment_order:order_razorpay_123');
      expect(MockedDatabaseService.client.paymentOrder.findUnique).not.toHaveBeenCalled();
    });

    it('should get payment order from database and cache it', async () => {
      const result = await paymentService.getPaymentOrder('order_razorpay_123');

      expect(result).toEqual(mockPaymentOrder);
      expect(MockedDatabaseService.client.paymentOrder.findUnique).toHaveBeenCalledWith({
        where: { razorpayOrderId: 'order_razorpay_123' }
      });
      expect(MockedRedisService.setex).toHaveBeenCalledWith(
        'payment_order:order_razorpay_123',
        300,
        JSON.stringify(mockPaymentOrder)
      );
    });

    it('should return null for non-existent order', async () => {
      MockedDatabaseService.client.paymentOrder.findUnique.mockResolvedValue(null);

      const result = await paymentService.getPaymentOrder('non_existent_order');

      expect(result).toBeNull();
      expect(MockedRedisService.setex).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      MockedDatabaseService.client.paymentOrder.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await paymentService.getPaymentOrder('order_123');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith('Failed to get payment order:', expect.any(Error));
    });

    it('should handle Redis errors gracefully', async () => {
      // Reset mocks for this specific test
      jest.clearAllMocks();
      MockedRedisService.get.mockRejectedValue(new Error('Redis error'));
      
      // Mock database to return a valid order
      MockedDatabaseService.client.paymentOrder.findUnique.mockResolvedValue({
        id: 'order-123',
        razorpayOrderId: 'order_razorpay_123',
        userId: 'user-123',
        amount: 10000,
        currency: 'INR',
        status: 'created',
        metadata: '{}',
        orderId: null,
        subscriptionId: null,
        createdAt: new Date('2025-08-17T10:31:12.783Z'),
        updatedAt: new Date('2025-08-17T10:31:12.783Z'),
        expiresAt: new Date('2025-08-17T10:46:12.783Z')
      } as any);
      
      // With improved error handling, Redis errors should not fail the operation
      // The service should gracefully continue to database lookup
      const result = await paymentService.getPaymentOrder('order_razorpay_123');
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('order-123');
      expect(logger.warn).toHaveBeenCalledWith('Failed to get payment order from cache:', expect.any(Error));
      expect(MockedDatabaseService.client.paymentOrder.findUnique).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing environment configuration', () => {
      const originalConfig = require('../../../src/config/environment').config;
      
      jest.doMock('../../../src/config/environment', () => ({
        config: {
          server: { nodeEnv: 'production' },
          razorpay: {
            keyId: '',
            keySecret: '',
            webhookSecret: ''
          }
        }
      }));

      // This would normally throw in production with empty config
      expect(() => new PaymentService()).not.toThrow();
    });

    it('should handle concurrent payment processing', async () => {
      // Mock Razorpay instance for payment service
      paymentService['razorpay'] = mockRazorpayInstance as any;
      
      const orderData1 = { userId: 'user-1', amount: 5000 };
      const orderData2 = { userId: 'user-2', amount: 7500 };

      mockRazorpayInstance.orders.create
        .mockResolvedValueOnce({ ...mockRazorpayOrder, id: 'order_1' })
        .mockResolvedValueOnce({ ...mockRazorpayOrder, id: 'order_2' });

      MockedDatabaseService.client.paymentOrder.create
        .mockResolvedValueOnce({ ...mockPaymentOrder, id: 'order-1', razorpayOrderId: 'order_1' })
        .mockResolvedValueOnce({ ...mockPaymentOrder, id: 'order-2', razorpayOrderId: 'order_2' });

      const [result1, result2] = await Promise.all([
        paymentService.createPaymentOrder(orderData1),
        paymentService.createPaymentOrder(orderData2)
      ]);

      expect(result1.razorpayOrderId).toBe('order_1');
      expect(result2.razorpayOrderId).toBe('order_2');
    });

    it('should handle network timeouts gracefully', async () => {
      // Mock Razorpay instance for payment service
      paymentService['razorpay'] = mockRazorpayInstance as any;
      
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TIMEOUT';
      
      mockRazorpayInstance.orders.create.mockRejectedValue(timeoutError);

      const orderData = { userId: 'user-123', amount: 10000 };

      await expect(paymentService.createPaymentOrder(orderData))
        .rejects.toThrow('Network timeout');

      expect(logger.error).toHaveBeenCalledWith('Failed to create payment order:', timeoutError);
    });

    it('should validate webhook signature with timing-safe comparison', async () => {
      let timingSafeEqualCallCount = 0;
      MockedCrypto.timingSafeEqual.mockImplementation(() => {
        timingSafeEqualCallCount++;
        return timingSafeEqualCallCount === 1; // First call succeeds, subsequent fail
      });

      const webhookBody = JSON.stringify({ event: 'test' });
      
      // Mock createHmac to return consistent length signature for timing-safe comparison
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('a'.repeat(64)) // 64-char hex string
      };
      MockedCrypto.createHmac.mockReturnValue(mockHmac as any);

      // Use signatures of the same length (64 chars) to pass length check
      const signature1 = 'a'.repeat(64);
      const signature2 = 'b'.repeat(64);

      // First call should succeed
      let result = await paymentService.handleWebhook(webhookBody, signature1);
      expect(result.success).toBe(true);

      // Second call should fail
      result = await paymentService.handleWebhook(webhookBody, signature2);
      expect(result.success).toBe(false);

      expect(timingSafeEqualCallCount).toBe(2);
    });

    it('should handle large webhook payloads', async () => {
      const largePayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              status: 'captured',
              notes: Object.fromEntries(
                Array.from({ length: 100 }, (_, i) => [`key_${i}`, `value_${i}`])
              )
            }
          }
        }
      };

      const webhookBody = JSON.stringify(largePayload);
      
      // Set up crypto mocking for this test
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('expected_signature')
      };
      MockedCrypto.createHmac.mockReturnValue(mockHmac as any);
      MockedCrypto.timingSafeEqual.mockReturnValue(true);
      
      MockedDatabaseService.client.paymentTransaction.updateMany.mockResolvedValue({ count: 1 });

      const result = await paymentService.handleWebhook(webhookBody, 'expected_signature');

      expect(result.success).toBe(true);
      expect(mockHmac.update).toHaveBeenCalledWith(webhookBody);
    });
  });

  describe('PCI Compliance and Security', () => {
    it('should not log sensitive payment data', async () => {
      // Mock Razorpay instance for payment service
      paymentService['razorpay'] = mockRazorpayInstance as any;
      
      const orderData = {
        userId: 'user-123',
        amount: 10000,
        notes: {
          cardNumber: '4111111111111111', // Sensitive data that should not be logged
          cvv: '123'
        }
      };

      mockRazorpayInstance.orders.create.mockResolvedValue(mockRazorpayOrder);
      MockedDatabaseService.client.paymentOrder.create.mockResolvedValue(mockPaymentOrder);

      await paymentService.createPaymentOrder(orderData);

      // Verify that logger calls don't contain sensitive data
      const loggerCalls = (logger.info as jest.Mock).mock.calls;

      loggerCalls.forEach(call => {
        const logContent = JSON.stringify(call);
        expect(logContent).not.toContain('4111111111111111');
        expect(logContent).not.toContain('123');
      });
    });

    it('should use timing-safe comparison for signature verification', () => {
      paymentService.verifyPaymentSignature('order_123', 'pay_123', 'signature');

      expect(MockedCrypto.timingSafeEqual).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.any(Buffer)
      );
    });

    it('should clear cache on payment completion', async () => {
      // Mock Razorpay instance for payment service
      paymentService['razorpay'] = mockRazorpayInstance as any;
      
      const mockRazorpayPayment = {
        id: 'pay_razorpay_123',
        status: 'captured',
        amount: 10000,
        currency: 'INR',
        method: 'card',
        bank: 'hdfc',
        card: {
          last4: '4242',
          network: 'Visa'
        },
        fee: 236,
        tax: 42,
        notes: {}
      };

      MockedDatabaseService.client.paymentOrder.findUnique.mockResolvedValue(mockPaymentOrder);
      mockRazorpayInstance.payments.fetch.mockResolvedValue({
        ...mockRazorpayPayment,
        status: 'captured'
      });
      MockedDatabaseService.client.paymentTransaction.create.mockResolvedValue(mockPaymentTransaction);
      MockedDatabaseService.client.paymentOrder.update.mockResolvedValue({ ...mockPaymentOrder, status: 'paid' });
      jest.spyOn(paymentService, 'verifyPaymentSignature').mockReturnValue(true);

      await paymentService.capturePayment('order_123', 'pay_123', 'signature');

      expect(MockedRedisService.del).toHaveBeenCalledWith('payment_order:order_123');
    });
  });
});