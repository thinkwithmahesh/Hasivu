"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsPreflightMiddleware = exports.validateContentType = exports.paginationMiddleware = exports.createRateLimiter = exports.validateRequest = exports.sanitizationMiddleware = exports.compressionMiddleware = exports.securityHeadersMiddleware = exports.performanceMiddleware = exports.apiVersionMiddleware = exports.requestIdMiddleware = void 0;
const zod_1 = require("zod");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const logger_service_1 = require("../shared/logger.service");
const errors_1 = require("../utils/errors");
const API_CONFIG = {
    versioning: {
        defaultVersion: 'v1',
        supportedVersions: ['v1', 'v2'],
        backwardCompatibility: {
            v1: { sunset: '2025-12-31', alternatives: ['v2'] },
        },
        deprecationWarnings: true,
    },
    security: {
        csp: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
        validation: {
            sanitization: {
                stripTags: true,
            },
        },
        cors: {
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        },
    },
    rateLimiting: {
        global: {
            windowMs: 15 * 60 * 1000,
        },
        tiers: {
            anonymous: { requests: 100 },
        },
    },
    performance: {
        responseTimeTargets: {
            simple: 1000,
        },
        queries: {
            maxLimit: 1000,
            defaultLimit: 50,
        },
    },
};
const { window } = new jsdom_1.JSDOM('');
const purify = (0, dompurify_1.default)(window);
const requestIdMiddleware = (req, res, next) => {
    const requestId = req.headers['x-request-id'] ||
        `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    req.requestId = requestId;
    res.locals.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
const apiVersionMiddleware = (req, res, next) => {
    const version = req.headers['x-api-version'] ||
        req.query.v ||
        API_CONFIG.versioning.defaultVersion;
    if (!API_CONFIG.versioning.supportedVersions.includes(version)) {
        throw new errors_1.AppError(`Unsupported API version: ${version}. Supported versions: ${API_CONFIG.versioning.supportedVersions.join(', ')}`, 400);
    }
    req.apiVersion = version;
    res.setHeader('X-API-Version', version);
    const deprecationInfo = API_CONFIG.versioning.backwardCompatibility[version];
    if (deprecationInfo && API_CONFIG.versioning.deprecationWarnings) {
        res.setHeader('Warning', `299 - "API version ${version} is deprecated and will be sunset on ${deprecationInfo.sunset}. Please migrate to: ${deprecationInfo.alternatives.join(', ')}"`);
    }
    next();
};
exports.apiVersionMiddleware = apiVersionMiddleware;
const performanceMiddleware = (req, res, next) => {
    req.startTime = Date.now();
    const originalSend = res.send;
    res.send = function (data) {
        const processingTime = Date.now() - (req.startTime || Date.now());
        res.locals.processingTime = processingTime;
        res.setHeader('X-Response-Time', `${processingTime}ms`);
        const endpoint = req.route?.path || req.path;
        const { method } = req;
        const target = API_CONFIG.performance.responseTimeTargets.simple;
        if (processingTime > target) {
            logger_service_1.logger.warn('Slow request detected', {
                requestId: req.requestId,
                method,
                endpoint,
                processingTime,
                target,
                userId: req.user?.id,
                userAgent: req.get('User-Agent'),
            });
        }
        recordAPIMetrics(method, endpoint, processingTime, res.statusCode);
        return originalSend.call(this, data);
    };
    next();
};
exports.performanceMiddleware = performanceMiddleware;
exports.securityHeadersMiddleware = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: API_CONFIG.security.csp.directives,
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});
exports.compressionMiddleware = (0, compression_1.default)({
    threshold: 1024,
    level: 6,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression_1.default.filter(req, res);
    },
});
const sanitizationMiddleware = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            return API_CONFIG.security.validation.sanitization.stripTags
                ? purify.sanitize(obj.trim(), { ALLOWED_TAGS: [] })
                : obj.trim();
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        if (obj !== null && typeof obj === 'object') {
            const sanitized = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    sanitized[key] = sanitizeObject(obj[key]);
                }
            }
            return sanitized;
        }
        return obj;
    };
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    next();
};
exports.sanitizationMiddleware = sanitizationMiddleware;
const validateRequest = (schemas) => {
    return (req, res, next) => {
        try {
            if (schemas.body && req.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query && req.query) {
                req.query = schemas.query.parse(req.query);
            }
            if (schemas.params && req.params) {
                req.params = schemas.params.parse(req.params);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const validationErrors = error.issues.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));
                logger_service_1.logger.warn('Request validation failed', {
                    requestId: req.requestId,
                    errors: validationErrors,
                    method: req.method,
                    path: req.path,
                });
                throw new errors_1.AppError('Request validation failed', 400);
            }
            throw error;
        }
    };
};
exports.validateRequest = validateRequest;
const createRateLimiter = (endpointConfig) => {
    return (0, express_rate_limit_1.default)({
        windowMs: endpointConfig?.windowMs || API_CONFIG.rateLimiting.global.windowMs,
        max: (req) => {
            if (endpointConfig) {
                return endpointConfig.requests;
            }
            const userRole = req.user?.role || 'anonymous';
            const roleLimits = API_CONFIG.rateLimiting.tiers[userRole] ||
                API_CONFIG.rateLimiting.tiers.anonymous;
            return roleLimits.requests;
        },
        keyGenerator: (req) => {
            return req.user?.id || req.ip || 'unknown';
        },
        skipSuccessfulRequests: endpointConfig?.skipSuccessfulRequests || false,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            error: 'Too many requests, please try again later.',
            retryAfter: Math.ceil(API_CONFIG.rateLimiting.global.windowMs / 1000),
        },
        handler: (req, res) => {
            logger_service_1.logger.warn('Rate limit exceeded', {
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
exports.createRateLimiter = createRateLimiter;
const paginationMiddleware = (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(API_CONFIG.performance.queries.maxLimit, Math.max(1, parseInt(req.query.limit) || API_CONFIG.performance.queries.defaultLimit));
    const offset = (page - 1) * limit;
    req.pagination = {
        page,
        limit,
        offset,
    };
    res.sendPaginated = (data, total, metadata) => {
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
exports.paginationMiddleware = paginationMiddleware;
const validateContentType = (allowedTypes) => {
    return (req, res, next) => {
        const contentType = req.get('Content-Type');
        if (req.method !== 'GET' &&
            req.method !== 'DELETE' &&
            contentType &&
            !allowedTypes.some(type => contentType.includes(type))) {
            throw new errors_1.AppError(`Unsupported content type: ${contentType}. Allowed: ${allowedTypes.join(', ')}`, 415);
        }
        next();
    };
};
exports.validateContentType = validateContentType;
const corsPreflightMiddleware = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', req.get('Origin') || '*');
        res.setHeader('Access-Control-Allow-Methods', API_CONFIG.security.cors.methods.join(', '));
        res.setHeader('Access-Control-Allow-Headers', API_CONFIG.security.cors.allowedHeaders.join(', '));
        res.setHeader('Access-Control-Max-Age', '86400');
        res.status(200).end();
        return;
    }
    next();
};
exports.corsPreflightMiddleware = corsPreflightMiddleware;
const recordAPIMetrics = (method, endpoint, responseTime, statusCode) => {
    const metrics = {
        timestamp: new Date().toISOString(),
        method,
        endpoint,
        responseTime,
        statusCode,
        success: statusCode < 400,
    };
};
//# sourceMappingURL=api.middleware.js.map