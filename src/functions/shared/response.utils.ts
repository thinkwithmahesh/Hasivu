/**
 * HASIVU Platform - Lambda Response Utilities
 * Standardized response handling for Lambda functions
 * Implements Story 1.3: Core User Management System
 */
import { APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../../utils/logger';

/**
 * Standard API Response Interface
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Error Response Interface
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: any;
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

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
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200,
  requestId?: string
): APIGatewayProxyResult {
  const response: APIResponse<T> = {
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

/**
 * Create standardized error response
 */
export function createErrorResponse(
  statusCode: number,
  message: string,
  details?: any,
  code?: string,
  requestId?: string
): APIGatewayProxyResult {
  const response: ErrorResponse = {
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

/**
 * Handle errors with proper logging and response formatting
 */
export function handleError(
  error: Error,
  message?: string,
  statusCode: number = 500,
  requestId?: string
): APIGatewayProxyResult {
  // Log the error
  logger.error(message || 'Unhandled error occurred', {
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

  return createErrorResponse(
    mappedStatusCode,
    errorMessage,
    isProduction && statusCode >= 500 ? undefined : { stack: error.stack },
    getErrorCode(error),
    requestId
  );
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
  requestId?: string,
  additional?: any
): APIGatewayProxyResult {
  const totalPages = Math.ceil(total / limit);
  
  const response: APIResponse<T[]> = {
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

/**
 * Handle CORS preflight requests
 */
export function handleCorsPrelight(): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: ''
  };
}

/**
 * Map error types to appropriate status codes
 */
function mapErrorToStatusCode(error: Error, defaultCode: number): number {
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
function getErrorCode(error: Error): string {
  // Check if error object has a code property
  if ('code' in error && typeof (error as any).code === 'string') {
    return (error as any).code;
  }

  // Generate code from error message
  const message = error.message.toLowerCase();
  if (message.includes('validation')) return 'VALIDATION_ERROR';
  if (message.includes('authentication')) return 'AUTHENTICATION_ERROR';
  if (message.includes('authorization') || message.includes('access denied')) return 'AUTHORIZATION_ERROR';
  if (message.includes('not found')) return 'NOT_FOUND';
  if (message.includes('already exists')) return 'DUPLICATE_ERROR';
  if (message.includes('rate limit')) return 'RATE_LIMIT_EXCEEDED';
  if (message.includes('timeout')) return 'TIMEOUT_ERROR';
  if (message.includes('connection')) return 'CONNECTION_ERROR';
  return 'INTERNAL_ERROR';
}

/**
 * Get error code from HTTP status code
 */
function getErrorCodeFromStatus(statusCode: number): string {
  const statusMap: Record<number, string> = {
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
export function parseRequestBody<T>(body: string | null, required: boolean = true): T {
  if (!body) {
    if (required) {
      throw new Error('Request body is required');
    }
    return {} as T;
  }

  try {
    return JSON.parse(body) as T;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Extract and validate path parameters
 */
export function extractPathParameter(
  pathParameters: Record<string, string> | null,
  paramName: string,
  required: boolean = true
): string | null {
  if (!pathParameters || !pathParameters[paramName]) {
    if (required) {
      throw new Error(`Path parameter '${paramName}' is required`);
    }
    return null;
  }

  return pathParameters[paramName];
}

/**
 * Extract and validate query parameters
 */
export function extractQueryParameter(
  queryStringParameters: Record<string, string> | null,
  paramName: string,
  defaultValue?: string
): string | null {
  if (!queryStringParameters || !queryStringParameters[paramName]) {
    return defaultValue || null;
  }

  return queryStringParameters[paramName];
}

/**
 * Validate UUID format
 */
export function validateUUID(value: string, paramName: string = 'ID'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(value)) {
    throw new Error(`Invalid ${paramName} format. Must be a valid UUID.`);
  }
}