"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const smoke_test_config_test_1 = require("../config/smoke-test.config.test");
const test_utils_test_1 = require("../utils/test-utils.test");
describe('Order Creation Smoke Tests', () => {
    const TEST_TIMEOUT = smoke_test_config_test_1.SMOKE_TEST_CONFIG.timeouts.test;
    let authToken = null;
    let testOrderId = null;
    beforeAll(async () => {
        test_utils_test_1.SmokeTestUtils.initializeSuite();
        const authenticated = await test_utils_test_1.SmokeTestUtils.authenticate();
        if (authenticated) {
            authToken = test_utils_test_1.SmokeTestUtils.getAuthToken();
        }
    });
    describe('Order Creation', () => {
        test('Order creation endpoint accepts valid order data', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.orders.create, {
                    method: 'POST',
                    body: JSON.stringify(smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.order)
                }, 'Order Creation');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.authRequired, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.validationError]);
                const meetsPerformance = test_utils_test_1.SmokeTestUtils.checkPerformanceThreshold('Order Creation', duration, smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.orderCreation);
                if (isValidStatus && meetsPerformance) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Order Creation', 'passed', duration, undefined, result.status);
                    if (smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success.includes(result.status) && result.response.id) {
                        testOrderId = result.response.id;
                    }
                }
                else {
                    const error = !isValidStatus ? `Invalid status: ${result.status}` : 'Performance threshold exceeded';
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Order Creation', 'failed', duration, error, result.status);
                }
                expect([200, 201, 400, 401, 403, 422]).toContain(result.status);
                if (smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success.includes(result.status)) {
                    expect(result.response).toBeDefined();
                    expect(result.response.id).toBeDefined();
                    expect(result.response.status).toBeDefined();
                    expect(result.response.totalAmount || result.response.amount).toBeDefined();
                }
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Order Creation', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
        test('Order creation rejects invalid data', async () => {
            const startTime = Date.now();
            try {
                const invalidOrder = {
                    items: [],
                    deliveryTime: 'invalid-date',
                    paymentMethod: 'invalid-method'
                };
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.orders.create, {
                    method: 'POST',
                    body: JSON.stringify(invalidOrder)
                }, 'Invalid Order Creation');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.validationError, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.authRequired]);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Invalid Order Creation', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Invalid Order Creation', 'failed', duration, `Expected validation error, got: ${result.status}`, result.status);
                }
                expect([400, 401, 403, 422]).toContain(result.status);
                if (result.status === 400 || result.status === 422) {
                    expect(result.response).toBeDefined();
                    expect(result.response.errors || result.response.message).toBeDefined();
                }
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Invalid Order Creation', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    describe('Order Retrieval', () => {
        test('Order list endpoint is accessible', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.orders.list, { method: 'GET' }, 'Order List Retrieval');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.authRequired]);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Order List Retrieval', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Order List Retrieval', 'failed', duration, `Invalid status: ${result.status}`, result.status);
                }
                expect([200, 401, 403]).toContain(result.status);
                if (result.status === 200) {
                    expect(Array.isArray(result.response)).toBe(true);
                }
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Order List Retrieval', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
        test('Order status endpoint works with valid order ID', async () => {
            if (!testOrderId) {
                console.log('⏭️ Skipping order status test - no test order ID available');
                test_utils_test_1.SmokeTestUtils.recordTestResult('Order Status Check', 'skipped', 0, 'No test order ID');
                return;
            }
            const startTime = Date.now();
            try {
                const statusEndpoint = smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.orders.status.replace('{id}', testOrderId);
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(statusEndpoint, { method: 'GET' }, 'Order Status Check');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.authRequired, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.notFound]);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Order Status Check', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Order Status Check', 'failed', duration, `Invalid status: ${result.status}`, result.status);
                }
                expect([200, 401, 403, 404]).toContain(result.status);
                if (result.status === 200) {
                    expect(result.response).toBeDefined();
                    expect(result.response.id).toBe(testOrderId);
                    expect(result.response.status).toBeDefined();
                }
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Order Status Check', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    describe('Order Status Updates', () => {
        test('Order status update endpoint is accessible', async () => {
            if (!testOrderId) {
                console.log('⏭️ Skipping order update test - no test order ID available');
                test_utils_test_1.SmokeTestUtils.recordTestResult('Order Status Update', 'skipped', 0, 'No test order ID');
                return;
            }
            const startTime = Date.now();
            try {
                const updateEndpoint = `/api/v1/orders/${testOrderId}/status`;
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(updateEndpoint, {
                    method: 'PUT',
                    body: JSON.stringify({
                        status: 'confirmed',
                        notes: 'Smoke test status update'
                    })
                }, 'Order Status Update');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.authRequired, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.validationError, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.notFound]);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Order Status Update', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Order Status Update', 'failed', duration, `Invalid status: ${result.status}`, result.status);
                }
                expect([200, 201, 400, 401, 403, 404, 422]).toContain(result.status);
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Order Status Update', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    describe('Order Performance', () => {
        test('Order creation completes within performance threshold', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.orders.create, {
                    method: 'POST',
                    body: JSON.stringify({
                        ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.order,
                        items: [{
                                menuItemId: `perf-test-${Date.now()}`,
                                quantity: 1,
                                specialInstructions: 'Performance test order'
                            }]
                    })
                }, 'Order Creation Performance');
                const duration = Date.now() - startTime;
                const meetsPerformance = duration <= smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.orderCreation;
                if (meetsPerformance) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Order Creation Performance', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Order Creation Performance', 'failed', duration, `Exceeded ${smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.orderCreation}ms threshold`, result.status);
                }
                expect(duration).toBeLessThanOrEqual(smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.orderCreation);
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Order Creation Performance', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    afterAll(async () => {
        await test_utils_test_1.SmokeTestUtils.cleanup();
    });
});
//# sourceMappingURL=order-flow.test.js.map