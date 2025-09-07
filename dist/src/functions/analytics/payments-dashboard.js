"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentAnalyticsDashboardHandler = void 0;
const payment_analytics_service_1 = require("@/services/payment-analytics.service");
const logger_1 = require("@/utils/logger");
const response_utils_1 = require("@/shared/response.utils");
const paymentAnalyticsDashboardHandler = async (event, context) => {
    try {
        logger_1.logger.info('Payment analytics dashboard request received', {
            requestId: context.awsRequestId,
            headers: event.headers,
            queryStringParameters: event.queryStringParameters
        });
        const queryParams = event.queryStringParameters || {};
        const period = queryParams.period || 'monthly';
        const schoolId = queryParams.schoolId;
        const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
        if (!validPeriods.includes(period)) {
            return (0, response_utils_1.createErrorResponse)(`Invalid period. Valid periods: ${validPeriods.join(', ')}`, 400, 'INVALID_PERIOD');
        }
        const paymentAnalyticsService = new payment_analytics_service_1.PaymentAnalyticsService();
        const dashboardData = await paymentAnalyticsService.getDashboardData(period, schoolId);
        logger_1.logger.info('Payment analytics dashboard data retrieved successfully', {
            requestId: context.awsRequestId,
            period,
            schoolId: schoolId || 'all',
            metricsCount: Object.keys(dashboardData.trends).length
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                ...dashboardData,
                metadata: {
                    period,
                    schoolId: schoolId || 'all',
                    generatedAt: new Date().toISOString(),
                    requestId: context.awsRequestId
                }
            },
            message: 'Payment analytics dashboard data retrieved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error in payment analytics dashboard handler', error, {
            requestId: context.awsRequestId,
            event: JSON.stringify(event)
        });
        return (0, response_utils_1.handleError)(error);
    }
};
exports.paymentAnalyticsDashboardHandler = paymentAnalyticsDashboardHandler;
exports.default = exports.paymentAnalyticsDashboardHandler;
//# sourceMappingURL=payments-dashboard.js.map