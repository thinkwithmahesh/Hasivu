"use strict";
/**
 * HASIVU Platform - Health Check Lambda Function
 * Standard health check endpoint for load balancers and monitoring
 * Implements: GET /health/check
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckHandler = void 0;
const database_service_1 = require("../../services/database.service");
const redis_service_1 = require("../../services/redis.service");
const logger_service_1 = require("../../services/logger.service");
// Initialize services
const logger = logger_service_1.LoggerService.getInstance();
// Common Lambda response helper
const createResponse = (statusCode, body, headers = {}) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        ...headers
    },
    body: JSON.stringify(body)
});
/**
 * Health check handler
 * GET /health/check
 */
const healthCheckHandler = async (event, context) => {
    const startTime = Date.now();
    try {
        logger.info('Starting health check', {
            requestId: context.awsRequestId,
            functionName: context.functionName
        });
        // Perform health checks in parallel
        const [databaseCheck, redisCheck] = await Promise.allSettled([
            checkDatabaseHealth(),
            checkRedisHealth()
        ]);
        // Process results
        const services = [
            {
                name: 'database',
                status: databaseCheck.status === 'fulfilled' ? databaseCheck.value.status : 'unhealthy',
                responseTime: databaseCheck.status === 'fulfilled' ? databaseCheck.value.responseTime : 0
            },
            {
                name: 'redis',
                status: redisCheck.status === 'fulfilled' ? redisCheck.value.status : 'unhealthy',
                responseTime: redisCheck.status === 'fulfilled' ? redisCheck.value.responseTime : 0
            }
        ];
        // Determine overall status
        const unhealthyServices = services.filter(s => s.status === 'unhealthy');
        const degradedServices = services.filter(s => s.status === 'degraded');
        const overallStatus = unhealthyServices.length > 0 ? 'unhealthy' :
            degradedServices.length > 0 ? 'degraded' : 'healthy';
        const totalResponseTime = Date.now() - startTime;
        const healthResult = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            responseTime: totalResponseTime,
            services,
            version: process.env.APP_VERSION || '1.0.0'
        };
        logger.info('Health check completed', {
            status: overallStatus,
            responseTime: totalResponseTime,
            requestId: context.awsRequestId
        });
        // Return appropriate status code based on health
        const statusCode = overallStatus === 'healthy' ? 200 :
            overallStatus === 'degraded' ? 200 : 503;
        return createResponse(statusCode, {
            success: true,
            data: healthResult,
            message: `Health check completed - ${overallStatus.toUpperCase()}`
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Health check failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            duration,
            requestId: context.awsRequestId
        });
        return createResponse(500, {
            success: false,
            error: 'Internal server error during health check',
            requestId: context.awsRequestId
        });
    }
};
exports.healthCheckHandler = healthCheckHandler;
/**
 * Check database health
 */
async function checkDatabaseHealth() {
    const startTime = Date.now();
    try {
        await database_service_1.DatabaseService.client.$queryRaw `SELECT 1`;
        const responseTime = Date.now() - startTime;
        return {
            name: 'database',
            status: responseTime > 1000 ? 'degraded' : 'healthy',
            responseTime
        };
    }
    catch (error) {
        return {
            name: 'database',
            status: 'unhealthy',
            responseTime: Date.now() - startTime
        };
    }
}
/**
 * Check Redis health
 */
async function checkRedisHealth() {
    const startTime = Date.now();
    try {
        const testKey = `health_check:${Date.now()}`;
        await redis_service_1.RedisService.set(testKey, 'test', 5);
        const value = await redis_service_1.RedisService.get(testKey);
        const responseTime = Date.now() - startTime;
        if (value !== 'test') {
            return {
                name: 'redis',
                status: 'unhealthy',
                responseTime
            };
        }
        return {
            name: 'redis',
            status: responseTime > 500 ? 'degraded' : 'healthy',
            responseTime
        };
    }
    catch (error) {
        return {
            name: 'redis',
            status: 'unhealthy',
            responseTime: Date.now() - startTime
        };
    }
}
