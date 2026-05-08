import { NextRequest, NextResponse } from 'next/server';

import { forwardKitchenRequest } from '../_utils';

export async function GET(request: NextRequest) {
  const schoolId = request.nextUrl.searchParams.get('schoolId');
  if (!schoolId) {
    return NextResponse.json(
      { success: false, error: 'schoolId is required to list assignable kitchen staff' },
      { status: 400 }
    );
  }

  const forwarded = await forwardKitchenRequest(
    request,
    `/kitchen/staff?schoolId=${encodeURIComponent(schoolId)}`,
    { method: 'GET' },
    'Failed to fetch kitchen staff'
  );

  if (!forwarded.ok) {
    return forwarded.response;
  }

  const payload = forwarded.data as { data?: unknown };
  return NextResponse.json({ success: true, data: payload.data ?? [] }, { status: forwarded.status });
}
