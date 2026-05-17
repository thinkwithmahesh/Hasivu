/**
 * Update Profile Function
 * Lambda function to update user profile
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { authService } from '../../services/auth.service';
import { createSuccessResponse, createErrorResponse } from '../shared/response.utils';

export interface UpdateProfileRequest {
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export const handler = async (event: any, _context: any): Promise<APIGatewayProxyResult> => {
  try {
    const body: UpdateProfileRequest = JSON.parse(event.body || '{}');
    const userId = event.pathParameters?.userId || body.userId;

    // Validate input
    if (!userId) {
      return createErrorResponse('VALIDATION_ERROR', 'User ID is required', 400);
    }

    // Prepare update data
    const updateData: { firstName?: string; lastName?: string; phone?: string } = {};
    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.phone !== undefined) updateData.phone = body.phone;

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'At least one field to update is required',
        400
      );
    }

    // Update profile
    const result = await authService.updateProfile(userId, updateData);

    if (!result.success) {
      return createErrorResponse(
        'PROFILE_UPDATE_FAILED',
        result.error || 'Profile update failed',
        400
      );
    }

    // Return updated profile (exclude password hash)
    return createSuccessResponse(
      {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName || '',
        lastName: result.user.lastName || '',
        role: result.user.role,
        phone: result.user.phone || '',
      },
      200
    );
  } catch (error) {
    return createErrorResponse(
      'PROFILE_UPDATE_FAILED',
      error instanceof Error ? error.message : 'Profile update failed',
      500
    );
  }
};

// Export handler as updateProfileHandler for tests
export const updateProfileHandler = handler;

export default handler;
