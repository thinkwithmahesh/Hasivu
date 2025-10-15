"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startupProbe = exports.readinessProbe = exports.livenessProbe = exports.comprehensiveHealthCheck = void 0;
const client_1 = require("@prisma/client");
const ioredis_1 = __importDefault(require("ioredis"));
const client_s3_1 = require("@aws-sdk/client-s3");
let prisma = null;
let redis = null;
let s3 = null;
const startupTime = Date.now();
let isColdStart = true;
function initializePrisma() {
    if (!prisma) {
        prisma = new client_1.PrismaClient({
            log: ['error'],
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        });
    }
    return prisma;
}
function initializeRedis() {
    if (!redis) {
        redis = new ioredis_1.default(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            connectTimeout: 5000,
            lazyConnect: true,
            retryStrategy: (times) => {
                if (times > 3)
                    return null;
                return Math.min(times * 200, 1000);
            },
        });
    }
    return redis;
}
function initializeS3() {
    if (!s3) {
        s3 = new client_s3_1.S3Client({
            region: process.env.AWS_REGION || 'ap-south-1',
        });
    }
    return s3;
}
async function checkDatabase() {
    const start = Date.now();
    const client = initializePrisma();
    try {
        await client.$queryRaw `SELECT 1 as health_check`;
        const connectionPoolSize = 10;
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
    }
    catch (error) {
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
async function checkRedis() {
    const start = Date.now();
    const client = initializeRedis();
    try {
        if (client.status !== 'ready') {
            await client.connect();
        }
        const pingResult = await client.ping();
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
    }
    catch (error) {
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
async function checkS3() {
    const start = Date.now();
    const client = initializeS3();
    try {
        const bucketName = process.env.S3_BUCKET_NAME || `hasivu-${process.env.NODE_ENV || 'dev'}-uploads`;
        await client.send(new client_s3_1.HeadBucketCommand({ Bucket: bucketName }));
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
    }
    catch (error) {
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
function checkMemory(context) {
    const memoryLimit = Number(context.memoryLimitInMB) || 128;
    const memoryUsed = process.memoryUsage();
    const heapUsedMB = memoryUsed.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsed.heapTotal / 1024 / 1024;
    const externalMB = memoryUsed.external / 1024 / 1024;
    const memoryPercent = (heapUsedMB / memoryLimit) * 100;
    let status = 'pass';
    let message;
    if (memoryPercent >= 90) {
        status = 'fail';
        message = `Critical memory usage: ${memoryPercent.toFixed(2)}%`;
    }
    else if (memoryPercent >= 80) {
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
async function checkExternalAPIs() {
    const start = Date.now();
    try {
        const checks = await Promise.allSettled([
            fetch('https://api.razorpay.com', {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000),
            }).catch(() => null),
        ]);
        const successful = checks.filter(c => c.status === 'fulfilled' && c.value !== null).length;
        const total = checks.length;
        const failures = total - successful;
        const responseTime = Date.now() - start;
        let status = 'pass';
        let message;
        if (failures === total) {
            status = 'fail';
            message = `All external APIs unreachable (${failures}/${total})`;
        }
        else if (failures > 0) {
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
    }
    catch (error) {
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
const comprehensiveHealthCheckHandler = async (event, context) => {
    const startTime = Date.now();
    const coldStart = isColdStart;
    isColdStart = false;
    try {
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
        const failedChecks = Object.values(checks).filter(c => c.status === 'fail').length;
        const warnChecks = Object.values(checks).filter(c => c.status === 'warn').length;
        let overallStatus;
        if (failedChecks > 0) {
            overallStatus = 'unhealthy';
        }
        else if (warnChecks > 0) {
            overallStatus = 'degraded';
        }
        else {
            overallStatus = 'healthy';
        }
        const result = {
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
    }
    catch (error) {
        console.error('Health check error:', error);
        return {
            statusCode: 503,
            headers: {
                'Content-Type': 'application/json',
                'X-Health-Status': 'unhealthy',
            },
            body: JSON.stringify({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
                metadata: {
                    functionName: context.functionName,
                    requestId: context.awsRequestId,
                },
            }, null, 2),
        };
    }
};
exports.comprehensiveHealthCheck = comprehensiveHealthCheckHandler;
const livenessProbeHandler = async (event, context) => {
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
exports.livenessProbe = livenessProbeHandler;
const readinessProbeHandler = async (event, context) => {
    try {
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
    }
    catch (error) {
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
exports.readinessProbe = readinessProbeHandler;
const startupProbeHandler = async (event, context) => {
    const coldStart = isColdStart;
    isColdStart = false;
    try {
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
    }
    catch (error) {
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
exports.startupProbe = startupProbeHandler;
process.on('beforeExit', async () => {
    if (prisma) {
        await prisma.$disconnect();
    }
    if (redis) {
        await redis.quit();
    }
});
//# sourceMappingURL=comprehensive-health.js.map