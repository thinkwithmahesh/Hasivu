"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testLogger = exports.testRedis = exports.testPrisma = exports.setupMockRequests = exports.generateTestJWT = exports.waitForService = exports.teardownIntegrationTests = exports.setupIntegrationTests = exports.createTestRestaurant = exports.createTestUser = exports.initTestAWS = exports.cleanTestRedis = exports.initTestRedis = exports.cleanTestDatabase = exports.initTestDatabase = exports.IntegrationTestConfig = void 0;
const dotenv_1 = require("dotenv");
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const ioredis_1 = __importDefault(require("ioredis"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const logging_service_1 = require("@/services/logging.service");
(0, dotenv_1.config)({ path: '.env.integration' });
let testPrisma;
let testRedis = null;
exports.testRedis = testRedis;
let testLogger;
exports.IntegrationTestConfig = {
    database: {
        url: process.env.DATABASE_URL || 'file:./test.db',
        schema: 'public',
        maxConnections: 10,
        connectionTimeout: 30000,
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '1'),
        keyPrefix: 'hasivu_test:',
    },
    aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test-key',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test-secret',
        s3Bucket: process.env.AWS_S3_BUCKET || 'hasivu-test-bucket',
        sesRegion: process.env.AWS_SES_REGION || 'us-east-1',
    },
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
        keySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret',
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret',
    },
    server: {
        port: parseInt(process.env.TEST_SERVER_PORT || '3001'),
        host: process.env.TEST_SERVER_HOST || 'localhost',
        jwtSecret: process.env.JWT_SECRET || 'test_jwt_secret_key_for_integration_tests',
        sessionSecret: process.env.SESSION_SECRET || 'test_session_secret_key',
    },
    email: {
        testEmail: 'test@hasivu.com',
        testPassword: 'TestPassword123!',
        smtpHost: 'localhost',
        smtpPort: 1025,
    }
};
async function initTestDatabase() {
    console.log('🔄 Initializing integration test database...');
    try {
        exports.testPrisma = testPrisma = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: exports.IntegrationTestConfig.database.url
                }
            },
            log: ['error'],
        });
        await testPrisma.$connect();
        console.log('✅ Connected to integration test database');
        console.log('🔄 Running database migrations...');
        (0, child_process_1.execSync)('npx prisma migrate deploy', {
            env: { ...process.env, DATABASE_URL: exports.IntegrationTestConfig.database.url },
            stdio: 'inherit'
        });
        console.log('✅ Database migrations completed');
        exports.testLogger = testLogger = logging_service_1.LoggingService.getInstance();
        return testPrisma;
    }
    catch (error) {
        console.error('❌ Failed to initialize test database:', error);
        throw error;
    }
}
exports.initTestDatabase = initTestDatabase;
async function cleanTestDatabase() {
    console.log('🔄 Cleaning test database...');
    try {
        if (!testPrisma) {
            throw new Error('Test database not initialized. Call initTestDatabase() first.');
        }
        const tableNames = await testPrisma.$queryRaw `
      SELECT name FROM sqlite_master
      WHERE type='table'
        AND name NOT LIKE 'sqlite_%'
        AND name != '_prisma_migrations'
    `;
        await testPrisma.$executeRaw `PRAGMA foreign_keys = OFF;`;
        for (const { name: tableName } of tableNames) {
            try {
                await testPrisma.$executeRawUnsafe(`DELETE FROM "${tableName}";`);
                console.log(`✅ Cleaned table: ${tableName}`);
            }
            catch (tableError) {
                console.warn(`⚠️ Failed to clean table ${tableName}:`, tableError);
            }
        }
        for (const { name: tableName } of tableNames) {
            try {
                await testPrisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name="${tableName}";`);
            }
            catch (tableError) {
            }
        }
        await testPrisma.$executeRaw `PRAGMA foreign_keys = ON;`;
        console.log('✅ Test database cleaned successfully');
    }
    catch (error) {
        console.error('❌ Failed to clean test database:', error);
        throw error;
    }
}
exports.cleanTestDatabase = cleanTestDatabase;
async function initTestRedis() {
    try {
        if (!exports.IntegrationTestConfig.redis.host) {
            console.log('⚠️ Redis not configured, skipping Redis initialization');
            return null;
        }
        console.log('🔄 Initializing test Redis connection...');
        exports.testRedis = testRedis = new ioredis_1.default({
            host: exports.IntegrationTestConfig.redis.host,
            port: exports.IntegrationTestConfig.redis.port,
            password: exports.IntegrationTestConfig.redis.password,
            db: exports.IntegrationTestConfig.redis.db,
            keyPrefix: exports.IntegrationTestConfig.redis.keyPrefix,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
        await testRedis.connect();
        console.log('✅ Connected to test Redis');
        return testRedis;
    }
    catch (error) {
        console.warn('⚠️ Failed to connect to Redis:', error);
        return null;
    }
}
exports.initTestRedis = initTestRedis;
async function cleanTestRedis() {
    if (!testRedis) {
        return;
    }
    try {
        console.log('🔄 Cleaning test Redis data...');
        const keys = await testRedis.keys(`${exports.IntegrationTestConfig.redis.keyPrefix}*`);
        if (keys.length > 0) {
            await testRedis.del(...keys);
            console.log(`✅ Cleaned ${keys.length} Redis test keys`);
        }
        else {
            console.log('✅ No Redis test keys to clean');
        }
    }
    catch (error) {
        console.error('❌ Failed to clean Redis test data:', error);
        throw error;
    }
}
exports.cleanTestRedis = cleanTestRedis;
function initTestAWS() {
    aws_sdk_1.default.config.update({
        accessKeyId: exports.IntegrationTestConfig.aws.accessKeyId,
        secretAccessKey: exports.IntegrationTestConfig.aws.secretAccessKey,
        region: exports.IntegrationTestConfig.aws.region,
    });
    console.log('✅ AWS SDK configured for integration tests');
}
exports.initTestAWS = initTestAWS;
async function createTestUser(overrides = {}) {
    if (!testPrisma) {
        throw new Error('Test database not initialized');
    }
    const testUser = {
        email: exports.IntegrationTestConfig.email.testEmail,
        passwordHash: exports.IntegrationTestConfig.email.testPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true,
        ...overrides
    };
    try {
        const user = await testPrisma.user.create({
            data: testUser
        });
        console.log(`✅ Created test user: ${user.email}`);
        return user;
    }
    catch (error) {
        console.error('❌ Failed to create test user:', error);
        throw error;
    }
}
exports.createTestUser = createTestUser;
async function createTestRestaurant(userId, overrides = {}) {
    if (!testPrisma) {
        throw new Error('Test database not initialized');
    }
    const testRestaurant = {
        name: 'Test Restaurant',
        code: 'TEST_SCHOOL_001',
        description: 'A test restaurant for integration testing',
        cuisine: 'MULTI_CUISINE',
        address: '123 Test Street, Test City, Test State 12345',
        phoneNumber: '+1-555-TEST-REST',
        email: 'restaurant@hasivu.com',
        isActive: true,
        ownerId: userId,
        ...overrides
    };
    try {
        const restaurant = await testPrisma.school.create({
            data: testRestaurant
        });
        console.log(`✅ Created test restaurant: ${restaurant.name}`);
        return restaurant;
    }
    catch (error) {
        console.error('❌ Failed to create test restaurant:', error);
        throw error;
    }
}
exports.createTestRestaurant = createTestRestaurant;
async function setupIntegrationTests() {
    console.log('🚀 Setting up integration test environment...');
    try {
        const prisma = await initTestDatabase();
        const redis = await initTestRedis();
        initTestAWS();
        await cleanTestDatabase();
        await cleanTestRedis();
        console.log('✅ Integration test environment ready');
        return {
            prisma,
            redis,
            logger: testLogger
        };
    }
    catch (error) {
        console.error('❌ Failed to setup integration test environment:', error);
        throw error;
    }
}
exports.setupIntegrationTests = setupIntegrationTests;
async function teardownIntegrationTests() {
    console.log('🧹 Tearing down integration test environment...');
    try {
        await cleanTestDatabase();
        await cleanTestRedis();
        if (testPrisma) {
            await testPrisma.$disconnect();
            console.log('✅ Disconnected from test database');
        }
        if (testRedis) {
            await testRedis.quit();
            console.log('✅ Disconnected from test Redis');
        }
        console.log('✅ Integration test environment torn down');
    }
    catch (error) {
        console.error('❌ Failed to teardown integration test environment:', error);
        throw error;
    }
}
exports.teardownIntegrationTests = teardownIntegrationTests;
async function waitForService(serviceName, checkFunction, maxRetries = 30, delayMs = 1000) {
    console.log(`🔄 Waiting for ${serviceName} to be ready...`);
    for (let i = 0; i < maxRetries; i++) {
        try {
            const isReady = await checkFunction();
            if (isReady) {
                console.log(`✅ ${serviceName} is ready`);
                return;
            }
        }
        catch (error) {
        }
        if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    throw new Error(`❌ ${serviceName} failed to become ready after ${maxRetries} attempts`);
}
exports.waitForService = waitForService;
function generateTestJWT(payload, expiresIn = '1h') {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, exports.IntegrationTestConfig.server.jwtSecret, { expiresIn });
}
exports.generateTestJWT = generateTestJWT;
function setupMockRequests() {
    const nock = require('nock');
    nock('https://api.razorpay.com')
        .persist()
        .post('/v1/orders')
        .reply(200, {
        id: 'order_test_12345',
        entity: 'order',
        amount: 50000,
        amount_paid: 0,
        amount_due: 50000,
        currency: 'INR',
        receipt: 'receipt_test_12345',
        status: 'created'
    });
    nock('https://hasivu-test-bucket.s3.us-east-1.amazonaws.com')
        .persist()
        .put(/.*\.(jpg|jpeg|png|gif|pdf)$/)
        .reply(200, { ETag: '"test-etag"' });
    console.log('✅ Mock requests configured');
}
exports.setupMockRequests = setupMockRequests;
//# sourceMappingURL=setup-integration.js.map