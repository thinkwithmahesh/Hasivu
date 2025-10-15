"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const smoke_test_config_test_1 = require("../config/smoke-test.config.test");
const test_utils_test_1 = require("../utils/test-utils.test");
describe('Authentication Flow Smoke Tests', () => {
    const TEST_TIMEOUT = smoke_test_config_test_1.SMOKE_TEST_CONFIG.timeouts.test;
    beforeAll(() => {
        test_utils_test_1.SmokeTestUtils.initializeSuite();
    });
    describe('User Registration', () => {
        test('User registration endpoint accepts valid data', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.auth.register, {
                    method: 'POST',
                    body: JSON.stringify(smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.user)
                }, 'User Registration');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.validationError, 409]);
                const meetsPerformance = test_utils_test_1.SmokeTestUtils.checkPerformanceThreshold('User Registration', duration, smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.authFlow);
                if (isValidStatus && meetsPerformance) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('User Registration', 'passed', duration, undefined, result.status);
                }
                else {
                    const error = !isValidStatus ? `Invalid status: ${result.status}` : 'Performance threshold exceeded';
                    test_utils_test_1.SmokeTestUtils.recordTestResult('User Registration', 'failed', duration, error, result.status);
                }
                expect([200, 201, 400, 409, 422]).toContain(result.status);
                if (smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success.includes(result.status)) {
                    expect(result.response).toBeDefined();
                    expect(result.response.token || result.response.accessToken).toBeDefined();
                }
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('User Registration', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
        test('User registration rejects invalid data', async () => {
            const startTime = Date.now();
            try {
                const invalidUser = {
                    email: 'invalid-email',
                    password: '123',
                    name: ''
                };
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.auth.register, {
                    method: 'POST',
                    body: JSON.stringify(invalidUser)
                }, 'Invalid User Registration');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.validationError);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Invalid User Registration', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Invalid User Registration', 'failed', duration, `Expected validation error, got: ${result.status}`, result.status);
                }
                expect(smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.validationError).toContain(result.status);
                expect(result.response).toBeDefined();
                expect(result.response.errors || result.response.message).toBeDefined();
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Invalid User Registration', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    describe('User Login', () => {
        test('User login endpoint accepts valid credentials', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.auth.login, {
                    method: 'POST',
                    body: JSON.stringify({
                        email: smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.user.email,
                        password: smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.user.password
                    })
                }, 'User Login');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.validationError]);
                const meetsPerformance = test_utils_test_1.SmokeTestUtils.checkPerformanceThreshold('User Login', duration, smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.authFlow);
                if (isValidStatus && meetsPerformance) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('User Login', 'passed', duration, undefined, result.status);
                    if (smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success.includes(result.status)) {
                        const token = result.response.token || result.response.accessToken;
                        if (token) {
                            test_utils_test_1.SmokeTestUtils.authToken = token;
                        }
                    }
                }
                else {
                    const error = !isValidStatus ? `Invalid status: ${result.status}` : 'Performance threshold exceeded';
                    test_utils_test_1.SmokeTestUtils.recordTestResult('User Login', 'failed', duration, error, result.status);
                }
                expect([200, 400, 401, 422]).toContain(result.status);
                if (smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success.includes(result.status)) {
                    expect(result.response).toBeDefined();
                    expect(result.response.token || result.response.accessToken).toBeDefined();
                    expect(result.response.user).toBeDefined();
                }
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('User Login', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
        test('User login rejects invalid credentials', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.auth.login, {
                    method: 'POST',
                    body: JSON.stringify({
                        email: smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.user.email,
                        password: 'wrongpassword'
                    })
                }, 'Invalid User Login');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.validationError);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Invalid User Login', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Invalid User Login', 'failed', duration, `Expected auth error, got: ${result.status}`, result.status);
                }
                expect([400, 401, 422]).toContain(result.status);
                expect(result.response).toBeDefined();
                expect(result.response.message || result.response.error).toBeDefined();
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Invalid User Login', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    describe('Token Validation', () => {
        test('Token refresh endpoint is accessible', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.auth.refresh, {
                    method: 'POST',
                    body: JSON.stringify({
                        refreshToken: 'test-refresh-token'
                    })
                }, 'Token Refresh');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.authRequired, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.validationError]);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Token Refresh', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Token Refresh', 'failed', duration, `Invalid status: ${result.status}`, result.status);
                }
                expect([200, 400, 401, 422]).toContain(result.status);
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Token Refresh', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
        test('User profile endpoint requires authentication', async () => {
            const startTime = Date.now();
            try {
                const unauthResult = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.auth.profile, { method: 'GET' }, 'Profile Without Auth');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(unauthResult.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.authRequired, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success]);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Profile Without Auth', 'passed', duration, undefined, unauthResult.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Profile Without Auth', 'failed', duration, `Unexpected status: ${unauthResult.status}`, unauthResult.status);
                }
                expect([401, 403]).toContain(unauthResult.status);
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Profile Without Auth', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    describe('Authentication Performance', () => {
        test('Complete authentication flow completes within time limit', async () => {
            const flowStartTime = Date.now();
            try {
                await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.auth.register, {
                    method: 'POST',
                    body: JSON.stringify({
                        ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.user,
                        email: `perf-test-${Date.now()}@hasivu.com`
                    })
                }, 'Performance Registration');
                const loginResult = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.auth.login, {
                    method: 'POST',
                    body: JSON.stringify({
                        email: `perf-test-${Date.now()}@hasivu.com`,
                        password: smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.user.password
                    })
                }, 'Performance Login');
                const flowDuration = Date.now() - flowStartTime;
                const meetsPerformance = flowDuration <= smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.authFlow;
                if (meetsPerformance) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Auth Flow Performance', 'passed', flowDuration);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Auth Flow Performance', 'failed', flowDuration, `Exceeded ${smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.authFlow}ms threshold`);
                }
                expect(flowDuration).toBeLessThanOrEqual(smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.authFlow);
            }
            catch (error) {
                const flowDuration = Date.now() - flowStartTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Auth Flow Performance', 'failed', flowDuration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    afterAll(async () => {
        await test_utils_test_1.SmokeTestUtils.cleanup();
    });
});
//# sourceMappingURL=auth-flow.test.js.map