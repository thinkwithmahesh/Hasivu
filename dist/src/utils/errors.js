"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = exports.getErrorMessage = exports.isOperationalError = exports.RateLimitError = exports.DatabaseError = exports.ExternalServiceError = exports.BusinessLogicError = exports.AuthorizationError = exports.AuthenticationError = exports.ConflictError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    field;
    constructor(message, field) {
        super(message, 400);
        this.field = field;
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    resourceType;
    resourceId;
    constructor(resourceType, resourceId) {
        const message = resourceId
            ? `${resourceType} with ID '${resourceId}' not found`
            : `${resourceType} not found`;
        super(message, 404);
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    conflictType;
    constructor(message, conflictType = 'resource') {
        super(message, 409);
        this.conflictType = conflictType;
    }
}
exports.ConflictError = ConflictError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    requiredPermission;
    constructor(message = 'Insufficient permissions', requiredPermission) {
        super(message, 403);
        this.requiredPermission = requiredPermission;
    }
}
exports.AuthorizationError = AuthorizationError;
class BusinessLogicError extends AppError {
    ruleType;
    constructor(message, ruleType = 'general') {
        super(message, 422);
        this.ruleType = ruleType;
    }
}
exports.BusinessLogicError = BusinessLogicError;
class ExternalServiceError extends AppError {
    service;
    originalError;
    constructor(service, message, originalError) {
        super(`${service} service error: ${message}`, 502);
        this.service = service;
        this.originalError = originalError;
    }
}
exports.ExternalServiceError = ExternalServiceError;
class DatabaseError extends AppError {
    operation;
    originalError;
    constructor(operation, message, originalError) {
        super(`Database ${operation} error: ${message}`, 500);
        this.operation = operation;
        this.originalError = originalError;
    }
}
exports.DatabaseError = DatabaseError;
class RateLimitError extends AppError {
    retryAfter;
    constructor(message = 'Rate limit exceeded', retryAfter) {
        super(message, 429);
        this.retryAfter = retryAfter;
    }
}
exports.RateLimitError = RateLimitError;
function isOperationalError(error) {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}
exports.isOperationalError = isOperationalError;
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'Unknown error occurred';
}
exports.getErrorMessage = getErrorMessage;
function createErrorResponse(error) {
    const isAppError = error instanceof AppError;
    return {
        error: {
            name: error.name,
            message: error.message,
            statusCode: isAppError ? error.statusCode : 500,
            ...(isAppError && {
                isOperational: error.isOperational,
                ...(error instanceof ValidationError && error.field && { field: error.field }),
                ...(error instanceof NotFoundError && {
                    resourceType: error.resourceType,
                    resourceId: error.resourceId
                }),
                ...(error instanceof ConflictError && { conflictType: error.conflictType }),
                ...(error instanceof AuthorizationError && error.requiredPermission && {
                    requiredPermission: error.requiredPermission
                }),
                ...(error instanceof BusinessLogicError && { ruleType: error.ruleType }),
                ...(error instanceof ExternalServiceError && { service: error.service }),
                ...(error instanceof DatabaseError && { operation: error.operation }),
                ...(error instanceof RateLimitError && error.retryAfter && { retryAfter: error.retryAfter })
            })
        }
    };
}
exports.createErrorResponse = createErrorResponse;
//# sourceMappingURL=errors.js.map