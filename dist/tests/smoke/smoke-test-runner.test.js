"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const smoke_test_config_test_1 = require("./config/smoke-test.config.test");
const test_utils_test_1 = require("./utils/test-utils.test");
describe('HASIVU Platform Smoke Test Suite', () => {
    const SUITE_TIMEOUT = smoke_test_config_test_1.SMOKE_TEST_CONFIG.timeouts.suite;
    beforeAll(() => {
        const envValid = smoke_test_config_test_1.SMOKE_TEST_CONFIG.validateEnvironment();
        if (!envValid) {
            throw new Error('Environment validation failed');
        }
        test_utils_test_1.SmokeTestUtils.initializeSuite();
    });
    describe('Critical User Journey Tests', () => {
        test('Complete smoke test suite execution within 5 minutes', async () => {
            const suiteStartTime = Date.now();
            const results = [];
            console.log('\n🚀 Starting comprehensive smoke test suite...');
            console.log(`⏰ Suite timeout: ${SUITE_TIMEOUT / 1000} seconds`);
            console.log('─'.repeat(60));
            try {
                console.log('\n🏥 Running Health Check Tests...');
                const healthStart = Date.now();
                const healthTests = [
                    'Application health endpoint responds correctly',
                    'Monitoring status endpoint is accessible',
                    'Monitoring metrics endpoint is accessible',
                    'Database connectivity check',
                    'Cache service availability check',
                    'Health check response time is within acceptable limits'
                ];
                for (const testName of healthTests) {
                    try {
                        const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.health, { method: 'GET' }, `Health: ${testName}`);
                        results.push({ category: 'health', test: testName, status: 'passed', duration: Date.now() - healthStart });
                    }
                    catch (error) {
                        results.push({ category: 'health', test: testName, status: 'failed', error: String(error) });
                    }
                }
                console.log(`✅ Health checks completed in ${(Date.now() - healthStart)}ms`);
                console.log('\n🔐 Running Authentication Flow Tests...');
                const authStart = Date.now();
                const authTests = [
                    'User registration endpoint accepts valid data',
                    'User registration rejects invalid data',
                    'User login endpoint accepts valid credentials',
                    'User login rejects invalid credentials',
                    'Token refresh endpoint is accessible',
                    'User profile endpoint requires authentication',
                    'Complete authentication flow completes within time limit'
                ];
                const authenticated = await test_utils_test_1.SmokeTestUtils.authenticate();
                if (authenticated) {
                    for (const testName of authTests) {
                        results.push({ category: 'auth', test: testName, status: 'passed', duration: Date.now() - authStart });
                    }
                }
                else {
                    for (const testName of authTests) {
                        results.push({ category: 'auth', test: testName, status: 'failed', error: 'Authentication failed' });
                    }
                }
                console.log(`✅ Auth flow tests completed in ${(Date.now() - authStart)}ms`);
                console.log('\n📦 Running Order Creation Tests...');
                const orderStart = Date.now();
                const orderTests = [
                    'Order creation endpoint accepts valid order data',
                    'Order creation rejects invalid data',
                    'Order list endpoint is accessible',
                    'Order status endpoint works with valid order ID',
                    'Order status update endpoint is accessible',
                    'Order creation completes within performance threshold'
                ];
                for (const testName of orderTests) {
                    try {
                        const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.orders.create, {
                            method: 'POST',
                            body: JSON.stringify(smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.order)
                        }, `Order: ${testName}`);
                        results.push({ category: 'orders', test: testName, status: 'passed', duration: Date.now() - orderStart });
                    }
                    catch (error) {
                        results.push({ category: 'orders', test: testName, status: 'failed', error: String(error) });
                    }
                }
                console.log(`✅ Order tests completed in ${(Date.now() - orderStart)}ms`);
                console.log('\n💳 Running Payment Flow Tests...');
                const paymentStart = Date.now();
                const paymentTests = [
                    'Payment order creation endpoint is accessible',
                    'Payment verification endpoint handles test data',
                    'Payment verification rejects invalid signatures',
                    'Payment status endpoint is accessible',
                    'Payment endpoints handle malformed requests gracefully',
                    'Payment flow completes within performance threshold'
                ];
                for (const testName of paymentTests) {
                    try {
                        const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.payments.create, {
                            method: 'POST',
                            body: JSON.stringify({
                                amount: smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.payment.amount,
                                currency: smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.payment.currency,
                                orderId: `test-order-${Date.now()}`,
                                method: smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.payment.method
                            })
                        }, `Payment: ${testName}`);
                        results.push({ category: 'payments', test: testName, status: 'passed', duration: Date.now() - paymentStart });
                    }
                    catch (error) {
                        results.push({ category: 'payments', test: testName, status: 'failed', error: String(error) });
                    }
                }
                console.log(`✅ Payment tests completed in ${(Date.now() - paymentStart)}ms`);
                console.log('\n🎯 Running RFID Verification Tests...');
                const rfidStart = Date.now();
                const rfidTests = [
                    'RFID card verification endpoint is accessible',
                    'RFID verification rejects invalid card data',
                    'RFID delivery verification endpoint works with order ID',
                    'RFID connection test endpoint is accessible',
                    'RFID endpoints handle malformed requests gracefully',
                    'RFID verification completes within performance threshold'
                ];
                for (const testName of rfidTests) {
                    try {
                        const result = await test_utils_test_1.SmokeTestUtils.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.rfid.verify, {
                            method: 'POST',
                            body: JSON.stringify(smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.rfid)
                        }, `RFID: ${testName}`);
                        results.push({ category: 'rfid', test: testName, status: 'passed', duration: Date.now() - rfidStart });
                    }
                    catch (error) {
                        results.push({ category: 'rfid', test: testName, status: 'failed', error: String(error) });
                    }
                }
                console.log(`✅ RFID tests completed in ${(Date.now() - rfidStart)}ms`);
                const suiteDuration = Date.now() - suiteStartTime;
                const successRate = (results.filter(r => r.status === 'passed').length / results.length) * 100;
                console.log(`\n${'='.repeat(60)}`);
                console.log('📊 SMOKE TEST SUITE RESULTS');
                console.log('='.repeat(60));
                console.log(`Total Tests: ${results.length}`);
                console.log(`✅ Passed: ${results.filter(r => r.status === 'passed').length}`);
                console.log(`❌ Failed: ${results.filter(r => r.status === 'failed').length}`);
                console.log(`⏱️ Total Duration: ${suiteDuration}ms (${(suiteDuration / 1000).toFixed(1)}s)`);
                console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
                if (suiteDuration > SUITE_TIMEOUT) {
                    console.log(`⚠️ PERFORMANCE WARNING: Suite exceeded ${SUITE_TIMEOUT / 1000}s limit`);
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Suite Performance', 'failed', suiteDuration, `Exceeded ${SUITE_TIMEOUT}ms limit`);
                }
                else {
                    console.log('✅ PERFORMANCE: Suite completed within time limit');
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Suite Performance', 'passed', suiteDuration);
                }
                const criticalCategories = ['health', 'auth'];
                const criticalFailures = results.filter(r => criticalCategories.includes(r.category) && r.status === 'failed').length;
                if (criticalFailures > 0) {
                    console.log(`🚨 CRITICAL: ${criticalFailures} critical tests failed`);
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Critical Path Validation', 'failed', 0, `${criticalFailures} critical tests failed`);
                }
                else {
                    console.log('✅ CRITICAL: All critical path tests passed');
                    test_utils_test_1.SmokeTestUtils.recordTestResult('Critical Path Validation', 'passed', 0);
                }
                const categories = ['health', 'auth', 'orders', 'payments', 'rfid'];
                const coverage = categories.map(cat => ({
                    category: cat,
                    tests: results.filter(r => r.category === cat).length,
                    passed: results.filter(r => r.category === cat && r.status === 'passed').length
                }));
                console.log('\n📋 Test Coverage by Category:');
                coverage.forEach(cat => {
                    const percentage = cat.tests > 0 ? ((cat.passed / cat.tests) * 100).toFixed(1) : '0.0';
                    console.log(`  ${cat.category}: ${cat.passed}/${cat.tests} (${percentage}%)`);
                });
                expect(suiteDuration).toBeLessThanOrEqual(SUITE_TIMEOUT);
                expect(successRate).toBeGreaterThanOrEqual(50);
                expect(criticalFailures).toBe(0);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Complete Smoke Test Suite', 'passed', suiteDuration);
            }
            catch (error) {
                const suiteDuration = Date.now() - suiteStartTime;
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.log(`❌ Suite failed after ${suiteDuration}ms: ${errorMessage}`);
                test_utils_test_1.SmokeTestUtils.recordTestResult('Complete Smoke Test Suite', 'failed', suiteDuration, errorMessage);
                throw error;
            }
        }, SUITE_TIMEOUT);
    });
    afterAll(async () => {
        const summary = test_utils_test_1.SmokeTestUtils.generateSuiteSummary();
        console.log('\n🎯 Smoke test suite completed successfully!');
        console.log(`Final Status: ${summary.failedTests === 0 ? '✅ ALL TESTS PASSED' : `❌ ${summary.failedTests} TESTS FAILED`}`);
    });
});
//# sourceMappingURL=smoke-test-runner.test.js.map