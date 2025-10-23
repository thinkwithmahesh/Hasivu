import { NextRequest, NextResponse } from 'next/server';

const LAMBDA_AUTH_REGISTER_URL =
  process.env.LAMBDA_AUTH_REGISTER_URL || 'http://localhost:3001/auth/register';

// POST /api/auth/register - User registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.email || !body.password || !body.firstName || !body.lastName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email, password, firstName, and lastName are required',
        },
        { status: 400 }
      );
    }

    // Forward request to Lambda function
    const lambdaResponse = await fetch(LAMBDA_AUTH_REGISTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
      },
      body: JSON.stringify(body),
    });

    const lambdaData = await lambdaResponse.json();

    // Handle Lambda response
    if (lambdaResponse.ok) {
      return NextResponse.json({
        success: true,
        data: lambdaData.data || lambdaData,
        message: lambdaData.message || 'Registration successful',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: lambdaData.error || 'Registration failed',
        },
        { status: lambdaResponse.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
