/**
 * Get Profile Function
 * Lambda function to get user profile
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { authService } from '../../services/auth.service';
import { createSuccessResponse, createErrorResponse } from '../shared/response.utils';

export interface ProfileRequest {
  userId: string;
}

export const handler = async (event: any, _context: any): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId || event.userId;

    // Validate input
    if (!userId) {
      return createErrorResponse('VALIDATION_ERROR', 'User ID is required', 400);
    }

    // Get user profile
    const user = await authService.getUserById(userId);

    if (!user) {
      return createErrorResponse('USER_NOT_FOUND', 'User not found', 404);
    }

    // Return user profile (exclude password hash)
    return createSuccessResponse(
      {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        phone: user.phone,
        schoolId: user.schoolId,
        createdAt: user.createdAt,
      },
      200
    );
  } catch (error) {
    return createErrorResponse(
      'PROFILE_FETCH_FAILED',
      error instanceof Error ? error.message : 'Failed to fetch profile',
      500
    );
  }
};

// Export handler as profileHandler for tests
export const profileHandler = handler;

export default handler;
