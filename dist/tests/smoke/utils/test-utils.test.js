"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmokeTestUtils = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const smoke_test_config_test_1 = require("../config/smoke-test.config.test");
class SmokeTestUtils {
    static authToken = null;
    static testResults = [];
    static suiteStartTime = 0;
    static initializeSuite() {
        this.suiteStartTime = Date.now();
        this.testResults = [];
        console.log(`🚀 Starting HASIVU Platform Smoke Tests`);
        console.log(`🌍 Environment: ${smoke_test_config_test_1.SMOKE_TEST_CONFIG.environment}`);
        console.log(`⏰ Suite Timeout: ${smoke_test_config_test_1.SMOKE_TEST_CONFIG.timeouts.suite / 1000}s`);
        console.log(`🔗 API Base: ${smoke_test_config_test_1.SMOKE_TEST_CONFIG.urls.apiUrl}`);
        console.log('─'.repeat(60));
    }
    static async makeRequest(endpoint, options = {}, testName) {
        const startTime = Date.now();
        const url = (0, smoke_test_config_test_1.buildUrl)(endpoint);
        const { maxRetries } = smoke_test_config_test_1.SMOKE_TEST_CONFIG.retry;
        console.log(`🔍 Testing: ${testName}`);
        console.log(`📡 ${options.method || 'GET'} ${url}`);
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const headers = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'HASIVU-Smoke-Test/1.0',
                };
                if (this.authToken) {
                    headers['Authorization'] = `Bearer ${this.authToken}`;
                }
                if (options.headers) {
                    Object.assign(headers, options.headers);
                }
                const response = await (0, node_fetch_1.default)(url, {
                    ...options,
                    headers
                });
                const duration = Date.now() - startTime;
                const { status } = response;
                console.log(`📊 Response: ${status} (${duration}ms)`);
                const acceptableStatuses = [
                    ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success,
                    ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.authRequired,
                    ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.notFound,
                    ...smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.validationError
                ];
                if (acceptableStatuses.includes(status) || attempt === maxRetries) {
                    let responseData;
                    try {
                        responseData = await response.json();
                    }
                    catch {
                        responseData = { message: 'Non-JSON response' };
                    }
                    return { response: responseData, status, duration };
                }
                if (smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.serverError.includes(status) && attempt < maxRetries) {
                    const delay = smoke_test_config_test_1.SMOKE_TEST_CONFIG.retry.retryDelay * Math.pow(smoke_test_config_test_1.SMOKE_TEST_CONFIG.retry.backoffMultiplier, attempt - 1);
                    console.log(`⏳ Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            catch (error) {
                const duration = Date.now() - startTime;
                console.log(`❌ Network error: ${error instanceof Error ? error.message : String(error)} (${duration}ms)`);
                if (attempt === maxRetries) {
                    throw error;
                }
                const delay = smoke_test_config_test_1.SMOKE_TEST_CONFIG.retry.retryDelay * Math.pow(smoke_test_config_test_1.SMOKE_TEST_CONFIG.retry.backoffMultiplier, attempt - 1);
                console.log(`⏳ Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error(`Failed to get acceptable response after ${maxRetries} attempts`);
    }
    static async authenticate() {
        try {
            console.log('🔐 Attempting authentication...');
            const registerResult = await this.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.auth.register, {
                method: 'POST',
                body: JSON.stringify(smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.user)
            }, 'User Registration');
            if (!smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success.includes(registerResult.status)) {
                console.log('📝 User might already exist, attempting login...');
                const loginResult = await this.makeRequest(smoke_test_config_test_1.SMOKE_TEST_CONFIG.endpoints.auth.login, {
                    method: 'POST',
                    body: JSON.stringify({
                        email: smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.user.email,
                        password: smoke_test_config_test_1.SMOKE_TEST_CONFIG.testData.user.password
                    })
                }, 'User Login');
                if (smoke_test_config_test_1.SMOKE_TEST_CONFIG.responses.success.includes(loginResult.status)) {
                    this.authToken = loginResult.response.token || loginResult.response.accessToken;
                    console.log('✅ Authentication successful');
                    return true;
                }
            }
            else {
                this.authToken = registerResult.response.token || registerResult.response.accessToken;
                console.log('✅ Registration and authentication successful');
                return true;
            }
            console.log('❌ Authentication failed');
            return false;
        }
        catch (error) {
            console.log(`❌ Authentication error: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    static recordTestResult(testName, status, duration, error, responseCode) {
        const result = {
            testName,
            status,
            duration,
            error,
            responseCode
        };
        this.testResults.push(result);
        const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️';
        const statusText = status.toUpperCase();
        console.log(`${icon} ${testName}: ${statusText} (${duration}ms)`);
        if (error) {
            console.log(`   Error: ${error}`);
        }
        if (responseCode) {
            console.log(`   Response Code: ${responseCode}`);
        }
    }
    static checkPerformanceThreshold(testName, duration, threshold) {
        if (duration > threshold) {
            console.log(`⚠️ Performance warning: ${testName} took ${duration}ms (threshold: ${threshold}ms)`);
            return false;
        }
        return true;
    }
    static validateResponseStatus(status, expectedStatuses) {
        return expectedStatuses.includes(status);
    }
    static generateSuiteSummary() {
        const totalDuration = Date.now() - this.suiteStartTime;
        const passedTests = this.testResults.filter(r => r.status === 'passed').length;
        const failedTests = this.testResults.filter(r => r.status === 'failed').length;
        const skippedTests = this.testResults.filter(r => r.status === 'skipped').length;
        const totalTests = this.testResults.length;
        const summary = {
            totalTests,
            passedTests,
            failedTests,
            skippedTests,
            totalDuration,
            results: this.testResults,
            environment: smoke_test_config_test_1.SMOKE_TEST_CONFIG.environment,
            timestamp: new Date().toISOString()
        };
        console.log(`\n${'='.repeat(60)}`);
        console.log('📊 SMOKE TEST SUITE SUMMARY');
        console.log('='.repeat(60));
        console.log(`Environment: ${summary.environment}`);
        console.log(`Timestamp: ${summary.timestamp}`);
        console.log(`Total Tests: ${summary.totalTests}`);
        console.log(`✅ Passed: ${summary.passedTests}`);
        console.log(`❌ Failed: ${summary.failedTests}`);
        console.log(`⏭️ Skipped: ${summary.skippedTests}`);
        console.log(`⏱️ Total Duration: ${summary.totalDuration}ms (${(summary.totalDuration / 1000).toFixed(1)}s)`);
        const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';
        console.log(`📈 Success Rate: ${successRate}%`);
        if (totalDuration > smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.totalSuite) {
            console.log(`⚠️ PERFORMANCE WARNING: Suite exceeded ${smoke_test_config_test_1.SMOKE_TEST_CONFIG.thresholds.totalSuite / 1000}s limit`);
        }
        else {
            console.log(`✅ PERFORMANCE: Suite completed within time limit`);
        }
        if (failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults.filter(r => r.status === 'failed').forEach(result => {
                console.log(`   • ${result.testName}: ${result.error || 'Unknown error'}`);
            });
        }
        console.log('='.repeat(60));
        return summary;
    }
    static async cleanup() {
        console.log('🧹 Cleaning up test data...');
        this.authToken = null;
    }
    static getAuthToken() {
        return this.authToken;
    }
    static shouldContinueSuite() {
        const criticalTests = ['Health Check', 'Authentication'];
        const criticalFailures = this.testResults.filter(r => criticalTests.includes(r.testName) && r.status === 'failed').length;
        return criticalFailures === 0 || this.testResults.length < criticalTests.length;
    }
}
exports.SmokeTestUtils = SmokeTestUtils;
//# sourceMappingURL=test-utils.test.js.map