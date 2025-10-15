import { NextRequest, NextResponse } from 'next/server';

const LAMBDA_AUTH_LOGOUT_URL =
  process.env.LAMBDA_AUTH_LOGOUT_URL ||
  'https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/auth/logout';

// POST /api/auth/logout - User logout
export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookie
    const authToken = request.cookies.get('auth-token')?.value;

    // Forward request to Lambda function if token exists
    if (authToken) {
      try {
        await fetch(LAMBDA_AUTH_LOGOUT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
            'User-Agent': request.headers.get('user-agent') || '',
            'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
          },
        });
      } catch (lambdaError) {
        // Log but don't fail logout due to Lambda issues
      }
    }

    // Clear cookies regardless of Lambda response
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
    });

    // Clear auth cookies
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    response.cookies.set('refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    // Still clear cookies even if there's an error
    const response = NextResponse.json(
      { success: false, error: 'Logout completed with warnings' },
      { status: 200 }
    );

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    response.cookies.set('refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    return response;
  }
}
