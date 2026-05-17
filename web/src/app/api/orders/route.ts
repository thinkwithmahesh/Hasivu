import { NextRequest, NextResponse } from 'next/server';
import {
  buildProxyHeaders,
  configuredProxyUrl,
  fetchConfiguredProxy,
  forwardToExpressApi,
  getAccessTokenFromRequest,
} from '@/app/api/_utils/proxy';

const LAMBDA_ORDERS_CREATE_URL = process.env.LAMBDA_ORDERS_CREATE_URL;
const LAMBDA_ORDERS_LIST_URL = process.env.LAMBDA_ORDERS_LIST_URL;

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

function normalizeProxyResponse(data: unknown, fallbackMessage: string): Record<string, unknown> {
  const payload =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : { data };

  return {
    success: payload.success ?? true,
    data: payload.data ?? payload,
    message: payload.message ?? fallbackMessage,
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

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const authToken = getAccessTokenFromRequest(request);

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const body = await request.text();
    const headers = buildProxyHeaders(request, authToken);
    const upstream = configuredProxyUrl(LAMBDA_ORDERS_CREATE_URL)
      ? await fetchConfiguredProxy(LAMBDA_ORDERS_CREATE_URL, 'LAMBDA_ORDERS_CREATE_URL', {
          method: 'POST',
          headers,
          body,
        })
      : await forwardToExpressApi(request, '/v1/orders', {
          method: 'POST',
          headers,
          body,
        });

    const data = await jsonFromUpstream(upstream);

    if (!upstream.ok) {
      return NextResponse.json(upstreamError(data, 'Failed to create order'), {
        status: upstream.status,
      });
    }

    return NextResponse.json(normalizeProxyResponse(data, 'Order created successfully'), {
      status: upstream.status === 200 ? 201 : upstream.status,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/orders - List orders
export async function GET(request: NextRequest) {
  try {
    const authToken = getAccessTokenFromRequest(request);

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const lambdaUrl =
      LAMBDA_ORDERS_LIST_URL && queryString
        ? `${LAMBDA_ORDERS_LIST_URL}?${queryString}`
        : LAMBDA_ORDERS_LIST_URL;
    const expressPath = queryString ? `/v1/orders?${queryString}` : '/v1/orders';
    const headers = buildProxyHeaders(request, authToken);

    const upstream = configuredProxyUrl(lambdaUrl)
      ? await fetchConfiguredProxy(lambdaUrl, 'LAMBDA_ORDERS_LIST_URL', {
          method: 'GET',
          headers,
        })
      : await forwardToExpressApi(request, expressPath, {
          method: 'GET',
          headers,
        });

    const data = await jsonFromUpstream(upstream);

    if (!upstream.ok) {
      return NextResponse.json(upstreamError(data, 'Failed to fetch orders'), {
        status: upstream.status,
      });
    }

    return NextResponse.json(normalizeProxyResponse(data, 'Orders retrieved successfully'), {
      status: upstream.status,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
