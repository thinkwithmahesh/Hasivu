import { NextRequest, NextResponse } from 'next/server';

import { forwardKitchenRequest, normalizeKitchenOrder } from '../../../_utils';

export async function PUT(request: NextRequest, context: { params: { orderId: string } }) {
  const body = await request.text();
  const forwarded = await forwardKitchenRequest(
    request,
    `/kitchen/orders/${encodeURIComponent(context.params.orderId)}/assign`,
    { method: 'PUT', body },
    'Failed to assign kitchen order'
  );

  if (!forwarded.ok) {
    return forwarded.response;
  }

  const payload = forwarded.data as { data?: unknown };
  return NextResponse.json({ success: true, data: normalizeKitchenOrder(payload.data) }, { status: forwarded.status });
}
