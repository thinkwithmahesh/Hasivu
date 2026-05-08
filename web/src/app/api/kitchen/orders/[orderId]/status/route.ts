import { NextRequest, NextResponse } from 'next/server';

import { forwardKitchenRequest, normalizeKitchenOrder } from '../../../_utils';

export async function PATCH(
  request: NextRequest,
  context: { params: { orderId: string } }
) {
  const body = await request.text();
  const forwarded = await forwardKitchenRequest(
    request,
    `/v1/orders/${encodeURIComponent(context.params.orderId)}`,
    { method: 'PUT', body },
    'Failed to update kitchen order status'
  );

  if (!forwarded.ok) {
    return forwarded.response;
  }

  const payload = forwarded.data as { data?: unknown };
  return NextResponse.json({ success: true, data: normalizeKitchenOrder(payload.data) }, { status: forwarded.status });
}
