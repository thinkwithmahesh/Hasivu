"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.createInternalServerErrorResponse = exports.createTooManyRequestsResponse = exports.createConflictResponse = exports.createMethodNotAllowedResponse = exports.createNotFoundResponse = exports.createForbiddenResponse = exports.createUnauthorizedResponse = exports.createValidationErrorResponse = exports.createErrorResponse = exports.createSuccessResponse = void 0;
const getCorsHeaders = () => ({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
});
const createSuccessResponse = (response, statusCode = 200) => {
    const body = {
        ...response,
        timestamp: new Date().toISOString()
    };
    return {
        statusCode,
        headers: getCorsHeaders(),
        body: JSON.stringify(body)
    };
};
exports.createSuccessResponse = createSuccessResponse;
const createErrorResponse = (message, statusCode = 400, code) => {
    const body = {
        error: message,
        code: code,
        timestamp: new Date().toISOString()
    };
    return {
        statusCode,
        headers: getCorsHeaders(),
        body: JSON.stringify(body)
    };
};
exports.createErrorResponse = createErrorResponse;
const createValidationErrorResponse = (errors, statusCode = 400) => {
    const body = {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        data: {
            errors: errors
        },
        timestamp: new Date().toISOString()
    };
    return {
        statusCode,
        headers: getCorsHeaders(),
        body: JSON.stringify(body)
    };
};
exports.createValidationErrorResponse = createValidationErrorResponse;
const createUnauthorizedResponse = (message = 'Unauthorized') => {
    return (0, exports.createErrorResponse)(message, 401, 'UNAUTHORIZED');
};
exports.createUnauthorizedResponse = createUnauthorizedResponse;
const createForbiddenResponse = (message = 'Forbidden') => {
    return (0, exports.createErrorResponse)(message, 403, 'FORBIDDEN');
};
exports.createForbiddenResponse = createForbiddenResponse;
const createNotFoundResponse = (resource = 'Resource') => {
    return (0, exports.createErrorResponse)(`${resource} not found`, 404, 'NOT_FOUND');
};
exports.createNotFoundResponse = createNotFoundResponse;
const createMethodNotAllowedResponse = (method) => {
    return (0, exports.createErrorResponse)(`Method ${method} not allowed`, 405, 'METHOD_NOT_ALLOWED');
};
exports.createMethodNotAllowedResponse = createMethodNotAllowedResponse;
const createConflictResponse = (message) => {
    return (0, exports.createErrorResponse)(message, 409, 'CONFLICT');
};
exports.createConflictResponse = createConflictResponse;
const createTooManyRequestsResponse = (message = 'Too many requests') => {
    return (0, exports.createErrorResponse)(message, 429, 'TOO_MANY_REQUESTS');
};
exports.createTooManyRequestsResponse = createTooManyRequestsResponse;
const createInternalServerErrorResponse = (message = 'Internal server error') => {
    return (0, exports.createErrorResponse)(message, 500, 'INTERNAL_SERVER_ERROR');
};
exports.createInternalServerErrorResponse = createInternalServerErrorResponse;
const handleError = (error, defaultMessage = 'An error occurred') => {
    const message = error instanceof Error ? error.message : defaultMessage;
    const statusCode = error.statusCode || error.status || 500;
    const code = error.code || 'INTERNAL_SERVER_ERROR';
    return (0, exports.createErrorResponse)(message, statusCode, code);
};
exports.handleError = handleError;
//# sourceMappingURL=response.utils.js.map