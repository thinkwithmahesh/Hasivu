/**
 * HASIVU Platform - Real-time Performance Testing Suite
 * Comprehensive performance testing for WebSocket, Redis, RFID, and API endpoints
 * Production-ready load testing with detailed metrics and reporting
 */

import { performance } from 'perf_hooks';
import WebSocket from 'ws';
import Redis from 'ioredis';
import fetch from 'node-fetch';
import { logger } from '../src/utils/logger';

interface TestConfig {
  baseUrl: string;
  webSocketUrl: string;
  redisUrl: string;
  concurrentUsers: number;
  testDuration: number; // seconds
  rampUpTime: number; // seconds
  environment: 'development' | 'staging' | 'production';
}

interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  concurrentConnections: number;
}

interface WebSocketMetrics extends PerformanceMetrics {
  messagesExchanged: number;
  averageLatency: number;
  connectionEstablishmentTime: number;
  reconnections: number;
}

interface RedisMetrics extends PerformanceMetrics {
  cacheHitRatio: number;
  averageGetTime: number;
  averageSetTime: number;
  keyspaceSize: number;
  memoryUsage: number;
}

interface RFIDMetrics extends PerformanceMetrics {
  verificationsPerSecond: number;
  bulkVerificationTime: number;
  cardRegistrations: number;
  readerConnections: number;
}

interface APIEndpointMetrics extends PerformanceMetrics {
  endpoint: string;
  method: string;
  statusCodes: Record<number, number>;
}

class RealTimePerformanceTestSuite {
  private config: TestConfig;
  private activeConnections: Set<WebSocket> = new Set();
  private redis: Redis;
  private responseTimes: number[] = [];
  private testResults: {
    api: APIEndpointMetrics[];
    webSocket: WebSocketMetrics;
    redis: RedisMetrics;
    rfid: RFIDMetrics;
    summary: any;
  };

  constructor(config: TestConfig) {
    this.config = config;
    this.redis = new Redis(config.redisUrl);
    this.testResults = {
      api: [],
      webSocket: {} as WebSocketMetrics,
      redis: {} as RedisMetrics,
      rfid: {} as RFIDMetrics,
      summary: {},
    };
  }

  /**
   * Run comprehensive performance test suite
   */
  async runComprehensiveTests(): Promise<void> {
    console.log('🚀 Starting Real-time Performance Test Suite');
    console.log(`Environment: ${this.config.environment}`);
    console.log(`Concurrent Users: ${this.config.concurrentUsers}`);
    console.log(`Test Duration: ${this.config.testDuration}s`);
    console.log('============================================');

    try {
      // Run tests in parallel for realistic load simulation
      await Promise.all([
        this.testAPIEndpoints(),
        this.testWebSocketPerformance(),
        this.testRedisPerformance(),
        this.testRFIDVerificationPerformance(),
      ]);

      // Generate comprehensive report
      this.generatePerformanceReport();
      await this.saveTestResults();
    } catch (error) {
      logger.error('Performance test suite failed', error as Error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Test API endpoint performance
   */
  async testAPIEndpoints(): Promise<void> {
    console.log('🔍 Testing API Endpoint Performance...');

    const endpoints = [
      { path: '/health', method: 'GET', weight: 1 },
      { path: '/auth/login', method: 'POST', weight: 3 },
      { path: '/orders', method: 'GET', weight: 5 },
      { path: '/orders', method: 'POST', weight: 2 },
      { path: '/payments/verify', method: 'POST', weight: 4 },
      { path: '/rfid/verify-delivery', method: 'POST', weight: 3 },
      { path: '/users/profile', method: 'GET', weight: 2 },
      { path: '/menus/daily', method: 'GET', weight: 4 },
    ];

    for (const endpoint of endpoints) {
      const metrics = await this.testEndpoint(endpoint);
      this.testResults.api.push(metrics);
    }
  }

  /**
   * Test individual API endpoint
   */
  async testEndpoint(endpoint: {
    path: string;
    method: string;
    weight: number;
  }): Promise<APIEndpointMetrics> {
    const requestsToMake = Math.floor(this.config.concurrentUsers * endpoint.weight);
    const responseTimes: number[] = [];
    const statusCodes: Record<number, number> = {};
    let successfulRequests = 0;
    let failedRequests = 0;

    console.log(`  Testing ${endpoint.method} ${endpoint.path} (${requestsToMake} requests)`);

    const startTime = performance.now();

    // Create concurrent requests
    const requests = Array.from({ length: requestsToMake }, async (_, index) => {
      const delay = (index / requestsToMake) * this.config.rampUpTime * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      try {
        const requestStart = performance.now();
        const response = await this.makeAPIRequest(endpoint.path, endpoint.method);
        const requestEnd = performance.now();

        const responseTime = requestEnd - requestStart;
        responseTimes.push(responseTime);

        const statusCode = response.status;
        statusCodes[statusCode] = (statusCodes[statusCode] || 0) + 1;

        if (response.ok) {
          successfulRequests++;
        } else {
          failedRequests++;
        }
      } catch (error) {
        failedRequests++;
        statusCodes[500] = (statusCodes[500] || 0) + 1;
      }
    });

    await Promise.all(requests);
    const endTime = performance.now();

    // Calculate metrics
    responseTimes.sort((a, b) => a - b);
    const totalTime = (endTime - startTime) / 1000;

    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      startTime,
      endTime,
      totalRequests: requestsToMake,
      successfulRequests,
      failedRequests,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      requestsPerSecond: requestsToMake / totalTime,
      errorRate: (failedRequests / requestsToMake) * 100,
      concurrentConnections: this.config.concurrentUsers,
      statusCodes,
    };
  }

  /**
   * Make API request with authentication
   */
  async makeAPIRequest(path: string, method: string): Promise<any> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'HASIVU-Performance-Test/1.0',
    };

    // Add mock authentication for testing
    if (path !== '/health') {
      headers['Authorization'] = 'Bearer mock-test-token';
    }

    let body: string | undefined;

    // Add request body for POST requests
    if (method === 'POST') {
      switch (path) {
        case '/auth/login':
          body = JSON.stringify({
            email: 'test@hasivu.com',
            password: 'test123',
          });
          break;
        case '/orders':
          body = JSON.stringify({
            studentId: 'student-123',
            items: [{ menuItemId: 'item-1', quantity: 1 }],
          });
          break;
        case '/payments/verify':
          body = JSON.stringify({
            paymentId: 'pay-123',
            orderId: 'order-123',
          });
          break;
        case '/rfid/verify-delivery':
          body = JSON.stringify({
            cardNumber: 'CARD123456',
            readerId: 'reader-1',
            orderId: 'order-123',
          });
          break;
      }
    }

    return fetch(url, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(30000),
    });
  }

  /**
   * Test WebSocket performance
   */
  async testWebSocketPerformance(): Promise<void> {
    console.log('🌐 Testing WebSocket Performance...');

    const startTime = performance.now();
    const connectionTimes: number[] = [];
    const latencies: number[] = [];
    let messagesExchanged = 0;
    const reconnections = 0;
    let successfulConnections = 0;
    let failedConnections = 0;

    // Create concurrent WebSocket connections
    const connectionPromises = Array.from(
      { length: this.config.concurrentUsers },
      async (_, index) => {
        const delay = (index / this.config.concurrentUsers) * this.config.rampUpTime * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
          const connectionStart = performance.now();
          const ws = await this.createWebSocketConnection();
          const connectionEnd = performance.now();

          connectionTimes.push(connectionEnd - connectionStart);
          successfulConnections++;

          // Test message exchange
          const messageLatency = await this.testWebSocketMessages(ws);
          latencies.push(messageLatency);
          messagesExchanged += 10; // Each connection sends 10 test messages

          // Keep connection alive for test duration
          setTimeout(() => {
            ws.close();
          }, this.config.testDuration * 1000);
        } catch (error) {
          failedConnections++;
        }
      }
    );

    await Promise.all(connectionPromises);
    const endTime = performance.now();

    // Calculate WebSocket metrics
    this.testResults.webSocket = {
      startTime,
      endTime,
      totalRequests: this.config.concurrentUsers,
      successfulRequests: successfulConnections,
      failedRequests: failedConnections,
      averageResponseTime: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95ResponseTime: latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)] || 0,
      p99ResponseTime: latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.99)] || 0,
      minResponseTime: Math.min(...latencies),
      maxResponseTime: Math.max(...latencies),
      requestsPerSecond: messagesExchanged / this.config.testDuration,
      errorRate: (failedConnections / this.config.concurrentUsers) * 100,
      concurrentConnections: successfulConnections,
      messagesExchanged,
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      connectionEstablishmentTime:
        connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length,
      reconnections,
    };

    console.log(`  WebSocket connections: ${successfulConnections}/${this.config.concurrentUsers}`);
    console.log(`  Average latency: ${this.testResults.webSocket.averageLatency.toFixed(2)}ms`);
  }

  /**
   * Create WebSocket connection
   */
  async createWebSocketConnection(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.config.webSocketUrl);

      ws.on('open', () => {
        this.activeConnections.add(ws);
        resolve(ws);
      });

      ws.on('error', reject);

      ws.on('close', () => {
        this.activeConnections.delete(ws);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Test WebSocket message latency
   */
  async testWebSocketMessages(ws: WebSocket): Promise<number> {
    const latencies: number[] = [];

    for (let i = 0; i < 10; i++) {
      const latency = await this.sendWebSocketMessage(ws, {
        type: 'ping',
        timestamp: Date.now(),
        sequenceId: i,
      });
      latencies.push(latency);
    }

    return latencies.reduce((a, b) => a + b, 0) / latencies.length;
  }

  /**
   * Send WebSocket message and measure latency
   */
  async sendWebSocketMessage(ws: WebSocket, message: any): Promise<number> {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();

      ws.send(JSON.stringify(message));

      const responseHandler = (data: any) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.sequenceId === message.sequenceId) {
            const endTime = performance.now();
            ws.off('message', responseHandler);
            resolve(endTime - startTime);
          }
        } catch (error) {
          // Ignore parsing errors for other messages
        }
      };

      ws.on('message', responseHandler);

      // Timeout after 5 seconds
      setTimeout(() => {
        ws.off('message', responseHandler);
        reject(new Error('WebSocket message timeout'));
      }, 5000);
    });
  }

  /**
   * Test Redis caching performance
   */
  async testRedisPerformance(): Promise<void> {
    console.log('⚡ Testing Redis Caching Performance...');

    const startTime = performance.now();
    const getTimes: number[] = [];
    const setTimes: number[] = [];
    let hits = 0;
    let misses = 0;
    let successfulOperations = 0;
    let failedOperations = 0;

    // Test data
    const testKeys = Array.from({ length: 1000 }, (_, i) => `test:key:${i}`);
    const testValue = JSON.stringify({
      id: 'test-data',
      timestamp: Date.now(),
      data: 'x'.repeat(1024), // 1KB test data
    });

    try {
      // First, populate cache with test data
      console.log('  Populating cache...');
      for (let i = 0; i < testKeys.length; i++) {
        const setStart = performance.now();
        await this.redis.set(testKeys[i], testValue, 'EX', 3600); // 1 hour expiry
        const setEnd = performance.now();
        setTimes.push(setEnd - setStart);
        successfulOperations++;
      }

      // Test concurrent read operations
      console.log('  Testing concurrent reads...');
      const readPromises = Array.from(
        { length: this.config.concurrentUsers * 10 },
        async (_, index) => {
          const key = testKeys[index % testKeys.length];

          try {
            const getStart = performance.now();
            const result = await this.redis.get(key);
            const getEnd = performance.now();

            getTimes.push(getEnd - getStart);

            if (result) {
              hits++;
            } else {
              misses++;
            }

            successfulOperations++;
          } catch (error) {
            failedOperations++;
          }
        }
      );

      await Promise.all(readPromises);

      // Get Redis info
      const info = await this.redis.info('memory');
      const memoryUsage = this.parseRedisMemoryUsage(info);

      const keyspaceInfo = await this.redis.info('keyspace');
      const keyspaceSize = this.parseRedisKeyspaceSize(keyspaceInfo);

      const endTime = performance.now();

      // Calculate Redis metrics
      this.testResults.redis = {
        startTime,
        endTime,
        totalRequests: successfulOperations + failedOperations,
        successfulRequests: successfulOperations,
        failedRequests: failedOperations,
        averageResponseTime: getTimes.reduce((a, b) => a + b, 0) / getTimes.length,
        p95ResponseTime: getTimes.sort((a, b) => a - b)[Math.floor(getTimes.length * 0.95)] || 0,
        p99ResponseTime: getTimes.sort((a, b) => a - b)[Math.floor(getTimes.length * 0.99)] || 0,
        minResponseTime: Math.min(...getTimes),
        maxResponseTime: Math.max(...getTimes),
        requestsPerSecond:
          (successfulOperations + failedOperations) / ((endTime - startTime) / 1000),
        errorRate: (failedOperations / (successfulOperations + failedOperations)) * 100,
        concurrentConnections: this.config.concurrentUsers,
        cacheHitRatio: (hits / (hits + misses)) * 100,
        averageGetTime: getTimes.reduce((a, b) => a + b, 0) / getTimes.length,
        averageSetTime: setTimes.reduce((a, b) => a + b, 0) / setTimes.length,
        keyspaceSize,
        memoryUsage,
      };

      console.log(`  Cache hit ratio: ${this.testResults.redis.cacheHitRatio.toFixed(2)}%`);
      console.log(`  Average GET time: ${this.testResults.redis.averageGetTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('  Redis performance test failed:', error);
      throw error;
    }
  }

  /**
   * Test RFID verification performance
   */
  async testRFIDVerificationPerformance(): Promise<void> {
    console.log('📡 Testing RFID Verification Performance...');

    const startTime = performance.now();
    const verificationTimes: number[] = [];
    let successfulVerifications = 0;
    let failedVerifications = 0;
    const cardRegistrations = 0;

    // Test individual RFID verifications
    console.log('  Testing individual verifications...');
    const individualPromises = Array.from(
      { length: this.config.concurrentUsers * 5 },
      async (_, index) => {
        try {
          const verificationStart = performance.now();

          const response = await this.makeAPIRequest('/rfid/verify-delivery', 'POST');

          const verificationEnd = performance.now();
          verificationTimes.push(verificationEnd - verificationStart);

          if (response.ok) {
            successfulVerifications++;
          } else {
            failedVerifications++;
          }
        } catch (error) {
          failedVerifications++;
        }
      }
    );

    // Test bulk verifications
    console.log('  Testing bulk verifications...');
    const bulkStart = performance.now();
    const bulkPromises = Array.from({ length: 10 }, async () => {
      try {
        const response = await this.makeAPIRequest('/rfid/verify-bulk', 'POST');
        if (response.ok) {
          successfulVerifications += 50; // Assume 50 verifications per bulk
        }
      } catch (error) {
        failedVerifications += 50;
      }
    });

    await Promise.all([...individualPromises, ...bulkPromises]);
    const bulkEnd = performance.now();

    const endTime = performance.now();

    // Calculate RFID metrics
    this.testResults.rfid = {
      startTime,
      endTime,
      totalRequests: successfulVerifications + failedVerifications,
      successfulRequests: successfulVerifications,
      failedRequests: failedVerifications,
      averageResponseTime: verificationTimes.reduce((a, b) => a + b, 0) / verificationTimes.length,
      p95ResponseTime:
        verificationTimes.sort((a, b) => a - b)[Math.floor(verificationTimes.length * 0.95)] || 0,
      p99ResponseTime:
        verificationTimes.sort((a, b) => a - b)[Math.floor(verificationTimes.length * 0.99)] || 0,
      minResponseTime: Math.min(...verificationTimes),
      maxResponseTime: Math.max(...verificationTimes),
      requestsPerSecond:
        (successfulVerifications + failedVerifications) / ((endTime - startTime) / 1000),
      errorRate: (failedVerifications / (successfulVerifications + failedVerifications)) * 100,
      concurrentConnections: this.config.concurrentUsers,
      verificationsPerSecond: successfulVerifications / ((endTime - startTime) / 1000),
      bulkVerificationTime: bulkEnd - bulkStart,
      cardRegistrations,
      readerConnections: 5, // Mock reader connections
    };

    console.log(
      `  Verifications per second: ${this.testResults.rfid.verificationsPerSecond.toFixed(2)}`
    );
    console.log(
      `  Bulk verification time: ${this.testResults.rfid.bulkVerificationTime.toFixed(2)}ms`
    );
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(): void {
    console.log('\n📊 PERFORMANCE TEST RESULTS');
    console.log('===========================');

    // API Endpoints Summary
    console.log('\n🔗 API ENDPOINTS:');
    for (const api of this.testResults.api) {
      const status = api.errorRate < 1 ? '✅' : api.errorRate < 5 ? '⚠️' : '❌';
      console.log(`   ${status} ${api.method} ${api.endpoint}`);
      console.log(
        `      Avg: ${api.averageResponseTime.toFixed(2)}ms | P95: ${api.p95ResponseTime.toFixed(2)}ms | Error: ${api.errorRate.toFixed(2)}%`
      );
    }

    // WebSocket Performance
    console.log('\n🌐 WEBSOCKET:');
    const wsStatus = this.testResults.webSocket.errorRate < 1 ? '✅' : '❌';
    console.log(
      `   ${wsStatus} Connections: ${this.testResults.webSocket.successfulRequests}/${this.testResults.webSocket.totalRequests}`
    );
    console.log(
      `      Latency: ${this.testResults.webSocket.averageLatency?.toFixed(2)}ms | Messages: ${this.testResults.webSocket.messagesExchanged}`
    );

    // Redis Performance
    console.log('\n⚡ REDIS CACHE:');
    const redisStatus =
      this.testResults.redis.cacheHitRatio > 90
        ? '✅'
        : this.testResults.redis.cacheHitRatio > 70
          ? '⚠️'
          : '❌';
    console.log(
      `   ${redisStatus} Hit Ratio: ${this.testResults.redis.cacheHitRatio?.toFixed(2)}%`
    );
    console.log(
      `      GET: ${this.testResults.redis.averageGetTime?.toFixed(2)}ms | SET: ${this.testResults.redis.averageSetTime?.toFixed(2)}ms`
    );

    // RFID Performance
    console.log('\n📡 RFID VERIFICATION:');
    const rfidStatus = this.testResults.rfid.errorRate < 1 ? '✅' : '❌';
    console.log(
      `   ${rfidStatus} Verifications/sec: ${this.testResults.rfid.verificationsPerSecond?.toFixed(2)}`
    );
    console.log(
      `      Avg Time: ${this.testResults.rfid.averageResponseTime?.toFixed(2)}ms | Error: ${this.testResults.rfid.errorRate?.toFixed(2)}%`
    );

    // Overall Assessment
    const overallGrade = this.calculateOverallGrade();
    console.log(`\n🏆 OVERALL PERFORMANCE: ${overallGrade}`);

    // Performance recommendations
    this.generateRecommendations();
  }

  /**
   * Calculate overall performance grade
   */
  calculateOverallGrade(): string {
    let score = 100;

    // API performance scoring
    const apiErrors =
      this.testResults.api.reduce((sum, api) => sum + api.errorRate, 0) /
      this.testResults.api.length;
    const apiAvgTime =
      this.testResults.api.reduce((sum, api) => sum + api.averageResponseTime, 0) /
      this.testResults.api.length;

    if (apiErrors > 5) score -= 30;
    else if (apiErrors > 1) score -= 15;

    if (apiAvgTime > 500) score -= 20;
    else if (apiAvgTime > 200) score -= 10;

    // WebSocket scoring
    if (this.testResults.webSocket.errorRate > 5) score -= 20;
    if (this.testResults.webSocket.averageLatency > 100) score -= 10;

    // Redis scoring
    if (this.testResults.redis.cacheHitRatio < 70) score -= 15;
    if (this.testResults.redis.averageGetTime > 10) score -= 10;

    // RFID scoring
    if (this.testResults.rfid.errorRate > 5) score -= 20;
    if (this.testResults.rfid.verificationsPerSecond < 100) score -= 10;

    if (score >= 95) return 'A+ (Excellent)';
    if (score >= 85) return 'A (Very Good)';
    if (score >= 75) return 'B (Good)';
    if (score >= 65) return 'C (Fair)';
    return 'D (Needs Improvement)';
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(): void {
    console.log('\n💡 RECOMMENDATIONS:');

    // API recommendations
    const slowAPIs = this.testResults.api.filter(api => api.averageResponseTime > 200);
    if (slowAPIs.length > 0) {
      console.log(
        `   📝 Optimize slow API endpoints: ${slowAPIs.map(api => api.endpoint).join(', ')}`
      );
    }

    // Cache recommendations
    if (this.testResults.redis.cacheHitRatio < 90) {
      console.log('   📝 Improve cache strategy - current hit ratio below 90%');
    }

    // WebSocket recommendations
    if (this.testResults.webSocket.averageLatency > 50) {
      console.log('   📝 Optimize WebSocket latency - consider connection pooling');
    }

    // RFID recommendations
    if (this.testResults.rfid.verificationsPerSecond < 200) {
      console.log('   📝 Scale RFID verification capacity for peak load');
    }
  }

  /**
   * Save test results to file
   */
  async saveTestResults(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `performance-test-${this.config.environment}-${timestamp}.json`;

    try {
      const fs = await import('fs');
      await fs.promises.writeFile(filename, JSON.stringify(this.testResults, null, 2));
      console.log(`\n📄 Test results saved to: ${filename}`);
    } catch (error) {
      console.error('Failed to save test results:', error);
    }
  }

  /**
   * Parse Redis memory usage
   */
  parseRedisMemoryUsage(info: string): number {
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Parse Redis keyspace size
   */
  parseRedisKeyspaceSize(info: string): number {
    const match = info.match(/db0:keys=(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up test resources...');

    // Close WebSocket connections
    for (const ws of this.activeConnections) {
      ws.close();
    }

    // Disconnect Redis
    this.redis.disconnect();

    console.log('✅ Cleanup completed');
  }
}

// Configuration for different environments
const configs: Record<string, TestConfig> = {
  development: {
    baseUrl: 'http://localhost:3000',
    webSocketUrl: 'ws://localhost:3000',
    redisUrl: 'redis://localhost:6379',
    concurrentUsers: 10,
    testDuration: 60,
    rampUpTime: 10,
    environment: 'development',
  },
  staging: {
    baseUrl: process.env.STAGING_API_URL || 'https://staging-api.hasivu.com',
    webSocketUrl: process.env.STAGING_WS_URL || 'wss://staging-api.hasivu.com',
    redisUrl: process.env.STAGING_REDIS_URL || 'redis://staging-redis:6379',
    concurrentUsers: 50,
    testDuration: 300,
    rampUpTime: 30,
    environment: 'staging',
  },
  production: {
    baseUrl: process.env.PRODUCTION_API_URL || 'https://api.hasivu.com',
    webSocketUrl: process.env.PRODUCTION_WS_URL || 'wss://api.hasivu.com',
    redisUrl: process.env.PRODUCTION_REDIS_URL || 'redis://production-redis:6379',
    concurrentUsers: 100,
    testDuration: 600,
    rampUpTime: 60,
    environment: 'production',
  },
};

// Main execution
async function main() {
  const environment = (process.env.TEST_ENVIRONMENT || 'development') as keyof typeof configs;
  const config = configs[environment];

  if (!config) {
    console.error(`Invalid environment: ${environment}`);
    process.exit(1);
  }

  const testSuite = new RealTimePerformanceTestSuite(config);
  await testSuite.runComprehensiveTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export default RealTimePerformanceTestSuite;
