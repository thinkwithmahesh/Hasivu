/**
 * Register Function
 * Lambda function for user registration
 */

import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { authService } from '../../services/auth.service';
import { createSuccessResponse, createErrorResponse } from '../shared/response.utils';
import { validateCSRFToken, requiresCSRFProtection } from '../shared/csrf.utils';

export interface RegisterRequest {
  email: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  role?: string;
  schoolId?: string;
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

    const body: RegisterRequest = JSON.parse(event.body || '{}');

    // Validate input
    if (!body.email || !body.password || !body.firstName || !body.lastName) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Email, password, first name, and last name are required',
        400
      );
    }

    // Check password confirmation
    if (body.password !== body.passwordConfirm) {
      return createErrorResponse('VALIDATION_ERROR', 'Passwords do not match', 400);
    }

    // Validate password strength
    if (body.password.length < 8) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Password must be at least 8 characters long',
        400
      );
    }

    // Register user
    const registerResult = await authService.register({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      schoolId: body.schoolId,
    });

    if (!registerResult.success) {
      return createErrorResponse(
        'REGISTRATION_FAILED',
        registerResult.error || 'Registration failed',
        400
      );
    }

    // Generate tokens by authenticating the newly registered user
    const authResult = await authService.authenticate({
      email: body.email,
      password: body.password,
    });

    if (!authResult.success) {
      return createErrorResponse(
        'REGISTRATION_FAILED',
        'Registration succeeded but token generation failed',
        500
      );
    }

    // Return success response (exclude password hash)
    return createSuccessResponse(
      {
        user: {
          id: registerResult.user.id,
          email: registerResult.user.email,
          firstName: registerResult.user.firstName || '',
          lastName: registerResult.user.lastName || '',
          role: registerResult.user.role,
        },
        tokens: authResult.tokens,
      },
      201
    );
  } catch (error) {
    return createErrorResponse(
      'REGISTRATION_FAILED',
      error instanceof Error ? error.message : 'Registration failed',
      500
    );
  }
};

// Export handler as registerHandler for tests
export const registerHandler = handler;

export default handler;
