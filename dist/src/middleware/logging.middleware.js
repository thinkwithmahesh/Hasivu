"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = exports.auditLogger = exports.requestLogger = exports.loggingMiddleware = void 0;
const logger_1 = require("../utils/logger");
const perf_hooks_1 = require("perf_hooks");
const loggingMiddleware = (req, res, next) => {
    try {
        req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        req.startTime = perf_hooks_1.performance.now();
        req.clientIp = req.ip || req.connection.remoteAddress || 'unknown';
        req.userAgent = req.get('User-Agent') || 'unknown';
        logger_1.logger.info('Incoming request', {
            requestId: req.requestId,
            method: req.method,
            url: req.url,
            path: req.path,
            clientIp: req.clientIp,
            userAgent: req.userAgent,
            headers: {
                authorization: req.headers.authorization ? 'Bearer [REDACTED]' : undefined,
                'content-type': req.headers['content-type'],
                'content-length': req.headers['content-length']
            }
        });
        res.on('finish', () => {
            const duration = req.startTime ? perf_hooks_1.performance.now() - req.startTime : 0;
            logger_1.logger.info('Request completed', {
                requestId: req.requestId,
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: Math.round(duration * 100) / 100,
                contentLength: res.get('content-length'),
                userAgent: req.userAgent,
                clientIp: req.clientIp
            });
        });
        res.set('X-Request-ID', req.requestId);
        next();
    }
    catch (error) {
        logger_1.logger.error('Logging middleware error', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            requestId: req.requestId
        });
        next(error);
    }
};
exports.loggingMiddleware = loggingMiddleware;
const requestLogger = (req, res, next) => {
    try {
        const sanitizedBody = req.body ? sanitizeLogData(req.body) : undefined;
        const sanitizedQuery = req.query ? sanitizeLogData(req.query) : undefined;
        logger_1.logger.info('Route request details', {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            query: sanitizedQuery,
            body: sanitizedBody,
            params: req.params,
            clientIp: req.clientIp,
            timestamp: new Date().toISOString()
        });
        next();
    }
    catch (error) {
        logger_1.logger.error('Request logger error', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error',
            requestId: req.requestId
        });
        next(error);
    }
};
exports.requestLogger = requestLogger;
const auditLogger = (req, res, next) => {
    try {
        const userId = req.user?.id || 'anonymous';
        const userRole = req.user?.role || 'unknown';
        logger_1.logger.warn('Audit trail', {
            requestId: req.requestId,
            userId,
            userRole,
            method: req.method,
            path: req.path,
            clientIp: req.clientIp,
            userAgent: req.userAgent,
            timestamp: new Date().toISOString(),
            action: `${req.method} ${req.path}`,
            resource: extractResourceFromPath(req.path)
        });
        next();
    }
    catch (error) {
        logger_1.logger.error('Audit logger error', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error',
            requestId: req.requestId
        });
        next(error);
    }
};
exports.auditLogger = auditLogger;
const errorLogger = (error, req, res, next) => {
    const errorDetails = {
        requestId: req.requestId,
        error: {
            message: error instanceof Error ? error.message : String(error),
            stack: error.stack,
            name: error.name,
            code: error.code
        },
        request: {
            method: req.method,
            url: req.url,
            path: req.path,
            clientIp: req.clientIp,
            userAgent: req.userAgent
        },
        user: {
            id: req.user?.id || 'anonymous',
            role: req.user?.role || 'unknown'
        },
        timestamp: new Date().toISOString()
    };
    if (error.status >= 500) {
        logger_1.logger.error('Server error occurred', errorDetails);
    }
    else if (error.status >= 400) {
        logger_1.logger.warn('Client error occurred', errorDetails);
    }
    else {
        logger_1.logger.error('Unexpected error occurred', errorDetails);
    }
    next(error);
};
exports.errorLogger = errorLogger;
function sanitizeLogData(data) {
    if (!data || typeof data !== 'object')
        return data;
    const sensitiveFields = [
        'password',
        'token',
        'secret',
        'key',
        'authorization',
        'cookie',
        'session'
    ];
    const sanitized = { ...data };
    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }
    for (const key in sanitized) {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            sanitized[key] = sanitizeLogData(sanitized[key]);
        }
    }
    return sanitized;
}
function extractResourceFromPath(path) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0)
        return 'root';
    if (segments.length === 1)
        return segments[0];
    if (segments.length >= 2)
        return `${segments[0]}/${segments[1]}`;
    return segments[0];
}
exports.default = exports.loggingMiddleware;
//# sourceMappingURL=logging.middleware.js.map