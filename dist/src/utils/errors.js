"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = exports.getErrorMessage = exports.handleError = exports.isOperationalError = exports.Logger = exports.BusinessLogicError = exports.AuthorizationError = exports.AuthenticationError = exports.RateLimitError = exports.PaymentError = exports.ExternalServiceError = exports.DatabaseError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    constructor(message, statusCode = 500, isOperationalOrCode, code) {
        super(message);
        this.statusCode = statusCode;
        if (typeof isOperationalOrCode === 'boolean') {
            this.isOperational = isOperationalOrCode;
            this.code = code;
        }
        else if (typeof isOperationalOrCode === 'string') {
            this.code = isOperationalOrCode;
            this.isOperational = true;
        }
        else {
            this.isOperational = true;
            this.code = code;
        }
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, code = 'VALIDATION_ERROR') {
        super(message, 400, code);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(resource = 'Resource', code = 'NOT_FOUND') {
        super(`${resource} not found`, 404, code);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
        super(message, 401, code);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', code = 'FORBIDDEN') {
        super(message, 403, code);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message, code = 'CONFLICT') {
        super(message, 409, code);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
exports.ConflictError = ConflictError;
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', code = 'DATABASE_ERROR') {
        super(message, 500, code);
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends AppError {
    constructor(service, message, code = 'EXTERNAL_SERVICE_ERROR') {
        super(message || `${service} service error`, 502, code);
        Object.setPrototypeOf(this, ExternalServiceError.prototype);
    }
}
exports.ExternalServiceError = ExternalServiceError;
class PaymentError extends AppError {
    constructor(message, code = 'PAYMENT_ERROR') {
        super(message, 402, code);
        Object.setPrototypeOf(this, PaymentError.prototype);
    }
}
exports.PaymentError = PaymentError;
class RateLimitError extends AppError {
    constructor(message = 'Too many requests', code = 'RATE_LIMIT_EXCEEDED') {
        super(message, 429, code);
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}
exports.RateLimitError = RateLimitError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed', code = 'AUTHENTICATION_ERROR') {
        super(message, 401, code);
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Authorization failed', code = 'AUTHORIZATION_ERROR') {
        super(message, 403, code);
        Object.setPrototypeOf(this, AuthorizationError.prototype);
    }
}
exports.AuthorizationError = AuthorizationError;
class BusinessLogicError extends AppError {
    constructor(message, code = 'BUSINESS_LOGIC_ERROR') {
        super(message, 400, code);
        Object.setPrototypeOf(this, BusinessLogicError.prototype);
    }
}
exports.BusinessLogicError = BusinessLogicError;
class Logger {
    static error(error, context) {
        if (error instanceof AppError) {
            console.error({
                message: error.message,
                statusCode: error.statusCode,
                code: error.code,
                isOperational: error.isOperational,
                stack: error.stack,
                context,
            });
        }
        else {
            console.error({
                message: error.message,
                stack: error.stack,
                context,
            });
        }
    }
}
exports.Logger = Logger;
function isOperationalError(error) {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}
exports.isOperationalError = isOperationalError;
function handleError(error) {
    if (error instanceof AppError) {
        return {
            statusCode: error.statusCode,
            message: error.message,
            code: error.code,
        };
    }
    return {
        statusCode: 500,
        message: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
    };
}
exports.handleError = handleError;
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unknown error occurred';
}
exports.getErrorMessage = getErrorMessage;
function createErrorResponse(error, statusCode) {
    if (error instanceof AppError) {
        return {
            statusCode: error.statusCode,
            message: error.message,
            code: error.code,
        };
    }
    const message = getErrorMessage(error);
    return {
        statusCode: statusCode || 500,
        message,
        code: 'ERROR',
    };
}
exports.createErrorResponse = createErrorResponse;
//# sourceMappingURL=errors.js.map