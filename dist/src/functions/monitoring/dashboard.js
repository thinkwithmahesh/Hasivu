"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceHealthHandler = exports.monitoringDashboardHandler = void 0;
const monitoring_dashboard_service_1 = require("../../services/monitoring-dashboard.service");
const logger_1 = require("../../utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const monitoringDashboardHandler = async (event, context) => {
    const startTime = Date.now();
    try {
        logger_1.logger.info('Processing monitoring dashboard request', {
            method: event.httpMethod,
            path: event.path,
            requestId: context.awsRequestId,
        });
        const dashboardData = await monitoring_dashboard_service_1.monitoringDashboardService.getDashboardData();
        const duration = Date.now() - startTime;
        logger_1.logger.info('Dashboard data retrieved successfully', {
            duration,
            requestId: context.awsRequestId,
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Monitoring dashboard data retrieved successfully',
            data: dashboardData,
            requestId: context.awsRequestId,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to retrieve monitoring dashboard data', undefined, {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return (0, response_utils_1.handleError)(error);
    }
};
exports.monitoringDashboardHandler = monitoringDashboardHandler;
const serviceHealthHandler = async (event, context) => {
    const startTime = Date.now();
    try {
        const service = event.pathParameters?.service;
        if (!service) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Service parameter is required', 400);
        }
        logger_1.logger.info('Processing service health request', {
            service,
            method: event.httpMethod,
            requestId: context.awsRequestId,
        });
        let healthData;
        healthData = await monitoring_dashboard_service_1.monitoringDashboardService.getServiceStatus(service.toLowerCase());
        if (!healthData) {
            return (0, response_utils_1.createErrorResponse)('UNKNOWN_SERVICE', `Unknown service: ${service}`, 400);
        }
        const duration = Date.now() - startTime;
        logger_1.logger.info('Service health retrieved successfully', {
            service,
            duration,
            requestId: context.awsRequestId,
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: `Health status for ${service} retrieved successfully`,
            data: healthData,
            service,
            requestId: context.awsRequestId,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        const serviceName = event.pathParameters?.service || 'unknown';
        logger_1.logger.error(`Failed to retrieve health status for service: ${serviceName}`, error);
        return (0, response_utils_1.handleError)(error);
    }
};
exports.serviceHealthHandler = serviceHealthHandler;
//# sourceMappingURL=dashboard.js.map