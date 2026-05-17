import { NextRequest, NextResponse } from 'next/server';
import {
  buildProxyHeaders,
  forwardToExpressApi,
  getAccessTokenFromRequest,
} from '@/app/api/_utils/proxy';

async function jsonFromUpstream(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
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

export async function POST(request: NextRequest) {
  try {
    const authToken = getAccessTokenFromRequest(request);
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Map frontend fields (cardId, deviceId) to backend fields (cardNumber, readerId)
    const mappedBody = {
      cardNumber: body.cardId || body.cardNumber,
      readerId: body.deviceId || body.readerId,
      orderId: body.orderId,
      timestamp: body.timestamp,
    };

    const upstream = await forwardToExpressApi(request, '/v1/rfid/verify-delivery', {
      method: 'POST',
      headers: buildProxyHeaders(request, authToken),
      body: JSON.stringify(mappedBody),
    });

    const data = await jsonFromUpstream(upstream);

    if (!upstream.ok) {
      return NextResponse.json(upstreamError(data, 'Failed to verify delivery'), {
        status: upstream.status,
      });
    }

    return NextResponse.json(normalizeProxyResponse(data, 'Delivery verified successfully'), {
      status: upstream.status,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
