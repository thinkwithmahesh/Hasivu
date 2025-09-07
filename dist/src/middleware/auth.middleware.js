"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTimeout = exports.auditLog = exports.authorize = exports.requirePermission = exports.requireRole = exports.optionalAuthMiddleware = exports.authMiddleware = exports.corsMiddleware = exports.validateInput = exports.generalRateLimit = exports.authRateLimit = exports.securityHeaders = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const auth_service_1 = require("../services/auth.service");
const jwt_service_1 = require("../shared/services/jwt.service");
const logger_1 = require("../utils/logger");
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false
});
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.logger.warn('Rate limit exceeded for authentication', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path
        });
        res.status(429).json({
            error: 'Too many requests',
            message: 'Too many authentication attempts, please try again later',
            retryAfter: Math.round(15 * 60)
        });
    }
});
exports.generalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});
const validateInput = (req, res, next) => {
    try {
        const sanitizeString = (str) => {
            if (typeof str !== 'string')
                return str;
            return str
                .replace(/[<>]/g, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '')
                .trim();
        };
        const sanitizeObject = (obj) => {
            if (obj === null || typeof obj !== 'object') {
                return typeof obj === 'string' ? sanitizeString(obj) : obj;
            }
            if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            }
            const sanitized = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const sanitizedKey = sanitizeString(key);
                    sanitized[sanitizedKey] = sanitizeObject(obj[key]);
                }
            }
            return sanitized;
        };
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Input validation failed', error);
        res.status(400).json({
            error: 'Invalid input',
            message: 'Request contains invalid data'
        });
    }
};
exports.validateInput = validateInput;
const corsMiddleware = (req, res, next) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
};
exports.corsMiddleware = corsMiddleware;
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Access token is required'
            });
            return;
        }
        const token = authHeader.substring(7).trim();
        if (!token) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid access token format'
            });
            return;
        }
        const verificationResult = await jwt_service_1.jwtService.verifyToken(token, 'access');
        if (!verificationResult.isValid) {
            res.status(401).json({
                error: 'Unauthorized',
                message: verificationResult.error || 'Invalid token'
            });
            return;
        }
        const decoded = verificationResult.payload;
        const sessionData = await auth_service_1.authService.validateSession(decoded.sessionId);
        if (!sessionData.valid) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired session'
            });
            return;
        }
        await auth_service_1.authService.updateSessionActivity(decoded.sessionId, {
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip
        });
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions
        };
        req.sessionId = decoded.sessionId;
        logger_1.logger.debug('User authenticated successfully', {
            userId: decoded.userId,
            role: decoded.role,
            sessionId: decoded.sessionId
        });
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication middleware error', error);
        if (error.message === 'Token expired') {
            res.status(401).json({
                error: 'Token expired',
                message: 'Please refresh your token or login again'
            });
        }
        else if (error.message?.includes('timeout')) {
            res.status(401).json({
                error: 'Authentication timeout',
                message: 'Token verification took too long - possible security threat'
            });
        }
        else {
            res.status(401).json({
                error: 'Authentication failed',
                message: 'Invalid or malformed token'
            });
        }
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.substring(7).trim();
        if (!token) {
            next();
            return;
        }
        try {
            const verificationResult = await jwt_service_1.jwtService.verifyToken(token, 'access');
            if (verificationResult.isValid) {
                const decoded = verificationResult.payload;
                const sessionData = await auth_service_1.authService.validateSession(decoded.sessionId);
                if (sessionData.valid) {
                    req.user = {
                        id: decoded.userId,
                        email: decoded.email,
                        role: decoded.role,
                        permissions: decoded.permissions
                    };
                    req.sessionId = decoded.sessionId;
                    await auth_service_1.authService.updateSessionActivity(decoded.sessionId, {
                        userAgent: req.get('User-Agent'),
                        ipAddress: req.ip
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.debug('Optional authentication failed', { error: error.message });
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Optional authentication middleware error', error);
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const requireRole = (roles) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            logger_1.logger.warn('Insufficient role permissions', {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: allowedRoles
            });
            res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions',
                details: `Required role: ${allowedRoles.join(' or ')}`
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const requirePermission = (permissions) => {
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }
        const hasPermission = requiredPermissions.some(permission => req.user.permissions.includes(permission));
        if (!hasPermission) {
            logger_1.logger.warn('Insufficient permissions', {
                userId: req.user.id,
                userPermissions: req.user.permissions,
                requiredPermissions
            });
            res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions',
                details: `Required permission: ${requiredPermissions.join(' or ')}`
            });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
const authorize = (options) => {
    return (req, res, next) => {
        if (!req.user) {
            if (options.optional) {
                next();
                return;
            }
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }
        if (options.roles && options.roles.length > 0) {
            if (!options.roles.includes(req.user.role)) {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'Insufficient permissions',
                    details: `Required role: ${options.roles.join(' or ')}`
                });
                return;
            }
        }
        if (options.permissions && options.permissions.length > 0) {
            const hasPermission = options.permissions.some(permission => req.user.permissions.includes(permission));
            if (!hasPermission) {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'Insufficient permissions',
                    details: `Required permission: ${options.permissions.join(' or ')}`
                });
                return;
            }
        }
        next();
    };
};
exports.authorize = authorize;
const auditLog = (operation) => {
    return (req, res, next) => {
        const startTime = Date.now();
        logger_1.logger.info('Sensitive operation attempted', {
            operation,
            userId: req.user?.id,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            method: req.method,
            path: req.path,
            timestamp: new Date().toISOString()
        });
        const originalJson = res.json;
        res.json = function (body) {
            const duration = Date.now() - startTime;
            const success = res.statusCode >= 200 && res.statusCode < 300;
            logger_1.logger.info('Sensitive operation completed', {
                operation,
                userId: req.user?.id,
                success,
                statusCode: res.statusCode,
                duration,
                timestamp: new Date().toISOString()
            });
            return originalJson.call(this, body);
        };
        next();
    };
};
exports.auditLog = auditLog;
const requestTimeout = (timeoutMs = 30000) => {
    return (req, res, next) => {
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                logger_1.logger.warn('Request timeout', {
                    method: req.method,
                    path: req.path,
                    ip: req.ip,
                    timeout: timeoutMs
                });
                res.status(408).json({
                    error: 'Request timeout',
                    message: 'Request took too long to process'
                });
            }
        }, timeoutMs);
        res.on('finish', () => {
            clearTimeout(timeout);
        });
        next();
    };
};
exports.requestTimeout = requestTimeout;
//# sourceMappingURL=auth.middleware.js.map