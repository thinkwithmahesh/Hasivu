"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusHandler = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const prisma = new client_1.PrismaClient();
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
const getStatusHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('System status check started', { requestId });
        const [databaseStatus] = await Promise.all([
            checkDatabaseStatus()
        ]);
        const apiResponseTime = Date.now() - startTime;
        const apiStatus = {
            status: 'healthy',
            responseTime: `${apiResponseTime}ms`
        };
        const services = {
            database: databaseStatus,
            api: apiStatus
        };
        const overallStatus = determineOverallStatus(services);
        const uptime = process.uptime();
        const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;
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
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Failed to get system status');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.getStatusHandler = getStatusHandler;
//# sourceMappingURL=status.js.map