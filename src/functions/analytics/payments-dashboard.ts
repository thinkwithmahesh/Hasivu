/**
 * HASIVU Platform - Payment Analytics Dashboard Lambda Function
 * Serves the payment analytics dashboard with real-time insights and trends
 * Implements: GET /analytics/payments/dashboard
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PaymentAnalyticsService } from '@/services/payment-analytics.service';
import { logger } from '@/utils/logger';
import { createSuccessResponse, createErrorResponse, handleError } from '@/shared/response.utils';
import { config } from '@/config/environment';

/**
 * Payment analytics dashboard Lambda function handler
 * GET /analytics/payments/dashboard
 */
export const paymentAnalyticsDashboardHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Payment analytics dashboard request received', {
      requestId: context.awsRequestId,
      headers: event.headers,
      queryStringParameters: event.queryStringParameters
    });

    // Extract query parameters
    const queryParams = event.queryStringParameters || {};
    const period = (queryParams.period as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') || 'monthly';
    const schoolId = queryParams.schoolId;

    // Validate period parameter
    const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    if (!validPeriods.includes(period)) {
      return createErrorResponse(
        `Invalid period. Valid periods: ${validPeriods.join(', ')}`,
        400,
        'INVALID_PERIOD'
      );
    }

    // Initialize payment analytics service
    const paymentAnalyticsService = new PaymentAnalyticsService();

    // Get dashboard data
    const dashboardData = await paymentAnalyticsService.getDashboardData(period, schoolId);

    logger.info('Payment analytics dashboard data retrieved successfully', {
      requestId: context.awsRequestId,
      period,
      schoolId: schoolId || 'all',
      metricsCount: Object.keys(dashboardData.trends).length
    });

    return createSuccessResponse({
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

  } catch (error) {
    logger.error('Error in payment analytics dashboard handler', error, {
      requestId: context.awsRequestId,
      event: JSON.stringify(event)
    });

    return handleError(error);
  }
};

export default paymentAnalyticsDashboardHandler;