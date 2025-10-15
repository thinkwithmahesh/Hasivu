import { NextRequest, NextResponse } from 'next/server';

const LAMBDA_RFID_BULK_IMPORT_URL =
  process.env.LAMBDA_RFID_BULK_IMPORT_URL ||
  'https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/rfid/bulk-import';

// POST /api/rfid/bulk-import - Bulk import RFID cards
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
    if (!body.cards || !Array.isArray(body.cards) || body.cards.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cards array is required and must not be empty',
        },
        { status: 400 }
      );
    }

    // Forward request to Lambda function
    const lambdaResponse = await fetch(LAMBDA_RFID_BULK_IMPORT_URL, {
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
        message: lambdaData.message || 'RFID cards imported successfully',
      };

      return NextResponse.json(frontendResponse);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: lambdaData.error || 'Bulk import failed',
        },
        { status: lambdaResponse.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
