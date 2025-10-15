/**
 * Custom Error Classes
 * Standardized error handling across the application
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperationalOrCode?: boolean | string,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;

    if (typeof isOperationalOrCode === 'boolean') {
      this.isOperational = isOperationalOrCode;
      this.code = code;
    } else if (typeof isOperationalOrCode === 'string') {
      this.code = isOperationalOrCode;
      this.isOperational = true;
    } else {
      this.isOperational = true;
      this.code = code;
    }

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, 400, code);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', code: string = 'NOT_FOUND') {
    super(`${resource} not found`, 404, code);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    super(message, 401, code);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
    super(message, 403, code);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: string = 'CONFLICT') {
    super(message, 409, code);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', code: string = 'DATABASE_ERROR') {
    super(message, 500, code);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, code: string = 'EXTERNAL_SERVICE_ERROR') {
    super(message || `${service} service error`, 502, code);
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

export class PaymentError extends AppError {
  constructor(message: string, code: string = 'PAYMENT_ERROR') {
    super(message, 402, code);
    Object.setPrototypeOf(this, PaymentError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', code: string = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, code);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', code: string = 'AUTHENTICATION_ERROR') {
    super(message, 401, code);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Authorization failed', code: string = 'AUTHORIZATION_ERROR') {
    super(message, 403, code);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, code: string = 'BUSINESS_LOGIC_ERROR') {
    super(message, 400, code);
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}

export class Logger {
  static error(error: Error | AppError, context?: any): void {
    if (error instanceof AppError) {
      console.error({
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        isOperational: error.isOperational,
        stack: error.stack,
        context,
      });
    } else {
      console.error({
        message: error.message,
        stack: error.stack,
        context,
      });
    }
  }
}

export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

export function handleError(error: Error | AppError): {
  statusCode: number;
  message: string;
  code?: string;
} {
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

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export function createErrorResponse(
  error: unknown,
  statusCode?: number
): {
  statusCode: number;
  message: string;
  code?: string;
} {
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
