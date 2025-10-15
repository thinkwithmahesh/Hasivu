"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERFORMANCE_CONFIG = exports.performanceHelpers = void 0;
const globals_1 = require("@jest/globals");
const dotenv_1 = require("dotenv");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const perf_hooks_1 = require("perf_hooks");
(0, dotenv_1.config)({ path: '.env.test' });
const PERFORMANCE_CONFIG = {
    targetUrl: process.env.PERFORMANCE_TEST_URL || 'http://localhost:3001',
    apiKey: process.env.PERFORMANCE_API_KEY || 'test-api-key',
    testTimeout: 600000,
    thresholds: {
        responseTime: {
            api: 200,
            database: 100,
            cache: 50,
            fileUpload: 5000,
            auth: 300
        },
        throughput: {
            minRps: 100,
            targetRps: 500,
            peakRps: 1000
        },
        resources: {
            maxMemoryMB: 512,
            maxCpuPercent: 80,
            maxConnections: 1000
        },
        availability: {
            uptime: 99.9,
            errorRate: 0.1
        }
    },
    loadTest: {
        rampUpUsers: [10, 50, 100, 250, 500, 750, 1000],
        testDuration: 300,
        cooldownTime: 60
    },
    reports: {
        outputDir: './test-results/performance',
        summaryReport: 'performance-summary.json',
        detailedReport: 'performance-detailed.json',
        loadTestReport: 'load-test-results.json',
        stressTestReport: 'stress-test-results.json'
    }
};
exports.PERFORMANCE_CONFIG = PERFORMANCE_CONFIG;
(0, globals_1.beforeAll)(async () => {
    console.log('⚡ Setting up performance test environment...');
    global.performanceTestState = {
        metrics: [],
        loadTestResults: [],
        currentTestStartTime: 0,
        baselineMetrics: new Map(),
        performanceAlerts: []
    };
    try {
        await promises_1.default.mkdir(PERFORMANCE_CONFIG.reports.outputDir, { recursive: true });
        console.log('✅ Performance reports directory created');
    }
    catch (error) {
        console.error('❌ Failed to create reports directory:', error);
    }
    await establishBaseline();
    console.log('✅ Performance test environment setup complete');
}, 60000);
(0, globals_1.beforeEach)(async () => {
    global.performanceTestState.currentTestStartTime = perf_hooks_1.performance.now();
    global.performanceTestState.performanceAlerts = [];
});
(0, globals_1.afterEach)(async () => {
    const testName = expect.getState().currentTestName || 'unknown';
    await generatePerformanceReport(testName);
});
(0, globals_1.afterAll)(async () => {
    console.log('📊 Generating comprehensive performance report...');
    try {
        await generateFinalPerformanceReport();
        console.log('✅ Performance testing completed');
    }
    catch (error) {
        console.error('❌ Failed to generate performance report:', error);
    }
});
exports.performanceHelpers = {
    async measureResponseTime(endpoint, method = 'GET', body) {
        const startTime = perf_hooks_1.performance.now();
        try {
            const response = await fetch(`${PERFORMANCE_CONFIG.targetUrl}${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${PERFORMANCE_CONFIG.apiKey}`
                },
                body: body ? JSON.stringify(body) : undefined
            });
            const endTime = perf_hooks_1.performance.now();
            const responseTime = endTime - startTime;
            const metric = {
                responseTime,
                throughput: 1,
                errorRate: response.ok ? 0 : 1,
                memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
                cpuUsage: 0,
                timestamp: Date.now(),
                endpoint,
                testType: 'response-time',
                userLoad: 1
            };
            global.performanceTestState.metrics.push(metric);
            await checkPerformanceThreshold(endpoint, responseTime);
            return {
                responseTime,
                success: response.ok,
                status: response.status,
                metric
            };
        }
        catch (error) {
            const endTime = perf_hooks_1.performance.now();
            const responseTime = endTime - startTime;
            const metric = {
                responseTime,
                throughput: 0,
                errorRate: 1,
                memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
                cpuUsage: 0,
                timestamp: Date.now(),
                endpoint,
                testType: 'response-time',
                userLoad: 1
            };
            global.performanceTestState.metrics.push(metric);
            throw error;
        }
    },
    async performLoadTest(endpoint, userCounts = PERFORMANCE_CONFIG.loadTest.rampUpUsers) {
        const results = [];
        for (const userCount of userCounts) {
            console.log(`🔄 Running load test with ${userCount} concurrent users...`);
            const startTime = perf_hooks_1.performance.now();
            const promises = [];
            let successCount = 0;
            let errorCount = 0;
            const responseTimes = [];
            for (let i = 0; i < userCount; i++) {
                const promise = (async () => {
                    const requestStart = perf_hooks_1.performance.now();
                    try {
                        const response = await fetch(`${PERFORMANCE_CONFIG.targetUrl}${endpoint}`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${PERFORMANCE_CONFIG.apiKey}`
                            }
                        });
                        const requestEnd = perf_hooks_1.performance.now();
                        const responseTime = requestEnd - requestStart;
                        responseTimes.push(responseTime);
                        if (response.ok) {
                            successCount++;
                        }
                        else {
                            errorCount++;
                        }
                    }
                    catch (error) {
                        const requestEnd = perf_hooks_1.performance.now();
                        const responseTime = requestEnd - requestStart;
                        responseTimes.push(responseTime);
                        errorCount++;
                    }
                })();
                promises.push(promise);
                if (i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
            await Promise.all(promises);
            const endTime = perf_hooks_1.performance.now();
            const duration = endTime - startTime;
            responseTimes.sort((a, b) => a - b);
            const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
            const p95Index = Math.floor(responseTimes.length * 0.95);
            const p99Index = Math.floor(responseTimes.length * 0.99);
            const result = {
                userCount,
                duration,
                totalRequests: userCount,
                successfulRequests: successCount,
                failedRequests: errorCount,
                averageResponseTime,
                p95ResponseTime: responseTimes[p95Index] || 0,
                p99ResponseTime: responseTimes[p99Index] || 0,
                requestsPerSecond: (userCount / duration) * 1000,
                errorRate: (errorCount / userCount) * 100,
                memoryPeak: process.memoryUsage().heapUsed / 1024 / 1024,
                cpuPeak: 0
            };
            results.push(result);
            global.performanceTestState.loadTestResults.push(result);
            if (result.errorRate > 10) {
                console.log(`⚠️ Stopping load test due to high error rate: ${result.errorRate}%`);
                break;
            }
            if (userCounts.indexOf(userCount) < userCounts.length - 1) {
                console.log(`⏳ Cooling down for ${PERFORMANCE_CONFIG.loadTest.cooldownTime}s...`);
                await new Promise(resolve => setTimeout(resolve, PERFORMANCE_CONFIG.loadTest.cooldownTime * 1000));
            }
        }
        return results;
    },
    async performStressTest(endpoint, maxUsers = 2000, stepSize = 100) {
        console.log(`🔥 Starting stress test up to ${maxUsers} users...`);
        let currentUsers = stepSize;
        let breakingPoint = 0;
        const stressResults = [];
        while (currentUsers <= maxUsers) {
            console.log(`🔄 Stress testing with ${currentUsers} users...`);
            const results = await this.performLoadTest(endpoint, [currentUsers]);
            const result = results[0];
            stressResults.push(result);
            if (result.errorRate > 50 || result.averageResponseTime > 10000) {
                breakingPoint = currentUsers;
                console.log(`💥 Breaking point reached at ${currentUsers} users`);
                break;
            }
            currentUsers += stepSize;
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
        return {
            breakingPoint,
            maxStableUsers: breakingPoint > 0 ? breakingPoint - stepSize : currentUsers - stepSize,
            results: stressResults
        };
    },
    async testMemoryLeaks(endpoint, iterations = 1000) {
        console.log(`🧠 Testing for memory leaks with ${iterations} iterations...`);
        const initialMemory = process.memoryUsage().heapUsed;
        const memoryReadings = [];
        for (let i = 0; i < iterations; i++) {
            await fetch(`${PERFORMANCE_CONFIG.targetUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${PERFORMANCE_CONFIG.apiKey}`
                }
            });
            if (i % 100 === 0) {
                const currentMemory = process.memoryUsage().heapUsed;
                memoryReadings.push(currentMemory);
                if (global.gc) {
                    global.gc();
                }
            }
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
        const hasMemoryLeak = memoryIncreasePercent > 50;
        if (hasMemoryLeak) {
            global.performanceTestState.performanceAlerts.push(`Potential memory leak detected on ${endpoint}: ${memoryIncreasePercent.toFixed(2)}% increase`);
        }
        return {
            initialMemory: initialMemory / 1024 / 1024,
            finalMemory: finalMemory / 1024 / 1024,
            memoryIncrease: memoryIncrease / 1024 / 1024,
            memoryIncreasePercent,
            hasMemoryLeak,
            memoryReadings: memoryReadings.map(m => m / 1024 / 1024)
        };
    },
    async testDatabasePerformance(queries) {
        const results = [];
        for (const { name, query } of queries) {
            const startTime = perf_hooks_1.performance.now();
            try {
                const response = await fetch(`${PERFORMANCE_CONFIG.targetUrl}/api/test/db-query`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${PERFORMANCE_CONFIG.apiKey}`
                    },
                    body: JSON.stringify({ query })
                });
                const endTime = perf_hooks_1.performance.now();
                const executionTime = endTime - startTime;
                const result = await response.json();
                results.push({
                    name,
                    executionTime,
                    success: response.ok,
                    recordCount: result.recordCount || 0,
                    error: response.ok ? null : result.error
                });
                if (executionTime > PERFORMANCE_CONFIG.thresholds.responseTime.database) {
                    global.performanceTestState.performanceAlerts.push(`Slow database query '${name}': ${executionTime.toFixed(2)}ms (threshold: ${PERFORMANCE_CONFIG.thresholds.responseTime.database}ms)`);
                }
            }
            catch (error) {
                const endTime = perf_hooks_1.performance.now();
                const executionTime = endTime - startTime;
                results.push({
                    name,
                    executionTime,
                    success: false,
                    recordCount: 0,
                    error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
                });
            }
        }
        return results;
    },
    async testCachePerformance(operations) {
        const results = [];
        for (const { key, value } of operations) {
            const setStartTime = perf_hooks_1.performance.now();
            try {
                await fetch(`${PERFORMANCE_CONFIG.targetUrl}/api/cache/${key}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${PERFORMANCE_CONFIG.apiKey}`
                    },
                    body: JSON.stringify({ value })
                });
                const setEndTime = perf_hooks_1.performance.now();
                const setTime = setEndTime - setStartTime;
                const getStartTime = perf_hooks_1.performance.now();
                const getResponse = await fetch(`${PERFORMANCE_CONFIG.targetUrl}/api/cache/${key}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${PERFORMANCE_CONFIG.apiKey}`
                    }
                });
                const getEndTime = perf_hooks_1.performance.now();
                const getTime = getEndTime - getStartTime;
                results.push({
                    key,
                    setTime,
                    getTime,
                    setSuccess: true,
                    getSuccess: getResponse.ok,
                    cacheHit: getResponse.ok
                });
                if (setTime > PERFORMANCE_CONFIG.thresholds.responseTime.cache) {
                    global.performanceTestState.performanceAlerts.push(`Slow cache SET operation for '${key}': ${setTime.toFixed(2)}ms`);
                }
                if (getTime > PERFORMANCE_CONFIG.thresholds.responseTime.cache) {
                    global.performanceTestState.performanceAlerts.push(`Slow cache GET operation for '${key}': ${getTime.toFixed(2)}ms`);
                }
            }
            catch (error) {
                results.push({
                    key,
                    setTime: 0,
                    getTime: 0,
                    setSuccess: false,
                    getSuccess: false,
                    cacheHit: false,
                    error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
                });
            }
        }
        return results;
    }
};
async function establishBaseline() {
    console.log('📊 Establishing baseline performance metrics...');
    const baselineEndpoints = [
        '/api/health',
        '/api/auth/profile',
        '/api/menu/items',
        '/api/orders'
    ];
    for (const endpoint of baselineEndpoints) {
        try {
            const result = await exports.performanceHelpers.measureResponseTime(endpoint);
            global.performanceTestState.baselineMetrics.set(endpoint, result.metric);
            console.log(`✅ Baseline for ${endpoint}: ${result.responseTime.toFixed(2)}ms`);
        }
        catch (error) {
            console.log(`⚠️ Could not establish baseline for ${endpoint}: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`);
        }
    }
}
async function checkPerformanceThreshold(endpoint, responseTime) {
    let threshold = PERFORMANCE_CONFIG.thresholds.responseTime.api;
    if (endpoint.includes('/auth/')) {
        threshold = PERFORMANCE_CONFIG.thresholds.responseTime.auth;
    }
    else if (endpoint.includes('/upload/')) {
        threshold = PERFORMANCE_CONFIG.thresholds.responseTime.fileUpload;
    }
    else if (endpoint.includes('/db/') || endpoint.includes('/query/')) {
        threshold = PERFORMANCE_CONFIG.thresholds.responseTime.database;
    }
    if (responseTime > threshold) {
        global.performanceTestState.performanceAlerts.push(`Slow response on ${endpoint}: ${responseTime.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }
}
async function generatePerformanceReport(testName) {
    const testMetrics = global.performanceTestState.metrics.filter(m => m.timestamp >= global.performanceTestState.currentTestStartTime);
    const report = {
        testName,
        timestamp: new Date().toISOString(),
        metrics: testMetrics,
        alerts: global.performanceTestState.performanceAlerts,
        summary: {
            averageResponseTime: testMetrics.reduce((sum, m) => sum + m.responseTime, 0) / testMetrics.length || 0,
            maxResponseTime: Math.max(...testMetrics.map(m => m.responseTime), 0),
            totalRequests: testMetrics.length,
            errorRate: (testMetrics.filter(m => m.errorRate > 0).length / testMetrics.length) * 100 || 0
        }
    };
    try {
        const reportPath = path_1.default.join(PERFORMANCE_CONFIG.reports.outputDir, `${testName.replace(/[^a-zA-Z0-9]/g, '-')}-performance-report.json`);
        await promises_1.default.writeFile(reportPath, JSON.stringify(report, null, 2));
    }
    catch (error) {
        console.error('Failed to write performance report:', error);
    }
}
async function generateFinalPerformanceReport() {
    const allMetrics = global.performanceTestState.metrics;
    const allAlerts = global.performanceTestState.performanceAlerts;
    const { loadTestResults } = global.performanceTestState;
    const finalReport = {
        summary: {
            totalTests: allMetrics.length,
            averageResponseTime: allMetrics.reduce((sum, m) => sum + m.responseTime, 0) / allMetrics.length || 0,
            maxResponseTime: Math.max(...allMetrics.map(m => m.responseTime), 0),
            minResponseTime: Math.min(...allMetrics.map(m => m.responseTime), Infinity) || 0,
            totalAlerts: allAlerts.length,
            errorRate: (allMetrics.filter(m => m.errorRate > 0).length / allMetrics.length) * 100 || 0,
            passRate: ((allMetrics.length - allAlerts.length) / allMetrics.length) * 100 || 0
        },
        metrics: allMetrics,
        alerts: allAlerts,
        loadTestResults,
        thresholds: PERFORMANCE_CONFIG.thresholds,
        recommendations: generatePerformanceRecommendations(),
        timestamp: new Date().toISOString()
    };
    const detailedReportPath = path_1.default.join(PERFORMANCE_CONFIG.reports.outputDir, 'final-performance-report.json');
    await promises_1.default.writeFile(detailedReportPath, JSON.stringify(finalReport, null, 2));
    const summaryReport = {
        summary: finalReport.summary,
        recommendations: finalReport.recommendations,
        timestamp: finalReport.timestamp
    };
    const summaryReportPath = path_1.default.join(PERFORMANCE_CONFIG.reports.outputDir, 'performance-summary.json');
    await promises_1.default.writeFile(summaryReportPath, JSON.stringify(summaryReport, null, 2));
    console.log(`📊 Performance reports generated at: ${PERFORMANCE_CONFIG.reports.outputDir}`);
}
function generatePerformanceRecommendations() {
    const recommendations = [];
    const alerts = global.performanceTestState.performanceAlerts;
    if (alerts.some(alert => alert.includes('Slow response'))) {
        recommendations.push('Optimize slow API endpoints by implementing caching, database indexing, or code optimization');
    }
    if (alerts.some(alert => alert.includes('memory leak'))) {
        recommendations.push('Investigate and fix memory leaks to improve application stability');
    }
    if (alerts.some(alert => alert.includes('cache'))) {
        recommendations.push('Optimize cache configuration and implement cache warming strategies');
    }
    if (alerts.some(alert => alert.includes('database'))) {
        recommendations.push('Optimize database queries, add appropriate indexes, and consider connection pooling');
    }
    const { loadTestResults } = global.performanceTestState;
    if (loadTestResults.some(result => result.errorRate > 5)) {
        recommendations.push('Improve error handling and system stability under load');
    }
    if (loadTestResults.some(result => result.averageResponseTime > 1000)) {
        recommendations.push('Implement load balancing and horizontal scaling to handle higher traffic');
    }
    return recommendations;
}
//# sourceMappingURL=setup-performance.js.map