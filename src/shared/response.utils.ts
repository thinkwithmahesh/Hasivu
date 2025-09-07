/**
 * Response utilities for Lambda functions
 * Provides standardized HTTP response helpers for AWS Lambda API Gateway
 */

import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Standard response structure
 */
interface StandardResponse {
  data?: any;
  message?: string;
  error?: string;
  code?: string;
  timestamp?: string;
  requestId?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  service?: string;
}

/**
 * Create standard CORS headers
 */
const getCorsHeaders = (): Record<string, string> => ({
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
export const createSuccessResponse = (
  response: StandardResponse,
  statusCode: number = 200
): APIGatewayProxyResult => {
  const body: StandardResponse = {
    ...response,
    timestamp: new Date().toISOString()
  };

  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify(body)
  };
};

/**
 * Create an error response
 */
export const createErrorResponse = (
  message: string,
  statusCode: number = 400,
  code?: string
): APIGatewayProxyResult => {
  const body: StandardResponse = {
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

/**
 * Create a validation error response
 */
export const createValidationErrorResponse = (
  errors: string[],
  statusCode: number = 400
): APIGatewayProxyResult => {
  const body: StandardResponse = {
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

/**
 * Create an unauthorized response
 */
export const createUnauthorizedResponse = (
  message: string = 'Unauthorized'
): APIGatewayProxyResult => {
  return createErrorResponse(message, 401, 'UNAUTHORIZED');
};

/**
 * Create a forbidden response
 */
export const createForbiddenResponse = (
  message: string = 'Forbidden'
): APIGatewayProxyResult => {
  return createErrorResponse(message, 403, 'FORBIDDEN');
};

/**
 * Create a not found response
 */
export const createNotFoundResponse = (
  resource: string = 'Resource'
): APIGatewayProxyResult => {
  return createErrorResponse(`${resource} not found`, 404, 'NOT_FOUND');
};

/**
 * Create a method not allowed response
 */
export const createMethodNotAllowedResponse = (
  method: string
): APIGatewayProxyResult => {
  return createErrorResponse(`Method ${method} not allowed`, 405, 'METHOD_NOT_ALLOWED');
};

/**
 * Create a conflict response
 */
export const createConflictResponse = (
  message: string
): APIGatewayProxyResult => {
  return createErrorResponse(message, 409, 'CONFLICT');
};

/**
 * Create a too many requests response
 */
export const createTooManyRequestsResponse = (
  message: string = 'Too many requests'
): APIGatewayProxyResult => {
  return createErrorResponse(message, 429, 'TOO_MANY_REQUESTS');
};

/**
 * Create an internal server error response
 */
export const createInternalServerErrorResponse = (
  message: string = 'Internal server error'
): APIGatewayProxyResult => {
  return createErrorResponse(message, 500, 'INTERNAL_SERVER_ERROR');
};

/**
 * Generic error handler for Lambda functions
 */
export const handleError = (
  error: any,
  defaultMessage: string = 'An error occurred'
): APIGatewayProxyResult => {
  const message = error instanceof Error ? error.message : defaultMessage;
  const statusCode = error.statusCode || error.status || 500;
  const code = error.code || 'INTERNAL_SERVER_ERROR';

  return createErrorResponse(message, statusCode, code);
};