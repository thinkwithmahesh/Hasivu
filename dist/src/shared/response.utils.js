"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = exports.createSuccessResponse = exports.handleError = exports.serverErrorResponse = exports.unauthorizedResponse = exports.notFoundResponse = exports.validationErrorResponse = exports.errorResponse = exports.successResponse = void 0;
function successResponse(data, statusCode = 200) {
    const response = {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
        },
    };
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify(response),
    };
}
exports.successResponse = successResponse;
function errorResponse(code, message, statusCode = 400, details) {
    const response = {
        success: false,
        error: {
            code,
            message,
            details,
        },
        meta: {
            timestamp: new Date().toISOString(),
        },
    };
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify(response),
    };
}
exports.errorResponse = errorResponse;
function validationErrorResponse(message, details) {
    return errorResponse('VALIDATION_ERROR', message, 400, details);
}
exports.validationErrorResponse = validationErrorResponse;
function notFoundResponse(resource = 'Resource') {
    return errorResponse('NOT_FOUND', `${resource} not found`, 404);
}
exports.notFoundResponse = notFoundResponse;
function unauthorizedResponse(message = 'Unauthorized') {
    return errorResponse('UNAUTHORIZED', message, 401);
}
exports.unauthorizedResponse = unauthorizedResponse;
function serverErrorResponse(error) {
    return errorResponse('INTERNAL_SERVER_ERROR', error.message || 'An unexpected error occurred', 500, process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined);
}
exports.serverErrorResponse = serverErrorResponse;
function handleError(error, message, statusCode, requestId) {
    if (error instanceof Error) {
        return serverErrorResponse(error);
    }
    return errorResponse('UNKNOWN_ERROR', message || 'An unknown error occurred', statusCode || 500);
}
exports.handleError = handleError;
exports.createSuccessResponse = successResponse;
exports.createErrorResponse = errorResponse;
//# sourceMappingURL=response.utils.js.map