"use strict";
/**
 * HASIVU Platform - Comprehensive System Health Check
 * Verifies all critical system components and services
 * Implements: GET /health/system
 * Production-ready with parallel health checks and detailed metrics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemHealthCheckHandler = void 0;
const database_service_1 = require("../../services/database.service");
const redis_service_1 = require("../../services/redis.service");
const logger_service_1 = require("../../services/logger.service");
const response_utils_1 = require("../../shared/response.utils");
const environment_1 = require("../../config/environment");
/**
 * Check database health and connectivity
 */
async function checkDatabaseHealth() {
    const startTime = Date.now();
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        // Test database connectivity with a simple query
        const database = database_service_1.DatabaseService.getInstance();
        const queryStartTime = Date.now();
        await database.query('SELECT 1 as health_check');
        const queryTime = Date.now() - queryStartTime;
        // Test connection pool status
        const poolStatus = await database.getConnectionPoolStatus();
        const responseTime = Date.now() - startTime;
        return {
            name: 'database',
            status: queryTime < 1000 ? 'healthy' : queryTime < 3000 ? 'degraded' : 'unhealthy',
            responseTime,
            details: {
                queryResponseTime: `${queryTime}ms`,
                connectionPool: poolStatus,
                type: 'PostgreSQL',
                ssl: database.isSSLEnabled()
            },
            lastChecked: new Date().toISOString()
        };
    }
    catch (error) {
        logger.error('Database health check failed', { error: error.message });
        return {
            name: 'database',
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            details: {
                error: error.message,
                type: 'PostgreSQL'
            },
            lastChecked: new Date().toISOString()
        };
    }
}
/**
 * Check Redis cache health and connectivity
 */
async function checkRedisHealth() {
    const startTime = Date.now();
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        const redis = redis_service_1.RedisService;
        // Test Redis connectivity with ping
        const pingStartTime = Date.now();
        const pingResult = await redis.ping();
        const pingTime = Date.now() - pingStartTime;
        // Test set/get operations
        const testKey = `health_check:${Date.now()}`;
        const testValue = 'health_check_value';
        const setStartTime = Date.now();
        await redis.set(testKey, testValue, 60); // 60 second TTL
        const setDuration = Date.now() - setStartTime;
        const getStartTime = Date.now();
        const getValue = await redis.get(testKey);
        const getDuration = Date.now() - getStartTime;
        // Cleanup test key
        await redis.del(testKey);
        const responseTime = Date.now() - startTime;
        const totalDuration = pingTime + setDuration + getDuration;
        return {
            name: 'redis',
            status: totalDuration < 500 ? 'healthy' : totalDuration < 1500 ? 'degraded' : 'unhealthy',
            responseTime,
            details: {
                pingResult,
                pingResponseTime: `${pingTime}ms`,
                setResponseTime: `${setDuration}ms`,
                getResponseTime: `${getDuration}ms`,
                totalResponseTime: `${totalDuration}ms`,
                testDataIntegrity: getValue === testValue
            },
            lastChecked: new Date().toISOString()
        };
    }
    catch (error) {
        logger.error('Redis health check failed', { error: error.message });
        return {
            name: 'redis',
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            details: {
                error: error.message,
                type: 'Redis'
            },
            lastChecked: new Date().toISOString()
        };
    }
}
/**
 * Check external services health (WhatsApp, payment gateways)
 */
async function checkExternalServicesHealth() {
    const logger = logger_service_1.LoggerService.getInstance();
    const externalServices = [];
    // WhatsApp Business API health check
    try {
        const whatsappStartTime = Date.now();
        // Basic configuration check
        const hasRequiredConfig = !!(environment_1.config.whatsapp?.accessToken &&
            environment_1.config.whatsapp?.phoneNumberId &&
            environment_1.config.whatsapp?.webhookVerifyToken);
        const whatsappResponseTime = Date.now() - whatsappStartTime;
        externalServices.push({
            name: 'whatsapp_business_api',
            status: hasRequiredConfig ? 'healthy' : 'degraded',
            responseTime: whatsappResponseTime,
            details: {
                configurationComplete: hasRequiredConfig,
                phoneNumberId: environment_1.config.whatsapp?.phoneNumberId ? `${environment_1.config.whatsapp.phoneNumberId.substring(0, 10)}...` : 'not_configured',
                hasAccessToken: !!environment_1.config.whatsapp?.accessToken,
                hasVerifyToken: !!environment_1.config.whatsapp?.webhookVerifyToken
            },
            lastChecked: new Date().toISOString()
        });
    }
    catch (error) {
        logger.error('WhatsApp health check failed', { error: error.message });
        externalServices.push({
            name: 'whatsapp_business_api',
            status: 'unhealthy',
            responseTime: 0,
            details: {
                error: error.message
            },
            lastChecked: new Date().toISOString()
        });
    }
    // Payment gateway health check
    try {
        const paymentStartTime = Date.now();
        const hasRazorpayConfig = !!(environment_1.config.razorpay?.keyId &&
            environment_1.config.razorpay?.keySecret);
        const paymentResponseTime = Date.now() - paymentStartTime;
        externalServices.push({
            name: 'payment_gateways',
            status: hasRazorpayConfig ? 'healthy' : 'degraded',
            responseTime: paymentResponseTime,
            details: {
                razorpay: {
                    configured: hasRazorpayConfig,
                    hasKeyId: !!environment_1.config.razorpay?.keyId,
                    hasKeySecret: !!environment_1.config.razorpay?.keySecret
                }
            },
            lastChecked: new Date().toISOString()
        });
    }
    catch (error) {
        logger.error('Payment gateway health check failed', { error: error.message });
        externalServices.push({
            name: 'payment_gateways',
            status: 'unhealthy',
            responseTime: 0,
            details: {
                error: error.message
            },
            lastChecked: new Date().toISOString()
        });
    }
    return externalServices;
}
/**
 * Determine overall system health based on individual service statuses
 */
function determineOverallHealth(services) {
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    // If any core service (database, redis) is unhealthy, system is unhealthy
    const coreServices = services.filter(s => ['database', 'redis'].includes(s.name));
    const unhealthyCoreServices = coreServices.filter(s => s.status === 'unhealthy');
    if (unhealthyCoreServices.length > 0) {
        return 'unhealthy';
    }
    // If more than half of services are unhealthy
    if (unhealthyCount > services.length / 2) {
        return 'unhealthy';
    }
    // If any services are degraded or unhealthy
    if (degradedCount > 0 || unhealthyCount > 0) {
        return 'degraded';
    }
    return 'healthy';
}
/**
 * Get system-level metrics
 */
function getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    return {
        memory: {
            used: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100, // MB
            free: Math.round(((memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024) * 100) / 100, // MB
            total: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100, // MB
            percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        },
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
    };
}
/**
 * Perform comprehensive system health check
 * GET /health/system
 */
const systemHealthCheckHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('System health check started', { requestId });
        // Only allow GET method
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        // Perform parallel health checks for all services
        const [databaseHealth, redisHealth, externalServicesHealth] = await Promise.all([
            checkDatabaseHealth(),
            checkRedisHealth(),
            checkExternalServicesHealth()
        ]);
        // Combine all service health checks
        const allServices = [
            databaseHealth,
            redisHealth,
            ...externalServicesHealth
        ];
        // Determine overall system health
        const overallHealth = determineOverallHealth(allServices);
        // Get system metrics
        const systemMetrics = getSystemMetrics();
        const healthResult = {
            overallStatus: overallHealth,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: allServices,
            systemMetrics,
            responseTime: Date.now() - startTime
        };
        const duration = Date.now() - startTime;
        logger.info('System health check completed', {
            requestId,
            overallStatus: overallHealth,
            duration,
            servicesChecked: allServices.length
        });
        // Return appropriate status code based on health
        const statusCode = overallHealth === 'healthy' ? 200 :
            overallHealth === 'degraded' ? 200 : 503;
        return (0, response_utils_1.createSuccessResponse)({
            ...healthResult,
            message: `System health check completed - ${overallHealth.toUpperCase()}`
        }, statusCode);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('System health check failed', {
            requestId,
            error: error.message,
            duration: `${duration}ms`
        });
        return (0, response_utils_1.handleError)(error, 'System health check failed');
    }
};
exports.systemHealthCheckHandler = systemHealthCheckHandler;
