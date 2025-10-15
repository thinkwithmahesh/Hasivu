/**
 * Common Error Classes for HASIVU Platform
 * Provides standardized error handling across the application
 */

/**
 * Base error class for application-specific errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 400);
    this.field = field;
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  public readonly resourceType: string;
  public readonly resourceId?: string;

  constructor(resourceType: string, resourceId?: string) {
    const message = resourceId
      ? `${resourceType} with ID '${resourceId}' not found`
      : `${resourceType} not found`;
    super(message, 404);
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * Conflict error for duplicate resources or business logic conflicts
 */
export class ConflictError extends AppError {
  public readonly conflictType: string;

  constructor(message: string, conflictType: string = 'resource') {
    super(message, 409);
    this.conflictType = conflictType;
  }
}

/**
 * Authentication error for unauthorized access
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

/**
 * Authorization error for forbidden access
 */
export class AuthorizationError extends AppError {
  public readonly requiredPermission?: string;

  constructor(message: string = 'Insufficient permissions', requiredPermission?: string) {
    super(message, 403);
    this.requiredPermission = requiredPermission;
  }
}

/**
 * Business logic error for violated business rules
 */
export class BusinessLogicError extends AppError {
  public readonly ruleType: string;

  constructor(message: string, ruleType: string = 'general') {
    super(message, 422);
    this.ruleType = ruleType;
  }
}

/**
 * External service error for third-party integration failures
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;
  public readonly originalError?: Error;

  constructor(service: string, message: string, originalError?: Error) {
    super(`${service} service error: ${message}`, 502);
    this.service = service;
    this.originalError = originalError;
  }
}

/**
 * Database error for data persistence issues
 */
export class DatabaseError extends AppError {
  public readonly operation: string;
  public readonly originalError?: Error;

  constructor(operation: string, message: string, originalError?: Error) {
    super(`Database ${operation} error: ${message}`, 500);
    this.operation = operation;
    this.originalError = originalError;
  }
}

/**
 * Rate limit error for exceeded API limits
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429);
    this.retryAfter = retryAfter;
  }
}

/**
 * Type guard to check if an error is operational
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Extract error message safely from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

/**
 * Create standardized error response object
 */
export function createErrorResponse(error: AppError | Error) {
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
          resourceId: error.resourceId,
        }),
        ...(error instanceof ConflictError && { conflictType: error.conflictType }),
        ...(error instanceof AuthorizationError &&
          error.requiredPermission && {
            requiredPermission: error.requiredPermission,
          }),
        ...(error instanceof BusinessLogicError && { ruleType: error.ruleType }),
        ...(error instanceof ExternalServiceError && { service: error.service }),
        ...(error instanceof DatabaseError && { operation: error.operation }),
        ...(error instanceof RateLimitError &&
          error.retryAfter && { retryAfter: error.retryAfter }),
      }),
    },
  };
}
