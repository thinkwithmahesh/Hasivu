"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateLambda = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const logger_service_1 = require("../../functions/shared/logger.service");
const prisma = new client_1.PrismaClient();
const logger = logger_service_1.LoggerService.getInstance();
const jwtSecret = process.env.JWT_SECRET || 'hasivu-default-secret-key';
function extractToken(event) {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    if (event.queryStringParameters && event.queryStringParameters.token) {
        return event.queryStringParameters.token;
    }
    const cookies = event.headers.Cookie || event.headers.cookie;
    if (cookies) {
        const tokenMatch = cookies.match(/token=([^;]+)/);
        if (tokenMatch) {
            return tokenMatch[1];
        }
    }
    return null;
}
async function verifyAndValidateToken(token) {
    try {
        const decoded = jwt.verify(token, jwtSecret);
        if (!decoded.userId || !decoded.sessionId || !decoded.email || !decoded.role) {
            throw new Error('Invalid token payload');
        }
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
        if (session.expiresAt < new Date()) {
            await prisma.authSession.update({
                where: { id: session.id },
                data: { isActive: false }
            });
            throw new Error('Session expired');
        }
        const permissions = session.user.userRoleAssignments.map((assignment) => assignment.role.name);
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
function checkRoleAuthorization(user, requiredRoles) {
    if (!requiredRoles || requiredRoles.length === 0) {
        return true;
    }
    return requiredRoles.includes(user.role);
}
function checkPermissionAuthorization(user, requiredPermissions) {
    if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
    }
    return requiredPermissions.some(permission => user.permissions.includes(permission));
}
function checkSchoolContext(user, schoolRequired) {
    if (!schoolRequired) {
        return true;
    }
    return !!user.schoolId;
}
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
async function authenticateLambda(event, options = {}) {
    const startTime = Date.now();
    try {
        if (event.httpMethod === 'OPTIONS') {
            throw new Error('OPTIONS requests should be handled before authentication');
        }
        const token = extractToken(event);
        if (!token) {
            if (options.optional) {
                const anonymousUser = { id: '', email: '', firstName: '', lastName: '', role: 'anonymous', permissions: [], sessionId: '' };
                return {
                    success: true,
                    userId: '',
                    user: anonymousUser,
                    schoolId: undefined,
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
        const user = await verifyAndValidateToken(token);
        if (!checkRoleAuthorization(user, options.roles)) {
            logger.warn('Authorization failed - insufficient role', {
                userId: user.id,
                userRole: user.role,
                requiredRoles: options.roles
            });
            throw new Error(`Access denied. Required role: ${options.roles?.join(' or ')}`);
        }
        if (!checkPermissionAuthorization(user, options.permissions)) {
            logger.warn('Authorization failed - insufficient permissions', {
                userId: user.id,
                userPermissions: user.permissions,
                requiredPermissions: options.permissions
            });
            throw new Error(`Access denied. Required permission: ${options.permissions?.join(' or ')}`);
        }
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
    }
}
exports.authenticateLambda = authenticateLambda;
//# sourceMappingURL=lambda-auth.middleware.js.map