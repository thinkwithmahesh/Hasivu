"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusHandler = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
// Initialize database client
const prisma = new client_1.PrismaClient();
/**
 * Check database connectivity
 */
async function checkDatabaseStatus() {
    try {
        const startTime = Date.now();
        await prisma.$queryRaw `SELECT 1`;
        const responseTime = Date.now() - startTime;
        return {
            status: 'healthy',
            responseTime: `${responseTime}ms`
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            responseTime: 'timeout'
        };
    }
}
/**
 * Determine overall system status
 */
function determineOverallStatus(services) {
    const serviceStatuses = Object.values(services).map(service => service.status);
    if (serviceStatuses.every(status => status === 'healthy')) {
        return 'operational';
    }
    if (serviceStatuses.some(status => status === 'healthy')) {
        return 'degraded';
    }
    return 'down';
}
/**
 * Get system status overview
 * GET /api/v1/health/status
 */
const getStatusHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('System status check started', { requestId });
        // Perform parallel health checks
        const [databaseStatus] = await Promise.all([
            checkDatabaseStatus()
        ]);
        // Check API responsiveness
        const apiResponseTime = Date.now() - startTime;
        const apiStatus = {
            status: 'healthy',
            responseTime: `${apiResponseTime}ms`
        };
        // Construct services status
        const services = {
            database: databaseStatus,
            api: apiStatus
        };
        // Determine overall system status
        const overallStatus = determineOverallStatus(services);
        // Get system uptime
        const uptime = process.uptime();
        const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;
        // Construct system status response
        const systemStatus = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: uptimeFormatted,
            services,
            version: process.env.APP_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        };
        const duration = Date.now() - startTime;
        logger.info('System status check completed', {
            requestId,
            status: overallStatus,
            duration: `${duration}ms`
        });
        // Return appropriate status code based on system health
        const statusCode = overallStatus === 'operational' ? 200 :
            overallStatus === 'degraded' ? 200 : 503;
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            body: JSON.stringify({
                success: statusCode < 400,
                data: systemStatus,
                message: `System status: ${overallStatus.toUpperCase()}`
            })
        };
    }
    catch (error) {
        logger.error('System status check failed', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Failed to get system status');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.getStatusHandler = getStatusHandler;
