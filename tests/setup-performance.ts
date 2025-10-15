/**
 * Performance Test Setup Configuration
 * Enhanced setup for performance, load, and stress testing
 */

import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

// Load test environment variables
config({ path: '.env.test' });

// Performance test configuration
const PERFORMANCE_CONFIG = {
  targetUrl: process.env.PERFORMANCE_TEST_URL || 'http://localhost:3001',
  apiKey: process.env.PERFORMANCE_API_KEY || 'test-api-key',
  testTimeout: 600000, // 10 minutes for performance tests
  thresholds: {
    responseTime: {
      api: 200, // 200ms for API endpoints
      database: 100, // 100ms for database operations
      cache: 50, // 50ms for cache operations
      fileUpload: 5000, // 5s for file uploads
      auth: 300 // 300ms for authentication
    },
    throughput: {
      minRps: 100, // Minimum requests per second
      targetRps: 500, // Target requests per second
      peakRps: 1000 // Peak requests per second
    },
    resources: {
      maxMemoryMB: 512, // Maximum memory usage in MB
      maxCpuPercent: 80, // Maximum CPU usage percentage
      maxConnections: 1000 // Maximum concurrent connections
    },
    availability: {
      uptime: 99.9, // 99.9% uptime requirement
      errorRate: 0.1 // Maximum 0.1% error rate
    }
  },
  loadTest: {
    rampUpUsers: [10, 50, 100, 250, 500, 750, 1000],
    testDuration: 300, // 5 minutes per load test
    cooldownTime: 60 // 1 minute cooldown between tests
  },
  reports: {
    outputDir: './test-results/performance',
    summaryReport: 'performance-summary.json',
    detailedReport: 'performance-detailed.json',
    loadTestReport: 'load-test-results.json',
    stressTestReport: 'stress-test-results.json'
  }
};

// Performance metrics tracking
interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: number;
  endpoint: string;
  testType: string;
  userLoad: number;
}

interface LoadTestResult {
  userCount: number;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  memoryPeak: number;
  cpuPeak: number;
}

// Global performance test state
interface PerformanceTestState {
  metrics: PerformanceMetrics[];
  loadTestResults: LoadTestResult[];
  currentTestStartTime: number;
  baselineMetrics: Map<string, PerformanceMetrics>;
  performanceAlerts: string[];
}

declare global {
  var performanceTestState: PerformanceTestState;
}

beforeAll(async () => {
  console.log('⚡ Setting up performance test environment...');

  // Initialize performance test state
  global.performanceTestState = {
    metrics: [],
    loadTestResults: [],
    currentTestStartTime: 0,
    baselineMetrics: new Map(),
    performanceAlerts: []
  };

  // Create reports directory
  try {
    await fs.mkdir(PERFORMANCE_CONFIG.reports.outputDir, { recursive: true });
    console.log('✅ Performance reports directory created');
  } catch (error) {
    console.error('❌ Failed to create reports directory:', error);
  }

  // Establish baseline performance metrics
  await establishBaseline();

  console.log('✅ Performance test environment setup complete');
}, 60000);

beforeEach(async () => {
  // Record test start time
  global.performanceTestState.currentTestStartTime = performance.now();

  // Clear test-specific metrics
  global.performanceTestState.performanceAlerts = [];
});

afterEach(async () => {
  // Generate test-specific performance report
  const testName = expect.getState().currentTestName || 'unknown';
  await generatePerformanceReport(testName);
});

afterAll(async () => {
  console.log('📊 Generating comprehensive performance report...');

  try {
    // Generate final performance reports
    await generateFinalPerformanceReport();
    console.log('✅ Performance testing completed');
  } catch (error) {
    console.error('❌ Failed to generate performance report:', error);
  }
});

// Performance testing helper functions
export const performanceHelpers = {
  // Response time testing
  async measureResponseTime(endpoint: string, method: string = 'GET', body?: any) {
    const startTime = performance.now();

    try {
      const response = await fetch(`${PERFORMANCE_CONFIG.targetUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PERFORMANCE_CONFIG.apiKey}`
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      const metric: PerformanceMetrics = {
        responseTime,
        throughput: 1, // Single request
        errorRate: response.ok ? 0 : 1,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: 0, // TODO: Implement CPU monitoring
        timestamp: Date.now(),
        endpoint,
        testType: 'response-time',
        userLoad: 1
      };

      global.performanceTestState.metrics.push(metric);

      // Check against thresholds
      await checkPerformanceThreshold(endpoint, responseTime);

      return {
        responseTime,
        success: response.ok,
        status: response.status,
        metric
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      const metric: PerformanceMetrics = {
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

  // Load testing
  async performLoadTest(endpoint: string, userCounts: number[] = PERFORMANCE_CONFIG.loadTest.rampUpUsers) {
    const results: LoadTestResult[] = [];

    for (const userCount of userCounts) {
      console.log(`🔄 Running load test with ${userCount} concurrent users...`);

      const startTime = performance.now();
      const promises: Promise<any>[] = [];
      let successCount = 0;
      let errorCount = 0;
      const responseTimes: number[] = [];

      // Create concurrent requests
      for (let i = 0; i < userCount; i++) {
        const promise = (async () => {
          const requestStart = performance.now();
          try {
            const response = await fetch(`${PERFORMANCE_CONFIG.targetUrl}${endpoint}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${PERFORMANCE_CONFIG.apiKey}`
              }
            });

            const requestEnd = performance.now();
            const responseTime = requestEnd - requestStart;
            responseTimes.push(responseTime);

            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            const requestEnd = performance.now();
            const responseTime = requestEnd - requestStart;
            responseTimes.push(responseTime);
            errorCount++;
          }
        })();

        promises.push(promise);

        // Stagger request starts to simulate realistic load
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Wait for all requests to complete
      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Calculate statistics
      responseTimes.sort((a, b) => a - b);
      const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const p95Index = Math.floor(responseTimes.length * 0.95);
      const p99Index = Math.floor(responseTimes.length * 0.99);

      const result: LoadTestResult = {
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
        cpuPeak: 0 // TODO: Implement CPU monitoring
      };

      results.push(result);
      global.performanceTestState.loadTestResults.push(result);

      // Check if we should continue (error rate too high)
      if (result.errorRate > 10) {
        console.log(`⚠️ Stopping load test due to high error rate: ${result.errorRate}%`);
        break;
      }

      // Cooldown between tests
      if (userCounts.indexOf(userCount) < userCounts.length - 1) {
        console.log(`⏳ Cooling down for ${PERFORMANCE_CONFIG.loadTest.cooldownTime}s...`);
        await new Promise(resolve => setTimeout(resolve, PERFORMANCE_CONFIG.loadTest.cooldownTime * 1000));
      }
    }

    return results;
  },

  // Stress testing
  async performStressTest(endpoint: string, maxUsers: number = 2000, stepSize: number = 100) {
    console.log(`🔥 Starting stress test up to ${maxUsers} users...`);

    let currentUsers = stepSize;
    let breakingPoint = 0;
    const stressResults: LoadTestResult[] = [];

    while (currentUsers <= maxUsers) {
      console.log(`🔄 Stress testing with ${currentUsers} users...`);

      const results = await this.performLoadTest(endpoint, [currentUsers]);
      const result = results[0];

      stressResults.push(result);

      // Check for breaking point
      if (result.errorRate > 50 || result.averageResponseTime > 10000) {
        breakingPoint = currentUsers;
        console.log(`💥 Breaking point reached at ${currentUsers} users`);
        break;
      }

      currentUsers += stepSize;

      // Brief cooldown
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30s cooldown
    }

    return {
      breakingPoint,
      maxStableUsers: breakingPoint > 0 ? breakingPoint - stepSize : currentUsers - stepSize,
      results: stressResults
    };
  },

  // Memory leak testing
  async testMemoryLeaks(endpoint: string, iterations: number = 1000) {
    console.log(`🧠 Testing for memory leaks with ${iterations} iterations...`);

    const initialMemory = process.memoryUsage().heapUsed;
    const memoryReadings: number[] = [];

    for (let i = 0; i < iterations; i++) {
      await fetch(`${PERFORMANCE_CONFIG.targetUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PERFORMANCE_CONFIG.apiKey}`
        }
      });

      // Take memory reading every 100 iterations
      if (i % 100 === 0) {
        const currentMemory = process.memoryUsage().heapUsed;
        memoryReadings.push(currentMemory);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      // Small delay to simulate realistic usage
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;

    // Check for potential memory leak
    const hasMemoryLeak = memoryIncreasePercent > 50; // More than 50% increase

    if (hasMemoryLeak) {
      global.performanceTestState.performanceAlerts.push(
        `Potential memory leak detected on ${endpoint}: ${memoryIncreasePercent.toFixed(2)}% increase`
      );
    }

    return {
      initialMemory: initialMemory / 1024 / 1024, // MB
      finalMemory: finalMemory / 1024 / 1024, // MB
      memoryIncrease: memoryIncrease / 1024 / 1024, // MB
      memoryIncreasePercent,
      hasMemoryLeak,
      memoryReadings: memoryReadings.map(m => m / 1024 / 1024) // MB
    };
  },

  // Database performance testing
  async testDatabasePerformance(queries: { name: string; query: string }[]) {
    const results = [];

    for (const { name, query } of queries) {
      const startTime = performance.now();

      try {
        // Execute database query through API
        const response = await fetch(`${PERFORMANCE_CONFIG.targetUrl}/api/test/db-query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PERFORMANCE_CONFIG.apiKey}`
          },
          body: JSON.stringify({ query })
        });

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        const result = await response.json();

        results.push({
          name,
          executionTime,
          success: response.ok,
          recordCount: result.recordCount || 0,
          error: response.ok ? null : result.error
        });

        // Check against database performance threshold
        if (executionTime > PERFORMANCE_CONFIG.thresholds.responseTime.database) {
          global.performanceTestState.performanceAlerts.push(
            `Slow database query '${name}': ${executionTime.toFixed(2)}ms (threshold: ${PERFORMANCE_CONFIG.thresholds.responseTime.database}ms)`
          );
        }

      } catch (error) {
        const endTime = performance.now();
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

  // Cache performance testing
  async testCachePerformance(operations: { key: string; value: any }[]) {
    const results = [];

    for (const { key, value } of operations) {
      // Test cache SET operation
      const setStartTime = performance.now();
      try {
        await fetch(`${PERFORMANCE_CONFIG.targetUrl}/api/cache/${key}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PERFORMANCE_CONFIG.apiKey}`
          },
          body: JSON.stringify({ value })
        });

        const setEndTime = performance.now();
        const setTime = setEndTime - setStartTime;

        // Test cache GET operation
        const getStartTime = performance.now();
        const getResponse = await fetch(`${PERFORMANCE_CONFIG.targetUrl}/api/cache/${key}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${PERFORMANCE_CONFIG.apiKey}`
          }
        });

        const getEndTime = performance.now();
        const getTime = getEndTime - getStartTime;

        results.push({
          key,
          setTime,
          getTime,
          setSuccess: true,
          getSuccess: getResponse.ok,
          cacheHit: getResponse.ok
        });

        // Check against cache performance thresholds
        if (setTime > PERFORMANCE_CONFIG.thresholds.responseTime.cache) {
          global.performanceTestState.performanceAlerts.push(
            `Slow cache SET operation for '${key}': ${setTime.toFixed(2)}ms`
          );
        }

        if (getTime > PERFORMANCE_CONFIG.thresholds.responseTime.cache) {
          global.performanceTestState.performanceAlerts.push(
            `Slow cache GET operation for '${key}': ${getTime.toFixed(2)}ms`
          );
        }

      } catch (error) {
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

// Utility functions
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
      const result = await performanceHelpers.measureResponseTime(endpoint);
      global.performanceTestState.baselineMetrics.set(endpoint, result.metric);
      console.log(`✅ Baseline for ${endpoint}: ${result.responseTime.toFixed(2)}ms`);
    } catch (error) {
      console.log(`⚠️ Could not establish baseline for ${endpoint}: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`);
    }
  }
}

async function checkPerformanceThreshold(endpoint: string, responseTime: number) {
  let threshold = PERFORMANCE_CONFIG.thresholds.responseTime.api;

  // Use specific thresholds for different endpoint types
  if (endpoint.includes('/auth/')) {
    threshold = PERFORMANCE_CONFIG.thresholds.responseTime.auth;
  } else if (endpoint.includes('/upload/')) {
    threshold = PERFORMANCE_CONFIG.thresholds.responseTime.fileUpload;
  } else if (endpoint.includes('/db/') || endpoint.includes('/query/')) {
    threshold = PERFORMANCE_CONFIG.thresholds.responseTime.database;
  }

  if (responseTime > threshold) {
    global.performanceTestState.performanceAlerts.push(
      `Slow response on ${endpoint}: ${responseTime.toFixed(2)}ms (threshold: ${threshold}ms)`
    );
  }
}

async function generatePerformanceReport(testName: string) {
  const testMetrics = global.performanceTestState.metrics.filter(
    m => m.timestamp >= global.performanceTestState.currentTestStartTime
  );

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
    const reportPath = path.join(
      PERFORMANCE_CONFIG.reports.outputDir,
      `${testName.replace(/[^a-zA-Z0-9]/g, '-')}-performance-report.json`
    );

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Failed to write performance report:', error);
  }
}

async function generateFinalPerformanceReport() {
  const allMetrics = global.performanceTestState.metrics;
  const allAlerts = global.performanceTestState.performanceAlerts;
  const {loadTestResults} = global.performanceTestState;

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

  // Save detailed report
  const detailedReportPath = path.join(PERFORMANCE_CONFIG.reports.outputDir, 'final-performance-report.json');
  await fs.writeFile(detailedReportPath, JSON.stringify(finalReport, null, 2));

  // Save summary report
  const summaryReport = {
    summary: finalReport.summary,
    recommendations: finalReport.recommendations,
    timestamp: finalReport.timestamp
  };

  const summaryReportPath = path.join(PERFORMANCE_CONFIG.reports.outputDir, 'performance-summary.json');
  await fs.writeFile(summaryReportPath, JSON.stringify(summaryReport, null, 2));

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

  const {loadTestResults} = global.performanceTestState;
  if (loadTestResults.some(result => result.errorRate > 5)) {
    recommendations.push('Improve error handling and system stability under load');
  }

  if (loadTestResults.some(result => result.averageResponseTime > 1000)) {
    recommendations.push('Implement load balancing and horizontal scaling to handle higher traffic');
  }

  return recommendations;
}

export { PERFORMANCE_CONFIG };