import { NextRequest, NextResponse } from 'next/server';
import {
  buildProxyHeaders,
  forwardToExpressApi,
  getAccessTokenFromRequest,
} from '@/app/api/_utils/proxy';

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

// GET /api/rfid/devices
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
    const expressPath = queryString ? `/v1/rfid/readers?${queryString}` : '/v1/rfid/readers';
    const headers = buildProxyHeaders(request, authToken);

    const upstream = await forwardToExpressApi(request, expressPath, {
      method: 'GET',
      headers,
    });

    const data = await jsonFromUpstream(upstream);

    if (!upstream.ok) {
      return NextResponse.json(upstreamError(data, 'Failed to fetch RFID devices'), {
        status: upstream.status,
      });
    }

    return NextResponse.json(normalizeProxyResponse(data, 'RFID devices retrieved successfully'), {
      status: upstream.status,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
