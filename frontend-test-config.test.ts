/**
 * HASIVU Platform - Frontend Testing Configuration
 * Comprehensive test suite for frontend components and schema validation
 */

import { TestRunner, TestSuiteConfig } from './src/testing/test-runner';

// Test configuration for frontend testing
export const frontendTestConfig: TestSuiteConfig = {
  environment: 'development',
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  retries: 3,

  // Enable all test types for comprehensive frontend testing
  enableE2E: true,
  enableLoad: true,
  enableChaos: false, // Disable chaos testing for frontend
  enablePerformanceMonitoring: true,

  // Concurrent execution for faster testing
  concurrent: true,
  maxConcurrency: 3,
  failFast: false,
  continueOnError: true,

  // Test configurations with proper E2E config structure
  e2eConfig: {
    baseUrl: 'http://localhost:3000',
    timeout: 30000,
    retries: 2,
    testDatabase: {
      host: 'localhost',
      port: 5432,
      database: 'hasivu_test',
      username: 'test_user',
      password: 'test_password'
    },
    testUser: {
      email: 'test@hasivu.com',
      password: 'test123'
    },
    enableScreenshots: true,
    headless: false,
    browserViewport: {
      width: 1280,
      height: 720
    }
  },

  loadConfig: {
    baseUrl: 'http://localhost:3000',
    duration: 300, // 5 minutes
    maxConcurrentUsers: 100,
    rampUpTime: 60,
    rampDownTime: 30,
    requestDelay: 50,
    environment: 'development',
    targets: {
      responseTime: 1000, // 1 second average
      throughput: 200, // 200 requests/second
      errorRate: 2, // 2% max error rate
      p95ResponseTime: 2000, // 2 seconds 95th percentile
      p99ResponseTime: 3000 // 3 seconds 99th percentile
    },
    retryConfig: {
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true
    },
    monitoring: {
      enableTracing: true,
      enableResourceMonitoring: true,
      collectGCMetrics: true,
      enableRequestLogging: true
    },
    warmup: {
      enabled: true,
      duration: 60,
      concurrency: 10
    }
  },

  chaosConfig: {}, // Not used for frontend testing

  // Reporting configuration
  reporting: {
    enabled: true,
    outputPath: './test-reports/frontend',
    formats: ['json', 'html', 'junit'],
    includeMetrics: true,
    includeLogs: true,
    includeArtifacts: true
  },

  // Notifications for test failures
  notifications: {
    enabled: true,
    channels: ['email'],
    recipients: ['qa@hasivu.com'],
    webhookUrl: undefined,
    onFailure: true,
    onSuccess: false,
    onThreshold: {
      enabled: true,
      passRateThreshold: 95,
      responseTimeThreshold: 2000,
      resilienceScoreThreshold: 80
    }
  },

  // Resource limits
  resourceLimits: {
    maxMemoryUsage: 1024, // MB
    maxCpuUsage: 80, // percentage
    maxDuration: 1800, // 30 minutes
    maxConcurrentConnections: 100
  },

  // Cleanup configuration
  cleanup: {
    enabled: true,
    retainReports: 30, // days
    retainLogs: 7,
    retainArtifacts: 14,
    autoCleanup: true
  }
};

/**
 * Schema validation test cases
 * Tests for oldSchema and newSchema compatibility
 */
export const schemaValidationTests = [
  {
    name: 'Menu Item Schema Evolution',
    description: 'Test compatibility between old and new menu item schemas',
    testFunction: async () => {
      // Import schema validation functions
      const { SchemaEvolutionManager } = await import('./src/analytics/data-warehouse/etl/etl-support-classes');

      const oldSchema = {
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', required: true },
          { name: 'price', type: 'number', required: true }
        ]
      };

      const newSchema = {
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', required: true },
          { name: 'price', type: 'number', required: true },
          { name: 'description', type: 'string', required: false },
          { name: 'category', type: 'string', required: false }
        ]
      };

      const schemaManager = new SchemaEvolutionManager({
        enabled: true,
        strategy: 'permissive',
        compatibility: 'backward',
        conflictResolution: {
          addColumn: 'allow',
          removeColumn: 'deny',
          changeType: 'deny',
          renameColumn: 'deny'
        }
      });
      const isCompatible = await schemaManager.validateSchemaCompatibility(oldSchema, newSchema);
      if (!isCompatible) {
        throw new Error('Schema evolution failed: new schema not backward compatible');
      }
      return { success: true, message: 'Schema evolution successful' };
    }
  },
  {
    name: 'Order Schema Validation',
    description: 'Test order schema validation and transformation',
    testFunction: async () => {
      const { SchemaEvolutionManager } = await import('./src/analytics/data-warehouse/etl/etl-support-classes');

      const oldSchema = {
        fields: [
          { name: 'orderId', type: 'string' },
          { name: 'items', type: 'array' },
          { name: 'total', type: 'number' }
        ]
      };

      const newSchema = {
        fields: [
          { name: 'orderId', type: 'string' },
          { name: 'items', type: 'array' },
          { name: 'total', type: 'number' },
          { name: 'tax', type: 'number' },
          { name: 'discount', type: 'number' }
        ]
      };

      const schemaManager = new SchemaEvolutionManager({
        enabled: true,
        strategy: 'permissive',
        compatibility: 'backward',
        conflictResolution: {
          addColumn: 'allow',
          removeColumn: 'deny',
          changeType: 'deny',
          renameColumn: 'deny'
        }
      });

      await schemaManager.evolveSchema(oldSchema, newSchema);
      return { success: true, message: 'Order schema evolution completed' };
    }
  }
];

/**
 * Frontend component tests
 */
export const componentTests = [
  {
    name: 'PaymentTestingDashboard Component',
    description: 'Test PaymentTestingDashboard component functionality',
    testFunction: async () => {
      // This would typically use React Testing Library
      // For now, we'll simulate component testing
      const componentExists = await checkComponentExists('PaymentTestingDashboard');
      if (!componentExists) {
        throw new Error('PaymentTestingDashboard component not found');
      }
      return { success: true, message: 'Component exists and is accessible' };
    }
  },
  {
    name: 'Menu Display Components',
    description: 'Test menu display and interaction components',
    testFunction: async () => {
      const components = ['DailyMenuDisplay', 'MenuItem', 'MenuCategory'];
      for (const component of components) {
        const exists = await checkComponentExists(component);
        if (!exists) {
          throw new Error(`Component ${component} not found`);
        }
      }
      return { success: true, message: 'All menu components verified' };
    }
  }
];

/**
 * Utility function to check if component exists
 */
async function checkComponentExists(componentName: string): Promise<boolean> {
  try {
    // This is a simplified check - in real testing, we'd use proper component testing
    const fs = await import('fs');
    const path = await import('path');

    const componentPath = path.join(process.cwd(), 'web/src/components', `${componentName}.tsx`);
    await fs.promises.access(componentPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Main test execution function
 */
export async function runFrontendTests(): Promise<void> {
  console.log('🚀 Starting HASIVU Frontend Testing Suite');

  try {
    // Initialize test runner
    const testRunner = TestRunner.getInstance(frontendTestConfig);

    // Run E2E tests
    console.log('📋 Running E2E Tests...');
    const e2eResults = await testRunner.runTestSuite();

    // Run schema validation tests
    console.log('🔍 Running Schema Validation Tests...');
    for (const test of schemaValidationTests) {
      try {
        console.log(`Testing: ${test.name}`);
        const result = await test.testFunction();
        console.log(`✅ ${test.name}: ${result.message}`);
      } catch (error) {
        console.error(`❌ ${test.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Run component tests
    console.log('🧩 Running Component Tests...');
    for (const test of componentTests) {
      try {
        console.log(`Testing: ${test.name}`);
        const result = await test.testFunction();
        console.log(`✅ ${test.name}: ${result.message}`);
      } catch (error) {
        console.error(`❌ ${test.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Generate final report
    console.log('\n📊 Test Results Summary:');
    console.log(`Overall Status: ${e2eResults.overallStatus.toUpperCase()}`);
    console.log(`Total Tests: ${e2eResults.totalTests}`);
    console.log(`Passed: ${e2eResults.passedTests}`);
    console.log(`Failed: ${e2eResults.failedTests}`);
    console.log(`Pass Rate: ${e2eResults.totalTests > 0 ? ((e2eResults.passedTests / e2eResults.totalTests) * 100).toFixed(1) : 0}%`);

    if (e2eResults.issues.length > 0) {
      console.log('\n⚠️ Issues Found:');
      e2eResults.issues.forEach(issue => {
        console.log(`- ${issue.severity.toUpperCase()}: ${issue.title}`);
        console.log(`  ${issue.description}`);
      });
    }

    if (e2eResults.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      e2eResults.recommendations.forEach(rec => {
        console.log(`- ${rec}`);
      });
    }

  } catch (error) {
    console.error('❌ Frontend testing failed:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

// Export for use in other test files
export { TestRunner };