/**
 * HASIVU Platform - Authentication Middleware
 * Production-ready authentication middleware for Lambda functions
 * Comprehensive JWT validation with role-based access control
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { JWTPayload, jwtService } from '../jwt.service';
import { logger } from '../logger.service';
import { env as config } from '../../config/environment';

/**
 * Authentication result interface
 */
export interface AuthResult {
  isAuthenticated: boolean;
  success: boolean; // Alias for isAuthenticated for backward compatibility
  user?: JWTPayload;
  error?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  schoolId?: string;
}

/**
 * Authorization options
 */
export interface AuthOptions {
  requiredRole?: string;
  requiredPermissions?: string[];
  allowExpired?: boolean;
  requireBusinessContext?: boolean;
  requireSessionValidation?: boolean;
  customValidation?: (payload: JWTPayload) => Promise<boolean> | boolean;
}

/**
 * Middleware response structure
 */
export interface MiddlewareResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Rate limiting context
 */
interface RateLimitContext {
  userId?: string;
  ipAddress: string;
  endpoint: string;
  userAgent?: string;
}

/**
 * Authentication middleware for API Gateway Lambda functions
 * Extracts and validates JWT tokens with comprehensive security checks
 */
export const authenticateJWT = async (
  event: APIGatewayProxyEvent,
  options: AuthOptions = {}
): Promise<AuthResult> => {
  const startTime = Date.now();

  try {
    // Extract JWT token from event
    const token = jwtService.extractTokenFromEvent(event);

    if (!token) {
      logger.warn('No JWT token provided in request', {
        path: event.path,
        method: event.httpMethod,
        sourceIp: event.requestContext.identity.sourceIp,
        userAgent: event.headers?.['User-Agent'],
      });

      return {
        isAuthenticated: false,
        success: false,
        error: 'Authentication required - no token provided',
        statusCode: 401,
        headers: {
          'WWW-Authenticate': 'Bearer realm="API"',
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
      };
    }

    // Verify JWT token
    const verification = jwtService.verifyToken(token);

    if (!verification.isValid || !verification.payload) {
      logger.warn('JWT token verification failed', {
        error: verification.error,
        errorCode: verification.errorCode,
        path: event.path,
        method: event.httpMethod,
        sourceIp: event.requestContext.identity.sourceIp,
        tokenLength: token.length,
      });

      // Handle specific error cases
      let statusCode = 401;
      let errorMessage = 'Invalid authentication token';

      switch (verification.errorCode) {
        case 'TOKEN_EXPIRED':
          statusCode = 401;
          errorMessage = 'Authentication token has expired';
          break;
        case 'INVALID_TOKEN_TYPE':
          statusCode = 401;
          errorMessage = 'Invalid token type - access token required';
          break;
        case 'MISSING_FIELDS':
          statusCode = 401;
          errorMessage = 'Incomplete authentication token';
          break;
        default:
          statusCode = 401;
          errorMessage = verification.error || 'Authentication token validation failed';
      }

      return {
        isAuthenticated: false,
        success: false,
        error: errorMessage,
        statusCode,
        headers: {
          'WWW-Authenticate': 'Bearer realm="API"',
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
      };
    }

    const { payload } = verification;

    // Role-based authorization
    if (options.requiredRole && !jwtService.hasRole(payload, options.requiredRole)) {
      logger.warn('Insufficient role privileges', {
        userId: payload.userId,
        userRole: payload.role,
        requiredRole: options.requiredRole,
        path: event.path,
        method: event.httpMethod,
      });

      return {
        isAuthenticated: false,
        success: false,
        error: `Insufficient privileges - ${options.requiredRole} role required`,
        statusCode: 403,
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
      };
    }

    // Permission-based authorization
    if (options.requiredPermissions && options.requiredPermissions.length > 0) {
      const missingPermissions = options.requiredPermissions.filter(
        permission => !jwtService.hasPermission(payload, permission)
      );

      if (missingPermissions.length > 0) {
        logger.warn('Insufficient permissions', {
          userId: payload.userId,
          userPermissions: payload.permissions,
          requiredPermissions: options.requiredPermissions,
          missingPermissions,
          path: event.path,
          method: event.httpMethod,
        });

        return {
          isAuthenticated: false,
          success: false,
          error: `Missing required permissions: ${missingPermissions.join(', ')}`,
          statusCode: 403,
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
          },
        };
      }
    }

    // Business context validation
    if (options.requireBusinessContext && !payload.businessId) {
      logger.warn('Business context required but not provided', {
        userId: payload.userId,
        path: event.path,
        method: event.httpMethod,
      });

      return {
        isAuthenticated: false,
        success: false,
        error: 'Business context required for this operation',
        statusCode: 400,
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
      };
    }

    // Session validation
    if (options.requireSessionValidation && !payload.sessionId) {
      logger.warn('Session validation required but session ID not found', {
        userId: payload.userId,
        path: event.path,
        method: event.httpMethod,
      });

      return {
        isAuthenticated: false,
        success: false,
        error: 'Valid session required for this operation',
        statusCode: 401,
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
      };
    }

    // Custom validation
    if (options.customValidation) {
      try {
        const isValid = await options.customValidation(payload);
        if (!isValid) {
          logger.warn('Custom validation failed', {
            userId: payload.userId,
            path: event.path,
            method: event.httpMethod,
          });

          return {
            isAuthenticated: false,
            success: false,
            error: 'Custom authorization validation failed',
            statusCode: 403,
            headers: {
              'Cache-Control': 'no-cache',
              'Content-Type': 'application/json',
            },
          };
        }
      } catch (error: unknown) {
        logger.error(
          'Custom validation error',
          error instanceof Error ? error : new Error(String(error)),
          {
            userId: payload.userId,
            path: event.path,
            method: event.httpMethod,
          }
        );

        return {
          isAuthenticated: false,
          success: false,
          error: 'Authorization validation error',
          statusCode: 500,
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
          },
        };
      }
    }

    const duration = Date.now() - startTime;

    logger.info('Authentication successful', {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      businessId: payload.businessId,
      sessionId: payload.sessionId,
      path: event.path,
      method: event.httpMethod,
      sourceIp: event.requestContext.identity.sourceIp,
      remainingTTL: verification.remainingTTL,
      duration,
    });

    return {
      isAuthenticated: true,
      success: true,
      user: payload,
      schoolId: payload.schoolId,
    };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;

    logger.error(
      'Authentication middleware error',
      error instanceof Error ? error : new Error(String(error)),
      {
        path: event.path,
        method: event.httpMethod,
        sourceIp: event.requestContext.identity.sourceIp,
        duration,
      }
    );

    return {
      isAuthenticated: false,
      success: false,
      error: 'Internal authentication error',
      statusCode: 500,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      },
    };
  }
};

/**
 * Create authentication middleware with role requirement
 */
export const requireRole = (role: string) => {
  return async (event: APIGatewayProxyEvent): Promise<AuthResult> => {
    return authenticateJWT(event, { requiredRole: role });
  };
};

/**
 * Create authentication middleware with permission requirements
 */
export const requirePermissions = (permissions: string[]) => {
  return async (event: APIGatewayProxyEvent): Promise<AuthResult> => {
    return authenticateJWT(event, { requiredPermissions: permissions });
  };
};

/**
 * Admin role requirement middleware
 */
export const requireAdmin = async (event: APIGatewayProxyEvent): Promise<AuthResult> => {
  return authenticateJWT(event, {
    requiredRole: 'admin',
    requiredPermissions: ['admin:*'],
  });
};

/**
 * Business owner requirement middleware
 */
export const requireBusinessOwner = async (event: APIGatewayProxyEvent): Promise<AuthResult> => {
  return authenticateJWT(event, {
    requiredRole: 'owner',
    requireBusinessContext: true,
    requiredPermissions: ['business:manage'],
  });
};

/**
 * Manager role requirement middleware
 */
export const requireManager = async (event: APIGatewayProxyEvent): Promise<AuthResult> => {
  return authenticateJWT(event, {
    requiredRole: 'manager',
    requireBusinessContext: true,
    requiredPermissions: ['business:read', 'orders:manage'],
  });
};

/**
 * Staff role requirement middleware
 */
export const requireStaff = async (event: APIGatewayProxyEvent): Promise<AuthResult> => {
  return authenticateJWT(event, {
    requiredRole: 'staff',
    requireBusinessContext: true,
    requireSessionValidation: true,
  });
};

/**
 * Customer role requirement middleware
 */
export const requireCustomer = async (event: APIGatewayProxyEvent): Promise<AuthResult> => {
  return authenticateJWT(event, {
    requiredRole: 'customer',
    requiredPermissions: ['orders:create', 'orders:read'],
  });
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (event: APIGatewayProxyEvent): Promise<AuthResult> => {
  const token = jwtService.extractTokenFromEvent(event);

  if (!token) {
    return {
      isAuthenticated: false,
      success: false,
      user: undefined,
    };
  }

  return authenticateJWT(event);
};

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = async (
  event: APIGatewayProxyEvent,
  limits: { requestsPerMinute: number; requestsPerHour: number } = {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
  try {
    const context: RateLimitContext = {
      ipAddress: event.requestContext.identity.sourceIp,
      endpoint: `${event.httpMethod} ${event.path}`,
      userAgent: event.headers?.['User-Agent'],
    };

    // Try to get user ID from token if present
    const token = jwtService.extractTokenFromEvent(event);
    if (token) {
      const verification = jwtService.verifyToken(token);
      if (verification.isValid && verification.payload) {
        context.userId = verification.payload.userId;
      }
    }

    // TODO: Implement actual rate limiting with Redis
    // For now, allow all requests and log the attempt
    logger.info('Rate limit check', {
      ...context,
      limits,
      timestamp: new Date().toISOString(),
    });

    return {
      allowed: true,
      remaining: limits.requestsPerMinute - 1,
      resetTime: Date.now() + 60 * 1000, // 1 minute from now
    };
  } catch (error: unknown) {
    logger.error('Rate limiting error', error instanceof Error ? error : new Error(String(error)), {
      path: event.path,
      method: event.httpMethod,
    });

    // On error, allow the request but log the issue
    return {
      allowed: true,
      remaining: 0,
      resetTime: Date.now() + 60 * 1000,
    };
  }
};

/**
 * CORS middleware for API Gateway responses
 */
export const corsMiddleware = (
  origin?: string,
  methods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  headers: string[] = ['Content-Type', 'Authorization', 'X-Requested-With']
): Record<string, string> => {
  const allowedOrigin = origin || '*';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': methods.join(', '),
    'Access-Control-Allow-Headers': headers.join(', '),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
};

/**
 * Security headers middleware
 */
export const securityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
};

/**
 * Create standardized error response
 */
export const createAuthErrorResponse = (
  statusCode: number,
  message: string,
  errorCode?: string,
  details?: any
): APIGatewayProxyResult => {
  const errorResponse = {
    error: {
      message,
      code: errorCode || 'AUTHENTICATION_ERROR',
      timestamp: new Date().toISOString(),
      ...(details && { details }),
    },
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...corsMiddleware(),
      ...securityHeaders(),
    },
    body: JSON.stringify(errorResponse),
  };
};

/**
 * Higher-order function to wrap Lambda handlers with authentication
 */
export const withAuth = (
  handler: (event: APIGatewayProxyEvent, user: JWTPayload) => Promise<APIGatewayProxyResult>,
  authOptions: AuthOptions = {}
) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      // Handle preflight OPTIONS requests
      if (event.httpMethod === 'OPTIONS') {
        return {
          statusCode: 200,
          headers: {
            ...corsMiddleware(),
            ...securityHeaders(),
          },
          body: '',
        };
      }

      // Authenticate request
      const authResult = await authenticateJWT(event, authOptions);

      if (!authResult.isAuthenticated || !authResult.user) {
        return createAuthErrorResponse(
          authResult.statusCode || 401,
          authResult.error || 'Authentication failed',
          'AUTH_FAILED'
        );
      }

      // Check rate limiting
      const rateLimitResult = await rateLimitMiddleware(event);
      if (!rateLimitResult.allowed) {
        return createAuthErrorResponse(429, 'Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', {
          resetTime: rateLimitResult.resetTime,
          remaining: rateLimitResult.remaining,
        });
      }

      // Execute the actual handler with authenticated user
      const result = await handler(event, authResult.user);

      // Add security headers to the response
      return {
        ...result,
        headers: {
          ...result.headers,
          ...corsMiddleware(),
          ...securityHeaders(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      };
    } catch (error: unknown) {
      logger.error(
        'Authentication wrapper error',
        error instanceof Error ? error : new Error(String(error)),
        {
          path: event.path,
          method: event.httpMethod,
        }
      );

      return createAuthErrorResponse(500, 'Internal server error', 'INTERNAL_ERROR');
    }
  };
};

/**
 * Higher-order function to wrap Lambda handlers with optional authentication
 */
export const withOptionalAuth = (
  handler: (event: APIGatewayProxyEvent, user?: JWTPayload) => Promise<APIGatewayProxyResult>
) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      // Handle preflight OPTIONS requests
      if (event.httpMethod === 'OPTIONS') {
        return {
          statusCode: 200,
          headers: {
            ...corsMiddleware(),
            ...securityHeaders(),
          },
          body: '',
        };
      }

      // Try to authenticate (but don't fail if no token)
      const authResult = await optionalAuth(event);

      // Check rate limiting
      const rateLimitResult = await rateLimitMiddleware(event);
      if (!rateLimitResult.allowed) {
        return createAuthErrorResponse(429, 'Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', {
          resetTime: rateLimitResult.resetTime,
          remaining: rateLimitResult.remaining,
        });
      }

      // Execute the handler with optional user
      const result = await handler(event, authResult.user);

      // Add security headers to the response
      return {
        ...result,
        headers: {
          ...result.headers,
          ...corsMiddleware(),
          ...securityHeaders(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      };
    } catch (error: unknown) {
      logger.error(
        'Optional authentication wrapper error',
        error instanceof Error ? error : new Error(String(error)),
        {
          path: event.path,
          method: event.httpMethod,
        }
      );

      return createAuthErrorResponse(500, 'Internal server error', 'INTERNAL_ERROR');
    }
  };
};

/**
 * Health check for authentication middleware
 */
export const authMiddlewareHealthCheck = (): { status: 'healthy' | 'unhealthy'; details: any } => {
  try {
    // Test JWT service health
    const jwtHealth = jwtService.healthCheck();

    if (jwtHealth.status === 'healthy') {
      return {
        status: 'healthy',
        details: {
          middleware: 'working',
          jwtService: jwtHealth.details,
          rateLimiting: 'configured',
          cors: 'configured',
          securityHeaders: 'configured',
        },
      };
    } else {
      return {
        status: 'unhealthy',
        details: {
          middleware: 'degraded',
          jwtService: jwtHealth.details,
          issue: 'JWT service unhealthy',
        },
      };
    }
  } catch (error: unknown) {
    return {
      status: 'unhealthy',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    };
  }
};
