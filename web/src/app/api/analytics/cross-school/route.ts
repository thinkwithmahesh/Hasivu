import { NextRequest, NextResponse } from 'next/server';

const _LAMBDA_CROSS_SCHOOL_ANALYTICS_URL =
  process.env.LAMBDA_CROSS_SCHOOL_ANALYTICS_URL ||
  'https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/analytics/cross-school';

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

    // Basic validation
    if (!body.region || !body.analyticsType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: region, analyticsType',
        },
        { status: 400 }
      );
    }

    // Forward request to Lambda function
    const _lambdaResponse = await fetch(LAMBDA_CROSS_SCHOOL_ANALYTICS_URL, {
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
      // Transform Lambda response to frontend expected format
      const _frontendResponse = {
        success: true,
        data: lambdaData.data || lambdaData,
      };

      return NextResponse.json(frontendResponse);
    } else {
      // Handle Lambda errors
      return NextResponse.json(
        {
          success: false,
          error: lambdaData.error || 'Failed to generate cross-school analytics',
        },
        { status: lambdaResponse.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
