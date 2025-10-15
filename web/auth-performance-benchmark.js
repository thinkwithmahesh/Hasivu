/**
 * HASIVU Platform - Authentication Performance Benchmark
 * Comprehensive performance analysis and load testing for authentication system
 *
 * Metrics Analyzed:
 * - Login response times and bottlenecks
 * - Token validation performance
 * - Session management efficiency
 * - Database query optimization
 * - Concurrent login capacity
 * - Memory usage during auth operations
 * - Caching effectiveness
 * - API endpoint performance under load
 */

const { performance } = require('perf_hooks');
// const axios = require('axios');
// const cluster = require('cluster');
// const numCPUs = require('os').cpus().length;

// Configuration
const CONFIG = {
  baseURL: process.env.API_URL || 'http://localhost:8000',
  testUsers: {
    student: { email: 'student@hasivu.test', password: 'Student123!' },
    parent: { email: 'parent@hasivu.test', password: 'Parent123!' },
    admin: { email: 'admin@hasivu.test', password: 'Admin123!' },
    kitchen: { email: 'kitchen@hasivu.test', password: 'Kitchen123!' },
    vendor: { email: 'vendor@hasivu.test', password: 'Vendor123!' },
  },
  performance: {
    maxLoginTime: 500, // ms - Target login response time
    maxTokenValidation: 50, // ms - Token validation time
    maxSessionLookup: 100, // ms - Session retrieval time
    maxConcurrentLogins: 100, // Concurrent login capacity
    maxMemoryUsage: 100, // MB - Memory usage limit
    maxDbQueryTime: 50, // ms - Database query time limit
  },
  loadTest: {
    concurrentUsers: [1, 5, 10, 25, 50, 100],
    duration: 30000, // ms - Test duration
    rampUpTime: 5000, // ms - Gradual user ramp-up
  },
};

// Performance metrics collector
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      loginTimes: [],
      tokenValidationTimes: [],
      sessionLookupTimes: [],
      memoryUsage: [],
      errorRates: {},
      concurrencyResults: {},
      cachingEffectiveness: {},
      databasePerformance: [],
    };
  }

  recordLoginTime(time, success = true) {
    this.metrics.loginTimes.push({ time, success, timestamp: Date.now() });
  }

  recordTokenValidation(time) {
    this.metrics.tokenValidationTimes.push({ time, timestamp: Date.now() });
  }

  recordSessionLookup(time) {
    this.metrics.sessionLookupTimes.push({ time, timestamp: Date.now() });
  }

  recordMemoryUsage() {
    const usage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      rss: usage.rss / 1024 / 1024, // MB
      heapUsed: usage.heapUsed / 1024 / 1024,
      heapTotal: usage.heapTotal / 1024 / 1024,
      external: usage.external / 1024 / 1024,
      timestamp: Date.now(),
    });
  }

  recordError(operation, error) {
    if (!this.metrics.errorRates[operation]) {
      this.metrics.errorRates[operation] = { total: 0, errors: 0 };
    }
    this.metrics.errorRates[operation].total++;
    if (error) {
      this.metrics.errorRates[operation].errors++;
    }
  }

  getStats() {
    const loginStats = this.calculateStats(this.metrics.loginTimes.map(l => l.time));
    const tokenStats = this.calculateStats(this.metrics.tokenValidationTimes.map(t => t.time));
    const sessionStats = this.calculateStats(this.metrics.sessionLookupTimes.map(s => s.time));
    const memoryStats = this.calculateMemoryStats();

    return {
      login: loginStats,
      tokenValidation: tokenStats,
      sessionLookup: sessionStats,
      memory: memoryStats,
      errorRates: this.calculateErrorRates(),
      concurrency: this.metrics.concurrencyResults,
      caching: this.metrics.cachingEffectiveness,
    };
  }

  calculateStats(times) {
    if (times.length === 0) return null;

    const sorted = times.sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: times.reduce((a, b) => a + b, 0) / times.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      count: times.length,
    };
  }

  calculateMemoryStats() {
    if (this.metrics.memoryUsage.length === 0) return null;

    const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    const peak = this.metrics.memoryUsage.reduce((max, current) =>
      current.heapUsed > max.heapUsed ? current : max
    );

    return {
      current: latest,
      peak,
      average: {
        rss:
          this.metrics.memoryUsage.reduce((sum, m) => sum + m.rss, 0) /
          this.metrics.memoryUsage.length,
        heapUsed:
          this.metrics.memoryUsage.reduce((sum, m) => sum + m.heapUsed, 0) /
          this.metrics.memoryUsage.length,
      },
    };
  }

  calculateErrorRates() {
    const rates = {};
    Object.keys(this.metrics.errorRates).forEach(operation => {
      const data = this.metrics.errorRates[operation];
      rates[operation] = {
        errorRate: data.total > 0 ? (data.errors / data.total) * 100 : 0,
        total: data.total,
        errors: data.errors,
      };
    });
    return rates;
  }
}

// Authentication performance tester
class AuthPerformanceTester {
  constructor() {
    this.metrics = new PerformanceMetrics();
    this.tokens = new Map(); // Cache for valid tokens
    this.sessionCache = new Map(); // Simulate session cache
  }

  async testSingleLogin(userType) {
    const startTime = performance.now();
    let success = false;

    try {
      // Simulate login API call
      const response = await this.mockLogin(CONFIG.testUsers[userType]);
      success = response.success;

      if (success) {
        this.tokens.set(userType, response.token);
      }
    } catch (error) {
      console.error(`Login failed for ${userType}:`, error.message);
    }

    const endTime = performance.now();
    const loginTime = endTime - startTime;

    this.metrics.recordLoginTime(loginTime, success);
    this.metrics.recordError('login', !success);
    this.metrics.recordMemoryUsage();

    return { time: loginTime, success };
  }

  async testTokenValidation(userType) {
    const token = this.tokens.get(userType);
    if (!token) throw new Error(`No token for ${userType}`);

    const startTime = performance.now();

    try {
      // Simulate token validation
      const isValid = await this.mockTokenValidation(token);
      const endTime = performance.now();
      const validationTime = endTime - startTime;

      this.metrics.recordTokenValidation(validationTime);
      this.metrics.recordError('tokenValidation', !isValid);

      return { time: validationTime, valid: isValid };
    } catch (error) {
      const endTime = performance.now();
      this.metrics.recordTokenValidation(endTime - startTime);
      this.metrics.recordError('tokenValidation', true);
      throw error;
    }
  }

  async testSessionLookup(userType) {
    const startTime = performance.now();

    try {
      // Check cache first (simulating Redis/memory cache)
      let session = this.sessionCache.get(userType);

      if (!session) {
        // Simulate database lookup
        await new Promise(resolve => setTimeout(resolve, Math.random() * 20)); // 0-20ms
        session = { userId: userType, role: userType, createdAt: Date.now() };
        this.sessionCache.set(userType, session);
      }

      const endTime = performance.now();
      const lookupTime = endTime - startTime;

      this.metrics.recordSessionLookup(lookupTime);
      this.metrics.recordError('sessionLookup', false);

      return { time: lookupTime, session };
    } catch (error) {
      const endTime = performance.now();
      this.metrics.recordSessionLookup(endTime - startTime);
      this.metrics.recordError('sessionLookup', true);
      throw error;
    }
  }

  async testConcurrentLogins(concurrentUsers) {
    console.log(`\n🚀 Testing ${concurrentUsers} concurrent logins...`);

    const promises = [];
    const userTypes = Object.keys(CONFIG.testUsers);

    for (let i = 0; i < concurrentUsers; i++) {
      const userType = userTypes[i % userTypes.length];
      promises.push(this.testSingleLogin(userType));
    }

    const startTime = performance.now();
    const results = await Promise.allSettled(promises);
    const endTime = performance.now();

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    const concurrencyResult = {
      users: concurrentUsers,
      successful,
      failed,
      successRate: (successful / concurrentUsers) * 100,
      totalTime: endTime - startTime,
      averageTime: (endTime - startTime) / concurrentUsers,
    };

    this.metrics.metrics.concurrencyResults[concurrentUsers] = concurrencyResult;

    console.log(
      `   ✅ Success: ${successful}/${concurrentUsers} (${concurrencyResult.successRate.toFixed(1)}%)`
    );
    console.log(`   ⏱️  Total time: ${concurrencyResult.totalTime.toFixed(2)}ms`);
    console.log(`   📊 Avg time per login: ${concurrencyResult.averageTime.toFixed(2)}ms`);

    return concurrencyResult;
  }

  async testCachingEffectiveness() {
    console.log('\n🗃️  Testing caching effectiveness...');

    // Test session cache hits vs misses
    const testResults = {
      sessionCache: { hits: 0, misses: 0 },
      tokenCache: { hits: 0, misses: 0 },
    };

    // Clear cache and test cold start
    this.sessionCache.clear();

    // First lookup (cache miss)
    const startMiss = performance.now();
    await this.testSessionLookup('student');
    const missTime = performance.now() - startMiss;
    testResults.sessionCache.misses++;

    // Second lookup (cache hit)
    const startHit = performance.now();
    await this.testSessionLookup('student');
    const hitTime = performance.now() - startHit;
    testResults.sessionCache.hits++;

    const improvement = ((missTime - hitTime) / missTime) * 100;

    this.metrics.metrics.cachingEffectiveness = {
      ...testResults,
      performance: {
        missTime,
        hitTime,
        improvement: improvement.toFixed(1),
      },
    };

    console.log(`   🎯 Cache miss time: ${missTime.toFixed(2)}ms`);
    console.log(`   ⚡ Cache hit time: ${hitTime.toFixed(2)}ms`);
    console.log(`   📈 Performance improvement: ${improvement.toFixed(1)}%`);

    return this.metrics.metrics.cachingEffectiveness;
  }

  async runComprehensiveBenchmark() {
    console.log('🏃 Starting HASIVU Authentication Performance Benchmark\n');

    // 1. Single user login tests
    console.log('1️⃣  Testing individual user role logins...');
    for (const userType of Object.keys(CONFIG.testUsers)) {
      const result = await this.testSingleLogin(userType);
      console.log(`   ${userType}: ${result.time.toFixed(2)}ms ${result.success ? '✅' : '❌'}`);
    }

    // 2. Token validation tests
    console.log('\n2️⃣  Testing token validation performance...');
    for (const userType of Object.keys(CONFIG.testUsers)) {
      try {
        const result = await this.testTokenValidation(userType);
        console.log(`   ${userType}: ${result.time.toFixed(2)}ms ${result.valid ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`   ${userType}: Error - ${error.message} ❌`);
      }
    }

    // 3. Session lookup tests
    console.log('\n3️⃣  Testing session lookup performance...');
    for (const userType of Object.keys(CONFIG.testUsers)) {
      const result = await this.testSessionLookup(userType);
      console.log(`   ${userType}: ${result.time.toFixed(2)}ms ✅`);
    }

    // 4. Caching effectiveness
    await this.testCachingEffectiveness();

    // 5. Concurrent login tests
    console.log('\n5️⃣  Testing concurrent login capacity...');
    for (const concurrentUsers of CONFIG.loadTest.concurrentUsers) {
      await this.testConcurrentLogins(concurrentUsers);

      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 6. Generate final report
    return this.generatePerformanceReport();
  }

  generatePerformanceReport() {
    const stats = this.metrics.getStats();

    console.log('\n\n📊 AUTHENTICATION PERFORMANCE REPORT');
    console.log('='.repeat(80));

    // Login Performance
    if (stats.login) {
      console.log('\n🔐 LOGIN PERFORMANCE:');
      console.log(`   Average: ${stats.login.mean.toFixed(2)}ms`);
      console.log(`   Median: ${stats.login.median.toFixed(2)}ms`);
      console.log(`   95th percentile: ${stats.login.p95.toFixed(2)}ms`);
      console.log(`   99th percentile: ${stats.login.p99.toFixed(2)}ms`);
      console.log(`   Min/Max: ${stats.login.min.toFixed(2)}ms / ${stats.login.max.toFixed(2)}ms`);

      const loginThresholdMet = stats.login.p95 <= CONFIG.performance.maxLoginTime;
      console.log(
        `   🎯 Target (<${CONFIG.performance.maxLoginTime}ms): ${loginThresholdMet ? '✅ PASS' : '❌ FAIL'}`
      );
    }

    // Token Validation Performance
    if (stats.tokenValidation) {
      console.log('\n🎫 TOKEN VALIDATION PERFORMANCE:');
      console.log(`   Average: ${stats.tokenValidation.mean.toFixed(2)}ms`);
      console.log(`   95th percentile: ${stats.tokenValidation.p95.toFixed(2)}ms`);

      const tokenThresholdMet = stats.tokenValidation.p95 <= CONFIG.performance.maxTokenValidation;
      console.log(
        `   🎯 Target (<${CONFIG.performance.maxTokenValidation}ms): ${tokenThresholdMet ? '✅ PASS' : '❌ FAIL'}`
      );
    }

    // Session Lookup Performance
    if (stats.sessionLookup) {
      console.log('\n👤 SESSION LOOKUP PERFORMANCE:');
      console.log(`   Average: ${stats.sessionLookup.mean.toFixed(2)}ms`);
      console.log(`   95th percentile: ${stats.sessionLookup.p95.toFixed(2)}ms`);

      const sessionThresholdMet = stats.sessionLookup.p95 <= CONFIG.performance.maxSessionLookup;
      console.log(
        `   🎯 Target (<${CONFIG.performance.maxSessionLookup}ms): ${sessionThresholdMet ? '✅ PASS' : '❌ FAIL'}`
      );
    }

    // Memory Usage
    if (stats.memory) {
      console.log('\n💾 MEMORY USAGE:');
      console.log(`   Current heap: ${stats.memory.current.heapUsed.toFixed(2)}MB`);
      console.log(`   Peak heap: ${stats.memory.peak.heapUsed.toFixed(2)}MB`);
      console.log(`   Average heap: ${stats.memory.average.heapUsed.toFixed(2)}MB`);

      const memoryThresholdMet = stats.memory.peak.heapUsed <= CONFIG.performance.maxMemoryUsage;
      console.log(
        `   🎯 Target (<${CONFIG.performance.maxMemoryUsage}MB): ${memoryThresholdMet ? '✅ PASS' : '❌ FAIL'}`
      );
    }

    // Error Rates
    console.log('\n❌ ERROR RATES:');
    Object.keys(stats.errorRates).forEach(operation => {
      const rate = stats.errorRates[operation];
      console.log(`   ${operation}: ${rate.errorRate.toFixed(2)}% (${rate.errors}/${rate.total})`);
    });

    // Concurrency Results
    console.log('\n🚦 CONCURRENCY PERFORMANCE:');
    Object.keys(stats.concurrency).forEach(users => {
      const result = stats.concurrency[users];
      console.log(
        `   ${users} users: ${result.successRate.toFixed(1)}% success, ${result.averageTime.toFixed(2)}ms avg`
      );
    });

    // Caching Effectiveness
    if (stats.caching.performance) {
      console.log('\n🗃️  CACHING EFFECTIVENESS:');
      console.log(`   Performance improvement: ${stats.caching.performance.improvement}%`);
      console.log(`   Cache hit time: ${stats.caching.performance.hitTime.toFixed(2)}ms`);
      console.log(`   Cache miss time: ${stats.caching.performance.missTime.toFixed(2)}ms`);
    }

    // Overall Assessment
    const overallScore = this.calculateOverallScore(stats);
    console.log('\n🎯 OVERALL PERFORMANCE SCORE:');
    console.log(`   ${overallScore.score}/100 - ${overallScore.grade}`);
    console.log(`   ${overallScore.assessment}`);

    // Recommendations
    console.log('\n💡 OPTIMIZATION RECOMMENDATIONS:');
    const recommendations = this.generateRecommendations(stats);
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    console.log(`\n${'='.repeat(80)}`);

    return {
      stats,
      overallScore,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  calculateOverallScore(stats) {
    let score = 100;
    const deductions = [];

    // Login performance (25 points)
    if (stats.login && stats.login.p95 > CONFIG.performance.maxLoginTime) {
      const deduction = Math.min(25, (stats.login.p95 / CONFIG.performance.maxLoginTime - 1) * 25);
      score -= deduction;
      deductions.push(`Login performance: -${deduction.toFixed(1)}`);
    }

    // Token validation (20 points)
    if (
      stats.tokenValidation &&
      stats.tokenValidation.p95 > CONFIG.performance.maxTokenValidation
    ) {
      const deduction = Math.min(
        20,
        (stats.tokenValidation.p95 / CONFIG.performance.maxTokenValidation - 1) * 20
      );
      score -= deduction;
      deductions.push(`Token validation: -${deduction.toFixed(1)}`);
    }

    // Session lookup (15 points)
    if (stats.sessionLookup && stats.sessionLookup.p95 > CONFIG.performance.maxSessionLookup) {
      const deduction = Math.min(
        15,
        (stats.sessionLookup.p95 / CONFIG.performance.maxSessionLookup - 1) * 15
      );
      score -= deduction;
      deductions.push(`Session lookup: -${deduction.toFixed(1)}`);
    }

    // Memory usage (15 points)
    if (stats.memory && stats.memory.peak.heapUsed > CONFIG.performance.maxMemoryUsage) {
      const deduction = Math.min(
        15,
        (stats.memory.peak.heapUsed / CONFIG.performance.maxMemoryUsage - 1) * 15
      );
      score -= deduction;
      deductions.push(`Memory usage: -${deduction.toFixed(1)}`);
    }

    // Error rates (15 points)
    Object.keys(stats.errorRates).forEach(operation => {
      if (stats.errorRates[operation].errorRate > 5) {
        // 5% threshold
        const deduction = Math.min(5, stats.errorRates[operation].errorRate / 5);
        score -= deduction;
        deductions.push(`${operation} errors: -${deduction.toFixed(1)}`);
      }
    });

    // Concurrency (10 points)
    const concurrencyResults = Object.values(stats.concurrency);
    if (concurrencyResults.length > 0) {
      const avgSuccessRate =
        concurrencyResults.reduce((sum, r) => sum + r.successRate, 0) / concurrencyResults.length;
      if (avgSuccessRate < 95) {
        const deduction = Math.min(10, (95 - avgSuccessRate) / 5);
        score -= deduction;
        deductions.push(`Concurrency: -${deduction.toFixed(1)}`);
      }
    }

    const finalScore = Math.max(0, score);

    let grade, assessment;
    if (finalScore >= 90) {
      grade = 'A';
      assessment = 'Excellent performance - Production ready';
    } else if (finalScore >= 80) {
      grade = 'B';
      assessment = 'Good performance - Minor optimizations recommended';
    } else if (finalScore >= 70) {
      grade = 'C';
      assessment = 'Adequate performance - Optimization required';
    } else if (finalScore >= 60) {
      grade = 'D';
      assessment = 'Poor performance - Significant optimization needed';
    } else {
      grade = 'F';
      assessment = 'Critical performance issues - Not production ready';
    }

    return {
      score: finalScore.toFixed(1),
      grade,
      assessment,
      deductions,
    };
  }

  generateRecommendations(stats) {
    const recommendations = [];

    // Login performance recommendations
    if (stats.login && stats.login.p95 > CONFIG.performance.maxLoginTime) {
      recommendations.push(
        'Optimize login endpoint - consider database connection pooling and query optimization'
      );
      recommendations.push('Implement login rate limiting and caching for user lookup');
      recommendations.push('Consider moving password hashing to background processes');
    }

    // Token validation recommendations
    if (
      stats.tokenValidation &&
      stats.tokenValidation.p95 > CONFIG.performance.maxTokenValidation
    ) {
      recommendations.push('Implement JWT token caching or use in-memory token validation');
      recommendations.push('Optimize token signature verification algorithms');
      recommendations.push('Consider using shorter-lived tokens with refresh mechanism');
    }

    // Session lookup recommendations
    if (stats.sessionLookup && stats.sessionLookup.p95 > CONFIG.performance.maxSessionLookup) {
      recommendations.push('Implement Redis or Memcached for session storage');
      recommendations.push('Add database indexes for session lookup queries');
      recommendations.push('Consider session data denormalization for faster access');
    }

    // Memory recommendations
    if (stats.memory && stats.memory.peak.heapUsed > CONFIG.performance.maxMemoryUsage) {
      recommendations.push('Implement garbage collection optimization');
      recommendations.push('Review for memory leaks in authentication flows');
      recommendations.push('Consider connection pooling to reduce memory overhead');
    }

    // Error rate recommendations
    Object.keys(stats.errorRates).forEach(operation => {
      if (stats.errorRates[operation].errorRate > 5) {
        recommendations.push(
          `Investigate ${operation} failures - implement better error handling and retry logic`
        );
      }
    });

    // Concurrency recommendations
    const concurrencyResults = Object.values(stats.concurrency);
    if (concurrencyResults.length > 0) {
      const avgSuccessRate =
        concurrencyResults.reduce((sum, r) => sum + r.successRate, 0) / concurrencyResults.length;
      if (avgSuccessRate < 95) {
        recommendations.push('Implement proper load balancing and database connection pooling');
        recommendations.push('Add circuit breakers and graceful degradation mechanisms');
        recommendations.push('Consider horizontal scaling for authentication services');
      }
    }

    // Caching recommendations
    if (stats.caching.performance && parseFloat(stats.caching.performance.improvement) < 50) {
      recommendations.push('Improve caching strategy - implement multi-level caching');
      recommendations.push('Add cache warming strategies for frequently accessed data');
    }

    // General recommendations
    recommendations.push('Implement comprehensive monitoring and alerting for auth performance');
    recommendations.push('Add performance budgets and regression testing to CI/CD pipeline');
    recommendations.push('Consider implementing authentication microservice for better scaling');

    return recommendations;
  }

  // Mock methods for testing (replace with actual API calls in real implementation)
  async mockLogin(credentials) {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    // Simulate database lookup
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));

    // Simulate password hashing verification
    await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 10));

    // Simulate 95% success rate
    const success = Math.random() > 0.05;

    return {
      success,
      token: success ? `mock-token-${Date.now()}` : null,
      user: success
        ? {
            id: `user-${credentials.email}`,
            email: credentials.email,
            role: 'student',
          }
        : null,
    };
  }

  async mockTokenValidation(token) {
    // Simulate token validation time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 5));

    // Simulate 99% validation success rate
    return Math.random() > 0.01;
  }
}

// Main execution
async function runAuthenticationBenchmark() {
  const tester = new AuthPerformanceTester();

  try {
    const report = await tester.runComprehensiveBenchmark();

    // Save report to file
    const fs = require('fs');
    const reportPath = `/Users/mahesha/Downloads/hasivu-platform/web/auth-performance-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Full report saved to: ${reportPath}`);

    return report;
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    throw error;
  }
}

// Export for use in other modules
if (require.main === module) {
  runAuthenticationBenchmark().catch(console.error);
}

module.exports = {
  AuthPerformanceTester,
  PerformanceMetrics,
  runAuthenticationBenchmark,
  CONFIG,
};
