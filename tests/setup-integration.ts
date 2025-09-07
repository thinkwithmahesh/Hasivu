/**
 * HASIVU Platform - Integration Test Setup Configuration
 * 
 * Comprehensive integration test setup providing database initialization,
 * environment configuration, and service mocking for the HASIVU restaurant
 * management platform. Supports Redis, AWS, Razorpay, and database testing.
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import Redis from 'ioredis';
import AWS from 'aws-sdk';
import { DatabaseService } from '@/services/database.service';
import { LoggingService } from '@/services/logging.service';

// Load integration test environment variables
config({ path: '.env.integration' });

// Global test services
let testPrisma: PrismaClient;
let testRedis: Redis | null = null;
let testLogger: LoggingService;

// Integration test configuration
export const IntegrationTestConfig = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://test_user:test_pass@localhost:5432/hasivu_test',
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
    smtpPort: 1025, // MailHog or similar test SMTP server
  }
};

/**
 * Initialize test database with migrations and seed data
 */
export async function initTestDatabase(): Promise<PrismaClient> {
  console.log('🔄 Initializing integration test database...');
  
  try {
    // Initialize Prisma client with test configuration
    testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: IntegrationTestConfig.database.url
        }
      },
      log: ['error'],
    });

    // Connect to database
    await testPrisma.$connect();
    console.log('✅ Connected to integration test database');
    
    // Run migrations
    console.log('🔄 Running database migrations...');
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: IntegrationTestConfig.database.url },
      stdio: 'inherit'
    });
    console.log('✅ Database migrations completed');
    
    // Initialize logging service
    testLogger = LoggingService.getInstance();
    
    return testPrisma;
  } catch (error) {
    console.error('❌ Failed to initialize test database:', error);
    throw error;
  }
}

/**
 * Clean test database by truncating all tables
 */
export async function cleanTestDatabase(): Promise<void> {
  console.log('🔄 Cleaning test database...');
  
  try {
    if (!testPrisma) {
      throw new Error('Test database not initialized. Call initTestDatabase() first.');
    }

    // Get all table names from the database schema
    const tableNames = await testPrisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != '_prisma_migrations'
    `;

    // Disable foreign key checks temporarily
    await testPrisma.$executeRaw`SET session_replication_role = replica;`;
    
    // Clean all tables
    for (const { table_name } of tableNames) {
      try {
        await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE "${table_name}" CASCADE;`);
        console.log(`✅ Cleaned table: ${table_name}`);
      } catch (tableError) {
        console.warn(`⚠️ Failed to clean table ${table_name}:`, tableError);
      }
    }
    
    // Re-enable foreign key checks
    await testPrisma.$executeRaw`SET session_replication_role = DEFAULT;`;
    
    console.log('✅ Test database cleaned successfully');
  } catch (error) {
    console.error('❌ Failed to clean test database:', error);
    throw error;
  }
}

/**
 * Initialize Redis client for integration tests
 */
export async function initTestRedis(): Promise<Redis | null> {
  try {
    if (!IntegrationTestConfig.redis.host) {
      console.log('⚠️ Redis not configured, skipping Redis initialization');
      return null;
    }

    console.log('🔄 Initializing test Redis connection...');
    
    testRedis = new Redis({
      host: IntegrationTestConfig.redis.host,
      port: IntegrationTestConfig.redis.port,
      password: IntegrationTestConfig.redis.password,
      db: IntegrationTestConfig.redis.db,
      keyPrefix: IntegrationTestConfig.redis.keyPrefix,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    await testRedis.connect();
    console.log('✅ Connected to test Redis');
    
    return testRedis;
  } catch (error) {
    console.warn('⚠️ Failed to connect to Redis:', error);
    return null;
  }
}

/**
 * Clean Redis test data
 */
export async function cleanTestRedis(): Promise<void> {
  if (!testRedis) {
    return;
  }

  try {
    console.log('🔄 Cleaning test Redis data...');
    
    // Get all keys with test prefix
    const keys = await testRedis.keys(`${IntegrationTestConfig.redis.keyPrefix}*`);
    
    if (keys.length > 0) {
      await testRedis.del(...keys);
      console.log(`✅ Cleaned ${keys.length} Redis test keys`);
    } else {
      console.log('✅ No Redis test keys to clean');
    }
  } catch (error) {
    console.error('❌ Failed to clean Redis test data:', error);
    throw error;
  }
}

/**
 * Initialize AWS SDK with test configuration
 */
export function initTestAWS(): void {
  AWS.config.update({
    accessKeyId: IntegrationTestConfig.aws.accessKeyId,
    secretAccessKey: IntegrationTestConfig.aws.secretAccessKey,
    region: IntegrationTestConfig.aws.region,
  });
  
  console.log('✅ AWS SDK configured for integration tests');
}

/**
 * Create test user with default permissions
 */
export async function createTestUser(overrides: Partial<any> = {}): Promise<any> {
  if (!testPrisma) {
    throw new Error('Test database not initialized');
  }

  const testUser = {
    email: IntegrationTestConfig.email.testEmail,
    passwordHash: IntegrationTestConfig.email.testPassword, // Use passwordHash instead of password
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
  } catch (error) {
    console.error('❌ Failed to create test user:', error);
    throw error;
  }
}

/**
 * Create test restaurant with default data
 */
export async function createTestRestaurant(userId: string, overrides: Partial<any> = {}): Promise<any> {
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
  } catch (error) {
    console.error('❌ Failed to create test restaurant:', error);
    throw error;
  }
}

/**
 * Complete integration test setup
 */
export async function setupIntegrationTests(): Promise<{
  prisma: PrismaClient;
  redis: Redis | null;
  logger: LoggingService;
}> {
  console.log('🚀 Setting up integration test environment...');
  
  try {
    // Initialize all services
    const prisma = await initTestDatabase();
    const redis = await initTestRedis();
    initTestAWS();
    
    // Clean existing data
    await cleanTestDatabase();
    await cleanTestRedis();
    
    console.log('✅ Integration test environment ready');
    
    return {
      prisma,
      redis,
      logger: testLogger
    };
  } catch (error) {
    console.error('❌ Failed to setup integration test environment:', error);
    throw error;
  }
}

/**
 * Cleanup integration test environment
 */
export async function teardownIntegrationTests(): Promise<void> {
  console.log('🧹 Tearing down integration test environment...');
  
  try {
    // Clean data
    await cleanTestDatabase();
    await cleanTestRedis();
    
    // Disconnect services
    if (testPrisma) {
      await testPrisma.$disconnect();
      console.log('✅ Disconnected from test database');
    }
    
    if (testRedis) {
      await testRedis.quit();
      console.log('✅ Disconnected from test Redis');
    }
    
    console.log('✅ Integration test environment torn down');
  } catch (error) {
    console.error('❌ Failed to teardown integration test environment:', error);
    throw error;
  }
}

/**
 * Wait for service to be available (useful for Docker containers)
 */
export async function waitForService(
  serviceName: string,
  checkFunction: () => Promise<boolean>,
  maxRetries: number = 30,
  delayMs: number = 1000
): Promise<void> {
  console.log(`🔄 Waiting for ${serviceName} to be ready...`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const isReady = await checkFunction();
      if (isReady) {
        console.log(`✅ ${serviceName} is ready`);
        return;
      }
    } catch (error) {
      // Service not ready yet
    }
    
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw new Error(`❌ ${serviceName} failed to become ready after ${maxRetries} attempts`);
}

/**
 * Generate test JWT token
 */
export function generateTestJWT(payload: any, expiresIn: string = '1h'): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, IntegrationTestConfig.server.jwtSecret, { expiresIn });
}

/**
 * Mock external HTTP requests for testing
 */
export function setupMockRequests(): void {
  const nock = require('nock');
  
  // Mock Razorpay API
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
  
  // Mock AWS S3 uploads
  nock('https://hasivu-test-bucket.s3.us-east-1.amazonaws.com')
    .persist()
    .put(/.*\.(jpg|jpeg|png|gif|pdf)$/)
    .reply(200, { ETag: '"test-etag"' });
  
  console.log('✅ Mock requests configured');
}

/**
 * Export test utilities
 */
export {
  testPrisma,
  testRedis,
  testLogger
};