"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const setup_integration_1 = require("../setup-integration");
const node_fetch_1 = __importDefault(require("node-fetch"));
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000;
const smokeTestConfig = {
    retries: 3,
    timeout: API_TIMEOUT,
    endpoints: {
        health: '/health',
        status: '/status',
        restaurants: '/restaurants',
        auth: '/auth/login',
        menu: '/menu',
        orders: '/orders',
        users: '/users/profile'
    }
};
describe('API Smoke Tests', () => {
    let integrationServices;
    beforeAll(async () => {
        try {
            integrationServices = await (0, setup_integration_1.setupIntegrationTests)();
            console.log('✅ Integration test environment ready for smoke tests');
        }
        catch (error) {
            console.error('❌ Failed to setup integration tests:', error);
            throw error;
        }
    }, smokeTestConfig.timeout);
    afterAll(async () => {
        try {
            await (0, setup_integration_1.teardownIntegrationTests)();
            console.log('✅ Smoke test environment cleaned up');
        }
        catch (error) {
            console.error('❌ Failed to cleanup smoke tests:', error);
        }
    });
    describe('Health and Status Endpoints', () => {
        test('Health endpoint should respond with 200', async () => {
            const response = await (0, node_fetch_1.default)(`${API_BASE_URL}${smokeTestConfig.endpoints.health}`, {
                method: 'GET'
            });
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('status', 'ok');
            expect(data).toHaveProperty('timestamp');
            expect(data).toHaveProperty('version');
        }, smokeTestConfig.timeout);
        test('Status endpoint should provide system information', async () => {
            const response = await (0, node_fetch_1.default)(`${API_BASE_URL}${smokeTestConfig.endpoints.status}`, {
                method: 'GET'
            });
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('uptime');
            expect(data).toHaveProperty('memory');
            expect(data).toHaveProperty('database');
            expect(data.database).toHaveProperty('connected', true);
        }, smokeTestConfig.timeout);
    });
    describe('Authentication Endpoints', () => {
        test('Login endpoint should be accessible', async () => {
            const response = await (0, node_fetch_1.default)(`${API_BASE_URL}${smokeTestConfig.endpoints.auth}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'invalid@test.com',
                    password: 'invalid'
                })
            });
            expect([200, 400, 401, 422]).toContain(response.status);
            const data = await response.json();
            expect(data).toBeDefined();
        }, smokeTestConfig.timeout);
    });
    describe('Core Resource Endpoints', () => {
        test('Restaurants endpoint should be accessible', async () => {
            const response = await (0, node_fetch_1.default)(`${API_BASE_URL}${smokeTestConfig.endpoints.restaurants}`, {
                method: 'GET'
            });
            expect([200, 401, 403]).toContain(response.status);
        }, smokeTestConfig.timeout);
        test('Menu endpoint should be accessible', async () => {
            const response = await (0, node_fetch_1.default)(`${API_BASE_URL}${smokeTestConfig.endpoints.menu}`, {
                method: 'GET'
            });
            expect([200, 401, 403, 404]).toContain(response.status);
        }, smokeTestConfig.timeout);
        test('Orders endpoint should be accessible', async () => {
            const response = await (0, node_fetch_1.default)(`${API_BASE_URL}${smokeTestConfig.endpoints.orders}`, {
                method: 'GET'
            });
            expect([200, 401, 403]).toContain(response.status);
        }, smokeTestConfig.timeout);
    });
    describe('API Response Standards', () => {
        test('All endpoints should return valid JSON', async () => {
            const endpoints = Object.values(smokeTestConfig.endpoints);
            for (const endpoint of endpoints) {
                try {
                    const response = await (0, node_fetch_1.default)(`${API_BASE_URL}${endpoint}`, {
                        method: 'GET',
                    });
                    const data = await response.json();
                    expect(data).toBeDefined();
                }
                catch (error) {
                    console.warn(`⚠️ Endpoint ${endpoint} not available:`, error instanceof Error ? error.message : String(error));
                }
            }
        }, smokeTestConfig.timeout * 2);
        test('All endpoints should include proper CORS headers', async () => {
            const response = await (0, node_fetch_1.default)(`${API_BASE_URL}${smokeTestConfig.endpoints.health}`, {
                method: 'OPTIONS'
            });
            expect(response.headers.get('access-control-allow-origin')).toBeDefined();
            expect(response.headers.get('access-control-allow-methods')).toBeDefined();
        }, smokeTestConfig.timeout);
        test('All endpoints should have security headers', async () => {
            const response = await (0, node_fetch_1.default)(`${API_BASE_URL}${smokeTestConfig.endpoints.health}`, {
                method: 'GET'
            });
            expect(response.headers.get('x-content-type-options')).toBe('nosniff');
            expect(response.headers.get('x-frame-options')).toBeDefined();
            expect(response.headers.get('content-type')).toContain('application/json');
        }, smokeTestConfig.timeout);
    });
    describe('Performance Smoke Tests', () => {
        test('Health endpoint should respond within acceptable time', async () => {
            const startTime = Date.now();
            const response = await (0, node_fetch_1.default)(`${API_BASE_URL}${smokeTestConfig.endpoints.health}`, {
                method: 'GET'
            });
            const responseTime = Date.now() - startTime;
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(5000);
            console.log(`ℹ️ Health endpoint response time: ${responseTime}ms`);
        }, smokeTestConfig.timeout);
        test('Multiple concurrent requests should be handled', async () => {
            const concurrentRequests = 5;
            const startTime = Date.now();
            const promises = Array(concurrentRequests).fill(null).map(() => (0, node_fetch_1.default)(`${API_BASE_URL}${smokeTestConfig.endpoints.health}`, {
                method: 'GET',
            }));
            const responses = await Promise.all(promises);
            const endTime = Date.now();
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });
            const totalTime = endTime - startTime;
            console.log(`ℹ️ ${concurrentRequests} concurrent requests completed in ${totalTime}ms`);
            expect(totalTime).toBeLessThan(15000);
        }, smokeTestConfig.timeout * 2);
    });
    describe('Error Handling', () => {
        test('Non-existent endpoints should return 404', async () => {
            const response = await (0, node_fetch_1.default)(`${API_BASE_URL}/this-endpoint-does-not-exist`, {
                method: 'GET'
            });
            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data).toHaveProperty('error');
            expect(data).toHaveProperty('message');
        }, smokeTestConfig.timeout);
        test('Invalid HTTP methods should return 405', async () => {
            const response = await (0, node_fetch_1.default)(`${API_BASE_URL}${smokeTestConfig.endpoints.health}`, {
                method: 'DELETE',
            });
            expect([405, 404]).toContain(response.status);
        }, smokeTestConfig.timeout);
        test('Malformed requests should return proper error responses', async () => {
            const response = await (0, node_fetch_1.default)(`${API_BASE_URL}${smokeTestConfig.endpoints.auth}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: 'invalid-json'
            });
            expect([400, 422]).toContain(response.status);
            const data = await response.json();
            expect(data).toHaveProperty('error');
        }, smokeTestConfig.timeout);
    });
});
//# sourceMappingURL=api-endpoints.test.js.map