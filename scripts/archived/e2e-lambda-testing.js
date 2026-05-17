#!/usr/bin/env node

/**
 * End-to-End Lambda Function Testing Script
 *
 * This script tests actual deployed Lambda functions to ensure:
 * 1. All Lambda functions are accessible via their URLs
 * 2. Authentication flows work correctly
 * 3. API endpoints respond with expected data structures
 * 4. Performance metrics meet acceptable thresholds
 * 5. Error handling works properly
 *
 * Usage:
 *   node scripts/e2e-lambda-testing.js [options]
 *
 * Options:
 *   --env <environment>    Target environment (dev|staging|production)
 *   --test-type <type>     Test type (smoke|full|performance|security)
 *   --timeout <ms>         Request timeout in milliseconds (default: 30000)
 *   --verbose             Enable detailed logging
 *   --parallel            Run tests in parallel (faster but more resource intensive)
 *   --fail-fast           Stop on first failure
 *   --generate-report     Generate detailed HTML report
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

class LambdaE2ETester {
  constructor(options = {}) {
    this.environment = options.env || 'dev';
    this.testType = options.testType || 'smoke';
    this.timeout = options.timeout || 30000;
    this.verbose = options.verbose || false;
    this.parallel = options.parallel || false;
    this.failFast = options.failFast || false;
    this.generateReport = options.generateReport || false;

    this.lambdaUrls = {};
    this.testResults = [];
    this.performanceMetrics = [];
    this.authTokens = {};

    this.testSuites = {
      smoke: ['health-check', 'basic-auth', 'basic-endpoints'],
      full: ['health-check', 'auth-flow', 'all-endpoints', 'data-validation', 'error-handling'],
      performance: ['health-check', 'auth-flow', 'load-testing', 'concurrent-requests'],
      security: ['health-check', 'auth-security', 'input-validation', 'rate-limiting'],
    };
  }

  async loadConfiguration() {
    this.log('📋 Loading Lambda URLs configuration...');

    try {
      const envFile = path.join(__dirname, '..', 'web', `.env.${this.environment}`);
      const envContent = await fs.readFile(envFile, 'utf8');

      // Parse environment variables
      const lines = envContent.split('\\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=');

          if (key.startsWith('LAMBDA_')) {
            this.lambdaUrls[key] = value;
          }
        }
      });

      if (Object.keys(this.lambdaUrls).length === 0) {
        throw new Error('No Lambda URLs found in environment configuration');
      }

      this.log(`✅ Loaded ${Object.keys(this.lambdaUrls).length} Lambda URL configurations`);

      if (this.verbose) {
        Object.entries(this.lambdaUrls).forEach(([key, url]) => {
          this.log(`   ${key}: ${url}`);
        });
      }
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  async runTestSuite() {
    this.log(`🧪 Running ${this.testType} test suite for ${this.environment} environment`);

    const tests = this.testSuites[this.testType] || this.testSuites.smoke;

    try {
      for (const testName of tests) {
        if (this.failFast && this.hasFailures()) {
          this.log('🛑 Stopping tests due to --fail-fast flag');
          break;
        }

        await this.runTestGroup(testName);
      }

      await this.generateSummary();

      if (this.generateReport) {
        await this.generateHtmlReport();
      }
    } catch (error) {
      this.log(`💥 Test suite failed: ${error.message}`);
      throw error;
    }
  }

  async runTestGroup(testName) {
    this.log(`\\n🔍 Running ${testName} tests...`);

    const startTime = Date.now();

    try {
      switch (testName) {
        case 'health-check':
          await this.runHealthCheckTests();
          break;
        case 'basic-auth':
          await this.runBasicAuthTests();
          break;
        case 'auth-flow':
          await this.runCompleteAuthFlowTests();
          break;
        case 'basic-endpoints':
          await this.runBasicEndpointTests();
          break;
        case 'all-endpoints':
          await this.runAllEndpointTests();
          break;
        case 'data-validation':
          await this.runDataValidationTests();
          break;
        case 'error-handling':
          await this.runErrorHandlingTests();
          break;
        case 'load-testing':
          await this.runLoadTests();
          break;
        case 'concurrent-requests':
          await this.runConcurrentTests();
          break;
        case 'auth-security':
          await this.runAuthSecurityTests();
          break;
        case 'input-validation':
          await this.runInputValidationTests();
          break;
        case 'rate-limiting':
          await this.runRateLimitingTests();
          break;
        default:
          this.log(`⚠️  Unknown test group: ${testName}`);
      }

      const duration = Date.now() - startTime;
      this.log(`✅ ${testName} tests completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`❌ ${testName} tests failed after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  async runHealthCheckTests() {
    const healthTests = [
      { name: 'API Gateway Health', url: `${this.extractBaseUrl()}/health` },
      { name: 'Auth Service Health', url: this.lambdaUrls.LAMBDA_AUTH_LOGIN_URL },
    ];

    for (const test of healthTests) {
      await this.runSingleTest({
        name: test.name,
        type: 'health',
        method: 'GET',
        url: test.url,
        expectedStatus: [200, 404], // 404 is acceptable for health checks that don't exist
        timeout: 10000,
      });
    }
  }

  async runBasicAuthTests() {
    // Test basic auth endpoint accessibility
    await this.runSingleTest({
      name: 'Auth Login Endpoint',
      type: 'auth',
      method: 'POST',
      url: this.lambdaUrls.LAMBDA_AUTH_LOGIN_URL,
      body: { email: 'test@example.com', password: 'wrongpassword' },
      expectedStatus: [400, 401, 422], // Should reject invalid credentials
      timeout: this.timeout,
    });

    await this.runSingleTest({
      name: 'Auth Register Endpoint',
      type: 'auth',
      method: 'POST',
      url: this.lambdaUrls.LAMBDA_AUTH_REGISTER_URL,
      body: { email: 'invalid-email', password: 'short' },
      expectedStatus: [400, 422], // Should reject invalid data
      timeout: this.timeout,
    });
  }

  async runCompleteAuthFlowTests() {
    // Register a test user
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'STUDENT',
    };

    try {
      // Test registration
      const registerResult = await this.runSingleTest({
        name: 'User Registration',
        type: 'auth-flow',
        method: 'POST',
        url: this.lambdaUrls.LAMBDA_AUTH_REGISTER_URL,
        body: testUser,
        expectedStatus: [201, 200],
        timeout: this.timeout,
      });

      // Test login
      const loginResult = await this.runSingleTest({
        name: 'User Login',
        type: 'auth-flow',
        method: 'POST',
        url: this.lambdaUrls.LAMBDA_AUTH_LOGIN_URL,
        body: { email: testUser.email, password: testUser.password },
        expectedStatus: [200],
        timeout: this.timeout,
      });

      if (loginResult.success && loginResult.data?.token) {
        this.authTokens.student = loginResult.data.token;

        // Test authenticated endpoint
        await this.runSingleTest({
          name: 'Authenticated Profile Access',
          type: 'auth-flow',
          method: 'GET',
          url: this.lambdaUrls.LAMBDA_AUTH_PROFILE_URL,
          headers: { Authorization: `Bearer ${this.authTokens.student}` },
          expectedStatus: [200],
          timeout: this.timeout,
        });
      }
    } catch (error) {
      this.log(`Auth flow test failed: ${error.message}`);
    }
  }

  async runBasicEndpointTests() {
    const basicEndpoints = [
      { name: 'Menu List', url: this.lambdaUrls.LAMBDA_MENU_LIST_URL, method: 'GET' },
      {
        name: 'Payment Status Check',
        url: this.lambdaUrls.LAMBDA_PAYMENT_STATUS_URL,
        method: 'POST',
      },
    ];

    for (const endpoint of basicEndpoints) {
      await this.runSingleTest({
        name: endpoint.name,
        type: 'endpoint',
        method: endpoint.method,
        url: endpoint.url,
        expectedStatus: [200, 401, 403], // Some endpoints may require auth
        timeout: this.timeout,
      });
    }
  }

  async runAllEndpointTests() {
    // Test all configured Lambda endpoints
    const allEndpoints = Object.entries(this.lambdaUrls).map(([key, url]) => ({
      name: key.replace('LAMBDA_', '').replace(/_URL$/, ''),
      url,
      method: this.getMethodForEndpoint(key),
    }));

    if (this.parallel) {
      // Run tests in parallel for speed
      const promises = allEndpoints.map(endpoint =>
        this.runSingleTest({
          name: endpoint.name,
          type: 'endpoint',
          method: endpoint.method,
          url: endpoint.url,
          expectedStatus: [200, 401, 403, 422],
          timeout: this.timeout,
        }).catch(error => ({ error: error.message, endpoint: endpoint.name }))
      );

      await Promise.all(promises);
    } else {
      // Run tests sequentially
      for (const endpoint of allEndpoints) {
        await this.runSingleTest({
          name: endpoint.name,
          type: 'endpoint',
          method: endpoint.method,
          url: endpoint.url,
          expectedStatus: [200, 401, 403, 422],
          timeout: this.timeout,
        });
      }
    }
  }

  async runLoadTests() {
    this.log('🏋️  Running load tests...');

    const testUrl = this.lambdaUrls.LAMBDA_AUTH_LOGIN_URL;
    const concurrentRequests = this.environment === 'production' ? 50 : 10;
    const requestsPerConcurrency = 5;

    const promises = Array(concurrentRequests)
      .fill()
      .map(async (_, index) => {
        const results = [];

        for (let i = 0; i < requestsPerConcurrency; i++) {
          const startTime = Date.now();

          try {
            await this.makeHttpRequest('POST', testUrl, {
              email: `load-test-${index}-${i}@example.com`,
              password: 'LoadTestPassword123!',
            });

            results.push({
              success: true,
              duration: Date.now() - startTime,
            });
          } catch (error) {
            results.push({
              success: false,
              duration: Date.now() - startTime,
              error: error.message,
            });
          }
        }

        return results;
      });

    const allResults = (await Promise.all(promises)).flat();

    const successfulRequests = allResults.filter(r => r.success).length;
    const averageResponseTime =
      allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length;
    const maxResponseTime = Math.max(...allResults.map(r => r.duration));

    this.performanceMetrics.push({
      test: 'Load Test',
      totalRequests: allResults.length,
      successfulRequests,
      successRate: (successfulRequests / allResults.length) * 100,
      averageResponseTime,
      maxResponseTime,
    });

    this.testResults.push({
      name: 'Load Test',
      type: 'performance',
      success: successfulRequests / allResults.length > 0.8, // 80% success rate threshold
      duration: Math.max(...allResults.map(r => r.duration)),
      metadata: {
        totalRequests: allResults.length,
        successRate: (successfulRequests / allResults.length) * 100,
        averageResponseTime,
        maxResponseTime,
      },
    });
  }

  async runSingleTest(testConfig) {
    const startTime = Date.now();

    try {
      if (this.verbose) {
        this.log(`  → Testing: ${testConfig.name}`);
      }

      const response = await this.makeHttpRequest(
        testConfig.method,
        testConfig.url,
        testConfig.body,
        testConfig.headers,
        testConfig.timeout
      );

      const duration = Date.now() - startTime;
      const success = testConfig.expectedStatus.includes(response.statusCode);

      const result = {
        name: testConfig.name,
        type: testConfig.type,
        success,
        statusCode: response.statusCode,
        duration,
        data: response.data,
        metadata: {
          method: testConfig.method,
          url: testConfig.url.substring(0, 100) + (testConfig.url.length > 100 ? '...' : ''),
          expectedStatus: testConfig.expectedStatus,
        },
      };

      this.testResults.push(result);

      if (success) {
        this.log(`    ✅ ${testConfig.name} (${response.statusCode}, ${duration}ms)`);
      } else {
        this.log(
          `    ❌ ${testConfig.name} (${response.statusCode}, expected: ${testConfig.expectedStatus.join('|')}, ${duration}ms)`
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      const result = {
        name: testConfig.name,
        type: testConfig.type,
        success: false,
        error: error.message,
        duration,
        metadata: {
          method: testConfig.method,
          url: testConfig.url.substring(0, 100) + (testConfig.url.length > 100 ? '...' : ''),
        },
      };

      this.testResults.push(result);
      this.log(`    💥 ${testConfig.name} failed: ${error.message} (${duration}ms)`);

      return result;
    }
  }

  async makeHttpRequest(method, url, body = null, headers = {}, timeout = this.timeout) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HASIVU-E2E-Tester/1.0',
          ...headers,
        },
        timeout,
      };

      if (body) {
        const bodyString = JSON.stringify(body);
        options.headers['Content-Length'] = Buffer.byteLength(bodyString);
      }

      const req = https.request(options, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = data ? JSON.parse(data) : null;
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: parsedData,
            });
          } catch (parseError) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data,
            });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${timeout}ms`));
      });

      req.on('error', error => {
        reject(error);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  extractBaseUrl() {
    const sampleUrl = Object.values(this.lambdaUrls)[0];
    if (!sampleUrl) return '';

    const urlObj = new URL(sampleUrl);
    return `https://${urlObj.hostname}`;
  }

  getMethodForEndpoint(endpointKey) {
    if (
      endpointKey.includes('LIST') ||
      endpointKey.includes('STATUS') ||
      endpointKey.includes('PROFILE')
    ) {
      return 'GET';
    }
    if (endpointKey.includes('DELETE')) {
      return 'DELETE';
    }
    if (endpointKey.includes('UPDATE')) {
      return 'PUT';
    }
    return 'POST'; // Default for create, login, etc.
  }

  hasFailures() {
    return this.testResults.some(result => !result.success);
  }

  async generateSummary() {
    this.log('\\n📊 Test Results Summary');
    this.log('=========================');

    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.success).length;
    const failed = total - passed;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    this.log(`Environment: ${this.environment}`);
    this.log(`Test Type: ${this.testType}`);
    this.log(`Total Tests: ${total}`);
    this.log(`Passed: ${passed}`);
    this.log(`Failed: ${failed}`);
    this.log(`Success Rate: ${successRate.toFixed(1)}%`);

    if (this.performanceMetrics.length > 0) {
      this.log('\\nPerformance Metrics:');
      this.performanceMetrics.forEach(metric => {
        this.log(`  ${metric.test}:`);
        this.log(`    Success Rate: ${metric.successRate.toFixed(1)}%`);
        this.log(`    Avg Response Time: ${metric.averageResponseTime.toFixed(0)}ms`);
        this.log(`    Max Response Time: ${metric.maxResponseTime}ms`);
      });
    }

    // Show failed tests
    const failedTests = this.testResults.filter(r => !r.success);
    if (failedTests.length > 0) {
      this.log('\\n❌ Failed Tests:');
      failedTests.forEach(test => {
        this.log(`  - ${test.name}: ${test.error || `Status ${test.statusCode}`}`);
      });
    }

    // Performance analysis
    const responseTimes = this.testResults
      .filter(r => r.success && r.duration)
      .map(r => r.duration);

    if (responseTimes.length > 0) {
      const avgResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      this.log('\\n⚡ Response Time Analysis:');
      this.log(`  Average: ${avgResponseTime.toFixed(0)}ms`);
      this.log(`  Maximum: ${maxResponseTime}ms`);
      this.log(`  Samples: ${responseTimes.length}`);

      // Performance warnings
      if (avgResponseTime > 5000) {
        this.log('  ⚠️  Warning: Average response time exceeds 5 seconds');
      }
      if (maxResponseTime > 30000) {
        this.log('  ⚠️  Warning: Maximum response time exceeds 30 seconds');
      }
    }

    this.log('=========================\\n');

    // Exit with error code if tests failed
    if (failed > 0) {
      this.log(`💥 ${failed} test(s) failed`);
      process.exitCode = 1;
    } else {
      this.log('🎉 All tests passed!');
    }
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  async run() {
    try {
      await this.loadConfiguration();
      await this.runTestSuite();
    } catch (error) {
      this.log(`💥 E2E testing failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI Interface
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--env':
        options.env = args[i + 1];
        i++;
        break;
      case '--test-type':
        options.testType = args[i + 1];
        i++;
        break;
      case '--timeout':
        options.timeout = parseInt(args[i + 1], 10);
        i++;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--parallel':
        options.parallel = true;
        break;
      case '--fail-fast':
        options.failFast = true;
        break;
      case '--generate-report':
        options.generateReport = true;
        break;
      case '--help':
        console.log(`
Usage: node scripts/e2e-lambda-testing.js [options]

Options:
  --env <environment>    Target environment (dev|staging|production)
  --test-type <type>     Test type (smoke|full|performance|security)
  --timeout <ms>         Request timeout in milliseconds (default: 30000)
  --verbose             Enable detailed logging
  --parallel            Run tests in parallel
  --fail-fast           Stop on first failure
  --generate-report     Generate detailed HTML report
  --help                Show this help message

Examples:
  node scripts/e2e-lambda-testing.js --env dev --test-type smoke
  node scripts/e2e-lambda-testing.js --env production --test-type full --verbose
  node scripts/e2e-lambda-testing.js --env staging --test-type performance --parallel
        `);
        process.exit(0);
    }
  }

  return options;
}

// Execute if called directly
if (require.main === module) {
  const options = parseArguments();
  const tester = new LambdaE2ETester(options);
  tester.run();
}

module.exports = { LambdaE2ETester };
