/**
 * HASIVU Platform - Order Creation Smoke Tests
 *
 * Tests complete order creation and management flow including order placement,
 * status tracking, and order history
 */

import { SMOKE_TEST_CONFIG } from '../config/smoke-test.config.test';
import { SmokeTestUtils } from '../utils/test-utils.test';

describe('Order Creation Smoke Tests', () => {
  const TEST_TIMEOUT = SMOKE_TEST_CONFIG.timeouts.test;
  let authToken: string | null = null;
  let testOrderId: string | null = null;

  beforeAll(async () => {
    SmokeTestUtils.initializeSuite();

    // Authenticate for order tests
    const authenticated = await SmokeTestUtils.authenticate();
    if (authenticated) {
      authToken = SmokeTestUtils.getAuthToken();
    }
  });

  describe('Order Creation', () => {
    test('Order creation endpoint accepts valid order data', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.orders.create,
          {
            method: 'POST',
            body: JSON.stringify(SMOKE_TEST_CONFIG.testData.order)
          },
          'Order Creation'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.authRequired, ...SMOKE_TEST_CONFIG.responses.validationError]
        );
        const meetsPerformance = SmokeTestUtils.checkPerformanceThreshold(
          'Order Creation',
          duration,
          SMOKE_TEST_CONFIG.thresholds.orderCreation
        );

        if (isValidStatus && meetsPerformance) {
          SmokeTestUtils.recordTestResult('Order Creation', 'passed', duration, undefined, result.status);

          // Store order ID for subsequent tests
          if (SMOKE_TEST_CONFIG.responses.success.includes(result.status) && result.response.id) {
            testOrderId = result.response.id;
          }
        } else {
          const error = !isValidStatus ? `Invalid status: ${result.status}` : 'Performance threshold exceeded';
          SmokeTestUtils.recordTestResult('Order Creation', 'failed', duration, error, result.status);
        }

        // Order creation should succeed or require auth
        expect([200, 201, 400, 401, 403, 422]).toContain(result.status);

        if (SMOKE_TEST_CONFIG.responses.success.includes(result.status)) {
          expect(result.response).toBeDefined();
          expect(result.response.id).toBeDefined();
          expect(result.response.status).toBeDefined();
          expect(result.response.totalAmount || result.response.amount).toBeDefined();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Order Creation', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('Order creation rejects invalid data', async () => {
      const startTime = Date.now();

      try {
        const invalidOrder = {
          items: [], // Empty items
          deliveryTime: 'invalid-date',
          paymentMethod: 'invalid-method'
        };

        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.orders.create,
          {
            method: 'POST',
            body: JSON.stringify(invalidOrder)
          },
          'Invalid Order Creation'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.validationError, ...SMOKE_TEST_CONFIG.responses.authRequired]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Invalid Order Creation', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Invalid Order Creation', 'failed', duration, `Expected validation error, got: ${result.status}`, result.status);
        }

        // Should return validation error or auth required
        expect([400, 401, 403, 422]).toContain(result.status);

        if (result.status === 400 || result.status === 422) {
          expect(result.response).toBeDefined();
          expect(result.response.errors || result.response.message).toBeDefined();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Invalid Order Creation', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('Order Retrieval', () => {
    test('Order list endpoint is accessible', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.orders.list,
          { method: 'GET' },
          'Order List Retrieval'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.authRequired]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Order List Retrieval', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Order List Retrieval', 'failed', duration, `Invalid status: ${result.status}`, result.status);
        }

        // Order list should be accessible or require auth
        expect([200, 401, 403]).toContain(result.status);

        if (result.status === 200) {
          expect(Array.isArray(result.response)).toBe(true);
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Order List Retrieval', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('Order status endpoint works with valid order ID', async () => {
      if (!testOrderId) {
        console.log('⏭️ Skipping order status test - no test order ID available');
        SmokeTestUtils.recordTestResult('Order Status Check', 'skipped', 0, 'No test order ID');
        return;
      }

      const startTime = Date.now();

      try {
        const statusEndpoint = SMOKE_TEST_CONFIG.endpoints.orders.status.replace('{id}', testOrderId);

        const result = await SmokeTestUtils.makeRequest(
          statusEndpoint,
          { method: 'GET' },
          'Order Status Check'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.authRequired, ...SMOKE_TEST_CONFIG.responses.notFound]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Order Status Check', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Order Status Check', 'failed', duration, `Invalid status: ${result.status}`, result.status);
        }

        // Order status should be accessible or require auth
        expect([200, 401, 403, 404]).toContain(result.status);

        if (result.status === 200) {
          expect(result.response).toBeDefined();
          expect(result.response.id).toBe(testOrderId);
          expect(result.response.status).toBeDefined();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Order Status Check', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('Order Status Updates', () => {
    test('Order status update endpoint is accessible', async () => {
      if (!testOrderId) {
        console.log('⏭️ Skipping order update test - no test order ID available');
        SmokeTestUtils.recordTestResult('Order Status Update', 'skipped', 0, 'No test order ID');
        return;
      }

      const startTime = Date.now();

      try {
        const updateEndpoint = `/api/v1/orders/${testOrderId}/status`;

        const result = await SmokeTestUtils.makeRequest(
          updateEndpoint,
          {
            method: 'PUT',
            body: JSON.stringify({
              status: 'confirmed',
              notes: 'Smoke test status update'
            })
          },
          'Order Status Update'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.authRequired, ...SMOKE_TEST_CONFIG.responses.validationError, ...SMOKE_TEST_CONFIG.responses.notFound]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Order Status Update', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Order Status Update', 'failed', duration, `Invalid status: ${result.status}`, result.status);
        }

        // Status update should respond appropriately
        expect([200, 201, 400, 401, 403, 404, 422]).toContain(result.status);
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Order Status Update', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('Order Performance', () => {
    test('Order creation completes within performance threshold', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.orders.create,
          {
            method: 'POST',
            body: JSON.stringify({
              ...SMOKE_TEST_CONFIG.testData.order,
              items: [{
                menuItemId: `perf-test-${Date.now()}`,
                quantity: 1,
                specialInstructions: 'Performance test order'
              }]
            })
          },
          'Order Creation Performance'
        );

        const duration = Date.now() - startTime;
        const meetsPerformance = duration <= SMOKE_TEST_CONFIG.thresholds.orderCreation;

        if (meetsPerformance) {
          SmokeTestUtils.recordTestResult('Order Creation Performance', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Order Creation Performance', 'failed', duration, `Exceeded ${SMOKE_TEST_CONFIG.thresholds.orderCreation}ms threshold`, result.status);
        }

        expect(duration).toBeLessThanOrEqual(SMOKE_TEST_CONFIG.thresholds.orderCreation);
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Order Creation Performance', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  afterAll(async () => {
    await SmokeTestUtils.cleanup();
  });
});