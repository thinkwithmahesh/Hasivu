"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const smoke_test_config_test_1 = require("../config/smoke-test.config.test");
const test_utils_test_1 = require("../utils/test-utils.test");
describe('Payment Flow Smoke Tests', () => {
    const TEST_TIMEOUT = smoke_test_config_test_1.SMOKE_TEST_CONFIG.timeouts.test;
    let authToken = null;
    let testOrderId = null;
    let testPaymentId = null;
    beforeAll(async () => {
        test_utils_test_1.SmokeTestUtils.initializeSuite();
        const authenticated = await test_utils_test_1.SmokeTestUtils.authenticate();
        if (authenticated) {
            authToken = test_utils_test_1.SmokeTestUtils.getAuthToken();
        }
        if (authToken) {
            try {
                const orderResult = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.orders.create, {
                    method: 'POST',
                    body: JSON.stringify(smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.order)
                }, 'Payment Test Order Creation');
                if (orderResult.status === 200 || orderResult.status === 201) {
                    testOrderId = orderResult.response.id;
                    console.log(`📦 Created test order for payment tests: ${testOrderId}`);
                }
            }
            catch (error) {
                console.log('⚠️ Could not create test order for payment tests');
            }
        }
    });
    describe('Payment Order Creation', () => {
        test('Payment order creation endpoint is accessible', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.payments.create, {
                    method: 'POST',
                    body: JSON.stringify({
                        amount: smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.payment.amount,
                        currency: smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.payment.currency,
                        orderId: testOrderId || `test-order-${Date.now()}`,
                        method: smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.payment.method
                    })
                }, 'Payment Order Creation');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.authRequired, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.validationError]);
                const meetsPerformance = test_utils_test_1.SmokeTestUtils.checkPerformanceThreshold('Payment Order Creation', duration, smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.paymentFlow);
                if (isValidStatus && meetsPerformance) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Payment Order Creation', 'passed', duration, undefined, result.status);
                    if (smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success.includes(result.status) && result.response.id) {
                        testPaymentId = result.response.id;
                    }
                }
                else {
                    const error = !isValidStatus ? `Invalid status: ${result.status}` : 'Performance threshold exceeded';
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Payment Order Creation', 'failed', duration, error, result.status);
                }
                expect([200, 201, 400, 401, 403, 422]).toContain(result.status);
                if (smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success.includes(result.status)) {
                    expect(result.response).toBeDefined();
                    expect(result.response.id).toBeDefined();
                    expect(result.response.amount).toBeDefined();
                    expect(result.response.status).toBeDefined();
                }
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Payment Order Creation', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    describe('Payment Verification', () => {
        test('Payment verification endpoint handles test data', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.payments.verify, {
                    method: 'POST',
                    body: JSON.stringify({
                        razorpay_payment_id: `test_payment_${Date.now()}`,
                        razorpay_order_id: testPaymentId || `test_order_${Date.now()}`,
                        razorpay_signature: 'test_signature_hash'
                    })
                }, 'Payment Verification');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.validationError, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.authRequired]);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Payment Verification', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Payment Verification', 'failed', duration, `Invalid status: ${result.status}`, result.status);
                }
                expect([200, 400, 401, 403, 422]).toContain(result.status);
                if (result.status === 200) {
                    expect(result.response).toBeDefined();
                    expect(result.response.verified).toBeDefined();
                }
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Payment Verification', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
        test('Payment verification rejects invalid signatures', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.payments.verify, {
                    method: 'POST',
                    body: JSON.stringify({
                        razorpay_payment_id: 'invalid_payment_id',
                        razorpay_order_id: 'invalid_order_id',
                        razorpay_signature: 'invalid_signature'
                    })
                }, 'Invalid Payment Verification');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.validationError);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Invalid Payment Verification', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Invalid Payment Verification', 'failed', duration, `Expected validation error, got: ${result.status}`, result.status);
                }
                expect([400, 422]).toContain(result.status);
                expect(result.response).toBeDefined();
                expect(result.response.error || result.response.message).toBeDefined();
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Invalid Payment Verification', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    describe('Payment Status Checking', () => {
        test('Payment status endpoint is accessible', async () => {
            const startTime = Date.now();
            try {
                const statusEndpoint = smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.payments.status.replace('{id}', testPaymentId || `test-payment-${Date.now()}`);
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(statusEndpoint, { method: 'GET' }, 'Payment Status Check');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, [...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.authRequired, ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.notFound]);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Payment Status Check', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Payment Status Check', 'failed', duration, `Invalid status: ${result.status}`, result.status);
                }
                expect([200, 401, 403, 404]).toContain(result.status);
                if (result.status === 200) {
                    expect(result.response).toBeDefined();
                    expect(result.response.status).toBeDefined();
                    expect(result.response.amount).toBeDefined();
                }
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Payment Status Check', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    describe('Payment Error Handling', () => {
        test('Payment endpoints handle malformed requests gracefully', async () => {
            const startTime = Date.now();
            try {
                const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.payments.create, {
                    method: 'POST',
                    body: 'invalid-json-data'
                }, 'Malformed Payment Request');
                const duration = Date.now() - startTime;
                const isValidStatus = test_utils_test_1.SmokeTestUtils.validateResponseStatus(result.status, smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.validationError);
                if (isValidStatus) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Malformed Payment Request', 'passed', duration, undefined, result.status);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Malformed Payment Request', 'failed', duration, `Expected validation error, got: ${result.status}`, result.status);
                }
                expect([400, 422]).toContain(result.status);
                expect(result.response).toBeDefined();
                expect(result.response.error || result.response.message).toBeDefined();
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Malformed Payment Request', 'failed', duration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    describe('Payment Performance', () => {
        test('Payment flow completes within performance threshold', async () => {
            const flowStartTime = Date.now();
            try {
                const createResult = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.payments.create, {
                    method: 'POST',
                    body: JSON.stringify({
                        amount: 10000,
                        currency: 'INR',
                        orderId: `perf-test-${Date.now()}`,
                        method: 'card'
                    })
                }, 'Payment Flow Performance - Create');
                if (createResult.status === 200 || createResult.status === 201) {
                    await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.payments.verify, {
                        method: 'POST',
                        body: JSON.stringify({
                            razorpay_payment_id: `perf_payment_${Date.now()}`,
                            razorpay_order_id: createResult.response?.id || `perf_order_${Date.now()}`,
                            razorpay_signature: 'perf_test_signature'
                        })
                    }, 'Payment Flow Performance - Verify');
                }
                const flowDuration = Date.now() - flowStartTime;
                const meetsPerformance = flowDuration <= smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.paymentFlow;
                if (meetsPerformance) {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Payment Flow Performance', 'passed', flowDuration);
                }
                else {
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Payment Flow Performance', 'failed', flowDuration, `Exceeded ${smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.paymentFlow}ms threshold`);
                }
                expect(flowDuration).toBeLessThanOrEqual(smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.paymentFlow);
            }
            catch (error) {
                const flowDuration = Date.now() - flowStartTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Payment Flow Performance', 'failed', flowDuration, errorMessage);
                throw error;
            }
        }, TEST_TIMEOUT);
    });
    afterAll(async () => {
        await test_utils_test_1.SmokeTestUtils.cleanup();
    });
});
//# sourceMappingURL=payment-flow.test.js.map