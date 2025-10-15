import { NextRequest, NextResponse } from 'next/server';

const _LAMBDA_AUTH_CHANGE_PASSWORD_URL =
  process.env.LAMBDA_AUTH_CHANGE_PASSWORD_URL ||
  'https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/auth/change-password';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from httpOnly cookie
    const _authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const _body = await request.json();

    // Validate required fields
    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Forward request to Lambda function
    const _lambdaResponse = await fetch(LAMBDA_AUTH_CHANGE_PASSWORD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
      },
      body: JSON.stringify(body),
    });

    const _lambdaData = await lambdaResponse.json();

    // Handle Lambda response and transform to expected frontend format
    if (lambdaResponse.ok) {
      const _frontendResponse = {
        success: true,
        message: lambdaData.message || 'Password changed successfully',
      };

      return NextResponse.json(frontendResponse);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: lambdaData.error || 'Failed to change password',
        },
        { status: lambdaResponse.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
