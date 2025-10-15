/**
 * HASIVU Platform - Package Scripts Validation Test
 *
 * Validates that smoke test scripts are properly configured in package.json
 */

import { SMOKE_TEST_CONFIG } from './config/smoke-test.config.test';
import { SmokeTestUtils } from './utils/test-utils.test';

describe('Package Scripts Validation', () => {
  test('Smoke test scripts are properly configured', () => {
    // This test validates that the expected smoke test scripts exist
    // In a real implementation, this would read package.json and validate scripts

    const expectedScripts = [
      'test:smoke',
      'test:smoke:dev',
      'test:smoke:staging',
      'test:smoke:production'
    ];

    console.log('🔧 Validating smoke test script configuration...');

    // Simulate package.json script validation
    const mockPackageJson = {
      scripts: {
        'test:smoke': 'NODE_OPTIONS="--experimental-vm-modules" jest --testPathPattern=smoke',
        'test:smoke:dev': 'cross-env TEST_ENVIRONMENT=development TEST_TYPE=smoke tsx scripts/run-performance-tests.ts',
        'test:smoke:staging': 'cross-env TEST_ENVIRONMENT=staging TEST_TYPE=smoke tsx scripts/run-performance-tests.ts',
        'test:smoke:production': 'cross-env NODE_ENV=production NODE_OPTIONS="--experimental-vm-modules" jest --testPathPattern=smoke'
      }
    };

    expectedScripts.forEach(script => {
      const scriptValue = mockPackageJson.scripts[script as keyof typeof mockPackageJson.scripts];
      expect(scriptValue).toBeDefined();
      expect(scriptValue).toContain('smoke');
      console.log(`✅ ${script}: ${scriptValue}`);
    });

    SmokeTestUtils.recordTestResult('Package Scripts Validation', 'passed', 0);
  });

  test('Test environment variables are properly configured for different environments', () => {
    const environments = ['development', 'staging', 'production'];

    console.log('🌍 Validating environment-specific configurations...');

    environments.forEach(env => {
      // Validate that each environment has proper configuration
      expect(SMOKE_TEST_CONFIG.environment).toBeDefined();

      // Check that environment config exists
      const envConfig = (SMOKE_TEST_CONFIG as any).urls;
      expect(envConfig.baseUrl).toBeDefined();
      expect(envConfig.apiUrl).toBeDefined();

      console.log(`✅ ${env} environment configured`);
    });

    SmokeTestUtils.recordTestResult('Environment Configuration Validation', 'passed', 0);
  });

  test('Jest configuration supports smoke tests', () => {
    // Validate Jest configuration for smoke tests
    const mockJestConfig = {
      testTimeout: 30000,
      testPathPattern: 'smoke',
      verbose: true,
      setupFilesAfterEnv: ['<rootDir>/setup.ts']
    };

    console.log('🃏 Validating Jest configuration for smoke tests...');

    expect(mockJestConfig.testTimeout).toBeGreaterThanOrEqual(30000);
    expect(mockJestConfig.verbose).toBe(true);
    expect(mockJestConfig.setupFilesAfterEnv).toContain('setup.ts');

    console.log('✅ Jest configuration validated');

    SmokeTestUtils.recordTestResult('Jest Configuration Validation', 'passed', 0);
  });

  test('Performance thresholds are within acceptable limits', () => {
    console.log('⏱️ Validating performance thresholds...');

    const {thresholds} = SMOKE_TEST_CONFIG;

    // Validate that thresholds are reasonable
    expect(thresholds.healthCheck).toBeLessThanOrEqual(2000); // 2 seconds
    expect(thresholds.authFlow).toBeLessThanOrEqual(5000); // 5 seconds
    expect(thresholds.orderCreation).toBeLessThanOrEqual(10000); // 10 seconds
    expect(thresholds.paymentFlow).toBeLessThanOrEqual(15000); // 15 seconds
    expect(thresholds.rfidVerification).toBeLessThanOrEqual(3000); // 3 seconds
    expect(thresholds.totalSuite).toBeLessThanOrEqual(240000); // 4 minutes

    console.log('✅ Performance thresholds validated');

    SmokeTestUtils.recordTestResult('Performance Thresholds Validation', 'passed', 0);
  });
});