import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenFromRequest, fetchConfiguredProxy } from '@/app/api/_utils/proxy';
const LAMBDA_PAYMENTS_ANALYTICS_URL = process.env.LAMBDA_PAYMENTS_ANALYTICS_URL;

;

// GET /api/payments/analytics - Get payment analytics
export async function GET(request: NextRequest) {
  try {
    // Get auth token from httpOnly cookie
    const authToken = getAccessTokenFromRequest(request);

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url =
      LAMBDA_PAYMENTS_ANALYTICS_URL && queryString
        ? `${LAMBDA_PAYMENTS_ANALYTICS_URL}?${queryString}`
        : LAMBDA_PAYMENTS_ANALYTICS_URL;

    // Forward request to Lambda function
    const lambdaResponse = await fetchConfiguredProxy(url, 'LAMBDA_PAYMENTS_ANALYTICS_URL', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        'User-Agent': request.headers.get('user-agent') || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
      },
    });

    const lambdaData = await lambdaResponse.json();

    // Handle Lambda response and transform to expected frontend format
    if (lambdaResponse.ok) {
      const frontendResponse = {
        success: true,
        data: lambdaData.data || lambdaData,
        message: lambdaData.message || 'Payment analytics retrieved successfully',
      };

      return NextResponse.json(frontendResponse);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: lambdaData.error || 'Failed to fetch payment analytics',
        },
        { status: lambdaResponse.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
