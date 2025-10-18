import { NextRequest, NextResponse } from 'next/server';

const LAMBDA_AUTH_FORGOT_PASSWORD_URL =
  process.env.LAMBDA_AUTH_FORGOT_PASSWORD_URL ||
  'https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/auth/forgot-password';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Forward request to Lambda function
    const lambdaResponse = await fetch(LAMBDA_AUTH_FORGOT_PASSWORD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
      },
      body: JSON.stringify(body),
    });

    const lambdaData = await lambdaResponse.json();

    // Handle Lambda response and transform to expected frontend format
    if (lambdaResponse.ok) {
      const frontendResponse = {
        success: true,
        message: lambdaData.message || 'Password reset email sent successfully',
      };

      return NextResponse.json(frontendResponse);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: lambdaData.error || 'Failed to send password reset email',
        },
        { status: lambdaResponse.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
