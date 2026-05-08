import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenFromRequest } from '@/app/api/_utils/proxy';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const authToken = getAccessTokenFromRequest(request);
  if (!authToken) {
    return NextResponse.json(
      { success: false, error: 'No authentication token found' },
      { status: 401 }
    );
  }

  const { cardId } = await params;
  if (!cardId) {
    return NextResponse.json({ success: false, error: 'Card ID is required' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: cardId,
      studentId: '',
      cardNumber: '',
      status: 'inactive',
    },
    message: 'RFID card deactivated',
  });
}
