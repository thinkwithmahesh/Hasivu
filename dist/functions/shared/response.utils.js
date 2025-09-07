"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUUID = exports.extractQueryParameter = exports.extractPathParameter = exports.parseRequestBody = exports.handleCorsPrelight = exports.createPaginatedResponse = exports.handleError = exports.createErrorResponse = exports.createSuccessResponse = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Common CORS headers
 */
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400'
};
/**
 * Create standardized success response
 */
function createSuccessResponse(data, message, statusCode = 200, requestId) {
    const response = {
        success: true,
        data,
        message,
        meta: {
            timestamp: new Date().toISOString(),
            requestId
        }
    };
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS
        },
        body: JSON.stringify(response)
    };
}
exports.createSuccessResponse = createSuccessResponse;
/**
 * Create standardized error response
 */
function createErrorResponse(statusCode, message, details, code, requestId) {
    const response = {
        success: false,
        error: message,
        message,
        code,
        details,
        meta: {
            timestamp: new Date().toISOString(),
            requestId
        }
    };
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS
        },
        body: JSON.stringify(response)
    };
}
exports.createErrorResponse = createErrorResponse;
/**
 * Handle errors with proper logging and response formatting
 */
function handleError(error, message, statusCode = 500, requestId) {
    // Log the error
    logger_1.logger.error(message || 'Unhandled error occurred', {
        error: error.message,
        stack: error.stack,
        requestId,
        statusCode
    });
    // Determine error message based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = message || (isProduction && statusCode >= 500
        ? 'Internal server error occurred'
        : error.message);
    // Map common error patterns to appropriate status codes
    const mappedStatusCode = mapErrorToStatusCode(error, statusCode);
    return createErrorResponse(mappedStatusCode, errorMessage, isProduction && statusCode >= 500 ? undefined : { stack: error.stack }, getErrorCode(error), requestId);
}
exports.handleError = handleError;
/**
 * Create paginated response
 */
function createPaginatedResponse(items, total, page, limit, requestId, additional) {
    const totalPages = Math.ceil(total / limit);
    const response = {
        success: true,
        data: items,
        meta: {
            timestamp: new Date().toISOString(),
            requestId,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        },
        ...additional
    };
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS
        },
        body: JSON.stringify(response)
    };
}
exports.createPaginatedResponse = createPaginatedResponse;
/**
 * Handle CORS preflight requests
 */
function handleCorsPrelight() {
    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: ''
    };
}
exports.handleCorsPrelight = handleCorsPrelight;
/**
 * Map error types to appropriate status codes
 */
function mapErrorToStatusCode(error, defaultCode) {
    const errorMessage = error.message.toLowerCase();
    // Authentication errors
    if (errorMessage.includes('authentication') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('token')) {
        return 401;
    }
    // Authorization errors
    if (errorMessage.includes('authorization') ||
        errorMessage.includes('access denied') ||
        errorMessage.includes('insufficient permissions') ||
        errorMessage.includes('forbidden')) {
        return 403;
    }
    // Not found errors
    if (errorMessage.includes('not found') ||
        errorMessage.includes('does not exist')) {
        return 404;
    }
    // Validation errors
    if (errorMessage.includes('validation') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('required')) {
        return 400;
    }
    // Conflict errors
    if (errorMessage.includes('already exists') ||
        errorMessage.includes('duplicate') ||
        errorMessage.includes('conflict')) {
        return 409;
    }
    // Rate limiting errors
    if (errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests')) {
        return 429;
    }
    // Use default or provided status code
    return defaultCode;
}
/**
 * Get error code from error object or generate from message
 */
function getErrorCode(error) {
    // Check if error object has a code property
    if ('code' in error && typeof error.code === 'string') {
        return error.code;
    }
    // Generate code from error message
    const message = error.message.toLowerCase();
    if (message.includes('validation'))
        return 'VALIDATION_ERROR';
    if (message.includes('authentication'))
        return 'AUTHENTICATION_ERROR';
    if (message.includes('authorization') || message.includes('access denied'))
        return 'AUTHORIZATION_ERROR';
    if (message.includes('not found'))
        return 'NOT_FOUND';
    if (message.includes('already exists'))
        return 'DUPLICATE_ERROR';
    if (message.includes('rate limit'))
        return 'RATE_LIMIT_EXCEEDED';
    if (message.includes('timeout'))
        return 'TIMEOUT_ERROR';
    if (message.includes('connection'))
        return 'CONNECTION_ERROR';
    return 'INTERNAL_ERROR';
}
/**
 * Get error code from HTTP status code
 */
function getErrorCodeFromStatus(statusCode) {
    const statusMap = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        422: 'UNPROCESSABLE_ENTITY',
        429: 'RATE_LIMIT_EXCEEDED',
        500: 'INTERNAL_ERROR',
        502: 'BAD_GATEWAY',
        503: 'SERVICE_UNAVAILABLE',
        504: 'GATEWAY_TIMEOUT'
    };
    return statusMap[statusCode] || 'UNKNOWN_ERROR';
}
/**
 * Validate request body and parse JSON
 */
function parseRequestBody(body, required = true) {
    if (!body) {
        if (required) {
            throw new Error('Request body is required');
        }
        return {};
    }
    try {
        return JSON.parse(body);
    }
    catch (error) {
        throw new Error('Invalid JSON in request body');
    }
}
exports.parseRequestBody = parseRequestBody;
/**
 * Extract and validate path parameters
 */
function extractPathParameter(pathParameters, paramName, required = true) {
    if (!pathParameters || !pathParameters[paramName]) {
        if (required) {
            throw new Error(`Path parameter '${paramName}' is required`);
        }
        return null;
    }
    return pathParameters[paramName];
}
exports.extractPathParameter = extractPathParameter;
/**
 * Extract and validate query parameters
 */
function extractQueryParameter(queryStringParameters, paramName, defaultValue) {
    if (!queryStringParameters || !queryStringParameters[paramName]) {
        return defaultValue || null;
    }
    return queryStringParameters[paramName];
}
exports.extractQueryParameter = extractQueryParameter;
/**
 * Validate UUID format
 */
function validateUUID(value, paramName = 'ID') {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
        throw new Error(`Invalid ${paramName} format. Must be a valid UUID.`);
    }
}
exports.validateUUID = validateUUID;
