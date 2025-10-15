/**
 * HASIVU Platform - Payment Flow Smoke Tests
 *
 * Tests complete payment processing flow including order creation,
 * payment verification, status checking, and error handling
 */

import { SMOKE_TEST_CONFIG } from '../config/smoke-test.config.test';
import { SmokeTestUtils } from '../utils/test-utils.test';

describe('Payment Flow Smoke Tests', () => {
  const TEST_TIMEOUT = SMOKE_TEST_CONFIG.timeouts.test;
  let authToken: string | null = null;
  let testOrderId: string | null = null;
  let testPaymentId: string | null = null;

  beforeAll(async () => {
    SmokeTestUtils.initializeSuite();

    // Authenticate for payment tests
    const authenticated = await SmokeTestUtils.authenticate();
    if (authenticated) {
      authToken = SmokeTestUtils.getAuthToken();
    }

    // Create a test order for payment tests
    if (authToken) {
      try {
        const orderResult = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.orders.create,
          {
            method: 'POST',
            body: JSON.stringify(SMOKE_TEST_CONFIG.testData.order)
          },
          'Payment Test Order Creation'
        );

        if (orderResult.status === 200 || orderResult.status === 201) {
          testOrderId = orderResult.response.id;
          console.log(`📦 Created test order for payment tests: ${testOrderId}`);
        }
      } catch (error) {
        console.log('⚠️ Could not create test order for payment tests');
      }
    }
  });

  describe('Payment Order Creation', () => {
    test('Payment order creation endpoint is accessible', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.payments.create,
          {
            method: 'POST',
            body: JSON.stringify({
              amount: SMOKE_TEST_CONFIG.testData.payment.amount,
              currency: SMOKE_TEST_CONFIG.testData.payment.currency,
              orderId: testOrderId || `test-order-${Date.now()}`,
              method: SMOKE_TEST_CONFIG.testData.payment.method
            })
          },
          'Payment Order Creation'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.authRequired, ...SMOKE_TEST_CONFIG.responses.validationError]
        );
        const meetsPerformance = SmokeTestUtils.checkPerformanceThreshold(
          'Payment Order Creation',
          duration,
          SMOKE_TEST_CONFIG.thresholds.paymentFlow
        );

        if (isValidStatus && meetsPerformance) {
          SmokeTestUtils.recordTestResult('Payment Order Creation', 'passed', duration, undefined, result.status);

          // Store payment ID for subsequent tests
          if (SMOKE_TEST_CONFIG.responses.success.includes(result.status) && result.response.id) {
            testPaymentId = result.response.id;
          }
        } else {
          const error = !isValidStatus ? `Invalid status: ${result.status}` : 'Performance threshold exceeded';
          SmokeTestUtils.recordTestResult('Payment Order Creation', 'failed', duration, error, result.status);
        }

        // Payment order creation should succeed or require auth
        expect([200, 201, 400, 401, 403, 422]).toContain(result.status);

        if (SMOKE_TEST_CONFIG.responses.success.includes(result.status)) {
          expect(result.response).toBeDefined();
          expect(result.response.id).toBeDefined();
          expect(result.response.amount).toBeDefined();
          expect(result.response.status).toBeDefined();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Payment Order Creation', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('Payment Verification', () => {
    test('Payment verification endpoint handles test data', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.payments.verify,
          {
            method: 'POST',
            body: JSON.stringify({
              razorpay_payment_id: `test_payment_${Date.now()}`,
              razorpay_order_id: testPaymentId || `test_order_${Date.now()}`,
              razorpay_signature: 'test_signature_hash'
            })
          },
          'Payment Verification'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.validationError, ...SMOKE_TEST_CONFIG.responses.authRequired]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Payment Verification', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Payment Verification', 'failed', duration, `Invalid status: ${result.status}`, result.status);
        }

        // Payment verification should respond (may fail with test data)
        expect([200, 400, 401, 403, 422]).toContain(result.status);

        if (result.status === 200) {
          expect(result.response).toBeDefined();
          expect(result.response.verified).toBeDefined();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Payment Verification', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('Payment verification rejects invalid signatures', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.payments.verify,
          {
            method: 'POST',
            body: JSON.stringify({
              razorpay_payment_id: 'invalid_payment_id',
              razorpay_order_id: 'invalid_order_id',
              razorpay_signature: 'invalid_signature'
            })
          },
          'Invalid Payment Verification'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          SMOKE_TEST_CONFIG.responses.validationError
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Invalid Payment Verification', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Invalid Payment Verification', 'failed', duration, `Expected validation error, got: ${result.status}`, result.status);
        }

        // Should return validation error for invalid data
        expect([400, 422]).toContain(result.status);
        expect(result.response).toBeDefined();
        expect(result.response.error || result.response.message).toBeDefined();
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Invalid Payment Verification', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('Payment Status Checking', () => {
    test('Payment status endpoint is accessible', async () => {
      const startTime = Date.now();

      try {
        const statusEndpoint = SMOKE_TEST_CONFIG.endpoints.payments.status.replace(
          '{id}',
          testPaymentId || `test-payment-${Date.now()}`
        );

        const result = await SmokeTestUtils.makeRequest(
          statusEndpoint,
          { method: 'GET' },
          'Payment Status Check'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.authRequired, ...SMOKE_TEST_CONFIG.responses.notFound]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Payment Status Check', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Payment Status Check', 'failed', duration, `Invalid status: ${result.status}`, result.status);
        }

        // Payment status should be accessible or require auth
        expect([200, 401, 403, 404]).toContain(result.status);

        if (result.status === 200) {
          expect(result.response).toBeDefined();
          expect(result.response.status).toBeDefined();
          expect(result.response.amount).toBeDefined();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Payment Status Check', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('Payment Error Handling', () => {
    test('Payment endpoints handle malformed requests gracefully', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.payments.create,
          {
            method: 'POST',
            body: 'invalid-json-data'
          },
          'Malformed Payment Request'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          SMOKE_TEST_CONFIG.responses.validationError
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Malformed Payment Request', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Malformed Payment Request', 'failed', duration, `Expected validation error, got: ${result.status}`, result.status);
        }

        // Should handle malformed requests properly
        expect([400, 422]).toContain(result.status);
        expect(result.response).toBeDefined();
        expect(result.response.error || result.response.message).toBeDefined();
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Malformed Payment Request', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('Payment Performance', () => {
    test('Payment flow completes within performance threshold', async () => {
      const flowStartTime = Date.now();

      try {
        // Create payment order
        const createResult = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.payments.create,
          {
            method: 'POST',
            body: JSON.stringify({
              amount: 10000, // ₹100
              currency: 'INR',
              orderId: `perf-test-${Date.now()}`,
              method: 'card'
            })
          },
          'Payment Flow Performance - Create'
        );

        // Verify payment (with test data)
        if (createResult.status === 200 || createResult.status === 201) {
          await SmokeTestUtils.makeRequest(
            SMOKE_TEST_CONFIG.endpoints.payments.verify,
            {
              method: 'POST',
              body: JSON.stringify({
                razorpay_payment_id: `perf_payment_${Date.now()}`,
                razorpay_order_id: createResult.response?.id || `perf_order_${Date.now()}`,
                razorpay_signature: 'perf_test_signature'
              })
            },
            'Payment Flow Performance - Verify'
          );
        }

        const flowDuration = Date.now() - flowStartTime;
        const meetsPerformance = flowDuration <= SMOKE_TEST_CONFIG.thresholds.paymentFlow;

        if (meetsPerformance) {
          SmokeTestUtils.recordTestResult('Payment Flow Performance', 'passed', flowDuration);
        } else {
          SmokeTestUtils.recordTestResult('Payment Flow Performance', 'failed', flowDuration, `Exceeded ${SMOKE_TEST_CONFIG.thresholds.paymentFlow}ms threshold`);
        }

        expect(flowDuration).toBeLessThanOrEqual(SMOKE_TEST_CONFIG.thresholds.paymentFlow);
      } catch (error) {
        const flowDuration = Date.now() - flowStartTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Payment Flow Performance', 'failed', flowDuration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  afterAll(async () => {
    await SmokeTestUtils.cleanup();
  });
});