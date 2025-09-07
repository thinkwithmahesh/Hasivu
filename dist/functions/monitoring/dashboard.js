"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceHealthHandler = exports.monitoringDashboardHandler = void 0;
const monitoring_dashboard_service_1 = require("@/services/monitoring-dashboard.service");
const logger_1 = require("@/utils/logger");
const response_utils_1 = require("@/shared/response.utils");
/**
 * System monitoring dashboard Lambda function handler
 * GET /monitoring/dashboard
 */
const monitoringDashboardHandler = async (event, context) => {
    const startTime = Date.now();
    try {
        logger_1.logger.info('Processing monitoring dashboard request', {
            method: event.httpMethod,
            path: event.path,
            requestId: context.awsRequestId
        });
        // Get dashboard data from service
        const dashboardData = await monitoring_dashboard_service_1.monitoringDashboardService.getDashboardData();
        const duration = Date.now() - startTime;
        logger_1.logger.info('Dashboard data retrieved successfully', { duration, requestId: context.awsRequestId });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Monitoring dashboard data retrieved successfully',
            data: dashboardData,
            requestId: context.awsRequestId,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve monitoring dashboard data');
    }
};
exports.monitoringDashboardHandler = monitoringDashboardHandler;
/**
 * Get specific service health
 * GET /monitoring/health/:service
 */
const serviceHealthHandler = async (event, context) => {
    const startTime = Date.now();
    try {
        const service = event.pathParameters?.service;
        if (!service) {
            return (0, response_utils_1.createErrorResponse)('Service parameter is required', 400);
        }
        logger_1.logger.info('Processing service health request', {
            service,
            method: event.httpMethod,
            requestId: context.awsRequestId
        });
        let healthData;
        switch (service.toLowerCase()) {
            case 'database':
                healthData = await monitoring_dashboard_service_1.monitoringDashboardService.getDatabaseHealth();
                break;
            case 'redis':
                healthData = await monitoring_dashboard_service_1.monitoringDashboardService.getCacheHealth();
                break;
            case 'payment':
                healthData = await monitoring_dashboard_service_1.monitoringDashboardService.getPaymentServiceHealth();
                break;
            case 'rfid':
                healthData = await monitoring_dashboard_service_1.monitoringDashboardService.getRfidServiceHealth();
                break;
            default:
                return (0, response_utils_1.createErrorResponse)(`Unknown service: ${service}`, 400);
        }
        const duration = Date.now() - startTime;
        logger_1.logger.info('Service health retrieved successfully', { service, duration, requestId: context.awsRequestId });
        return (0, response_utils_1.createSuccessResponse)({
            message: `Health status for ${service} retrieved successfully`,
            data: healthData,
            service,
            requestId: context.awsRequestId,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, `Failed to retrieve health status for service: ${event.pathParameters?.service || 'unknown'}`);
    }
};
exports.serviceHealthHandler = serviceHealthHandler;
