/**
 * Logout Function
 * Lambda function for user logout
 */

import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { authService } from '../../services/auth.service';
import { createSuccessResponse, createErrorResponse } from '../shared/response.utils';
import { validateCSRFToken, requiresCSRFProtection } from '../shared/csrf.utils';

export interface LogoutRequest {
  refreshToken: string;
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

    const body: LogoutRequest = JSON.parse(event.body || '{}');

    // Validate input
    if (!body.refreshToken) {
      return createErrorResponse('VALIDATION_ERROR', 'Refresh token is required', 400);
    }

    // Logout user
    await authService.logout(body.refreshToken);

    return createSuccessResponse({ message: 'Logged out successfully' }, 200);
  } catch (error) {
    return createErrorResponse(
      'LOGOUT_FAILED',
      error instanceof Error ? error.message : 'Logout failed',
      500
    );
  }
};

// Export handler as logoutHandler for tests
export const logoutHandler = handler;

export default handler;
