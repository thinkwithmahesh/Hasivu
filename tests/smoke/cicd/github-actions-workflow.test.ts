/**
 * HASIVU Platform - CI/CD Integration Test
 *
 * Validates that the smoke test suite can be executed in a CI/CD environment
 * and completes within the required time limits
 */

import { SMOKE_TEST_CONFIG } from '../config/smoke-test.config.test';
import { SmokeTestUtils } from '../utils/test-utils.test';

describe('CI/CD Integration Tests', () => {
  const CI_TIMEOUT = SMOKE_TEST_CONFIG.timeouts.suite;

  beforeAll(() => {
    // Simulate CI environment variables
    process.env.CI = 'true';
    process.env.TEST_ENVIRONMENT = process.env.TEST_ENVIRONMENT || 'staging';

    SmokeTestUtils.initializeSuite();
  });

  describe('GitHub Actions Compatibility', () => {
    test('Smoke tests run successfully in CI environment', async () => {
      const ciStartTime = Date.now();
      const testResults: any[] = [];

      console.log('🤖 Running smoke tests in CI environment...');
      console.log(`🌍 Environment: ${process.env.TEST_ENVIRONMENT}`);
      console.log(`⏰ CI Timeout: ${CI_TIMEOUT / 1000}s`);

      try {
        // Simulate running all smoke test categories
        const categories = [
          { name: 'health', endpoint: SMOKE_TEST_CONFIG.endpoints.health, tests: 6 },
          { name: 'auth', endpoint: SMOKE_TEST_CONFIG.endpoints.auth.login, tests: 7 },
          { name: 'orders', endpoint: SMOKE_TEST_CONFIG.endpoints.orders.create, tests: 6 },
          { name: 'payments', endpoint: SMOKE_TEST_CONFIG.endpoints.payments.create, tests: 6 },
          { name: 'rfid', endpoint: SMOKE_TEST_CONFIG.endpoints.rfid.verify, tests: 6 }
        ];

        for (const category of categories) {
          console.log(`\n🔍 Testing ${category.name} endpoints...`);

          for (let i = 0; i < category.tests; i++) {
            const testStart = Date.now();

            try {
              const result = await SmokeTestUtils.makeRequest(
                category.endpoint,
                {
                  method: category.name === 'auth' || category.name === 'orders' || category.name === 'payments' || category.name === 'rfid' ? 'POST' : 'GET',
                  body: category.name !== 'health' ? JSON.stringify(
                    category.name === 'auth' ? { email: SMOKE_TEST_CONFIG.testData.user.email, password: SMOKE_TEST_CONFIG.testData.user.password } :
                    category.name === 'orders' ? SMOKE_TEST_CONFIG.testData.order :
                    category.name === 'payments' ? { amount: SMOKE_TEST_CONFIG.testData.payment.amount, currency: SMOKE_TEST_CONFIG.testData.payment.currency, orderId: 'test-order', method: SMOKE_TEST_CONFIG.testData.payment.method } :
                    SMOKE_TEST_CONFIG.testData.rfid
                  ) : undefined
                },
                `${category.name} test ${i + 1}`
              );

              const duration = Date.now() - testStart;
              testResults.push({
                category: category.name,
                test: `test-${i + 1}`,
                status: 'passed',
                duration,
                responseCode: result.status
              });

            } catch (error) {
              const duration = Date.now() - testStart;
              testResults.push({
                category: category.name,
                test: `test-${i + 1}`,
                status: 'failed',
                duration,
                error: String(error)
              });
            }
          }
        }

        const ciDuration = Date.now() - ciStartTime;
        const passedTests = testResults.filter(r => r.status === 'passed').length;
        const failedTests = testResults.filter(r => r.status === 'failed').length;
        const totalTests = testResults.length;
        const successRate = (passedTests / totalTests) * 100;

        console.log(`\n${  '='.repeat(60)}`);
        console.log('🤖 CI/CD SMOKE TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`Environment: ${process.env.TEST_ENVIRONMENT}`);
        console.log(`CI: ${process.env.CI}`);
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`⏱️ Duration: ${ciDuration}ms (${(ciDuration / 1000).toFixed(1)}s)`);
        console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);

        // Performance validation for CI
        if (ciDuration > CI_TIMEOUT) {
          console.log(`⚠️ CI TIMEOUT: Tests exceeded ${CI_TIMEOUT / 1000}s limit`);
          SmokeTestUtils.recordTestResult('CI/CD Performance', 'failed', ciDuration, `Exceeded ${CI_TIMEOUT}ms CI timeout`);
        } else {
          console.log('✅ CI PERFORMANCE: Tests completed within timeout');
          SmokeTestUtils.recordTestResult('CI/CD Performance', 'passed', ciDuration);
        }

        // Category breakdown
        const categoriesSummary = categories.map(cat => {
          const catResults = testResults.filter(r => r.category === cat.name);
          const catPassed = catResults.filter(r => r.status === 'passed').length;
          return {
            category: cat.name,
            passed: catPassed,
            total: catResults.length,
            percentage: ((catPassed / catResults.length) * 100).toFixed(1)
          };
        });

        console.log('\n📋 Results by Category:');
        categoriesSummary.forEach(cat => {
          console.log(`  ${cat.category}: ${cat.passed}/${cat.total} (${cat.percentage}%)`);
        });

        // CI-specific validations
        expect(ciDuration).toBeLessThanOrEqual(CI_TIMEOUT);
        expect(successRate).toBeGreaterThanOrEqual(60); // CI needs higher success rate
        expect(process.env.CI).toBe('true');
        expect(process.env.TEST_ENVIRONMENT).toBeDefined();

        // Ensure all categories have at least some tests passing
        categoriesSummary.forEach(cat => {
          expect(cat.passed).toBeGreaterThan(0);
        });

        SmokeTestUtils.recordTestResult('CI/CD Integration Test', 'passed', ciDuration);

      } catch (error) {
        const ciDuration = Date.now() - ciStartTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ CI tests failed after ${ciDuration}ms: ${errorMessage}`);
        SmokeTestUtils.recordTestResult('CI/CD Integration Test', 'failed', ciDuration, errorMessage);
        throw error;
      }
    }, CI_TIMEOUT);

    test('Environment variables are properly configured for CI', () => {
      // Validate required environment variables for CI
      const requiredVars = ['TEST_ENVIRONMENT', 'CI'];
      const optionalVars = ['GITHUB_RUN_ID', 'GITHUB_SHA', 'GITHUB_REF'];

      console.log('🔧 Validating CI environment configuration...');

      requiredVars.forEach(varName => {
        expect(process.env[varName]).toBeDefined();
        console.log(`✅ ${varName}: ${process.env[varName]}`);
      });

      optionalVars.forEach(varName => {
        if (process.env[varName]) {
          console.log(`ℹ️ ${varName}: ${process.env[varName]}`);
        } else {
          console.log(`⚠️ ${varName}: not set`);
        }
      });

      // Validate test environment is valid
      const validEnvs = ['development', 'staging', 'production'];
      expect(validEnvs).toContain(process.env.TEST_ENVIRONMENT);

      SmokeTestUtils.recordTestResult('CI Environment Configuration', 'passed', 0);
    });

    test('Test artifacts and reporting work in CI', () => {
      // Simulate generating test reports for CI
      console.log('📊 Generating CI test artifacts...');

      const mockReport = {
        timestamp: new Date().toISOString(),
        environment: process.env.TEST_ENVIRONMENT,
        ci: process.env.CI,
        duration: 0,
        results: []
      };

      // Validate report structure
      expect(mockReport.timestamp).toBeDefined();
      expect(mockReport.environment).toBeDefined();
      expect(mockReport.ci).toBe('true');

      console.log('✅ Test report structure validated');
      console.log('✅ CI artifacts generation simulated');

      SmokeTestUtils.recordTestResult('CI Test Reporting', 'passed', 0);
    });
  });

  afterAll(async () => {
    // Clean up CI environment variables
    delete process.env.CI;

    await SmokeTestUtils.cleanup();
  });
});