"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddlewareHealthCheck = exports.withOptionalAuth = exports.withAuth = exports.createAuthErrorResponse = exports.securityHeaders = exports.corsMiddleware = exports.rateLimitMiddleware = exports.optionalAuth = exports.requireCustomer = exports.requireStaff = exports.requireManager = exports.requireBusinessOwner = exports.requireAdmin = exports.requirePermissions = exports.requireRole = exports.authenticateJWT = void 0;
const jwt_service_1 = require("../jwt.service");
const environment_1 = require("../../config/environment");
const logger = {
    info: (message, data) => console.log(message, data),
    warn: (message, data) => console.warn(message, data),
    error: (message, data) => console.error(message, data),
    debug: (message, data) => console.debug(message, data)
};
const authenticateJWT = async (event, options = {}) => {
    const startTime = Date.now();
    try {
        const token = jwt_service_1.jwtService.extractTokenFromEvent(event);
        if (!token) {
            logger.warn('No JWT token provided in request', {
                path: event.path,
                method: event.httpMethod,
                sourceIp: event.requestContext.identity.sourceIp,
                userAgent: event.headers?.['User-Agent']
            });
            return {
                isAuthenticated: false,
                success: false,
                error: 'Authentication required - no token provided',
                statusCode: 401,
                headers: {
                    'WWW-Authenticate': 'Bearer realm="API"',
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                }
            };
        }
        const verification = jwt_service_1.jwtService.verifyToken(token);
        if (!verification.isValid || !verification.payload) {
            logger.warn('JWT token verification failed', {
                error: verification.error,
                errorCode: verification.errorCode,
                path: event.path,
                method: event.httpMethod,
                sourceIp: event.requestContext.identity.sourceIp,
                tokenLength: token.length
            });
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
                    'Content-Type': 'application/json'
                }
            };
        }
        const { payload } = verification;
        if (options.requiredRole && !jwt_service_1.jwtService.hasRole(payload, options.requiredRole)) {
            logger.warn('Insufficient role privileges', {
                userId: payload.userId,
                userRole: payload.role,
                requiredRole: options.requiredRole,
                path: event.path,
                method: event.httpMethod
            });
            return {
                isAuthenticated: false,
                success: false,
                error: `Insufficient privileges - ${options.requiredRole} role required`,
                statusCode: 403,
                headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                }
            };
        }
        if (options.requiredPermissions && options.requiredPermissions.length > 0) {
            const missingPermissions = options.requiredPermissions.filter(permission => !jwt_service_1.jwtService.hasPermission(payload, permission));
            if (missingPermissions.length > 0) {
                logger.warn('Insufficient permissions', {
                    userId: payload.userId,
                    userPermissions: payload.permissions,
                    requiredPermissions: options.requiredPermissions,
                    missingPermissions,
                    path: event.path,
                    method: event.httpMethod
                });
                return {
                    isAuthenticated: false,
                    success: false,
                    error: `Missing required permissions: ${missingPermissions.join(', ')}`,
                    statusCode: 403,
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Content-Type': 'application/json'
                    }
                };
            }
        }
        if (options.requireBusinessContext && !payload.businessId) {
            logger.warn('Business context required but not provided', {
                userId: payload.userId,
                path: event.path,
                method: event.httpMethod
            });
            return {
                isAuthenticated: false,
                success: false,
                error: 'Business context required for this operation',
                statusCode: 400,
                headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                }
            };
        }
        if (options.requireSessionValidation && !payload.sessionId) {
            logger.warn('Session validation required but session ID not found', {
                userId: payload.userId,
                path: event.path,
                method: event.httpMethod
            });
            return {
                isAuthenticated: false,
                success: false,
                error: 'Valid session required for this operation',
                statusCode: 401,
                headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                }
            };
        }
        if (options.customValidation) {
            try {
                const isValid = await options.customValidation(payload);
                if (!isValid) {
                    logger.warn('Custom validation failed', {
                        userId: payload.userId,
                        path: event.path,
                        method: event.httpMethod
                    });
                    return {
                        isAuthenticated: false,
                        success: false,
                        error: 'Custom authorization validation failed',
                        statusCode: 403,
                        headers: {
                            'Cache-Control': 'no-cache',
                            'Content-Type': 'application/json'
                        }
                    };
                }
            }
            catch (error) {
                logger.error('Custom validation error', {
                    userId: payload.userId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    path: event.path,
                    method: event.httpMethod
                });
                return {
                    isAuthenticated: false,
                    success: false,
                    error: 'Authorization validation error',
                    statusCode: 500,
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Content-Type': 'application/json'
                    }
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
            duration
        });
        return {
            isAuthenticated: true,
            success: true,
            user: payload,
            schoolId: payload.schoolId
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Authentication middleware error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            path: event.path,
            method: event.httpMethod,
            sourceIp: event.requestContext.identity.sourceIp,
            duration
        });
        return {
            isAuthenticated: false,
            success: false,
            error: 'Internal authentication error',
            statusCode: 500,
            headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json'
            }
        };
    }
};
exports.authenticateJWT = authenticateJWT;
const requireRole = (role) => {
    return async (event) => {
        return (0, exports.authenticateJWT)(event, { requiredRole: role });
    };
};
exports.requireRole = requireRole;
const requirePermissions = (permissions) => {
    return async (event) => {
        return (0, exports.authenticateJWT)(event, { requiredPermissions: permissions });
    };
};
exports.requirePermissions = requirePermissions;
const requireAdmin = async (event) => {
    return (0, exports.authenticateJWT)(event, {
        requiredRole: 'admin',
        requiredPermissions: ['admin:*']
    });
};
exports.requireAdmin = requireAdmin;
const requireBusinessOwner = async (event) => {
    return (0, exports.authenticateJWT)(event, {
        requiredRole: 'owner',
        requireBusinessContext: true,
        requiredPermissions: ['business:manage']
    });
};
exports.requireBusinessOwner = requireBusinessOwner;
const requireManager = async (event) => {
    return (0, exports.authenticateJWT)(event, {
        requiredRole: 'manager',
        requireBusinessContext: true,
        requiredPermissions: ['business:read', 'orders:manage']
    });
};
exports.requireManager = requireManager;
const requireStaff = async (event) => {
    return (0, exports.authenticateJWT)(event, {
        requiredRole: 'staff',
        requireBusinessContext: true,
        requireSessionValidation: true
    });
};
exports.requireStaff = requireStaff;
const requireCustomer = async (event) => {
    return (0, exports.authenticateJWT)(event, {
        requiredRole: 'customer',
        requiredPermissions: ['orders:create', 'orders:read']
    });
};
exports.requireCustomer = requireCustomer;
const optionalAuth = async (event) => {
    const token = jwt_service_1.jwtService.extractTokenFromEvent(event);
    if (!token) {
        return {
            isAuthenticated: false,
            success: false,
            user: undefined
        };
    }
    return (0, exports.authenticateJWT)(event);
};
exports.optionalAuth = optionalAuth;
const rateLimitMiddleware = async (event, limits = {
    requestsPerMinute: 60,
    requestsPerHour: 1000
}) => {
    try {
        const context = {
            ipAddress: event.requestContext.identity.sourceIp,
            endpoint: `${event.httpMethod} ${event.path}`,
            userAgent: event.headers?.['User-Agent']
        };
        const token = jwt_service_1.jwtService.extractTokenFromEvent(event);
        if (token) {
            const verification = jwt_service_1.jwtService.verifyToken(token);
            if (verification.isValid && verification.payload) {
                context.userId = verification.payload.userId;
            }
        }
        logger.info('Rate limit check', {
            ...context,
            limits,
            timestamp: new Date().toISOString()
        });
        return {
            allowed: true,
            remaining: limits.requestsPerMinute - 1,
            resetTime: Date.now() + (60 * 1000)
        };
    }
    catch (error) {
        logger.error('Rate limiting error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            path: event.path,
            method: event.httpMethod
        });
        return {
            allowed: true,
            remaining: 0,
            resetTime: Date.now() + (60 * 1000)
        };
    }
};
exports.rateLimitMiddleware = rateLimitMiddleware;
const corsMiddleware = (origin, methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], headers = ['Content-Type', 'Authorization', 'X-Requested-With']) => {
    const allowedOrigin = origin || environment_1.config.security.corsOrigins[0] || '*';
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': methods.join(', '),
        'Access-Control-Allow-Headers': headers.join(', '),
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
    };
};
exports.corsMiddleware = corsMiddleware;
const securityHeaders = () => {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': environment_1.config.security.cspPolicy || "default-src 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
};
exports.securityHeaders = securityHeaders;
const createAuthErrorResponse = (statusCode, message, errorCode, details) => {
    const errorResponse = {
        error: {
            message,
            code: errorCode || 'AUTHENTICATION_ERROR',
            timestamp: new Date().toISOString(),
            ...(details && { details })
        }
    };
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            ...(0, exports.corsMiddleware)(),
            ...(0, exports.securityHeaders)()
        },
        body: JSON.stringify(errorResponse)
    };
};
exports.createAuthErrorResponse = createAuthErrorResponse;
const withAuth = (handler, authOptions = {}) => {
    return async (event) => {
        try {
            if (event.httpMethod === 'OPTIONS') {
                return {
                    statusCode: 200,
                    headers: {
                        ...(0, exports.corsMiddleware)(),
                        ...(0, exports.securityHeaders)()
                    },
                    body: ''
                };
            }
            const authResult = await (0, exports.authenticateJWT)(event, authOptions);
            if (!authResult.isAuthenticated || !authResult.user) {
                return (0, exports.createAuthErrorResponse)(authResult.statusCode || 401, authResult.error || 'Authentication failed', 'AUTH_FAILED');
            }
            const rateLimitResult = await (0, exports.rateLimitMiddleware)(event);
            if (!rateLimitResult.allowed) {
                return (0, exports.createAuthErrorResponse)(429, 'Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', {
                    resetTime: rateLimitResult.resetTime,
                    remaining: rateLimitResult.remaining
                });
            }
            const result = await handler(event, authResult.user);
            return {
                ...result,
                headers: {
                    ...result.headers,
                    ...(0, exports.corsMiddleware)(),
                    ...(0, exports.securityHeaders)(),
                    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                    'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
                }
            };
        }
        catch (error) {
            logger.error('Authentication wrapper error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                path: event.path,
                method: event.httpMethod
            });
            return (0, exports.createAuthErrorResponse)(500, 'Internal server error', 'INTERNAL_ERROR');
        }
    };
};
exports.withAuth = withAuth;
const withOptionalAuth = (handler) => {
    return async (event) => {
        try {
            if (event.httpMethod === 'OPTIONS') {
                return {
                    statusCode: 200,
                    headers: {
                        ...(0, exports.corsMiddleware)(),
                        ...(0, exports.securityHeaders)()
                    },
                    body: ''
                };
            }
            const authResult = await (0, exports.optionalAuth)(event);
            const rateLimitResult = await (0, exports.rateLimitMiddleware)(event);
            if (!rateLimitResult.allowed) {
                return (0, exports.createAuthErrorResponse)(429, 'Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', {
                    resetTime: rateLimitResult.resetTime,
                    remaining: rateLimitResult.remaining
                });
            }
            const result = await handler(event, authResult.user);
            return {
                ...result,
                headers: {
                    ...result.headers,
                    ...(0, exports.corsMiddleware)(),
                    ...(0, exports.securityHeaders)(),
                    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                    'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
                }
            };
        }
        catch (error) {
            logger.error('Optional authentication wrapper error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                path: event.path,
                method: event.httpMethod
            });
            return (0, exports.createAuthErrorResponse)(500, 'Internal server error', 'INTERNAL_ERROR');
        }
    };
};
exports.withOptionalAuth = withOptionalAuth;
const authMiddlewareHealthCheck = () => {
    try {
        const jwtHealth = jwt_service_1.jwtService.healthCheck();
        if (jwtHealth.status === 'healthy') {
            return {
                status: 'healthy',
                details: {
                    middleware: 'working',
                    jwtService: jwtHealth.details,
                    rateLimiting: 'configured',
                    cors: 'configured',
                    securityHeaders: 'configured'
                }
            };
        }
        else {
            return {
                status: 'unhealthy',
                details: {
                    middleware: 'degraded',
                    jwtService: jwtHealth.details,
                    issue: 'JWT service unhealthy'
                }
            };
        }
    }
    catch (error) {
        return {
            status: 'unhealthy',
            details: {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            }
        };
    }
};
exports.authMiddlewareHealthCheck = authMiddlewareHealthCheck;
//# sourceMappingURL=auth.js.map