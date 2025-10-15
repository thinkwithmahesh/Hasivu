#!/usr/bin/env node

/**
 * HASIVU Platform Performance Benchmarker
 * Epic 1 → Story 4: Order Management & Kitchen Workflow System - Performance Assessment
 *
 * Comprehensive performance testing suite for production readiness evaluation
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

class PerformanceBenchmarker {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      timestamp: new Date().toISOString(),
      frontend: {},
      api: {},
      system: {},
      recommendations: [],
      score: 0,
    };
    this.testResults = [];
  }

  // 📊 Performance Measurement Utilities
  async measureResponseTime(url, method = 'GET', data = null, headers = {}) {
    const start = performance.now();
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${url}`,
        data,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HASIVU-Performance-Benchmarker/1.0',
          ...headers,
        },
        timeout: 30000,
        validateStatus: () => true, // Accept all status codes
      });

      const end = performance.now();
      const responseTime = end - start;

      return {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        responseTime: Math.round(responseTime),
        data: response.data,
        headers: response.headers,
        size: JSON.stringify(response.data || '').length,
      };
    } catch (error) {
      const end = performance.now();
      return {
        success: false,
        status: 0,
        responseTime: Math.round(end - start),
        error: error.message,
        size: 0,
      };
    }
  }

  // 🎯 Frontend Performance Testing
  async testFrontendPerformance() {
    console.log('\n🎨 Testing Frontend Performance...');

    const frontendTests = [
      { name: 'Homepage Load', path: '/' },
      { name: 'Login Page', path: '/login' },
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Menu Page', path: '/menu' },
      { name: 'Orders Page', path: '/orders' },
      { name: 'Kitchen Page', path: '/kitchen' },
      { name: 'Settings Page', path: '/settings' },
      { name: 'Admin Panel', path: '/admin' },
    ];

    const frontendResults = [];

    for (const test of frontendTests) {
      console.log(`  Testing ${test.name}...`);
      const result = await this.measureResponseTime(test.path);
      frontendResults.push({
        ...test,
        ...result,
      });
    }

    // Calculate frontend metrics
    const successfulTests = frontendResults.filter(r => r.success);
    const failedTests = frontendResults.filter(r => !r.success);

    this.results.frontend = {
      totalTests: frontendResults.length,
      successful: successfulTests.length,
      failed: failedTests.length,
      successRate: ((successfulTests.length / frontendResults.length) * 100).toFixed(1),
      averageResponseTime:
        successfulTests.length > 0
          ? Math.round(
              successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length
            )
          : 'N/A',
      maxResponseTime:
        successfulTests.length > 0 ? Math.max(...successfulTests.map(r => r.responseTime)) : 'N/A',
      minResponseTime:
        successfulTests.length > 0 ? Math.min(...successfulTests.map(r => r.responseTime)) : 'N/A',
      details: frontendResults,
    };

    return frontendResults;
  }

  // 🔌 API Performance Testing
  async testAPIPerformance() {
    console.log('\n🔌 Testing API Performance...');

    const apiTests = [
      // Working APIs (from previous assessment)
      { name: 'Health Check', path: '/api/health', method: 'GET', critical: true },
      { name: 'System Status', path: '/api/status', method: 'GET', critical: true },
      { name: 'Menu List', path: '/api/menu', method: 'GET', critical: true },
      { name: 'Menu Categories', path: '/api/menu/categories', method: 'GET', critical: true },
      { name: 'Menu Search', path: '/api/menu/search?q=rice', method: 'GET', critical: false },

      // Expected but missing APIs (will fail but we need response times)
      { name: 'Get Orders', path: '/api/orders', method: 'GET', critical: true },
      {
        name: 'Create Order',
        path: '/api/orders',
        method: 'POST',
        critical: true,
        data: { items: [{ menuId: 1, quantity: 2 }], userId: 'test-user' },
      },
      { name: 'Kitchen Orders', path: '/api/kitchen/orders', method: 'GET', critical: true },
      { name: 'Kitchen Queue', path: '/api/kitchen/queue', method: 'GET', critical: true },
      {
        name: 'Payment Create',
        path: '/api/payments/create',
        method: 'POST',
        critical: true,
        data: { orderId: 'test-order', amount: 250, currency: 'INR' },
      },
      {
        name: 'User Notifications',
        path: '/api/notifications/test-user',
        method: 'GET',
        critical: false,
      },
    ];

    const apiResults = [];

    for (const test of apiTests) {
      console.log(`  Testing ${test.name}...`);
      const result = await this.measureResponseTime(test.path, test.method, test.data);
      apiResults.push({
        ...test,
        ...result,
      });

      // Brief delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate API metrics
    const workingAPIs = apiResults.filter(r => r.success);
    const criticalAPIs = apiResults.filter(r => r.critical);
    const workingCriticalAPIs = criticalAPIs.filter(r => r.success);

    this.results.api = {
      totalAPIs: apiResults.length,
      working: workingAPIs.length,
      failed: apiResults.length - workingAPIs.length,
      criticalAPIs: criticalAPIs.length,
      workingCriticalAPIs: workingCriticalAPIs.length,
      apiCoverage: ((workingAPIs.length / apiResults.length) * 100).toFixed(1),
      criticalAPICoverage:
        criticalAPIs.length > 0
          ? ((workingCriticalAPIs.length / criticalAPIs.length) * 100).toFixed(1)
          : '0.0',
      averageResponseTime:
        workingAPIs.length > 0
          ? Math.round(workingAPIs.reduce((sum, r) => sum + r.responseTime, 0) / workingAPIs.length)
          : 'N/A',
      fastestAPI:
        workingAPIs.length > 0
          ? workingAPIs.reduce((fastest, current) =>
              current.responseTime < fastest.responseTime ? current : fastest
            ).name
          : 'N/A',
      slowestAPI:
        workingAPIs.length > 0
          ? workingAPIs.reduce((slowest, current) =>
              current.responseTime > slowest.responseTime ? current : slowest
            ).name
          : 'N/A',
      details: apiResults,
    };

    return apiResults;
  }

  // 🚀 Load Testing (Concurrent Requests)
  async testLoadPerformance() {
    console.log('\n🚀 Testing Load Performance...');

    const loadTests = [
      { name: 'Concurrent Health Checks', path: '/api/health', concurrent: 10 },
      { name: 'Concurrent Menu Requests', path: '/api/menu', concurrent: 20 },
      {
        name: 'Mixed API Load',
        paths: ['/api/health', '/api/status', '/api/menu'],
        concurrent: 15,
      },
    ];

    const loadResults = [];

    for (const test of loadTests) {
      console.log(`  Testing ${test.name} (${test.concurrent} concurrent requests)...`);

      const start = performance.now();
      let requests = [];

      if (test.paths) {
        // Mixed load test
        for (let i = 0; i < test.concurrent; i++) {
          const randomPath = test.paths[i % test.paths.length];
          requests.push(this.measureResponseTime(randomPath));
        }
      } else {
        // Single endpoint load test
        requests = Array(test.concurrent)
          .fill()
          .map(() => this.measureResponseTime(test.path));
      }

      const results = await Promise.all(requests);
      const end = performance.now();

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      loadResults.push({
        ...test,
        totalTime: Math.round(end - start),
        totalRequests: results.length,
        successful: successful.length,
        failed: failed.length,
        successRate: ((successful.length / results.length) * 100).toFixed(1),
        averageResponseTime:
          successful.length > 0
            ? Math.round(successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length)
            : 'N/A',
        requestsPerSecond:
          successful.length > 0 ? Math.round(successful.length / ((end - start) / 1000)) : 0,
        details: results,
      });

      // Cool down between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.results.system.loadTesting = loadResults;
    return loadResults;
  }

  // 💾 System Resource Analysis
  async analyzeSystemResources() {
    console.log('\n💾 Analyzing System Resources...');

    // Get system information from health endpoint
    try {
      const healthResponse = await this.measureResponseTime('/api/health');

      if (healthResponse.success && healthResponse.data) {
        const systemData = healthResponse.data.system || {};

        this.results.system.resources = {
          uptime: systemData.uptime || 'N/A',
          memory: {
            rss: systemData.memory?.rss
              ? `${Math.round(systemData.memory.rss / 1024 / 1024)} MB`
              : 'N/A',
            heapTotal: systemData.memory?.heapTotal
              ? `${Math.round(systemData.memory.heapTotal / 1024 / 1024)} MB`
              : 'N/A',
            heapUsed: systemData.memory?.heapUsed
              ? `${Math.round(systemData.memory.heapUsed / 1024 / 1024)} MB`
              : 'N/A',
            external: systemData.memory?.external
              ? `${Math.round(systemData.memory.external / 1024 / 1024)} MB`
              : 'N/A',
          },
          cpu: systemData.cpu || 'N/A',
          platform: systemData.platform || 'N/A',
          nodeVersion: systemData.nodeVersion || 'N/A',
        };
      }
    } catch (error) {
      console.log('  ⚠️  Could not retrieve system resource information');
      this.results.system.resources = { error: 'Unable to retrieve system resources' };
    }
  }

  // 📊 Bundle Size Analysis
  async analyzeBundleSize() {
    console.log('\n📦 Analyzing Bundle Size...');

    try {
      // Check if build artifacts exist
      const buildDir = path.join(process.cwd(), '.next');
      if (!fs.existsSync(buildDir)) {
        console.log('  ⚠️  No build artifacts found - run npm run build first');
        this.results.system.bundleSize = { error: 'No build artifacts found' };
        return;
      }

      // Get basic bundle information
      const bundleInfo = {
        buildExists: true,
        buildTime: 'Unknown',
        estimatedSize: 'Unknown',
      };

      // Try to get build info from .next directory
      const staticDir = path.join(buildDir, 'static');
      if (fs.existsSync(staticDir)) {
        try {
          const stats = fs.statSync(staticDir);
          bundleInfo.lastBuild = stats.mtime.toISOString();
        } catch (e) {
          // Ignore stats errors
        }
      }

      this.results.system.bundleSize = bundleInfo;
    } catch (error) {
      this.results.system.bundleSize = {
        error: 'Bundle size analysis failed',
        details: error.message,
      };
    }
  }

  // 🎯 Core Web Vitals Simulation
  simulateCoreWebVitals() {
    console.log('\n🎯 Simulating Core Web Vitals...');

    // Based on frontend performance data, simulate Core Web Vitals
    const frontendData = this.results.frontend;

    if (frontendData.averageResponseTime !== 'N/A') {
      // Simulate metrics based on response times
      const avgTime = parseInt(frontendData.averageResponseTime);
      const maxTime = parseInt(frontendData.maxResponseTime);

      this.results.system.coreWebVitals = {
        // Largest Contentful Paint (LCP) - estimate based on page response time
        lcp: {
          value: Math.round(avgTime * 2.5), // Simulate additional rendering time
          rating:
            avgTime * 2.5 < 2500 ? 'good' : avgTime * 2.5 < 4000 ? 'needs-improvement' : 'poor',
          threshold: { good: '<2.5s', needsImprovement: '<4s', poor: '>4s' },
        },

        // First Input Delay (FID) - estimate based on system responsiveness
        fid: {
          value: Math.round(avgTime * 0.1), // Simulate input delay
          rating: avgTime * 0.1 < 100 ? 'good' : avgTime * 0.1 < 300 ? 'needs-improvement' : 'poor',
          threshold: { good: '<100ms', needsImprovement: '<300ms', poor: '>300ms' },
        },

        // Cumulative Layout Shift (CLS) - estimate based on complexity
        cls: {
          value: 0.05, // Simulated value - actual measurement needs browser
          rating: 'good', // Assume good for well-structured React app
          threshold: { good: '<0.1', needsImprovement: '<0.25', poor: '>0.25' },
        },

        // First Contentful Paint (FCP)
        fcp: {
          value: Math.round(avgTime * 1.2),
          rating:
            avgTime * 1.2 < 1800 ? 'good' : avgTime * 1.2 < 3000 ? 'needs-improvement' : 'poor',
          threshold: { good: '<1.8s', needsImprovement: '<3s', poor: '>3s' },
        },

        note: 'Simulated values based on server response times - actual measurements require browser testing',
      };
    } else {
      this.results.system.coreWebVitals = {
        error: 'Cannot simulate Core Web Vitals - insufficient frontend data',
      };
    }
  }

  // 🎯 Performance Score Calculation
  calculatePerformanceScore() {
    console.log('\n🎯 Calculating Performance Score...');

    let score = 0;
    const factors = [];

    // API Coverage (40% of score)
    const apiCoverage = parseFloat(this.results.api.apiCoverage) / 100;
    const criticalAPICoverage = parseFloat(this.results.api.criticalAPICoverage) / 100;
    const apiScore = (apiCoverage * 0.6 + criticalAPICoverage * 0.4) * 40;
    score += apiScore;
    factors.push({ factor: 'API Coverage', weight: '40%', score: apiScore.toFixed(1) });

    // Frontend Performance (25% of score)
    const frontendSuccessRate = parseFloat(this.results.frontend.successRate) / 100;
    const frontendAvgTime = parseInt(this.results.frontend.averageResponseTime);
    const frontendTimeScore =
      frontendAvgTime < 200 ? 1 : frontendAvgTime < 500 ? 0.8 : frontendAvgTime < 1000 ? 0.6 : 0.3;
    const frontendScore = (frontendSuccessRate * 0.7 + frontendTimeScore * 0.3) * 25;
    score += frontendScore;
    factors.push({
      factor: 'Frontend Performance',
      weight: '25%',
      score: frontendScore.toFixed(1),
    });

    // System Resources (20% of score)
    let systemScore = 0;
    if (this.results.system.resources && !this.results.system.resources.error) {
      // Assume good system performance if resources are available
      systemScore = 18;
    } else {
      systemScore = 5; // Penalty for unavailable system metrics
    }
    score += systemScore;
    factors.push({ factor: 'System Resources', weight: '20%', score: systemScore.toFixed(1) });

    // Load Performance (15% of score)
    let loadScore = 0;
    if (this.results.system.loadTesting && this.results.system.loadTesting.length > 0) {
      const avgSuccessRate =
        this.results.system.loadTesting.reduce(
          (sum, test) => sum + parseFloat(test.successRate),
          0
        ) /
        this.results.system.loadTesting.length /
        100;
      loadScore = avgSuccessRate * 15;
    }
    score += loadScore;
    factors.push({ factor: 'Load Performance', weight: '15%', score: loadScore.toFixed(1) });

    this.results.score = Math.round(score);
    this.results.scoreBreakdown = factors;

    return score;
  }

  // 🎯 Generate Recommendations
  generateRecommendations() {
    console.log('\n💡 Generating Recommendations...');

    const recommendations = [];

    // API-related recommendations
    const apiCoverage = parseFloat(this.results.api.apiCoverage);
    const criticalAPICoverage = parseFloat(this.results.api.criticalAPICoverage);

    if (criticalAPICoverage < 50) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'API Infrastructure',
        issue: `Critical API coverage at ${criticalAPICoverage}%`,
        recommendation:
          'Implement missing core APIs: Order Management, Kitchen Workflow, Payment Processing',
        impact: 'Blocking - Platform cannot function without core APIs',
        timeline: '4-6 weeks',
      });
    }

    if (apiCoverage < 70) {
      recommendations.push({
        priority: 'HIGH',
        category: 'API Coverage',
        issue: `Overall API coverage at ${apiCoverage}%`,
        recommendation: 'Complete API implementation roadmap with comprehensive endpoint coverage',
        impact: 'Major - Limited functionality available to users',
        timeline: '2-3 weeks',
      });
    }

    // Frontend performance recommendations
    const frontendAvgTime = parseInt(this.results.frontend.averageResponseTime);
    if (frontendAvgTime > 500) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Frontend Performance',
        issue: `Average page load time ${frontendAvgTime}ms exceeds target`,
        recommendation: 'Optimize bundle size, implement code splitting, add caching strategies',
        impact: 'User Experience - Slow page loads affect user satisfaction',
        timeline: '1-2 weeks',
      });
    }

    // System resource recommendations
    if (this.results.system.resources && this.results.system.resources.error) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Monitoring',
        issue: 'System resource monitoring unavailable',
        recommendation: 'Implement comprehensive monitoring with APM tools (DataDog, New Relic)',
        impact: 'Operational - Cannot track performance or detect issues',
        timeline: '1 week',
      });
    }

    // Core Web Vitals recommendations
    const cwv = this.results.system.coreWebVitals;
    if (cwv && cwv.lcp && cwv.lcp.rating !== 'good') {
      recommendations.push({
        priority: 'HIGH',
        category: 'Core Web Vitals',
        issue: `LCP (${cwv.lcp.value}ms) rating: ${cwv.lcp.rating}`,
        recommendation:
          'Optimize largest contentful paint with image optimization, server-side rendering improvements',
        impact: 'SEO & UX - Poor Core Web Vitals affect search rankings and user experience',
        timeline: '2-3 weeks',
      });
    }

    // Load testing recommendations
    if (this.results.system.loadTesting && this.results.system.loadTesting.length > 0) {
      const avgSuccessRate =
        this.results.system.loadTesting.reduce(
          (sum, test) => sum + parseFloat(test.successRate),
          0
        ) / this.results.system.loadTesting.length;

      if (avgSuccessRate < 95) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Scalability',
          issue: `Load test success rate ${avgSuccessRate.toFixed(1)}% below target`,
          recommendation: 'Implement horizontal scaling, connection pooling, and caching layers',
          impact: 'Scalability - System may not handle production traffic levels',
          timeline: '2-4 weeks',
        });
      }
    }

    // Production readiness recommendations
    if (this.results.score < 50) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Production Readiness',
        issue: `Performance score ${this.results.score}/100 below production threshold`,
        recommendation: 'DO NOT DEPLOY TO PRODUCTION - Address critical infrastructure gaps first',
        impact: 'Business Critical - Platform failure in production environment',
        timeline: 'Immediate - Block deployment',
      });
    }

    this.results.recommendations = recommendations;
    return recommendations;
  }

  // 📊 Generate Report
  async generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const reportPath = path.join(process.cwd(), `performance-benchmark-report-${Date.now()}.json`);

    // Save detailed JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log('\n📋 PERFORMANCE BENCHMARK REPORT');
    console.log('═'.repeat(80));
    console.log(`📅 Assessment Date: ${this.results.timestamp}`);
    console.log(`🎯 Overall Performance Score: ${this.results.score}/100`);

    // Score interpretation
    let scoreInterpretation = '';
    if (this.results.score >= 80) {
      scoreInterpretation = '✅ EXCELLENT - Production Ready';
    } else if (this.results.score >= 60) {
      scoreInterpretation = '⚠️  GOOD - Minor optimizations needed';
    } else if (this.results.score >= 40) {
      scoreInterpretation = '❌ FAIR - Significant improvements required';
    } else {
      scoreInterpretation = '🚨 POOR - Not production ready';
    }
    console.log(`📊 Rating: ${scoreInterpretation}`);

    console.log('\n🎨 FRONTEND PERFORMANCE');
    console.log('-'.repeat(50));
    console.log(`• Pages Tested: ${this.results.frontend.totalTests}`);
    console.log(`• Success Rate: ${this.results.frontend.successRate}%`);
    console.log(`• Average Load Time: ${this.results.frontend.averageResponseTime}ms`);
    console.log(`• Max Load Time: ${this.results.frontend.maxResponseTime}ms`);

    console.log('\n🔌 API PERFORMANCE');
    console.log('-'.repeat(50));
    console.log(`• Total APIs Tested: ${this.results.api.totalAPIs}`);
    console.log(`• Working APIs: ${this.results.api.working}/${this.results.api.totalAPIs}`);
    console.log(`• API Coverage: ${this.results.api.apiCoverage}%`);
    console.log(`• Critical API Coverage: ${this.results.api.criticalAPICoverage}%`);
    console.log(`• Average Response Time: ${this.results.api.averageResponseTime}ms`);

    if (this.results.system.loadTesting && this.results.system.loadTesting.length > 0) {
      console.log('\n🚀 LOAD PERFORMANCE');
      console.log('-'.repeat(50));
      this.results.system.loadTesting.forEach(test => {
        console.log(
          `• ${test.name}: ${test.successful}/${test.totalRequests} requests (${test.successRate}%)`
        );
        console.log(`  - Avg Response: ${test.averageResponseTime}ms`);
        console.log(`  - Requests/sec: ${test.requestsPerSecond}`);
      });
    }

    if (this.results.system.coreWebVitals && !this.results.system.coreWebVitals.error) {
      console.log('\n🎯 CORE WEB VITALS (Simulated)');
      console.log('-'.repeat(50));
      const cwv = this.results.system.coreWebVitals;
      console.log(`• LCP: ${cwv.lcp.value}ms (${cwv.lcp.rating})`);
      console.log(`• FID: ${cwv.fid.value}ms (${cwv.fid.rating})`);
      console.log(`• CLS: ${cwv.cls.value} (${cwv.cls.rating})`);
      console.log(`• FCP: ${cwv.fcp.value}ms (${cwv.fcp.rating})`);
    }

    console.log('\n💡 TOP RECOMMENDATIONS');
    console.log('-'.repeat(50));
    this.results.recommendations
      .filter(rec => rec.priority === 'CRITICAL' || rec.priority === 'HIGH')
      .slice(0, 5)
      .forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.issue}`);
        console.log(`   └─ ${rec.recommendation}`);
        console.log(`   └─ Impact: ${rec.impact}`);
        console.log(`   └─ Timeline: ${rec.timeline}\n`);
      });

    console.log('\n💾 DETAILED RESULTS');
    console.log('-'.repeat(50));
    console.log(`📄 Full report saved: ${reportPath}`);

    return reportPath;
  }

  // 🚀 Main execution function
  async runBenchmarks() {
    console.log('🔥 HASIVU Platform Performance Benchmarker');
    console.log('═'.repeat(80));
    console.log('🎯 Mission: Epic 1 → Story 4 Performance Assessment');
    console.log('📅 Starting comprehensive performance testing...\n');

    try {
      // Test if server is running
      console.log('🔧 Checking server status...');
      const healthCheck = await this.measureResponseTime('/api/health');
      if (!healthCheck.success) {
        throw new Error('Server is not running. Please start with: npm run dev');
      }
      console.log('✅ Server is running and responsive\n');

      // Run all performance tests
      await this.testFrontendPerformance();
      await this.testAPIPerformance();
      await this.testLoadPerformance();
      await this.analyzeSystemResources();
      await this.analyzeBundleSize();
      this.simulateCoreWebVitals();

      // Generate final analysis
      this.calculatePerformanceScore();
      this.generateRecommendations();

      // Generate and save report
      const reportPath = await this.generateReport();

      console.log('\n🎉 Performance benchmarking complete!');
      console.log(`📊 Final Score: ${this.results.score}/100`);
      console.log(`📄 Detailed report: ${reportPath}`);
    } catch (error) {
      console.error('\n❌ Benchmarking failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the benchmarker if called directly
if (require.main === module) {
  const benchmarker = new PerformanceBenchmarker();
  benchmarker.runBenchmarks();
}

module.exports = PerformanceBenchmarker;
