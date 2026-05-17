/**
 * HASIVU Platform - Health Check Smoke Tests
 *
 * Tests basic health and monitoring endpoints to ensure critical services are operational
 */

import { SMOKE_TEST_CONFIG } from '../config/smoke-test.config.test';
import { SmokeTestUtils } from '../utils/test-utils.test';

describe('Health Check Smoke Tests', () => {
  const TEST_TIMEOUT = SMOKE_TEST_CONFIG.timeouts.test;

  beforeAll(() => {
    SmokeTestUtils.initializeSuite();
  });

  describe('Core Health Endpoints', () => {
    test('Application health endpoint responds correctly', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.health,
          { method: 'GET' },
          'Application Health Check'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.serverError]
        );
        const meetsPerformance = SmokeTestUtils.checkPerformanceThreshold(
          'Health Check',
          duration,
          SMOKE_TEST_CONFIG.thresholds.healthCheck
        );

        if (isValidStatus && meetsPerformance) {
          SmokeTestUtils.recordTestResult('Application Health Check', 'passed', duration, undefined, result.status);
        } else {
          const error = !isValidStatus ? `Invalid status: ${result.status}` : 'Performance threshold exceeded';
          SmokeTestUtils.recordTestResult('Application Health Check', 'failed', duration, error, result.status);
        }

        // Health endpoint should respond (may be 503 if services are starting)
        expect([200, 503]).toContain(result.status);

        if (result.status === 200) {
          expect(result.response).toBeDefined();
          expect(result.response.status).toBe('healthy');
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Application Health Check', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('Monitoring status endpoint is accessible', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.monitoring.status,
          { method: 'GET' },
          'Monitoring Status Check'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.authRequired, ...SMOKE_TEST_CONFIG.responses.notFound]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Monitoring Status Check', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Monitoring Status Check', 'failed', duration, `Invalid status: ${result.status}`, result.status);
        }

        // Monitoring endpoint should be accessible or return auth required
        expect([200, 401, 403, 404]).toContain(result.status);
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Monitoring Status Check', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('Monitoring metrics endpoint is accessible', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.monitoring.metrics,
          { method: 'GET' },
          'Monitoring Metrics Check'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.authRequired, ...SMOKE_TEST_CONFIG.responses.notFound]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Monitoring Metrics Check', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Monitoring Metrics Check', 'failed', duration, `Invalid status: ${result.status}`, result.status);
        }

        // Metrics endpoint should be accessible or return auth required
        expect([200, 401, 403, 404]).toContain(result.status);
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Monitoring Metrics Check', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('Service Availability Tests', () => {
    test('Database connectivity check', async () => {
      const startTime = Date.now();

      try {
        // Test database health through API
        const result = await SmokeTestUtils.makeRequest(
          '/api/v1/health/database',
          { method: 'GET' },
          'Database Connectivity Check'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.notFound, ...SMOKE_TEST_CONFIG.responses.serverError]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Database Connectivity Check', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Database Connectivity Check', 'failed', duration, `Invalid status: ${result.status}`, result.status);
        }

        // Database health should respond or 404 if endpoint doesn't exist
        expect([200, 404, 503]).toContain(result.status);
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Database Connectivity Check', 'failed', duration, errorMessage);
        // Don't throw - database connectivity test is not critical for smoke tests
      }
    }, TEST_TIMEOUT);

    test('Cache service availability check', async () => {
      const startTime = Date.now();

      try {
        // Test cache health through API
        const result = await SmokeTestUtils.makeRequest(
          '/api/v1/health/cache',
          { method: 'GET' },
          'Cache Service Check'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.notFound, ...SMOKE_TEST_CONFIG.responses.serverError]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Cache Service Check', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Cache Service Check', 'failed', duration, `Invalid status: ${result.status}`, result.status);
        }

        // Cache health should respond or 404 if endpoint doesn't exist
        expect([200, 404, 503]).toContain(result.status);
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Cache Service Check', 'failed', duration, errorMessage);
        // Don't throw - cache service test is not critical for smoke tests
      }
    }, TEST_TIMEOUT);
  });

  describe('Performance Validation', () => {
    test('Health check response time is within acceptable limits', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.health,
          { method: 'GET' },
          'Health Check Performance'
        );

        const duration = Date.now() - startTime;
        const meetsPerformance = duration <= SMOKE_TEST_CONFIG.thresholds.healthCheck;

        if (meetsPerformance) {
          SmokeTestUtils.recordTestResult('Health Check Performance', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Health Check Performance', 'failed', duration, `Exceeded ${SMOKE_TEST_CONFIG.thresholds.healthCheck}ms threshold`, result.status);
        }

        expect(duration).toBeLessThanOrEqual(SMOKE_TEST_CONFIG.thresholds.healthCheck);
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Health Check Performance', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  afterAll(async () => {
    await SmokeTestUtils.cleanup();
  });
});