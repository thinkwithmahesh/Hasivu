import { NextRequest, NextResponse } from 'next/server';
import {
  buildProxyHeaders,
  forwardToExpressApi,
  getAccessTokenFromRequest,
} from '@/app/api/_utils/proxy';
import { readJsonResponse, upstreamError } from '@/app/api/_utils/feature-scope';

const RESOURCE = 'Invoice';
const EXPRESS_BASE = '/v1/invoices';

type RouteContext = { params: { path: string[] } };

async function proxy(request: NextRequest, method: string, params: RouteContext['params']) {
  try {
    const authToken = getAccessTokenFromRequest(request);
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const subPath = params.path.join('/');
    const queryString = request.nextUrl.searchParams.toString();
    const expressPath = `${EXPRESS_BASE}/${subPath}${queryString ? `?${queryString}` : ''}`;
    const init: RequestInit = {
      method,
      headers: buildProxyHeaders(request, authToken),
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const text = await request.text();
      if (text) init.body = text;
    }

    const upstream = await forwardToExpressApi(request, expressPath, init);
    const data = await readJsonResponse(upstream);

    if (!upstream.ok) {
      return NextResponse.json(upstreamError(data, `${RESOURCE} API error`), {
        status: upstream.status,
      });
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, 'GET', context.params);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, 'POST', context.params);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, 'PUT', context.params);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, 'PATCH', context.params);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, 'DELETE', context.params);
}
