import { NextRequest, NextResponse } from 'next/server';
import { forwardToExpressApi } from '@/app/api/_utils/proxy';

export async function GET(request: NextRequest) {
  const upstream = await forwardToExpressApi(
    request,
    `/v1/notifications${request.nextUrl.search}`,
    { method: 'GET' }
  ).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ success: true, data: [], degraded: true });
  }

  const payload = await upstream.json().catch(() => null);
  return NextResponse.json(payload || { success: false, error: 'Invalid notification response' }, {
    status: upstream.status,
  });
}
