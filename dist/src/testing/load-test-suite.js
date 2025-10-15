"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTestSuite = exports.defaultLoadTestConfig = exports.LoadTestSuite = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../shared/utils/logger");
const environment_1 = require("../config/environment");
const perf_hooks_1 = require("perf_hooks");
const trace_events_1 = require("trace_events");
const http_1 = require("http");
const https_1 = require("https");
const logger = logger_1.LoggerService.getInstance();
class LoadTestSuite {
    static instance;
    client;
    config;
    endpoints = [];
    metrics = [];
    virtualUsers = new Map();
    testStartTime = 0;
    testEndTime = 0;
    activeRequests = 0;
    tracing;
    resourceMonitor = null;
    resourceMetrics = [];
    constructor(config) {
        this.config = config;
        this.initializeHttpClient();
        this.setupRequestTracking();
        this.initializeMonitoring();
    }
    static getInstance(config) {
        if (!LoadTestSuite.instance) {
            if (!config) {
                throw new Error('LoadTestSuite requires configuration on first initialization');
            }
            LoadTestSuite.instance = new LoadTestSuite(config);
        }
        return LoadTestSuite.instance;
    }
    initializeHttpClient() {
        this.client = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: 30000,
            maxRedirects: 3,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'HASIVU-Load-Test-Suite/1.0',
                'Accept': 'application/json'
            },
            httpAgent: http_1.globalAgent,
            httpsAgent: https_1.globalAgent
        });
        this.client.defaults.httpAgent.keepAlive = true;
        this.client.defaults.httpAgent.keepAliveMsecs = 30000;
        this.client.defaults.httpAgent.maxSockets = this.config.maxConcurrentUsers * 2;
        this.client.defaults.httpAgent.maxFreeSockets = this.config.maxConcurrentUsers;
    }
    setupRequestTracking() {
        this.client.interceptors.request.use((config) => {
            const startTime = perf_hooks_1.performance.now();
            config.startTime = startTime;
            this.activeRequests++;
            if (this.config.monitoring.enableRequestLogging) {
                logger.debug('Load Test Request Started', {
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    activeRequests: this.activeRequests
                });
            }
            return config;
        }, (error) => {
            this.activeRequests--;
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => {
            const endTime = perf_hooks_1.performance.now();
            const startTime = response.config.startTime;
            const responseTime = endTime - startTime;
            this.recordRequest({
                endpoint: response.config.url || '',
                method: response.config.method?.toUpperCase() || 'GET',
                startTime,
                endTime,
                responseTime,
                statusCode: response.status,
                success: true,
                dataTransferred: JSON.stringify(response.data).length,
                userId: response.config.userId || 0,
                retryCount: response.config.retryCount || 0
            });
            this.activeRequests--;
            return response;
        }, (error) => {
            const endTime = perf_hooks_1.performance.now();
            const startTime = error.config?.startTime || endTime;
            const responseTime = endTime - startTime;
            this.recordRequest({
                endpoint: error.config?.url || 'unknown',
                method: error.config?.method?.toUpperCase() || 'GET',
                startTime,
                endTime,
                responseTime,
                statusCode: error.response?.status || 0,
                success: false,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                dataTransferred: 0,
                userId: error.config?.userId || 0,
                retryCount: error.config?.retryCount || 0
            });
            this.activeRequests--;
            return Promise.reject(error);
        });
    }
    initializeMonitoring() {
        if (this.config.monitoring.enableTracing) {
            this.tracing = (0, trace_events_1.createTracing)({
                categories: ['node.perf', 'node.async_hooks', 'node.http']
            });
        }
        if (this.config.monitoring.enableResourceMonitoring) {
            this.startResourceMonitoring();
        }
    }
    startResourceMonitoring() {
        this.resourceMonitor = setInterval(() => {
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            this.resourceMetrics.push({
                timestamp: Date.now(),
                memory: {
                    rss: memUsage.rss / 1024 / 1024,
                    heapUsed: memUsage.heapUsed / 1024 / 1024,
                    heapTotal: memUsage.heapTotal / 1024 / 1024,
                    external: memUsage.external / 1024 / 1024
                },
                cpu: {
                    user: cpuUsage.user / 1000,
                    system: cpuUsage.system / 1000
                }
            });
        }, 1000);
    }
    stopResourceMonitoring() {
        if (this.resourceMonitor) {
            clearInterval(this.resourceMonitor);
            this.resourceMonitor = null;
        }
    }
    recordRequest(metric) {
        this.metrics.push(metric);
        const user = this.virtualUsers.get(metric.userId);
        if (user) {
            user.requestCount++;
            user.totalResponseTime += metric.responseTime;
            user.lastRequestTime = metric.endTime;
            if (!metric.success) {
                user.errorCount++;
            }
        }
    }
    addEndpoint(endpoint) {
        this.endpoints.push(endpoint);
        logger.debug('Added endpoint to load test suite', {
            name: endpoint.name,
            method: endpoint.method,
            path: endpoint.path,
            weight: endpoint.weight,
            priority: endpoint.priority
        });
    }
    addEndpoints(endpoints) {
        endpoints.forEach(endpoint => this.addEndpoint(endpoint));
    }
    async runLoadTest(testName) {
        if (this.endpoints.length === 0) {
            throw new Error('No endpoints configured for load testing');
        }
        this.testStartTime = Date.now();
        this.metrics = [];
        this.virtualUsers.clear();
        this.resourceMetrics = [];
        logger.info(`Starting load test: ${testName}`, {
            endpoints: this.endpoints.length,
            maxConcurrency: this.config.maxConcurrentUsers,
            duration: `${this.config.duration}s`,
            environment: this.config.environment,
            baseUrl: this.config.baseUrl
        });
        try {
            if (this.tracing) {
                this.tracing.enable();
            }
            if (this.config.warmup.enabled) {
                await this.runWarmup();
            }
            await this.executeLoadTest();
            await this.waitForCompletion();
            this.testEndTime = Date.now();
            if (this.tracing) {
                this.tracing.disable();
            }
            this.stopResourceMonitoring();
            const result = this.generateLoadTestResult(testName);
            logger.info(`Load test completed: ${testName}`, {
                duration: `${result.duration}ms`,
                totalRequests: result.overallMetrics.totalRequests,
                successRate: `${((result.overallMetrics.successfulRequests / result.overallMetrics.totalRequests) * 100).toFixed(2)}%`,
                averageResponseTime: `${result.overallMetrics.averageResponseTime}ms`,
                errorRate: `${result.overallMetrics.errorRate}%`,
                throughput: `${result.overallMetrics.throughput} req/s`,
                testStatus: result.testStatus
            });
            return result;
        }
        catch (error) {
            this.testEndTime = Date.now();
            if (this.tracing) {
                this.tracing.disable();
            }
            this.stopResourceMonitoring();
            logger.error(`Load test failed: ${testName}`, {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                duration: `${this.testEndTime - this.testStartTime}ms`,
                requestsCompleted: this.metrics.length
            });
            throw error;
        }
    }
    async runWarmup() {
        logger.info('Starting warmup phase', {
            duration: `${this.config.warmup.duration}s`,
            concurrency: this.config.warmup.concurrency
        });
        const warmupPromises = [];
        for (let i = 0; i < this.config.warmup.concurrency; i++) {
            warmupPromises.push(this.runVirtualUser(i, this.config.warmup.duration * 1000, true));
        }
        await Promise.all(warmupPromises);
        this.metrics = [];
        logger.info('Warmup phase completed');
    }
    async executeLoadTest() {
        const testDurationMs = this.config.duration * 1000;
        const rampUpTimeMs = this.config.rampUpTime * 1000;
        const userPromises = [];
        for (let i = 0; i < this.config.maxConcurrentUsers; i++) {
            const startDelay = (i / this.config.maxConcurrentUsers) * rampUpTimeMs;
            const userDuration = testDurationMs - startDelay;
            const user = {
                id: i,
                active: true,
                requestCount: 0,
                errorCount: 0,
                totalResponseTime: 0,
                lastRequestTime: 0
            };
            this.virtualUsers.set(i, user);
            const userPromise = new Promise((resolve) => {
                setTimeout(async () => {
                    await this.runVirtualUser(i, userDuration);
                    resolve();
                }, startDelay);
            });
            userPromises.push(userPromise);
            if ((i + 1) % 10 === 0) {
                logger.debug(`Ramped up to ${i + 1} concurrent users`);
            }
        }
        await Promise.all(userPromises);
    }
    async runVirtualUser(userId, durationMs, isWarmup = false) {
        const endTime = Date.now() + durationMs;
        const user = this.virtualUsers.get(userId);
        if (!user && !isWarmup) {
            logger.warn(`Virtual user ${userId} not found`);
            return;
        }
        while (Date.now() < endTime) {
            try {
                const endpoint = this.selectEndpoint();
                if (!endpoint)
                    continue;
                const requestConfig = {
                    method: endpoint.method,
                    url: endpoint.path,
                    data: endpoint.payload,
                    headers: { ...endpoint.headers },
                    timeout: endpoint.timeout,
                    maxRedirects: 3
                };
                if (endpoint.authentication) {
                    this.addAuthentication(requestConfig, endpoint.authentication);
                }
                requestConfig.userId = userId;
                requestConfig.retryCount = 0;
                if (user && !isWarmup) {
                    user.currentEndpoint = endpoint.name;
                }
                await this.executeRequestWithRetry(requestConfig, endpoint);
                if (this.config.requestDelay > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.config.requestDelay));
                }
            }
            catch (error) {
                if (!isWarmup) {
                    logger.debug(`Virtual user ${userId} request failed`, {
                        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                        endpoint: user?.currentEndpoint
                    });
                }
            }
        }
        if (user && !isWarmup) {
            user.active = false;
        }
    }
    selectEndpoint() {
        if (this.endpoints.length === 0)
            return null;
        const totalWeight = this.endpoints.reduce((sum, ep) => sum + ep.weight, 0);
        const random = Math.random() * totalWeight;
        let currentWeight = 0;
        for (const endpoint of this.endpoints) {
            currentWeight += endpoint.weight;
            if (random <= currentWeight) {
                return endpoint;
            }
        }
        return this.endpoints[0];
    }
    addAuthentication(config, auth) {
        switch (auth.type) {
            case 'bearer':
                if (auth.token) {
                    config.headers = { ...config.headers, Authorization: `Bearer ${auth.token}` };
                }
                break;
            case 'basic':
                if (auth.username && auth.password) {
                    const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
                    config.headers = { ...config.headers, Authorization: `Basic ${credentials}` };
                }
                break;
            case 'api-key':
                if (auth.apiKey) {
                    config.headers = { ...config.headers, 'X-API-Key': auth.apiKey };
                }
                break;
        }
    }
    async executeRequestWithRetry(config, endpoint) {
        let lastError;
        for (let attempt = 0; attempt <= this.config.retryConfig.maxRetries; attempt++) {
            try {
                config.retryCount = attempt;
                const response = await this.client.request(config);
                if (!endpoint.expectedStatus.includes(response.status)) {
                    throw new Error(`Unexpected status code: ${response.status}`);
                }
                if (endpoint.validation?.customValidator && !endpoint.validation.customValidator(response)) {
                    throw new Error('Custom validation failed');
                }
                return response;
            }
            catch (error) {
                lastError = error;
                if (attempt < this.config.retryConfig.maxRetries) {
                    const delay = this.config.retryConfig.exponentialBackoff
                        ? this.config.retryConfig.retryDelay * Math.pow(2, attempt)
                        : this.config.retryConfig.retryDelay;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }
    async waitForCompletion(maxWaitMs = 30000) {
        const startWait = Date.now();
        while (this.activeRequests > 0 && (Date.now() - startWait) < maxWaitMs) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (this.activeRequests > 0) {
            logger.warn(`${this.activeRequests} requests still active after ${maxWaitMs}ms timeout`);
        }
    }
    generateLoadTestResult(testName) {
        const overallMetrics = this.calculateOverallMetrics();
        const endpointMetrics = this.calculateEndpointMetrics();
        const performanceTargets = this.evaluatePerformanceTargets(overallMetrics);
        const bottlenecks = this.identifyBottlenecks(overallMetrics, endpointMetrics);
        const recommendations = this.generateRecommendations(overallMetrics, bottlenecks);
        const resourceMetrics = this.calculateResourceMetrics();
        let testStatus = 'passed';
        if (!performanceTargets.responseTime.passed ||
            !performanceTargets.errorRate.passed ||
            !performanceTargets.throughput.passed ||
            !performanceTargets.p95ResponseTime.passed ||
            !performanceTargets.p99ResponseTime.passed) {
            testStatus = 'failed';
        }
        else if (bottlenecks.some(b => b.severity === 'high' || b.severity === 'critical')) {
            testStatus = 'warning';
        }
        return {
            testName,
            startTime: this.testStartTime,
            endTime: this.testEndTime,
            duration: this.testEndTime - this.testStartTime,
            environment: this.config.environment,
            configuration: this.config,
            overallMetrics,
            endpointMetrics,
            metrics: overallMetrics,
            performanceTargets,
            recommendations,
            bottlenecks,
            resourceMetrics,
            testStatus
        };
    }
    calculateOverallMetrics() {
        const responseTimes = this.metrics.map(m => m.responseTime);
        const successfulRequests = this.metrics.filter(m => m.success);
        const failedRequests = this.metrics.filter(m => !m.success);
        const totalDataTransferred = this.metrics.reduce((sum, m) => sum + m.dataTransferred, 0);
        const sortedResponseTimes = responseTimes.slice().sort((a, b) => a - b);
        const p50 = this.calculatePercentile(sortedResponseTimes, 50);
        const p95 = this.calculatePercentile(sortedResponseTimes, 95);
        const p99 = this.calculatePercentile(sortedResponseTimes, 99);
        const testDurationSeconds = (this.testEndTime - this.testStartTime) / 1000;
        const throughput = this.metrics.length / testDurationSeconds;
        const resourceUtilization = {
            memoryUsage: this.resourceMetrics.length > 0
                ? this.resourceMetrics.reduce((sum, m) => sum + m.memory.heapUsed, 0) / this.resourceMetrics.length
                : 0,
            cpuUsage: this.resourceMetrics.length > 0
                ? this.resourceMetrics.reduce((sum, m) => sum + (m.cpu.user + m.cpu.system), 0) / this.resourceMetrics.length
                : 0,
            gcMetrics: {
                collections: 0,
                totalTime: 0,
                averageTime: 0
            }
        };
        return {
            totalRequests: this.metrics.length,
            successfulRequests: successfulRequests.length,
            failedRequests: failedRequests.length,
            averageResponseTime: responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length || 0,
            minResponseTime: Math.min(...responseTimes) || 0,
            maxResponseTime: Math.max(...responseTimes) || 0,
            p50ResponseTime: p50,
            p95ResponseTime: p95,
            p99ResponseTime: p99,
            throughput,
            errorRate: (failedRequests.length / this.metrics.length) * 100 || 0,
            concurrentUsers: this.virtualUsers.size,
            totalDataTransferred,
            averageDataPerRequest: totalDataTransferred / this.metrics.length || 0,
            requestsPerSecond: this.calculateRequestsPerSecond(),
            responseTimesOverTime: this.calculateResponseTimesOverTime(),
            errorRatesOverTime: this.calculateErrorRatesOverTime(),
            resourceUtilization
        };
    }
    calculateEndpointMetrics() {
        const endpointMetrics = new Map();
        const metricsByEndpoint = this.metrics.reduce((acc, metric) => {
            const key = `${metric.method} ${metric.endpoint}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(metric);
            return acc;
        }, {});
        Object.entries(metricsByEndpoint).forEach(([key, metrics]) => {
            const responseTimes = metrics.map(m => m.responseTime);
            const successfulRequests = metrics.filter(m => m.success);
            const failedRequests = metrics.filter(m => !m.success);
            const totalDataTransferred = metrics.reduce((sum, m) => sum + m.dataTransferred, 0);
            const sortedResponseTimes = responseTimes.slice().sort((a, b) => a - b);
            const p50 = this.calculatePercentile(sortedResponseTimes, 50);
            const p95 = this.calculatePercentile(sortedResponseTimes, 95);
            const p99 = this.calculatePercentile(sortedResponseTimes, 99);
            const testDurationSeconds = (this.testEndTime - this.testStartTime) / 1000;
            const throughput = metrics.length / testDurationSeconds;
            const statusCodeDistribution = metrics.reduce((acc, m) => {
                acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
                return acc;
            }, {});
            const errorTypes = failedRequests.reduce((acc, m) => {
                const errorType = m.error || 'Unknown Error';
                acc[errorType] = (acc[errorType] || 0) + 1;
                return acc;
            }, {});
            const endpointMetric = {
                endpoint: key.split(' ')[1],
                method: key.split(' ')[0],
                totalRequests: metrics.length,
                successfulRequests: successfulRequests.length,
                failedRequests: failedRequests.length,
                averageResponseTime: responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length || 0,
                minResponseTime: Math.min(...responseTimes) || 0,
                maxResponseTime: Math.max(...responseTimes) || 0,
                p50ResponseTime: p50,
                p95ResponseTime: p95,
                p99ResponseTime: p99,
                throughput,
                errorRate: (failedRequests.length / metrics.length) * 100 || 0,
                successRate: (successfulRequests.length / metrics.length) * 100 || 0,
                concurrentUsers: this.virtualUsers.size,
                totalDataTransferred,
                averageDataPerRequest: totalDataTransferred / metrics.length || 0,
                averagePayloadSize: totalDataTransferred / metrics.length || 0,
                requestsPerSecond: [],
                responseTimesOverTime: [],
                errorRatesOverTime: [],
                statusCodeDistribution,
                errorTypes,
                resourceUtilization: {
                    memoryUsage: 0,
                    cpuUsage: 0,
                    gcMetrics: {
                        collections: 0,
                        totalTime: 0,
                        averageTime: 0
                    }
                }
            };
            endpointMetrics.set(key, endpointMetric);
        });
        return endpointMetrics;
    }
    calculatePercentile(sortedArray, percentile) {
        if (sortedArray.length === 0)
            return 0;
        const index = (percentile / 100) * (sortedArray.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;
        if (upper >= sortedArray.length)
            return sortedArray[sortedArray.length - 1];
        return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
    }
    calculateRequestsPerSecond() {
        const buckets = new Map();
        const bucketSizeMs = 1000;
        this.metrics.forEach(metric => {
            const bucket = Math.floor(metric.startTime / bucketSizeMs) * bucketSizeMs;
            buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
        });
        return Array.from(buckets.values());
    }
    calculateResponseTimesOverTime() {
        const buckets = new Map();
        const bucketSizeMs = 5000;
        this.metrics.forEach(metric => {
            const bucket = Math.floor(metric.startTime / bucketSizeMs) * bucketSizeMs;
            if (!buckets.has(bucket)) {
                buckets.set(bucket, []);
            }
            buckets.get(bucket).push(metric.responseTime);
        });
        return Array.from(buckets.values()).map(times => times.reduce((sum, time) => sum + time, 0) / times.length);
    }
    calculateErrorRatesOverTime() {
        const buckets = new Map();
        const bucketSizeMs = 5000;
        this.metrics.forEach(metric => {
            const bucket = Math.floor(metric.startTime / bucketSizeMs) * bucketSizeMs;
            if (!buckets.has(bucket)) {
                buckets.set(bucket, { total: 0, errors: 0 });
            }
            const bucketData = buckets.get(bucket);
            bucketData.total++;
            if (!metric.success) {
                bucketData.errors++;
            }
        });
        return Array.from(buckets.values()).map(bucket => (bucket.errors / bucket.total) * 100 || 0);
    }
    evaluatePerformanceTargets(metrics) {
        return {
            responseTime: {
                target: this.config.targets.responseTime,
                actual: metrics.averageResponseTime,
                passed: metrics.averageResponseTime <= this.config.targets.responseTime
            },
            errorRate: {
                target: this.config.targets.errorRate,
                actual: metrics.errorRate,
                passed: metrics.errorRate <= this.config.targets.errorRate
            },
            throughput: {
                target: this.config.targets.throughput,
                actual: metrics.throughput,
                passed: metrics.throughput >= this.config.targets.throughput
            },
            p95ResponseTime: {
                target: this.config.targets.p95ResponseTime,
                actual: metrics.p95ResponseTime,
                passed: metrics.p95ResponseTime <= this.config.targets.p95ResponseTime
            },
            p99ResponseTime: {
                target: this.config.targets.p99ResponseTime,
                actual: metrics.p99ResponseTime,
                passed: metrics.p99ResponseTime <= this.config.targets.p99ResponseTime
            }
        };
    }
    identifyBottlenecks(metrics, endpointMetrics) {
        const bottlenecks = [];
        if (metrics.averageResponseTime > this.config.targets.responseTime) {
            bottlenecks.push({
                type: 'response-time',
                severity: metrics.averageResponseTime > this.config.targets.responseTime * 2 ? 'critical' : 'high',
                description: `Average response time (${metrics.averageResponseTime.toFixed(2)}ms) exceeds target (${this.config.targets.responseTime}ms)`,
                affectedEndpoints: [],
                suggestedFixes: [
                    'Optimize database queries and add proper indexing',
                    'Implement caching for frequently accessed data',
                    'Consider horizontal scaling or load balancing',
                    'Profile application code for performance bottlenecks'
                ]
            });
        }
        if (metrics.p95ResponseTime > this.config.targets.p95ResponseTime) {
            bottlenecks.push({
                type: 'response-time',
                severity: 'medium',
                description: `P95 response time (${metrics.p95ResponseTime.toFixed(2)}ms) indicates performance inconsistency`,
                affectedEndpoints: [],
                suggestedFixes: [
                    'Investigate outlier requests and optimize slow queries',
                    'Implement request timeout and circuit breaker patterns',
                    'Monitor and optimize resource contention'
                ]
            });
        }
        if (metrics.errorRate > this.config.targets.errorRate) {
            bottlenecks.push({
                type: 'error-rate',
                severity: metrics.errorRate > this.config.targets.errorRate * 2 ? 'critical' : 'high',
                description: `Error rate (${metrics.errorRate.toFixed(2)}%) exceeds target (${this.config.targets.errorRate}%)`,
                affectedEndpoints: [],
                suggestedFixes: [
                    'Review application logs and fix identified errors',
                    'Implement better error handling and recovery mechanisms',
                    'Add health checks and monitoring for dependencies',
                    'Increase connection pool sizes and timeouts'
                ]
            });
        }
        if (metrics.throughput < this.config.targets.throughput) {
            bottlenecks.push({
                type: 'throughput',
                severity: metrics.throughput < this.config.targets.throughput * 0.5 ? 'critical' : 'high',
                description: `Throughput (${metrics.throughput.toFixed(2)} req/s) is below target (${this.config.targets.throughput} req/s)`,
                affectedEndpoints: [],
                suggestedFixes: [
                    'Scale horizontally by adding more server instances',
                    'Optimize application code and reduce processing time',
                    'Implement connection pooling and keep-alive',
                    'Consider upgrading hardware resources'
                ]
            });
        }
        endpointMetrics.forEach((endpointMetric, endpointKey) => {
            const [, endpoint] = endpointKey.split(' ', 2);
            if (endpointMetric.errorRate > this.config.targets.errorRate * 1.5) {
                bottlenecks.push({
                    type: 'error-rate',
                    severity: 'high',
                    description: `High error rate (${endpointMetric.errorRate.toFixed(2)}%) for endpoint: ${endpoint}`,
                    affectedEndpoints: [endpoint],
                    suggestedFixes: [
                        'Review endpoint-specific error handling',
                        'Optimize database queries for this endpoint',
                        'Check for resource leaks or deadlocks'
                    ]
                });
            }
            if (endpointMetric.averageResponseTime > this.config.targets.responseTime * 1.5) {
                bottlenecks.push({
                    type: 'response-time',
                    severity: 'medium',
                    description: `Slow endpoint detected: ${endpoint} (${endpointMetric.averageResponseTime.toFixed(2)}ms average)`,
                    affectedEndpoints: [endpoint],
                    suggestedFixes: [
                        'Profile this specific endpoint for bottlenecks',
                        'Add caching for this endpoint if appropriate',
                        'Optimize queries and reduce data transfer'
                    ]
                });
            }
        });
        return bottlenecks;
    }
    generateRecommendations(metrics, bottlenecks) {
        const recommendations = [];
        if (metrics.averageResponseTime > this.config.targets.responseTime) {
            recommendations.push(`Average response time (${metrics.averageResponseTime.toFixed(2)}ms) exceeds target (${this.config.targets.responseTime}ms). Consider optimizing database queries and adding caching.`);
        }
        if (metrics.p95ResponseTime > metrics.averageResponseTime * 2) {
            recommendations.push(`P95 response time (${metrics.p95ResponseTime.toFixed(2)}ms) is significantly higher than average. Investigate performance bottlenecks.`);
        }
        if (metrics.errorRate > this.config.targets.errorRate) {
            recommendations.push(`Error rate (${metrics.errorRate.toFixed(2)}%) exceeds target (${this.config.targets.errorRate}%). Review application logs and error handling.`);
        }
        if (metrics.throughput < this.config.targets.throughput) {
            recommendations.push(`Throughput (${metrics.throughput.toFixed(2)} req/s) is below target (${this.config.targets.throughput} req/s). Consider horizontal scaling.`);
        }
        if (metrics.resourceUtilization.memoryUsage > 512) {
            recommendations.push(`High memory usage detected (${metrics.resourceUtilization.memoryUsage.toFixed(2)}MB). Check for memory leaks and optimize data structures.`);
        }
        if (metrics.resourceUtilization.cpuUsage > 80) {
            recommendations.push(`High CPU usage detected (${metrics.resourceUtilization.cpuUsage.toFixed(2)}%). Profile application code for optimization opportunities.`);
        }
        const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical');
        if (criticalBottlenecks.length > 0) {
            recommendations.push(`Critical performance issues detected: ${criticalBottlenecks.map(b => b.description).join('; ')}. Immediate action required.`);
        }
        return recommendations;
    }
    calculateResourceMetrics() {
        if (this.resourceMetrics.length === 0) {
            return {
                peakMemoryUsage: 0,
                averageMemoryUsage: 0,
                peakCpuUsage: 0,
                averageCpuUsage: 0,
                gcImpact: 0
            };
        }
        const memoryUsages = this.resourceMetrics.map(m => m.memory.heapUsed);
        const cpuUsages = this.resourceMetrics.map(m => m.cpu.user + m.cpu.system);
        return {
            peakMemoryUsage: Math.max(...memoryUsages),
            averageMemoryUsage: memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length,
            peakCpuUsage: Math.max(...cpuUsages),
            averageCpuUsage: cpuUsages.reduce((sum, usage) => sum + usage, 0) / cpuUsages.length,
            gcImpact: 0
        };
    }
    exportResults(result, format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(result, (_key, value) => {
                    if (value instanceof Map) {
                        return Object.fromEntries(value);
                    }
                    return value;
                }, 2);
            case 'html':
                return this.generateHtmlReport(result);
            case 'csv':
                return this.generateCsvReport(result);
            default:
                return JSON.stringify(result, null, 2);
        }
    }
    generateHtmlReport(result) {
        const passedTargets = Object.values(result.performanceTargets).filter(t => t.passed).length;
        const totalTargets = Object.keys(result.performanceTargets).length;
        return `
<!DOCTYPE html>
<html>
<head>
    <title>HASIVU Platform Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric-card { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric-card h3 { margin-top: 0; color: #333; }
        .metric-card .value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warning { color: #ffc107; }
        .targets { margin: 20px 0; }
        .target-item { padding: 10px; margin: 5px 0; border-radius: 3px; }
        .target-passed { background: #d4edda; border-left: 4px solid #28a745; }
        .target-failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .bottlenecks { margin: 20px 0; }
        .bottleneck { padding: 15px; margin: 10px 0; border-radius: 5px; }
        .bottleneck.critical { background: #f8d7da; border-left: 4px solid #dc3545; }
        .bottleneck.high { background: #fff3cd; border-left: 4px solid #ffc107; }
        .bottleneck.medium { background: #d1ecf1; border-left: 4px solid #17a2b8; }
        .recommendations { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .recommendations ul { margin: 0; padding-left: 20px; }
        .endpoint-metrics { margin: 20px 0; }
        .endpoint-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .endpoint-table th, .endpoint-table td { padding: 8px 12px; border: 1px solid #ddd; text-align: left; }
        .endpoint-table th { background: #f8f9fa; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Load Test Report: ${result.testName}</h1>
        <p><strong>Environment:</strong> ${result.environment}</p>
        <p><strong>Test Duration:</strong> ${(result.duration / 1000).toFixed(2)} seconds</p>
        <p><strong>Start Time:</strong> ${new Date(result.startTime).toISOString()}</p>
        <p><strong>Test Status:</strong> <span class="${result.testStatus}">${result.testStatus.toUpperCase()}</span></p>
    </div>

    <div class="summary">
        <div class="metric-card">
            <h3>Total Requests</h3>
            <div class="value">${result.overallMetrics.totalRequests}</div>
            <div>Success Rate: ${((result.overallMetrics.successfulRequests / result.overallMetrics.totalRequests) * 100).toFixed(2)}%</div>
        </div>
        <div class="metric-card">
            <h3>Average Response Time</h3>
            <div class="value">${result.overallMetrics.averageResponseTime.toFixed(2)}ms</div>
            <div>P95: ${result.overallMetrics.p95ResponseTime.toFixed(2)}ms</div>
        </div>
        <div class="metric-card">
            <h3>Throughput</h3>
            <div class="value">${result.overallMetrics.throughput.toFixed(2)}</div>
            <div>requests/second</div>
        </div>
        <div class="metric-card">
            <h3>Error Rate</h3>
            <div class="value ${result.overallMetrics.errorRate > result.configuration.targets.errorRate ? 'failed' : 'passed'}">${result.overallMetrics.errorRate.toFixed(2)}%</div>
            <div>${result.overallMetrics.failedRequests} failed</div>
        </div>
        <div class="metric-card">
            <h3>Performance Targets</h3>
            <div class="value">${passedTargets}/${totalTargets}</div>
            <div>targets passed</div>
        </div>
    </div>

    <div class="targets">
        <h2>Performance Targets</h2>
        ${Object.entries(result.performanceTargets).map(([name, target]) => `
            <div class="target-item ${target.passed ? 'target-passed' : 'target-failed'}">
                <strong>${name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong>
                Target: ${target.target}, Actual: ${target.actual.toFixed(2)} 
                <span class="${target.passed ? 'passed' : 'failed'}">(${target.passed ? 'PASSED' : 'FAILED'})</span>
            </div>
        `).join('')}
    </div>

    ${result.bottlenecks.length > 0 ? `
        <div class="bottlenecks">
            <h2>Performance Bottlenecks</h2>
            ${result.bottlenecks.map(bottleneck => `
                <div class="bottleneck ${bottleneck.severity}">
                    <h4>${bottleneck.type.replace('-', ' ').toUpperCase()} - ${bottleneck.severity.toUpperCase()}</h4>
                    <p>${bottleneck.description}</p>
                    ${bottleneck.affectedEndpoints.length > 0 ? `<p><strong>Affected Endpoints:</strong> ${bottleneck.affectedEndpoints.join(', ')}</p>` : ''}
                    <p><strong>Suggested Fixes:</strong></p>
                    <ul>${bottleneck.suggestedFixes.map(fix => `<li>${fix}</li>`).join('')}</ul>
                </div>
            `).join('')}
        </div>
    ` : ''}

    ${result.recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>Recommendations</h2>
            <ul>
                ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    ` : ''}

    <div class="endpoint-metrics">
        <h2>Endpoint Performance</h2>
        <table class="endpoint-table">
            <thead>
                <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Requests</th>
                    <th>Success Rate</th>
                    <th>Avg Response Time</th>
                    <th>P95 Response Time</th>
                    <th>Throughput</th>
                    <th>Error Rate</th>
                </tr>
            </thead>
            <tbody>
                ${Array.from(result.endpointMetrics.entries()).map(([_key, metrics]) => `
                    <tr>
                        <td>${metrics.endpoint}</td>
                        <td>${metrics.method}</td>
                        <td>${metrics.totalRequests}</td>
                        <td class="${metrics.successRate >= 95 ? 'passed' : 'failed'}">${metrics.successRate.toFixed(2)}%</td>
                        <td>${metrics.averageResponseTime.toFixed(2)}ms</td>
                        <td>${metrics.p95ResponseTime.toFixed(2)}ms</td>
                        <td>${metrics.throughput.toFixed(2)} req/s</td>
                        <td class="${metrics.errorRate <= result.configuration.targets.errorRate ? 'passed' : 'failed'}">${metrics.errorRate.toFixed(2)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
        <h3>Resource Utilization</h3>
        <p><strong>Peak Memory Usage:</strong> ${result.resourceMetrics.peakMemoryUsage.toFixed(2)} MB</p>
        <p><strong>Average Memory Usage:</strong> ${result.resourceMetrics.averageMemoryUsage.toFixed(2)} MB</p>
        <p><strong>Peak CPU Usage:</strong> ${result.resourceMetrics.peakCpuUsage.toFixed(2)}%</p>
        <p><strong>Average CPU Usage:</strong> ${result.resourceMetrics.averageCpuUsage.toFixed(2)}%</p>
    </div>
</body>
</html>`;
    }
    generateCsvReport(_result) {
        const headers = [
            'timestamp',
            'endpoint',
            'method',
            'response_time',
            'status_code',
            'success',
            'data_transferred',
            'user_id',
            'retry_count'
        ];
        const rows = this.metrics.map(metric => [
            new Date(metric.startTime).toISOString(),
            metric.endpoint,
            metric.method,
            metric.responseTime.toFixed(2),
            metric.statusCode,
            metric.success,
            metric.dataTransferred,
            metric.userId,
            metric.retryCount
        ]);
        return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    }
    getCurrentMetrics() {
        return this.metrics;
    }
    clearTestData() {
        this.metrics = [];
        this.virtualUsers.clear();
        this.resourceMetrics = [];
        this.testStartTime = 0;
        this.testEndTime = 0;
        this.activeRequests = 0;
        logger.debug('Load test data cleared');
    }
    async healthCheck() {
        try {
            const checks = {
                targetConnectivity: false,
                resourceAvailability: true,
                configurationValid: true
            };
            try {
                const response = await this.client.get('/health');
                checks.targetConnectivity = response.status === 200;
            }
            catch (error) {
                logger.warn('Target connectivity check failed', {
                    error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
                });
            }
            const memUsage = process.memoryUsage();
            if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
                checks.resourceAvailability = false;
            }
            if (this.endpoints.length === 0) {
                checks.configurationValid = false;
            }
            const allHealthy = Object.values(checks).every(Boolean);
            return {
                status: allHealthy ? 'healthy' : 'unhealthy',
                timestamp: Date.now(),
                checks
            };
        }
        catch (error) {
            logger.error('Load testing environment health check failed', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            });
            return {
                status: 'unhealthy',
                timestamp: Date.now(),
                checks: {
                    targetConnectivity: false,
                    resourceAvailability: false,
                    configurationValid: false
                },
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            };
        }
    }
}
exports.LoadTestSuite = LoadTestSuite;
exports.defaultLoadTestConfig = {
    baseUrl: environment_1.config.api.baseUrl || 'http://localhost:3000',
    duration: 60,
    maxConcurrentUsers: 10,
    rampUpTime: 10,
    rampDownTime: 5,
    requestDelay: 100,
    environment: process.env.NODE_ENV || 'development',
    targets: {
        responseTime: 500,
        throughput: 10,
        errorRate: 1,
        p95ResponseTime: 1000,
        p99ResponseTime: 2000
    },
    retryConfig: {
        maxRetries: 2,
        retryDelay: 1000,
        exponentialBackoff: true
    },
    monitoring: {
        enableTracing: process.env.NODE_ENV !== 'production',
        enableResourceMonitoring: true,
        collectGCMetrics: process.env.NODE_ENV !== 'production',
        enableRequestLogging: process.env.NODE_ENV !== 'production'
    },
    warmup: {
        enabled: true,
        duration: 10,
        concurrency: 2
    }
};
exports.loadTestSuite = LoadTestSuite.getInstance(exports.defaultLoadTestConfig);
//# sourceMappingURL=load-test-suite.js.map