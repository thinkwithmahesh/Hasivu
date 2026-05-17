import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenFromRequest, fetchConfiguredProxy } from '@/app/api/_utils/proxy';
const LAMBDA_MOBILE_DEVICE_REGISTRATION_URL = process.env.LAMBDA_MOBILE_DEVICE_REGISTRATION_URL;

;

// POST /api/mobile/device-registration - Register mobile device
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
    if (!body.deviceToken || !body.deviceType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Device token and device type are required',
        },
        { status: 400 }
      );
    }

    // Forward request to Lambda function
    const lambdaResponse = await fetchConfiguredProxy(LAMBDA_MOBILE_DEVICE_REGISTRATION_URL, 'LAMBDA_MOBILE_DEVICE_REGISTRATION_URL', {
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
      const frontendResponse = {
        success: true,
        data: lambdaData.data || lambdaData,
        message: lambdaData.message || 'Device registered successfully',
      };

      return NextResponse.json(frontendResponse);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: lambdaData.error || 'Device registration failed',
        },
        { status: lambdaResponse.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
