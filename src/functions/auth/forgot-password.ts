/**
 * Forgot Password Function
 * Lambda function for password reset requests
 */

import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { authService } from '../../services/auth.service';
import { createSuccessResponse, createErrorResponse } from '../shared/response.utils';
import { validateCSRFToken, requiresCSRFProtection } from '../shared/csrf.utils';

export interface ForgotPasswordRequest {
  email: string;
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

    const body: ForgotPasswordRequest = JSON.parse(event.body || '{}');

    // Validate input
    if (!body.email) {
      return createErrorResponse('VALIDATION_ERROR', 'Email is required', 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return createErrorResponse('VALIDATION_ERROR', 'Please enter a valid email address', 400);
    }

    // Process forgot password request
    const result = await authService.forgotPassword(body.email);

    return createSuccessResponse(
      {
        message: result.message,
        // In production, don't return the reset token
        // resetToken: result.resetToken,
      },
      200
    );
  } catch (error) {
    return createErrorResponse(
      'FORGOT_PASSWORD_FAILED',
      error instanceof Error ? error.message : 'Password reset request failed',
      500
    );
  }
};

// Export handler as forgotPasswordHandler for tests
export const forgotPasswordHandler = handler;

export default handler;
