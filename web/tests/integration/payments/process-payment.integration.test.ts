/**
 * Payment Process API - Integration Tests
 * Tests for /api/payments/process endpoint
 * Epic 5: Payment Processing & Billing System
 */

import { test, expect } from '@playwright/test';

// Test data interfaces
interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  schoolId: string;
  parentId: string;
  paymentMethod: string;
  description?: string;
  saveCard?: boolean;
  cardData?: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
    email: string;
    phone: string;
  };
  upiId?: string;
  bankCode?: string;
}

interface PaymentResponse {
  success: boolean;
  data?: any;
  error?: string;
  transactionId?: string;
}

// Test data factory
class PaymentTestDataFactory {
  private _counter =  0;

  createPaymentRequest(overrides: Partial<PaymentRequest> = {}): PaymentRequest {
    this.counter++;
    return {
      amount: 1000 + this.counter * 100,
      currency: 'INR',
      orderId: `ORD-${this.counter.toString().padStart(3, '0')}`,
      schoolId: 'SCH-001',
      parentId: `PAR-${this.counter.toString().padStart(3, '0')}`,
      paymentMethod: 'card',
      description: `Test payment ${this.counter}`,
      cardData: {
        number: '4111111111111111',
        expiry: '12/25',
        cvv: '123',
        name: 'Test User',
        email: `test${this.counter}@example.com`,
        phone: '9876543210'
      },
      ...overrides
    };
  }

  createUPIPaymentRequest(): PaymentRequest {
    return this.createPaymentRequest({
      paymentMethod: 'upi',
      upiId: 'test@upi'
    });
  }

  createNetBankingPaymentRequest(): PaymentRequest {
    return this.createPaymentRequest({
      paymentMethod: 'netbanking',
      bankCode: 'HDFC'
    });
  }
}

test.describe(_'Payment Process API Integration', _() => {
  let testData: PaymentTestDataFactory;

  test.beforeEach(_() => {
    _testData =  new PaymentTestDataFactory();
  });

  test.describe(_'Card Payment Processing', _() => {
    test(_'should process valid card payment successfully @p0 @smoke', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest();

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.transactionId).toBeDefined();
      expect(responseData.transactionId).toMatch(/^TXN-/);
      expect(responseData.data).toBeDefined();
      expect(responseData.data.status).toBe('completed');
      expect(responseData.data.amount).toBe(paymentRequest.amount);
      expect(responseData.data.currency).toBe(paymentRequest.currency);
    });

    test(_'should handle card payment with save card option', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest();
      paymentRequest._saveCard =  true;

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.cardSaved).toBe(true);
    });

    test(_'should reject invalid card number', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest({
        cardData: {
          ...testData.createPaymentRequest().cardData!,
          number: '1234567890123456' // Invalid card number
        }
      });

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('card');
    });

    test(_'should reject expired card', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest({
        cardData: {
          ...testData.createPaymentRequest().cardData!,
          expiry: '01/20' // Expired date
        }
      });

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('expir');
    });

    test(_'should reject invalid CVV', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest({
        cardData: {
          ...testData.createPaymentRequest().cardData!,
          cvv: '12' // Invalid CVV
        }
      });

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('cvv');
    });
  });

  test.describe(_'UPI Payment Processing', _() => {
    test(_'should process valid UPI payment successfully', _async ({ request }) => {
      const _paymentRequest =  testData.createUPIPaymentRequest();

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.transactionId).toBeDefined();
      expect(responseData.data.upiId).toBe(paymentRequest.upiId);
      expect(responseData.data.paymentMethod).toBe('upi');
    });

    test(_'should reject invalid UPI ID format', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest({
        paymentMethod: 'upi',
        upiId: 'invalid-upi-id'
      });

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('upi');
    });
  });

  test.describe(_'Net Banking Payment Processing', _() => {
    test(_'should process valid net banking payment successfully', _async ({ request }) => {
      const _paymentRequest =  testData.createNetBankingPaymentRequest();

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.transactionId).toBeDefined();
      expect(responseData.data.bankCode).toBe(paymentRequest.bankCode);
      expect(responseData.data.paymentMethod).toBe('netbanking');
    });

    test(_'should reject unsupported bank code', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest({
        paymentMethod: 'netbanking',
        bankCode: 'UNSUPPORTED_BANK'
      });

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('bank');
    });
  });

  test.describe(_'Payment Validation', _() => {
    test(_'should reject payment with invalid amount', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest({
        amount: -100 // Invalid negative amount
      });

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('amount');
    });

    test(_'should reject payment with zero amount', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest({
        amount: 0
      });

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('amount');
    });

    test(_'should reject payment with invalid currency', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest({
        currency: 'INVALID'
      });

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('currency');
    });

    test(_'should reject payment with missing order ID', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest();
      delete (paymentRequest as any).orderId;

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('order');
    });

    test(_'should reject payment with invalid payment method', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest({
        paymentMethod: 'invalid_method'
      });

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('method');
    });
  });

  test.describe(_'Payment Security', _() => {
    test(_'should validate PCI compliance for card data', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest();

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(200);

      // Check that sensitive data is not logged or returned
      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.data.cardData).toBeUndefined();
      expect(responseData.data.cardNumber).toBeUndefined();
      expect(responseData.data.cvv).toBeUndefined();
    });

    test(_'should handle payment gateway timeout', _async ({ request }) => {
      // Mock a payment that takes too long (simulate timeout)
      const _paymentRequest =  testData.createPaymentRequest({
        amount: 999999 // Special amount to trigger timeout simulation
      });

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest,
        timeout: 1000 // Short timeout to test timeout handling
      });

      // Should either succeed or fail gracefully with timeout error
      const responseData: _PaymentResponse =  await response.json();

      if (response.status() === 408) {
        expect(responseData.success).toBe(false);
        expect(responseData.error).toContain('timeout');
      } else {
        expect(response.status()).toBe(200);
        expect(responseData.success).toBe(true);
      }
    });
  });

  test.describe(_'Payment Reconciliation', _() => {
    test(_'should record payment for reconciliation', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest();

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(true);

      // Verify payment is recorded in reconciliation system
      const _reconciliationResponse =  await request.get(`/api/payments/reconciliation?transactionId
      expect(reconciliationResponse.status()).toBe(200);

      const _reconciliationData =  await reconciliationResponse.json();
      expect(reconciliationData.success).toBe(true);
      expect(reconciliationData.data.transactionId).toBe(responseData.transactionId);
      expect(reconciliationData.data.amount).toBe(paymentRequest.amount);
      expect(reconciliationData.data.status).toBe('reconciled');
    });
  });

  test.describe(_'Error Handling', _() => {
    test(_'should handle malformed JSON request', _async ({ request }) => {
      const _response =  await request.post('/api/payments/process', {
        data: '{ invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.status()).toBe(400);

      const _responseData =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeDefined();
    });

    test(_'should handle missing request body', _async ({ request }) => {
      const _response =  await request.post('/api/payments/process', {
        data: {}
      });

      expect(response.status()).toBe(400);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('required');
    });

    test(_'should handle duplicate payment attempts', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest();

      // First payment
      const _firstResponse =  await request.post('/api/payments/process', {
        data: paymentRequest
      });
      expect(firstResponse.status()).toBe(200);

      // Attempt duplicate payment with same order ID
      const _secondResponse =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      // Should either succeed (idempotent) or fail with duplicate error
      const secondResponseData: _PaymentResponse =  await secondResponse.json();

      if (secondResponse.status() === 409) {
        expect(secondResponseData.success).toBe(false);
        expect(secondResponseData.error).toContain('duplicate');
      } else {
        expect(secondResponse.status()).toBe(200);
        expect(secondResponseData.success).toBe(true);
      }
    });
  });

  test.describe(_'Rate Limiting', _() => {
    test(_'should handle rate limiting for payment attempts', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest();

      // Make multiple rapid payment attempts
      const _promises =  Array(10).fill(null).map(() 
      const _responses =  await Promise.all(promises);

      // At least some should succeed, and some may be rate limited
      const _successCount =  responses.filter(r 
      const _rateLimitedCount =  responses.filter(r 
      expect(successCount + rateLimitedCount).toBe(10);
      expect(successCount).toBeGreaterThan(0); // At least one should succeed
    });
  });

  test.describe(_'Multi-Currency Support', _() => {
    test(_'should process USD payments', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest({
        currency: 'USD',
        amount: 100 // $100
      });

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.currency).toBe('USD');
      expect(responseData.data.amount).toBe(100);
    });

    test(_'should convert currency amounts correctly', _async ({ request }) => {
      const _paymentRequest =  testData.createPaymentRequest({
        currency: 'USD',
        amount: 50
      });

      const _response =  await request.post('/api/payments/process', {
        data: paymentRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _PaymentResponse =  await response.json();
      expect(responseData.success).toBe(true);

      // Verify amount is in correct currency units (cents for USD)
      expect(responseData.data.amountInCents).toBe(5000); // $_50 =  5000 cents
    });
  });
});