"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateLambda = void 0;
const jwt = require("jsonwebtoken");
const client_1 = require("@prisma/client");
const logger_service_1 = require("../../functions/shared/logger.service");
// Initialize database client
const prisma = new client_1.PrismaClient();
const logger = logger_service_1.LoggerService.getInstance();
// JWT Secret from environment variables
const jwtSecret = process.env.JWT_SECRET || 'hasivu-default-secret-key';
/**
 * Extract JWT token from Lambda event
 */
function extractToken(event) {
    // Check Authorization header (Bearer token)
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // Check query parameters (for WebSocket/URL-based auth)
    if (event.queryStringParameters && event.queryStringParameters.token) {
        return event.queryStringParameters.token;
    }
    // Check cookies if present
    const cookies = event.headers.Cookie || event.headers.cookie;
    if (cookies) {
        const tokenMatch = cookies.match(/token=([^;]+)/);
        if (tokenMatch) {
            return tokenMatch[1];
        }
    }
    return null;
}
/**
 * Verify JWT token and validate session
 */
async function verifyAndValidateToken(token) {
    try {
        // Verify JWT token
        const decoded = jwt.verify(token, jwtSecret);
        if (!decoded.userId || !decoded.sessionId || !decoded.email || !decoded.role) {
            throw new Error('Invalid token payload');
        }
        // Validate session in database
        const session = await prisma.authSession.findUnique({
            where: { id: decoded.sessionId },
            include: {
                user: {
                    include: {
                        userRoleAssignments: {
                            include: {
                                role: true
                            }
                        }
                    }
                }
            }
        });
        if (!session) {
            throw new Error('Session not found');
        }
        if (!session.user.isActive) {
            throw new Error('User account is inactive');
        }
        // Check if session is expired
        if (session.expiresAt < new Date()) {
            // Mark session as inactive
            await prisma.authSession.update({
                where: { id: session.id },
                data: { isActive: false }
            });
            throw new Error('Session expired');
        }
        // Extract permissions from role assignments (simplified for demo)
        const permissions = session.user.userRoleAssignments.map((assignment) => assignment.role.name);
        // Update session activity
        await prisma.authSession.update({
            where: { id: session.id },
            data: { lastActivity: new Date() }
        });
        return {
            id: session.user.id,
            email: session.user.email,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            role: decoded.role,
            schoolId: session.user.schoolId || undefined,
            permissions,
            sessionId: session.id
        };
    }
    catch (error) {
        throw new Error(`Token validation failed: ${error.message}`);
    }
}
/**
 * Check role-based authorization
 */
function checkRoleAuthorization(user, requiredRoles) {
    if (!requiredRoles || requiredRoles.length === 0) {
        return true;
    }
    return requiredRoles.includes(user.role);
}
/**
 * Check permission-based authorization
 */
function checkPermissionAuthorization(user, requiredPermissions) {
    if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
    }
    return requiredPermissions.some(permission => user.permissions.includes(permission));
}
/**
 * Check school context requirement
 */
function checkSchoolContext(user, schoolRequired) {
    if (!schoolRequired) {
        return true;
    }
    return !!user.schoolId;
}
/**
 * Create authentication error response
 */
function createAuthErrorResponse(message, statusCode = 401, code = 'UNAUTHORIZED') {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({
            success: false,
            error: message,
            code,
            meta: {
                timestamp: new Date().toISOString()
            }
        })
    };
}
/**
 * Main Lambda authentication middleware
 * Returns authentication result with success status, user data, and error information
 */
async function authenticateLambda(event, options = {}) {
    const startTime = Date.now();
    try {
        // Handle CORS preflight requests
        if (event.httpMethod === 'OPTIONS') {
            throw new Error('OPTIONS requests should be handled before authentication');
        }
        // Extract token from request
        const token = extractToken(event);
        if (!token) {
            if (options.optional) {
                const anonymousUser = { id: '', email: '', firstName: '', lastName: '', role: 'anonymous', permissions: [], sessionId: '' };
                return {
                    success: true,
                    userId: '',
                    user: anonymousUser,
                    schoolId: undefined,
                    // Flattened user properties for backward compatibility
                    id: '',
                    email: '',
                    firstName: '',
                    lastName: '',
                    role: 'anonymous',
                    permissions: [],
                    sessionId: ''
                };
            }
            logger.warn('Authentication failed - no token provided', {
                path: event.path,
                method: event.httpMethod
            });
            throw new Error('Authentication token required');
        }
        // Verify token and get user data
        const user = await verifyAndValidateToken(token);
        // Check role-based authorization
        if (!checkRoleAuthorization(user, options.roles)) {
            logger.warn('Authorization failed - insufficient role', {
                userId: user.id,
                userRole: user.role,
                requiredRoles: options.roles
            });
            throw new Error(`Access denied. Required role: ${options.roles?.join(' or ')}`);
        }
        // Check permission-based authorization
        if (!checkPermissionAuthorization(user, options.permissions)) {
            logger.warn('Authorization failed - insufficient permissions', {
                userId: user.id,
                userPermissions: user.permissions,
                requiredPermissions: options.permissions
            });
            throw new Error(`Access denied. Required permission: ${options.permissions?.join(' or ')}`);
        }
        // Check school context requirement
        if (!checkSchoolContext(user, options.schoolRequired)) {
            logger.warn('Authorization failed - school context required', {
                userId: user.id,
                hasSchoolId: !!user.schoolId
            });
            throw new Error('School context required for this operation');
        }
        const duration = Date.now() - startTime;
        logger.debug('Authentication successful', {
            userId: user.id,
            role: user.role,
            schoolId: user.schoolId,
            authDuration: `${duration}ms`
        });
        return {
            success: true,
            userId: user.id,
            user: user,
            schoolId: user.schoolId,
            // Flattened user properties for backward compatibility
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            permissions: user.permissions,
            sessionId: user.sessionId
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Authentication failed', error, {
            path: event.path,
            method: event.httpMethod,
            authDuration: `${duration}ms`
        });
        return {
            success: false,
            error: error.message || 'Authentication failed'
        };
    }
    finally {
        // Don't disconnect Prisma here as it may be reused in the same Lambda execution
    }
}
exports.authenticateLambda = authenticateLambda;
