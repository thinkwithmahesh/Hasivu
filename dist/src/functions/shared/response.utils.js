"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUUID = exports.extractQueryParameter = exports.extractPathParameter = exports.parseRequestBody = exports.handleCorsPrelight = exports.createPaginatedResponse = exports.handleError = exports.createErrorResponse = exports.createSuccessResponse = void 0;
const logger_1 = require("../../utils/logger");
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400'
};
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
function handleError(error, message, statusCode = 500, requestId) {
    logger_1.logger.error(message || 'Unhandled error occurred', {
        error: error.message,
        stack: error.stack,
        requestId,
        statusCode
    });
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = message || (isProduction && statusCode >= 500
        ? 'Internal server error occurred'
        : error.message);
    const mappedStatusCode = mapErrorToStatusCode(error, statusCode);
    return createErrorResponse(mappedStatusCode, errorMessage, isProduction && statusCode >= 500 ? undefined : { stack: error.stack }, getErrorCode(error), requestId);
}
exports.handleError = handleError;
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
function handleCorsPrelight() {
    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: ''
    };
}
exports.handleCorsPrelight = handleCorsPrelight;
function mapErrorToStatusCode(error, defaultCode) {
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes('authentication') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('token')) {
        return 401;
    }
    if (errorMessage.includes('authorization') ||
        errorMessage.includes('access denied') ||
        errorMessage.includes('insufficient permissions') ||
        errorMessage.includes('forbidden')) {
        return 403;
    }
    if (errorMessage.includes('not found') ||
        errorMessage.includes('does not exist')) {
        return 404;
    }
    if (errorMessage.includes('validation') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('required')) {
        return 400;
    }
    if (errorMessage.includes('already exists') ||
        errorMessage.includes('duplicate') ||
        errorMessage.includes('conflict')) {
        return 409;
    }
    if (errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests')) {
        return 429;
    }
    return defaultCode;
}
function getErrorCode(error) {
    if ('code' in error && typeof error.code === 'string') {
        return error.code;
    }
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
function extractQueryParameter(queryStringParameters, paramName, defaultValue) {
    if (!queryStringParameters || !queryStringParameters[paramName]) {
        return defaultValue || null;
    }
    return queryStringParameters[paramName];
}
exports.extractQueryParameter = extractQueryParameter;
function validateUUID(value, paramName = 'ID') {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
        throw new Error(`Invalid ${paramName} format. Must be a valid UUID.`);
    }
}
exports.validateUUID = validateUUID;
//# sourceMappingURL=response.utils.js.map