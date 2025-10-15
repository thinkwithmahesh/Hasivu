#!/usr/bin/env node

/**
 * HASIVU Platform - Load Testing Script for Menu API Performance
 * Simulates lunch rush conditions with 1000+ concurrent users
 *
 * Usage:
 *   node scripts/performance-load-test.js --scenario=lunch-rush
 *   node scripts/performance-load-test.js --scenario=search-heavy
 *   node scripts/performance-load-test.js --scenario=mixed-load
 *   node scripts/performance-load-test.js --scenario=stress-test
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  SCHOOL_ID: 'demo-school-001',
  OUTPUT_DIR: './test-results',

  SCENARIOS: {
    'lunch-rush': {
      name: 'Lunch Rush Simulation',
      description: 'Simulates 1000 students browsing menu during lunch period (11:30-13:30)',
      duration: 300, // 5 minutes
      concurrency: 1000,
      requestsPerSecond: 200,
      endpoints: [
        { path: '/api/menu/optimized?schoolId=demo-school-001&category=Lunch', weight: 40 },
        { path: '/api/menu/optimized?schoolId=demo-school-001&sortBy=popularity', weight: 25 },
        { path: '/api/menu/optimized?schoolId=demo-school-001&dietary=Vegetarian', weight: 15 },
        { path: '/api/menu/optimized?schoolId=demo-school-001&maxCalories=400', weight: 10 },
        { path: '/api/menu/optimized?schoolId=demo-school-001&search=dal', weight: 10 },
      ],
    },

    'search-heavy': {
      name: 'Search-Heavy Load Test',
      description: 'Tests search performance with complex queries and full-text search',
      duration: 180, // 3 minutes
      concurrency: 500,
      requestsPerSecond: 100,
      endpoints: [
        { path: '/api/menu/optimized?schoolId=demo-school-001&search=vegetarian rice', weight: 30 },
        { path: '/api/menu/optimized?schoolId=demo-school-001&search=protein dal', weight: 25 },
        { path: '/api/menu/optimized?schoolId=demo-school-001&search=healthy snacks', weight: 20 },
        { path: '/api/menu/optimized?schoolId=demo-school-001&search=south indian', weight: 15 },
        { path: '/api/menu/optimized?schoolId=demo-school-001&search=low calorie', weight: 10 },
      ],
    },

    'mixed-load': {
      name: 'Mixed Load Simulation',
      description: 'Realistic mix of browsing, searching, and filtering operations',
      duration: 600, // 10 minutes
      concurrency: 750,
      requestsPerSecond: 150,
      endpoints: [
        { path: '/api/menu/optimized?schoolId=demo-school-001', weight: 30 },
        { path: '/api/menu/optimized?schoolId=demo-school-001&category=Lunch', weight: 20 },
        { path: '/api/menu/optimized?schoolId=demo-school-001&dietary=Vegetarian', weight: 15 },
        { path: '/api/menu/optimized?schoolId=demo-school-001&search=dal rice', weight: 12 },
        { path: '/api/menu/optimized?schoolId=demo-school-001&sortBy=rating', weight: 10 },
        { path: '/api/menu/optimized?schoolId=demo-school-001&maxCalories=500', weight: 8 },
        { path: '/api/menu/optimized?schoolId=demo-school-001&ageGroup=11-15', weight: 5 },
      ],
    },

    'stress-test': {
      name: 'Stress Test - Breaking Point',
      description: 'Pushes system to limits to find breaking point',
      duration: 120, // 2 minutes
      concurrency: 2000,
      requestsPerSecond: 500,
      endpoints: [
        { path: '/api/menu/optimized?schoolId=demo-school-001&category=Lunch', weight: 100 },
      ],
    },
  },
};

// Test metrics tracking
class PerformanceTracker {
  constructor() {
    this.requests = [];
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
    this.concurrentRequests = 0;
    this.maxConcurrent = 0;
  }

  start() {
    this.startTime = performance.now();
    console.log(`🚀 Starting load test at ${new Date().toISOString()}`);
  }

  recordRequest(url, responseTime, statusCode, cacheHit = false, error = null) {
    const timestamp = performance.now();

    if (error) {
      this.errors.push({
        url,
        error: error.message,
        timestamp,
        responseTime,
      });
    } else {
      this.requests.push({
        url,
        responseTime,
        statusCode,
        cacheHit,
        timestamp,
      });
    }
  }

  updateConcurrency(delta) {
    this.concurrentRequests += delta;
    this.maxConcurrent = Math.max(this.maxConcurrent, this.concurrentRequests);
  }

  end() {
    this.endTime = performance.now();
    console.log(`🏁 Load test completed at ${new Date().toISOString()}`);
  }

  generateReport(scenario) {
    const totalDuration = (this.endTime - this.startTime) / 1000; // seconds
    const totalRequests = this.requests.length;
    const totalErrors = this.errors.length;

    // Calculate response time statistics
    const responseTimes = this.requests.map(r => r.responseTime);
    responseTimes.sort((a, b) => a - b);

    const percentile = p => {
      const index = Math.ceil((p / 100) * responseTimes.length) - 1;
      return responseTimes[index] || 0;
    };

    const avgResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

    // Calculate cache hit ratio
    const cacheHits = this.requests.filter(r => r.cacheHit).length;
    const cacheHitRatio = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

    // Calculate error rate
    const errorRate = (totalErrors / (totalRequests + totalErrors)) * 100;

    // Calculate requests per second
    const actualRPS = totalRequests / totalDuration;

    // Status code distribution
    const statusCodes = {};
    this.requests.forEach(r => {
      statusCodes[r.statusCode] = (statusCodes[r.statusCode] || 0) + 1;
    });

    const report = {
      scenario: {
        name: scenario.name,
        description: scenario.description,
        targetConcurrency: scenario.concurrency,
        targetRPS: scenario.requestsPerSecond,
        duration: scenario.duration,
      },

      execution: {
        startTime: new Date(this.startTime + Date.now() - performance.now()).toISOString(),
        endTime: new Date(this.endTime + Date.now() - performance.now()).toISOString(),
        actualDuration: totalDuration,
        maxConcurrentRequests: this.maxConcurrent,
      },

      performance: {
        totalRequests,
        totalErrors,
        successfulRequests: totalRequests,
        errorRate: Math.round(errorRate * 100) / 100,
        requestsPerSecond: Math.round(actualRPS * 100) / 100,

        responseTime: {
          average: Math.round(avgResponseTime),
          median: Math.round(percentile(50)),
          p90: Math.round(percentile(90)),
          p95: Math.round(percentile(95)),
          p99: Math.round(percentile(99)),
          min: Math.round(Math.min(...responseTimes)),
          max: Math.round(Math.max(...responseTimes)),
        },

        cache: {
          totalHits: cacheHits,
          hitRatio: Math.round(cacheHitRatio * 100) / 100,
          missRatio: Math.round((100 - cacheHitRatio) * 100) / 100,
        },
      },

      httpStatus: statusCodes,

      errors: this.errors.slice(0, 10), // Show first 10 errors

      assessment: this.assessPerformance(
        avgResponseTime,
        errorRate,
        cacheHitRatio,
        actualRPS,
        scenario
      ),
    };

    return report;
  }

  assessPerformance(avgResponseTime, errorRate, cacheHitRatio, actualRPS, scenario) {
    const assessment = {
      overall: 'UNKNOWN',
      scores: {},
      recommendations: [],
    };

    // Response time assessment
    if (avgResponseTime < 200) {
      assessment.scores.responseTime = { score: 100, status: 'EXCELLENT' };
    } else if (avgResponseTime < 500) {
      assessment.scores.responseTime = { score: 80, status: 'GOOD' };
    } else if (avgResponseTime < 1000) {
      assessment.scores.responseTime = { score: 60, status: 'FAIR' };
      assessment.recommendations.push(
        'Consider optimizing database queries and adding more caching'
      );
    } else {
      assessment.scores.responseTime = { score: 30, status: 'POOR' };
      assessment.recommendations.push(
        'CRITICAL: Response times exceed acceptable limits for lunch rush'
      );
    }

    // Error rate assessment
    if (errorRate < 0.5) {
      assessment.scores.errorRate = { score: 100, status: 'EXCELLENT' };
    } else if (errorRate < 1.0) {
      assessment.scores.errorRate = { score: 80, status: 'GOOD' };
    } else if (errorRate < 2.0) {
      assessment.scores.errorRate = { score: 60, status: 'FAIR' };
      assessment.recommendations.push('Monitor error patterns and improve error handling');
    } else {
      assessment.scores.errorRate = { score: 20, status: 'POOR' };
      assessment.recommendations.push('CRITICAL: High error rate indicates system instability');
    }

    // Cache hit ratio assessment
    if (cacheHitRatio > 80) {
      assessment.scores.cacheHitRatio = { score: 100, status: 'EXCELLENT' };
    } else if (cacheHitRatio > 60) {
      assessment.scores.cacheHitRatio = { score: 80, status: 'GOOD' };
    } else if (cacheHitRatio > 40) {
      assessment.scores.cacheHitRatio = { score: 60, status: 'FAIR' };
      assessment.recommendations.push('Improve caching strategy and increase TTL for stable data');
    } else {
      assessment.scores.cacheHitRatio = { score: 30, status: 'POOR' };
      assessment.recommendations.push(
        'CRITICAL: Low cache hit ratio indicates ineffective caching'
      );
    }

    // Throughput assessment
    const targetRPS = scenario.requestsPerSecond;
    const rpsRatio = (actualRPS / targetRPS) * 100;

    if (rpsRatio > 90) {
      assessment.scores.throughput = { score: 100, status: 'EXCELLENT' };
    } else if (rpsRatio > 75) {
      assessment.scores.throughput = { score: 80, status: 'GOOD' };
    } else if (rpsRatio > 50) {
      assessment.scores.throughput = { score: 60, status: 'FAIR' };
      assessment.recommendations.push('System struggling to maintain target throughput');
    } else {
      assessment.scores.throughput = { score: 20, status: 'POOR' };
      assessment.recommendations.push('CRITICAL: System cannot handle target load');
    }

    // Calculate overall score
    const scores = Object.values(assessment.scores).map(s => s.score);
    const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    if (overallScore >= 85) {
      assessment.overall = 'EXCELLENT';
    } else if (overallScore >= 70) {
      assessment.overall = 'GOOD';
    } else if (overallScore >= 55) {
      assessment.overall = 'FAIR';
    } else {
      assessment.overall = 'POOR';
    }

    return assessment;
  }
}

// HTTP request function with timeout and retries
function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const isHttps = url.startsWith('https');
    const httpModule = isHttps ? https : http;

    const request = httpModule.get(url, { timeout }, response => {
      let data = '';

      response.on('data', chunk => {
        data += chunk;
      });

      response.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        let cacheHit = false;
        try {
          const parsedData = JSON.parse(data);
          cacheHit = parsedData.meta?.cacheHit || false;
        } catch (e) {
          // Ignore JSON parse errors for cache hit detection
        }

        resolve({
          statusCode: response.statusCode,
          responseTime,
          cacheHit,
          headers: response.headers,
          body: data,
        });
      });
    });

    request.on('error', error => {
      const endTime = performance.now();
      reject({
        error,
        responseTime: endTime - startTime,
      });
    });

    request.on('timeout', () => {
      request.destroy();
      const endTime = performance.now();
      reject({
        error: new Error('Request timeout'),
        responseTime: endTime - startTime,
      });
    });

    request.setTimeout(timeout);
  });
}

// Load test runner
class LoadTestRunner {
  constructor(baseUrl, scenario) {
    this.baseUrl = baseUrl;
    this.scenario = scenario;
    this.tracker = new PerformanceTracker();
    this.isRunning = false;
  }

  async run() {
    console.log(`\n🔥 Starting ${this.scenario.name}`);
    console.log(
      `📊 Target: ${this.scenario.concurrency} concurrent users, ${this.scenario.requestsPerSecond} RPS for ${this.scenario.duration}s\n`
    );

    this.isRunning = true;
    this.tracker.start();

    // Calculate request intervals
    const intervalMs = 1000 / this.scenario.requestsPerSecond;
    const totalRequests = this.scenario.requestsPerSecond * this.scenario.duration;

    console.log(`📈 Will send ~${totalRequests} requests over ${this.scenario.duration} seconds`);

    const promises = [];
    let requestCount = 0;

    // Start request generation
    const requestInterval = setInterval(() => {
      if (!this.isRunning || requestCount >= totalRequests) {
        clearInterval(requestInterval);
        return;
      }

      // Select endpoint based on weight
      const endpoint = this.selectEndpoint();
      const url = `${this.baseUrl}${endpoint.path}`;

      // Start request
      const requestPromise = this.executeRequest(url);
      promises.push(requestPromise);
      requestCount++;

      // Log progress every 50 requests
      if (requestCount % 50 === 0) {
        console.log(`📊 Sent ${requestCount}/${totalRequests} requests...`);
      }
    }, intervalMs);

    // Stop test after duration
    setTimeout(() => {
      this.isRunning = false;
      clearInterval(requestInterval);
      console.log(`⏰ Test duration completed, waiting for pending requests...`);
    }, this.scenario.duration * 1000);

    // Wait for all requests to complete
    await Promise.allSettled(promises);

    this.tracker.end();

    console.log(`✅ All requests completed\n`);

    // Generate and save report
    const report = this.tracker.generateReport(this.scenario);
    await this.saveReport(report);

    return report;
  }

  selectEndpoint() {
    const totalWeight = this.scenario.endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    const random = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const endpoint of this.scenario.endpoints) {
      currentWeight += endpoint.weight;
      if (random <= currentWeight) {
        return endpoint;
      }
    }

    // Fallback to first endpoint
    return this.scenario.endpoints[0];
  }

  async executeRequest(url) {
    this.tracker.updateConcurrency(1);

    try {
      const result = await makeRequest(url);
      this.tracker.recordRequest(url, result.responseTime, result.statusCode, result.cacheHit);
    } catch (error) {
      this.tracker.recordRequest(url, error.responseTime || 0, 0, false, error.error || error);
    } finally {
      this.tracker.updateConcurrency(-1);
    }
  }

  async saveReport(report) {
    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
      fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `load-test-${report.scenario.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.json`;
    const filepath = path.join(CONFIG.OUTPUT_DIR, filename);

    // Save detailed report
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    // Print summary to console
    this.printSummary(report);

    console.log(`\n📄 Detailed report saved to: ${filepath}`);
  }

  printSummary(report) {
    console.log(`\n📊 LOAD TEST RESULTS - ${report.scenario.name}`);
    console.log('='.repeat(60));
    console.log(`📈 Performance Overview:`);
    console.log(`   • Total Requests: ${report.performance.totalRequests}`);
    console.log(`   • Successful: ${report.performance.successfulRequests}`);
    console.log(
      `   • Errors: ${report.performance.totalErrors} (${report.performance.errorRate}%)`
    );
    console.log(`   • Requests/sec: ${report.performance.requestsPerSecond}`);
    console.log(`   • Max Concurrent: ${report.execution.maxConcurrentRequests}`);

    console.log(`\n⏱️  Response Times:`);
    console.log(`   • Average: ${report.performance.responseTime.average}ms`);
    console.log(`   • Median (p50): ${report.performance.responseTime.median}ms`);
    console.log(`   • p90: ${report.performance.responseTime.p90}ms`);
    console.log(`   • p95: ${report.performance.responseTime.p95}ms`);
    console.log(`   • p99: ${report.performance.responseTime.p99}ms`);

    console.log(`\n💾 Cache Performance:`);
    console.log(`   • Hit Ratio: ${report.performance.cache.hitRatio}%`);
    console.log(`   • Cache Hits: ${report.performance.cache.totalHits}`);
    console.log(
      `   • Cache Misses: ${report.performance.totalRequests - report.performance.cache.totalHits}`
    );

    console.log(`\n🎯 Assessment: ${report.assessment.overall}`);
    Object.entries(report.assessment.scores).forEach(([metric, score]) => {
      console.log(`   • ${metric}: ${score.status} (${score.score}/100)`);
    });

    if (report.assessment.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      report.assessment.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    console.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const scenarioName =
    args.find(arg => arg.startsWith('--scenario='))?.split('=')[1] || 'lunch-rush';

  if (!CONFIG.SCENARIOS[scenarioName]) {
    console.error(`❌ Unknown scenario: ${scenarioName}`);
    console.log('Available scenarios:', Object.keys(CONFIG.SCENARIOS).join(', '));
    process.exit(1);
  }

  const scenario = CONFIG.SCENARIOS[scenarioName];
  const runner = new LoadTestRunner(CONFIG.BASE_URL, scenario);

  console.log(`🎯 HASIVU Menu API Load Test`);
  console.log(`🌐 Target: ${CONFIG.BASE_URL}`);
  console.log(`🏫 School: ${CONFIG.SCHOOL_ID}`);

  try {
    const report = await runner.run();

    // Exit with error code if performance is poor
    if (report.assessment.overall === 'POOR') {
      console.log(`\n❌ Load test failed - Performance is ${report.assessment.overall}`);
      process.exit(1);
    } else {
      console.log(`\n✅ Load test completed - Performance is ${report.assessment.overall}`);
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { LoadTestRunner, PerformanceTracker, CONFIG };
