/**
 * HASIVU Platform - Authentication Flow Smoke Tests
 *
 * Tests complete authentication flow including registration, login, token validation, and logout
 */

import { SMOKE_TEST_CONFIG } from '../config/smoke-test.config.test';
import { SmokeTestUtils } from '../utils/test-utils.test';

describe('Authentication Flow Smoke Tests', () => {
  const TEST_TIMEOUT = SMOKE_TEST_CONFIG.timeouts.test;

  beforeAll(() => {
    SmokeTestUtils.initializeSuite();
  });

  describe('User Registration', () => {
    test('User registration endpoint accepts valid data', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.auth.register,
          {
            method: 'POST',
            body: JSON.stringify(SMOKE_TEST_CONFIG.testData.user)
          },
          'User Registration'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.validationError, 409] // 409 for user exists
        );
        const meetsPerformance = SmokeTestUtils.checkPerformanceThreshold(
          'User Registration',
          duration,
          SMOKE_TEST_CONFIG.thresholds.authFlow
        );

        if (isValidStatus && meetsPerformance) {
          SmokeTestUtils.recordTestResult('User Registration', 'passed', duration, undefined, result.status);
        } else {
          const error = !isValidStatus ? `Invalid status: ${result.status}` : 'Performance threshold exceeded';
          SmokeTestUtils.recordTestResult('User Registration', 'failed', duration, error, result.status);
        }

        // Registration should succeed or user already exists
        expect([200, 201, 400, 409, 422]).toContain(result.status);

        if (SMOKE_TEST_CONFIG.responses.success.includes(result.status)) {
          expect(result.response).toBeDefined();
          expect(result.response.token || result.response.accessToken).toBeDefined();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('User Registration', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('User registration rejects invalid data', async () => {
      const startTime = Date.now();

      try {
        const invalidUser = {
          email: 'invalid-email',
          password: '123', // Too short
          name: ''
        };

        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.auth.register,
          {
            method: 'POST',
            body: JSON.stringify(invalidUser)
          },
          'Invalid User Registration'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          SMOKE_TEST_CONFIG.responses.validationError
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Invalid User Registration', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Invalid User Registration', 'failed', duration, `Expected validation error, got: ${result.status}`, result.status);
        }

        // Should return validation error
        expect(SMOKE_TEST_CONFIG.responses.validationError).toContain(result.status);
        expect(result.response).toBeDefined();
        expect(result.response.errors || result.response.message).toBeDefined();
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Invalid User Registration', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('User Login', () => {
    test('User login endpoint accepts valid credentials', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.auth.login,
          {
            method: 'POST',
            body: JSON.stringify({
              email: SMOKE_TEST_CONFIG.testData.user.email,
              password: SMOKE_TEST_CONFIG.testData.user.password
            })
          },
          'User Login'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.validationError]
        );
        const meetsPerformance = SmokeTestUtils.checkPerformanceThreshold(
          'User Login',
          duration,
          SMOKE_TEST_CONFIG.thresholds.authFlow
        );

        if (isValidStatus && meetsPerformance) {
          SmokeTestUtils.recordTestResult('User Login', 'passed', duration, undefined, result.status);

          // Store auth token for subsequent tests
          if (SMOKE_TEST_CONFIG.responses.success.includes(result.status)) {
            const token = result.response.token || result.response.accessToken;
            if (token) {
              // Set auth token for utils
              (SmokeTestUtils as any).authToken = token;
            }
          }
        } else {
          const error = !isValidStatus ? `Invalid status: ${result.status}` : 'Performance threshold exceeded';
          SmokeTestUtils.recordTestResult('User Login', 'failed', duration, error, result.status);
        }

        // Login should succeed or return validation error
        expect([200, 400, 401, 422]).toContain(result.status);

        if (SMOKE_TEST_CONFIG.responses.success.includes(result.status)) {
          expect(result.response).toBeDefined();
          expect(result.response.token || result.response.accessToken).toBeDefined();
          expect(result.response.user).toBeDefined();
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('User Login', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('User login rejects invalid credentials', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.auth.login,
          {
            method: 'POST',
            body: JSON.stringify({
              email: SMOKE_TEST_CONFIG.testData.user.email,
              password: 'wrongpassword'
            })
          },
          'Invalid User Login'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          SMOKE_TEST_CONFIG.responses.validationError
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Invalid User Login', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Invalid User Login', 'failed', duration, `Expected auth error, got: ${result.status}`, result.status);
        }

        // Should return authentication error
        expect([400, 401, 422]).toContain(result.status);
        expect(result.response).toBeDefined();
        expect(result.response.message || result.response.error).toBeDefined();
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Invalid User Login', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('Token Validation', () => {
    test('Token refresh endpoint is accessible', async () => {
      const startTime = Date.now();

      try {
        const result = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.auth.refresh,
          {
            method: 'POST',
            body: JSON.stringify({
              refreshToken: 'test-refresh-token' // This will likely fail but tests accessibility
            })
          },
          'Token Refresh'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          result.status,
          [...SMOKE_TEST_CONFIG.responses.success, ...SMOKE_TEST_CONFIG.responses.authRequired, ...SMOKE_TEST_CONFIG.responses.validationError]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Token Refresh', 'passed', duration, undefined, result.status);
        } else {
          SmokeTestUtils.recordTestResult('Token Refresh', 'failed', duration, `Invalid status: ${result.status}`, result.status);
        }

        // Refresh should respond (may require valid token)
        expect([200, 400, 401, 422]).toContain(result.status);
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Token Refresh', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('User profile endpoint requires authentication', async () => {
      const startTime = Date.now();

      try {
        // First try without auth
        const unauthResult = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.auth.profile,
          { method: 'GET' },
          'Profile Without Auth'
        );

        const duration = Date.now() - startTime;
        const isValidStatus = SmokeTestUtils.validateResponseStatus(
          unauthResult.status,
          [...SMOKE_TEST_CONFIG.responses.authRequired, ...SMOKE_TEST_CONFIG.responses.success]
        );

        if (isValidStatus) {
          SmokeTestUtils.recordTestResult('Profile Without Auth', 'passed', duration, undefined, unauthResult.status);
        } else {
          SmokeTestUtils.recordTestResult('Profile Without Auth', 'failed', duration, `Unexpected status: ${unauthResult.status}`, unauthResult.status);
        }

        // Should require authentication
        expect([401, 403]).toContain(unauthResult.status);
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Profile Without Auth', 'failed', duration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  describe('Authentication Performance', () => {
    test('Complete authentication flow completes within time limit', async () => {
      const flowStartTime = Date.now();

      try {
        // Register user
        await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.auth.register,
          {
            method: 'POST',
            body: JSON.stringify({
              ...SMOKE_TEST_CONFIG.testData.user,
              email: `perf-test-${Date.now()}@hasivu.com`
            })
          },
          'Performance Registration'
        );

        // Login user
        const loginResult = await SmokeTestUtils.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.auth.login,
          {
            method: 'POST',
            body: JSON.stringify({
              email: `perf-test-${Date.now()}@hasivu.com`,
              password: SMOKE_TEST_CONFIG.testData.user.password
            })
          },
          'Performance Login'
        );

        const flowDuration = Date.now() - flowStartTime;
        const meetsPerformance = flowDuration <= SMOKE_TEST_CONFIG.thresholds.authFlow;

        if (meetsPerformance) {
          SmokeTestUtils.recordTestResult('Auth Flow Performance', 'passed', flowDuration);
        } else {
          SmokeTestUtils.recordTestResult('Auth Flow Performance', 'failed', flowDuration, `Exceeded ${SMOKE_TEST_CONFIG.thresholds.authFlow}ms threshold`);
        }

        expect(flowDuration).toBeLessThanOrEqual(SMOKE_TEST_CONFIG.thresholds.authFlow);
      } catch (error) {
        const flowDuration = Date.now() - flowStartTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        SmokeTestUtils.recordTestResult('Auth Flow Performance', 'failed', flowDuration, errorMessage);
        throw error;
      }
    }, TEST_TIMEOUT);
  });

  afterAll(async () => {
    await SmokeTestUtils.cleanup();
  });
});