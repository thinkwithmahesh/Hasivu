"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
globalThis.jest = globals_1.jest;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-minimum-64-characters-required-for-security-validation';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only-minimum-64-characters-required-for-security-validation';
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/hasivu_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.SKIP_DATABASE_TESTS = 'true';
process.env.SKIP_REDIS_TESTS = 'true';
process.env.RAZORPAY_KEY_ID = 'test_key_id';
process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';
process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
process.env.AWS_REGION = 'us-east-1';
process.env.COGNITO_USER_POOL_ID = 'test_pool_id';
process.env.COGNITO_CLIENT_ID = 'test_client_id';
beforeAll(async () => {
    await setupTestDatabase();
    setupGlobalMocks();
});
afterAll(async () => {
    await cleanupTestDatabase();
    await cleanupRedis();
    globals_1.jest.clearAllMocks();
    globals_1.jest.clearAllTimers();
    globals_1.jest.restoreAllMocks();
});
beforeEach(() => {
    globals_1.jest.clearAllMocks();
    globals_1.jest.spyOn(console, 'log').mockImplementation(() => { });
    globals_1.jest.spyOn(console, 'warn').mockImplementation(() => { });
    globals_1.jest.spyOn(console, 'error').mockImplementation(() => { });
});
afterEach(async () => {
    await cleanupTestData();
    globals_1.jest.restoreAllMocks();
});
async function setupTestDatabase() {
    try {
        console.log('Setting up test database...');
    }
    catch (error) {
        console.error('Failed to setup test database:', error);
        throw error;
    }
}
async function cleanupTestDatabase() {
    try {
        console.log('Cleaning up test database...');
    }
    catch (error) {
        console.error('Failed to cleanup test database:', error);
    }
}
async function cleanupRedis() {
    try {
        console.log('Cleaning up Redis test data...');
    }
    catch (error) {
        console.error('Failed to cleanup Redis:', error);
    }
}
function setupGlobalMocks() {
    globals_1.jest.doMock('@prisma/client', () => ({
        PrismaClient: globals_1.jest.fn().mockImplementation(() => ({
            user: {
                findUnique: globals_1.jest.fn(),
                findMany: globals_1.jest.fn(),
                create: globals_1.jest.fn(),
                update: globals_1.jest.fn(),
                delete: globals_1.jest.fn(),
            },
            order: {
                findUnique: globals_1.jest.fn(),
                findMany: globals_1.jest.fn(),
                create: globals_1.jest.fn(),
                update: globals_1.jest.fn(),
                delete: globals_1.jest.fn(),
            },
            menuItem: {
                findUnique: globals_1.jest.fn(),
                findMany: globals_1.jest.fn(),
                create: globals_1.jest.fn(),
                update: globals_1.jest.fn(),
                delete: globals_1.jest.fn(),
            },
            rFIDCard: {
                findUnique: globals_1.jest.fn(),
                findMany: globals_1.jest.fn(),
                create: globals_1.jest.fn(),
                update: globals_1.jest.fn(),
                delete: globals_1.jest.fn(),
            },
            rFIDReader: {
                findUnique: globals_1.jest.fn(),
                findMany: globals_1.jest.fn(),
                create: globals_1.jest.fn(),
                update: globals_1.jest.fn(),
            },
            deliveryVerification: {
                findMany: globals_1.jest.fn(),
                create: globals_1.jest.fn(),
                findFirst: globals_1.jest.fn(),
            },
            payment: {
                findUnique: globals_1.jest.fn(),
                findMany: globals_1.jest.fn(),
                create: globals_1.jest.fn(),
                update: globals_1.jest.fn(),
            },
            $transaction: globals_1.jest.fn().mockImplementation((callback) => callback()),
            $connect: globals_1.jest.fn(),
            $disconnect: globals_1.jest.fn(),
        })),
    }));
    globals_1.jest.doMock('razorpay', () => {
        const mockRazorpay = globals_1.jest.fn();
        mockRazorpay.mockImplementation(() => ({
            orders: {
                create: globals_1.jest.fn(async () => ({
                    id: 'order_test123',
                    amount: 50000,
                    currency: 'INR',
                    status: 'created',
                })),
                fetch: globals_1.jest.fn(async () => ({
                    id: 'order_test123',
                    status: 'paid',
                })),
            },
            payments: {
                fetch: globals_1.jest.fn(async () => ({
                    id: 'pay_test123',
                    status: 'captured',
                    method: 'card',
                })),
                capture: globals_1.jest.fn(async () => ({
                    id: 'pay_test123',
                    status: 'captured',
                })),
            },
            webhooks: {
                validateWebhookSignature: globals_1.jest.fn(() => true),
            },
        }));
        return mockRazorpay;
    });
    globals_1.jest.doMock('@aws-sdk/client-s3', () => ({
        S3Client: globals_1.jest.fn(() => ({
            send: globals_1.jest.fn(async () => ({
                $metadata: { httpStatusCode: 200 },
            })),
        })),
        PutObjectCommand: globals_1.jest.fn(),
        GetObjectCommand: globals_1.jest.fn(),
        DeleteObjectCommand: globals_1.jest.fn(),
    }));
    globals_1.jest.doMock('ioredis', () => {
        const mockRedis = globals_1.jest.fn();
        mockRedis.mockImplementation(() => ({
            get: globals_1.jest.fn(async () => null),
            set: globals_1.jest.fn(async () => 'OK'),
            del: globals_1.jest.fn(async () => 1),
            exists: globals_1.jest.fn(async () => 0),
            expire: globals_1.jest.fn(async () => 1),
            incr: globals_1.jest.fn(async () => 1),
            decr: globals_1.jest.fn(async () => 0),
            hget: globals_1.jest.fn(async () => null),
            hset: globals_1.jest.fn(async () => 1),
            hdel: globals_1.jest.fn(async () => 1),
            disconnect: globals_1.jest.fn(async () => undefined),
        }));
        return mockRedis;
    });
    globals_1.jest.doMock('bcryptjs', () => ({
        hash: globals_1.jest.fn().mockImplementation(() => Promise.resolve('$2b$12$mockedHashValue')),
        compare: globals_1.jest.fn().mockImplementation(() => Promise.resolve(true)),
        genSalt: globals_1.jest.fn().mockImplementation(() => Promise.resolve('$2b$12$mockedSalt')),
    }));
    globals_1.jest.doMock('jsonwebtoken', () => ({
        sign: globals_1.jest.fn().mockReturnValue('mocked.jwt.token'),
        verify: globals_1.jest.fn().mockReturnValue({ userId: 'test-user', role: 'student' }),
        decode: globals_1.jest.fn().mockReturnValue({ userId: 'test-user', role: 'student' }),
    }));
}
async function cleanupTestData() {
    try {
    }
    catch (error) {
        console.error('Failed to cleanup test data:', error);
    }
}
const testUtils = {
    waitFor: async (condition, timeout = 5000) => {
        const start = Date.now();
        while (!condition() && Date.now() - start < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (!condition()) {
            throw new Error(`Condition not met within ${timeout}ms`);
        }
    },
    mockFn: (implementation) => {
        return globals_1.jest.fn(implementation);
    },
    timestamp: (offsetMs = 0) => new Date(Date.now() + offsetMs),
    networkDelay: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
    generateTestId: (prefix = 'test') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
};
global.testUtils = testUtils;
expect.extend({
    toBeValidEmail(received) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const pass = emailRegex.test(received);
        return {
            message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid email`,
            pass,
        };
    },
    toBeValidPhoneNumber(received) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        const pass = phoneRegex.test(received);
        return {
            message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid phone number`,
            pass,
        };
    },
    toHaveValidTimestamp(received) {
        const pass = received instanceof Date && !isNaN(received.getTime());
        return {
            message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid timestamp`,
            pass,
        };
    },
    toMatchSecurityPattern(received, pattern) {
        let regex;
        let description;
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
const originalIt = global.it;
global.it = Object.assign((name, fn, timeout) => {
    return originalIt(name, async (...args) => {
        const startTime = Date.now();
        try {
            if (fn) {
                await fn(...args);
            }
        }
        finally {
            const duration = Date.now() - startTime;
            if (duration > 1000) {
                console.warn(`⚠️  Slow test: "${name}" took ${duration}ms`);
            }
        }
    }, timeout);
}, originalIt);
//# sourceMappingURL=setup.js.map