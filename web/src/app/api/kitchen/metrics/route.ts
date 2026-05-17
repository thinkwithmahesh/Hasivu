import { NextRequest, NextResponse } from 'next/server';

import { forwardKitchenRequest, normalizeKitchenOrder } from '../_utils';

export async function GET(request: NextRequest) {
  const forwarded = await forwardKitchenRequest(
    request,
    '/v1/orders?limit=100&includeCompleted=false',
    { method: 'GET' },
    'Failed to fetch kitchen metrics'
  );

  if (!forwarded.ok) {
    return forwarded.response;
  }

  const payload = forwarded.data as { data?: unknown };
  const orders = Array.isArray(payload.data) ? payload.data.map(normalizeKitchenOrder) : [];
  const activeOrders = orders.filter(order =>
    ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status)
  );
  const completedOrders = orders.filter(order => ['delivered', 'completed'].includes(order.status));
  const prepTimes = orders
    .map(order => Number(order.actualTime || order.estimatedTime))
    .filter(value => Number.isFinite(value) && value > 0);
  const averagePreparationTime =
    prepTimes.length > 0
      ? Number((prepTimes.reduce((sum, value) => sum + value, 0) / prepTimes.length).toFixed(1))
      : 0;

  return NextResponse.json({
    success: true,
    data: {
      ordersInProgress: activeOrders.length,
      averagePreparationTime,
      completionRate:
        orders.length > 0 ? Number(((completedOrders.length / orders.length) * 100).toFixed(1)) : 0,
      staffEfficiency: 0,
      dailyRevenue: orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
      customerSatisfaction: 0,
      lowStockItems: 0,
      activeStaff: 0,
    },
  });
}
