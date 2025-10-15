import { NextRequest, NextResponse } from 'next/server';

const LAMBDA_RFID_DELIVERY_VERIFICATION_URL =
  process.env.LAMBDA_RFID_DELIVERY_VERIFICATION_URL ||
  'https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/rfid/delivery-verification';

// POST /api/rfid/delivery-verification - Record delivery verification
export async function POST(request: NextRequest) {
  try {
    // Get auth token from httpOnly cookie
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Basic validation
    if (!body.cardId || !body.readerId || !body.studentId || !body.schoolId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Card ID, reader ID, student ID, and school ID are required',
        },
        { status: 400 }
      );
    }

    // Forward request to Lambda function
    const lambdaResponse = await fetch(LAMBDA_RFID_DELIVERY_VERIFICATION_URL, {
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
        message: lambdaData.message || 'Delivery verified successfully',
      };

      return NextResponse.json(frontendResponse);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: lambdaData.error || 'Delivery verification failed',
        },
        { status: lambdaResponse.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
