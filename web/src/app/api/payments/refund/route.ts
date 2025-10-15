import { NextRequest, NextResponse } from 'next/server';

const LAMBDA_PAYMENTS_REFUND_URL =
  process.env.LAMBDA_PAYMENTS_REFUND_URL ||
  'https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/payments/refund';

// POST /api/payments/refund - Process refund
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
    if (!body.paymentId || !body.reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment ID and reason are required',
        },
        { status: 400 }
      );
    }

    // Forward request to Lambda function
    const lambdaResponse = await fetch(LAMBDA_PAYMENTS_REFUND_URL, {
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
        message: lambdaData.message || 'Refund processed successfully',
      };

      return NextResponse.json(frontendResponse);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: lambdaData.error || 'Refund processing failed',
        },
        { status: lambdaResponse.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
