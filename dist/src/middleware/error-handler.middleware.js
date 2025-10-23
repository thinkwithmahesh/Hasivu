"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCircuitBreakerError = exports.createAuthorizationError = exports.createServiceUnavailableError = exports.createNotFoundError = exports.createValidationError = exports.notFoundHandler = exports.asyncHandler = exports.errorHandler = exports.ErrorType = void 0;
const logger_service_1 = require("../shared/logger.service");
var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION"] = "validation";
    ErrorType["AUTHENTICATION"] = "authentication";
    ErrorType["AUTHORIZATION"] = "authorization";
    ErrorType["NOT_FOUND"] = "not_found";
    ErrorType["RATE_LIMIT"] = "rate_limit";
    ErrorType["SERVICE_UNAVAILABLE"] = "service_unavailable";
    ErrorType["DATABASE"] = "database";
    ErrorType["EXTERNAL_SERVICE"] = "external_service";
    ErrorType["TIMEOUT"] = "timeout";
    ErrorType["INTERNAL"] = "internal";
    ErrorType["CIRCUIT_BREAKER"] = "circuit_breaker";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
const ERROR_PATTERNS = {
    [ErrorType.VALIDATION]: {
        statusCode: 400,
        includeDetails: true,
        logLevel: 'warn',
    },
    [ErrorType.AUTHENTICATION]: {
        statusCode: 401,
        includeDetails: false,
        logLevel: 'warn',
    },
    [ErrorType.AUTHORIZATION]: {
        statusCode: 403,
        includeDetails: false,
        logLevel: 'warn',
    },
    [ErrorType.NOT_FOUND]: {
        statusCode: 404,
        includeDetails: false,
        logLevel: 'info',
    },
    [ErrorType.RATE_LIMIT]: {
        statusCode: 429,
        includeDetails: false,
        logLevel: 'warn',
        includeRetryAfter: true,
    },
    [ErrorType.SERVICE_UNAVAILABLE]: {
        statusCode: 503,
        includeDetails: false,
        logLevel: 'error',
        includeRetryAfter: true,
    },
    [ErrorType.DATABASE]: {
        statusCode: 500,
        includeDetails: false,
        logLevel: 'error',
    },
    [ErrorType.EXTERNAL_SERVICE]: {
        statusCode: 502,
        includeDetails: false,
        logLevel: 'error',
        includeRetryAfter: true,
    },
    [ErrorType.TIMEOUT]: {
        statusCode: 408,
        includeDetails: false,
        logLevel: 'warn',
        includeRetryAfter: true,
    },
    [ErrorType.INTERNAL]: {
        statusCode: 500,
        includeDetails: false,
        logLevel: 'error',
    },
    [ErrorType.CIRCUIT_BREAKER]: {
        statusCode: 503,
        includeDetails: false,
        logLevel: 'warn',
        includeRetryAfter: true,
    },
};
const errorHandler = (error, req, res, next) => {
    const requestId = generateRequestId();
    const errorType = classifyError(error);
    const pattern = ERROR_PATTERNS[errorType];
    const { statusCode } = pattern;
    const degradedServices = getDegradedServices();
    const errorResponse = {
        error: errorType,
        message: getErrorMessage(error, errorType),
        statusCode,
        timestamp: new Date().toISOString(),
        requestId,
        ...(degradedServices.length > 0 && { degradedServices }),
        ...(shouldIncludeDetails(errorType) && { details: getErrorDetails(error) }),
        ...(shouldIncludeRetryAfter(errorType, error) && { retryAfter: getRetryAfter(error) }),
    };
    logError(error, errorType, req, requestId);
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.path}`);
    error.name = 'NotFoundError';
    next(error);
};
exports.notFoundHandler = notFoundHandler;
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function classifyError(error) {
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_FAILED') {
        return ErrorType.VALIDATION;
    }
    if (error.name === 'UnauthorizedError' || error.message?.includes('unauthorized')) {
        return ErrorType.AUTHENTICATION;
    }
    if (error.name === 'ForbiddenError' || error.message?.includes('forbidden')) {
        return ErrorType.AUTHORIZATION;
    }
    if (error.name === 'NotFoundError' || error.statusCode === 404) {
        return ErrorType.NOT_FOUND;
    }
    if (error.name === 'TooManyRequestsError' || error.statusCode === 429) {
        return ErrorType.RATE_LIMIT;
    }
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
        return ErrorType.TIMEOUT;
    }
    if (error.name === 'CircuitBreakerError' || error.message?.includes('circuit breaker')) {
        return ErrorType.CIRCUIT_BREAKER;
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return ErrorType.EXTERNAL_SERVICE;
    }
    if (error.name?.includes('Database') || error.code?.startsWith('P')) {
        return ErrorType.DATABASE;
    }
    return ErrorType.INTERNAL;
}
function getErrorMessage(error, errorType) {
    const baseMessages = {
        [ErrorType.VALIDATION]: 'Validation failed',
        [ErrorType.AUTHENTICATION]: 'Authentication required',
        [ErrorType.AUTHORIZATION]: 'Access denied',
        [ErrorType.NOT_FOUND]: 'Resource not found',
        [ErrorType.RATE_LIMIT]: 'Too many requests',
        [ErrorType.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
        [ErrorType.DATABASE]: 'Database operation failed',
        [ErrorType.EXTERNAL_SERVICE]: 'External service unavailable',
        [ErrorType.TIMEOUT]: 'Request timeout',
        [ErrorType.INTERNAL]: 'Internal server error',
        [ErrorType.CIRCUIT_BREAKER]: 'Service circuit breaker activated',
    };
    if (errorType === ErrorType.VALIDATION && error.message) {
        return error.message;
    }
    if (errorType === ErrorType.RATE_LIMIT) {
        return 'Too many requests. Please try again later.';
    }
    return baseMessages[errorType] || 'An unexpected error occurred';
}
function shouldIncludeDetails(errorType) {
    const pattern = ERROR_PATTERNS[errorType];
    return pattern.includeDetails && process.env.NODE_ENV !== 'production';
}
function getErrorDetails(error) {
    if (error.details)
        return error.details;
    if (error.errors)
        return error.errors;
    if (error.issues)
        return error.issues;
    if (process.env.NODE_ENV === 'development') {
        return {
            stack: error.stack,
            name: error.name,
            code: error.code,
        };
    }
    return undefined;
}
function shouldIncludeRetryAfter(errorType, error) {
    const pattern = ERROR_PATTERNS[errorType];
    return pattern.includeRetryAfter === true;
}
function getRetryAfter(error) {
    if (error.retryAfter)
        return error.retryAfter;
    const defaultRetryAfter = {
        [ErrorType.VALIDATION]: 0,
        [ErrorType.AUTHENTICATION]: 0,
        [ErrorType.AUTHORIZATION]: 0,
        [ErrorType.NOT_FOUND]: 0,
        [ErrorType.RATE_LIMIT]: 60,
        [ErrorType.SERVICE_UNAVAILABLE]: 300,
        [ErrorType.DATABASE]: 60,
        [ErrorType.EXTERNAL_SERVICE]: 120,
        [ErrorType.TIMEOUT]: 30,
        [ErrorType.INTERNAL]: 60,
        [ErrorType.CIRCUIT_BREAKER]: 180,
    };
    return defaultRetryAfter[classifyError(error)] || 60;
}
function getDegradedServices() {
    return [];
}
function logError(error, errorType, req, requestId) {
    const pattern = ERROR_PATTERNS[errorType];
    const { logLevel } = pattern;
    const logData = {
        requestId,
        errorType,
        message: error.message,
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString(),
        ...(error.stack && { stack: error.stack }),
        ...(error.code && { code: error.code }),
    };
    switch (logLevel) {
        case 'error':
            logger_service_1.logger.error('Application error occurred', undefined, logData);
            break;
        case 'warn':
            logger_service_1.logger.warn('Application warning occurred', logData);
            break;
        case 'info':
            logger_service_1.logger.info('Application info event', logData);
            break;
        default:
            logger_service_1.logger.error('Unknown error level', undefined, logData);
    }
}
function createValidationError(message, details) {
    const error = new Error(message);
    error.name = 'ValidationError';
    if (details) {
        error.details = details;
    }
    return error;
}
exports.createValidationError = createValidationError;
function createNotFoundError(resource) {
    const error = new Error(`${resource} not found`);
    error.name = 'NotFoundError';
    return error;
}
exports.createNotFoundError = createNotFoundError;
function createServiceUnavailableError(service, retryAfter) {
    const error = new Error(`${service} service is temporarily unavailable`);
    error.name = 'ServiceUnavailableError';
    if (retryAfter) {
        error.retryAfter = retryAfter;
    }
    return error;
}
exports.createServiceUnavailableError = createServiceUnavailableError;
function createAuthorizationError(message = 'Access denied') {
    const error = new Error(message);
    error.name = 'ForbiddenError';
    return error;
}
exports.createAuthorizationError = createAuthorizationError;
function createCircuitBreakerError(service) {
    const error = new Error(`Circuit breaker activated for ${service}`);
    error.name = 'CircuitBreakerError';
    return error;
}
exports.createCircuitBreakerError = createCircuitBreakerError;
//# sourceMappingURL=error-handler.middleware.js.map