import { NextRequest, NextResponse } from 'next/server';
import { fetchConfiguredProxy } from '@/app/api/_utils/proxy';
const LAMBDA_AUTH_VERIFY_EMAIL_URL = process.env.LAMBDA_AUTH_VERIFY_EMAIL_URL;

;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Forward request to Lambda function
    const lambdaResponse = await fetchConfiguredProxy(LAMBDA_AUTH_VERIFY_EMAIL_URL, 'LAMBDA_AUTH_VERIFY_EMAIL_URL', {
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
