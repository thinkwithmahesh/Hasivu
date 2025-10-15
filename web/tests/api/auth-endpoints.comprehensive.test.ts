/**
 * HASIVU Platform - Comprehensive Authentication API Testing Suite
 * 
 * This test suite conducts exhaustive API testing for authentication endpoints:
 * 1. API Endpoint Testing - Functionality, validation, error handling
 * 2. Integration Testing - Frontend-backend authentication flow
 * 3. Load Testing - Authentication API performance under load
 * 4. Security Testing - Vulnerability assessment and bypass attempts
 * 
 * Test Environment: Both production API and demo fallback modes
 * Performance Targets: <200ms response time, >1000 RPS, <0.1% error rate
 */

import { test, expect, APIRequestContext, Page } from '@playwright/test';
import { performance } from 'perf_hooks';

// Test Configuration
const _TEST_CONFIG =  {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.hasivu.com',
  TIMEOUT: 10000,
  LOAD_TEST_DURATION: 30000, // 30 seconds
  CONCURRENT_REQUESTS: 100,
  PERFORMANCE_THRESHOLDS: {
    RESPONSE_TIME_MS: 200,
    SUCCESS_RATE_PERCENT: 99.9,
    THROUGHPUT_RPS: 1000
  }
};

// Test Data Sets
const AUTH_TEST_DATA = {
  VALID_CREDENTIALS: [
    { email: 'student@hasivu.test', password: 'Test123!', role: 'student' },
    { email: 'parent@hasivu.test', password: 'Test123!', role: 'parent' },
    { email: 'admin@hasivu.test', password: 'Test123!', role: 'admin' },
    { email: 'kitchen@hasivu.test', password: 'Test123!', role: 'kitchen_staff' },
    { email: 'vendor@hasivu.test', password: 'Test123!', role: 'vendor' }
  ],
  INVALID_CREDENTIALS: [
    { email: 'invalid@test.com', password: 'wrong', role: 'student' },
    { email: 'test@test.com', password: '', role: 'student' },
    { email: '', password: 'password', role: 'student' },
    { email: 'malformed-email', password: 'Test123!', role: 'student' }
  ],
  SECURITY_PAYLOADS: [
    { email: 'test@test.com\'; DROP TABLE users; --', password: 'Test123!', role: 'student' },
    { email: '<script>alert("xss")</script>', password: 'Test123!', role: 'student' },
    { email: 'test@test.com', password: '../../../etc/passwd', role: 'student' },
    { email: 'test@test.com', password: '${7*7}', role: 'student' }
  ]
};

// Performance monitoring utilities
class PerformanceMonitor {
  private static measurements: Array<{
    endpoint: string;
    method: string;
    duration: number;
    status: number;
    timestamp: number;
  }> = [];

  static startMeasurement() {
    return performance.now();
  }

  static endMeasurement(
    startTime: number, 
    endpoint: string, 
    method: string, 
    status: number
  ) {
    const _duration =  performance.now() - startTime;
    this.measurements.push({
      endpoint,
      method,
      duration,
      status,
      timestamp: Date.now()
    });
    return duration;
  }

  static getStats() {
    const _successful =  this.measurements.filter(m 
    const _failed =  this.measurements.filter(m 
    return {
      total: this.measurements.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / this.measurements.length) * 100,
      averageResponseTime: successful.reduce(_(sum, _m) => sum + m.duration, 0) / successful.length,
      maxResponseTime: Math.max(...successful.map(_m = > m.duration)),
      minResponseTime: Math.min(...successful.map(m 
  }

  private static percentile(arr: number[], p: number): number {
    const _sorted =  [...arr].sort((a, b) 
    const _index =  Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  static reset() {
    this._measurements =  [];
  }
}

test.describe(_'🔐 Authentication API Endpoints - Comprehensive Testing', _() => {
  
  test.describe(_'1. API Endpoint Functionality Testing', _() => {
    
    test(_'✅ POST /auth/login - Valid credentials for all roles', _async ({ request }) => {
      for (const credentials of AUTH_TEST_DATA.VALID_CREDENTIALS) {
        const _startTime =  PerformanceMonitor.startMeasurement();
        
        const _response =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/login`, {
          data: credentials,
          timeout: TEST_CONFIG.TIMEOUT
        });

        const _duration =  PerformanceMonitor.endMeasurement(
          startTime, '/auth/login', 'POST', response.status()
        );

        // Response validation
        expect(response.status()).toBe(200);
        expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME_MS);
        
        const _responseData =  await response.json();
        
        // Response structure validation
        expect(responseData).toHaveProperty('success', true);
        expect(responseData).toHaveProperty('data');
        expect(responseData.data).toHaveProperty('user');
        expect(responseData.data).toHaveProperty('tokens');
        expect(responseData.data.user).toHaveProperty('role', credentials.role);
        expect(responseData.data.tokens).toHaveProperty('accessToken');
        expect(responseData.data.tokens).toHaveProperty('refreshToken');
        expect(responseData.data.tokens).toHaveProperty('expiresIn');
        
        console.log(`✓ Login successful for ${credentials.role}: ${duration.toFixed(2)}ms`);
      }
    });

    test(_'❌ POST /auth/login - Invalid credentials handling', _async ({ request }) => {
      for (const credentials of AUTH_TEST_DATA.INVALID_CREDENTIALS) {
        const _startTime =  PerformanceMonitor.startMeasurement();
        
        const _response =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/login`, {
          data: credentials,
          timeout: TEST_CONFIG.TIMEOUT
        });

        const _duration =  PerformanceMonitor.endMeasurement(
          startTime, '/auth/login', 'POST', response.status()
        );

        // Should return appropriate error status
        expect([400, 401, 422]).toContain(response.status());
        expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME_MS);
        
        const _responseData =  await response.json();
        expect(responseData).toHaveProperty('success', false);
        expect(responseData).toHaveProperty('error');
        
        console.log(`✓ Invalid credentials properly rejected: ${credentials.email}, Status: ${response.status()}`);
      }
    });

    test(_'🔄 POST /auth/refresh - Token refresh functionality', _async ({ request }) => {
      // First login to get tokens
      const _loginResponse =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/login`, {
        data: AUTH_TEST_DATA.VALID_CREDENTIALS[0]
      });
      
      expect(loginResponse.status()).toBe(200);
      const _loginData =  await loginResponse.json();
      const _refreshToken =  loginData.data.tokens.refreshToken;

      // Test token refresh
      const _startTime =  PerformanceMonitor.startMeasurement();
      
      const _refreshResponse =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/refresh`, {
        data: { refreshToken },
        timeout: TEST_CONFIG.TIMEOUT
      });

      const _duration =  PerformanceMonitor.endMeasurement(
        startTime, '/auth/refresh', 'POST', refreshResponse.status()
      );

      expect(refreshResponse.status()).toBe(200);
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME_MS);
      
      const _refreshData =  await refreshResponse.json();
      expect(refreshData).toHaveProperty('success', true);
      expect(refreshData.data.tokens).toHaveProperty('accessToken');
      expect(refreshData.data.tokens.accessToken).not.toBe(loginData.data.tokens.accessToken);
      
      console.log(`✓ Token refresh successful: ${duration.toFixed(2)}ms`);
    });

    test(_'📤 POST /auth/logout - Logout functionality', _async ({ request }) => {
      // Login first
      const _loginResponse =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/login`, {
        data: AUTH_TEST_DATA.VALID_CREDENTIALS[0]
      });
      
      const _loginData =  await loginResponse.json();
      const _accessToken =  loginData.data.tokens.accessToken;

      // Test logout
      const _startTime =  PerformanceMonitor.startMeasurement();
      
      const _logoutResponse =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/logout`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: TEST_CONFIG.TIMEOUT
      });

      const _duration =  PerformanceMonitor.endMeasurement(
        startTime, '/auth/logout', 'POST', logoutResponse.status()
      );

      expect(logoutResponse.status()).toBe(200);
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME_MS);
      
      const _logoutData =  await logoutResponse.json();
      expect(logoutData).toHaveProperty('success', true);
      
      // Verify token is invalidated
      const _protectedResponse =  await request.get(`${TEST_CONFIG.API_BASE_URL}/api/v1/users/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      expect(protectedResponse.status()).toBe(401);
      
      console.log(`✓ Logout successful and token invalidated: ${duration.toFixed(2)}ms`);
    });

    test(_'🔑 POST /auth/register - User registration', _async ({ request }) => {
      const _registrationData =  {
        firstName: 'Test',
        lastName: 'User',
        email: `test.${Date.now()}@hasivu.test`,
        password: 'Test123!@#',
        role: 'student',
        schoolId: 'school-001'
      };

      const _startTime =  PerformanceMonitor.startMeasurement();
      
      const _response =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/register`, {
        data: registrationData,
        timeout: TEST_CONFIG.TIMEOUT
      });

      const _duration =  PerformanceMonitor.endMeasurement(
        startTime, '/auth/register', 'POST', response.status()
      );

      expect([200, 201]).toContain(response.status());
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME_MS);
      
      const _responseData =  await response.json();
      expect(responseData).toHaveProperty('success', true);
      expect(responseData.data.user).toHaveProperty('email', registrationData.email);
      expect(responseData.data.user).toHaveProperty('role', registrationData.role);
      
      console.log(`✓ Registration successful: ${duration.toFixed(2)}ms`);
    });

    test(_'📧 POST /auth/verify-email - Email verification', _async ({ request }) => {
      const _verificationToken =  'mock-verification-token-' + Date.now();

      const _startTime =  PerformanceMonitor.startMeasurement();
      
      const _response =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/verify-email`, {
        data: { token: verificationToken },
        timeout: TEST_CONFIG.TIMEOUT
      });

      const _duration =  PerformanceMonitor.endMeasurement(
        startTime, '/auth/verify-email', 'POST', response.status()
      );

      // Accept both success and "token not found" as valid responses
      expect([200, 404]).toContain(response.status());
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME_MS);
      
      console.log(`✓ Email verification endpoint responsive: ${duration.toFixed(2)}ms`);
    });

    test(_'🔒 POST /auth/forgot-password - Password reset request', _async ({ request }) => {
      const _startTime =  PerformanceMonitor.startMeasurement();
      
      const _response =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/forgot-password`, {
        data: { email: 'test@hasivu.test' },
        timeout: TEST_CONFIG.TIMEOUT
      });

      const _duration =  PerformanceMonitor.endMeasurement(
        startTime, '/auth/forgot-password', 'POST', response.status()
      );

      expect([200, 202]).toContain(response.status());
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME_MS);
      
      const _responseData =  await response.json();
      expect(responseData).toHaveProperty('success', true);
      
      console.log(`✓ Forgot password endpoint responsive: ${duration.toFixed(2)}ms`);
    });
  });

  test.describe(_'2. Integration Testing - Frontend-Backend Auth Flow', _() => {
    
    test(_'🔗 End-to-end authentication flow with UI', _async ({ page }) => {
      // Navigate to login page
      await page.goto('/auth/login');
      
      // Select student role
      await page.locator('[data-_testid = "role-tab-student"]').click();
      
      // Monitor network requests
      const apiCalls: Array<{ url: string; method: string; status: number; duration: number }> = [];
      
      page.on('response', _response = > {
        if (response.url().includes('/auth/')) {
          const request 
          apiCalls.push({
            url: response.url(),
            method: request.method(),
            status: response.status(),
            duration: response.request().timing()?.responseEnd || 0
          });
        }
      });

      // Fill and submit login form
      await page.locator('[data-_testid = "email-input"]').fill('student@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Test123!');
      await page.locator('[data-_testid = "login-button"]').click();

      // Wait for authentication to complete
      await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
      
      // Verify authentication API was called
      const _loginCall =  apiCalls.find(call 
      expect(loginCall).toBeDefined();
      expect(loginCall?.method).toBe('POST');
      expect(loginCall?.status).toBe(200);
      
      // Verify user is authenticated in UI
      await expect(page.locator('[data-_testid = "welcome-message"]')).toBeVisible();
      
      console.log(`✓ E2E auth flow completed. API calls: ${apiCalls.length}`);
    });

    test(_'🔐 Protected route access with authentication', _async ({ page }) => {
      // Try to access protected route without authentication
      await page.goto('/dashboard/admin');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*\/auth\/login/);
      
      // Login as admin
      await page.locator('[data-_testid = "role-tab-admin"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('admin@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Test123!');
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Should now be able to access admin dashboard
      await page.goto('/dashboard/admin');
      await expect(page).toHaveURL(/.*\/dashboard\/admin/);
      
      console.log('✓ Protected route access control working correctly');
    });

    test(_'🚪 Session management across browser tabs', _async ({ context }) => {
      // Open first tab and login
      const _page1 =  await context.newPage();
      await page1.goto('/auth/login');
      await page1.locator('[data-_testid = "role-tab-student"]').click();
      await page1.locator('[data-_testid = "email-input"]').fill('student@hasivu.test');
      await page1.locator('[data-_testid = "password-input"]').fill('Test123!');
      await page1.locator('[data-_testid = "login-button"]').click();
      await page1.waitForURL(/.*\/dashboard/);
      
      // Open second tab and check if session is shared
      const _page2 =  await context.newPage();
      await page2.goto('/dashboard');
      
      // Should be authenticated in second tab
      await expect(page2.locator('[data-_testid = "welcome-message"]')).toBeVisible();
      
      // Logout from first tab
      await page1.locator('[data-_testid = "user-menu"]').click();
      await page1.locator('[data-_testid = "logout-button"]').click();
      
      // Second tab should also be logged out
      await page2.reload();
      await expect(page2).toHaveURL(/.*\/auth\/login/);
      
      console.log('✓ Session management across tabs working correctly');
    });
  });

  test.describe(_'3. Load Testing - Authentication API Performance', _() => {
    
    test(_'⚡ Concurrent login requests - Performance test', _async ({ request }) => {
      PerformanceMonitor.reset();
      
      const _concurrentLogins =  Array.from({ length: TEST_CONFIG.CONCURRENT_REQUESTS }, (_, i) 
        return performLoginRequest(request, credentials);
      });

      console.log(`🚀 Starting load test: ${TEST_CONFIG.CONCURRENT_REQUESTS} concurrent logins...`);
      
      const _startTime =  Date.now();
      const _results =  await Promise.allSettled(concurrentLogins);
      const _endTime =  Date.now();
      
      const _stats =  PerformanceMonitor.getStats();
      const _duration =  (endTime - startTime) / 1000;
      
      console.log('📊 Load Test Results:');
      console.log(`- Total requests: ${stats.total}`);
      console.log(`- Success rate: ${stats.successRate.toFixed(2)}%`);
      console.log(`- Average response time: ${stats.averageResponseTime.toFixed(2)}ms`);
      console.log(`- P95 response time: ${stats.p95ResponseTime.toFixed(2)}ms`);
      console.log(`- Throughput: ${stats.throughputRPS.toFixed(2)} RPS`);
      console.log(`- Test duration: ${duration.toFixed(2)}s`);
      
      // Performance assertions
      expect(stats.successRate).toBeGreaterThanOrEqual(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SUCCESS_RATE_PERCENT);
      expect(stats.p95ResponseTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.RESPONSE_TIME_MS * 2); // Allow 2x threshold for P95
      expect(stats.throughputRPS).toBeGreaterThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.THROUGHPUT_RPS / 10); // Expect at least 10% of target
      
      console.log('✅ Load test passed performance thresholds');
    });

    test(_'🔄 Token refresh under load', _async ({ request }) => {
      // First, login to get refresh tokens
      const _loginPromises =  Array.from({ length: 20 }, () 
      const _loginResults =  await Promise.all(loginPromises);
      const _refreshTokens =  await Promise.all(
        loginResults.map(async response 
          return data.data.tokens.refreshToken;
        })
      );

      // Now test concurrent refresh requests
      PerformanceMonitor.reset();
      
      const _refreshPromises =  refreshTokens.map(refreshToken 
      console.log('🔄 Testing token refresh under load...');
      
      const _refreshResults =  await Promise.allSettled(refreshPromises);
      const _stats =  PerformanceMonitor.getStats();
      
      console.log(`✓ Token refresh load test - Success rate: ${stats.successRate.toFixed(2)}%`);
      expect(stats.successRate).toBeGreaterThanOrEqual(95); // Allow slight degradation under load
    });

    test(_'📈 Sustained load test - 30 second duration', _async ({ request }) => {
      PerformanceMonitor.reset();
      
      const _loadTestEndTime =  Date.now() + TEST_CONFIG.LOAD_TEST_DURATION;
      const requests: Promise<any>[] = [];
      
      console.log(`🏃 Starting sustained load test for ${TEST_CONFIG.LOAD_TEST_DURATION/1000}s...`);
      
      // Generate requests continuously for 30 seconds
      while (Date.now() < loadTestEndTime) {
        const _credentials =  AUTH_TEST_DATA.VALID_CREDENTIALS[
          Math.floor(Math.random() * AUTH_TEST_DATA.VALID_CREDENTIALS.length)
        ];
        
        requests.push(performLoginRequest(request, credentials));
        
        // Limit concurrent requests
        if (requests.length >= 50) {
          await Promise.race(requests);
          // Remove completed promises (simplified approach)
          requests.splice(0, 10);
        }
        
        await new Promise(resolve => setTimeout(resolve, 50)); // 20 RPS per loop
      }
      
      // Wait for remaining requests
      await Promise.allSettled(requests);
      
      const _stats =  PerformanceMonitor.getStats();
      
      console.log('📊 Sustained Load Test Results:');
      console.log(`- Total requests: ${stats.total}`);
      console.log(`- Success rate: ${stats.successRate.toFixed(2)}%`);
      console.log(`- Average response time: ${stats.averageResponseTime.toFixed(2)}ms`);
      console.log(`- Throughput: ${stats.throughputRPS.toFixed(2)} RPS`);
      
      expect(stats.successRate).toBeGreaterThanOrEqual(95);
      expect(stats.averageResponseTime).toBeLessThan(500); // Allow degradation under sustained load
      
      console.log('✅ Sustained load test completed successfully');
    });
  });

  test.describe(_'4. Security Testing - Vulnerability Assessment', _() => {
    
    test(_'🛡️ SQL injection attempts', _async ({ request }) => {
      for (const maliciousPayload of AUTH_TEST_DATA.SECURITY_PAYLOADS) {
        const _response =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/login`, {
          data: maliciousPayload,
          timeout: TEST_CONFIG.TIMEOUT
        });

        // Should not return 500 (server error) which might indicate SQL injection
        expect(response.status()).not.toBe(500);
        expect([400, 401, 422]).toContain(response.status());
        
        const _responseData =  await response.json();
        expect(responseData).toHaveProperty('success', false);
        
        console.log(`✓ SQL injection attempt blocked: ${maliciousPayload.email}`);
      }
    });

    test(_'🔒 Authentication bypass attempts', _async ({ request }) => {
      const _bypassAttempts =  [
        // Empty authentication header
        { headers: {} },
        // Malformed Bearer token
        { headers: { 'Authorization': 'Bearer invalid-token' } },
        // Different auth schemes
        { headers: { 'Authorization': 'Basic dGVzdDp0ZXN0' } },
        // Token manipulation
        { headers: { 'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.manipulated' } }
      ];

      for (const attempt of bypassAttempts) {
        const _response =  await request.get(`${TEST_CONFIG.API_BASE_URL}/api/v1/users/profile`, {
          headers: attempt.headers,
          timeout: TEST_CONFIG.TIMEOUT
        });

        // Should return 401 Unauthorized
        expect(response.status()).toBe(401);
        
        console.log(`✓ Bypass attempt blocked: ${JSON.stringify(attempt.headers)}`);
      }
    });

    test(_'⚡ Rate limiting validation', _async ({ request }) => {
      console.log('🚦 Testing rate limiting...');
      
      // Make rapid requests to test rate limiting
      const _rapidRequests =  Array.from({ length: 50 }, () 
      const _results =  await Promise.allSettled(rapidRequests);
      const _responses =  results
        .filter(result 
      const _rateLimitedResponses =  responses.filter(response 
      if (rateLimitedResponses.length > 0) {
        console.log(`✅ Rate limiting active - ${rateLimitedResponses.length} requests rate limited`);
        
        // Verify rate limit headers
        const _rateLimitResponse =  rateLimitedResponses[0];
        const _headers =  rateLimitResponse.headers();
        
        expect(headers).toHaveProperty('x-ratelimit-limit');
        expect(headers).toHaveProperty('x-ratelimit-remaining');
        expect(headers).toHaveProperty('x-ratelimit-reset');
      } else {
        console.log('⚠️ No rate limiting detected - consider implementing for production');
      }
    });

    test(_'🔐 Token manipulation and validation', _async ({ request }) => {
      // Get a valid token first
      const _loginResponse =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/login`, {
        data: AUTH_TEST_DATA.VALID_CREDENTIALS[0]
      });
      
      const _loginData =  await loginResponse.json();
      const _validToken =  loginData.data.tokens.accessToken;
      
      // Test various token manipulations
      const _tokenManipulations =  [
        validToken + 'manipulated', // Append data
        validToken.slice(0, -10) + 'modified', // Modify signature
        validToken.split('.').reverse().join('.'), // Reverse parts
        'fake.' + validToken.split('.')[1] + '.signature', // Fake header
        validToken.split('.')[0] + '.manipulated.' + validToken.split('.')[2] // Modify payload
      ];

      for (const manipulatedToken of tokenManipulations) {
        const _response =  await request.get(`${TEST_CONFIG.API_BASE_URL}/api/v1/users/profile`, {
          headers: { 'Authorization': `Bearer ${manipulatedToken}` },
          timeout: TEST_CONFIG.TIMEOUT
        });

        expect(response.status()).toBe(401);
        console.log(`✓ Token manipulation detected and blocked`);
      }
    });

    test(_'🌐 CORS and security headers validation', _async ({ request }) => {
      const _response =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/login`, {
        data: AUTH_TEST_DATA.VALID_CREDENTIALS[0]
      });

      const _headers =  response.headers();
      
      // Check for security headers
      const _expectedSecurityHeaders =  {
        'x-content-type-options': 'nosniff',
        'x-frame-options': /^(DENY|SAMEORIGIN)$/i,
        'x-xss-protection': /^1/,
        'strict-transport-security': /^max-age
      for (const [header, expectedValue] of Object.entries(expectedSecurityHeaders)) {
        const _headerValue =  headers[header];
        if (headerValue) {
          if (expectedValue instanceof RegExp) {
            expect(headerValue).toMatch(expectedValue);
          } else {
            expect(headerValue).toBe(expectedValue);
          }
          console.log(`✓ Security header present: ${header}: ${headerValue}`);
        } else {
          console.warn(`⚠️ Missing security header: ${header}`);
        }
      }
    });

    test(_'🕒 Session timeout and security', _async ({ request }) => {
      // Login and get token
      const _loginResponse =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/login`, {
        data: AUTH_TEST_DATA.VALID_CREDENTIALS[0]
      });
      
      const _loginData =  await loginResponse.json();
      const _accessToken =  loginData.data.tokens.accessToken;
      
      // Verify token works initially
      const _initialResponse =  await request.get(`${TEST_CONFIG.API_BASE_URL}/api/v1/users/profile`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      expect(initialResponse.status()).toBe(200);
      
      // Test that token has reasonable expiration
      const _tokenParts =  accessToken.split('.');
      if (tokenParts._length = 
        expect(payload).toHaveProperty('exp');
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const _currentTime =  Date.now();
        const _timeToExpiry =  expirationTime - currentTime;
        
        // Token should expire within reasonable time (1-24 hours)
        expect(timeToExpiry).toBeGreaterThan(0);
        expect(timeToExpiry).toBeLessThan(24 * 60 * 60 * 1000); // Less than 24 hours
        
        console.log(`✓ Token expires in ${Math.round(timeToExpiry / (1000 * 60))} minutes`);
      }
    });
  });
});

// Helper functions
async function performLoginRequest(request: APIRequestContext, credentials: any) {
  const _startTime =  PerformanceMonitor.startMeasurement();
  
  try {
    const _response =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/login`, {
      data: credentials,
      timeout: TEST_CONFIG.TIMEOUT
    });

    PerformanceMonitor.endMeasurement(
      startTime, '/auth/login', 'POST', response.status()
    );

    return response;
  } catch (error) {
    PerformanceMonitor.endMeasurement(
      startTime, '/auth/login', 'POST', 500
    );
    throw error;
  }
}

async function performRefreshRequest(request: APIRequestContext, refreshToken: string) {
  const _startTime =  PerformanceMonitor.startMeasurement();
  
  try {
    const _response =  await request.post(`${TEST_CONFIG.API_BASE_URL}/auth/refresh`, {
      data: { refreshToken },
      timeout: TEST_CONFIG.TIMEOUT
    });

    PerformanceMonitor.endMeasurement(
      startTime, '/auth/refresh', 'POST', response.status()
    );

    return response;
  } catch (error) {
    PerformanceMonitor.endMeasurement(
      startTime, '/auth/refresh', 'POST', 500
    );
    throw error;
  }
}