import { NextRequest, NextResponse } from 'next/server';
import { forwardToExpressApi } from '@/app/api/_utils/proxy';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.name || body.value === undefined) {
    return NextResponse.json(
      { success: false, error: 'name and value are required' },
      { status: 400 }
    );
  }

  const upstream = await forwardToExpressApi(request, '/v1/analytics/track', {
    method: 'POST',
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!upstream?.ok) {
    return NextResponse.json({ success: true, degraded: true });
  }

  const payload = await upstream.json().catch(() => null);
  return NextResponse.json(payload || { success: true });
}
