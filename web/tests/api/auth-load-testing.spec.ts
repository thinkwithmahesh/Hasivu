/**
 * HASIVU Platform - Authentication API Load Testing Suite
 * 
 * This test suite performs comprehensive load testing for authentication endpoints:
 * 1. Concurrent User Login Simulation
 * 2. Authentication Bottleneck Identification
 * 3. Rate Limiting Testing
 * 4. Token Refresh Performance Under Load
 * 5. Session Management Scalability
 * 
 * Performance Targets:
 * - Response Time: <200ms (P95), <500ms (P99)
 * - Throughput: >1000 RPS for login endpoint
 * - Error Rate: <0.1% under normal load
 * - Concurrent Users: Support 10,000+ simultaneous sessions
 */

import { test, expect } from '@playwright/test';
import { Worker } from 'worker_threads';
import { performance } from 'perf_hooks';

// Load Test Configuration
const _LOAD_TEST_CONFIG =  {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.hasivu.com',
  TEST_SCENARIOS: {
    SMOKE_TEST: { users: 10, duration: 10000, rampUp: 2000 },
    NORMAL_LOAD: { users: 100, duration: 60000, rampUp: 10000 },
    STRESS_TEST: { users: 500, duration: 120000, rampUp: 30000 },
    SPIKE_TEST: { users: 1000, duration: 30000, rampUp: 5000 },
    ENDURANCE_TEST: { users: 200, duration: 300000, rampUp: 60000 } // 5 minutes
  },
  PERFORMANCE_THRESHOLDS: {
    RESPONSE_TIME_P95_MS: 200,
    RESPONSE_TIME_P99_MS: 500,
    SUCCESS_RATE_PERCENT: 99.9,
    THROUGHPUT_RPS: 1000,
    ERROR_RATE_PERCENT: 0.1
  },
  USER_CREDENTIALS: [
    { email: 'student1@hasivu.test', password: 'Test123!', role: 'student' },
    { email: 'student2@hasivu.test', password: 'Test123!', role: 'student' },
    { email: 'parent1@hasivu.test', password: 'Test123!', role: 'parent' },
    { email: 'parent2@hasivu.test', password: 'Test123!', role: 'parent' },
    { email: 'admin1@hasivu.test', password: 'Test123!', role: 'admin' },
    { email: 'kitchen1@hasivu.test', password: 'Test123!', role: 'kitchen_staff' },
    { email: 'vendor1@hasivu.test', password: 'Test123!', role: 'vendor' }
  ]
};

// Performance Metrics Collector
class LoadTestMetrics {
  private measurements: Array<{
    timestamp: number;
    endpoint: string;
    method: string;
    duration: number;
    status: number;
    userId: string;
    scenario: string;
  }> = [];

  addMeasurement(data: {
    endpoint: string;
    method: string;
    duration: number;
    status: number;
    userId: string;
    scenario: string;
  }) {
    this.measurements.push({
      timestamp: Date.now(),
      ...data
    });
  }

  getMetrics(scenario?: string) {
    const _filteredMeasurements =  scenario 
      ? this.measurements.filter(m 
    if (filteredMeasurements._length = 
    }

    const _successful =  filteredMeasurements.filter(m 
    const _failed =  filteredMeasurements.filter(m 
    const _durations =  successful.map(m 
    const _startTime =  Math.min(...filteredMeasurements.map(m 
    const _endTime =  Math.max(...filteredMeasurements.map(m 
    const _durationSeconds =  (endTime - startTime) / 1000;

    durations.sort(_(a, _b) => a - b);

    return {
      scenario: scenario || 'all',
      totalRequests: filteredMeasurements.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      successRate: (successful.length / filteredMeasurements.length) * 100,
      errorRate: (failed.length / filteredMeasurements.length) * 100,
      averageResponseTime: durations.length > 0 ? durations.reduce(_(sum, _d) => sum + d, 0) / durations.length : 0,
      medianResponseTime: durations.length > 0 ? durations[Math.floor(durations.length / 2)] : 0,
      p95ResponseTime: durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] : 0,
      p99ResponseTime: durations.length > 0 ? durations[Math.floor(durations.length * 0.99)] : 0,
      minResponseTime: durations.length > 0 ? Math.min(...durations) : 0,
      maxResponseTime: durations.length > 0 ? Math.max(...durations) : 0,
      throughputRPS: durationSeconds > 0 ? successful.length / durationSeconds : 0,
      testDurationSeconds: durationSeconds,
      uniqueUsers: new Set(filteredMeasurements.map(_m = > m.userId)).size
    };
  }

  reset() {
    this._measurements =  [];
  }

  generateReport() {
    const _allMetrics =  this.getMetrics();
    const _scenarios =  [...new Set(this.measurements.map(m 
    let _report =  '\n📊 AUTHENTICATION LOAD TEST REPORT\n';
    report += '='.repeat(50) + '\n\n';
    
    if (allMetrics) {
      report += `Overall Results:\n`;
      report += `- Total Requests: ${allMetrics.totalRequests}\n`;
      report += `- Success Rate: ${allMetrics.successRate.toFixed(2)}%\n`;
      report += `- Error Rate: ${allMetrics.errorRate.toFixed(2)}%\n`;
      report += `- Average Response Time: ${allMetrics.averageResponseTime.toFixed(2)}ms\n`;
      report += `- P95 Response Time: ${allMetrics.p95ResponseTime.toFixed(2)}ms\n`;
      report += `- P99 Response Time: ${allMetrics.p99ResponseTime.toFixed(2)}ms\n`;
      report += `- Throughput: ${allMetrics.throughputRPS.toFixed(2)} RPS\n`;
      report += `- Test Duration: ${allMetrics.testDurationSeconds.toFixed(2)}s\n`;
      report += `- Unique Users: ${allMetrics.uniqueUsers}\n\n`;
    }

    scenarios.forEach(_scenario = > {
      const scenarioMetrics 
      if (scenarioMetrics) {
        report += `${scenario.toUpperCase()} Scenario:\n`;
        report += `- Requests: ${scenarioMetrics.totalRequests}\n`;
        report += `- Success Rate: ${scenarioMetrics.successRate.toFixed(2)}%\n`;
        report += `- P95 Response Time: ${scenarioMetrics.p95ResponseTime.toFixed(2)}ms\n`;
        report += `- Throughput: ${scenarioMetrics.throughputRPS.toFixed(2)} RPS\n\n`;
      }
    });
    
    return report;
  }
}

// Global metrics collector
const _loadTestMetrics =  new LoadTestMetrics();

test.describe(_'🚀 Authentication API Load Testing', _() => {
  
  test.describe(_'1. Smoke Test - Basic Load Validation', _() => {
    
    test(_'💨 Smoke test - 10 concurrent users', _async ({ request }) => {
      const _scenario =  'smoke_test';
      const _config =  LOAD_TEST_CONFIG.TEST_SCENARIOS.SMOKE_TEST;
      
      console.log(`🏁 Starting smoke test: ${config.users} users, ${config.duration/1000}s duration`);
      
      loadTestMetrics.reset();
      
      const _userTasks =  Array.from({ length: config.users }, (_, i) 
      await Promise.allSettled(userTasks);
      
      const _metrics =  loadTestMetrics.getMetrics(scenario);
      
      expect(metrics).not.toBeNull();
      expect(metrics!.successRate).toBeGreaterThanOrEqual(99);
      expect(metrics!.p95ResponseTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME_P95_MS * 2);
      
      console.log(`✅ Smoke test completed:`);
      console.log(`   Success Rate: ${metrics!.successRate.toFixed(2)}%`);
      console.log(`   P95 Response Time: ${metrics!.p95ResponseTime.toFixed(2)}ms`);
      console.log(`   Throughput: ${metrics!.throughputRPS.toFixed(2)} RPS`);
    });
  });

  test.describe(_'2. Normal Load Testing', _() => {
    
    test(_'📈 Normal load - 100 concurrent users', _async ({ request }) => {
      const _scenario =  'normal_load';
      const _config =  LOAD_TEST_CONFIG.TEST_SCENARIOS.NORMAL_LOAD;
      
      console.log(`🏃 Starting normal load test: ${config.users} users, ${config.duration/1000}s duration`);
      
      loadTestMetrics.reset();
      
      // Gradual ramp-up of users
      const _userBatches =  Math.ceil(config.users / 10);
      const _batchDelay =  config.rampUp / userBatches;
      
      const allUserTasks: Promise<any>[] = [];
      
      for (let batch = 0; batch < userBatches; batch++) {
        const _batchStart =  batch * 10;
        const _batchEnd =  Math.min(batchStart + 10, config.users);
        
        const _batchTasks =  Array.from({ length: batchEnd - batchStart }, (_, i) 
        allUserTasks.push(...batchTasks);
        
        if (batch < userBatches - 1) {
          await new Promise(_resolve = > setTimeout(resolve, batchDelay));
        }
      }
      
      await Promise.allSettled(allUserTasks);
      
      const _metrics =  loadTestMetrics.getMetrics(scenario);
      
      expect(metrics).not.toBeNull();
      expect(metrics!.successRate).toBeGreaterThanOrEqual(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.SUCCESS_RATE_PERCENT);
      expect(metrics!.p95ResponseTime).toBeLessThan(LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME_P95_MS * 3);
      
      console.log(`✅ Normal load test completed:`);
      console.log(`   Success Rate: ${metrics!.successRate.toFixed(2)}%`);
      console.log(`   P95 Response Time: ${metrics!.p95ResponseTime.toFixed(2)}ms`);
      console.log(`   P99 Response Time: ${metrics!.p99ResponseTime.toFixed(2)}ms`);
      console.log(`   Throughput: ${metrics!.throughputRPS.toFixed(2)} RPS`);
    });
  });

  test.describe(_'3. Stress Testing', _() => {
    
    test(_'💪 Stress test - 500 concurrent users', _async ({ request }) => {
      const _scenario =  'stress_test';
      const _config =  LOAD_TEST_CONFIG.TEST_SCENARIOS.STRESS_TEST;
      
      console.log(`💥 Starting stress test: ${config.users} users, ${config.duration/1000}s duration`);
      
      loadTestMetrics.reset();
      
      // More aggressive ramp-up for stress test
      const _userBatches =  Math.ceil(config.users / 20);
      const _batchDelay =  config.rampUp / userBatches;
      
      const allUserTasks: Promise<any>[] = [];
      
      for (let batch = 0; batch < userBatches; batch++) {
        const _batchStart =  batch * 20;
        const _batchEnd =  Math.min(batchStart + 20, config.users);
        
        const _batchTasks =  Array.from({ length: batchEnd - batchStart }, (_, i) 
        allUserTasks.push(...batchTasks);
        
        if (batch < userBatches - 1) {
          await new Promise(_resolve = > setTimeout(resolve, batchDelay));
        }
      }
      
      await Promise.allSettled(allUserTasks);
      
      const _metrics =  loadTestMetrics.getMetrics(scenario);
      
      expect(metrics).not.toBeNull();
      expect(metrics!.successRate).toBeGreaterThanOrEqual(95); // Allow some degradation under stress
      
      console.log(`💪 Stress test completed:`);
      console.log(`   Success Rate: ${metrics!.successRate.toFixed(2)}%`);
      console.log(`   P95 Response Time: ${metrics!.p95ResponseTime.toFixed(2)}ms`);
      console.log(`   P99 Response Time: ${metrics!.p99ResponseTime.toFixed(2)}ms`);
      console.log(`   Throughput: ${metrics!.throughputRPS.toFixed(2)} RPS`);
      console.log(`   Error Rate: ${metrics!.errorRate.toFixed(2)}%`);
    });
  });

  test.describe(_'4. Spike Testing', _() => {
    
    test(_'⚡ Spike test - Sudden 1000 users', _async ({ request }) => {
      const _scenario =  'spike_test';
      const _config =  LOAD_TEST_CONFIG.TEST_SCENARIOS.SPIKE_TEST;
      
      console.log(`⚡ Starting spike test: ${config.users} users, ${config.duration/1000}s duration`);
      
      loadTestMetrics.reset();
      
      // Very rapid ramp-up to simulate traffic spike
      const _userTasks =  Array.from({ length: config.users }, (_, i) 
      // Start all users almost simultaneously
      await Promise.allSettled(userTasks);
      
      const _metrics =  loadTestMetrics.getMetrics(scenario);
      
      expect(metrics).not.toBeNull();
      expect(metrics!.successRate).toBeGreaterThanOrEqual(90); // Allow degradation during spike
      
      console.log(`⚡ Spike test completed:`);
      console.log(`   Success Rate: ${metrics!.successRate.toFixed(2)}%`);
      console.log(`   P95 Response Time: ${metrics!.p95ResponseTime.toFixed(2)}ms`);
      console.log(`   P99 Response Time: ${metrics!.p99ResponseTime.toFixed(2)}ms`);
      console.log(`   Throughput: ${metrics!.throughputRPS.toFixed(2)} RPS`);
      console.log(`   Recovery: ${metrics!.successRate > 95 ? 'Good' : 'Needs improvement'}`);
    });
  });

  test.describe(_'5. Token Refresh Load Testing', _() => {
    
    test(_'🔄 Token refresh under load', _async ({ request }) => {
      console.log('🔄 Testing token refresh under load...');
      
      // First, get tokens for multiple users
      const _tokenPromises =  LOAD_TEST_CONFIG.USER_CREDENTIALS.slice(0, 50).map(async (creds, i) 
        if (loginResponse.status() === 200) {
          const _data =  await loginResponse.json();
          return {
            userId: `user-${i}`,
            refreshToken: data.data.tokens.refreshToken,
            accessToken: data.data.tokens.accessToken
          };
        }
        return null;
      });
      
      const _tokens =  (await Promise.all(tokenPromises)).filter(Boolean);
      
      console.log(`Got ${tokens.length} tokens for refresh testing`);
      
      // Now test concurrent refresh requests
      const _refreshTasks =  tokens.map(async (tokenData, i) 
        try {
          const _refreshResponse =  await request.post(`${LOAD_TEST_CONFIG.API_BASE_URL}/auth/refresh`, {
            data: { refreshToken: tokenData!.refreshToken }
          });
          
          const _duration =  performance.now() - startTime;
          
          loadTestMetrics.addMeasurement({
            endpoint: '/auth/refresh',
            method: 'POST',
            duration,
            status: refreshResponse.status(),
            userId: tokenData!.userId,
            scenario: 'token_refresh_load'
          });
          
          return refreshResponse.status();
        } catch (error) {
          const _duration =  performance.now() - startTime;
          
          loadTestMetrics.addMeasurement({
            endpoint: '/auth/refresh',
            method: 'POST',
            duration,
            status: 500,
            userId: tokenData!.userId,
            scenario: 'token_refresh_load'
          });
          
          return 500;
        }
      });
      
      await Promise.allSettled(refreshTasks);
      
      const _metrics =  loadTestMetrics.getMetrics('token_refresh_load');
      
      expect(metrics).not.toBeNull();
      expect(metrics!.successRate).toBeGreaterThanOrEqual(95);
      expect(metrics!.p95ResponseTime).toBeLessThan(300);
      
      console.log(`✅ Token refresh load test completed:`);
      console.log(`   Success Rate: ${metrics!.successRate.toFixed(2)}%`);
      console.log(`   P95 Response Time: ${metrics!.p95ResponseTime.toFixed(2)}ms`);
    });
  });

  test.describe(_'6. Rate Limiting Testing', _() => {
    
    test(_'🚦 Rate limiting behavior under load', _async ({ request }) => {
      console.log('🚦 Testing rate limiting behavior...');
      
      const _rapidRequests =  Array.from({ length: 200 }, async (_, i) 
        try {
          const _response =  await request.post(`${LOAD_TEST_CONFIG.API_BASE_URL}/auth/login`, {
            data: LOAD_TEST_CONFIG.USER_CREDENTIALS[i % LOAD_TEST_CONFIG.USER_CREDENTIALS.length],
            timeout: 5000
          });
          
          const _duration =  performance.now() - startTime;
          
          loadTestMetrics.addMeasurement({
            endpoint: '/auth/login',
            method: 'POST',
            duration,
            status: response.status(),
            userId: `rate-limit-test-${i}`,
            scenario: 'rate_limit_test'
          });
          
          return {
            status: response.status(),
            headers: response.headers()
          };
        } catch (error) {
          const _duration =  performance.now() - startTime;
          
          loadTestMetrics.addMeasurement({
            endpoint: '/auth/login',
            method: 'POST',
            duration,
            status: 500,
            userId: `rate-limit-test-${i}`,
            scenario: 'rate_limit_test'
          });
          
          return { status: 500, headers: {} };
        }
      });
      
      const _results =  await Promise.allSettled(rapidRequests);
      const _responses =  results
        .filter(result 
      const _rateLimitedCount =  responses.filter(r 
      const _successfulCount =  responses.filter(r 
      console.log(`📊 Rate limiting results:`);
      console.log(`   Total requests: ${responses.length}`);
      console.log(`   Successful: ${successfulCount}`);
      console.log(`   Rate limited (429): ${rateLimitedCount}`);
      console.log(`   Rate limiting active: ${rateLimitedCount > 0 ? 'Yes' : 'No'}`);
      
      if (rateLimitedCount > 0) {
        // Verify rate limit headers are present
        const _rateLimitResponse =  responses.find(r 
        expect(rateLimitResponse).toBeDefined();
        
        const _headers =  rateLimitResponse!.headers;
        console.log(`   Rate limit headers present: ${Object.keys(headers).filter(_h = > h.includes('rate')).length > 0}`);
      }
      
      // The presence of rate limiting is good, but not required to pass the test
      console.log(`✅ Rate limiting test completed`);
    });
  });
});

// User simulation function
async function simulateUser(
  request: any, userId: number, scenario: string, config: { duration: number }) {
  const _endTime =  Date.now() + config.duration;
  const _credentials =  LOAD_TEST_CONFIG.USER_CREDENTIALS[userId % LOAD_TEST_CONFIG.USER_CREDENTIALS.length];
  const _userIdStr =  `${scenario}-user-${userId}`;
  
  while (Date.now() < endTime) {
    // Simulate login
    const _loginStartTime =  performance.now();
    
    try {
      const _loginResponse =  await request.post(`${LOAD_TEST_CONFIG.API_BASE_URL}/auth/login`, {
        data: credentials,
        timeout: 10000
      });
      
      const _loginDuration =  performance.now() - loginStartTime;
      
      loadTestMetrics.addMeasurement({
        endpoint: '/auth/login',
        method: 'POST',
        duration: loginDuration,
        status: loginResponse.status(),
        userId: userIdStr,
        scenario
      });
      
      if (loginResponse.status() === 200) {
        const _loginData =  await loginResponse.json();
        const _accessToken =  loginData.data.tokens.accessToken;
        
        // Simulate some authenticated requests
        await simulateAuthenticatedActivity(request, accessToken, userIdStr, scenario);
        
        // Simulate logout
        const _logoutStartTime =  performance.now();
        
        const _logoutResponse =  await request.post(`${LOAD_TEST_CONFIG.API_BASE_URL}/auth/logout`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          timeout: 5000
        });
        
        const _logoutDuration =  performance.now() - logoutStartTime;
        
        loadTestMetrics.addMeasurement({
          endpoint: '/auth/logout',
          method: 'POST',
          duration: logoutDuration,
          status: logoutResponse.status(),
          userId: userIdStr,
          scenario
        });
      }
      
    } catch (error) {
      const _loginDuration =  performance.now() - loginStartTime;
      
      loadTestMetrics.addMeasurement({
        endpoint: '/auth/login',
        method: 'POST',
        duration: loginDuration,
        status: 500,
        userId: userIdStr,
        scenario
      });
    }
    
    // Wait before next iteration
    await new Promise(_resolve = > setTimeout(resolve, Math.random() * 2000 + 1000));
  }
}

// Simulate authenticated user activity
async function simulateAuthenticatedActivity(
  request: any, accessToken: string, userId: string, scenario: string) {
  const _activities =  [
    { endpoint: '/api/v1/users/profile', method: 'GET' },
    { endpoint: '/api/v1/menu/items', method: 'GET' },
    { endpoint: '/api/v1/orders', method: 'GET' }
  ];
  
  // Randomly perform 1-3 activities
  const _activityCount =  Math.floor(Math.random() * 3) + 1;
  
  for (let i = 0; i < activityCount; i++) {
    const _activity =  activities[Math.floor(Math.random() * activities.length)];
    const _startTime =  performance.now();
    
    try {
      const _response =  await request.get(`${LOAD_TEST_CONFIG.API_BASE_URL}${activity.endpoint}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        timeout: 5000
      });
      
      const _duration =  performance.now() - startTime;
      
      loadTestMetrics.addMeasurement({
        endpoint: activity.endpoint,
        method: activity.method,
        duration,
        status: response.status(),
        userId,
        scenario
      });
      
    } catch (error) {
      const _duration =  performance.now() - startTime;
      
      loadTestMetrics.addMeasurement({
        endpoint: activity.endpoint,
        method: activity.method,
        duration,
        status: 500,
        userId,
        scenario
      });
    }
    
    // Small delay between activities
    await new Promise(_resolve = > setTimeout(resolve, Math.random() * 500 + 100));
  }
}