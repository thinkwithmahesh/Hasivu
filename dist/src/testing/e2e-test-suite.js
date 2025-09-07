"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.e2eTestSuite = exports.defaultE2EConfig = exports.E2EScenarioBuilder = exports.E2ETestSuite = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../shared/utils/logger");
const environment_1 = require("../config/environment");
const logger = logger_1.LoggerService.getInstance();
class E2ETestSuite {
    static instance;
    httpClient;
    testConfig;
    testResults = [];
    currentAuthToken;
    testStartTime = 0;
    constructor(config) {
        this.testConfig = config;
        this.initializeHttpClient();
    }
    static getInstance(config) {
        if (!E2ETestSuite.instance) {
            if (!config) {
                throw new Error('E2ETestSuite requires configuration on first initialization');
            }
            E2ETestSuite.instance = new E2ETestSuite(config);
        }
        return E2ETestSuite.instance;
    }
    initializeHttpClient() {
        this.httpClient = axios_1.default.create({
            baseURL: this.testConfig.baseUrl,
            timeout: this.testConfig.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'HASIVU-E2E-Test-Suite/1.0',
                ...(this.testConfig.apiKey && { 'X-API-Key': this.testConfig.apiKey }),
                ...(this.testConfig.authToken && { 'Authorization': `Bearer ${this.testConfig.authToken}` })
            }
        });
        this.httpClient.interceptors.request.use((config) => {
            logger.debug('E2E Test Request', {
                method: config.method?.toUpperCase(),
                url: config.url,
                headers: config.headers
            });
            return config;
        });
        this.httpClient.interceptors.response.use((response) => {
            logger.debug('E2E Test Response', {
                status: response.status,
                url: response.config.url,
                duration: response.headers['x-response-time'] || 'unknown'
            });
            return response;
        }, (error) => {
            logger.error('E2E Test Request Failed', {
                error: error.message,
                status: error.response?.status,
                url: error.config?.url
            });
            return Promise.reject(error);
        });
    }
    async runTestScenario(scenario) {
        const startTime = Date.now();
        const steps = [];
        let retryCount = 0;
        logger.info(`Starting test scenario: ${scenario.name}`, {
            category: scenario.category,
            priority: scenario.priority,
            stepsCount: scenario.steps.length
        });
        if (scenario.skipOnEnvironment?.includes(process.env.NODE_ENV || 'development')) {
            logger.info(`Skipping scenario ${scenario.name} for environment: ${process.env.NODE_ENV}`);
            return {
                scenarioName: scenario.name,
                category: scenario.category,
                status: 'skipped',
                duration: Date.now() - startTime,
                steps: [],
                timestamp: startTime,
                environment: process.env.NODE_ENV || 'development',
                retryCount: 0
            };
        }
        try {
            if (scenario.setup) {
                await scenario.setup();
            }
            for (const step of scenario.steps) {
                const stepResult = await this.executeTestStep(step, scenario.name);
                steps.push(stepResult);
                if (stepResult.status === 'failed' && !scenario.retryOnFailure) {
                    break;
                }
            }
            if (scenario.cleanup) {
                await scenario.cleanup();
            }
            const duration = Date.now() - startTime;
            const allStepsPassed = steps.every(step => step.status === 'passed');
            const result = {
                scenarioName: scenario.name,
                category: scenario.category,
                status: allStepsPassed ? 'passed' : 'failed',
                duration,
                steps,
                timestamp: startTime,
                environment: process.env.NODE_ENV || 'development',
                retryCount
            };
            logger.info(`Completed test scenario: ${scenario.name}`, {
                status: result.status,
                duration: `${duration}ms`,
                stepsCount: steps.length,
                expectedDuration: `${scenario.expectedDuration}ms`,
                performanceDelta: duration - scenario.expectedDuration
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`Test scenario failed with error: ${scenario.name}`, {
                error: error.message,
                duration: `${duration}ms`,
                completedSteps: steps.length
            });
            return {
                scenarioName: scenario.name,
                category: scenario.category,
                status: 'error',
                duration,
                steps,
                error: error.message,
                timestamp: startTime,
                environment: process.env.NODE_ENV || 'development',
                retryCount
            };
        }
    }
    async executeTestStep(step, scenarioName) {
        const startTime = Date.now();
        let retryCount = 0;
        const maxRetries = step.retries || this.testConfig.retries;
        logger.debug(`Executing test step: ${step.name}`, {
            scenario: scenarioName,
            action: step.action,
            target: step.target
        });
        while (retryCount <= maxRetries) {
            try {
                if (step.setup) {
                    await step.setup();
                }
                let response;
                switch (step.action) {
                    case 'GET':
                        response = await this.httpClient.get(step.target, step.data);
                        break;
                    case 'POST':
                        response = await this.httpClient.post(step.target, step.data);
                        break;
                    case 'PUT':
                        response = await this.httpClient.put(step.target, step.data);
                        break;
                    case 'DELETE':
                        response = await this.httpClient.delete(step.target, { data: step.data });
                        break;
                    case 'PATCH':
                        response = await this.httpClient.patch(step.target, step.data);
                        break;
                    case 'NAVIGATE':
                        response = { status: 200, data: { navigated: true, url: step.target } };
                        break;
                    case 'CLICK':
                        response = { status: 200, data: { clicked: true, selector: step.selector } };
                        break;
                    case 'INPUT':
                        response = { status: 200, data: { inputted: true, value: step.value } };
                        break;
                    case 'WAIT':
                        await new Promise(resolve => setTimeout(resolve, parseInt(step.waitFor || '1000')));
                        response = { status: 200, data: { waited: true, duration: step.waitFor } };
                        break;
                    case 'VERIFY':
                        if (step.assertion && !step.assertion(response)) {
                            throw new Error(`Verification failed: ${step.name}`);
                        }
                        response = { status: 200, data: { verified: true } };
                        break;
                    default:
                        throw new Error(`Unknown test action: ${step.action}`);
                }
                if (step.expectedStatus && response.status !== step.expectedStatus) {
                    throw new Error(`Expected status ${step.expectedStatus} but got ${response.status}`);
                }
                if (step.expectedResponse) {
                    const responseMatches = JSON.stringify(response.data) === JSON.stringify(step.expectedResponse);
                    if (!responseMatches) {
                        throw new Error(`Response data does not match expected result`);
                    }
                }
                if (step.assertion && !step.assertion(response)) {
                    throw new Error(`Custom assertion failed for step: ${step.name}`);
                }
                if (step.cleanup) {
                    await step.cleanup();
                }
                const duration = Date.now() - startTime;
                logger.debug(`Test step passed: ${step.name}`, {
                    scenario: scenarioName,
                    status: response.status,
                    duration: `${duration}ms`,
                    retryCount
                });
                return {
                    stepName: step.name,
                    status: 'passed',
                    duration,
                    response: response.data,
                    timestamp: startTime,
                    retryCount
                };
            }
            catch (error) {
                retryCount++;
                if (retryCount > maxRetries) {
                    const duration = Date.now() - startTime;
                    logger.error(`Test step failed: ${step.name}`, {
                        scenario: scenarioName,
                        error: error.message,
                        duration: `${duration}ms`,
                        retryCount: retryCount - 1
                    });
                    return {
                        stepName: step.name,
                        status: 'failed',
                        duration,
                        error: error.message,
                        timestamp: startTime,
                        retryCount: retryCount - 1
                    };
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                logger.warn(`Retrying test step: ${step.name}`, {
                    scenario: scenarioName,
                    retryCount,
                    maxRetries,
                    error: error.message
                });
            }
        }
        throw new Error(`Unexpected end of executeTestStep for: ${step.name}`);
    }
    async runTestSuite(scenarios) {
        this.testStartTime = Date.now();
        this.testResults = [];
        logger.info('Starting E2E Test Suite', {
            scenariosCount: scenarios.length,
            environment: process.env.NODE_ENV || 'development',
            baseUrl: this.testConfig.baseUrl
        });
        for (const scenario of scenarios) {
            const result = await this.runTestScenario(scenario);
            this.testResults.push(result);
        }
        const statistics = this.generateStatistics();
        logger.info('E2E Test Suite Completed', {
            ...statistics,
            totalDuration: `${Date.now() - this.testStartTime}ms`
        });
        return this.testResults;
    }
    async runTestSuiteParallel(scenarios, concurrency = 3) {
        this.testStartTime = Date.now();
        this.testResults = [];
        logger.info('Starting Parallel E2E Test Suite', {
            scenariosCount: scenarios.length,
            concurrency,
            environment: process.env.NODE_ENV || 'development'
        });
        const batches = [];
        for (let i = 0; i < scenarios.length; i += concurrency) {
            batches.push(scenarios.slice(i, i + concurrency));
        }
        for (const batch of batches) {
            const batchPromises = batch.map(scenario => this.runTestScenario(scenario));
            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    this.testResults.push(result.value);
                }
                else {
                    logger.error(`Test scenario failed with unhandled error: ${batch[index].name}`, {
                        error: result.reason.message
                    });
                    this.testResults.push({
                        scenarioName: batch[index].name,
                        category: batch[index].category,
                        status: 'error',
                        duration: 0,
                        steps: [],
                        error: result.reason.message,
                        timestamp: Date.now(),
                        environment: process.env.NODE_ENV || 'development',
                        retryCount: 0
                    });
                }
            });
        }
        const statistics = this.generateStatistics();
        logger.info('Parallel E2E Test Suite Completed', {
            ...statistics,
            totalDuration: `${Date.now() - this.testStartTime}ms`
        });
        return this.testResults;
    }
    generateStatistics() {
        const totalScenarios = this.testResults.length;
        const passedScenarios = this.testResults.filter(r => r.status === 'passed').length;
        const failedScenarios = this.testResults.filter(r => r.status === 'failed').length;
        const skippedScenarios = this.testResults.filter(r => r.status === 'skipped').length;
        const allSteps = this.testResults.flatMap(r => r.steps);
        const totalSteps = allSteps.length;
        const passedSteps = allSteps.filter(s => s.status === 'passed').length;
        const failedSteps = allSteps.filter(s => s.status === 'failed').length;
        const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
        const averageDuration = totalScenarios > 0 ? totalDuration / totalScenarios : 0;
        const successRate = totalScenarios > 0 ? (passedScenarios / totalScenarios) * 100 : 0;
        return {
            totalScenarios,
            passedScenarios,
            failedScenarios,
            skippedScenarios,
            totalSteps,
            passedSteps,
            failedSteps,
            totalDuration,
            averageDuration,
            successRate,
            coverage: {
                endpoints: this.calculateEndpointCoverage(),
                userFlows: this.calculateUserFlowCoverage(),
                features: this.calculateFeatureCoverage()
            }
        };
    }
    calculateEndpointCoverage() {
        const testedEndpoints = new Set();
        this.testResults.forEach(result => {
            result.steps.forEach(step => {
                if (step.stepName.includes('/api/')) {
                    testedEndpoints.add(step.stepName);
                }
            });
        });
        return testedEndpoints.size;
    }
    calculateUserFlowCoverage() {
        const userFlows = new Set();
        this.testResults.forEach(result => {
            if (result.category === 'user-journey') {
                userFlows.add(result.scenarioName);
            }
        });
        return userFlows.size;
    }
    calculateFeatureCoverage() {
        const features = new Set();
        this.testResults.forEach(result => {
            features.add(result.category);
        });
        return features.size;
    }
    exportResults(format = 'json') {
        const statistics = this.generateStatistics();
        const exportData = {
            testSuite: 'HASIVU Platform E2E Tests',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            configuration: {
                baseUrl: this.testConfig.baseUrl,
                timeout: this.testConfig.timeout,
                retries: this.testConfig.retries
            },
            statistics,
            results: this.testResults
        };
        switch (format) {
            case 'json':
                return JSON.stringify(exportData, null, 2);
            case 'html':
                return this.generateHtmlReport(exportData);
            case 'junit':
                return this.generateJunitReport(exportData);
            default:
                return JSON.stringify(exportData, null, 2);
        }
    }
    generateHtmlReport(data) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>HASIVU Platform E2E Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-card { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; flex: 1; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .scenario { margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .step { margin: 5px 0; padding: 10px; background: #f9f9f9; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>HASIVU Platform E2E Test Report</h1>
        <p>Generated: ${data.timestamp}</p>
        <p>Environment: ${data.environment}</p>
        <p>Base URL: ${data.configuration.baseUrl}</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <h3>Total Scenarios</h3>
            <p>${data.statistics.totalScenarios}</p>
        </div>
        <div class="stat-card">
            <h3 class="passed">Passed</h3>
            <p>${data.statistics.passedScenarios}</p>
        </div>
        <div class="stat-card">
            <h3 class="failed">Failed</h3>
            <p>${data.statistics.failedScenarios}</p>
        </div>
        <div class="stat-card">
            <h3>Success Rate</h3>
            <p>${data.statistics.successRate.toFixed(2)}%</p>
        </div>
    </div>
    
    <div class="scenarios">
        ${data.results.map((result) => `
            <div class="scenario ${result.status}">
                <h3>${result.scenarioName} (${result.category})</h3>
                <p>Status: <span class="${result.status}">${result.status.toUpperCase()}</span></p>
                <p>Duration: ${result.duration}ms</p>
                <p>Steps: ${result.steps.length}</p>
                ${result.error ? `<p class="failed">Error: ${result.error}</p>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;
    }
    generateJunitReport(data) {
        const testsuites = data.results.map((result) => `
        <testsuite name="${result.scenarioName}" tests="${result.steps.length}" failures="${result.steps.filter((s) => s.status === 'failed').length}" time="${result.duration / 1000}">
            ${result.steps.map((step) => `
                <testcase name="${step.stepName}" time="${step.duration / 1000}" classname="${result.category}">
                    ${step.status === 'failed' ? `<failure message="${step.error}">${step.error}</failure>` : ''}
                </testcase>
            `).join('')}
        </testsuite>
    `).join('');
        return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="HASIVU Platform E2E Tests" tests="${data.statistics.totalScenarios}" failures="${data.statistics.failedScenarios}" time="${data.statistics.totalDuration / 1000}">
    ${testsuites}
</testsuites>`;
    }
    setAuthToken(token) {
        this.currentAuthToken = token;
        this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        logger.debug('Authentication token updated for E2E tests', {
            tokenLength: token.length,
            tokenPrefix: token.substring(0, 8) + '...'
        });
    }
    clearAuthToken() {
        this.currentAuthToken = undefined;
        delete this.httpClient.defaults.headers.common['Authorization'];
        logger.debug('Authentication token cleared for E2E tests');
    }
    getResults() {
        return this.testResults;
    }
    clearResults() {
        this.testResults = [];
        logger.debug('E2E test results cleared');
    }
    async healthCheck() {
        try {
            const checks = {
                apiConnectivity: false,
                databaseConnectivity: false,
                authService: false,
                testConfiguration: true
            };
            try {
                const response = await this.httpClient.get('/health');
                checks.apiConnectivity = response.status === 200;
            }
            catch (error) {
                logger.warn('API connectivity check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
            }
            if (this.currentAuthToken) {
                try {
                    const response = await this.httpClient.get('/auth/verify', {
                        headers: { Authorization: `Bearer ${this.currentAuthToken}` }
                    });
                    checks.authService = response.status === 200;
                }
                catch (error) {
                    logger.warn('Auth service check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
                }
            }
            const allHealthy = Object.values(checks).every(Boolean);
            return {
                status: allHealthy ? 'healthy' : 'unhealthy',
                timestamp: Date.now(),
                checks
            };
        }
        catch (error) {
            logger.error('E2E test environment health check failed', {
                error: error.message
            });
            return {
                status: 'unhealthy',
                timestamp: Date.now(),
                checks: {
                    apiConnectivity: false,
                    databaseConnectivity: false,
                    authService: false,
                    testConfiguration: false
                },
                error: error.message
            };
        }
    }
}
exports.E2ETestSuite = E2ETestSuite;
class E2EScenarioBuilder {
    scenario = {
        steps: [],
        retryOnFailure: true,
        tags: []
    };
    name(name) {
        this.scenario.name = name;
        return this;
    }
    description(description) {
        this.scenario.description = description;
        return this;
    }
    category(category) {
        this.scenario.category = category;
        return this;
    }
    priority(priority) {
        this.scenario.priority = priority;
        return this;
    }
    tags(tags) {
        this.scenario.tags = tags;
        return this;
    }
    expectedDuration(duration) {
        this.scenario.expectedDuration = duration;
        return this;
    }
    addStep(step) {
        this.scenario.steps.push(step);
        return this;
    }
    addApiCall(name, method, endpoint, data, expectedStatus = 200) {
        this.scenario.steps.push({
            name,
            action: method,
            target: endpoint,
            data,
            expectedStatus
        });
        return this;
    }
    addNavigation(name, url) {
        this.scenario.steps.push({
            name,
            action: 'NAVIGATE',
            target: url
        });
        return this;
    }
    addClick(name, selector) {
        this.scenario.steps.push({
            name,
            action: 'CLICK',
            selector
        });
        return this;
    }
    addInput(name, selector, value) {
        this.scenario.steps.push({
            name,
            action: 'INPUT',
            selector,
            value
        });
        return this;
    }
    addWait(name, duration) {
        this.scenario.steps.push({
            name,
            action: 'WAIT',
            waitFor: duration.toString()
        });
        return this;
    }
    setup(setupFn) {
        this.scenario.setup = setupFn;
        return this;
    }
    cleanup(cleanupFn) {
        this.scenario.cleanup = cleanupFn;
        return this;
    }
    retryOnFailure(retry = true) {
        this.scenario.retryOnFailure = retry;
        return this;
    }
    skipOnEnvironment(environments) {
        this.scenario.skipOnEnvironment = environments;
        return this;
    }
    build() {
        if (!this.scenario.name) {
            throw new Error('Scenario name is required');
        }
        if (!this.scenario.description) {
            throw new Error('Scenario description is required');
        }
        if (!this.scenario.category) {
            throw new Error('Scenario category is required');
        }
        if (!this.scenario.priority) {
            throw new Error('Scenario priority is required');
        }
        if (!this.scenario.expectedDuration) {
            throw new Error('Scenario expected duration is required');
        }
        return this.scenario;
    }
}
exports.E2EScenarioBuilder = E2EScenarioBuilder;
exports.defaultE2EConfig = {
    baseUrl: environment_1.config.api.baseUrl || 'http://localhost:3000',
    timeout: 30000,
    retries: 2,
    testDatabase: {
        host: process.env.TEST_DB_HOST || 'localhost',
        port: parseInt(process.env.TEST_DB_PORT || '5432'),
        database: process.env.TEST_DB_NAME || 'hasivu_test',
        username: process.env.TEST_DB_USER || 'test_user',
        password: process.env.TEST_DB_PASSWORD || 'test_password'
    },
    testUser: {
        email: process.env.TEST_USER_EMAIL || 'test@hasivu.com',
        password: process.env.TEST_USER_PASSWORD || 'test123'
    },
    enableScreenshots: process.env.NODE_ENV !== 'production',
    headless: process.env.NODE_ENV === 'production',
    browserViewport: {
        width: 1920,
        height: 1080
    }
};
exports.e2eTestSuite = E2ETestSuite.getInstance(exports.defaultE2EConfig);
//# sourceMappingURL=e2e-test-suite.js.map