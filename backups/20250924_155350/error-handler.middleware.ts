/**
 * HASIVU Platform - Global Error Handler Middleware
 * Comprehensive error handling with circuit breaker integration and graceful degradation
 * Provides consistent error responses and proper logging
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ValidationResult } from '../services/validation.service';

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  requestId: string;
  details?: any;
  degradedServices?: string[];
  retryAfter?: number;
}

/**
 * Error classification for different response strategies
 */
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  TIMEOUT = 'timeout',
  INTERNAL = 'internal',
  CIRCUIT_BREAKER = 'circuit_breaker',
}

/**
 * Error classification patterns
 */
const ERROR_PATTERNS = {
  [ErrorType.VALIDATION]: {
    statusCode: 400,
    includeDetails: true,
    logLevel: 'warn' as const,
  },
  [ErrorType.AUTHENTICATION]: {
    statusCode: 401,
    includeDetails: false,
    logLevel: 'warn' as const,
  },
  [ErrorType.AUTHORIZATION]: {
    statusCode: 403,
    includeDetails: false,
    logLevel: 'warn' as const,
  },
  [ErrorType.NOT_FOUND]: {
    statusCode: 404,
    includeDetails: false,
    logLevel: 'info' as const,
  },
  [ErrorType.RATE_LIMIT]: {
    statusCode: 429,
    includeDetails: false,
    logLevel: 'warn' as const,
    includeRetryAfter: true,
  },
  [ErrorType.SERVICE_UNAVAILABLE]: {
    statusCode: 503,
    includeDetails: false,
    logLevel: 'error' as const,
    includeRetryAfter: true,
  },
  [ErrorType.DATABASE]: {
    statusCode: 500,
    includeDetails: false,
    logLevel: 'error' as const,
  },
  [ErrorType.EXTERNAL_SERVICE]: {
    statusCode: 502,
    includeDetails: false,
    logLevel: 'error' as const,
    includeRetryAfter: true,
  },
  [ErrorType.TIMEOUT]: {
    statusCode: 408,
    includeDetails: false,
    logLevel: 'warn' as const,
    includeRetryAfter: true,
  },
  [ErrorType.INTERNAL]: {
    statusCode: 500,
    includeDetails: false,
    logLevel: 'error' as const,
  },
  [ErrorType.CIRCUIT_BREAKER]: {
    statusCode: 503,
    includeDetails: false,
    logLevel: 'warn' as const,
    includeRetryAfter: true,
  },
};

/**
 * Main error handler middleware
 */
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  // Generate request ID if not exists
  const requestId = generateRequestId();

  // Classify error type
  const errorType = classifyError(error);

  // Get error pattern configuration
  const pattern = ERROR_PATTERNS[errorType];
  const statusCode = pattern.statusCode;

  // Get degraded services information
  const degradedServices = getDegradedServices();

  // Build error response
  const errorResponse: ErrorResponse = {
    error: errorType,
    message: getErrorMessage(error, errorType),
    statusCode,
    timestamp: new Date().toISOString(),
    requestId,
    ...(degradedServices.length > 0 && { degradedServices }),
    ...(shouldIncludeDetails(errorType) && { details: getErrorDetails(error) }),
    ...(shouldIncludeRetryAfter(errorType, error) && { retryAfter: getRetryAfter(error) }),
  };

  // Log error with appropriate level
  logError(error, errorType, req, requestId);

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Route not found: ${req.method} ${req.path}`);
  error.name = 'NotFoundError';
  next(error);
};

/**
 * Helper functions
 */

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function classifyError(error: any): ErrorType {
  // Check error name and message patterns
  if (error.name === 'ValidationError' || error.code === 'VALIDATION_FAILED') {
    return ErrorType.VALIDATION;
  }

  if (error.name === 'UnauthorizedError' || error.message?.includes('unauthorized')) {
    return ErrorType.AUTHENTICATION;
  }

  if (error.name === 'ForbiddenError' || error.message?.includes('forbidden')) {
    return ErrorType.AUTHORIZATION;
  }

  if (error.name === 'NotFoundError' || error.statusCode === 404) {
    return ErrorType.NOT_FOUND;
  }

  if (error.name === 'TooManyRequestsError' || error.statusCode === 429) {
    return ErrorType.RATE_LIMIT;
  }

  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return ErrorType.TIMEOUT;
  }

  if (error.name === 'CircuitBreakerError' || error.message?.includes('circuit breaker')) {
    return ErrorType.CIRCUIT_BREAKER;
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return ErrorType.EXTERNAL_SERVICE;
  }

  if (error.name?.includes('Database') || error.code?.startsWith('P')) {
    return ErrorType.DATABASE;
  }

  return ErrorType.INTERNAL;
}

function getErrorMessage(error: any, errorType: ErrorType): string {
  const baseMessages = {
    [ErrorType.VALIDATION]: 'Validation failed',
    [ErrorType.AUTHENTICATION]: 'Authentication required',
    [ErrorType.AUTHORIZATION]: 'Access denied',
    [ErrorType.NOT_FOUND]: 'Resource not found',
    [ErrorType.RATE_LIMIT]: 'Too many requests',
    [ErrorType.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
    [ErrorType.DATABASE]: 'Database operation failed',
    [ErrorType.EXTERNAL_SERVICE]: 'External service unavailable',
    [ErrorType.TIMEOUT]: 'Request timeout',
    [ErrorType.INTERNAL]: 'Internal server error',
    [ErrorType.CIRCUIT_BREAKER]: 'Service circuit breaker activated',
  };

  // For validation errors, include specific validation messages
  if (errorType === ErrorType.VALIDATION && error.message) {
    return error.message;
  }

  // For rate limiting, include retry information
  if (errorType === ErrorType.RATE_LIMIT) {
    return 'Too many requests. Please try again later.';
  }

  return baseMessages[errorType] || 'An unexpected error occurred';
}

function shouldIncludeDetails(errorType: ErrorType): boolean {
  const pattern = ERROR_PATTERNS[errorType];
  return pattern.includeDetails && process.env.NODE_ENV !== 'production';
}

function getErrorDetails(error: any): any {
  if (error.details) return error.details;
  if (error.errors) return error.errors;
  if (error.issues) return error.issues;

  // For development, include stack trace
  if (process.env.NODE_ENV === 'development') {
    return {
      stack: error.stack,
      name: error.name,
      code: error.code,
    };
  }

  return undefined;
}

function shouldIncludeRetryAfter(errorType: ErrorType, error: any): boolean {
  const pattern = ERROR_PATTERNS[errorType];
  return (pattern as any).includeRetryAfter === true;
}

function getRetryAfter(error: any): number {
  if (error.retryAfter) return error.retryAfter;

  // Default retry intervals by error type
  const defaultRetryAfter = {
    [ErrorType.RATE_LIMIT]: 60, // 1 minute
    [ErrorType.SERVICE_UNAVAILABLE]: 300, // 5 minutes
    [ErrorType.EXTERNAL_SERVICE]: 120, // 2 minutes
    [ErrorType.TIMEOUT]: 30, // 30 seconds
    [ErrorType.CIRCUIT_BREAKER]: 180, // 3 minutes
  };

  return defaultRetryAfter[classifyError(error)] || 60;
}

function getDegradedServices(): string[] {
  // In a real implementation, this would check the circuit breaker status
  // For now, return empty array
  return [];
}

function logError(error: any, errorType: ErrorType, req: Request, requestId: string): void {
  const pattern = ERROR_PATTERNS[errorType];
  const logLevel = pattern.logLevel;

  const logData = {
    requestId,
    errorType,
    message: error.message,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
    ...(error.stack && { stack: error.stack }),
    ...(error.code && { code: error.code }),
  };

  switch (logLevel) {
    case 'error':
      logger.error('Application error occurred', logData);
      break;
    case 'warn':
      logger.warn('Application warning occurred', logData);
      break;
    case 'info':
      logger.info('Application info event', logData);
      break;
    default:
      logger.error('Unknown error level', logData);
  }
}

/**
 * Validation error factory
 */
export function createValidationError(message: string, details?: any): Error {
  const error = new Error(message);
  error.name = 'ValidationError';
  if (details) {
    (error as any).details = details;
  }
  return error;
}

/**
 * Not found error factory
 */
export function createNotFoundError(resource: string): Error {
  const error = new Error(`${resource} not found`);
  error.name = 'NotFoundError';
  return error;
}

/**
 * Service unavailable error factory
 */
export function createServiceUnavailableError(service: string, retryAfter?: number): Error {
  const error = new Error(`${service} service is temporarily unavailable`);
  error.name = 'ServiceUnavailableError';
  if (retryAfter) {
    (error as any).retryAfter = retryAfter;
  }
  return error;
}

/**
 * Authorization error factory
 */
export function createAuthorizationError(message: string = 'Access denied'): Error {
  const error = new Error(message);
  error.name = 'ForbiddenError';
  return error;
}

/**
 * Circuit breaker error factory
 */
export function createCircuitBreakerError(service: string): Error {
  const error = new Error(`Circuit breaker activated for ${service}`);
  error.name = 'CircuitBreakerError';
  return error;
}
