/**
 * Payment Service - Unit Tests
 * Tests for PaymentService singleton functionality
 * Epic 5: Payment Processing & Billing System
 */

import { jest } from '@jest/globals';
import { PaymentService } from '../../src/services/payment.service';

// Mock fetch globally
const mockFetch = jest.fn() as any;
global.fetch = mockFetch;

describe('PaymentService', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset singleton instance
    (PaymentService as any)._instance = null;

    // Get fresh instance
    paymentService = PaymentService.getInstance();
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = PaymentService.getInstance();
      const instance2 = PaymentService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(PaymentService);
    });
  });

  describe('processPayment', () => {
    const mockPaymentRequest = {
      amount: 1000,
      currency: 'INR',
      orderId: 'ORD-123',
      schoolId: 'SCH-001',
      parentId: 'PAR-001',
      paymentMethod: 'card'
    };

    test('should process payment successfully', async () => {
      const mockResponse = {
        success: true,
        data: { transactionId: 'TXN-123', status: 'completed' },
        transactionId: 'TXN-123'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await paymentService.processPayment(mockPaymentRequest);

      expect(mockFetch).toHaveBeenCalledWith('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockPaymentRequest),
      });

      expect(result).toEqual(mockResponse);
    });

    test('should handle payment processing failure', async () => {
      const errorResponse = {
        error: 'Payment gateway unavailable'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue(errorResponse)
      } as any);

      const result = await paymentService.processPayment(mockPaymentRequest);

      expect(result).toEqual({
        success: false,
        error: 'Payment gateway unavailable'
      });
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      mockFetch.mockRejectedValueOnce(networkError);

      const result = await paymentService.processPayment(mockPaymentRequest);

      expect(result).toEqual({
        success: false,
        error: 'Network connection failed'
      });
    });

    test('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as any);

      const result = await paymentService.processPayment(mockPaymentRequest);

      expect(result).toEqual({
        success: false,
        error: 'Unknown error'
      });
    });

    test('should handle missing error field in failed response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({})
      } as any);

      const result = await paymentService.processPayment(mockPaymentRequest);

      expect(result).toEqual({
        success: false,
        error: 'Unknown error'
      });
    });
  });

  describe('createPaymentIntent', () => {
    const mockIntentRequest = {
      amount: 5000,
      currency: 'INR',
      orderId: 'ORD-456',
      schoolId: 'SCH-001',
      parentId: 'PAR-001'
    };

    test('should create payment intent successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          paymentIntentId: 'pi_123',
          clientSecret: 'pi_secret_123',
          amount: 5000
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await paymentService.createPaymentIntent(mockIntentRequest);

      expect(mockFetch).toHaveBeenCalledWith('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockIntentRequest),
      });

      expect(result).toEqual(mockResponse);
    });

    test('should handle payment intent creation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Invalid amount' })
      } as any);

      const result = await paymentService.createPaymentIntent(mockIntentRequest);

      expect(result).toEqual({
        success: false,
        error: 'Invalid amount'
      });
    });
  });

  describe('createSubscription', () => {
    const mockSubscriptionRequest = {
      schoolId: 'SCH-001',
      parentId: 'PAR-001',
      planId: 'PLAN-PREMIUM',
      billingCycle: 'monthly' as const,
      autoRenew: true
    };

    test('should create subscription successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          subscriptionId: 'sub_123',
          status: 'active',
          currentPeriodEnd: '2024-02-01'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await paymentService.createSubscription(mockSubscriptionRequest);

      expect(mockFetch).toHaveBeenCalledWith('/api/payments/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockSubscriptionRequest),
      });

      expect(result).toEqual(mockResponse);
    });

    test('should handle subscription creation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Plan not found' })
      } as any);

      const result = await paymentService.createSubscription(mockSubscriptionRequest);

      expect(result).toEqual({
        success: false,
        error: 'Plan not found'
      });
    });
  });

  describe('getPaymentAnalytics', () => {
    test('should fetch payment analytics successfully', async () => {
      const mockRequest = {
        schoolId: 'SCH-001',
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        metrics: ['revenue', 'transactions']
      };

      const mockResponse = {
        success: true,
        data: {
          totalRevenue: 150000,
          totalTransactions: 1500,
          averageTransactionValue: 100
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await paymentService.getPaymentAnalytics(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith('/api/payments/analytics?schoolId=SCH-001&startDate=2024-01-01&endDate=2024-01-31&metrics=revenue,transactions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    test('should handle analytics fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Analytics service unavailable' })
      } as any);

      const result = await paymentService.getPaymentAnalytics();

      expect(result).toEqual({
        success: false,
        error: 'Analytics service unavailable'
      });
    });

    test('should call analytics endpoint with empty query params when no request provided', async () => {
      const mockResponse = {
        success: true,
        data: {}
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as any);

      await paymentService.getPaymentAnalytics();

      expect(mockFetch).toHaveBeenCalledWith('/api/payments/analytics?', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('getBillingHistory', () => {
    test('should fetch billing history successfully', async () => {
      const parentId = 'PAR-001';
      const page = 1;
      const limit = 10;

      const mockResponse = {
        success: true,
        data: {
          bills: [
            { id: 'BILL-001', amount: 1000, status: 'paid', date: '2024-01-15' }
          ],
          total: 1,
          page: 1,
          limit: 10
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await paymentService.getBillingHistory(parentId, page, limit);

      expect(mockFetch).toHaveBeenCalledWith(`/api/payments/billing/${parentId}?page=1&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    test('should use default pagination values', async () => {
      const parentId = 'PAR-001';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      } as any);

      await paymentService.getBillingHistory(parentId);

      expect(mockFetch).toHaveBeenCalledWith(`/api/payments/billing/${parentId}?page=1&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('processRefund', () => {
    test('should process refund successfully', async () => {
      const transactionId = 'TXN-123';
      const amount = 500;
      const reason = 'Customer request';

      const mockResponse = {
        success: true,
        data: {
          refundId: 'REF-123',
          status: 'processed',
          amount: 500
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await paymentService.processRefund(transactionId, amount, reason);

      expect(mockFetch).toHaveBeenCalledWith('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          amount,
          reason,
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    test('should handle partial refund (no amount specified)', async () => {
      const transactionId = 'TXN-123';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      } as any);

      await paymentService.processRefund(transactionId);

      expect(mockFetch).toHaveBeenCalledWith('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          amount: undefined,
          reason: undefined,
        }),
      });
    });
  });

  describe('getPaymentMethods', () => {
    test('should fetch payment methods successfully', async () => {
      const parentId = 'PAR-001';

      const mockResponse = {
        success: true,
        data: {
          paymentMethods: [
            { id: 'PM-001', type: 'card', last4: '4242', brand: 'visa' }
          ]
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await paymentService.getPaymentMethods(parentId);

      expect(mockFetch).toHaveBeenCalledWith(`/api/payments/methods/${parentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('validatePaymentSecurity', () => {
    test('should validate payment security successfully', async () => {
      const securityData = {
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123'
      };

      const mockResponse = {
        success: true,
        data: {
          isValid: true,
          riskScore: 0.1,
          recommendations: []
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await paymentService.validatePaymentSecurity(securityData);

      expect(mockFetch).toHaveBeenCalledWith('/api/payments/validate-security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(securityData),
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling Edge Cases', () => {
    test('should handle fetch throwing non-Error object', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const result = await paymentService.processPayment({
        amount: 1000,
        currency: 'INR',
        orderId: 'ORD-123',
        schoolId: 'SCH-001',
        parentId: 'PAR-001'
      });

      expect(result).toEqual({
        success: false,
        error: 'Unknown error'
      });
    });

    test('should handle null error message', async () => {
      mockFetch.mockRejectedValueOnce(null);

      const result = await paymentService.processPayment({
        amount: 1000,
        currency: 'INR',
        orderId: 'ORD-123',
        schoolId: 'SCH-001',
        parentId: 'PAR-001'
      });

      expect(result).toEqual({
        success: false,
        error: 'Unknown error'
      });
    });
  });
});