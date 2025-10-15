// Metrics Middleware - Automatic API Performance Tracking
// Infrastructure Reliability Expert - Performance Monitoring

import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics.service';

interface MetricsRequest extends Request {
  startTime?: number;
  metricsContext?: {
    endpoint: string;
    method: string;
    userId?: string;
  };
}

/**
 * Middleware to track API request metrics
 * Automatically captures response times, status codes, and error rates
 */
export const metricsMiddleware = (req: MetricsRequest, res: Response, next: NextFunction): void => {
  // Record request start time
  req.startTime = Date.now();

  // Capture endpoint and method
  req.metricsContext = {
    endpoint: req.path || req.url,
    method: req.method,
    userId: (req as any).user?.id, // Capture user ID if authenticated
  };

  // Listen for response finish event
  res.on('finish', async () => {
    try {
      const duration = Date.now() - (req.startTime || Date.now());
      const { statusCode } = res;
      const endpoint = req.metricsContext?.endpoint || 'unknown';
      const method = req.metricsContext?.method || 'unknown';

      // Track API performance
      await metricsService.trackApiRequest({
        endpoint,
        method,
        statusCode,
        duration,
        userId: req.metricsContext?.userId,
      });

      // Log slow requests
      if (duration > 1000) {
        console.warn(`Slow API request detected: ${method} ${endpoint} - ${duration}ms`);
      }

      // Log errors
      if (statusCode >= 500) {
        await metricsService.trackError(
          'ApiServerError',
          `API server error: ${method} ${endpoint}`,
          {
            statusCode,
            duration,
            endpoint,
            method,
          }
        );
      } else if (statusCode >= 400) {
        await metricsService.trackError(
          'ApiClientError',
          `API client error: ${method} ${endpoint}`,
          {
            statusCode,
            duration,
            endpoint,
            method,
          }
        );
      }
    } catch (error) {
      console.error('Error in metrics middleware:', error);
    }
  });

  next();
};

/**
 * Middleware to track user activity
 */
export const userActivityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.on('finish', async () => {
    try {
      const { user } = req as any;

      if (!user) {
        return;
      }

      // Determine activity type based on endpoint
      let action:
        | 'login'
        | 'logout'
        | 'order_created'
        | 'payment_completed'
        | 'rfid_verified'
        | undefined;

      if (req.path.includes('/auth/login')) {
        action = 'login';
      } else if (req.path.includes('/auth/logout')) {
        action = 'logout';
      } else if (req.path.includes('/orders') && req.method === 'POST') {
        action = 'order_created';
      } else if (req.path.includes('/payments/verify')) {
        action = 'payment_completed';
      } else if (req.path.includes('/rfid/verify')) {
        action = 'rfid_verified';
      }

      if (action) {
        await metricsService.trackUserActivity({
          userId: user.id,
          action,
          deviceType: req.get('User-Agent'),
        });
      }
    } catch (error) {
      console.error('Error in user activity middleware:', error);
    }
  });

  next();
};

/**
 * Middleware to track security events
 */
export const securityMetricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.on('finish', async () => {
    try {
      const { statusCode } = res;
      const { user } = req as any;

      // Track failed login attempts
      if (req.path.includes('/auth/login') && statusCode === 401) {
        await metricsService.trackSecurityEvent('failed_login', user?.id, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
        });
      }

      // Track unauthorized access attempts
      if (statusCode === 403) {
        await metricsService.trackSecurityEvent('unauthorized_access', user?.id, {
          ip: req.ip,
          endpoint: req.path,
          method: req.method,
        });
      }
    } catch (error) {
      console.error('Error in security metrics middleware:', error);
    }
  });

  next();
};

/**
 * Middleware to track database query metrics
 * Should be used at the database layer, not HTTP layer
 */
export const createDatabaseMetricsWrapper = <T>(
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  queryFn: () => Promise<T>
) => {
  return async (): Promise<T> => {
    const startTime = Date.now();
    let success = true;
    let result: T;

    try {
      result = await queryFn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;

      try {
        await metricsService.trackDatabasePerformance(queryType, duration, success);
      } catch (metricsError) {
        console.error('Error tracking database metrics:', metricsError);
      }
    }
  };
};

/**
 * Middleware to track cache operations
 */
export const createCacheMetricsWrapper = <T>(
  operation: 'hit' | 'miss' | 'set' | 'delete',
  cacheFn: () => Promise<T>
) => {
  return async (): Promise<T> => {
    const startTime = Date.now();

    try {
      const result = await cacheFn();
      return result;
    } finally {
      const duration = Date.now() - startTime;

      try {
        await metricsService.trackCacheOperation(operation, duration);
      } catch (metricsError) {
        console.error('Error tracking cache metrics:', metricsError);
      }
    }
  };
};

/**
 * Express error handler middleware with metrics tracking
 */
export const errorMetricsMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Track error
  metricsService.trackError(error.name || 'UnknownError', error.message, {
    stack: error.stack,
    endpoint: req.path,
    method: req.method,
    userId: (req as any).user?.id,
  });

  // Pass to next error handler
  next(error);
};

/**
 * Health check middleware with system health tracking
 */
export const healthCheckMetricsMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // This would typically check actual system health
    // For now, we'll create a basic health check structure
    const healthMetrics = {
      timestamp: Date.now(),
      components: {
        api: { healthy: true, responseTime: 50 },
        database: { healthy: true, connectionPool: 75 },
        cache: { healthy: true, hitRate: 85 },
        payment: { healthy: true, successRate: 98 },
      },
      overallScore: 95,
    };

    await metricsService.trackSystemHealth(healthMetrics);

    next();
  } catch (error) {
    console.error('Error in health check metrics middleware:', error);
    next(error);
  }
};
