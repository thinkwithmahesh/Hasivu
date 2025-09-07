"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityRequestLogger = exports.detailedRequestLogger = exports.basicRequestLogger = exports.createRequestLogger = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const defaultOptions = {
    logLevel: 'info',
    includeHeaders: false,
    includeBody: false,
    includeResponse: false,
    skipRoutes: ['/health', '/metrics', '/ping'],
    maxBodySize: 10240,
    maxResponseSize: 10240
};
const SENSITIVE_HEADERS = [
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token'
];
const SENSITIVE_FIELDS = [
    'password',
    'token',
    'secret',
    'key',
    'ssn',
    'creditcard',
    'ccnumber'
];
function maskSensitiveData(obj, includeSensitive = false) {
    if (!obj || typeof obj !== 'object')
        return obj;
    if (includeSensitive) {
        return obj;
    }
    const masked = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
        const keyLower = key.toLowerCase();
        const isSensitive = SENSITIVE_FIELDS.some(field => keyLower.includes(field.toLowerCase()));
        if (isSensitive) {
            masked[key] = '[MASKED]';
        }
        else if (typeof value === 'object' && value !== null) {
            masked[key] = maskSensitiveData(value, includeSensitive);
        }
        else {
            masked[key] = value;
        }
    }
    return masked;
}
function maskHeaders(headers, includeSensitive = false) {
    if (!headers || typeof headers !== 'object')
        return headers;
    const masked = { ...headers };
    for (const header of SENSITIVE_HEADERS) {
        if (masked[header]) {
            masked[header] = includeSensitive ? masked[header] : '[MASKED]';
        }
    }
    return masked;
}
function shouldSkipLogging(req, options) {
    if (options.skipRoutes?.some(route => req.path.startsWith(route))) {
        return true;
    }
    return false;
}
function extractClientInfo(req) {
    return {
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        referer: req.get('Referer'),
        origin: req.get('Origin'),
        forwardedFor: req.get('X-Forwarded-For'),
        realIp: req.get('X-Real-IP')
    };
}
function calculateRequestSize(req) {
    const contentLength = req.get('Content-Length');
    if (contentLength) {
        return parseInt(contentLength, 10);
    }
    if (req.body) {
        return JSON.stringify(req.body).length;
    }
    return 0;
}
function getLogLevelFromStatus(statusCode) {
    if (statusCode >= 500)
        return 'error';
    if (statusCode >= 400)
        return 'warn';
    if (statusCode >= 300)
        return 'info';
    return 'debug';
}
function isBot(userAgent) {
    const botPattern = /bot|crawler|spider|crawling/i;
    return botPattern.test(userAgent);
}
function createRequestLogger(options = {}) {
    const opts = { ...defaultOptions, ...options };
    return (req, res, next) => {
        try {
            if (shouldSkipLogging(req, opts)) {
                return next();
            }
            const requestId = (0, uuid_1.v4)();
            const startTime = Date.now();
            req.id = requestId;
            req.startTime = startTime;
            const clientInfo = extractClientInfo(req);
            const requestSize = calculateRequestSize(req);
            req.logData = {
                requestId,
                method: req.method,
                url: req.url,
                path: req.path,
                query: req.query,
                clientInfo,
                requestSize,
                timestamp: new Date().toISOString()
            };
            const requestLogData = {
                ...req.logData,
                event: 'request_start',
                isBot: isBot(clientInfo.userAgent)
            };
            if (opts.includeHeaders) {
                requestLogData.headers = maskHeaders(req.headers);
            }
            if (opts.includeBody && req.body) {
                const bodySize = JSON.stringify(req.body).length;
                if (bodySize <= (opts.maxBodySize || defaultOptions.maxBodySize)) {
                    requestLogData.body = maskSensitiveData(req.body);
                }
                else {
                    requestLogData.bodyTruncated = true;
                    requestLogData.bodySize = bodySize;
                }
            }
            logger_1.logger[opts.logLevel || 'info']('Incoming request', requestLogData);
            const originalEnd = res.end;
            const originalWrite = res.write;
            const chunks = [];
            if (opts.includeResponse) {
                res.write = function (chunk, ...args) {
                    if (chunk) {
                        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                    }
                    return originalWrite.apply(res, arguments);
                };
            }
            res.end = function (chunk, ...args) {
                if (chunk && opts.includeResponse) {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                }
                const endTime = Date.now();
                const duration = endTime - startTime;
                const responseSize = chunks.reduce((total, chunk) => total + chunk.length, 0);
                const user = req.user;
                const sessionId = req.sessionId;
                const responseLogData = {
                    ...req.logData,
                    event: 'request_complete',
                    statusCode: res.statusCode,
                    duration: `${duration}ms`,
                    responseSize,
                    user: user ? {
                        id: user.id,
                        email: user.email,
                        role: user.role
                    } : undefined,
                    sessionId
                };
                if (opts.includeResponse && responseSize > 0) {
                    if (responseSize <= (opts.maxResponseSize || defaultOptions.maxResponseSize)) {
                        try {
                            const responseBody = Buffer.concat(chunks).toString('utf8');
                            responseLogData.responseBody = JSON.parse(responseBody);
                        }
                        catch (error) {
                            responseLogData.responseBody = Buffer.concat(chunks).toString('utf8');
                        }
                    }
                    else {
                        responseLogData.responseTruncated = true;
                    }
                }
                const logLevel = getLogLevelFromStatus(res.statusCode);
                logger_1.logger[logLevel]('Request completed', responseLogData);
                if (duration > 1000) {
                    logger_1.logger.warn('Slow request detected', {
                        requestId,
                        path: req.path,
                        method: req.method,
                        duration: duration,
                        statusCode: res.statusCode
                    });
                }
                return originalEnd.apply(res, arguments);
            };
            next();
        }
        catch (error) {
            logger_1.logger.error('Request logger middleware error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                path: req.path,
                method: req.method
            });
            next(error);
        }
    };
}
exports.createRequestLogger = createRequestLogger;
exports.basicRequestLogger = createRequestLogger({
    logLevel: 'info',
    includeHeaders: false,
    includeBody: false,
    includeResponse: false
});
exports.detailedRequestLogger = createRequestLogger({
    logLevel: 'info',
    includeHeaders: true,
    includeBody: true,
    includeResponse: true,
    maxBodySize: 5120,
    maxResponseSize: 5120
});
exports.securityRequestLogger = createRequestLogger({
    logLevel: 'warn',
    includeHeaders: true,
    includeBody: true,
    includeResponse: false,
    skipRoutes: []
});
exports.default = exports.basicRequestLogger;
//# sourceMappingURL=request-logger.middleware.js.map