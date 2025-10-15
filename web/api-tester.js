/**
 * HASIVU Platform API Tester - Comprehensive Order Management & Kitchen Workflow Testing
 * Production readiness assessment tool for API coverage, performance, and reliability
 */

const axios = require('axios');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

class HASIVUAPITester {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.results = {
      endpoints: {},
      performance: {},
      coverage: {
        total: 0,
        tested: 0,
        missing: [],
        implemented: [],
      },
      errors: [],
      recommendations: [],
    };
    this.authToken = null;
    this.schoolTenantId = 'test-school-001';
  }

  // Color-coded logging
  log(type, message, data = null) {
    const colors = {
      SUCCESS: '\x1b[32m',
      ERROR: '\x1b[31m',
      WARNING: '\x1b[33m',
      INFO: '\x1b[36m',
      RESET: '\x1b[0m',
    };

    const timestamp = new Date().toISOString();
    console.log(`${colors[type]}[${timestamp}] ${type}: ${message}${colors.RESET}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  }

  // Generic API call with error handling and performance tracking
  async makeRequest(method, endpoint, data = null, headers = {}) {
    const startTime = performance.now();
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': this.schoolTenantId,
        ...headers,
      },
      timeout: 10000, // 10 second timeout
      validateStatus: () => true, // Don't throw on any status code
    };

    if (this.authToken) {
      config.headers.Authorization = `Bearer ${this.authToken}`;
    }

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.results.endpoints[endpoint] = {
        method,
        status: response.status,
        duration,
        success: response.status < 400,
        data: response.data,
        headers: response.headers,
      };

      this.log(
        response.status < 400 ? 'SUCCESS' : 'ERROR',
        `${method} ${endpoint} - ${response.status} (${duration.toFixed(2)}ms)`
      );

      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.results.endpoints[endpoint] = {
        method,
        status: 'ERROR',
        duration,
        success: false,
        error: error.message,
      };

      this.results.errors.push({
        endpoint,
        error: error.message,
        type: 'CONNECTION_ERROR',
      });

      this.log(
        'ERROR',
        `${method} ${endpoint} - Connection Failed (${duration.toFixed(2)}ms)`,
        error.message
      );
      return null;
    }
  }

  // Test system health endpoints
  async testHealthEndpoints() {
    this.log('INFO', '=== Testing Health Endpoints ===');

    await this.makeRequest('GET', '/api/health');
    await this.makeRequest('GET', '/api/status');
  }

  // Test menu management endpoints
  async testMenuEndpoints() {
    this.log('INFO', '=== Testing Menu Management Endpoints ===');

    await this.makeRequest('GET', '/api/menu');
    await this.makeRequest('GET', '/api/menu/categories');
    await this.makeRequest('GET', '/api/menu/search?q=idli');
    await this.makeRequest('GET', '/api/menu/optimized');
    await this.makeRequest('GET', '/api/menu/secure');
    await this.makeRequest('GET', '/api/menu/1');

    // Test menu filtering and pagination
    await this.makeRequest('GET', '/api/menu?category=Breakfast&page=1&limit=10');
    await this.makeRequest('GET', '/api/menu?dietary=Vegetarian&ageGroup=6-10');

    // Test creating menu item (should require admin auth)
    const newMenuItem = {
      name: 'Test Meal',
      description: 'Test meal for API validation',
      category: 'Lunch',
      price: '₹45',
      dietary: ['Vegetarian'],
      prepTime: '10 min',
    };
    await this.makeRequest('POST', '/api/menu', newMenuItem);
  }

  // Test order management endpoints (CRITICAL - Currently Missing)
  async testOrderEndpoints() {
    this.log('INFO', '=== Testing Order Management Endpoints ===');

    // Test order creation
    const sampleOrder = {
      userId: 'student-123',
      items: [
        { id: '1', name: 'Mini Idli with Sambar', quantity: 2, price: 45 },
        { id: '4', name: 'Dal Rice', quantity: 1, price: 25 },
      ],
      totalAmount: 115,
      deliveryType: 'pickup',
      paymentMethod: 'wallet',
      schoolId: this.schoolTenantId,
    };

    // Critical Order API Endpoints
    const orderEndpoints = [
      { method: 'GET', path: '/api/orders' },
      { method: 'POST', path: '/api/orders', data: sampleOrder },
      { method: 'GET', path: '/api/orders/student-123' },
      { method: 'GET', path: '/api/orders/order-123' },
      { method: 'PATCH', path: '/api/orders/order-123/status', data: { status: 'confirmed' } },
      { method: 'PUT', path: '/api/orders/order-123', data: sampleOrder },
      { method: 'DELETE', path: '/api/orders/order-123' },
    ];

    for (const endpoint of orderEndpoints) {
      await this.makeRequest(endpoint.method, endpoint.path, endpoint.data);
    }

    // Test order filtering and search
    await this.makeRequest('GET', '/api/orders?status=pending&date=2024-09-14');
    await this.makeRequest('GET', '/api/orders?userId=student-123&limit=10');
    await this.makeRequest('GET', `/api/orders?schoolId=${this.schoolTenantId}`);
  }

  // Test kitchen workflow endpoints (CRITICAL - Currently Missing)
  async testKitchenWorkflowEndpoints() {
    this.log('INFO', '=== Testing Kitchen Workflow Endpoints ===');

    const kitchenEndpoints = [
      { method: 'GET', path: '/api/kitchen/orders' },
      { method: 'GET', path: '/api/kitchen/orders/pending' },
      { method: 'GET', path: '/api/kitchen/orders/active' },
      {
        method: 'PATCH',
        path: '/api/kitchen/orders/order-123/status',
        data: { status: 'preparing' },
      },
      { method: 'POST', path: '/api/kitchen/orders/order-123/start' },
      { method: 'POST', path: '/api/kitchen/orders/order-123/complete' },
      { method: 'GET', path: '/api/kitchen/queue' },
      {
        method: 'POST',
        path: '/api/kitchen/prep-time',
        data: { orderId: 'order-123', estimatedTime: 15 },
      },
      { method: 'GET', path: '/api/kitchen/analytics' },
      { method: 'GET', path: '/api/kitchen/capacity' },
    ];

    for (const endpoint of kitchenEndpoints) {
      await this.makeRequest(endpoint.method, endpoint.path, endpoint.data);
    }
  }

  // Test payment integration endpoints (CRITICAL - Currently Missing)
  async testPaymentEndpoints() {
    this.log('INFO', '=== Testing Payment Integration Endpoints ===');

    const paymentData = {
      orderId: 'order-123',
      amount: 115,
      currency: 'INR',
      paymentMethod: 'razorpay',
    };

    const paymentEndpoints = [
      { method: 'POST', path: '/api/payments/create', data: paymentData },
      {
        method: 'POST',
        path: '/api/payments/verify',
        data: { paymentId: 'pay_123', signature: 'sig_123' },
      },
      { method: 'GET', path: '/api/payments/history/student-123' },
      { method: 'GET', path: '/api/payments/order-123' },
      { method: 'POST', path: '/api/payments/refund', data: { paymentId: 'pay_123', amount: 50 } },
      { method: 'GET', path: '/api/wallet/balance/student-123' },
      { method: 'POST', path: '/api/wallet/topup', data: { userId: 'student-123', amount: 500 } },
      {
        method: 'POST',
        path: '/api/wallet/deduct',
        data: { userId: 'student-123', amount: 115, orderId: 'order-123' },
      },
    ];

    for (const endpoint of paymentEndpoints) {
      await this.makeRequest(endpoint.method, endpoint.path, endpoint.data);
    }
  }

  // Test real-time communication (WebSocket)
  async testRealtimeEndpoints() {
    this.log('INFO', '=== Testing Real-time Communication ===');

    return new Promise(resolve => {
      try {
        const wsUrl = `${this.baseURL.replace('http', 'ws')}/api/ws`;
        const ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          this.results.errors.push({
            endpoint: '/api/ws',
            error: 'WebSocket connection timeout',
            type: 'WEBSOCKET_TIMEOUT',
          });
          this.log('WARNING', 'WebSocket connection timeout');
          ws.close();
          resolve();
        }, 5000);

        ws.on('open', () => {
          clearTimeout(timeout);
          this.log('SUCCESS', 'WebSocket connection established');

          // Test sending order updates
          ws.send(
            JSON.stringify({
              type: 'ORDER_STATUS_UPDATE',
              orderId: 'order-123',
              status: 'preparing',
              schoolId: this.schoolTenantId,
            })
          );

          setTimeout(() => {
            ws.close();
            resolve();
          }, 2000);
        });

        ws.on('error', error => {
          clearTimeout(timeout);
          this.results.errors.push({
            endpoint: '/api/ws',
            error: error.message,
            type: 'WEBSOCKET_ERROR',
          });
          this.log('ERROR', 'WebSocket connection failed', error.message);
          resolve();
        });

        ws.on('message', data => {
          this.log('SUCCESS', 'WebSocket message received', data.toString());
        });
      } catch (error) {
        this.results.errors.push({
          endpoint: '/api/ws',
          error: error.message,
          type: 'WEBSOCKET_SETUP_ERROR',
        });
        this.log('ERROR', 'WebSocket setup failed', error.message);
        resolve();
      }
    });
  }

  // Test multi-tenant security
  async testMultiTenantSecurity() {
    this.log('INFO', '=== Testing Multi-Tenant Security ===');

    // Test without tenant ID
    await this.makeRequest('GET', '/api/orders', null, { 'X-Tenant-ID': '' });

    // Test with different tenant ID
    await this.makeRequest('GET', '/api/orders', null, { 'X-Tenant-ID': 'different-school' });

    // Test with malicious tenant ID
    await this.makeRequest('GET', '/api/orders', null, { 'X-Tenant-ID': '../admin' });
  }

  // Performance stress testing
  async performanceStressTest() {
    this.log('INFO', '=== Performance Stress Testing ===');

    const concurrentRequests = 10;
    const testEndpoint = '/api/menu';
    const promises = [];

    const startTime = performance.now();

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(this.makeRequest('GET', `${testEndpoint}?test=${i}`));
    }

    await Promise.all(promises);
    const endTime = performance.now();

    this.results.performance.concurrentRequests = {
      count: concurrentRequests,
      totalTime: endTime - startTime,
      averageTime: (endTime - startTime) / concurrentRequests,
    };

    this.log('INFO', `Concurrent requests completed in ${(endTime - startTime).toFixed(2)}ms`);
  }

  // Analyze results and generate recommendations
  analyzeResults() {
    this.log('INFO', '=== Analyzing Results ===');

    // Calculate coverage
    const expectedEndpoints = [
      // Health & Status
      '/api/health',
      '/api/status',

      // Menu Management (Implemented)
      '/api/menu',
      '/api/menu/categories',
      '/api/menu/search',
      '/api/menu/optimized',
      '/api/menu/secure',

      // Order Management (MISSING - CRITICAL)
      '/api/orders',
      '/api/orders/student-123',
      '/api/orders/order-123',

      // Kitchen Workflow (MISSING - CRITICAL)
      '/api/kitchen/orders',
      '/api/kitchen/queue',
      '/api/kitchen/analytics',

      // Payment Integration (MISSING - CRITICAL)
      '/api/payments/create',
      '/api/payments/verify',
      '/api/wallet/balance',

      // Real-time Communication (MISSING)
      '/api/ws',
    ];

    this.results.coverage.total = expectedEndpoints.length;
    this.results.coverage.tested = Object.keys(this.results.endpoints).length;

    // Identify missing critical endpoints
    const implementedEndpoints = Object.keys(this.results.endpoints).filter(
      endpoint => this.results.endpoints[endpoint].success
    );

    const missingCriticalEndpoints = [
      '/api/orders',
      '/api/kitchen/orders',
      '/api/payments/create',
      '/api/wallet/balance',
    ].filter(endpoint => !implementedEndpoints.includes(endpoint));

    this.results.coverage.missing = expectedEndpoints.filter(
      endpoint => !Object.keys(this.results.endpoints).includes(endpoint)
    );
    this.results.coverage.implemented = implementedEndpoints;

    // Performance analysis
    const successfulRequests = Object.values(this.results.endpoints).filter(
      result => result.success && typeof result.duration === 'number'
    );

    if (successfulRequests.length > 0) {
      const durations = successfulRequests.map(result => result.duration);
      this.results.performance.averageResponseTime =
        durations.reduce((a, b) => a + b, 0) / durations.length;
      this.results.performance.maxResponseTime = Math.max(...durations);
      this.results.performance.minResponseTime = Math.min(...durations);
    }

    // Generate recommendations
    if (missingCriticalEndpoints.length > 0) {
      this.results.recommendations.push({
        priority: 'CRITICAL',
        category: 'Missing APIs',
        issue: 'Critical order management endpoints are not implemented',
        endpoints: missingCriticalEndpoints,
        impact: 'Cannot process orders, payments, or kitchen workflows',
      });
    }

    if (this.results.errors.length > 10) {
      this.results.recommendations.push({
        priority: 'HIGH',
        category: 'Error Rate',
        issue: `High error rate: ${this.results.errors.length} errors detected`,
        impact: 'Poor user experience and system reliability',
      });
    }

    if (this.results.performance.averageResponseTime > 1000) {
      this.results.recommendations.push({
        priority: 'HIGH',
        category: 'Performance',
        issue: `Slow API responses: ${this.results.performance.averageResponseTime.toFixed(2)}ms average`,
        impact: 'Poor user experience, especially on mobile devices',
      });
    }
  }

  // Calculate production readiness score
  calculateReadinessScore() {
    let score = 0;
    const maxScore = 100;

    // API Coverage (40 points)
    const coveragePercentage =
      (this.results.coverage.implemented.length / this.results.coverage.total) * 100;
    score += (coveragePercentage / 100) * 40;

    // Critical API Implementation (30 points)
    const criticalApis = ['/api/orders', '/api/kitchen/orders', '/api/payments/create'];
    const implementedCritical = criticalApis.filter(api =>
      this.results.coverage.implemented.some(impl => impl.includes(api.split('/')[2]))
    ).length;
    score += (implementedCritical / criticalApis.length) * 30;

    // Performance (20 points)
    if (this.results.performance.averageResponseTime) {
      if (this.results.performance.averageResponseTime < 200) score += 20;
      else if (this.results.performance.averageResponseTime < 500) score += 15;
      else if (this.results.performance.averageResponseTime < 1000) score += 10;
      else score += 5;
    }

    // Error Rate (10 points)
    const errorRate = this.results.errors.length / Object.keys(this.results.endpoints).length;
    if (errorRate < 0.1) score += 10;
    else if (errorRate < 0.2) score += 8;
    else if (errorRate < 0.3) score += 6;
    else score += 3;

    return Math.min(score, maxScore);
  }

  // Generate comprehensive report
  generateReport() {
    const readinessScore = this.calculateReadinessScore();

    const report = {
      timestamp: new Date().toISOString(),
      productionReadinessScore: readinessScore,
      rating:
        readinessScore >= 8
          ? 'EXCELLENT'
          : readinessScore >= 6
            ? 'GOOD'
            : readinessScore >= 4
              ? 'FAIR'
              : 'POOR',
      summary: {
        totalEndpointsTested: Object.keys(this.results.endpoints).length,
        successfulRequests: Object.values(this.results.endpoints).filter(r => r.success).length,
        failedRequests: this.results.errors.length,
        averageResponseTime:
          `${this.results.performance.averageResponseTime?.toFixed(2)}ms` || 'N/A',
        coveragePercentage: `${(
          (this.results.coverage.implemented.length / this.results.coverage.total) *
          100
        ).toFixed(1)}%`,
      },
      criticalIssues: this.results.recommendations.filter(r => r.priority === 'CRITICAL'),
      missingEndpoints: this.results.coverage.missing,
      implementedEndpoints: this.results.coverage.implemented,
      performanceMetrics: this.results.performance,
      recommendations: this.results.recommendations,
      detailedResults: this.results.endpoints,
      errors: this.results.errors,
    };

    return report;
  }

  // Main test runner
  async runComprehensiveTests() {
    this.log('INFO', '🚀 Starting HASIVU Platform API Testing Suite');
    this.log('INFO', `Base URL: ${this.baseURL}`);
    this.log('INFO', `School Tenant: ${this.schoolTenantId}`);

    try {
      // Run all test suites
      await this.testHealthEndpoints();
      await this.testMenuEndpoints();
      await this.testOrderEndpoints();
      await this.testKitchenWorkflowEndpoints();
      await this.testPaymentEndpoints();
      await this.testRealtimeEndpoints();
      await this.testMultiTenantSecurity();
      await this.performanceStressTest();

      // Analysis
      this.analyzeResults();
      const report = this.generateReport();

      // Display results
      this.displaySummary(report);

      return report;
    } catch (error) {
      this.log('ERROR', 'Test suite failed', error.message);
      return { error: error.message, partialResults: this.results };
    }
  }

  // Display formatted test summary
  displaySummary(report) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🎯 HASIVU PLATFORM API TESTING SUMMARY');
    console.log('='.repeat(80));

    console.log(
      `\n📊 PRODUCTION READINESS SCORE: ${report.productionReadinessScore.toFixed(1)}/10.0 (${report.rating})`
    );

    console.log('\n📈 KEY METRICS:');
    console.log(`  • Endpoints Tested: ${report.summary.totalEndpointsTested}`);
    console.log(
      `  • Success Rate: ${report.summary.successfulRequests}/${report.summary.totalEndpointsTested}`
    );
    console.log(`  • API Coverage: ${report.summary.coveragePercentage}`);
    console.log(`  • Average Response Time: ${report.summary.averageResponseTime}`);

    if (report.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      report.criticalIssues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue.issue}`);
        console.log(`     Impact: ${issue.impact}`);
        if (issue.endpoints) {
          console.log(`     Missing: ${issue.endpoints.join(', ')}`);
        }
      });
    }

    if (report.missingEndpoints.length > 0) {
      console.log('\n❌ MISSING CRITICAL ENDPOINTS:');
      report.missingEndpoints.forEach(endpoint => {
        console.log(`  • ${endpoint}`);
      });
    }

    if (report.implementedEndpoints.length > 0) {
      console.log('\n✅ IMPLEMENTED ENDPOINTS:');
      report.implementedEndpoints.forEach(endpoint => {
        console.log(`  • ${endpoint}`);
      });
    }

    console.log('\n📋 RECOMMENDATIONS:');
    if (report.recommendations.length === 0) {
      console.log('  🎉 No critical recommendations - system appears production ready!');
    } else {
      report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
      });
    }

    console.log(`\n${'='.repeat(80)}`);
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HASIVUAPITester;
}

// CLI execution
if (require.main === module) {
  const baseURL = process.argv[2] || 'http://localhost:3000';
  const tester = new HASIVUAPITester(baseURL);

  tester
    .runComprehensiveTests()
    .then(report => {
      console.log(`\n📄 Full report saved to: hasivu-api-test-report-${Date.now()}.json`);
      require('fs').writeFileSync(
        `hasivu-api-test-report-${Date.now()}.json`,
        JSON.stringify(report, null, 2)
      );

      // Exit with appropriate code
      process.exit(report.productionReadinessScore >= 7 ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}
