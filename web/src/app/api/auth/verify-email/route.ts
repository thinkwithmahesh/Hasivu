import { NextRequest, NextResponse } from 'next/server';

const _LAMBDA_AUTH_VERIFY_EMAIL_URL =
  process.env.LAMBDA_AUTH_VERIFY_EMAIL_URL ||
  'https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/auth/verify-email';

export async function POST(request: NextRequest) {
  try {
    const _body = await request.json();

    // Validate required fields
    if (!body.token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Forward request to Lambda function
    const _lambdaResponse = await fetch(LAMBDA_AUTH_VERIFY_EMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
        message: lambdaData.message || 'Email verified successfully',
        user: lambdaData.user,
      };

      return NextResponse.json(frontendResponse);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: lambdaData.error || 'Failed to verify email',
        },
        { status: lambdaResponse.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
