/**
 * Basic Health Check Lambda Function
 * Returns simple health status for load balancers and monitoring
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { LoggerService } from '../../services/logger.service';

// Initialize services
const logger = LoggerService.getInstance();

// Common Lambda response helper
const createResponse = (statusCode: number, body: any, headers: Record<string, string> = {}): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    ...headers
  },
  body: JSON.stringify(body)
});

/**
 * Basic Health Check Lambda Function Handler
 * Returns simple health status for load balancers and monitoring
 */
export const healthBasicHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  try {
    const duration = Date.now() - startTime;
    
    logger.debug('Basic health check completed', { 
      duration,
      requestId: context.awsRequestId 
    });

    return createResponse(200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'hasivu-platform',
      version: '1.0.0',
      duration: `${duration}ms`
    });

  } catch (error) {
    logger.error('Health check failed', error, { requestId: context.awsRequestId });
    
    return createResponse(503, {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'hasivu-platform',
      error: 'Service unavailable'
    });
  }
};