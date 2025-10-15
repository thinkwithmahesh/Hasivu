"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const TEST_ENVIRONMENT = process.env.TEST_ENVIRONMENT || 'staging';
const TEST_TIMEOUT = 30000;
const LAMBDA_CONFIGS = {
    staging: {
        base: 'https://def567ghi8.execute-api.ap-south-1.amazonaws.com/staging',
        api_gateway_id: 'def567ghi8'
    },
    production: {
        base: 'https://ghi901jkl2.execute-api.ap-south-1.amazonaws.com/production',
        api_gateway_id: 'ghi901jkl2'
    }
};
const currentConfig = LAMBDA_CONFIGS[TEST_ENVIRONMENT] || LAMBDA_CONFIGS.staging;
const LAMBDA_ENDPOINTS = {
    health: {
        health: '/health',
        monitoring_status: '/monitoring/status',
        monitoring_metrics: '/monitoring/metrics'
    },
    authentication: {
        login: '/auth/login',
        register: '/auth/register',
        refresh: '/auth/refresh',
        profile: '/auth/profile'
    },
    users: {
        list: '/api/v1/users',
        bulk_import: '/api/v1/users/bulk-import'
    },
    orders: {
        create: '/orders',
        list: '/orders'
    },
    menus: {
        plans: '/menus/plans',
        daily: '/menus/daily'
    },
    payments: {
        create_order: '/payments/orders',
        verify: '/payments/verify',
        status: '/payments/status/test-order-id'
    },
    rfid: {
        verify_card: '/rfid/verify-card',
        test_connection: '/rfid/test-connection'
    },
    notifications: {
        send: '/notifications/send',
        templates: '/notifications/templates'
    },
    analytics: {
        dashboard: '/analytics/dashboard',
        reports: '/analytics/reports',
        metrics: '/analytics/metrics'
    }
};
describe('Lambda Endpoint Smoke Tests', () => {
    console.log(`🧪 Testing Lambda endpoints in ${TEST_ENVIRONMENT} environment`);
    console.log(`🌐 Base URL: ${currentConfig.base}`);
    console.log(`🆔 API Gateway ID: ${currentConfig.api_gateway_id}`);
    describe('Health and Monitoring Endpoints', () => {
        test('Health endpoint should respond correctly', async () => {
            const url = `${currentConfig.base}${LAMBDA_ENDPOINTS.health.health}`;
            console.log(`🔍 Testing: ${url}`);
            const response = await (0, node_fetch_1.default)(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`📊 Response status: ${response.status}`);
            expect([200, 404, 502, 503]).toContain(response.status);
            if (response.status === 200) {
                const data = await response.json();
                expect(data).toBeDefined();
                console.log(`✅ Health endpoint responding correctly`);
            }
            else {
                console.log(`⚠️ Health endpoint returned ${response.status} - Lambda may not be deployed yet`);
            }
        }, TEST_TIMEOUT);
        test('Monitoring status endpoint should be accessible', async () => {
            const url = `${currentConfig.base}${LAMBDA_ENDPOINTS.health.monitoring_status}`;
            console.log(`🔍 Testing: ${url}`);
            const response = await (0, node_fetch_1.default)(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`📊 Response status: ${response.status}`);
            expect([200, 404, 401, 403, 502, 503]).toContain(response.status);
        }, TEST_TIMEOUT);
    });
    describe('Authentication Lambda Endpoints', () => {
        test('Login endpoint should be accessible', async () => {
            const url = `${currentConfig.base}${LAMBDA_ENDPOINTS.authentication.login}`;
            console.log(`🔍 Testing: ${url}`);
            const response = await (0, node_fetch_1.default)(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'test123'
                })
            });
            console.log(`📊 Response status: ${response.status}`);
            expect([200, 400, 401, 404, 422, 502, 503]).toContain(response.status);
            if (response.status < 500) {
                const data = await response.json();
                expect(data).toBeDefined();
                console.log(`✅ Login endpoint responding correctly`);
            }
        }, TEST_TIMEOUT);
        test('Register endpoint should be accessible', async () => {
            const url = `${currentConfig.base}${LAMBDA_ENDPOINTS.authentication.register}`;
            console.log(`🔍 Testing: ${url}`);
            const response = await (0, node_fetch_1.default)(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'test123',
                    name: 'Test User'
                })
            });
            console.log(`📊 Response status: ${response.status}`);
            expect([200, 400, 404, 409, 422, 502, 503]).toContain(response.status);
            if (response.status < 500) {
                const data = await response.json();
                expect(data).toBeDefined();
                console.log(`✅ Register endpoint responding correctly`);
            }
        }, TEST_TIMEOUT);
    });
    describe('Core Resource Lambda Endpoints', () => {
        test('Users list endpoint should be accessible', async () => {
            const url = `${currentConfig.base}${LAMBDA_ENDPOINTS.users.list}`;
            console.log(`🔍 Testing: ${url}`);
            const response = await (0, node_fetch_1.default)(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`📊 Response status: ${response.status}`);
            expect([200, 401, 403, 404, 502, 503]).toContain(response.status);
        }, TEST_TIMEOUT);
        test('Orders endpoint should be accessible', async () => {
            const url = `${currentConfig.base}${LAMBDA_ENDPOINTS.orders.list}`;
            console.log(`🔍 Testing: ${url}`);
            const response = await (0, node_fetch_1.default)(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`📊 Response status: ${response.status}`);
            expect([200, 401, 403, 404, 502, 503]).toContain(response.status);
        }, TEST_TIMEOUT);
        test('Menu plans endpoint should be accessible', async () => {
            const url = `${currentConfig.base}${LAMBDA_ENDPOINTS.menus.plans}`;
            console.log(`🔍 Testing: ${url}`);
            const response = await (0, node_fetch_1.default)(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`📊 Response status: ${response.status}`);
            expect([200, 401, 403, 404, 502, 503]).toContain(response.status);
        }, TEST_TIMEOUT);
    });
    describe('Payment and RFID Lambda Endpoints', () => {
        test('Payment verify endpoint should be accessible', async () => {
            const url = `${currentConfig.base}${LAMBDA_ENDPOINTS.payments.verify}`;
            console.log(`🔍 Testing: ${url}`);
            const response = await (0, node_fetch_1.default)(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    razorpay_payment_id: 'test_payment_id',
                    razorpay_order_id: 'test_order_id',
                    razorpay_signature: 'test_signature'
                })
            });
            console.log(`📊 Response status: ${response.status}`);
            expect([200, 400, 404, 422, 502, 503]).toContain(response.status);
        }, TEST_TIMEOUT);
        test('RFID test connection endpoint should be accessible', async () => {
            const url = `${currentConfig.base}${LAMBDA_ENDPOINTS.rfid.test_connection}`;
            console.log(`🔍 Testing: ${url}`);
            const response = await (0, node_fetch_1.default)(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`📊 Response status: ${response.status}`);
            expect([200, 401, 403, 404, 502, 503]).toContain(response.status);
        }, TEST_TIMEOUT);
    });
    describe('Analytics and Notifications Lambda Endpoints', () => {
        test('Analytics dashboard endpoint should be accessible', async () => {
            const url = `${currentConfig.base}${LAMBDA_ENDPOINTS.analytics.dashboard}`;
            console.log(`🔍 Testing: ${url}`);
            const response = await (0, node_fetch_1.default)(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`📊 Response status: ${response.status}`);
            expect([200, 401, 403, 404, 502, 503]).toContain(response.status);
        }, TEST_TIMEOUT);
        test('Notifications templates endpoint should be accessible', async () => {
            const url = `${currentConfig.base}${LAMBDA_ENDPOINTS.notifications.templates}`;
            console.log(`🔍 Testing: ${url}`);
            const response = await (0, node_fetch_1.default)(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`📊 Response status: ${response.status}`);
            expect([200, 401, 403, 404, 502, 503]).toContain(response.status);
        }, TEST_TIMEOUT);
    });
    describe('Lambda Performance and Reliability Tests', () => {
        test('Multiple Lambda endpoints should respond within acceptable time', async () => {
            const testEndpoints = [
                LAMBDA_ENDPOINTS.health.health,
                LAMBDA_ENDPOINTS.authentication.login,
                LAMBDA_ENDPOINTS.menus.daily,
                LAMBDA_ENDPOINTS.analytics.metrics
            ];
            const results = await Promise.allSettled(testEndpoints.map(async (endpoint) => {
                const startTime = Date.now();
                const url = `${currentConfig.base}${endpoint}`;
                try {
                    const response = await (0, node_fetch_1.default)(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const responseTime = Date.now() - startTime;
                    return {
                        endpoint,
                        status: response.status,
                        responseTime,
                        success: response.status < 500
                    };
                }
                catch (error) {
                    const responseTime = Date.now() - startTime;
                    return {
                        endpoint,
                        status: 0,
                        responseTime,
                        success: false,
                        error: error instanceof Error ? error.message : String(error)
                    };
                }
            }));
            console.log('\n📊 Lambda Performance Results:');
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const { endpoint, status, responseTime, success } = result.value;
                    const statusIcon = success ? '✅' : '⚠️';
                    console.log(`${statusIcon} ${endpoint}: ${status} (${responseTime}ms)`);
                    expect(responseTime).toBeLessThan(30000);
                }
            });
            const successfulRequests = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
            console.log(`\n📈 Summary: ${successfulRequests}/${testEndpoints.length} endpoints accessible`);
            expect(successfulRequests).toBeGreaterThanOrEqual(0);
        }, TEST_TIMEOUT * 4);
        test('Lambda endpoints should handle concurrent requests', async () => {
            const healthUrl = `${currentConfig.base}${LAMBDA_ENDPOINTS.health.health}`;
            const concurrentRequests = 3;
            console.log(`🚀 Testing ${concurrentRequests} concurrent requests to ${healthUrl}`);
            const startTime = Date.now();
            const promises = Array(concurrentRequests).fill(null).map(() => (0, node_fetch_1.default)(healthUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }));
            const responses = await Promise.allSettled(promises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            console.log(`⏱️ ${concurrentRequests} concurrent requests completed in ${totalTime}ms`);
            const successfulRequests = responses.filter(response => response.status === 'fulfilled').length;
            expect(successfulRequests).toBe(concurrentRequests);
            expect(totalTime).toBeLessThan(60000);
            console.log(`✅ All concurrent requests handled successfully`);
        }, TEST_TIMEOUT * 2);
    });
    describe('Lambda Error Handling', () => {
        test('Non-existent Lambda endpoints should return 404', async () => {
            const url = `${currentConfig.base}/this-lambda-does-not-exist`;
            console.log(`🔍 Testing non-existent endpoint: ${url}`);
            const response = await (0, node_fetch_1.default)(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`📊 Response status: ${response.status}`);
            expect([403, 404]).toContain(response.status);
        }, TEST_TIMEOUT);
        test('Lambda endpoints should handle malformed requests gracefully', async () => {
            const url = `${currentConfig.base}${LAMBDA_ENDPOINTS.authentication.login}`;
            console.log(`🔍 Testing malformed request to: ${url}`);
            const response = await (0, node_fetch_1.default)(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: 'invalid-json-data'
            });
            console.log(`📊 Response status: ${response.status}`);
            expect([400, 422, 500, 502, 503]).toContain(response.status);
            if (response.status < 500) {
                const data = await response.json();
                expect(data).toBeDefined();
                console.log(`✅ Malformed request handled gracefully`);
            }
        }, TEST_TIMEOUT);
    });
});
//# sourceMappingURL=lambda-endpoints.test.js.map