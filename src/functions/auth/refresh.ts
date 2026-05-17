/**
 * Refresh Token Function
 * Lambda function to refresh access token
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { authService } from '../../services/auth.service';
import { createSuccessResponse, createErrorResponse } from '../shared/response.utils';

export interface RefreshRequest {
  refreshToken: string;
}

export const handler = async (event: any, _context: any): Promise<APIGatewayProxyResult> => {
  try {
    const body: RefreshRequest = JSON.parse(event.body || '{}');

    // Validate input
    if (!body.refreshToken) {
      return createErrorResponse('VALIDATION_ERROR', 'Refresh token is required', 400);
    }

    // Refresh tokens
    const tokens = await authService.refreshAccessToken(body.refreshToken);

    return createSuccessResponse(tokens, 200);
  } catch (error) {
    return createErrorResponse(
      'REFRESH_FAILED',
      error instanceof Error ? error.message : 'Token refresh failed',
      500
    );
  }
};

// Export handler as refreshHandler for tests
export const refreshHandler = handler;

export default handler;
