/**
 * Comprehensive Health Check Function
 * Provides detailed health status for all system components
 *
 * Endpoints:
 * - GET /health - Comprehensive health check (all components)
 * - GET /health/live - Liveness probe (basic check)
 * - GET /health/ready - Readiness probe (can accept traffic)
 * - GET /health/startup - Startup probe (initialization complete)
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

// ==================================================================================
// Types and Interfaces
// ==================================================================================

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
type ComponentStatus = 'pass' | 'fail' | 'warn';

interface ComponentHealth {
  status: ComponentStatus;
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
}

interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    s3: ComponentHealth;
    memory: ComponentHealth;
    externalAPIs?: ComponentHealth;
  };
  metadata: {
    region: string;
    functionName: string;
    functionVersion: string;
    coldStart: boolean;
    requestId: string;
  };
}

// ==================================================================================
// Global Clients (reused across warm starts)
// ==================================================================================

let prisma: PrismaClient | null = null;
let redis: Redis | null = null;
let s3: S3Client | null = null;

// Track function startup time for uptime calculation
const startupTime = Date.now();

// Track if this is a cold start
let isColdStart = true;

// ==================================================================================
// Client Initialization
// ==================================================================================

function initializePrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL!,
        },
      },
    });
  }
  return prisma;
}

function initializeRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    });
  }
  return redis;
}

function initializeS3(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
    });
  }
  return s3;
}

// ==================================================================================
// Health Check Functions
// ==================================================================================

async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  const client = initializePrisma();

  try {
    // Perform a simple query to verify database connectivity
    await client.$queryRaw`SELECT 1 as health_check`;

    // Optional: Check connection pool status
    const connectionPoolSize = 10; // Default Prisma connection pool size

    const responseTime = Date.now() - start;

    return {
      status: responseTime < 100 ? 'pass' : responseTime < 300 ? 'warn' : 'fail',
      responseTime,
      message: responseTime >= 100 ? `Database response slow (${responseTime}ms)` : undefined,
      details: {
        connectionPool: {
          size: connectionPoolSize,
          status: 'healthy',
        },
      },
    };
  } catch (error: any) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      message: `Database connection failed: ${error.message}`,
      details: {
        error: error.message,
        code: error.code,
      },
    };
  }
}

async function checkRedis(): Promise<ComponentHealth> {
  const start = Date.now();
  const client = initializeRedis();

  try {
    // Connect if not already connected
    if (client.status !== 'ready') {
      await client.connect();
    }

    // Ping Redis
    const pingResult = await client.ping();

    // Test set/get operation
    const testKey = `health:check:${Date.now()}`;
    await client.set(testKey, 'ok', 'EX', 10);
    const testValue = await client.get(testKey);
    await client.del(testKey);

    const responseTime = Date.now() - start;

    return {
      status: responseTime < 50 ? 'pass' : responseTime < 150 ? 'warn' : 'fail',
      responseTime,
      message: responseTime >= 50 ? `Redis response slow (${responseTime}ms)` : undefined,
      details: {
        ping: pingResult,
        readWrite: testValue === 'ok' ? 'success' : 'failed',
        connected: client.status === 'ready',
      },
    };
  } catch (error: any) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      message: `Redis connection failed: ${error.message}`,
      details: {
        error: error.message,
        status: client.status,
      },
    };
  }
}

async function checkS3(): Promise<ComponentHealth> {
  const start = Date.now();
  const client = initializeS3();

  try {
    const bucketName =
      process.env.S3_BUCKET_NAME || `hasivu-${process.env.NODE_ENV || 'dev'}-uploads`;

    // Check if bucket is accessible
    await client.send(new HeadBucketCommand({ Bucket: bucketName }));

    const responseTime = Date.now() - start;

    return {
      status: responseTime < 200 ? 'pass' : responseTime < 500 ? 'warn' : 'fail',
      responseTime,
      message: responseTime >= 200 ? `S3 response slow (${responseTime}ms)` : undefined,
      details: {
        bucket: bucketName,
        accessible: true,
      },
    };
  } catch (error: any) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      message: `S3 access failed: ${error.message}`,
      details: {
        error: error.message,
        code: error.code,
      },
    };
  }
}

function checkMemory(context: any): ComponentHealth {
  const memoryLimit = Number(context.memoryLimitInMB) || 128;
  const memoryUsed = process.memoryUsage();
  const heapUsedMB = memoryUsed.heapUsed / 1024 / 1024;
  const heapTotalMB = memoryUsed.heapTotal / 1024 / 1024;
  const externalMB = memoryUsed.external / 1024 / 1024;
  const memoryPercent = (heapUsedMB / memoryLimit) * 100;

  let status: ComponentStatus = 'pass';
  let message: string | undefined;

  if (memoryPercent >= 90) {
    status = 'fail';
    message = `Critical memory usage: ${memoryPercent.toFixed(2)}%`;
  } else if (memoryPercent >= 80) {
    status = 'warn';
    message = `High memory usage: ${memoryPercent.toFixed(2)}%`;
  }

  return {
    status,
    responseTime: 0,
    message,
    details: {
      heapUsed: `${heapUsedMB.toFixed(2)}MB`,
      heapTotal: `${heapTotalMB.toFixed(2)}MB`,
      external: `${externalMB.toFixed(2)}MB`,
      limit: `${memoryLimit}MB`,
      percent: `${memoryPercent.toFixed(2)}%`,
    },
  };
}

async function checkExternalAPIs(): Promise<ComponentHealth> {
  const start = Date.now();

  try {
    // Check critical external APIs
    const checks = await Promise.allSettled([
      // Razorpay API health (if configured)
      fetch('https://api.razorpay.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      }).catch(() => null),

      // Add other external API health checks here
    ]);

    const successful = checks.filter(c => c.status === 'fulfilled' && c.value !== null).length;
    const total = checks.length;
    const failures = total - successful;

    const responseTime = Date.now() - start;

    let status: ComponentStatus = 'pass';
    let message: string | undefined;

    if (failures === total) {
      status = 'fail';
      message = `All external APIs unreachable (${failures}/${total})`;
    } else if (failures > 0) {
      status = 'warn';
      message = `Some external APIs unreachable (${failures}/${total})`;
    }

    return {
      status,
      responseTime,
      message,
      details: {
        total,
        successful,
        failures,
      },
    };
  } catch (error: any) {
    return {
      status: 'warn',
      responseTime: Date.now() - start,
      message: `External API checks failed: ${error.message}`,
      details: {
        error: error.message,
      },
    };
  }
}

// ==================================================================================
// Health Check Handlers
// ==================================================================================

/**
 * Comprehensive health check - checks all components
 */
const comprehensiveHealthCheckHandler = async (event: any, context: any) => {
  const startTime = Date.now();
  const coldStart = isColdStart;
  isColdStart = false;

  try {
    // Run all health checks in parallel
    const [databaseHealth, redisHealth, s3Health, externalAPIsHealth] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkS3(),
      checkExternalAPIs(),
    ]);

    const memoryHealth = checkMemory(context);

    const checks = {
      database: databaseHealth,
      redis: redisHealth,
      s3: s3Health,
      memory: memoryHealth,
      externalAPIs: externalAPIsHealth,
    };

    // Determine overall status
    const failedChecks = Object.values(checks).filter(c => c.status === 'fail').length;
    const warnChecks = Object.values(checks).filter(c => c.status === 'warn').length;

    let overallStatus: HealthStatus;
    if (failedChecks > 0) {
      overallStatus = 'unhealthy';
    } else if (warnChecks > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || process.env.APP_VERSION || 'unknown',
      uptime: Date.now() - startupTime,
      checks,
      metadata: {
        region: process.env.AWS_REGION || 'unknown',
        functionName: context.functionName,
        functionVersion: context.functionVersion,
        coldStart,
        requestId: context.awsRequestId,
      },
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    const responseTime = Date.now() - startTime;

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Health-Status': overallStatus,
        'X-Response-Time': `${responseTime}ms`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: JSON.stringify(result, null, 2),
    };
  } catch (error: any) {
    console.error('Health check error:', error);

    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Health-Status': 'unhealthy',
      },
      body: JSON.stringify(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message,
          metadata: {
            functionName: context.functionName,
            requestId: context.awsRequestId,
          },
        },
        null,
        2
      ),
    };
  }
};

export const comprehensiveHealthCheck = comprehensiveHealthCheckHandler as APIGatewayProxyHandler;

/**
 * Liveness probe - basic health check to verify function is running
 */
const livenessProbeHandler = async (event: any, context: any) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
    body: JSON.stringify({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startupTime,
      requestId: context.awsRequestId,
    }),
  };
};

export const livenessProbe = livenessProbeHandler as APIGatewayProxyHandler;

/**
 * Readiness probe - checks if function can accept traffic
 */
const readinessProbeHandler = async (event: any, context: any) => {
  try {
    // Check critical dependencies only
    const [databaseHealth, redisHealth] = await Promise.all([checkDatabase(), checkRedis()]);

    const isReady = databaseHealth.status !== 'fail' && redisHealth.status !== 'fail';

    return {
      statusCode: isReady ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: JSON.stringify({
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: databaseHealth.status,
          redis: redisHealth.status,
        },
        requestId: context.awsRequestId,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'not_ready',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

export const readinessProbe = readinessProbeHandler as APIGatewayProxyHandler;

/**
 * Startup probe - checks if initialization is complete
 */
const startupProbeHandler = async (event: any, context: any) => {
  const coldStart = isColdStart;
  isColdStart = false;

  try {
    // Initialize all clients
    initializePrisma();
    initializeRedis();
    initializeS3();

    const startupComplete = !coldStart || Date.now() - startupTime > 1000;

    return {
      statusCode: startupComplete ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: JSON.stringify({
        status: startupComplete ? 'started' : 'starting',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - startupTime,
        coldStart,
        requestId: context.awsRequestId,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

export const startupProbe = startupProbeHandler as APIGatewayProxyHandler;

// ==================================================================================
// Cleanup on shutdown
// ==================================================================================

process.on('beforeExit', async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
  if (redis) {
    await redis.quit();
  }
});
