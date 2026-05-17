import { NextRequest, NextResponse } from 'next/server';
import {
  forwardToExpressApi,
  buildProxyHeaders,
  getAccessTokenFromRequest,
} from '@/app/api/_utils/proxy';
import { readJsonResponse, upstreamError } from '@/app/api/_utils/feature-scope';

export async function GET(request: NextRequest) {
  try {
    const authToken = getAccessTokenFromRequest(request);
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const upstream = await forwardToExpressApi(request, '/v1/inventory/suppliers', {
      method: 'GET',
      headers: buildProxyHeaders(request, authToken),
    });

    const data = await readJsonResponse(upstream);

    if (!upstream.ok) {
      return NextResponse.json(upstreamError(data, 'Failed to fetch suppliers'), {
        status: upstream.status,
      });
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
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
    const upstream = await forwardToExpressApi(request, '/v1/inventory/suppliers', {
      method: 'POST',
      headers: buildProxyHeaders(request, authToken),
      body: JSON.stringify(body),
    });

    const data = await readJsonResponse(upstream);

    if (!upstream.ok) {
      return NextResponse.json(upstreamError(data, 'Failed to create supplier'), {
        status: upstream.status,
      });
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
