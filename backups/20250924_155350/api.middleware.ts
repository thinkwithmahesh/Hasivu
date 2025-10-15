/**
 * HASIVU Platform - Enterprise API Middleware Suite
 *
 * Comprehensive middleware collection for 10/10 production readiness:
 * - Request validation and sanitization
 * - Performance monitoring
 * - Security enforcement
 * - Error handling
 * - Rate limiting integration
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import helmet from 'helmet';
import compression from 'compression';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { API_CONFIG } from '../config/api.config';
import redis from '../services/redis.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Types for middleware
export interface APIRequest extends Request {
  user?: {
    id: string;
    role: string;
    permissions?: string[];
    sessionId?: string;
    schoolId?: string;
  };
  apiVersion?: string;
  requestId?: string;
  startTime?: number;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

export interface APIResponse extends Response {
  locals: {
    requestId?: string;
    userId?: string;
    userRole?: string;
    processingTime?: number;
  };
}

/**
 * Request ID Generator - Unique identifier for request tracking
 */
export const requestIdMiddleware = (
  req: APIRequest,
  res: APIResponse,
  next: NextFunction
): void => {
  const requestId =
    (req.headers['x-request-id'] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
};

/**
 * API Version Handler - Manages API versioning strategy
 */
export const apiVersionMiddleware = (
  req: APIRequest,
  res: APIResponse,
  next: NextFunction
): void => {
  const version =
    (req.headers['x-api-version'] as string) ||
    (req.query.v as string) ||
    API_CONFIG.versioning.defaultVersion;

  // Validate version
  if (!API_CONFIG.versioning.supportedVersions.includes(version as 'v1' | 'v2')) {
    throw new AppError(
      `Unsupported API version: ${version}. Supported versions: ${API_CONFIG.versioning.supportedVersions.join(', ')}`,
      400
    );
  }

  req.apiVersion = version;
  res.setHeader('X-API-Version', version);

  // Add deprecation warning if applicable
  const deprecationInfo = API_CONFIG.versioning.backwardCompatibility[version];
  if (deprecationInfo && API_CONFIG.versioning.deprecationWarnings) {
    res.setHeader(
      'Warning',
      `299 - "API version ${version} is deprecated and will be sunset on ${deprecationInfo.sunset}. Please migrate to: ${deprecationInfo.alternatives.join(', ')}"`
    );
  }

  next();
};

/**
 * Performance Monitoring - Request timing and metrics
 */
export const performanceMiddleware = (
  req: APIRequest,
  res: APIResponse,
  next: NextFunction
): void => {
  req.startTime = Date.now();

  const originalSend = res.send;
  res.send = function (data: unknown) {
    const processingTime = Date.now() - (req.startTime || Date.now());
    res.locals.processingTime = processingTime;

    res.setHeader('X-Response-Time', `${processingTime}ms`);

    // Log slow requests
    const endpoint = req.route?.path || req.path;
    const method = req.method;
    const target = API_CONFIG.performance.responseTimeTargets.simple;

    if (processingTime > target) {
      logger.warn('Slow request detected', {
        requestId: req.requestId,
        method,
        endpoint,
        processingTime,
        target,
        userId: req.user?.id,
        userAgent: req.get('User-Agent'),
      });
    }

    // Record metrics
    recordAPIMetrics(method, endpoint, processingTime, res.statusCode);

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Security Headers - Helmet integration with custom configuration
 */
export const securityHeadersMiddleware = helmet({
  contentSecurityPolicy: {
    directives: API_CONFIG.security.csp.directives,
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for iframes
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * Compression Middleware - Optimized response compression
 */
export const compressionMiddleware = compression({
  threshold: 1024, // Only compress responses > 1KB
  level: 6, // Balanced compression level
  filter: (req: Request, res: Response) => {
    // Don't compress if the response is already compressed
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use compression filter for everything else
    return compression.filter(req, res);
  },
});

/**
 * Input Sanitization - XSS prevention and data cleaning
 */
export const sanitizationMiddleware = (
  req: APIRequest,
  res: APIResponse,
  next: NextFunction
): void => {
  const sanitizeObject = (obj: unknown): unknown => {
    if (typeof obj === 'string') {
      // Sanitize HTML and trim whitespace
      return API_CONFIG.security.validation.sanitization.stripTags
        ? purify.sanitize(obj.trim(), { ALLOWED_TAGS: [] })
        : obj.trim();
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = sanitizeObject((obj as Record<string, unknown>)[key]);
        }
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * Validation Middleware Factory - Zod schema validation
 */
export const validateRequest = (schemas: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) => {
  return (req: APIRequest, res: APIResponse, next: NextFunction): void => {
    try {
      // Validate request body
      if (schemas.body && req.body) {
        req.body = schemas.body.parse(req.body);
      }

      // Validate query parameters
      if (schemas.query && req.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }

      // Validate path parameters
      if (schemas.params && req.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Request validation failed', {
          requestId: req.requestId,
          errors: validationErrors,
          method: req.method,
          path: req.path,
        });

        throw new AppError('Request validation failed', 400);
      }

      throw error;
    }
  };
};

/**
 * Rate Limiting Factory - Intelligent rate limiting based on user role
 */
export const createRateLimiter = (endpointConfig?: {
  requests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    windowMs: endpointConfig?.windowMs || API_CONFIG.rateLimiting.global.windowMs,
    max: (req: APIRequest) => {
      // Use endpoint-specific limit if provided
      if (endpointConfig) {
        return endpointConfig.requests;
      }

      // Use user role-based limiting
      const userRole = req.user?.role || 'anonymous';
      const roleLimits =
        API_CONFIG.rateLimiting.tiers[userRole] || API_CONFIG.rateLimiting.tiers.anonymous;

      return roleLimits.requests;
    },
    keyGenerator: (req: APIRequest) => {
      // Use user ID if authenticated, otherwise IP - provide fallback for undefined IP
      return req.user?.id || req.ip || req.connection?.remoteAddress || 'unknown';
    },
    skipSuccessfulRequests: endpointConfig?.skipSuccessfulRequests || false,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(API_CONFIG.rateLimiting.global.windowMs / 1000),
    },
    handler: (req: APIRequest, res: APIResponse) => {
      logger.warn('Rate limit exceeded', {
        requestId: req.requestId,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method,
      });

      res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(API_CONFIG.rateLimiting.global.windowMs / 1000),
        requestId: req.requestId,
      });
    },
  });
};

/**
 * Pagination Middleware - Standardized pagination handling
 */
export const paginationMiddleware = (
  req: APIRequest,
  res: APIResponse,
  next: NextFunction
): void => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    API_CONFIG.performance.queries.maxLimit,
    Math.max(1, parseInt(req.query.limit as string) || API_CONFIG.performance.queries.defaultLimit)
  );
  const offset = (page - 1) * limit;

  // Add pagination info to request
  req.pagination = {
    page,
    limit,
    offset,
  };

  // Helper function to send paginated response
  res.sendPaginated = (data: unknown[], total: number, metadata?: Record<string, unknown>) => {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.set('X-Total-Count', total.toString());
    res.set('X-Total-Pages', totalPages.toString());
    res.set('X-Current-Page', page.toString());
    res.set('X-Per-Page', limit.toString());

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
        nextPage: hasNext ? page + 1 : null,
        prevPage: hasPrev ? page - 1 : null,
      },
      metadata: metadata || {},
      requestId: req.requestId,
    });
  };

  next();
};

/**
 * Content Type Validation
 */
export const validateContentType = (allowedTypes: string[]) => {
  return (req: APIRequest, res: APIResponse, next: NextFunction): void => {
    const contentType = req.get('Content-Type');

    if (
      req.method !== 'GET' &&
      req.method !== 'DELETE' &&
      contentType &&
      !allowedTypes.some(type => contentType.includes(type))
    ) {
      throw new AppError(
        `Unsupported content type: ${contentType}. Allowed: ${allowedTypes.join(', ')}`,
        415
      );
    }

    next();
  };
};

/**
 * CORS Preflight Handler
 */
export const corsPreflightMiddleware = (
  req: APIRequest,
  res: APIResponse,
  next: NextFunction
): void => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.setHeader('Access-Control-Allow-Methods', API_CONFIG.security.cors.methods.join(', '));
    res.setHeader(
      'Access-Control-Allow-Headers',
      API_CONFIG.security.cors.allowedHeaders.join(', ')
    );
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.status(200).end();
    return;
  }

  next();
};

/**
 * API Metrics Recording
 */
const recordAPIMetrics = (
  method: string,
  endpoint: string,
  responseTime: number,
  statusCode: number
): void => {
  // Record to monitoring service
  const metrics = {
    timestamp: new Date().toISOString(),
    method,
    endpoint,
    responseTime,
    statusCode,
    success: statusCode < 400,
  };

  // Store in Redis with TTL for real-time monitoring
  redis.zadd(
    `api_metrics:${new Date().toISOString().split('T')[0]}`,
    Date.now(),
    JSON.stringify(metrics)
  );

  // Set expiry for 24 hours
  redis.expire(`api_metrics:${new Date().toISOString().split('T')[0]}`, 86400);
};

// Extend Express Request/Response interfaces using module augmentation
declare module 'express-serve-static-core' {
  interface Request {
    pagination?: {
      page: number;
      limit: number;
      offset: number;
    };
  }

  interface Response {
    sendPaginated?: (data: unknown[], total: number, metadata?: Record<string, unknown>) => void;
  }
}
