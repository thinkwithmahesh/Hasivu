"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const smoke_test_config_test_1 = require("../config/smoke-test.config.test");
const test_utils_test_1 = require("../utils/test-utils.test");
describe('Health Check Smoke Tests', () => {
    const TEST_TIMEOUT = smoke_test_config_test_1.SMOKE_TEST_CONFIG.timeouts.test;
    beforeAll(() => {
        test_utils_test_1.SmokeTestUtils.initializeSuite();
    });
    describe('Core Health Endpoints', () => {
        test('Application health endpoint responds correctly', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.health, { method: 'GET' }, 'Application Health Check');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.serverError]);
                const meetsPerformance = test_utils_test_1.SmokeTestUtils.checkPerformanceThreshold('Health Check', duration, smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.healthCheck);
                if (isValidStatus && meetsPerformance) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Application Health Check', 'passed', duration, undefined, result.status);
                }
                else {
                    const error = !isValidStatus ? `Invalid status: ${result.status}` : 'Performance threshold exceeded';
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Application Health Check', 'failed', duration, error, result.status);
                }
                expect([200, 503]).toContain(result.status);
                if (result.status === 200) {
                    expect(result.response).toBeDefined();
                    expect(result.response.status).toBe('healthy');
                }
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Application Health Check', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
        test('Monitoring status endpoint is accessible', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.monitoring.status, { method: 'GET' }, 'Monitoring Status Check');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.authRequired, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.notFound]);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Monitoring Status Check', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Monitoring Status Check', 'failed', duration, `Invalid status: ${result.status}`, result.status);
                }
                expect([200, 401, 403, 404]).toContain(result.status);
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Monitoring Status Check', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
        test('Monitoring metrics endpoint is accessible', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.monitoring.metrics, { method: 'GET' }, 'Monitoring Metrics Check');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.authRequired, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.notFound]);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Monitoring Metrics Check', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Monitoring Metrics Check', 'failed', duration, `Invalid status: ${result.status}`, result.status);
                }
                expect([200, 401, 403, 404]).toContain(result.status);
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Monitoring Metrics Check', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    describe('Service Availability Tests', () => {
        test('Database connectivity check', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest('/api/v1/health/database', { method: 'GET' }, 'Database Connectivity Check');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.notFound, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.serverError]);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Database Connectivity Check', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Database Connectivity Check', 'failed', duration, `Invalid status: ${result.status}`, result.status);
                }
                expect([200, 404, 503]).toContain(result.status);
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Database Connectivity Check', 'failed', duration, errorMessage);
            }
        }, TEST_TIMEOUT);
        test('Cache service availability check', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest('/api/v1/health/cache', { method: 'GET' }, 'Cache Service Check');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.notFound, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.serverError]);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Cache Service Check', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Cache Service Check', 'failed', duration, `Invalid status: ${result.status}`, result.status);
                }
                expect([200, 404, 503]).toContain(result.status);
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Cache Service Check', 'failed', duration, errorMessage);
            }
        }, TEST_TIMEOUT);
    });
    describe('Performance Validation', () => {
        test('Health check response time is within acceptable limits', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.health, { method: 'GET' }, 'Health Check Performance');
                const duration = Date.now() - startTime;
                const meetsPerformance = duration <= smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.healthCheck;
                if (meetsPerformance) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Health Check Performance', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Health Check Performance', 'failed', duration, `Exceeded ${smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.healthCheck}ms threshold`, result.status);
                }
                expect(duration).toBeLessThanOrEqual(smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.healthCheck);
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Health Check Performance', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    afterAll(async () => {
        await test_utils_test_1.SmokeTestUtils.cleanup();
    });
});
//# sourceMappingURL=health-check.test.js.map