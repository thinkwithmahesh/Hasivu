import { NextRequest, NextResponse } from 'next/server';
import {
  forwardToExpressApi,
  buildProxyHeaders,
  getAccessTokenFromRequest,
} from '@/app/api/_utils/proxy';
import { readJsonResponse, upstreamError } from '@/app/api/_utils/feature-scope';

async function proxyToInventory(request: NextRequest, method: string, params: { path: string[] }) {
  try {
    const authToken = getAccessTokenFromRequest(request);
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const subPath = params.path.join('/');
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const expressPath = queryString
      ? `/v1/inventory/${subPath}?${queryString}`
      : `/v1/inventory/${subPath}`;

    const init: RequestInit = {
      method,
      headers: buildProxyHeaders(request, authToken),
    };

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = await request.json();
        init.body = JSON.stringify(body);
      } catch {
        // No body for this request
      }
    }

    const upstream = await forwardToExpressApi(request, expressPath, init);
    const data = await readJsonResponse(upstream);

    if (!upstream.ok) {
      return NextResponse.json(upstreamError(data, `Inventory API error`), {
        status: upstream.status,
      });
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyToInventory(request, 'GET', params);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyToInventory(request, 'POST', params);
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyToInventory(request, 'PUT', params);
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyToInventory(request, 'PATCH', params);
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyToInventory(request, 'DELETE', params);
}
