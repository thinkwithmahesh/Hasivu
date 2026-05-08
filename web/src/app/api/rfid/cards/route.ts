import { NextRequest, NextResponse } from 'next/server';
import {
  getAccessTokenFromRequest,
  fetchConfiguredProxy,
  configuredProxyUrl,
} from '@/app/api/_utils/proxy';
const LAMBDA_RFID_CREATE_CARD_URL = process.env.LAMBDA_RFID_CREATE_CARD_URL;

;

const launchCards = [
  {
    id: 'rfid-demo-001',
    cardNumber: 'RFID-001',
    studentId: 'STU-001',
    schoolId: 'school_demo_001',
    isActive: true,
    issuedAt: '2026-05-01T00:00:00.000Z',
    lastUsedAt: '2026-05-08T08:15:00.000Z',
    student: { firstName: 'Test', lastName: 'Student' },
  },
];

export async function GET(request: NextRequest) {
  const authToken = getAccessTokenFromRequest(request);
  if (!authToken) {
    return NextResponse.json(
      { success: false, error: 'No authentication token found' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: launchCards,
    message: 'RFID cards loaded',
  });
}

// POST /api/rfid/cards - Create RFID card
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
    if (!body.studentId || !body.schoolId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student ID and School ID are required',
        },
        { status: 400 }
      );
    }

    const lambdaUrl = configuredProxyUrl(LAMBDA_RFID_CREATE_CARD_URL);
    if (!lambdaUrl) {
      return NextResponse.json(
        {
          success: true,
          data: {
            id: `rfid-${Date.now()}`,
            studentId: body.studentId,
            schoolId: body.schoolId,
            cardNumber: body.cardNumber,
            status: 'active',
          },
          message: 'RFID card registered in launch-local mode',
        },
        { status: 201 }
      );
    }

    // Forward request to the configured legacy provider only when explicitly enabled.
    const lambdaResponse = await fetchConfiguredProxy(LAMBDA_RFID_CREATE_CARD_URL, 'LAMBDA_RFID_CREATE_CARD_URL', {
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
        message: lambdaData.message || 'RFID card created successfully',
      };

      return NextResponse.json(frontendResponse, { status: 201 });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: lambdaData.error || 'Failed to create RFID card',
        },
        { status: lambdaResponse.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
