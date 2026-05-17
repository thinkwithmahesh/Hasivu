import { NextRequest, NextResponse } from 'next/server';

import {
  buildProxyHeaders,
  forwardToExpressApi,
  getAccessTokenFromRequest,
} from '@/app/api/_utils/proxy';
import { readJsonResponse, upstreamError } from '@/app/api/_utils/feature-scope';

type KitchenOrderItem = {
  id: string;
  name: string;
  quantity: number;
  category: string;
  allergens: string[];
  preparationTime: number;
};

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string') {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function normalizeKitchenOrder(order: any) {
  const metadata = parseJsonObject(order?.metadata);
  const orderItems: KitchenOrderItem[] = Array.isArray(order?.orderItems)
    ? order.orderItems.map((item: any) => ({
        id: item.id,
        name: item.menuItem?.name || item.name || 'Meal item',
        quantity: item.quantity || 1,
        category: item.menuItem?.category || item.category || 'Meal',
        allergens: item.menuItem?.allergens || item.allergens || [],
        preparationTime: Number(item.menuItem?.preparationTime || metadata.preparationTime || 20),
      }))
    : [];

  const studentName =
    [order?.student?.firstName, order?.student?.lastName].filter(Boolean).join(' ') ||
    order?.studentName ||
    'Student';

  const assignedStaff =
    order?.assignedStaff &&
    ([order.assignedStaff.firstName, order.assignedStaff.lastName].filter(Boolean).join(' ') ||
      order.assignedStaff.email);

  return {
    id: order.id,
    orderNumber: order.orderNumber ? `#${String(order.orderNumber).replace(/^#/, '')}` : order.id,
    studentName,
    studentId: order.studentId,
    schoolId: order.schoolId,
    items: orderItems,
    status: order.status,
    priority: metadata.priority || 'medium',
    orderTime: order.orderDate || order.createdAt,
    estimatedTime: Number(metadata.estimatedTime || 20),
    actualTime: order.deliveredAt ? Number(metadata.actualTime || metadata.estimatedTime || 20) : undefined,
    assignedStaff,
    assignedStaffId: order.assignedStaffId,
    location: metadata.location || 'Kitchen counter',
    totalAmount: order.totalAmount || 0,
    paymentStatus: order.paymentStatus,
    deliveryDate: order.deliveryDate,
  };
}

export async function forwardKitchenRequest(
  request: NextRequest,
  expressPath: string,
  init: RequestInit,
  fallbackError: string
): Promise<{ response: NextResponse; ok: boolean; data: unknown; status: number }> {
  const authToken = getAccessTokenFromRequest(request);
  if (!authToken) {
    return {
      response: NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      ),
      ok: false,
      data: null,
      status: 401,
    };
  }

  const upstream = await forwardToExpressApi(request, expressPath, {
    ...init,
    headers: buildProxyHeaders(request, authToken),
  });
  const data = await readJsonResponse(upstream);

  if (!upstream.ok) {
    return {
      response: NextResponse.json(upstreamError(data, fallbackError), { status: upstream.status }),
      ok: false,
      data,
      status: upstream.status,
    };
  }

  return {
    response: NextResponse.json({ success: true, data }),
    ok: true,
    data,
    status: upstream.status,
  };
}
