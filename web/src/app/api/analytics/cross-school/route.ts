import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenFromRequest, fetchConfiguredProxy } from '@/app/api/_utils/proxy';
const LAMBDA_CROSS_SCHOOL_ANALYTICS_URL = process.env.LAMBDA_CROSS_SCHOOL_ANALYTICS_URL;

;

export async function POST(request: NextRequest) {
  try {
    // Get auth token from httpOnly cookie
    const authToken = getAccessTokenFromRequest(request);

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const body = await request.json();

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
    const lambdaResponse = await fetchConfiguredProxy(LAMBDA_CROSS_SCHOOL_ANALYTICS_URL, 'LAMBDA_CROSS_SCHOOL_ANALYTICS_URL', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
      },
      body: JSON.stringify(body),
    });

    const lambdaData = await lambdaResponse.json();

    // Handle Lambda response and transform to expected frontend format
    if (lambdaResponse.ok) {
      // Transform Lambda response to frontend expected format
      const frontendResponse = {
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
