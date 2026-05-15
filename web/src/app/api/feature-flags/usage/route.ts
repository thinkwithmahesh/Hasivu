import { NextRequest, NextResponse } from 'next/server';
import { forwardToExpressApi } from '@/app/api/_utils/proxy';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.flagKey || !body?.action) {
    return NextResponse.json(
      { success: false, error: 'flagKey and action are required' },
      { status: 400 }
    );
  }

  const upstream = await forwardToExpressApi(request, '/v1/analytics/track', {
    method: 'POST',
    body: JSON.stringify({
      name: 'feature_flag_usage',
      value: 1,
      dimensions: {
        flagKey: String(body.flagKey),
        action: String(body.action),
      },
      metadata: body.metadata || {},
    }),
  }).catch(() => null);

  if (!upstream?.ok) {
    return NextResponse.json({ success: true, degraded: true });
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const flagKey = request.nextUrl.searchParams.get('flagKey');
  if (!flagKey) {
    return NextResponse.json({ success: false, error: 'flagKey is required' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    data: null,
    degraded: true,
    message: `Usage aggregation is not exposed for ${flagKey}`,
  });
}
