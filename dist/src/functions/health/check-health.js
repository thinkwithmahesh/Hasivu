"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detailedHealthCheckHandler = exports.healthCheckHandler = void 0;
const database_service_1 = require("@/services/database.service");
const redis_service_1 = require("@/services/redis.service");
const logger_1 = require("@/utils/logger");
const response_utils_1 = require("@/shared/response.utils");
const environment_1 = require("@/config/environment");
const healthCheckHandler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('healthCheckHandler', { event, context });
    try {
        const [databaseHealth, redisHealth] = await Promise.all([
            checkDatabaseHealth(),
            checkRedisHealth()
        ]);
        const overallStatus = determineOverallHealth([databaseHealth, redisHealth]);
        const healthCheckResult = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            services: {
                database: databaseHealth,
                redis: redisHealth,
                external: {},
            },
            system: getSystemMetrics()
        };
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd("handler", { statusCode: 200, duration });
        const statusCode = overallStatus === 'healthy' ? 200 :
            overallStatus === 'degraded' ? 200 : 503;
        return (0, response_utils_1.createSuccessResponse)({
            data: healthCheckResult,
            message: `System health check completed - ${overallStatus.toUpperCase()}`
        }, statusCode);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd("handler", { statusCode: 500, duration });
        return (0, response_utils_1.handleError)(error, 'Health check failed');
    }
};
exports.healthCheckHandler = healthCheckHandler;
const detailedHealthCheckHandler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('detailedHealthCheckHandler', { event, context });
    try {
        const [databaseHealth, redisHealth, externalServices] = await Promise.all([
            checkDatabaseHealth(),
            checkRedisHealth(),
            checkExternalServices()
        ]);
        const allServices = [databaseHealth, redisHealth, ...Object.values(externalServices)];
        const overallStatus = determineOverallHealth(allServices);
        const recommendations = [];
        if (databaseHealth.status !== 'healthy') {
            recommendations.push('Database service requires attention - check connection and performance');
        }
        if (redisHealth.status !== 'healthy') {
            recommendations.push('Redis service requires attention - check connection and memory usage');
        }
        Object.entries(externalServices).forEach(([serviceName, health]) => {
            if (health.responseTime > 2000) {
                recommendations.push(`${serviceName} service response time is slow`);
            }
            if (health.status === 'unhealthy') {
                recommendations.push(`${serviceName} service is unreachable - check connectivity and credentials`);
            }
        });
        const healthCheckResult = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            services: {
                database: databaseHealth,
                redis: redisHealth,
                external: externalServices
            },
            system: getSystemMetrics(),
            recommendations: recommendations.length > 0 ? recommendations : undefined
        };
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd("handler", { statusCode: 200, duration });
        const statusCode = overallStatus === 'healthy' ? 200 :
            overallStatus === 'degraded' ? 200 : 503;
        return (0, response_utils_1.createSuccessResponse)({
            data: healthCheckResult,
            message: `Detailed system health check completed - ${overallStatus.toUpperCase()}`
        }, statusCode);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd("handler", { statusCode: 500, duration });
        return (0, response_utils_1.handleError)(error, 'Detailed health check failed');
    }
};
exports.detailedHealthCheckHandler = detailedHealthCheckHandler;
async function checkDatabaseHealth() {
    const startTime = Date.now();
    try {
        const database = database_service_1.DatabaseService.getInstance();
        await database.query('SELECT 1');
        const responseTime = Date.now() - startTime;
        return {
            status: responseTime < 1000 ? 'healthy' : responseTime < 3000 ? 'degraded' : 'unhealthy',
            responseTime,
            lastChecked: new Date().toISOString(),
            details: `Database query completed in ${responseTime}ms`
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
            details: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
async function checkRedisHealth() {
    const startTime = Date.now();
    try {
        const redis = redis_service_1.RedisService;
        await redis.ping();
        const responseTime = Date.now() - startTime;
        return {
            status: responseTime < 500 ? 'healthy' : responseTime < 1500 ? 'degraded' : 'unhealthy',
            responseTime,
            lastChecked: new Date().toISOString(),
            details: `Redis ping completed in ${responseTime}ms`
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
            details: `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
async function checkExternalServices() {
    const externalServices = {};
    if (environment_1.config.razorpay?.keyId) {
        externalServices.razorpay = await checkExternalService('https://api.razorpay.com/v1/payments', 'razorpay', 5000);
    }
    if (environment_1.config.notifications?.email?.apiKey) {
        externalServices.email = await checkExternalService('https://api.emailservice.com/health', 'email', 3000);
    }
    return externalServices;
}
async function checkExternalService(endpoint, serviceName, timeout) {
    const startTime = Date.now();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(endpoint, {
            method: 'HEAD',
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        const status = response.ok ?
            (responseTime < 2000 ? 'healthy' : 'degraded') :
            'unhealthy';
        return {
            status,
            responseTime,
            lastChecked: new Date().toISOString(),
            endpoint,
            timeout,
            details: `${serviceName} service responded with ${response.status} in ${responseTime}ms`
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
            endpoint,
            timeout,
            details: `${serviceName} service failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
function determineOverallHealth(services) {
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    if (unhealthyCount > 0) {
        return 'unhealthy';
    }
    if (degradedCount > 0) {
        return 'degraded';
    }
    return 'healthy';
}
function getSystemMetrics() {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    return {
        uptime,
        memory: {
            used: memUsage.heapUsed,
            free: memUsage.heapTotal - memUsage.heapUsed,
            percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
        },
        timestamp: new Date().toISOString()
    };
}
//# sourceMappingURL=check-health.js.map