/**
 * Change Password Function
 * Lambda function to change user password
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { authService } from '../../services/auth.service';
import { createSuccessResponse, createErrorResponse } from '../shared/response.utils';

export interface ChangePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export const handler = async (event: any, _context: any): Promise<APIGatewayProxyResult> => {
  try {
    const body: ChangePasswordRequest = JSON.parse(event.body || '{}');

    // Validate input
    if (!body.userId || !body.currentPassword || !body.newPassword) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'User ID, current password, and new password are required',
        400
      );
    }

    // Check password confirmation
    if (body.newPassword !== body.newPasswordConfirm) {
      return createErrorResponse('VALIDATION_ERROR', 'New passwords do not match', 400);
    }

    // Validate new password strength
    if (body.newPassword.length < 8) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'New password must be at least 8 characters long',
        400
      );
    }

    // Change password
    await authService.changePassword(body.userId, body.currentPassword, body.newPassword);

    return createSuccessResponse({ message: 'Password changed successfully' }, 200);
  } catch (error) {
    return createErrorResponse(
      'PASSWORD_CHANGE_FAILED',
      error instanceof Error ? error.message : 'Password change failed',
      500
    );
  }
};

// Export handler as changePasswordHandler for tests
export const changePasswordHandler = handler;

export default handler;
