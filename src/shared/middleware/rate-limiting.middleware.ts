/**
 * Rate Limiting Middleware
 * Implements rate limiting for API endpoints to prevent abuse
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../../utils/logger';
import { redisService } from '../../services/redis.service';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (event: APIGatewayProxyEvent) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * Rate limiting middleware
 */
export const rateLimitingMiddleware = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return {
    before: async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult | null> => {
      try {
        const key = keyGenerator(event);
        const now = Date.now();
        const windowStart = Math.floor(now / windowMs) * windowMs;

        // Get current request count for this window
        const windowKey = `${key}:${windowStart}`;
        const currentCount = parseInt((await redisService.get(windowKey)) || '0');

        if (currentCount >= maxRequests) {
          logger.warn('Rate limit exceeded', {
            key,
            currentCount,
            maxRequests,
            windowMs,
            path: event.path,
            method: event.httpMethod,
          });

          return {
            statusCode: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil(windowMs / 1000).toString(),
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': (windowStart + windowMs).toString(),
            },
            body: JSON.stringify({
              error: 'Too many requests',
              message: 'Rate limit exceeded. Please try again later.',
              retryAfter: Math.ceil(windowMs / 1000),
            }),
          };
        }

        // Increment counter
        await redisService.set(
          windowKey,
          (currentCount + 1).toString(),
          Math.ceil(windowMs / 1000)
        );

        // Add rate limit headers to the event for response middleware
        (event as any).rateLimitInfo = {
          limit: maxRequests,
          remaining: maxRequests - currentCount - 1,
          reset: windowStart + windowMs,
        };

        return null; // Continue to handler
      } catch (error) {
        logger.error('Rate limiting middleware error', error as Error, {
          path: event.path,
          method: event.httpMethod,
        });
        // Don't block requests if rate limiting fails
        return null;
      }
    },

    after: async (
      event: APIGatewayProxyEvent,
      result: APIGatewayProxyResult
    ): Promise<APIGatewayProxyResult> => {
      // Add rate limit headers to response
      const { rateLimitInfo } = event as any;
      if (rateLimitInfo) {
        const headers = {
          ...result.headers,
          'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
          'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
          'X-RateLimit-Reset': rateLimitInfo.reset.toString(),
        };

        return {
          ...result,
          headers,
        };
      }

      return result;
    },
  };
};

/**
 * Default key generator based on IP address and endpoint
 */
function defaultKeyGenerator(event: APIGatewayProxyEvent): string {
  const sourceIp = event.requestContext?.identity?.sourceIp || 'unknown';
  const path = event.path || 'unknown';
  const method = event.httpMethod || 'unknown';

  return `ratelimit:${sourceIp}:${method}:${path}`;
}

/**
 * User-based key generator
 */
export const userKeyGenerator = (event: APIGatewayProxyEvent): string => {
  const userId =
    event.requestContext?.authorizer?.userId ||
    event.headers?.['x-user-id'] ||
    event.requestContext?.identity?.sourceIp ||
    'anonymous';

  const path = event.path || 'unknown';
  const method = event.httpMethod || 'unknown';

  return `ratelimit:user:${userId}:${method}:${path}`;
};

/**
 * IP-based key generator
 */
export const ipKeyGenerator = (event: APIGatewayProxyEvent): string => {
  const sourceIp = event.requestContext?.identity?.sourceIp || 'unknown';
  const path = event.path || 'unknown';
  const method = event.httpMethod || 'unknown';

  return `ratelimit:ip:${sourceIp}:${method}:${path}`;
};

/**
 * Global rate limiter for payment endpoints
 */
export const paymentRateLimiter = rateLimitingMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  keyGenerator: userKeyGenerator,
});

/**
 * Strict rate limiter for payment creation
 */
export const paymentCreationRateLimiter = rateLimitingMiddleware({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 3, // 3 payment creations per 5 minutes
  keyGenerator: userKeyGenerator,
});

/**
 * Webhook rate limiter (more lenient for Razorpay)
 */
export const webhookRateLimiter = rateLimitingMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 webhook calls per minute
  keyGenerator: ipKeyGenerator,
});

/**
 * Get rate limit status for a key
 */
export const getRateLimitStatus = async (
  key: string,
  windowMs: number
): Promise<{
  current: number;
  limit: number;
  remaining: number;
  reset: number;
} | null> => {
  try {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const windowKey = `${key}:${windowStart}`;

    const current = parseInt((await redisService.get(windowKey)) || '0');
    const reset = windowStart + windowMs;

    return {
      current,
      limit: 0, // Would need to be passed in or stored
      remaining: 0, // Would need to be calculated based on limit
      reset,
    };
  } catch (error) {
    logger.error('Failed to get rate limit status', error as Error, { key });
    return null;
  }
};
