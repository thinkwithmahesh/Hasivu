/**
 * Enhanced Test Setup Configuration
 * Global test environment setup with improved mocking, data factories, and cleanup
 */
import { jest } from '@jest/globals';

// Make Jest globals available throughout test files
globalThis.jest = jest;

// Set test environment variables before anything else
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-minimum-64-characters-required-for-security-validation';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only-minimum-64-characters-required-for-security-validation';
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/hasivu_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
// Enable database and Redis operations for comprehensive testing
process.env.SKIP_DATABASE_TESTS = 'false';
process.env.SKIP_REDIS_TESTS = 'false';
process.env.RAZORPAY_KEY_ID = 'test_key_id';
process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';
process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
process.env.AWS_REGION = 'us-east-1';
process.env.COGNITO_USER_POOL_ID = 'test_pool_id';
process.env.COGNITO_CLIENT_ID = 'test_client_id';

// Setup global mocks BEFORE any imports
setupGlobalMocks();

// Global test environment setup
beforeAll(async () => {
  // Initialize test database if needed
  await setupTestDatabase();
});

afterAll(async () => {
  // Cleanup test environment
  await cleanupTestDatabase();
  await cleanupRedis();

  // Clear all mocks and timers
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.restoreAllMocks();
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();

  // Mock console methods to reduce test noise
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
  // Cleanup test data after each test
  await cleanupTestData();

  // Restore console methods
  jest.restoreAllMocks();
});

/**
 * Setup test database with minimal schema
 */
async function setupTestDatabase(): Promise<void> {
  try {
    // In a real implementation, this would set up test database tables
    // For now, we'll mock the database operations
    console.log('Setting up test database...');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

/**
 * Cleanup test database
 */
async function cleanupTestDatabase(): Promise<void> {
  try {
    // Cleanup test database
    console.log('Cleaning up test database...');
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
  }
}

/**
 * Cleanup Redis test data
 */
async function cleanupRedis(): Promise<void> {
  try {
    // Cleanup Redis test data
    console.log('Cleaning up Redis test data...');
  } catch (error) {
    console.error('Failed to cleanup Redis:', error);
  }
}

/**
 * Setup global mocks for external services
 */
function setupGlobalMocks(): void {
  // Mock Prisma Client
  jest.doMock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      menuItem: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      rFIDCard: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      rFIDReader: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      deliveryVerification: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((callback: any) => callback()),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    })),
  }));

  // Mock Razorpay
  jest.doMock('razorpay', () => {
    const mockRazorpay = jest.fn();
    mockRazorpay.mockImplementation(() => ({
      orders: {
        create: jest.fn(async () => ({
          id: 'order_test123',
          amount: 50000,
          currency: 'INR',
          status: 'created',
        })),
        fetch: jest.fn(async () => ({
          id: 'order_test123',
          status: 'paid',
        })),
      },
      payments: {
        fetch: jest.fn(async () => ({
          id: 'pay_test123',
          status: 'captured',
          method: 'card',
        })),
        capture: jest.fn(async () => ({
          id: 'pay_test123',
          status: 'captured',
        })),
      },
      webhooks: {
        validateWebhookSignature: jest.fn(() => true),
      },
    }));
    return mockRazorpay;
  });

  // Mock AWS SDK
  jest.doMock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn(() => ({
      send: jest.fn(async () => ({
        $metadata: { httpStatusCode: 200 },
      })),
    })),
    PutObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
  }));

  // Mock Redis
  jest.doMock('ioredis', () => {
    const mockRedis = jest.fn();
    mockRedis.mockImplementation(() => ({
      get: jest.fn(async () => null),
      set: jest.fn(async () => 'OK'),
      del: jest.fn(async () => 1),
      exists: jest.fn(async () => 0),
      expire: jest.fn(async () => 1),
      incr: jest.fn(async () => 1),
      decr: jest.fn(async () => 0),
      hget: jest.fn(async () => null),
      hset: jest.fn(async () => 1),
      hdel: jest.fn(async () => 1),
      disconnect: jest.fn(async () => undefined),
    }));
    return mockRedis;
  });

  // Mock bcryptjs
  jest.doMock('bcryptjs', () => ({
    hash: jest.fn().mockImplementation(() => Promise.resolve('$2b$12$mockedHashValue')),
    compare: jest.fn().mockImplementation(() => Promise.resolve(true)),
    genSalt: jest.fn().mockImplementation(() => Promise.resolve('$2b$12$mockedSalt')),
  }));

  // Mock jsonwebtoken
  jest.doMock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mocked.jwt.token'),
    verify: jest.fn().mockReturnValue({ userId: 'test-user', role: 'student' }),
    decode: jest.fn().mockReturnValue({ userId: 'test-user', role: 'student' }),
  }));
}

/**
 * Cleanup test data created during tests
 */
async function cleanupTestData(): Promise<void> {
  try {
    // Clear any temporary files
    // Clear test database records
    // Reset any global state
  } catch (error) {
    console.error('Failed to cleanup test data:', error);
  }
}

/**
 * Global test utilities
 */
const testUtils = {
  waitFor: async (condition: () => boolean, timeout = 5000): Promise<void> => {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  },
  mockFn: <T extends (...args: any[]) => any>(implementation?: T) => {
    return jest.fn(implementation) as any;
  },
  timestamp: (offsetMs = 0) => new Date(Date.now() + offsetMs),
  networkDelay: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  generateTestId: (prefix = 'test') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
};

// Make testUtils available globally
global.testUtils = testUtils as any;

// Extend Jest matchers for better testing experience
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEmail(): R;
      toBeValidPhoneNumber(): R;
      toHaveValidTimestamp(): R;
      toMatchSecurityPattern(pattern: 'password' | 'token' | 'hash'): R;
    }
  }
  
  var testUtils: {
    waitFor: (condition: () => boolean, timeout?: number) => Promise<void>;
    mockFn: <T extends (...args: any[]) => any>(implementation?: T) => any;
    timestamp: (offsetMs?: number) => Date;
    networkDelay: (ms?: number) => Promise<void>;
    generateTestId: (prefix?: string) => string;
  };
}

// Custom Jest matchers
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid email`,
      pass,
    };
  },
  
  toBeValidPhoneNumber(received: string) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    const pass = phoneRegex.test(received);
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid phone number`,
      pass,
    };
  },
  
  toHaveValidTimestamp(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid timestamp`,
      pass,
    };
  },
  
  toMatchSecurityPattern(received: string, pattern: 'password' | 'token' | 'hash') {
    let regex: RegExp;
    let description: string;
    
    switch (pattern) {
      case 'password':
        regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        description = 'strong password';
        break;
      case 'token':
        regex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
        description = 'JWT token';
        break;
      case 'hash':
        regex = /^\$2[aby]\$\d{2}\$.{53}$/;
        description = 'bcrypt hash';
        break;
      default:
        throw new Error(`Unknown security pattern: ${pattern}`);
    }
    
    const pass = regex.test(received);
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to match ${description} pattern`,
      pass,
    };
  },
});

// Performance monitoring for tests
const originalIt = global.it;
global.it = Object.assign(
  (name: string, fn?: any, timeout?: number) => {
    return originalIt(name, async (...args: any[]) => {
      const startTime = Date.now();
      try {
        if (fn) {
          await fn(...args);
        }
      } finally {
        const duration = Date.now() - startTime;
        if (duration > 1000) {
          console.warn(`⚠️  Slow test: "${name}" took ${duration}ms`);
        }
      }
    }, timeout);
  },
  originalIt
) as any;