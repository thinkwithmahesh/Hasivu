/**
 * Test Helpers and Utilities
 * Comprehensive testing utilities for HASIVU platform
 */
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Test data factories
export const TestDataFactory = {
  user: {
    student: (overrides: any = {}) => ({
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'student@test.com',
      name: 'Test Student',
      role: 'student',
      phone: '+91-9876543210',
      grade: '8th',
      section: 'A',
      rollNumber: 'STU001',
      parentId: '123e4567-e89b-12d3-a456-426614174002',
      schoolId: '123e4567-e89b-12d3-a456-426614174001',
      isActive: true,
      preferences: {
        dietaryRestrictions: [],
        allergies: [],
        spiceLevel: 'medium'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    }),
    
    parent: (overrides: any = {}) => ({
      id: '123e4567-e89b-12d3-a456-426614174002',
      email: 'parent@test.com',
      name: 'Test Parent',
      role: 'parent',
      phone: '+91-9876543211',
      address: 'Test Address, Test City',
      paymentMethods: [],
      children: ['123e4567-e89b-12d3-a456-426614174000'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    }),
    
    admin: (overrides: any = {}) => ({
      id: '123e4567-e89b-12d3-a456-426614174003',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'admin',
      phone: '+91-9876543212',
      permissions: ['read', 'write', 'delete'],
      schoolId: '123e4567-e89b-12d3-a456-426614174001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    })
  },

  menuItem: (overrides: any = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174004',
    name: 'Test Menu Item',
    description: 'Delicious test meal',
    category: 'main-course',
    price: 50.00,
    currency: 'INR',
    nutritionalInfo: {
      calories: 350,
      protein: 15,
      carbs: 45,
      fat: 12,
      fiber: 5
    },
    ingredients: ['rice', 'vegetables', 'spices'],
    allergens: [],
    preparationTime: 15,
    schoolId: '123e4567-e89b-12d3-a456-426614174001',
    isActive: true,
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    images: ['test-image.jpg'],
    tags: ['healthy', 'popular'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  order: (overrides: any = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174005',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    parentId: '123e4567-e89b-12d3-a456-426614174002',
    schoolId: '123e4567-e89b-12d3-a456-426614174001',
    items: [
      {
        menuItemId: '123e4567-e89b-12d3-a456-426614174004',
        quantity: 2,
        price: 50.00,
        totalPrice: 100.00
      }
    ],
    totalAmount: 150.00,
    currency: 'INR',
    status: 'pending',
    deliveryDate: new Date(),
    deliverySlot: 'lunch',
    paymentStatus: 'pending',
    paymentId: null,
    rfidVerified: false,
    deliveryAddress: {
      building: 'Main Block',
      floor: '2nd Floor',
      classroom: '8A'
    },
    specialRequirements: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  rfidCard: (overrides: any = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174006',
    cardId: 'RFID_TEST_001',
    studentId: '123e4567-e89b-12d3-a456-426614174000',
    schoolId: '123e4567-e89b-12d3-a456-426614174001',
    isActive: true,
    isBlocked: false,
    lastUsed: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  paymentOrder: (overrides: any = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174007',
    orderId: '123e4567-e89b-12d3-a456-426614174005',
    amount: 150.00,
    currency: 'INR',
    status: 'created',
    gateway: 'razorpay',
    gatewayOrderId: 'order_test_123456',
    gatewayPaymentId: null,
    metadata: {
      receipt: 'receipt_test_123456'
    },
    attempts: 0,
    maxAttempts: 3,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    completedAt: null,
    failureReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  subscription: (overrides: any = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174008',
    userId: '123e4567-e89b-12d3-a456-426614174002',
    planId: 'monthly_basic',
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    gatewaySubscriptionId: 'sub_test_123456',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  notification: (overrides: any = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174009',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    type: 'order_delivered',
    channel: 'whatsapp',
    title: 'Order Delivered',
    message: 'Your order has been delivered successfully',
    status: 'pending',
    metadata: {},
    scheduledAt: new Date(),
    sentAt: null,
    retries: 0,
    maxRetries: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  orderItem: (overrides: any = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174010',
    orderId: '123e4567-e89b-12d3-a456-426614174005',
    menuItemId: '123e4567-e89b-12d3-a456-426614174004',
    quantity: 2,
    unitPrice: 50.00,
    totalPrice: 100.00,
    currency: 'INR',
    specialRequirements: '',
    customizations: {},
    nutritionalInfo: {
      calories: 350,
      protein: 15,
      carbs: 45,
      fat: 12
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  menuPlan: (overrides: any = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174011',
    name: 'Weekly Nutritious Plan',
    description: 'Balanced weekly menu plan with variety',
    schoolId: '123e4567-e89b-12d3-a456-426614174001',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    menuItems: [],
    isActive: true,
    createdBy: '123e4567-e89b-12d3-a456-426614174002',
    tags: ['nutritious', 'balanced'],
    targetCalories: 2000,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  reset: () => {
    // Reset any internal state if needed
  }
};

// Authentication helpers
export const AuthTestHelper = {
  generateValidToken: (payload: any = {}) => {
    const defaultPayload = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'student',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };
    return jwt.sign(
      { ...defaultPayload, ...payload },
      process.env.JWT_SECRET || 'test-secret',
      { algorithm: 'HS256' }
    );
  },

  generateExpiredToken: (payload: any = {}) => {
    const defaultPayload = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'student',
      iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      exp: Math.floor(Date.now() / 1000) - 3600  // 1 hour ago (expired)
    };
    return jwt.sign(
      { ...defaultPayload, ...payload },
      process.env.JWT_SECRET || 'test-secret',
      { algorithm: 'HS256' }
    );
  },

  generateInvalidToken: () => 'invalid.jwt.token',

  hashPassword: async (password: string): Promise<string> => {
    return bcrypt.hash(password, 12);
  },

  verifyPassword: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  }
};

// Mock request/response helpers
export const MockRequestResponse = {
  createMockRequest: (overrides: any = {}): Partial<Request> => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ip: '127.0.0.1',
    method: 'GET',
    url: '/test',
    ...overrides
  }),

  createMockResponse: (): Partial<Response> => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.header = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
  }
};

// Database test helpers
export const DatabaseTestHelper = {
  setupTestDatabase: async () => {
    // Setup test database connection and structure
    console.log('Setting up test database...');
  },

  seedTestData: async () => {
    // Implementation would depend on your database setup
    console.log('Seeding test data...');
  },

  seedBaseTestData: async () => {
    // Seed base test data needed for all tests
    console.log('Seeding base test data...');
  },

  clearTestData: async () => {
    // Clear test-specific data while preserving base data
    console.log('Clearing test data...');
  },

  resetSequences: async () => {
    // Reset auto-increment sequences if needed
    console.log('Resetting database sequences...');
  },

  clearAllTables: async () => {
    // Clear all test data
    console.log('Clearing all test tables...');
  },

  teardownTestDatabase: async () => {
    // Cleanup test database and close connections
    console.log('Tearing down test database...');
  }
};

// Time helpers for testing
export const TimeTestHelper = {
  freezeTime: (date: Date = new Date()) => {
    jest.useFakeTimers();
    jest.setSystemTime(date);
  },

  unfreezeTime: () => {
    jest.useRealTimers();
  },

  advanceTime: (ms: number) => {
    jest.advanceTimersByTime(ms);
  },

  futureDate: (daysFromNow: number = 1): Date => {
    return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  },

  pastDate: (daysAgo: number = 1): Date => {
    return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  }
};

// API testing helpers
export const ApiTestHelper = {
  expectErrorResponse: (response: any, expectedError?: string) => {
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    if (expectedError) {
      expect(response.body.error).toContain(expectedError);
    }
  },

  expectValidationError: (response: any, field?: string) => {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    if (field) {
      expect(response.body.error).toContain(field);
    }
  },

  expectUnauthorizedError: (response: any) => {
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toContain('Unauthorized');
  },

  expectForbiddenError: (response: any) => {
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toContain('Forbidden');
  },

  expectNotFoundError: (response: any) => {
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toContain('Not found');
  },

  expectSuccessResponse: (response: any, expectedData?: any) => {
    expect(response.status).toBeLessThan(400);
    expect(response.body).toHaveProperty('success', true);
    if (expectedData) {
      expect(response.body.data).toMatchObject(expectedData);
    }
  }
};

// Performance testing helpers
export const PerformanceTestHelper = {
  measureExecutionTime: async (fn: () => Promise<any>): Promise<{ result: any; duration: number }> => {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  },

  expectExecutionTimeUnder: (duration: number, maxMs: number) => {
    expect(duration).toBeLessThan(maxMs);
  },

  simulateNetworkDelay: async (ms: number = 100): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, ms));
  },

  generateLoadTestData: (count: number, factory: () => any): any[] => {
    return Array.from({ length: count }, factory);
  }
};

// External service mock helpers
export const ExternalServiceMocks = {
  razorpay: {
    mockSuccessfulPayment: () => ({
      id: 'pay_test_123',
      status: 'captured',
      amount: 50000,
      currency: 'INR',
      method: 'card'
    }),
    mockFailedPayment: () => ({
      id: 'pay_test_456',
      status: 'failed',
      error: 'card_declined'
    })
  },

  whatsapp: {
    mockSuccessfulSend: () => ({
      messageId: 'msg_test_123',
      status: 'sent'
    }),
    mockFailedSend: () => ({
      error: 'invalid_number'
    })
  },

  aws: {
    ses: {
      mockSuccessfulSend: () => ({
        MessageId: 'test-message-id-123'
      })
    },
    s3: {
      mockSuccessfulUpload: () => ({
        Location: 'https://test-bucket.s3.amazonaws.com/test-file.jpg',
        ETag: '"test-etag"',
        Bucket: 'test-bucket',
        Key: 'test-file.jpg'
      })
    },
    cognito: {
      mockSuccessfulAuth: () => ({
        Username: 'test-user',
        Attributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'email_verified', Value: 'true' }
        ]
      })
    }
  },

  reset: () => {
    // Reset all external service mocks
    jest.clearAllMocks();
  }
};

// Test environment helpers
export const TestEnvironmentHelper = {
  isTestEnvironment: () => process.env.NODE_ENV === 'test',
  
  skipIfNotTestEnv: (testFn: () => void) => {
    if (TestEnvironmentHelper.isTestEnvironment()) {
      testFn();
    } else {
      test.skip('Skipped - not in test environment', () => {});
    }
  },

  requireEnvVar: (varName: string): string => {
    const value = process.env[varName];
    if (!value) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }
    return value;
  }
};

export default {
  TestDataFactory,
  AuthTestHelper,
  MockRequestResponse,
  DatabaseTestHelper,
  TimeTestHelper,
  ApiTestHelper,
  PerformanceTestHelper,
  ExternalServiceMocks,
  TestEnvironmentHelper
};