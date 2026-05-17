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

// POST /api/rfid/delivery-verification - Record delivery verification
export async function POST(request: NextRequest) {
  try {
    // Get auth token from httpOnly cookie
    const authToken = getAccessTokenFromRequest(request);

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Basic validation
    const cardNumber = body.cardNumber ?? body.cardId;
    if (!cardNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Card number is required',
        },
        { status: 400 }
      );
    }

    const upstreamBody = {
      ...body,
      cardNumber,
    };
    delete upstreamBody.cardId;
    delete upstreamBody.studentId;
    delete upstreamBody.schoolId;

    const upstream = await forwardToExpressApi(request, '/v1/rfid/verify-delivery', {
      method: 'POST',
      headers: buildProxyHeaders(request, authToken),
      body: JSON.stringify(upstreamBody),
    });

    const data = await jsonFromUpstream(upstream);

    if (!upstream.ok) {
      return NextResponse.json(upstreamError(data, 'Delivery verification failed'), {
        status: upstream.status,
      });
    }

    return NextResponse.json(normalizeProxyResponse(data, 'Delivery verified successfully'), {
      status: upstream.status,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
