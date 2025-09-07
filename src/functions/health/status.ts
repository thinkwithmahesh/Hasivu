/**
 * HASIVU Platform - System Status Endpoint
 * Quick system status overview for monitoring and health checks
 * Implements: GET /api/v1/health/status
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../shared/logger.service';
import { createSuccessResponse, createErrorResponse, handleError } from '../shared/response.utils';

// Initialize database client
const prisma = new PrismaClient();

// System status interface
interface SystemStatus {
  status: 'operational' | 'degraded' | 'down';
  timestamp: string;
  uptime: string;
  services: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime: string;
    };
    api: {
      status: 'healthy' | 'unhealthy';
      responseTime: string;
    };
  };
  version?: string;
  environment?: string;
}

/**
 * Check database connectivity
 */
async function checkDatabaseStatus(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime: string }> {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: 'timeout'
    };
  }
}

/**
 * Determine overall system status
 */
function determineOverallStatus(services: SystemStatus['services']): 'operational' | 'degraded' | 'down' {
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
export const getStatusHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const logger = LoggerService.getInstance();
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
      status: 'healthy' as const,
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
    const systemStatus: SystemStatus = {
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
    
  } catch (error: any) {
    logger.error('System status check failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    return handleError(error, 'Failed to get system status');
  } finally {
    await prisma.$disconnect();
  }
};