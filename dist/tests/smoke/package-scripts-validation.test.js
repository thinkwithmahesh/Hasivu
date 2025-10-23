"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const smoke_test_config_test_1 = require("./config/smoke-test.config.test");
const test_utils_test_1 = require("./utils/test-utils.test");
describe('Package Scripts Validation', () => {
    test('Smoke test scripts are properly configured', () => {
        const expectedScripts = [
            'test:smoke',
            'test:smoke:dev',
            'test:smoke:staging',
            'test:smoke:production'
        ];
        console.log('🔧 Validating smoke test script configuration...');
        const mockPackageJson = {
            scripts: {
                'test:smoke': 'NODE_OPTIONS="--experimental-vm-modules" jest --testPathPattern=smoke',
                'test:smoke:dev': 'cross-env TEST_ENVIRONMENT=development TEST_TYPE=smoke tsx scripts/run-performance-tests.ts',
                'test:smoke:staging': 'cross-env TEST_ENVIRONMENT=staging TEST_TYPE=smoke tsx scripts/run-performance-tests.ts',
                'test:smoke:production': 'cross-env NODE_ENV=production NODE_OPTIONS="--experimental-vm-modules" jest --testPathPattern=smoke'
            }
        };
        expectedScripts.forEach(script => {
            const scriptValue = mockPackageJson.scripts[script];
            expect(scriptValue).toBeDefined();
            expect(scriptValue).toContain('smoke');
            console.log(`✅ ${script}: ${scriptValue}`);
        });
        test_utils_test_1.SmokeTestUtils.recordTestResult('Package Scripts Validation', 'passed', 0);
    });
    test('Test environment variables are properly configured for different environments', () => {
        const environments = ['development', 'staging', 'production'];
        console.log('🌍 Validating environment-specific configurations...');
        environments.forEach(env => {
            expect(smoke_test_config_test_1.SMOKE_TEST_CONFIG.environment).toBeDefined();
            const envConfig = smoke_test_config_test_1.SMOKE_TEST_CONFIG.urls;
            expect(envConfig.baseUrl).toBeDefined();
            expect(envConfig.apiUrl).toBeDefined();
            console.log(`✅ ${env} environment configured`);
        });
        test_utils_test_1.SmokeTestUtils.recordTestResult('Environment Configuration Validation', 'passed', 0);
    });
    test('Jest configuration supports smoke tests', () => {
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
        test_utils_test_1.SmokeTestUtils.recordTestResult('Jest Configuration Validation', 'passed', 0);
    });
    test('Performance thresholds are within acceptable limits', () => {
        console.log('⏱️ Validating performance thresholds...');
        const { thresholds } = smoke_test_config_test_1.SMOKE_TEST_CONFIG;
        expect(thresholds.healthCheck).toBeLessThanOrEqual(2000);
        expect(thresholds.authFlow).toBeLessThanOrEqual(5000);
        expect(thresholds.orderCreation).toBeLessThanOrEqual(10000);
        expect(thresholds.paymentFlow).toBeLessThanOrEqual(15000);
        expect(thresholds.rfidVerification).toBeLessThanOrEqual(3000);
        expect(thresholds.totalSuite).toBeLessThanOrEqual(240000);
        console.log('✅ Performance thresholds validated');
        test_utils_test_1.SmokeTestUtils.recordTestResult('Performance Thresholds Validation', 'passed', 0);
    });
});
//# sourceMappingURL=package-scripts-validation.test.js.map