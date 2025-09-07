/**
 * HASIVU Platform - Liveness Health Check Lambda Function
 * Implements: GET /api/v1/health/live
 * Migration from Express route to AWS Lambda - checks if service is alive and responsive
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { LoggerService } from '../shared/logger.service';
import { createSuccessResponse, createErrorResponse, handleError } from '../shared/response.utils';

// Common Lambda response helper
const createResponse = (statusCode: number, body: any, headers: Record<string, string> = {}): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    ...headers
  },
  body: JSON.stringify(body)
});

/**
 * Perform basic liveness checks
 */
const checkLiveness = (context: Context): {
  alive: boolean;
  checks: Record<string, any>;
  issues: string[];
} => {
  const checks: any = {};
  const issues: string[] = [];
  
  try {
    // Check Lambda execution context
    const remainingTime = context.getRemainingTimeInMillis();
    
    checks.lambda = {
      status: remainingTime > 1000 ? 'alive' : 'warning',
      remainingTime: `${remainingTime}ms`,
      requestId: context.awsRequestId,
      functionName: context.functionName,
      functionVersion: context.functionVersion,
      message: remainingTime > 1000 
        ? 'Lambda execution context is healthy'
        : 'Lambda execution time is running low'
    };
    
    if (remainingTime <= 1000) {
      issues.push('Lambda execution time running low');
    }
    
    // Check process uptime
    const uptime = process.uptime();
    const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;
    
    checks.process = {
      status: 'alive',
      uptime: uptimeFormatted,
      uptimeSeconds: Math.floor(uptime),
      pid: process.pid,
      nodeVersion: process.version,
      message: `Process has been running for ${Math.floor(uptime)} seconds`
    };
    
    // Check memory usage for basic responsiveness
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    checks.memory = {
      status: 'alive',
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      message: 'Memory allocation is functioning normally'
    };
    
    // Basic CPU/event loop responsiveness
    const startTime = Date.now();
    // Synchronous operation to test basic responsiveness
    let counter = 0;
    for (let i = 0; i < 100000; i++) {
      counter += i;
    }
    const cpuTestDuration = Date.now() - startTime;
    
    checks.responsiveness = {
      status: cpuTestDuration < 100 ? 'alive' : 'slow',
      testDuration: `${cpuTestDuration}ms`,
      testResult: counter,
      message: cpuTestDuration < 100 
        ? 'CPU and event loop are responsive'
        : 'CPU or event loop may be under stress'
    };
    
    if (cpuTestDuration >= 100) {
      issues.push('CPU responsiveness is slower than expected');
    }
    
  } catch (error) {
    checks.error = {
      status: 'error',
      message: `Liveness check encountered an error: ${(error as Error).message}`
    };
    issues.push('Error during liveness check');
  }
  
  const alive = issues.length === 0;
  
  return { alive, checks, issues };
};

/**
 * Liveness Health Check Handler
 * GET /api/v1/health/live
 */
export const livenessCheckHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const logger = LoggerService.getInstance();
  const requestId = context.awsRequestId;
  const startTime = Date.now();
  
  try {
    logger.info('Liveness check started', { requestId });
    
    const livenessResult = checkLiveness(context);
    const duration = Date.now() - startTime;
    
    const response = {
      alive: livenessResult.alive,
      timestamp: new Date().toISOString(),
      checks: livenessResult.checks,
      issues: livenessResult.issues,
      duration: `${duration}ms`
    };
    
    logger.info('Liveness check completed', {
      requestId,
      alive: livenessResult.alive,
      issueCount: livenessResult.issues.length,
      duration: `${duration}ms`
    });
    
    // Always return 200 for liveness - if we can respond, we're alive
    return createResponse(200, {
      success: true,
      data: response,
      message: livenessResult.alive 
        ? 'Service is alive and responsive'
        : `Service is alive but has issues: ${livenessResult.issues.join(', ')}`
    });
    
  } catch (error: any) {
    logger.error('Liveness check failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    // For liveness, if we can still respond with an error, we're technically alive
    return createResponse(200, {
      success: false,
      data: {
        alive: false,
        timestamp: new Date().toISOString(),
        error: error.message
      },
      message: 'Liveness check failed but service is responding'
    });
  }
};