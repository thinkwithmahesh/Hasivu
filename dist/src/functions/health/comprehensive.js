"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comprehensiveHealthCheckHandler = void 0;
const database_service_1 = require("../../services/database.service");
const redis_service_1 = require("../../services/redis.service");
const logger_service_1 = require("../../services/logger.service");
const logger = logger_service_1.LoggerService.getInstance();
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
const comprehensiveHealthCheckHandler = async (event, context) => {
    const startTime = Date.now();
    try {
        logger.info('Starting comprehensive health check', {
            requestId: context.awsRequestId,
            functionName: context.functionName
        });
        const [databaseHealth, redisHealth] = await Promise.allSettled([
            checkDatabaseHealth(),
            checkRedisHealth()
        ]);
        const services = [
            {
                name: 'database',
                status: databaseHealth.status === 'fulfilled' ? databaseHealth.value.status : 'unhealthy',
                responseTime: databaseHealth.status === 'fulfilled' ? databaseHealth.value.responseTime : 0,
                details: databaseHealth.status === 'rejected' ? { error: databaseHealth.reason.message } : undefined
            },
            {
                name: 'redis',
                status: redisHealth.status === 'fulfilled' ? redisHealth.value.status : 'unhealthy',
                responseTime: redisHealth.status === 'fulfilled' ? redisHealth.value.responseTime : 0,
                details: redisHealth.status === 'rejected' ? { error: redisHealth.reason.message } : undefined
            }
        ];
        const overallStatus = determineOverallHealth(services);
        const systemMetrics = getSystemMetrics();
        const alerts = await getActiveAlerts(services);
        const recommendations = await getRecommendations(services);
        const healthCheckResult = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            system: systemMetrics,
            services,
            alerts,
            recommendations
        };
        const duration = Date.now() - startTime;
        logger.info('Comprehensive health check completed', {
            status: overallStatus,
            duration,
            requestId: context.awsRequestId
        });
        const statusCode = overallStatus === 'healthy' ? 200 :
            overallStatus === 'degraded' ? 200 : 503;
        return createResponse(statusCode, {
            success: true,
            data: healthCheckResult,
            message: `Comprehensive system health check completed - ${overallStatus.toUpperCase()}`
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Comprehensive health check failed', {
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
exports.comprehensiveHealthCheckHandler = comprehensiveHealthCheckHandler;
async function checkDatabaseHealth() {
    const startTime = Date.now();
    try {
        await database_service_1.DatabaseService.client.$queryRaw `SELECT 1`;
        return {
            name: 'database',
            status: 'healthy',
            responseTime: Date.now() - startTime
        };
    }
    catch (error) {
        return {
            name: 'database',
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            details: { error: error instanceof Error ? error.message : 'Unknown database error' }
        };
    }
}
async function checkRedisHealth() {
    const startTime = Date.now();
    try {
        const testKey = `health_check:${Date.now()}`;
        await redis_service_1.RedisService.set(testKey, 'test', 5);
        const value = await redis_service_1.RedisService.get(testKey);
        if (value !== 'test') {
            throw new Error('Redis read/write test failed');
        }
        return {
            name: 'redis',
            status: 'healthy',
            responseTime: Date.now() - startTime
        };
    }
    catch (error) {
        return {
            name: 'redis',
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            details: { error: error instanceof Error ? error.message : 'Unknown Redis error' }
        };
    }
}
function determineOverallHealth(services) {
    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');
    if (unhealthyServices.length > 0) {
        return 'unhealthy';
    }
    if (degradedServices.length > 0) {
        return 'degraded';
    }
    return 'healthy';
}
function getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    return {
        uptime: process.uptime(),
        memory: {
            used: memoryUsage.heapUsed,
            free: memoryUsage.heapTotal - memoryUsage.heapUsed,
            total: memoryUsage.heapTotal
        },
        cpu: {
            usage: process.cpuUsage().user + process.cpuUsage().system
        },
        process: {
            pid: process.pid,
            uptime: process.uptime()
        }
    };
}
async function getActiveAlerts(services) {
    const alerts = [];
    services.forEach(service => {
        if (service.status === 'unhealthy') {
            alerts.push({
                id: `service-${service.name}-unhealthy`,
                level: 'critical',
                message: `Service ${service.name} is unhealthy`,
                timestamp: new Date().toISOString()
            });
        }
        else if (service.status === 'degraded') {
            alerts.push({
                id: `service-${service.name}-degraded`,
                level: 'warning',
                message: `Service ${service.name} is degraded`,
                timestamp: new Date().toISOString()
            });
        }
        if (service.responseTime > 1000) {
            alerts.push({
                id: `service-${service.name}-slow`,
                level: 'warning',
                message: `Service ${service.name} response time is slow (${service.responseTime}ms)`,
                timestamp: new Date().toISOString()
            });
        }
    });
    return alerts;
}
async function getRecommendations(services) {
    const recommendations = [];
    const slowServices = services.filter(s => s.responseTime > 500);
    if (slowServices.length > 0) {
        recommendations.push({
            id: 'optimize-slow-services',
            type: 'performance',
            message: `Consider optimizing slow services: ${slowServices.map(s => s.name).join(', ')}`,
            priority: 'medium'
        });
    }
    const memoryUsage = process.memoryUsage();
    const memoryUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    if (memoryUsedPercent > 80) {
        recommendations.push({
            id: 'high-memory-usage',
            type: 'performance',
            message: `High memory usage detected (${memoryUsedPercent.toFixed(1)}%). Consider optimization.`,
            priority: 'high'
        });
    }
    return recommendations;
}
//# sourceMappingURL=comprehensive.js.map