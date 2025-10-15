/**
 * CSRF Protection Utilities
 * Provides CSRF token validation for Lambda functions
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { createErrorResponse } from './response.utils';

/**
 * Validate CSRF token from request headers
 */
export function validateCSRFToken(event: APIGatewayProxyEvent): { isValid: boolean; error?: any } {
  try {
    // Get CSRF token from headers
    const csrfToken = event.headers['x-csrf-token'] || event.headers['X-CSRF-Token'];

    if (!csrfToken) {
      return {
        isValid: false,
        error: createErrorResponse('CSRF_VALIDATION_FAILED', 'CSRF token missing', 403),
      };
    }

    // Basic validation - check if token is not empty and has reasonable length
    if (typeof csrfToken !== 'string' || csrfToken.length < 10 || csrfToken.length > 100) {
      return {
        isValid: false,
        error: createErrorResponse('CSRF_VALIDATION_FAILED', 'Invalid CSRF token format', 403),
      };
    }

    // In a production environment, you would validate against a stored token
    // For now, we accept any non-empty token that matches the format
    const csrfPattern = /^[a-zA-Z0-9]+$/;
    if (!csrfPattern.test(csrfToken)) {
      return {
        isValid: false,
        error: createErrorResponse('CSRF_VALIDATION_FAILED', 'Invalid CSRF token characters', 403),
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: createErrorResponse('CSRF_VALIDATION_FAILED', 'CSRF validation error', 403),
    };
  }
}

/**
 * Check if request method requires CSRF protection
 */
export function requiresCSRFProtection(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}
