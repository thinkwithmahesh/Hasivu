/**
 * HASIVU Platform - System Monitoring Dashboard Lambda Function
 * Real-time system monitoring with health checks and performance metrics
 * Implements: GET /monitoring/dashboard
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { monitoringDashboardService } from '@/services/monitoring-dashboard.service';
import { logger } from '@/utils/logger';
import { createSuccessResponse, createErrorResponse, handleError } from '@/shared/response.utils';
import { config } from '@/config/environment';
/**
 * System monitoring dashboard Lambda function handler
 * GET /monitoring/dashboard
 */
export const monitoringDashboardHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  try {
    logger.info('Processing monitoring dashboard request', {
      method: event.httpMethod,
      path: event.path,
      requestId: context.awsRequestId
    });

    // Get dashboard data from service
    const dashboardData = await monitoringDashboardService.getDashboardData();
    
    const duration = Date.now() - startTime;
    logger.info('Dashboard data retrieved successfully', { duration, requestId: context.awsRequestId });
    
    return createSuccessResponse({
      message: 'Monitoring dashboard data retrieved successfully',
      data: dashboardData,
      requestId: context.awsRequestId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return handleError(error, 'Failed to retrieve monitoring dashboard data');
  }
};

/**
 * Get specific service health
 * GET /monitoring/health/:service
 */
export const serviceHealthHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  try {
    const service = event.pathParameters?.service;
    
    if (!service) {
      return createErrorResponse('Service parameter is required', 400);
    }

    logger.info('Processing service health request', {
      service,
      method: event.httpMethod,
      requestId: context.awsRequestId
    });

    let healthData: any;
    
    switch (service.toLowerCase()) {
      case 'database':
        healthData = await monitoringDashboardService.getDatabaseHealth();
        break;
      case 'redis':
        healthData = await monitoringDashboardService.getCacheHealth();
        break;
      case 'payment':
        healthData = await monitoringDashboardService.getPaymentServiceHealth();
        break;
      case 'rfid':
        healthData = await monitoringDashboardService.getRfidServiceHealth();
        break;
      default:
        return createErrorResponse(`Unknown service: ${service}`, 400);
    }

    const duration = Date.now() - startTime;
    logger.info('Service health retrieved successfully', { service, duration, requestId: context.awsRequestId });

    return createSuccessResponse({
      message: `Health status for ${service} retrieved successfully`,
      data: healthData,
      service,
      requestId: context.awsRequestId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return handleError(error, `Failed to retrieve health status for service: ${event.pathParameters?.service || 'unknown'}`);
  }
};