import { NextRequest } from 'next/server';

import { kitchenOrders, ok } from '../../_utils/launch-data';

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status');
  const priority = request.nextUrl.searchParams.get('priority');

  const data = kitchenOrders.filter(order => {
    const statusMatches = status ? order.status === status : true;
    const priorityMatches = priority ? order.priority === priority : true;
    return statusMatches && priorityMatches;
  });

  return ok(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  return ok({
    ...kitchenOrders[0],
    ...body,
    id: `kitchen-order-${Date.now()}`,
    orderNumber: `#${Math.floor(10000 + Math.random() * 89999)}`,
    status: 'pending',
    orderTime: new Date().toISOString(),
  });
}
