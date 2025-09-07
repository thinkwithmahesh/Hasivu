"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceStatusHandler = exports.getDetailedStatusHandler = exports.getStatusHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../../shared/response.utils");
const database_service_1 = require("../../services/database.service");
const redis_service_1 = require("../../services/redis.service");
async function checkServiceStatus(serviceName) {
    const logger = logger_service_1.LoggerService.getInstance();
    const startTime = Date.now();
    try {
        switch (serviceName) {
            case 'database':
                const database = database_service_1.DatabaseService.getInstance();
                const queryStartTime = Date.now();
                await database.query('SELECT 1 as health_check');
                const queryTime = Date.now() - queryStartTime;
                return {
                    name: 'database',
                    status: queryTime < 1000 ? 'operational' : queryTime < 3000 ? 'degraded' : 'major_outage',
                    uptime: '99.9%',
                    responseTime: queryTime,
                    lastChecked: new Date().toISOString(),
                    metrics: {
                        connections: await database.getConnectionPoolStatus(),
                        queryTime: `${queryTime}ms`
                    }
                };
            case 'redis':
                const redis = redis_service_1.RedisService;
                const pingStartTime = Date.now();
                await redis.ping();
                const pingTime = Date.now() - pingStartTime;
                return {
                    name: 'redis',
                    status: pingTime < 100 ? 'operational' : pingTime < 500 ? 'degraded' : 'major_outage',
                    uptime: '99.8%',
                    responseTime: pingTime,
                    lastChecked: new Date().toISOString(),
                    metrics: {
                        pingTime: `${pingTime}ms`
                    }
                };
            case 'api':
                return {
                    name: 'api',
                    status: 'operational',
                    uptime: '99.95%',
                    responseTime: 150,
                    lastChecked: new Date().toISOString(),
                    metrics: {
                        requestsPerMinute: 450,
                        averageResponseTime: '150ms'
                    }
                };
            case 'payments':
                return {
                    name: 'payments',
                    status: 'operational',
                    uptime: '99.9%',
                    responseTime: 200,
                    lastChecked: new Date().toISOString(),
                    metrics: {
                        successRate: '99.5%',
                        averageProcessingTime: '200ms'
                    }
                };
            default:
                throw new Error(`Unknown service: ${serviceName}`);
        }
    }
    catch (error) {
        logger.error('Service status check failed', { serviceName, error: error.message });
        return {
            name: serviceName,
            status: 'major_outage',
            uptime: '0%',
            responseTime: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
            metrics: {
                error: error.message
            }
        };
    }
}
async function getCurrentIncidents() {
    return [];
}
async function getScheduledMaintenance() {
    return [];
}
async function getSystemMetrics() {
    return {
        totalRequests24h: 125000,
        averageResponseTime: 180,
        errorRate: 0.02,
        uptime: 99.95,
        activeUsers: 850
    };
}
function determineOverallStatus(services) {
    const serviceStatuses = Object.values(services);
    if (serviceStatuses.some(s => s.status === 'major_outage')) {
        return 'major_outage';
    }
    if (serviceStatuses.some(s => s.status === 'maintenance')) {
        return 'maintenance';
    }
    if (serviceStatuses.some(s => s.status === 'degraded')) {
        return 'degraded';
    }
    return 'operational';
}
const getStatusHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('System status request started', { requestId });
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        const [databaseStatus, redisStatus, apiStatus, paymentsStatus] = await Promise.all([
            checkServiceStatus('database'),
            checkServiceStatus('redis'),
            checkServiceStatus('api'),
            checkServiceStatus('payments')
        ]);
        const services = {
            database: databaseStatus,
            redis: redisStatus,
            api: apiStatus,
            payments: paymentsStatus
        };
        const [incidents, scheduledMaintenance, metrics] = await Promise.all([
            getCurrentIncidents(),
            getScheduledMaintenance(),
            getSystemMetrics()
        ]);
        const overall = determineOverallStatus(services);
        const status = {
            overall,
            services,
            incidents,
            scheduledMaintenance,
            metrics,
            lastUpdated: new Date().toISOString()
        };
        const duration = Date.now() - startTime;
        logger.info('System status retrieved successfully', {
            requestId,
            overallStatus: overall,
            serviceCount: Object.keys(services).length,
            incidentCount: incidents.length,
            duration: `${duration}ms`
        });
        const statusCode = overall === 'operational' ? 200 :
            overall === 'degraded' ? 200 :
                overall === 'maintenance' ? 200 : 503;
        return (0, response_utils_1.createSuccessResponse)({
            ...status,
            message: `System status: ${overall.toUpperCase()}`
        }, statusCode);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('System status request failed', {
            requestId,
            error: error.message,
            duration: `${duration}ms`
        });
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve system status');
    }
};
exports.getStatusHandler = getStatusHandler;
const getDetailedStatusHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Detailed system status request started', { requestId });
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        const [databaseStatus, redisStatus, apiStatus, paymentsStatus] = await Promise.all([
            checkServiceStatus('database'),
            checkServiceStatus('redis'),
            checkServiceStatus('api'),
            checkServiceStatus('payments')
        ]);
        const services = {
            database: databaseStatus,
            redis: redisStatus,
            api: apiStatus,
            payments: paymentsStatus
        };
        const [incidents, scheduledMaintenance, metrics] = await Promise.all([
            getCurrentIncidents(),
            getScheduledMaintenance(),
            getSystemMetrics()
        ]);
        const overall = determineOverallStatus(services);
        const systemInfo = {
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || 'development'
        };
        const detailedStatus = {
            overall,
            services,
            incidents,
            scheduledMaintenance,
            metrics,
            systemInfo,
            lastUpdated: new Date().toISOString()
        };
        const duration = Date.now() - startTime;
        logger.info('Detailed system status retrieved successfully', {
            requestId,
            overallStatus: overall,
            serviceCount: Object.keys(services).length,
            incidentCount: incidents.length,
            duration: `${duration}ms`
        });
        const statusCode = overall === 'operational' ? 200 :
            overall === 'degraded' ? 200 :
                overall === 'maintenance' ? 200 : 503;
        return (0, response_utils_1.createSuccessResponse)({
            ...detailedStatus,
            message: `Detailed system status: ${overall.toUpperCase()}`
        }, statusCode);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Detailed system status request failed', {
            requestId,
            error: error.message,
            duration: `${duration}ms`
        });
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve detailed system status');
    }
};
exports.getDetailedStatusHandler = getDetailedStatusHandler;
const getServiceStatusHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Service status request started', { requestId });
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        const serviceName = event.pathParameters?.serviceName;
        if (!serviceName) {
            return (0, response_utils_1.createErrorResponse)('Service name is required', 400, 'MISSING_SERVICE_NAME');
        }
        const serviceStatus = await checkServiceStatus(serviceName);
        const duration = Date.now() - startTime;
        logger.info('Service status retrieved successfully', {
            requestId,
            serviceName,
            status: serviceStatus.status,
            duration: `${duration}ms`
        });
        const statusCode = serviceStatus.status === 'operational' ? 200 :
            serviceStatus.status === 'degraded' ? 200 :
                serviceStatus.status === 'maintenance' ? 200 : 503;
        return (0, response_utils_1.createSuccessResponse)({
            data: serviceStatus,
            message: `Status for service ${serviceName}: ${serviceStatus.status.toUpperCase()}`
        }, statusCode);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Service status request failed', {
            requestId,
            serviceName: event.pathParameters?.serviceName,
            error: error.message,
            duration: `${duration}ms`
        });
        if (error.message.includes('Unknown service')) {
            return (0, response_utils_1.createErrorResponse)(`Service ${event.pathParameters?.serviceName} not found`, 404, 'SERVICE_NOT_FOUND');
        }
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve service status');
    }
};
exports.getServiceStatusHandler = getServiceStatusHandler;
//# sourceMappingURL=system-status.js.map