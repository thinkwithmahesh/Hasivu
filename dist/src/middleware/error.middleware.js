"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installGlobalErrorHandlers = exports.unhandledRejectionHandler = exports.uncaughtExceptionHandler = exports.transformDatabaseError = exports.validationErrorHandler = exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.createDatabaseError = exports.createConflictError = exports.createServiceUnavailableError = exports.createRateLimitError = exports.createAuthorizationError = exports.createAuthenticationError = exports.createNotFoundError = exports.createValidationError = exports.createError = exports.ErrorCodes = void 0;
const logger_1 = require("../utils/logger");
const environment_1 = require("../config/environment");
exports.ErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
    RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};
function createError(code, message, statusCode = 500, details) {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    error.details = details;
    error.isOperational = true;
    return error;
}
exports.createError = createError;
function createValidationError(message, details) {
    return createError(exports.ErrorCodes.VALIDATION_ERROR, message, 400, details);
}
exports.createValidationError = createValidationError;
function createNotFoundError(resource, identifier) {
    const message = identifier
        ? `${resource} with identifier '${identifier}' not found`
        : `${resource} not found`;
    return createError(exports.ErrorCodes.NOT_FOUND, message, 404);
}
exports.createNotFoundError = createNotFoundError;
function createAuthenticationError(message = 'Authentication required') {
    return createError(exports.ErrorCodes.AUTHENTICATION_ERROR, message, 401);
}
exports.createAuthenticationError = createAuthenticationError;
function createAuthorizationError(message = 'Access denied') {
    return createError(exports.ErrorCodes.AUTHORIZATION_ERROR, message, 403);
}
exports.createAuthorizationError = createAuthorizationError;
function createRateLimitError(message = 'Too many requests') {
    return createError(exports.ErrorCodes.RATE_LIMIT_EXCEEDED, message, 429);
}
exports.createRateLimitError = createRateLimitError;
function createServiceUnavailableError(message = 'Service temporarily unavailable') {
    return createError(exports.ErrorCodes.SERVICE_UNAVAILABLE, message, 503);
}
exports.createServiceUnavailableError = createServiceUnavailableError;
function createConflictError(message = 'Resource already exists') {
    return createError(exports.ErrorCodes.RESOURCE_CONFLICT, message, 409);
}
exports.createConflictError = createConflictError;
function createDatabaseError(message, details) {
    return createError(exports.ErrorCodes.DATABASE_ERROR, message, 500, details);
}
exports.createDatabaseError = createDatabaseError;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const errorCode = err.code || exports.ErrorCodes.INTERNAL_ERROR;
    const message = err.message || 'Internal server error';
    const isProduction = environment_1.config.server.nodeEnv === 'production';
    const requestId = req.headers['x-request-id'] || generateRequestId();
    logError(err, req, requestId);
    const errorResponse = {
        success: false,
        error: {
            code: errorCode,
            message: isProduction && statusCode >= 500 ? 'Internal server error' : message,
            timestamp: new Date().toISOString(),
            requestId,
            path: req.path,
            ...(shouldIncludeDetails(statusCode, isProduction) && { details: err.details })
        }
    };
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    const error = createNotFoundError('Route', `${req.method} ${req.originalUrl}`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function shouldIncludeDetails(statusCode, isProduction) {
    if (isProduction && statusCode >= 500) {
        return false;
    }
    return true;
}
function logError(err, req, requestId) {
    const logData = {
        requestId,
        error: {
            name: err.name,
            message: err.message,
            code: err.code,
            statusCode: err.statusCode,
            stack: err.stack,
            details: err.details
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            headers: req.headers,
            body: req.body,
            query: req.query,
            params: req.params,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        },
        timestamp: new Date().toISOString()
    };
    if (err.statusCode && err.statusCode < 500) {
        logger_1.logger.warn('Client error occurred', logData);
    }
    else {
        logger_1.logger.error('Server error occurred', logData);
    }
}
const validationErrorHandler = (req, res, next) => {
    next();
};
exports.validationErrorHandler = validationErrorHandler;
const transformDatabaseError = (error) => {
    if (error.code === 'P2002') {
        return createError(exports.ErrorCodes.DUPLICATE_RESOURCE, 'Resource already exists', 409, { field: error.meta?.target });
    }
    if (error.code === 'P2025') {
        return createNotFoundError('Resource');
    }
    if (error.code === 'P2003') {
        return createError(exports.ErrorCodes.RESOURCE_CONFLICT, 'Cannot perform operation due to related data', 409);
    }
    return createDatabaseError('Database operation failed', {
        originalError: error.message,
        code: error.code
    });
};
exports.transformDatabaseError = transformDatabaseError;
const uncaughtExceptionHandler = (error) => {
    logger_1.logger.error('Uncaught Exception', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
    process.exit(1);
};
exports.uncaughtExceptionHandler = uncaughtExceptionHandler;
const unhandledRejectionHandler = (reason, promise) => {
    logger_1.logger.error('Unhandled Promise Rejection', {
        reason: reason.toString(),
        stack: reason.stack,
        promise: promise.toString(),
        timestamp: new Date().toISOString()
    });
    process.exit(1);
};
exports.unhandledRejectionHandler = unhandledRejectionHandler;
const installGlobalErrorHandlers = () => {
    process.on('uncaughtException', exports.uncaughtExceptionHandler);
    process.on('unhandledRejection', exports.unhandledRejectionHandler);
    process.on('SIGTERM', () => {
        logger_1.logger.info('SIGTERM received, shutting down gracefully');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        logger_1.logger.info('SIGINT received, shutting down gracefully');
        process.exit(0);
    });
};
exports.installGlobalErrorHandlers = installGlobalErrorHandlers;
//# sourceMappingURL=error.middleware.js.map