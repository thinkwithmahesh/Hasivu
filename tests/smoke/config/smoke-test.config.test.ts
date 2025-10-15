/**
 * HASIVU Platform - Smoke Test Configuration
 *
 * Centralized configuration for smoke tests including environment settings,
 * timeouts, test data, and critical service endpoints.
 */

import { TestEnvironment, SmokeTestConfig } from '../utils/test-types';

// Environment configuration
export const TEST_ENVIRONMENT = (process.env.TEST_ENVIRONMENT || 'staging') as TestEnvironment;
export const TEST_TIMEOUT = 30000; // 30 seconds per test
export const SUITE_TIMEOUT = 300000; // 5 minutes total suite timeout

// Base URLs for different environments
export const ENVIRONMENT_CONFIGS = {
  development: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:3000/api/v1',
    websocketUrl: 'ws://localhost:3000'
  },
  staging: {
    baseUrl: 'https://staging.hasivu.com',
    apiUrl: 'https://staging-api.hasivu.com/api/v1',
    websocketUrl: 'wss://staging.hasivu.com'
  },
  production: {
    baseUrl: 'https://app.hasivu.com',
    apiUrl: 'https://api.hasivu.com/api/v1',
    websocketUrl: 'wss://app.hasivu.com'
  }
};

// Critical service endpoints that must be tested
export const CRITICAL_ENDPOINTS = {
  health: '/health',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    profile: '/auth/profile'
  },
  orders: {
    create: '/orders',
    list: '/orders',
    status: '/orders/{id}/status'
  },
  payments: {
    create: '/payments/orders',
    verify: '/payments/verify',
    status: '/payments/status/{id}'
  },
  rfid: {
    verify: '/rfid/verify-card',
    delivery: '/rfid/delivery/{orderId}',
    test: '/rfid/test-connection'
  },
  monitoring: {
    status: '/monitoring/status',
    metrics: '/monitoring/metrics'
  }
};

// Test data for smoke tests
export const TEST_DATA = {
  user: {
    email: `smoke-test-${Date.now()}@hasivu.com`,
    password: 'SmokeTest123!',
    name: 'Smoke Test User',
    role: 'student'
  },
  order: {
    items: [
      {
        menuItemId: 'test-menu-item-1',
        quantity: 1,
        specialInstructions: 'Smoke test order'
      }
    ],
    deliveryTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    paymentMethod: 'razorpay'
  },
  payment: {
    amount: 10000, // ₹100.00 in paisa
    currency: 'INR',
    method: 'card'
  },
  rfid: {
    cardId: 'TEST_CARD_001',
    studentId: 'test-student-001',
    orderId: 'test-order-001'
  }
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  healthCheck: 2000, // 2 seconds
  authFlow: 5000, // 5 seconds
  orderCreation: 10000, // 10 seconds
  paymentFlow: 15000, // 15 seconds
  rfidVerification: 3000, // 3 seconds
  totalSuite: 240000 // 4 minutes (leaving buffer for 5 min limit)
};

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2
};

// Expected response codes for different scenarios
export const EXPECTED_RESPONSES = {
  success: [200, 201, 202],
  authRequired: [401, 403],
  notFound: [404],
  serverError: [500, 502, 503],
  validationError: [400, 422]
};

// Get current environment configuration
export function getCurrentConfig() {
  return ENVIRONMENT_CONFIGS[TEST_ENVIRONMENT] || ENVIRONMENT_CONFIGS.staging;
}

// Build full URL for endpoint
export function buildUrl(endpoint: string): string {
  const config = getCurrentConfig();
  return `${config.apiUrl}${endpoint}`;
}

// Validate environment setup
export function validateEnvironment(): boolean {
  const config = getCurrentConfig();

  if (!config.baseUrl || !config.apiUrl) {
    console.error(`❌ Invalid configuration for environment: ${TEST_ENVIRONMENT}`);
    return false;
  }

  console.log(`✅ Environment validated: ${TEST_ENVIRONMENT}`);
  console.log(`🌐 Base URL: ${config.baseUrl}`);
  console.log(`🔗 API URL: ${config.apiUrl}`);

  return true;
}

// Export complete configuration
export const SMOKE_TEST_CONFIG: SmokeTestConfig = {
  environment: TEST_ENVIRONMENT,
  timeouts: {
    test: TEST_TIMEOUT,
    suite: SUITE_TIMEOUT
  },
  endpoints: CRITICAL_ENDPOINTS,
  testData: TEST_DATA,
  thresholds: PERFORMANCE_THRESHOLDS,
  retry: RETRY_CONFIG,
  responses: EXPECTED_RESPONSES,
  urls: getCurrentConfig()
};