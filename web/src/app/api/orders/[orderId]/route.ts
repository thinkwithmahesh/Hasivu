import { NextRequest, NextResponse } from 'next/server';
import {
  buildProxyHeaders,
  configuredProxyUrl,
  fetchConfiguredProxy,
  forwardToExpressApi,
  getAccessTokenFromRequest,
} from '@/app/api/_utils/proxy';

const LAMBDA_ORDERS_GET_URL = process.env.LAMBDA_ORDERS_GET_URL;
const LAMBDA_ORDERS_UPDATE_URL = process.env.LAMBDA_ORDERS_UPDATE_URL;

async function jsonFromUpstream(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function normalizeProxyResponse(data: unknown, fallbackMessage?: string): Record<string, unknown> {
  const payload =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : { data };

  return {
    success: payload.success ?? true,
    data: payload.data ?? payload,
    ...(fallbackMessage || payload.message
      ? { message: payload.message ?? fallbackMessage }
      : {}),
    ...(payload.error ? { error: payload.error } : {}),
  };
}

function upstreamError(data: unknown, fallbackError: string): Record<string, unknown> {
  const payload =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  return {
    success: false,
    error: payload.error ?? payload.message ?? fallbackError,
  };
}

function requireOrderId(orderId: string | undefined) {
  if (!orderId) {
    return NextResponse.json(
      {
        success: false,
        error: 'Order ID is required',
      },
      { status: 400 }
    );
  }

  return null;
}

function requireAuth(request: NextRequest) {
  const authToken = getAccessTokenFromRequest(request);

  if (!authToken) {
    return {
      authToken: null,
      response: NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      ),
    };
  }

  return { authToken, response: null };
}

// GET /api/orders/[orderId] - Get specific order
export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const missingOrderId = requireOrderId(params.orderId);
    if (missingOrderId) {
      return missingOrderId;
    }

    const { authToken, response } = requireAuth(request);
    if (response) {
      return response;
    }

    const headers = buildProxyHeaders(request, authToken);
    const lambdaUrl = configuredProxyUrl(LAMBDA_ORDERS_GET_URL)
      ? `${LAMBDA_ORDERS_GET_URL}/${params.orderId}`
      : null;

    const upstream = lambdaUrl
      ? await fetchConfiguredProxy(lambdaUrl, 'LAMBDA_ORDERS_GET_URL', {
          method: 'GET',
          headers,
        })
      : await forwardToExpressApi(request, `/v1/orders/${params.orderId}`, {
          method: 'GET',
          headers,
        });

    const data = await jsonFromUpstream(upstream);

    if (!upstream.ok) {
      return NextResponse.json(upstreamError(data, 'Failed to fetch order'), {
        status: upstream.status,
      });
    }

    return NextResponse.json(normalizeProxyResponse(data), { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/orders/[orderId] - Update order
export async function PUT(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const missingOrderId = requireOrderId(params.orderId);
    if (missingOrderId) {
      return missingOrderId;
    }

    const { authToken, response } = requireAuth(request);
    if (response) {
      return response;
    }

    const body = await request.text();
    const headers = buildProxyHeaders(request, authToken);
    const lambdaUrl = configuredProxyUrl(LAMBDA_ORDERS_UPDATE_URL)
      ? `${LAMBDA_ORDERS_UPDATE_URL}/${params.orderId}`
      : null;

    const upstream = lambdaUrl
      ? await fetchConfiguredProxy(lambdaUrl, 'LAMBDA_ORDERS_UPDATE_URL', {
          method: 'PUT',
          headers,
          body,
        })
      : await forwardToExpressApi(request, `/v1/orders/${params.orderId}`, {
          method: 'PUT',
          headers,
          body,
        });

    const data = await jsonFromUpstream(upstream);

    if (!upstream.ok) {
      return NextResponse.json(upstreamError(data, 'Failed to update order'), {
        status: upstream.status,
      });
    }

    return NextResponse.json(normalizeProxyResponse(data, 'Order updated successfully'), {
      status: upstream.status,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/orders/[orderId] - Cancel order
export async function DELETE(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const missingOrderId = requireOrderId(params.orderId);
    if (missingOrderId) {
      return missingOrderId;
    }

    const { authToken, response } = requireAuth(request);
    if (response) {
      return response;
    }

    const headers = buildProxyHeaders(request, authToken);
    const lambdaUrl = configuredProxyUrl(LAMBDA_ORDERS_UPDATE_URL)
      ? `${LAMBDA_ORDERS_UPDATE_URL}/${params.orderId}`
      : null;

    const upstream = lambdaUrl
      ? await fetchConfiguredProxy(lambdaUrl, 'LAMBDA_ORDERS_UPDATE_URL', {
          method: 'DELETE',
          headers,
        })
      : await forwardToExpressApi(request, `/v1/orders/${params.orderId}/cancel`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ reason: 'Cancelled from parent order history' }),
        });

    const data = await jsonFromUpstream(upstream);

    if (!upstream.ok) {
      return NextResponse.json(upstreamError(data, 'Failed to cancel order'), {
        status: upstream.status,
      });
    }

    return NextResponse.json(normalizeProxyResponse(data, 'Order cancelled successfully'), {
      status: upstream.status,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
