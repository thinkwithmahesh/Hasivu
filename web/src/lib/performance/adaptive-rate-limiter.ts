 * HASIVU Platform - Adaptive Rate Limiting Service
 * Intelligent rate limiting based on user behavior, system load, and threat detection
 * Implements sliding window algorithm with Redis for distributed rate limiting;
import { RedisService } from '../services/redis.service';
import { logger } from '../utils/logger';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
  private systemLoadCache: { value: number; timestamp: number } | _null =  null;
  // User tier definitions
  private readonly userTiers: Record<string, UserTier> = {}
    free: { name: 'free', multiplier: 1, burstAllowance: 1.2, priority: 1 },
    premium: { name: 'premium', multiplier: 3, burstAllowance: 1.5, priority: 2 },
    admin: { name: 'admin', multiplier: 10, burstAllowance: 2.0, priority: 3 },
    super_admin: { name: 'super_admin', multiplier: 50, burstAllowance: 3.0, priority: 4 }
  // Endpoint-specific base limits (requests per 15 minutes)
  private readonly endpointLimits: Record<string, number> = {}
   * Check rate limit for a request;
  async checkRateLimit(
    event: APIGatewayProxyEvent,
    options: RateLimitOptions,
    userTier: _string =  'free',
    userId?: string
  ): Promise<RateLimitResult> {}
      // Use sliding window algorithm
      const result 
      return result;
      // Fail open - allow request on rate limiter error
      return {}
   * Sliding window rate limiting implementation;
  private async slidingWindowRateLimit(
    key: string,
    limit: number,
    windowMs: number,
    skipSuccessful?: boolean,
    skipFailed?: boolean
  ): Promise<RateLimitResult> {}
    const requestId = `${now}-${Math.random()}``
      return `rl:${options.keyGenerator(event)}``
      return `rl:user:${userId}:${method}:${endpoint}``
    return `rl:ip:${ip}:${method}:${endpoint}``
    const key = `rapid:${clientIP}``
    const patternKey = `pattern:${clientIP}``
      await this.redis.sadd(patternKey, `${method}:${path}``