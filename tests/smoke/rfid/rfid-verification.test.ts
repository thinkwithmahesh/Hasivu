/**
 * HASIVU Platform - RFID Verification Smoke Tests
 *
 * Tests RFID card verification, delivery verification, and connection testing
 */

import { SMOKE_TEST_CONFIG } from '../config/smoke-test.config.test';
import { SmokeTestUtils } from '../utils/test-utils.test';

describe('RFID Verification Smoke Tests', () => {
  const TEST_TIMEOUT = SMOKE_TEST_CONFIG.timeouts.test;
  let authToken: string | null = null;
  let testOrderId: string | null = null;

  beforeAll(async () => {
    SmokeTestUtils.initializeSuite();

    // Authenticate for RFID tests
    const authenticated = await SmokeTestUtils.authenticate();
    if (authenticated) {
      authToken = SmokeTestUtils.getAuthToken();
    }

    // Create a test order for RFID tests
    if (authToken) {
      try {
        const orderResult = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.orders.create,
          {
            method: 'POST',
            body: JSON.stringify(SMOKE_TEST_CONFIG.testData.order)
          },
          'RFID Test Order Creation'
        );

        if (orderResult.status === 200 || orderResult.status === 201) {
          testOrderId = orderResult.response.id;
          console.log(`📦 Created test order for RFID tests: ${testOrderId}`);
        }
      } catch (error) {
        console.log('⚠️ Could not create test order for RFID tests');
      }
    }
  });

  describe('RFID Card Verification', () => {
    test('RFID card verification endpoint is accessible', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.rfid.verify,
          {
            method: 'POST',
            body: JSON.stringify({
              cardId: SMOKE_TEST_CONFIG.testData.rfid.cardId,
              studentId: SMOKE_TEST_CONFIG.testData.rfid.studentId,
              orderId: testOrderId || SMOKE_TEST_CONFIG.testData.rfid.orderId
            })
          },
          'RFID Card Verification'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.authRequired, ...SMOKE_TEST_CONFIG.responses.validationError, ...SMOKE_TEST_CONFIG.responses.notFound]
        );
        const meetsPerformance = SmokeTestUtils.checkPerformanceThreshold(
          'RFID Card Verification',
          duration,
          SMOKE_TEST_CONFIG.thresholds.rfidVerification
        );

        if (isValidStatus && meetsPerformance) {
          SmokeTestUtils.recordTestResult('RFID Card Verification', 'passed', duration, undefined, result.status);
        } else {
          const error = !isValidStatus ? `Invalid status: ${result.status}` : 'Performance threshold exceeded';
          SmokeTestUtils.recordTestResult('RFID Card Verification', 'failed', duration, error, result.status);
        }

        // RFID verification should respond appropriately
        expect([200, 400, 401, 403, 404, 422]).toContain(result.status);

        if (result.status === 200) {
          expect(result.response).toBeDefined();
          expect(result.response.verified).toBeDefined();
          expect(result.response.cardId).toBeDefined();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('RFID Card Verification', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('RFID verification rejects invalid card data', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.rfid.verify,
          {
            method: 'POST',
            body: JSON.stringify({
              cardId: 'INVALID_CARD',
              studentId: '',
              orderId: 'invalid-order'
            })
          },
          'Invalid RFID Card Verification'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.validationError, ...SMOKE_TEST_CONFIG.responses.notFound, ...SMOKE_TEST_CONFIG.responses.authRequired]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Invalid RFID Card Verification', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Invalid RFID Card Verification', 'failed', duration, `Expected validation error, got: ${result.status}`, result.status);
        }

        // Should return validation or not found error
        expect([400, 404, 422]).toContain(result.status);

        if (result.status !== 401 && result.status !== 403) {
          expect(result.response).toBeDefined();
          expect(result.response.error || result.response.message).toBeDefined();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Invalid RFID Card Verification', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('RFID Delivery Verification', () => {
    test('RFID delivery verification endpoint works with order ID', async () => {
      if (!testOrderId) {
        console.log('⏭️ Skipping delivery verification test - no test order ID available');
        SmokeTestUtils.recordTestResult('RFID Delivery Verification', 'skipped', 0, 'No test order ID');
        return;
      }

      const startTime = Date.now();

      try {
        const deliveryEndpoint = SMOKE_TEST_CONFIG.endpoints.rfid.delivery.replace('{orderId}', testOrderId);

        const result = await SmokeTestUtils.makeRequest(
          deliveryEndpoint,
          {
            method: 'POST',
            body: JSON.stringify({
              cardId: SMOKE_TEST_CONFIG.testData.rfid.cardId,
              deliveryTime: new Date().toISOString(),
              location: 'Test Delivery Location',
              verifiedBy: 'smoke-test-user'
            })
          },
          'RFID Delivery Verification'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.authRequired, ...SMOKE_TEST_CONFIG.responses.validationError, ...SMOKE_TEST_CONFIG.responses.notFound]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('RFID Delivery Verification', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('RFID Delivery Verification', 'failed', duration, `Invalid status: ${result.status}`, result.status);
        }

        // Delivery verification should respond appropriately
        expect([200, 201, 400, 401, 403, 404, 422]).toContain(result.status);

        if (SMOKE_TEST_CONFIG.responses.success.includes(result.status)) {
          expect(result.response).toBeDefined();
          expect(result.response.orderId).toBe(testOrderId);
          expect(result.response.deliveryStatus).toBeDefined();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('RFID Delivery Verification', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('RFID Connection Testing', () => {
    test('RFID connection test endpoint is accessible', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.rfid.test,
          { method: 'GET' },
          'RFID Connection Test'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.authRequired, ...SMOKE_TEST_CONFIG.responses.serverError]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('RFID Connection Test', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('RFID Connection Test', 'failed', duration, `Invalid status: ${result.status}`, result.status);
        }

        // Connection test should respond (may be 503 if hardware not connected)
        expect([200, 401, 403, 503]).toContain(result.status);

        if (result.status === 200) {
          expect(result.response).toBeDefined();
          expect(result.response.connectionStatus).toBeDefined();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('RFID Connection Test', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('RFID Error Handling', () => {
    test('RFID endpoints handle malformed requests gracefully', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.rfid.verify,
          {
            method: 'POST',
            body: 'invalid-json-data'
          },
          'Malformed RFID Request'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          SMOKE_TEST_CONFIG.responses.validationError
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Malformed RFID Request', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Malformed RFID Request', 'failed', duration, `Expected validation error, got: ${result.status}`, result.status);
        }

        // Should handle malformed requests properly
        expect([400, 422]).toContain(result.status);
        expect(result.response).toBeDefined();
        expect(result.response.error || result.response.message).toBeDefined();
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Malformed RFID Request', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('RFID Performance', () => {
    test('RFID verification completes within performance threshold', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.rfid.verify,
          {
            method: 'POST',
            body: JSON.stringify({
              cardId: `perf-test-${Date.now()}`,
              studentId: `perf-student-${Date.now()}`,
              orderId: `perf-order-${Date.now()}`
            })
          },
          'RFID Verification Performance'
        );

        const duration = Date.now() - startTime;
        const meetsPerformance = duration <= SMOKE_TEST_CONFIG.thresholds.rfidVerification;

        if (meetsPerformance) {
          SmokeTestUtils.recordTestResult('RFID Verification Performance', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('RFID Verification Performance', 'failed', duration, `Exceeded ${SMOKE_TEST_CONFIG.thresholds.rfidVerification}ms threshold`, result.status);
        }

        expect(duration).toBeLessThanOrEqual(SMOKE_TEST_CONFIG.thresholds.rfidVerification);
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('RFID Verification Performance', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  afterAll(async () => {
    await SmokeTestUtils.cleanup();
  });
});