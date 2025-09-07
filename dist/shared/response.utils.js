"use strict";
/**
 * Response utilities for Lambda functions
 * Provides standardized HTTP response helpers for AWS Lambda API Gateway
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.createInternalServerErrorResponse = exports.createTooManyRequestsResponse = exports.createConflictResponse = exports.createMethodNotAllowedResponse = exports.createNotFoundResponse = exports.createForbiddenResponse = exports.createUnauthorizedResponse = exports.createValidationErrorResponse = exports.createErrorResponse = exports.createSuccessResponse = void 0;
/**
 * Create standard CORS headers
 */
const getCorsHeaders = () => ({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
});
/**
 * Create a successful response
 */
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
/**
 * Create an error response
 */
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
/**
 * Create a validation error response
 */
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
/**
 * Create an unauthorized response
 */
const createUnauthorizedResponse = (message = 'Unauthorized') => {
    return (0, exports.createErrorResponse)(message, 401, 'UNAUTHORIZED');
};
exports.createUnauthorizedResponse = createUnauthorizedResponse;
/**
 * Create a forbidden response
 */
const createForbiddenResponse = (message = 'Forbidden') => {
    return (0, exports.createErrorResponse)(message, 403, 'FORBIDDEN');
};
exports.createForbiddenResponse = createForbiddenResponse;
/**
 * Create a not found response
 */
const createNotFoundResponse = (resource = 'Resource') => {
    return (0, exports.createErrorResponse)(`${resource} not found`, 404, 'NOT_FOUND');
};
exports.createNotFoundResponse = createNotFoundResponse;
/**
 * Create a method not allowed response
 */
const createMethodNotAllowedResponse = (method) => {
    return (0, exports.createErrorResponse)(`Method ${method} not allowed`, 405, 'METHOD_NOT_ALLOWED');
};
exports.createMethodNotAllowedResponse = createMethodNotAllowedResponse;
/**
 * Create a conflict response
 */
const createConflictResponse = (message) => {
    return (0, exports.createErrorResponse)(message, 409, 'CONFLICT');
};
exports.createConflictResponse = createConflictResponse;
/**
 * Create a too many requests response
 */
const createTooManyRequestsResponse = (message = 'Too many requests') => {
    return (0, exports.createErrorResponse)(message, 429, 'TOO_MANY_REQUESTS');
};
exports.createTooManyRequestsResponse = createTooManyRequestsResponse;
/**
 * Create an internal server error response
 */
const createInternalServerErrorResponse = (message = 'Internal server error') => {
    return (0, exports.createErrorResponse)(message, 500, 'INTERNAL_SERVER_ERROR');
};
exports.createInternalServerErrorResponse = createInternalServerErrorResponse;
/**
 * Generic error handler for Lambda functions
 */
const handleError = (error, defaultMessage = 'An error occurred') => {
    const message = error instanceof Error ? error.message : defaultMessage;
    const statusCode = error.statusCode || error.status || 500;
    const code = error.code || 'INTERNAL_SERVER_ERROR';
    return (0, exports.createErrorResponse)(message, statusCode, code);
};
exports.handleError = handleError;
