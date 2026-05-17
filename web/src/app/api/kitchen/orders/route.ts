import { NextRequest, NextResponse } from 'next/server';

import { forwardKitchenRequest, normalizeKitchenOrder } from '../_utils';

export async function GET(request: NextRequest) {
  const params = new URLSearchParams(request.nextUrl.searchParams);
  if (!params.has('limit')) {
    params.set('limit', '100');
  }

  const query = params.toString();
  const forwarded = await forwardKitchenRequest(
    request,
    query ? `/v1/orders?${query}` : '/v1/orders',
    { method: 'GET' },
    'Failed to fetch kitchen orders'
  );

  if (!forwarded.ok) {
    return forwarded.response;
  }

  const payload = forwarded.data as { data?: unknown };
  const orders = Array.isArray(payload.data) ? payload.data.map(normalizeKitchenOrder) : [];

  return NextResponse.json({ success: true, data: orders }, { status: forwarded.status });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const forwarded = await forwardKitchenRequest(
    request,
    '/v1/orders',
    { method: 'POST', body },
    'Failed to create kitchen order'
  );

  if (!forwarded.ok) {
    return forwarded.response;
  }

  const payload = forwarded.data as { data?: unknown };
  return NextResponse.json(
    { success: true, data: normalizeKitchenOrder(payload.data) },
    { status: forwarded.status === 200 ? 201 : forwarded.status }
  );
}
