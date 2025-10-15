/**
 * Login Function
 * Lambda function for user authentication
 */

import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { authService } from '../../services/auth.service';
import { createSuccessResponse, createErrorResponse } from '../shared/response.utils';
import { validateCSRFToken, requiresCSRFProtection } from '../shared/csrf.utils';

export interface LoginRequest {
  email: string;
  password: string;
}

export const handler = async (
  event: APIGatewayProxyEvent,
  _context: any
): Promise<APIGatewayProxyResult> => {
  try {
    // Validate CSRF token for POST requests
    if (requiresCSRFProtection(event.httpMethod)) {
      const csrfValidation = validateCSRFToken(event);
      if (!csrfValidation.isValid) {
        return csrfValidation.error;
      }
    }

    const body: LoginRequest = JSON.parse(event.body || '{}');

    // Validate input
    if (!body.email || !body.password) {
      return createErrorResponse('VALIDATION_ERROR', 'Email and password are required', 400);
    }

    // Attempt login
    const result = await authService.authenticate({
      email: body.email,
      password: body.password,
    });

    if (!result.success) {
      return createErrorResponse('LOGIN_FAILED', result.error || 'Authentication failed', 401);
    }

    // Return success response (exclude password hash)
    return createSuccessResponse(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName || '',
          lastName: result.user.lastName || '',
          role: result.user.role,
        },
        tokens: result.tokens,
      },
      200
    );
  } catch (error) {
    return createErrorResponse(
      'LOGIN_FAILED',
      error instanceof Error ? error.message : 'Login failed',
      500
    );
  }
};

// Export handler as loginHandler for tests
export const loginHandler = handler;

export default handler;
