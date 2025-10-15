import { NextRequest, NextResponse } from 'next/server';

const LAMBDA_AUTH_LOGIN_URL =
  process.env.LAMBDA_AUTH_LOGIN_URL ||
  'https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/auth/login';

// POST /api/auth/login - User login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    // Forward request to Lambda function
    const lambdaResponse = await fetch(LAMBDA_AUTH_LOGIN_URL, {
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
      // Extract tokens and set them as httpOnly cookies
      const { accessToken, refreshToken, ...userData } = lambdaData.data || lambdaData;

      const response = NextResponse.json({
        success: true,
        data: userData,
        message: 'Login successful',
      });

      // Set httpOnly cookies for tokens
      if (accessToken) {
        response.cookies.set('auth-token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24, // 24 hours
        });
      }

      if (refreshToken) {
        response.cookies.set('refresh-token', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }

      return response;
    } else {
      // Handle Lambda errors
      return NextResponse.json(
        {
          success: false,
          error: lambdaData.error || 'Login failed',
        },
        { status: lambdaResponse.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
