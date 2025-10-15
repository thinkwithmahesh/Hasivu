"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemHealthCheckHandler = void 0;
const database_service_1 = require("../../services/database.service");
const redis_service_1 = require("../../services/redis.service");
const logger_service_1 = require("../../services/logger.service");
const response_utils_1 = require("../../shared/response.utils");
const environment_1 = require("../../config/environment");
async function checkDatabaseHealth() {
    const startTime = Date.now();
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        const database = database_service_1.DatabaseService.getInstance();
        const queryStartTime = Date.now();
        await database.query('SELECT 1 as health_check');
        const queryTime = Date.now() - queryStartTime;
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
        logger.error('Database health check failed', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
        return {
            name: 'database',
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            details: {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                type: 'PostgreSQL'
            },
            lastChecked: new Date().toISOString()
        };
    }
}
async function checkRedisHealth() {
    const startTime = Date.now();
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        const redis = redis_service_1.RedisService;
        const pingStartTime = Date.now();
        const pingResult = await redis.ping();
        const pingTime = Date.now() - pingStartTime;
        const testKey = `health_check:${Date.now()}`;
        const testValue = 'health_check_value';
        const setStartTime = Date.now();
        await redis.set(testKey, testValue, 60);
        const setDuration = Date.now() - setStartTime;
        const getStartTime = Date.now();
        const getValue = await redis.get(testKey);
        const getDuration = Date.now() - getStartTime;
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
        logger.error('Redis health check failed', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
        return {
            name: 'redis',
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            details: {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                type: 'Redis'
            },
            lastChecked: new Date().toISOString()
        };
    }
}
async function checkExternalServicesHealth() {
    const logger = logger_service_1.LoggerService.getInstance();
    const externalServices = [];
    try {
        const whatsappStartTime = Date.now();
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
        logger.error('WhatsApp health check failed', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
        externalServices.push({
            name: 'whatsapp_business_api',
            status: 'unhealthy',
            responseTime: 0,
            details: {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            },
            lastChecked: new Date().toISOString()
        });
    }
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
        logger.error('Payment gateway health check failed', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
        externalServices.push({
            name: 'payment_gateways',
            status: 'unhealthy',
            responseTime: 0,
            details: {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            },
            lastChecked: new Date().toISOString()
        });
    }
    return externalServices;
}
function determineOverallHealth(services) {
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const coreServices = services.filter(s => ['database', 'redis'].includes(s.name));
    const unhealthyCoreServices = coreServices.filter(s => s.status === 'unhealthy');
    if (unhealthyCoreServices.length > 0) {
        return 'unhealthy';
    }
    if (unhealthyCount > services.length / 2) {
        return 'unhealthy';
    }
    if (degradedCount > 0 || unhealthyCount > 0) {
        return 'degraded';
    }
    return 'healthy';
}
function getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    return {
        memory: {
            used: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
            free: Math.round(((memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024) * 100) / 100,
            total: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
            percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        },
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
    };
}
const systemHealthCheckHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('System health check started', { requestId });
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        const [databaseHealth, redisHealth, externalServicesHealth] = await Promise.all([
            checkDatabaseHealth(),
            checkRedisHealth(),
            checkExternalServicesHealth()
        ]);
        const allServices = [
            databaseHealth,
            redisHealth,
            ...externalServicesHealth
        ];
        const overallHealth = determineOverallHealth(allServices);
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
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            duration: `${duration}ms`
        });
        return (0, response_utils_1.handleError)(error, 'System health check failed');
    }
};
exports.systemHealthCheckHandler = systemHealthCheckHandler;
//# sourceMappingURL=system-health.js.map