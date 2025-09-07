"use strict";
/**
 * HASIVU Platform - Standardized API Response Utilities
 * Production-ready response formatting for REST APIs with consistent structure
 * Provides unified success/error response patterns with proper HTTP status codes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMapper = exports.responseFormatterMiddleware = exports.PaginationUtil = exports.LambdaResponseHelper = exports.ExpressResponseHelper = exports.ResponseUtil = exports.HttpStatusCode = void 0;
const logger_1 = require("./logger");
/**
 * HTTP Status codes enum for type safety
 */
var HttpStatusCode;
(function (HttpStatusCode) {
    // Success
    HttpStatusCode[HttpStatusCode["OK"] = 200] = "OK";
    HttpStatusCode[HttpStatusCode["CREATED"] = 201] = "CREATED";
    HttpStatusCode[HttpStatusCode["ACCEPTED"] = 202] = "ACCEPTED";
    HttpStatusCode[HttpStatusCode["NO_CONTENT"] = 204] = "NO_CONTENT";
    // Redirection
    HttpStatusCode[HttpStatusCode["MOVED_PERMANENTLY"] = 301] = "MOVED_PERMANENTLY";
    HttpStatusCode[HttpStatusCode["FOUND"] = 302] = "FOUND";
    HttpStatusCode[HttpStatusCode["NOT_MODIFIED"] = 304] = "NOT_MODIFIED";
    // Client Error
    HttpStatusCode[HttpStatusCode["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HttpStatusCode[HttpStatusCode["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HttpStatusCode[HttpStatusCode["FORBIDDEN"] = 403] = "FORBIDDEN";
    HttpStatusCode[HttpStatusCode["NOT_FOUND"] = 404] = "NOT_FOUND";
    HttpStatusCode[HttpStatusCode["METHOD_NOT_ALLOWED"] = 405] = "METHOD_NOT_ALLOWED";
    HttpStatusCode[HttpStatusCode["CONFLICT"] = 409] = "CONFLICT";
    HttpStatusCode[HttpStatusCode["UNPROCESSABLE_ENTITY"] = 422] = "UNPROCESSABLE_ENTITY";
    HttpStatusCode[HttpStatusCode["TOO_MANY_REQUESTS"] = 429] = "TOO_MANY_REQUESTS";
    // Server Error
    HttpStatusCode[HttpStatusCode["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    HttpStatusCode[HttpStatusCode["NOT_IMPLEMENTED"] = 501] = "NOT_IMPLEMENTED";
    HttpStatusCode[HttpStatusCode["BAD_GATEWAY"] = 502] = "BAD_GATEWAY";
    HttpStatusCode[HttpStatusCode["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
    HttpStatusCode[HttpStatusCode["GATEWAY_TIMEOUT"] = 504] = "GATEWAY_TIMEOUT";
})(HttpStatusCode || (exports.HttpStatusCode = HttpStatusCode = {}));
/**
 * Response utility class with static methods
 */
class ResponseUtil {
    /**
     * Generate request ID for response tracking
     */
    static generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Create standardized success response
     */
    static success(message = 'Success', data, meta, requestId) {
        return {
            success: true,
            message,
            data,
            meta,
            timestamp: new Date().toISOString(),
            requestId: requestId || this.generateRequestId()
        };
    }
    /**
     * Create standardized error response
     */
    static error(message, code = 'GENERIC_ERROR', details, requestId) {
        return {
            success: false,
            message,
            error: {
                code,
                message,
                details
            },
            timestamp: new Date().toISOString(),
            requestId: requestId || this.generateRequestId()
        };
    }
    /**
     * Create validation error response
     */
    static validationError(message = 'Validation failed', errors, requestId) {
        return {
            success: false,
            message,
            error: {
                code: 'VALIDATION_ERROR',
                message,
                validation: errors
            },
            timestamp: new Date().toISOString(),
            requestId: requestId || this.generateRequestId()
        };
    }
    /**
     * Create paginated list response
     */
    static paginatedList(items, pagination, message = 'List retrieved successfully', requestId) {
        return {
            success: true,
            message,
            data: {
                items,
                pagination
            },
            timestamp: new Date().toISOString(),
            requestId: requestId || this.generateRequestId()
        };
    }
    /**
     * Create no content response (204)
     */
    static noContent(message = 'No content', requestId) {
        return {
            success: true,
            message,
            timestamp: new Date().toISOString(),
            requestId: requestId || this.generateRequestId()
        };
    }
}
exports.ResponseUtil = ResponseUtil;
/**
 * Express response helper functions
 */
class ExpressResponseHelper {
    /**
     * Send success response with proper status code
     */
    static sendSuccess(res, data, message = 'Success', statusCode = HttpStatusCode.OK, meta) {
        const requestId = res.locals.requestId || res.get('X-Request-ID');
        const response = ResponseUtil.success(message, data, meta, requestId);
        logger_1.logger.debug('Sending success response', {
            statusCode,
            requestId,
            hasData: !!data,
            meta
        });
        return res.status(statusCode).json(response);
    }
    /**
     * Send error response with proper status code
     */
    static sendError(res, message, statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR, code = 'GENERIC_ERROR', details) {
        const requestId = res.locals.requestId || res.get('X-Request-ID');
        const response = ResponseUtil.error(message, code, details, requestId);
        logger_1.logger.error('Sending error response', {
            statusCode,
            code,
            message,
            details,
            requestId
        });
        return res.status(statusCode).json(response);
    }
    /**
     * Send validation error response
     */
    static sendValidationError(res, errors, message = 'Validation failed') {
        const requestId = res.locals.requestId || res.get('X-Request-ID');
        const response = ResponseUtil.validationError(message, errors, requestId);
        logger_1.logger.warn('Sending validation error response', {
            message,
            errors,
            requestId
        });
        return res.status(HttpStatusCode.UNPROCESSABLE_ENTITY).json(response);
    }
    /**
     * Send paginated list response
     */
    static sendPaginatedList(res, items, pagination, message = 'List retrieved successfully') {
        const requestId = res.locals.requestId || res.get('X-Request-ID');
        const response = ResponseUtil.paginatedList(items, pagination, message, requestId);
        // Add pagination headers
        res.set({
            'X-Total-Count': pagination.totalItems.toString(),
            'X-Page-Count': pagination.totalPages.toString(),
            'X-Current-Page': pagination.currentPage.toString(),
            'X-Items-Per-Page': pagination.itemsPerPage.toString()
        });
        logger_1.logger.debug('Sending paginated list response', {
            itemCount: items.length,
            pagination,
            requestId
        });
        return res.status(HttpStatusCode.OK).json(response);
    }
    /**
     * Send no content response (204)
     */
    static sendNoContent(res, message = 'No content') {
        const requestId = res.locals.requestId || res.get('X-Request-ID');
        const response = ResponseUtil.noContent(message, requestId);
        logger_1.logger.debug('Sending no content response', { requestId });
        return res.status(HttpStatusCode.NO_CONTENT).json(response);
    }
    /**
     * Send created response (201)
     */
    static sendCreated(res, data, message = 'Resource created successfully') {
        return this.sendSuccess(res, data, message, HttpStatusCode.CREATED);
    }
    /**
     * Send accepted response (202)
     */
    static sendAccepted(res, data, message = 'Request accepted for processing') {
        return this.sendSuccess(res, data, message, HttpStatusCode.ACCEPTED);
    }
    /**
     * Send not found error response
     */
    static sendNotFound(res, message = 'Resource not found', resourceType) {
        const code = resourceType ? `${resourceType.toUpperCase()}_NOT_FOUND` : 'NOT_FOUND';
        return this.sendError(res, message, HttpStatusCode.NOT_FOUND, code);
    }
    /**
     * Send unauthorized error response
     */
    static sendUnauthorized(res, message = 'Authentication required') {
        return this.sendError(res, message, HttpStatusCode.UNAUTHORIZED, 'UNAUTHORIZED');
    }
    /**
     * Send forbidden error response
     */
    static sendForbidden(res, message = 'Access forbidden') {
        return this.sendError(res, message, HttpStatusCode.FORBIDDEN, 'FORBIDDEN');
    }
    /**
     * Send conflict error response
     */
    static sendConflict(res, message = 'Resource conflict', details) {
        return this.sendError(res, message, HttpStatusCode.CONFLICT, 'CONFLICT', details);
    }
    /**
     * Send rate limit error response
     */
    static sendRateLimit(res, retryAfter, message = 'Rate limit exceeded') {
        res.set('Retry-After', retryAfter.toString());
        return this.sendError(res, message, HttpStatusCode.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    }
    /**
     * Send internal server error response
     */
    static sendInternalError(res, message = 'Internal server error', error) {
        const details = error ? {
            name: error.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } : undefined;
        return this.sendError(res, message, HttpStatusCode.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR', details);
    }
}
exports.ExpressResponseHelper = ExpressResponseHelper;
/**
 * Lambda response helper functions
 */
class LambdaResponseHelper {
    /**
     * Create Lambda success response
     */
    static success(data, message = 'Success', statusCode = HttpStatusCode.OK, headers) {
        const response = ResponseUtil.success(message, data);
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                ...headers
            },
            body: JSON.stringify(response)
        };
    }
    /**
     * Create Lambda error response
     */
    static error(message, statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR, code = 'GENERIC_ERROR', details, headers) {
        const response = ResponseUtil.error(message, code, details);
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                ...headers
            },
            body: JSON.stringify(response)
        };
    }
    /**
     * Create Lambda validation error response
     */
    static validationError(errors, message = 'Validation failed', headers) {
        const response = ResponseUtil.validationError(message, errors);
        return {
            statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                ...headers
            },
            body: JSON.stringify(response)
        };
    }
}
exports.LambdaResponseHelper = LambdaResponseHelper;
/**
 * Pagination utility functions
 */
class PaginationUtil {
    /**
     * Calculate pagination metadata
     */
    static calculatePagination(totalItems, currentPage = 1, itemsPerPage = 10) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const hasNextPage = currentPage < totalPages;
        const hasPreviousPage = currentPage > 1;
        return {
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage,
            hasNextPage,
            hasPreviousPage,
            nextPage: hasNextPage ? currentPage + 1 : undefined,
            previousPage: hasPreviousPage ? currentPage - 1 : undefined
        };
    }
    /**
     * Calculate offset for database queries
     */
    static calculateOffset(page = 1, limit = 10) {
        return (page - 1) * limit;
    }
    /**
     * Validate pagination parameters
     */
    static validatePaginationParams(page, limit, maxLimit = 100) {
        const errors = [];
        let validatedPage = 1;
        let validatedLimit = 10;
        if (page !== undefined) {
            if (!Number.isInteger(page) || page < 1) {
                errors.push({
                    field: 'page',
                    value: page,
                    message: 'Page must be a positive integer',
                    code: 'INVALID_PAGE'
                });
            }
            else {
                validatedPage = page;
            }
        }
        if (limit !== undefined) {
            if (!Number.isInteger(limit) || limit < 1) {
                errors.push({
                    field: 'limit',
                    value: limit,
                    message: 'Limit must be a positive integer',
                    code: 'INVALID_LIMIT'
                });
            }
            else if (limit > maxLimit) {
                errors.push({
                    field: 'limit',
                    value: limit,
                    message: `Limit cannot exceed ${maxLimit}`,
                    code: 'LIMIT_EXCEEDED'
                });
            }
            else {
                validatedLimit = limit;
            }
        }
        return {
            page: validatedPage,
            limit: validatedLimit,
            errors
        };
    }
}
exports.PaginationUtil = PaginationUtil;
/**
 * Response formatting middleware for Express
 */
function responseFormatterMiddleware() {
    return (req, res, next) => {
        // Add request ID to response locals
        res.locals.requestId = req.id || req.headers['x-request-id'] ||
            `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Set request ID header
        res.set('X-Request-ID', res.locals.requestId);
        // Add helper methods to response object
        res.success = function (data, message = 'Success', statusCode = HttpStatusCode.OK) {
            return ExpressResponseHelper.sendSuccess(this, data, message, statusCode);
        };
        res.error = function (message, statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR, code = 'GENERIC_ERROR', details) {
            return ExpressResponseHelper.sendError(this, message, statusCode, code, details);
        };
        res.validationError = function (errors, message = 'Validation failed') {
            return ExpressResponseHelper.sendValidationError(this, errors, message);
        };
        next();
    };
}
exports.responseFormatterMiddleware = responseFormatterMiddleware;
/**
 * Error response mapper for common errors
 */
class ErrorMapper {
    /**
     * Map database errors to API responses
     */
    static mapDatabaseError(error) {
        // PostgreSQL/MySQL error codes
        switch (error.code) {
            case '23505': // PostgreSQL unique violation
            case 'ER_DUP_ENTRY': // MySQL duplicate entry
                return {
                    statusCode: HttpStatusCode.CONFLICT,
                    code: 'DUPLICATE_RESOURCE',
                    message: 'Resource already exists'
                };
            case '23503': // PostgreSQL foreign key violation
            case 'ER_NO_REFERENCED_ROW': // MySQL foreign key constraint
                return {
                    statusCode: HttpStatusCode.BAD_REQUEST,
                    code: 'INVALID_REFERENCE',
                    message: 'Referenced resource does not exist'
                };
            case '23514': // PostgreSQL check violation
                return {
                    statusCode: HttpStatusCode.BAD_REQUEST,
                    code: 'CONSTRAINT_VIOLATION',
                    message: 'Data violates database constraints'
                };
            default:
                return {
                    statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    code: 'DATABASE_ERROR',
                    message: 'Database operation failed'
                };
        }
    }
    /**
     * Map validation errors to API responses
     */
    static mapValidationError(error) {
        const errors = [];
        if (error.details && Array.isArray(error.details)) {
            error.details.forEach((detail) => {
                errors.push({
                    field: detail.path?.join('.') || detail.key || 'unknown',
                    value: detail.value,
                    message: detail.message || 'Validation failed',
                    code: detail.type?.replace('.', '_').toUpperCase() || 'VALIDATION_ERROR'
                });
            });
        }
        else if (error.errors && typeof error.errors === 'object') {
            Object.keys(error.errors).forEach(field => {
                const fieldError = error.errors[field];
                errors.push({
                    field,
                    value: fieldError.value,
                    message: fieldError.message || 'Validation failed',
                    code: fieldError.kind?.toUpperCase() || 'VALIDATION_ERROR'
                });
            });
        }
        else {
            errors.push({
                field: 'general',
                value: null,
                message: error.message || 'Validation failed',
                code: 'VALIDATION_ERROR'
            });
        }
        return errors;
    }
}
exports.ErrorMapper = ErrorMapper;
/**
 * Default exports
 */
exports.default = {
    ResponseUtil,
    ExpressResponseHelper,
    LambdaResponseHelper,
    PaginationUtil,
    ErrorMapper,
    HttpStatusCode,
    responseFormatterMiddleware
};
