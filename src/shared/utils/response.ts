/**
 * HASIVU Platform - Standardized API Response Utilities
 * Production-ready response formatting for REST APIs with consistent structure
 * Provides unified success/error response patterns with proper HTTP status codes
 */

import { Response } from 'express';
import { logger } from './logger';

// Extend Express Response type with custom methods
declare module 'express' {
  export interface Response {
    success<T = any>(data?: T, message?: string, statusCode?: number): this;
    error(message: string, statusCode?: number, code?: string, details?: Record<string, any>): this;
    validationError(errors: ValidationError[], message?: string): this;
  }
}

/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: ErrorDetails;
  meta?: ResponseMeta;
  timestamp: string;
  requestId?: string;
}

/**
 * Error details interface
 */
export interface ErrorDetails {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
  field?: string;
  validation?: ValidationError[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  value: any;
  message: string;
  code: string;
}

/**
 * Response metadata interface
 */
export interface ResponseMeta {
  pagination?: PaginationMeta;
  performance?: PerformanceMeta;
  version?: string;
  environment?: string;
  rateLimit?: RateLimitMeta;
  cache?: CacheMeta;
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage?: number;
  previousPage?: number;
}

/**
 * Performance metadata interface
 */
export interface PerformanceMeta {
  responseTime: number;
  queryCount?: number;
  queryTime?: number;
  cacheHits?: number;
  cacheMisses?: number;
}

/**
 * Rate limit metadata interface
 */
export interface RateLimitMeta {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Cache metadata interface
 */
export interface CacheMeta {
  hit: boolean;
  ttl?: number;
  key?: string;
  strategy?: string;
}

/**
 * Success response data interface for lists
 */
export interface ListResponse<T = any> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * HTTP Status codes enum for type safety
 */
export enum HttpStatusCode {
  // Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // Redirection
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  NOT_MODIFIED = 304,

  // Client Error
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // Server Error
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

/**
 * Response utility class with static methods
 */
export class ResponseUtil {
  /**
   * Generate request ID for response tracking
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create standardized success response
   */
  public static success<T = any>(
    message: string = 'Success',
    data?: T,
    meta?: ResponseMeta,
    requestId?: string
  ): ApiResponse<T> {
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
  public static error(
    message: string,
    code: string = 'GENERIC_ERROR',
    details?: Record<string, any>,
    requestId?: string
  ): ApiResponse<null> {
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
  public static validationError(
    message: string = 'Validation failed',
    errors: ValidationError[],
    requestId?: string
  ): ApiResponse<null> {
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
  public static paginatedList<T = any>(
    items: T[],
    pagination: PaginationMeta,
    message: string = 'List retrieved successfully',
    requestId?: string
  ): ApiResponse<ListResponse<T>> {
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
  public static noContent(
    message: string = 'No content',
    requestId?: string
  ): ApiResponse<null> {
    return {
      success: true,
      message,
      timestamp: new Date().toISOString(),
      requestId: requestId || this.generateRequestId()
    };
  }
}

/**
 * Express response helper functions
 */
export class ExpressResponseHelper {
  /**
   * Send success response with proper status code
   */
  public static sendSuccess<T = any>(
    res: Response,
    data?: T,
    message: string = 'Success',
    statusCode: HttpStatusCode = HttpStatusCode.OK,
    meta?: ResponseMeta
  ): Response {
    const requestId = res.locals.requestId || res.get('X-Request-ID');
    const response = ResponseUtil.success(message, data, meta, requestId);
    
    logger.debug('Sending success response', {
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
  public static sendError(
    res: Response,
    message: string,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    code: string = 'GENERIC_ERROR',
    details?: Record<string, any>
  ): Response {
    const requestId = res.locals.requestId || res.get('X-Request-ID');
    const response = ResponseUtil.error(message, code, details, requestId);
    
    logger.error('Sending error response', {
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
  public static sendValidationError(
    res: Response,
    errors: ValidationError[],
    message: string = 'Validation failed'
  ): Response {
    const requestId = res.locals.requestId || res.get('X-Request-ID');
    const response = ResponseUtil.validationError(message, errors, requestId);
    
    logger.warn('Sending validation error response', {
      message,
      errors,
      requestId
    });

    return res.status(HttpStatusCode.UNPROCESSABLE_ENTITY).json(response);
  }

  /**
   * Send paginated list response
   */
  public static sendPaginatedList<T = any>(
    res: Response,
    items: T[],
    pagination: PaginationMeta,
    message: string = 'List retrieved successfully'
  ): Response {
    const requestId = res.locals.requestId || res.get('X-Request-ID');
    const response = ResponseUtil.paginatedList(items, pagination, message, requestId);
    
    // Add pagination headers
    res.set({
      'X-Total-Count': pagination.totalItems.toString(),
      'X-Page-Count': pagination.totalPages.toString(),
      'X-Current-Page': pagination.currentPage.toString(),
      'X-Items-Per-Page': pagination.itemsPerPage.toString()
    });

    logger.debug('Sending paginated list response', {
      itemCount: items.length,
      pagination,
      requestId
    });

    return res.status(HttpStatusCode.OK).json(response);
  }

  /**
   * Send no content response (204)
   */
  public static sendNoContent(
    res: Response,
    message: string = 'No content'
  ): Response {
    const requestId = res.locals.requestId || res.get('X-Request-ID');
    const response = ResponseUtil.noContent(message, requestId);
    
    logger.debug('Sending no content response', { requestId });
    
    return res.status(HttpStatusCode.NO_CONTENT).json(response);
  }

  /**
   * Send created response (201)
   */
  public static sendCreated<T = any>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): Response {
    return this.sendSuccess(res, data, message, HttpStatusCode.CREATED);
  }

  /**
   * Send accepted response (202)
   */
  public static sendAccepted<T = any>(
    res: Response,
    data?: T,
    message: string = 'Request accepted for processing'
  ): Response {
    return this.sendSuccess(res, data, message, HttpStatusCode.ACCEPTED);
  }

  /**
   * Send not found error response
   */
  public static sendNotFound(
    res: Response,
    message: string = 'Resource not found',
    resourceType?: string
  ): Response {
    const code = resourceType ? `${resourceType.toUpperCase()}_NOT_FOUND` : 'NOT_FOUND';
    return this.sendError(res, message, HttpStatusCode.NOT_FOUND, code);
  }

  /**
   * Send unauthorized error response
   */
  public static sendUnauthorized(
    res: Response,
    message: string = 'Authentication required'
  ): Response {
    return this.sendError(res, message, HttpStatusCode.UNAUTHORIZED, 'UNAUTHORIZED');
  }

  /**
   * Send forbidden error response
   */
  public static sendForbidden(
    res: Response,
    message: string = 'Access forbidden'
  ): Response {
    return this.sendError(res, message, HttpStatusCode.FORBIDDEN, 'FORBIDDEN');
  }

  /**
   * Send conflict error response
   */
  public static sendConflict(
    res: Response,
    message: string = 'Resource conflict',
    details?: Record<string, any>
  ): Response {
    return this.sendError(res, message, HttpStatusCode.CONFLICT, 'CONFLICT', details);
  }

  /**
   * Send rate limit error response
   */
  public static sendRateLimit(
    res: Response,
    retryAfter: number,
    message: string = 'Rate limit exceeded'
  ): Response {
    res.set('Retry-After', retryAfter.toString());
    return this.sendError(
      res,
      message,
      HttpStatusCode.TOO_MANY_REQUESTS,
      'RATE_LIMIT_EXCEEDED',
      { retryAfter }
    );
  }

  /**
   * Send internal server error response
   */
  public static sendInternalError(
    res: Response,
    message: string = 'Internal server error',
    error?: Error
  ): Response {
    const details = error ? {
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    } : undefined;

    return this.sendError(
      res,
      message,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      'INTERNAL_SERVER_ERROR',
      details
    );
  }
}

/**
 * Lambda response helper functions
 */
export class LambdaResponseHelper {
  /**
   * Create Lambda success response
   */
  public static success<T = any>(
    data?: T,
    message: string = 'Success',
    statusCode: HttpStatusCode = HttpStatusCode.OK,
    headers?: Record<string, string>
  ) {
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
  public static error(
    message: string,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    code: string = 'GENERIC_ERROR',
    details?: Record<string, any>,
    headers?: Record<string, string>
  ) {
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
  public static validationError(
    errors: ValidationError[],
    message: string = 'Validation failed',
    headers?: Record<string, string>
  ) {
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

/**
 * Pagination utility functions
 */
export class PaginationUtil {
  /**
   * Calculate pagination metadata
   */
  public static calculatePagination(
    totalItems: number,
    currentPage: number = 1,
    itemsPerPage: number = 10
  ): PaginationMeta {
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
  public static calculateOffset(page: number = 1, limit: number = 10): number {
    return (page - 1) * limit;
  }

  /**
   * Validate pagination parameters
   */
  public static validatePaginationParams(
    page?: number,
    limit?: number,
    maxLimit: number = 100
  ): { page: number; limit: number; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
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
      } else {
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
      } else if (limit > maxLimit) {
        errors.push({
          field: 'limit',
          value: limit,
          message: `Limit cannot exceed ${maxLimit}`,
          code: 'LIMIT_EXCEEDED'
        });
      } else {
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

/**
 * Response formatting middleware for Express
 */
export function responseFormatterMiddleware() {
  return (req: any, res: Response, next: any) => {
    // Add request ID to response locals
    res.locals.requestId = req.id || req.headers['x-request-id'] || 
                          `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Set request ID header
    res.set('X-Request-ID', res.locals.requestId);

    // Add helper methods to response object
    res.success = function<T = any>(
      data?: T,
      message: string = 'Success',
      statusCode: HttpStatusCode = HttpStatusCode.OK
    ) {
      return ExpressResponseHelper.sendSuccess(this, data, message, statusCode);
    };

    res.error = function(
      message: string,
      statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
      code: string = 'GENERIC_ERROR',
      details?: Record<string, any>
    ) {
      return ExpressResponseHelper.sendError(this, message, statusCode, code, details);
    };

    res.validationError = function(
      errors: ValidationError[],
      message: string = 'Validation failed'
    ) {
      return ExpressResponseHelper.sendValidationError(this, errors, message);
    };

    next();
  };
}

/**
 * Error response mapper for common errors
 */
export class ErrorMapper {
  /**
   * Map database errors to API responses
   */
  public static mapDatabaseError(error: any): { statusCode: HttpStatusCode; code: string; message: string } {
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
  public static mapValidationError(error: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (error.details && Array.isArray(error.details)) {
      error.details.forEach((detail: any) => {
        errors.push({
          field: detail.path?.join('.') || detail.key || 'unknown',
          value: detail.value,
          message: detail.message || 'Validation failed',
          code: detail.type?.replace('.', '_').toUpperCase() || 'VALIDATION_ERROR'
        });
      });
    } else if (error.errors && typeof error.errors === 'object') {
      Object.keys(error.errors).forEach(field => {
        const fieldError = error.errors[field];
        errors.push({
          field,
          value: fieldError.value,
          message: fieldError.message || 'Validation failed',
          code: fieldError.kind?.toUpperCase() || 'VALIDATION_ERROR'
        });
      });
    } else {
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

/**
 * Default exports
 */
export default {
  ResponseUtil,
  ExpressResponseHelper,
  LambdaResponseHelper,
  PaginationUtil,
  ErrorMapper,
  HttpStatusCode,
  responseFormatterMiddleware
};