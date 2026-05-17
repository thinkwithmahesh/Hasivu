/**
 * HASIVU Platform - Smoke Test Utilities
 *
 * Helper functions for smoke test execution including HTTP requests,
 * authentication, retry logic, and performance monitoring.
 */

import fetch from 'node-fetch';
import { SMOKE_TEST_CONFIG, buildUrl } from '../config/smoke-test.config.test';
import { TestResult, SuiteResult, RetryConfig } from './test-types';

export class SmokeTestUtils {
  private static authToken: string | null = null;
  private static testResults: TestResult[] = [];
  private static suiteStartTime: number = 0;

  /**
   * Initialize the smoke test suite
   */
  static initializeSuite(): void {
    this.suiteStartTime = Date.now();
    this.testResults = [];
    console.log(`🚀 Starting HASIVU Platform Smoke Tests`);
    console.log(`🌍 Environment: ${SMOKE_TEST_CONFIG.environment}`);
    console.log(`⏰ Suite Timeout: ${SMOKE_TEST_CONFIG.timeouts.suite / 1000}s`);
    console.log(`🔗 API Base: ${SMOKE_TEST_CONFIG.urls.apiUrl}`);
    console.log('─'.repeat(60));
  }

  /**
   * Make HTTP request with retry logic and performance tracking
   */
  static async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    testName: string
  ): Promise<{ response: any; status: number; duration: number }> {
    const startTime = Date.now();
    const url = buildUrl(endpoint);
    const {maxRetries} = SMOKE_TEST_CONFIG.retry;

    console.log(`🔍 Testing: ${testName}`);
    console.log(`📡 ${options.method || 'GET'} ${url}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'HASIVU-Smoke-Test/1.0',
        };

        if (this.authToken) {
          headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        if (options.headers) {
          Object.assign(headers, options.headers);
        }

        const response = await fetch(url, {
          ...options,
          headers
        } as any);

        const duration = Date.now() - startTime;
        const {status} = response;

        console.log(`📊 Response: ${status} (${duration}ms)`);

        // Check if response is successful or acceptable
        const acceptableStatuses = [
          ...SMOKE_TEST_CONFIG.responses.success,
          ...SMOKE_TEST_CONFIG.responses.authRequired,
          ...SMOKE_TEST_CONFIG.responses.notFound,
          ...SMOKE_TEST_CONFIG.responses.validationError
        ];

        if (acceptableStatuses.includes(status) || attempt === maxRetries) {
          let responseData;
          try {
            responseData = await response.json();
          } catch {
            responseData = { message: 'Non-JSON response' };
          }

          return { response: responseData, status, duration };
        }

        // Retry on server errors
        if (SMOKE_TEST_CONFIG.responses.serverError.includes(status) && attempt < maxRetries) {
          const delay = SMOKE_TEST_CONFIG.retry.retryDelay * Math.pow(SMOKE_TEST_CONFIG.retry.backoffMultiplier, attempt - 1);
          console.log(`⏳ Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

      } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`❌ Network error: ${error instanceof Error ? error.message : String(error)} (${duration}ms)`);

        if (attempt === maxRetries) {
          throw error;
        }

        const delay = SMOKE_TEST_CONFIG.retry.retryDelay * Math.pow(SMOKE_TEST_CONFIG.retry.backoffMultiplier, attempt - 1);
        console.log(`⏳ Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(`Failed to get acceptable response after ${maxRetries} attempts`);
  }

  /**
   * Authenticate and store token for subsequent requests
   */
  static async authenticate(): Promise<boolean> {
    try {
      console.log('🔐 Attempting authentication...');

      // First try to register a test user
      const registerResult = await this.makeRequest(
        SMOKE_TEST_CONFIG.endpoints.auth.register,
        {
          method: 'POST',
          body: JSON.stringify(SMOKE_TEST_CONFIG.testData.user)
        },
        'User Registration'
      );

      // If registration fails (user exists), try login
      if (!SMOKE_TEST_CONFIG.responses.success.includes(registerResult.status)) {
        console.log('📝 User might already exist, attempting login...');

        const loginResult = await this.makeRequest(
          SMOKE_TEST_CONFIG.endpoints.auth.login,
          {
            method: 'POST',
            body: JSON.stringify({
              email: SMOKE_TEST_CONFIG.testData.user.email,
              password: SMOKE_TEST_CONFIG.testData.user.password
            })
          },
          'User Login'
        );

        if (SMOKE_TEST_CONFIG.responses.success.includes(loginResult.status)) {
          this.authToken = loginResult.response.token || loginResult.response.accessToken;
          console.log('✅ Authentication successful');
          return true;
        }
      } else {
        this.authToken = registerResult.response.token || registerResult.response.accessToken;
        console.log('✅ Registration and authentication successful');
        return true;
      }

      console.log('❌ Authentication failed');
      return false;
    } catch (error) {
      console.log(`❌ Authentication error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Record test result
   */
  static recordTestResult(testName: string, status: 'passed' | 'failed' | 'skipped', duration: number, error?: string, responseCode?: number): void {
    const result: TestResult = {
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

  /**
   * Check if performance threshold is met
   */
  static checkPerformanceThreshold(testName: string, duration: number, threshold: number): boolean {
    if (duration > threshold) {
      console.log(`⚠️ Performance warning: ${testName} took ${duration}ms (threshold: ${threshold}ms)`);
      return false;
    }
    return true;
  }

  /**
   * Validate response status
   */
  static validateResponseStatus(status: number, expectedStatuses: number[]): boolean {
    return expectedStatuses.includes(status);
  }

  /**
   * Generate suite summary
   */
  static generateSuiteSummary(): SuiteResult {
    const totalDuration = Date.now() - this.suiteStartTime;
    const passedTests = this.testResults.filter(r => r.status === 'passed').length;
    const failedTests = this.testResults.filter(r => r.status === 'failed').length;
    const skippedTests = this.testResults.filter(r => r.status === 'skipped').length;
    const totalTests = this.testResults.length;

    const summary: SuiteResult = {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalDuration,
      results: this.testResults,
      environment: SMOKE_TEST_CONFIG.environment,
      timestamp: new Date().toISOString()
    };

    console.log(`\n${  '='.repeat(60)}`);
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

    if (totalDuration > SMOKE_TEST_CONFIG.thresholds.totalSuite) {
      console.log(`⚠️ PERFORMANCE WARNING: Suite exceeded ${SMOKE_TEST_CONFIG.thresholds.totalSuite / 1000}s limit`);
    } else {
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

  /**
   * Clean up test data (if needed)
   */
  static async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    // Add cleanup logic here if needed
    this.authToken = null;
  }

  /**
   * Get current auth token
   */
  static getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Check if suite should continue (based on critical failures)
   */
  static shouldContinueSuite(): boolean {
    // Continue if we have at least some passing tests or if it's early in the suite
    const criticalTests = ['Health Check', 'Authentication'];
    const criticalFailures = this.testResults.filter(r =>
      criticalTests.includes(r.testName) && r.status === 'failed'
    ).length;

    return criticalFailures === 0 || this.testResults.length < criticalTests.length;
  }
}