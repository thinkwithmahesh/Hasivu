"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readinessCheckHandler = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const prisma = new client_1.PrismaClient();
const createResponse = (statusCode, body, headers = {}) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...headers
    },
    body: JSON.stringify(body)
});
const checkReadiness = async () => {
    const checks = {};
    const issues = [];
    try {
        const dbStartTime = Date.now();
        await prisma.$queryRaw `SELECT 1`;
        const dbDuration = Date.now() - dbStartTime;
        checks.database = {
            status: 'ready',
            responseTime: `${dbDuration}ms`,
            message: 'Database connection successful'
        };
    }
    catch (dbError) {
        checks.database = {
            status: 'not_ready',
            error: dbError.message,
            message: 'Database connection failed'
        };
        issues.push('Database connectivity check failed');
    }
    const requiredEnvVars = [
        'DATABASE_URL',
        'JWT_SECRET',
        'NODE_ENV'
    ];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    checks.environment = {
        status: missingEnvVars.length === 0 ? 'ready' : 'not_ready',
        requiredVariables: requiredEnvVars.length,
        foundVariables: requiredEnvVars.length - missingEnvVars.length,
        message: missingEnvVars.length === 0
            ? 'All required environment variables are present'
            : `Missing required environment variables: ${missingEnvVars.join(', ')}`
    };
    if (missingEnvVars.length > 0) {
        issues.push(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memLimitMB = 512;
    checks.memory = {
        status: memUsageMB < memLimitMB * 0.8 ? 'ready' : 'warning',
        usage: `${memUsageMB}MB`,
        limit: `${memLimitMB}MB`,
        percentage: Math.round((memUsageMB / memLimitMB) * 100),
        message: memUsageMB < memLimitMB * 0.8
            ? 'Memory usage is within acceptable limits'
            : 'Memory usage is approaching limits'
    };
    if (memUsageMB >= memLimitMB * 0.8) {
        issues.push('High memory usage detected');
    }
    const ready = issues.length === 0;
    return { ready, checks, issues };
};
const readinessCheckHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Readiness check started', { requestId });
        const readinessResult = await checkReadiness();
        const duration = Date.now() - startTime;
        const response = {
            ready: readinessResult.ready,
            timestamp: new Date().toISOString(),
            checks: readinessResult.checks,
            issues: readinessResult.issues,
            duration: `${duration}ms`
        };
        logger.info('Readiness check completed', {
            requestId,
            ready: readinessResult.ready,
            issueCount: readinessResult.issues.length,
            duration: `${duration}ms`
        });
        const statusCode = readinessResult.ready ? 200 : 503;
        return createResponse(statusCode, {
            success: readinessResult.ready,
            data: response,
            message: readinessResult.ready
                ? 'Service is ready to serve traffic'
                : `Service is not ready: ${readinessResult.issues.join(', ')}`
        });
    }
    catch (error) {
        logger.error('Readiness check failed', {
            requestId,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Readiness check failed');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.readinessCheckHandler = readinessCheckHandler;
//# sourceMappingURL=ready.js.map