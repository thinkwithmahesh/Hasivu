import { NextRequest } from 'next/server';

import { kitchenOrders, ok } from '../../../../_utils/launch-data';

export async function PATCH(
  request: NextRequest,
  context: { params: { orderId: string } }
) {
  const body = await request.json().catch(() => ({}));
  const order = kitchenOrders.find(item => item.id === context.params.orderId) || kitchenOrders[0];

  return ok({
    ...order,
    status: body.status || order.status,
    actualTime: body.status === 'completed' ? order.estimatedTime : order.actualTime,
    updatedAt: new Date().toISOString(),
  });
}
