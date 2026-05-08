import { NextRequest, NextResponse } from 'next/server';
import {
  buildProxyHeaders,
  clearAuthCookies,
  fetchConfiguredProxy,
  getAccessTokenFromRequest,
  resolveProxyUrl,
} from '@/app/api/_utils/proxy';

const LAMBDA_AUTH_LOGOUT_URL = resolveProxyUrl(process.env.LAMBDA_AUTH_LOGOUT_URL);

// POST /api/auth/logout - User logout
export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookie
    const authToken = getAccessTokenFromRequest(request);

    // Forward request to Lambda function if token exists
    if (authToken) {
      try {
        if (LAMBDA_AUTH_LOGOUT_URL) {
          await fetchConfiguredProxy(LAMBDA_AUTH_LOGOUT_URL, 'LAMBDA_AUTH_LOGOUT_URL', {
            method: 'POST',
            headers: {
              ...buildProxyHeaders(request, authToken),
            },
          });
        }
      } catch (lambdaError) {
        // Log but don't fail logout due to Lambda issues
      }
    }

    // Clear cookies regardless of Lambda response
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
    });

    return clearAuthCookies(response);
  } catch (error) {
    // Still clear cookies even if there's an error
    const response = NextResponse.json(
      { success: false, error: 'Logout completed with warnings' },
      { status: 200 }
    );

    return clearAuthCookies(response);
  }
}
