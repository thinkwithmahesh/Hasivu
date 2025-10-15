/**
 * Comprehensive Performance Test Suite
 * Load testing, stress testing, and performance validation
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { performanceHelpers, PERFORMANCE_CONFIG } from '../setup-performance';

describe('Comprehensive Performance Tests', () => {
  beforeAll(async () => {
    console.log('⚡ Starting performance test suite...');
  });

  afterAll(async () => {
    console.log('✅ Performance test suite completed');
  });

  describe('API Response Time Tests', () => {
    test('Authentication endpoints should respond within 300ms', async () => {
      const results = await Promise.all([
        performanceHelpers.measureResponseTime('/api/auth/login', 'POST', {
          email: 'test@hasivu.com',
          password: 'TestPassword123!'
        }),
        performanceHelpers.measureResponseTime('/api/auth/profile'),
        performanceHelpers.measureResponseTime('/api/auth/refresh', 'POST', {
          refreshToken: 'test-refresh-token'
        })
      ]);

      results.forEach((result, index) => {
        const endpoints = ['/api/auth/login', '/api/auth/profile', '/api/auth/refresh'];
        console.log(`${endpoints[index]}: ${result.responseTime.toFixed(2)}ms`);
        expect(result.responseTime).toBeLessThan(PERFORMANCE_CONFIG.thresholds.responseTime.auth);
      });
    });

    test('Menu endpoints should respond within 200ms', async () => {
      const results = await Promise.all([
        performanceHelpers.measureResponseTime('/api/menu/items'),
        performanceHelpers.measureResponseTime('/api/menu/categories'),
        performanceHelpers.measureResponseTime('/api/menu/daily')
      ]);

      results.forEach((result, index) => {
        const endpoints = ['/api/menu/items', '/api/menu/categories', '/api/menu/daily'];
        console.log(`${endpoints[index]}: ${result.responseTime.toFixed(2)}ms`);
        expect(result.responseTime).toBeLessThan(PERFORMANCE_CONFIG.thresholds.responseTime.api);
      });
    });

    test('Order management endpoints should respond within 200ms', async () => {
      const results = await Promise.all([
        performanceHelpers.measureResponseTime('/api/orders'),
        performanceHelpers.measureResponseTime('/api/orders/123'),
        performanceHelpers.measureResponseTime('/api/orders', 'POST', {
          menuItemId: 'item-123',
          quantity: 2
        })
      ]);

      results.forEach((result, index) => {
        const endpoints = ['/api/orders (GET)', '/api/orders/:id', '/api/orders (POST)'];
        console.log(`${endpoints[index]}: ${result.responseTime.toFixed(2)}ms`);
        expect(result.responseTime).toBeLessThan(PERFORMANCE_CONFIG.thresholds.responseTime.api);
      });
    });

    test('Health check endpoints should respond within 100ms', async () => {
      const results = await Promise.all([
        performanceHelpers.measureResponseTime('/api/health'),
        performanceHelpers.measureResponseTime('/api/health/basic'),
        performanceHelpers.measureResponseTime('/api/health/live')
      ]);

      results.forEach((result, index) => {
        const endpoints = ['/api/health', '/api/health/basic', '/api/health/live'];
        console.log(`${endpoints[index]}: ${result.responseTime.toFixed(2)}ms`);
        expect(result.responseTime).toBeLessThan(100); // Health checks should be very fast
      });
    });
  });

  describe('Load Testing', () => {
    test('API should handle 100 concurrent users on health endpoint', async () => {
      const results = await performanceHelpers.performLoadTest('/api/health', [100]);
      const result = results[0];

      console.log(`Load test results for 100 users:`);
      console.log(`- Total requests: ${result.totalRequests}`);
      console.log(`- Successful requests: ${result.successfulRequests}`);
      console.log(`- Failed requests: ${result.failedRequests}`);
      console.log(`- Average response time: ${result.averageResponseTime.toFixed(2)}ms`);
      console.log(`- P95 response time: ${result.p95ResponseTime.toFixed(2)}ms`);
      console.log(`- Requests per second: ${result.requestsPerSecond.toFixed(2)}`);
      console.log(`- Error rate: ${result.errorRate.toFixed(2)}%`);

      expect(result.errorRate).toBeLessThan(1); // Less than 1% error rate
      expect(result.averageResponseTime).toBeLessThan(500); // Average under 500ms
      expect(result.requestsPerSecond).toBeGreaterThan(50); // At least 50 RPS
    });

    test('Menu API should handle increasing load gracefully', async () => {
      const userCounts = [10, 50, 100, 250];
      const results = await performanceHelpers.performLoadTest('/api/menu/items', userCounts);

      results.forEach((result, index) => {
        console.log(`\\nLoad test with ${userCounts[index]} users:`);
        console.log(`- Average response time: ${result.averageResponseTime.toFixed(2)}ms`);
        console.log(`- Error rate: ${result.errorRate.toFixed(2)}%`);
        console.log(`- RPS: ${result.requestsPerSecond.toFixed(2)}`);

        // Performance should degrade gracefully
        expect(result.errorRate).toBeLessThan(5); // Less than 5% error rate
        expect(result.averageResponseTime).toBeLessThan(1000); // Under 1 second
      });

      // Verify performance degrades linearly, not exponentially
      const responseTimeIncrease = results[results.length - 1].averageResponseTime / results[0].averageResponseTime;
      expect(responseTimeIncrease).toBeLessThan(5); // Response time shouldn't increase more than 5x
    });

    test('Order creation should handle lunch rush simulation', async () => {
      // Simulate lunch rush: 500 students ordering within 15 minutes
      const results = await performanceHelpers.performLoadTest('/api/orders', [500]);
      const result = results[0];

      console.log(`Lunch rush simulation (500 concurrent orders):`);
      console.log(`- Successful orders: ${result.successfulRequests}`);
      console.log(`- Failed orders: ${result.failedRequests}`);
      console.log(`- Average processing time: ${result.averageResponseTime.toFixed(2)}ms`);
      console.log(`- Error rate: ${result.errorRate.toFixed(2)}%`);

      expect(result.errorRate).toBeLessThan(2); // Less than 2% order failures
      expect(result.averageResponseTime).toBeLessThan(800); // Orders processed under 800ms
      expect(result.successfulRequests).toBeGreaterThan(490); // At least 98% success rate
    });
  });

  describe('Stress Testing', () => {
    test('Find breaking point for authentication API', async () => {
      const stressResult = await performanceHelpers.performStressTest('/api/auth/profile', 1000, 100);

      console.log(`Stress test results:`);
      console.log(`- Breaking point: ${stressResult.breakingPoint || 'Not reached'} users`);
      console.log(`- Max stable users: ${stressResult.maxStableUsers} users`);

      expect(stressResult.maxStableUsers).toBeGreaterThan(300); // Should handle at least 300 users

      if (stressResult.breakingPoint > 0) {
        console.log(`System broke at ${stressResult.breakingPoint} concurrent users`);
        expect(stressResult.breakingPoint).toBeGreaterThan(500); // Should handle more than 500 users
      }
    });

    test('Database operations should handle high concurrency', async () => {
      const stressResult = await performanceHelpers.performStressTest('/api/menu/items', 800, 50);

      console.log(`Database stress test results:`);
      console.log(`- Breaking point: ${stressResult.breakingPoint || 'Not reached'} users`);
      console.log(`- Max stable users: ${stressResult.maxStableUsers} users`);

      expect(stressResult.maxStableUsers).toBeGreaterThan(200); // Should handle at least 200 concurrent DB operations
    });
  });

  describe('Memory Leak Testing', () => {
    test('Authentication operations should not cause memory leaks', async () => {
      const memoryResult = await performanceHelpers.testMemoryLeaks('/api/auth/profile', 500);

      console.log(`Memory leak test results:`);
      console.log(`- Initial memory: ${memoryResult.initialMemory.toFixed(2)} MB`);
      console.log(`- Final memory: ${memoryResult.finalMemory.toFixed(2)} MB`);
      console.log(`- Memory increase: ${memoryResult.memoryIncrease.toFixed(2)} MB (${memoryResult.memoryIncreasePercent.toFixed(2)}%)`);
      console.log(`- Has memory leak: ${memoryResult.hasMemoryLeak}`);

      expect(memoryResult.hasMemoryLeak).toBe(false);
      expect(memoryResult.memoryIncreasePercent).toBeLessThan(30); // Less than 30% memory increase
    });

    test('Menu operations should not cause memory leaks', async () => {
      const memoryResult = await performanceHelpers.testMemoryLeaks('/api/menu/items', 1000);

      console.log(`Menu API memory test results:`);
      console.log(`- Memory increase: ${memoryResult.memoryIncrease.toFixed(2)} MB (${memoryResult.memoryIncreasePercent.toFixed(2)}%)`);
      console.log(`- Has memory leak: ${memoryResult.hasMemoryLeak}`);

      expect(memoryResult.hasMemoryLeak).toBe(false);
      expect(memoryResult.memoryIncreasePercent).toBeLessThan(25);
    });

    test('Order processing should not cause memory leaks', async () => {
      const memoryResult = await performanceHelpers.testMemoryLeaks('/api/orders', 750);

      console.log(`Order processing memory test results:`);
      console.log(`- Memory increase: ${memoryResult.memoryIncrease.toFixed(2)} MB (${memoryResult.memoryIncreasePercent.toFixed(2)}%)`);
      console.log(`- Has memory leak: ${memoryResult.hasMemoryLeak}`);

      expect(memoryResult.hasMemoryLeak).toBe(false);
      expect(memoryResult.memoryIncreasePercent).toBeLessThan(35);
    });
  });

  describe('Database Performance Tests', () => {
    test('Database queries should execute within acceptable time limits', async () => {
      const testQueries = [
        {
          name: 'Simple user lookup',
          query: 'SELECT * FROM users WHERE email = $1 LIMIT 1'
        },
        {
          name: 'Menu items with filters',
          query: 'SELECT * FROM menu_items WHERE category = $1 AND is_available = true ORDER BY name'
        },
        {
          name: 'Order history with joins',
          query: `
            SELECT o.*, mi.name as menu_item_name, u.first_name, u.last_name
            FROM orders o
            JOIN menu_items mi ON o.menu_item_id = mi.id
            JOIN users u ON o.user_id = u.id
            WHERE o.created_at >= NOW() - INTERVAL '7 days'
            ORDER BY o.created_at DESC
            LIMIT 50
          `
        },
        {
          name: 'Complex analytics query',
          query: `
            SELECT
              DATE(o.created_at) as order_date,
              COUNT(*) as order_count,
              SUM(o.total_amount) as revenue,
              AVG(o.total_amount) as avg_order_value
            FROM orders o
            WHERE o.created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(o.created_at)
            ORDER BY order_date DESC
          `
        }
      ];

      const results = await performanceHelpers.testDatabasePerformance(testQueries);

      results.forEach((result, index) => {
        console.log(`${result.name}: ${result.executionTime.toFixed(2)}ms - ${result.success ? 'SUCCESS' : 'FAILED'}`);

        if (result.success) {
          expect(result.executionTime).toBeLessThan(PERFORMANCE_CONFIG.thresholds.responseTime.database);
        }
      });

      // At least 75% of queries should succeed
      const successRate = results.filter(r => r.success).length / results.length;
      expect(successRate).toBeGreaterThan(0.75);
    });

    test('Database should handle concurrent query load', async () => {
      const concurrentQueries = Array.from({ length: 50 }, (_, i) => ({
        name: `Concurrent query ${i + 1}`,
        query: "SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '1 day'"
      }));

      const startTime = performance.now();
      const results = await performanceHelpers.testDatabasePerformance(concurrentQueries);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const averageTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
      const successRate = results.filter(r => r.success).length / results.length;

      console.log(`Concurrent database test results:`);
      console.log(`- Total execution time: ${totalTime.toFixed(2)}ms`);
      console.log(`- Average query time: ${averageTime.toFixed(2)}ms`);
      console.log(`- Success rate: ${(successRate * 100).toFixed(1)}%`);

      expect(successRate).toBeGreaterThan(0.9); // 90% success rate
      expect(averageTime).toBeLessThan(200); // Average under 200ms
    });
  });

  describe('Cache Performance Tests', () => {
    test('Cache operations should meet performance thresholds', async () => {
      const cacheOperations = [
        { key: 'test-key-1', value: { data: 'Simple string value' } },
        { key: 'test-key-2', value: { users: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `User ${i}` })) } },
        { key: 'test-key-3', value: { menuItems: Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Item ${i}`, price: 10.99 })) } },
        { key: 'test-key-4', value: { orders: Array.from({ length: 200 }, (_, i) => ({ id: i, status: 'completed', amount: 25.50 })) } }
      ];

      const results = await performanceHelpers.testCachePerformance(cacheOperations);

      results.forEach((result, index) => {
        console.log(`Cache test ${index + 1}:`);
        console.log(`- SET time: ${result.setTime.toFixed(2)}ms`);
        console.log(`- GET time: ${result.getTime.toFixed(2)}ms`);
        console.log(`- Cache hit: ${result.cacheHit}`);

        expect(result.setTime).toBeLessThan(PERFORMANCE_CONFIG.thresholds.responseTime.cache);
        expect(result.getTime).toBeLessThan(PERFORMANCE_CONFIG.thresholds.responseTime.cache);
        expect(result.setSuccess).toBe(true);
        expect(result.getSuccess).toBe(true);
      });
    });

    test('Cache should handle high-frequency operations', async () => {
      const highFrequencyOps = Array.from({ length: 100 }, (_, i) => ({
        key: `high-freq-${i}`,
        value: { id: i, timestamp: Date.now(), data: `High frequency data ${i}` }
      }));

      const startTime = performance.now();
      const results = await performanceHelpers.testCachePerformance(highFrequencyOps);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const avgSetTime = results.reduce((sum, r) => sum + r.setTime, 0) / results.length;
      const avgGetTime = results.reduce((sum, r) => sum + r.getTime, 0) / results.length;
      const successRate = results.filter(r => r.setSuccess && r.getSuccess).length / results.length;

      console.log(`High-frequency cache test results:`);
      console.log(`- Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`- Average SET time: ${avgSetTime.toFixed(2)}ms`);
      console.log(`- Average GET time: ${avgGetTime.toFixed(2)}ms`);
      console.log(`- Success rate: ${(successRate * 100).toFixed(1)}%`);

      expect(successRate).toBeGreaterThan(0.95); // 95% success rate
      expect(avgSetTime).toBeLessThan(30); // Average SET under 30ms
      expect(avgGetTime).toBeLessThan(20); // Average GET under 20ms
    });
  });

  describe('Real-World Scenario Tests', () => {
    test('Peak lunch hour simulation (500 students, 15-minute window)', async () => {
      console.log('🍽️ Simulating peak lunch hour...');

      // Simulate realistic lunch hour pattern:
      // - 500 students
      // - 80% order within first 10 minutes
      // - Mix of menu browsing, ordering, and status checking

      const scenarios = [
        { endpoint: '/api/menu/items', weight: 0.4, userCount: 200 }, // Menu browsing
        { endpoint: '/api/orders', weight: 0.3, userCount: 150 }, // Order placement
        { endpoint: '/api/orders/status', weight: 0.2, userCount: 100 }, // Status checking
        { endpoint: '/api/auth/profile', weight: 0.1, userCount: 50 } // Profile access
      ];

      const results = await Promise.all(
        scenarios.map(scenario =>
          performanceHelpers.performLoadTest(scenario.endpoint, [scenario.userCount])
        )
      );

      let totalSuccessfulRequests = 0;
      let totalFailedRequests = 0;
      let weightedAvgResponseTime = 0;

      results.forEach((scenarioResults, index) => {
        const result = scenarioResults[0];
        const scenario = scenarios[index];

        console.log(`${scenario.endpoint}:`);
        console.log(`- Users: ${scenario.userCount}`);
        console.log(`- Success rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%`);
        console.log(`- Avg response time: ${result.averageResponseTime.toFixed(2)}ms`);
        console.log(`- Error rate: ${result.errorRate.toFixed(2)}%`);

        totalSuccessfulRequests += result.successfulRequests;
        totalFailedRequests += result.failedRequests;
        weightedAvgResponseTime += result.averageResponseTime * scenario.weight;

        expect(result.errorRate).toBeLessThan(3); // Less than 3% errors per scenario
      });

      const overallSuccessRate = totalSuccessfulRequests / (totalSuccessfulRequests + totalFailedRequests);

      console.log(`\\nOverall lunch hour performance:`);
      console.log(`- Total successful requests: ${totalSuccessfulRequests}`);
      console.log(`- Total failed requests: ${totalFailedRequests}`);
      console.log(`- Overall success rate: ${(overallSuccessRate * 100).toFixed(1)}%`);
      console.log(`- Weighted average response time: ${weightedAvgResponseTime.toFixed(2)}ms`);

      expect(overallSuccessRate).toBeGreaterThan(0.97); // 97% overall success rate
      expect(weightedAvgResponseTime).toBeLessThan(400); // Under 400ms weighted average
    });

    test('End-of-day batch processing simulation', async () => {
      console.log('📊 Simulating end-of-day batch processing...');

      // Simulate batch operations that might run at end of day
      const batchOperations = [
        { name: 'Daily sales report', endpoint: '/api/reports/daily-sales' },
        { name: 'Inventory update', endpoint: '/api/inventory/batch-update' },
        { name: 'User activity aggregation', endpoint: '/api/analytics/user-activity' },
        { name: 'Payment reconciliation', endpoint: '/api/payments/reconcile' },
        { name: 'Notification cleanup', endpoint: '/api/notifications/cleanup' }
      ];

      const batchResults = await Promise.all(
        batchOperations.map(op =>
          performanceHelpers.measureResponseTime(op.endpoint, 'POST', {
            batchSize: 1000,
            date: new Date().toISOString().split('T')[0]
          })
        )
      );

      batchResults.forEach((result, index) => {
        const operation = batchOperations[index];
        console.log(`${operation.name}: ${result.responseTime.toFixed(2)}ms - ${result.success ? 'SUCCESS' : 'FAILED'}`);

        // Batch operations can take longer but should complete within reasonable time
        expect(result.responseTime).toBeLessThan(30000); // 30 seconds max for batch operations
      });

      const batchSuccessRate = batchResults.filter(r => r.success).length / batchResults.length;
      expect(batchSuccessRate).toBeGreaterThan(0.8); // 80% batch operation success rate
    });

    test('Mobile app usage pattern simulation', async () => {
      console.log('📱 Simulating mobile app usage patterns...');

      // Simulate typical mobile usage:
      // - Frequent small requests
      // - Intermittent connectivity
      // - Background sync operations

      const mobilePatterns = [
        { endpoint: '/api/health', frequency: 20, description: 'Connectivity checks' },
        { endpoint: '/api/auth/refresh', frequency: 5, description: 'Token refresh' },
        { endpoint: '/api/notifications/check', frequency: 15, description: 'Notification polling' },
        { endpoint: '/api/orders/status', frequency: 10, description: 'Order status updates' },
        { endpoint: '/api/sync/data', frequency: 3, description: 'Data synchronization' }
      ];

      const mobileResults = await Promise.all(
        mobilePatterns.map(pattern =>
          performanceHelpers.performLoadTest(pattern.endpoint, [pattern.frequency])
        )
      );

      mobileResults.forEach((result, index) => {
        const pattern = mobilePatterns[index];
        const testResult = result[0];

        console.log(`${pattern.description}:`);
        console.log(`- Frequency: ${pattern.frequency} requests`);
        console.log(`- Avg response time: ${testResult.averageResponseTime.toFixed(2)}ms`);
        console.log(`- Success rate: ${((testResult.successfulRequests / testResult.totalRequests) * 100).toFixed(1)}%`);

        // Mobile operations should be fast and reliable
        expect(testResult.averageResponseTime).toBeLessThan(500); // Under 500ms for mobile
        expect(testResult.errorRate).toBeLessThan(1); // Less than 1% errors
      });
    });
  });
});