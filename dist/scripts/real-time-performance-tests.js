"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const perf_hooks_1 = require("perf_hooks");
const ws_1 = __importDefault(require("ws"));
const ioredis_1 = __importDefault(require("ioredis"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const logger_1 = require("../src/utils/logger");
class RealTimePerformanceTestSuite {
    config;
    activeConnections = new Set();
    redis;
    responseTimes = [];
    testResults;
    constructor(config) {
        this.config = config;
        this.redis = new ioredis_1.default(config.redisUrl);
        this.testResults = {
            api: [],
            webSocket: {},
            redis: {},
            rfid: {},
            summary: {}
        };
    }
    async runComprehensiveTests() {
        console.log('🚀 Starting Real-time Performance Test Suite');
        console.log(`Environment: ${this.config.environment}`);
        console.log(`Concurrent Users: ${this.config.concurrentUsers}`);
        console.log(`Test Duration: ${this.config.testDuration}s`);
        console.log('============================================');
        try {
            await Promise.all([
                this.testAPIEndpoints(),
                this.testWebSocketPerformance(),
                this.testRedisPerformance(),
                this.testRFIDVerificationPerformance()
            ]);
            this.generatePerformanceReport();
            await this.saveTestResults();
        }
        catch (error) {
            logger_1.logger.error('Performance test suite failed', { error });
            throw error;
        }
        finally {
            await this.cleanup();
        }
    }
    async testAPIEndpoints() {
        console.log('🔍 Testing API Endpoint Performance...');
        const endpoints = [
            { path: '/health', method: 'GET', weight: 1 },
            { path: '/auth/login', method: 'POST', weight: 3 },
            { path: '/orders', method: 'GET', weight: 5 },
            { path: '/orders', method: 'POST', weight: 2 },
            { path: '/payments/verify', method: 'POST', weight: 4 },
            { path: '/rfid/verify-delivery', method: 'POST', weight: 3 },
            { path: '/users/profile', method: 'GET', weight: 2 },
            { path: '/menus/daily', method: 'GET', weight: 4 }
        ];
        for (const endpoint of endpoints) {
            const metrics = await this.testEndpoint(endpoint);
            this.testResults.api.push(metrics);
        }
    }
    async testEndpoint(endpoint) {
        const requestsToMake = Math.floor(this.config.concurrentUsers * endpoint.weight);
        const responseTimes = [];
        const statusCodes = {};
        let successfulRequests = 0;
        let failedRequests = 0;
        console.log(`  Testing ${endpoint.method} ${endpoint.path} (${requestsToMake} requests)`);
        const startTime = perf_hooks_1.performance.now();
        const requests = Array.from({ length: requestsToMake }, async (_, index) => {
            const delay = (index / requestsToMake) * this.config.rampUpTime * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            try {
                const requestStart = perf_hooks_1.performance.now();
                const response = await this.makeAPIRequest(endpoint.path, endpoint.method);
                const requestEnd = perf_hooks_1.performance.now();
                const responseTime = requestEnd - requestStart;
                responseTimes.push(responseTime);
                const statusCode = response.status;
                statusCodes[statusCode] = (statusCodes[statusCode] || 0) + 1;
                if (response.ok) {
                    successfulRequests++;
                }
                else {
                    failedRequests++;
                }
            }
            catch (error) {
                failedRequests++;
                statusCodes[500] = (statusCodes[500] || 0) + 1;
            }
        });
        await Promise.all(requests);
        const endTime = perf_hooks_1.performance.now();
        responseTimes.sort((a, b) => a - b);
        const totalTime = (endTime - startTime) / 1000;
        return {
            endpoint: endpoint.path,
            method: endpoint.method,
            startTime,
            endTime,
            totalRequests: requestsToMake,
            successfulRequests,
            failedRequests,
            averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
            p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
            p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
            minResponseTime: Math.min(...responseTimes),
            maxResponseTime: Math.max(...responseTimes),
            requestsPerSecond: requestsToMake / totalTime,
            errorRate: (failedRequests / requestsToMake) * 100,
            concurrentConnections: this.config.concurrentUsers,
            statusCodes
        };
    }
    async makeAPIRequest(path, method) {
        const url = `${this.config.baseUrl}${path}`;
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'HASIVU-Performance-Test/1.0'
        };
        if (path !== '/health') {
            headers['Authorization'] = 'Bearer mock-test-token';
        }
        let body;
        if (method === 'POST') {
            switch (path) {
                case '/auth/login':
                    body = JSON.stringify({
                        email: 'test@hasivu.com',
                        password: 'test123'
                    });
                    break;
                case '/orders':
                    body = JSON.stringify({
                        studentId: 'student-123',
                        items: [{ menuItemId: 'item-1', quantity: 1 }]
                    });
                    break;
                case '/payments/verify':
                    body = JSON.stringify({
                        paymentId: 'pay-123',
                        orderId: 'order-123'
                    });
                    break;
                case '/rfid/verify-delivery':
                    body = JSON.stringify({
                        cardNumber: 'CARD123456',
                        readerId: 'reader-1',
                        orderId: 'order-123'
                    });
                    break;
            }
        }
        return (0, node_fetch_1.default)(url, {
            method,
            headers,
            body,
            signal: AbortSignal.timeout(30000)
        });
    }
    async testWebSocketPerformance() {
        console.log('🌐 Testing WebSocket Performance...');
        const startTime = perf_hooks_1.performance.now();
        const connectionTimes = [];
        const latencies = [];
        let messagesExchanged = 0;
        let reconnections = 0;
        let successfulConnections = 0;
        let failedConnections = 0;
        const connectionPromises = Array.from({ length: this.config.concurrentUsers }, async (_, index) => {
            const delay = (index / this.config.concurrentUsers) * this.config.rampUpTime * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            try {
                const connectionStart = perf_hooks_1.performance.now();
                const ws = await this.createWebSocketConnection();
                const connectionEnd = perf_hooks_1.performance.now();
                connectionTimes.push(connectionEnd - connectionStart);
                successfulConnections++;
                const messageLatency = await this.testWebSocketMessages(ws);
                latencies.push(messageLatency);
                messagesExchanged += 10;
                setTimeout(() => {
                    ws.close();
                }, this.config.testDuration * 1000);
            }
            catch (error) {
                failedConnections++;
            }
        });
        await Promise.all(connectionPromises);
        const endTime = perf_hooks_1.performance.now();
        this.testResults.webSocket = {
            startTime,
            endTime,
            totalRequests: this.config.concurrentUsers,
            successfulRequests: successfulConnections,
            failedRequests: failedConnections,
            averageResponseTime: latencies.reduce((a, b) => a + b, 0) / latencies.length,
            p95ResponseTime: latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)] || 0,
            p99ResponseTime: latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.99)] || 0,
            minResponseTime: Math.min(...latencies),
            maxResponseTime: Math.max(...latencies),
            requestsPerSecond: messagesExchanged / (this.config.testDuration),
            errorRate: (failedConnections / this.config.concurrentUsers) * 100,
            concurrentConnections: successfulConnections,
            messagesExchanged,
            averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
            connectionEstablishmentTime: connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length,
            reconnections
        };
        console.log(`  WebSocket connections: ${successfulConnections}/${this.config.concurrentUsers}`);
        console.log(`  Average latency: ${this.testResults.webSocket.averageLatency.toFixed(2)}ms`);
    }
    async createWebSocketConnection() {
        return new Promise((resolve, reject) => {
            const ws = new ws_1.default(this.config.webSocketUrl);
            ws.on('open', () => {
                this.activeConnections.add(ws);
                resolve(ws);
            });
            ws.on('error', reject);
            ws.on('close', () => {
                this.activeConnections.delete(ws);
            });
            setTimeout(() => {
                if (ws.readyState !== ws_1.default.OPEN) {
                    reject(new Error('WebSocket connection timeout'));
                }
            }, 10000);
        });
    }
    async testWebSocketMessages(ws) {
        const latencies = [];
        for (let i = 0; i < 10; i++) {
            const latency = await this.sendWebSocketMessage(ws, {
                type: 'ping',
                timestamp: Date.now(),
                sequenceId: i
            });
            latencies.push(latency);
        }
        return latencies.reduce((a, b) => a + b, 0) / latencies.length;
    }
    async sendWebSocketMessage(ws, message) {
        return new Promise((resolve, reject) => {
            const startTime = perf_hooks_1.performance.now();
            ws.send(JSON.stringify(message));
            const responseHandler = (data) => {
                try {
                    const response = JSON.parse(data.toString());
                    if (response.sequenceId === message.sequenceId) {
                        const endTime = perf_hooks_1.performance.now();
                        ws.off('message', responseHandler);
                        resolve(endTime - startTime);
                    }
                }
                catch (error) {
                }
            };
            ws.on('message', responseHandler);
            setTimeout(() => {
                ws.off('message', responseHandler);
                reject(new Error('WebSocket message timeout'));
            }, 5000);
        });
    }
    async testRedisPerformance() {
        console.log('⚡ Testing Redis Caching Performance...');
        const startTime = perf_hooks_1.performance.now();
        const getTimes = [];
        const setTimes = [];
        let hits = 0;
        let misses = 0;
        let successfulOperations = 0;
        let failedOperations = 0;
        const testKeys = Array.from({ length: 1000 }, (_, i) => `test:key:${i}`);
        const testValue = JSON.stringify({
            id: 'test-data',
            timestamp: Date.now(),
            data: 'x'.repeat(1024)
        });
        try {
            console.log('  Populating cache...');
            for (let i = 0; i < testKeys.length; i++) {
                const setStart = perf_hooks_1.performance.now();
                await this.redis.set(testKeys[i], testValue, 'EX', 3600);
                const setEnd = perf_hooks_1.performance.now();
                setTimes.push(setEnd - setStart);
                successfulOperations++;
            }
            console.log('  Testing concurrent reads...');
            const readPromises = Array.from({ length: this.config.concurrentUsers * 10 }, async (_, index) => {
                const key = testKeys[index % testKeys.length];
                try {
                    const getStart = perf_hooks_1.performance.now();
                    const result = await this.redis.get(key);
                    const getEnd = perf_hooks_1.performance.now();
                    getTimes.push(getEnd - getStart);
                    if (result) {
                        hits++;
                    }
                    else {
                        misses++;
                    }
                    successfulOperations++;
                }
                catch (error) {
                    failedOperations++;
                }
            });
            await Promise.all(readPromises);
            const info = await this.redis.info('memory');
            const memoryUsage = this.parseRedisMemoryUsage(info);
            const keyspaceInfo = await this.redis.info('keyspace');
            const keyspaceSize = this.parseRedisKeyspaceSize(keyspaceInfo);
            const endTime = perf_hooks_1.performance.now();
            this.testResults.redis = {
                startTime,
                endTime,
                totalRequests: successfulOperations + failedOperations,
                successfulRequests: successfulOperations,
                failedRequests: failedOperations,
                averageResponseTime: getTimes.reduce((a, b) => a + b, 0) / getTimes.length,
                p95ResponseTime: getTimes.sort((a, b) => a - b)[Math.floor(getTimes.length * 0.95)] || 0,
                p99ResponseTime: getTimes.sort((a, b) => a - b)[Math.floor(getTimes.length * 0.99)] || 0,
                minResponseTime: Math.min(...getTimes),
                maxResponseTime: Math.max(...getTimes),
                requestsPerSecond: (successfulOperations + failedOperations) / ((endTime - startTime) / 1000),
                errorRate: (failedOperations / (successfulOperations + failedOperations)) * 100,
                concurrentConnections: this.config.concurrentUsers,
                cacheHitRatio: (hits / (hits + misses)) * 100,
                averageGetTime: getTimes.reduce((a, b) => a + b, 0) / getTimes.length,
                averageSetTime: setTimes.reduce((a, b) => a + b, 0) / setTimes.length,
                keyspaceSize,
                memoryUsage
            };
            console.log(`  Cache hit ratio: ${this.testResults.redis.cacheHitRatio.toFixed(2)}%`);
            console.log(`  Average GET time: ${this.testResults.redis.averageGetTime.toFixed(2)}ms`);
        }
        catch (error) {
            console.error('  Redis performance test failed:', error);
            throw error;
        }
    }
    async testRFIDVerificationPerformance() {
        console.log('📡 Testing RFID Verification Performance...');
        const startTime = perf_hooks_1.performance.now();
        const verificationTimes = [];
        let successfulVerifications = 0;
        let failedVerifications = 0;
        let cardRegistrations = 0;
        console.log('  Testing individual verifications...');
        const individualPromises = Array.from({ length: this.config.concurrentUsers * 5 }, async (_, index) => {
            try {
                const verificationStart = perf_hooks_1.performance.now();
                const response = await this.makeAPIRequest('/rfid/verify-delivery', 'POST');
                const verificationEnd = perf_hooks_1.performance.now();
                verificationTimes.push(verificationEnd - verificationStart);
                if (response.ok) {
                    successfulVerifications++;
                }
                else {
                    failedVerifications++;
                }
            }
            catch (error) {
                failedVerifications++;
            }
        });
        console.log('  Testing bulk verifications...');
        const bulkStart = perf_hooks_1.performance.now();
        const bulkPromises = Array.from({ length: 10 }, async () => {
            try {
                const response = await this.makeAPIRequest('/rfid/verify-bulk', 'POST');
                if (response.ok) {
                    successfulVerifications += 50;
                }
            }
            catch (error) {
                failedVerifications += 50;
            }
        });
        await Promise.all([...individualPromises, ...bulkPromises]);
        const bulkEnd = perf_hooks_1.performance.now();
        const endTime = perf_hooks_1.performance.now();
        this.testResults.rfid = {
            startTime,
            endTime,
            totalRequests: successfulVerifications + failedVerifications,
            successfulRequests: successfulVerifications,
            failedRequests: failedVerifications,
            averageResponseTime: verificationTimes.reduce((a, b) => a + b, 0) / verificationTimes.length,
            p95ResponseTime: verificationTimes.sort((a, b) => a - b)[Math.floor(verificationTimes.length * 0.95)] || 0,
            p99ResponseTime: verificationTimes.sort((a, b) => a - b)[Math.floor(verificationTimes.length * 0.99)] || 0,
            minResponseTime: Math.min(...verificationTimes),
            maxResponseTime: Math.max(...verificationTimes),
            requestsPerSecond: (successfulVerifications + failedVerifications) / ((endTime - startTime) / 1000),
            errorRate: (failedVerifications / (successfulVerifications + failedVerifications)) * 100,
            concurrentConnections: this.config.concurrentUsers,
            verificationsPerSecond: successfulVerifications / ((endTime - startTime) / 1000),
            bulkVerificationTime: bulkEnd - bulkStart,
            cardRegistrations,
            readerConnections: 5
        };
        console.log(`  Verifications per second: ${this.testResults.rfid.verificationsPerSecond.toFixed(2)}`);
        console.log(`  Bulk verification time: ${this.testResults.rfid.bulkVerificationTime.toFixed(2)}ms`);
    }
    generatePerformanceReport() {
        console.log('\n📊 PERFORMANCE TEST RESULTS');
        console.log('===========================');
        console.log('\n🔗 API ENDPOINTS:');
        for (const api of this.testResults.api) {
            const status = api.errorRate < 1 ? '✅' : api.errorRate < 5 ? '⚠️' : '❌';
            console.log(`   ${status} ${api.method} ${api.endpoint}`);
            console.log(`      Avg: ${api.averageResponseTime.toFixed(2)}ms | P95: ${api.p95ResponseTime.toFixed(2)}ms | Error: ${api.errorRate.toFixed(2)}%`);
        }
        console.log('\n🌐 WEBSOCKET:');
        const wsStatus = this.testResults.webSocket.errorRate < 1 ? '✅' : '❌';
        console.log(`   ${wsStatus} Connections: ${this.testResults.webSocket.successfulRequests}/${this.testResults.webSocket.totalRequests}`);
        console.log(`      Latency: ${this.testResults.webSocket.averageLatency?.toFixed(2)}ms | Messages: ${this.testResults.webSocket.messagesExchanged}`);
        console.log('\n⚡ REDIS CACHE:');
        const redisStatus = this.testResults.redis.cacheHitRatio > 90 ? '✅' : this.testResults.redis.cacheHitRatio > 70 ? '⚠️' : '❌';
        console.log(`   ${redisStatus} Hit Ratio: ${this.testResults.redis.cacheHitRatio?.toFixed(2)}%`);
        console.log(`      GET: ${this.testResults.redis.averageGetTime?.toFixed(2)}ms | SET: ${this.testResults.redis.averageSetTime?.toFixed(2)}ms`);
        console.log('\n📡 RFID VERIFICATION:');
        const rfidStatus = this.testResults.rfid.errorRate < 1 ? '✅' : '❌';
        console.log(`   ${rfidStatus} Verifications/sec: ${this.testResults.rfid.verificationsPerSecond?.toFixed(2)}`);
        console.log(`      Avg Time: ${this.testResults.rfid.averageResponseTime?.toFixed(2)}ms | Error: ${this.testResults.rfid.errorRate?.toFixed(2)}%`);
        const overallGrade = this.calculateOverallGrade();
        console.log(`\n🏆 OVERALL PERFORMANCE: ${overallGrade}`);
        this.generateRecommendations();
    }
    calculateOverallGrade() {
        let score = 100;
        const apiErrors = this.testResults.api.reduce((sum, api) => sum + api.errorRate, 0) / this.testResults.api.length;
        const apiAvgTime = this.testResults.api.reduce((sum, api) => sum + api.averageResponseTime, 0) / this.testResults.api.length;
        if (apiErrors > 5)
            score -= 30;
        else if (apiErrors > 1)
            score -= 15;
        if (apiAvgTime > 500)
            score -= 20;
        else if (apiAvgTime > 200)
            score -= 10;
        if (this.testResults.webSocket.errorRate > 5)
            score -= 20;
        if (this.testResults.webSocket.averageLatency > 100)
            score -= 10;
        if (this.testResults.redis.cacheHitRatio < 70)
            score -= 15;
        if (this.testResults.redis.averageGetTime > 10)
            score -= 10;
        if (this.testResults.rfid.errorRate > 5)
            score -= 20;
        if (this.testResults.rfid.verificationsPerSecond < 100)
            score -= 10;
        if (score >= 95)
            return 'A+ (Excellent)';
        if (score >= 85)
            return 'A (Very Good)';
        if (score >= 75)
            return 'B (Good)';
        if (score >= 65)
            return 'C (Fair)';
        return 'D (Needs Improvement)';
    }
    generateRecommendations() {
        console.log('\n💡 RECOMMENDATIONS:');
        const slowAPIs = this.testResults.api.filter(api => api.averageResponseTime > 200);
        if (slowAPIs.length > 0) {
            console.log(`   📝 Optimize slow API endpoints: ${slowAPIs.map(api => api.endpoint).join(', ')}`);
        }
        if (this.testResults.redis.cacheHitRatio < 90) {
            console.log('   📝 Improve cache strategy - current hit ratio below 90%');
        }
        if (this.testResults.webSocket.averageLatency > 50) {
            console.log('   📝 Optimize WebSocket latency - consider connection pooling');
        }
        if (this.testResults.rfid.verificationsPerSecond < 200) {
            console.log('   📝 Scale RFID verification capacity for peak load');
        }
    }
    async saveTestResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `performance-test-${this.config.environment}-${timestamp}.json`;
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            await fs.promises.writeFile(filename, JSON.stringify(this.testResults, null, 2));
            console.log(`\n📄 Test results saved to: ${filename}`);
        }
        catch (error) {
            console.error('Failed to save test results:', error);
        }
    }
    parseRedisMemoryUsage(info) {
        const match = info.match(/used_memory:(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }
    parseRedisKeyspaceSize(info) {
        const match = info.match(/db0:keys=(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }
    async cleanup() {
        console.log('\n🧹 Cleaning up test resources...');
        for (const ws of this.activeConnections) {
            ws.close();
        }
        this.redis.disconnect();
        console.log('✅ Cleanup completed');
    }
}
const configs = {
    development: {
        baseUrl: 'http://localhost:3000',
        webSocketUrl: 'ws://localhost:3000',
        redisUrl: 'redis://localhost:6379',
        concurrentUsers: 10,
        testDuration: 60,
        rampUpTime: 10,
        environment: 'development'
    },
    staging: {
        baseUrl: process.env.STAGING_API_URL || 'https://staging-api.hasivu.com',
        webSocketUrl: process.env.STAGING_WS_URL || 'wss://staging-api.hasivu.com',
        redisUrl: process.env.STAGING_REDIS_URL || 'redis://staging-redis:6379',
        concurrentUsers: 50,
        testDuration: 300,
        rampUpTime: 30,
        environment: 'staging'
    },
    production: {
        baseUrl: process.env.PRODUCTION_API_URL || 'https://api.hasivu.com',
        webSocketUrl: process.env.PRODUCTION_WS_URL || 'wss://api.hasivu.com',
        redisUrl: process.env.PRODUCTION_REDIS_URL || 'redis://production-redis:6379',
        concurrentUsers: 100,
        testDuration: 600,
        rampUpTime: 60,
        environment: 'production'
    }
};
async function main() {
    const environment = (process.env.TEST_ENVIRONMENT || 'development');
    const config = configs[environment];
    if (!config) {
        console.error(`Invalid environment: ${environment}`);
        process.exit(1);
    }
    const testSuite = new RealTimePerformanceTestSuite(config);
    await testSuite.runComprehensiveTests();
}
if (require.main === module) {
    main().catch(console.error);
}
exports.default = RealTimePerformanceTestSuite;
//# sourceMappingURL=real-time-performance-tests.js.map