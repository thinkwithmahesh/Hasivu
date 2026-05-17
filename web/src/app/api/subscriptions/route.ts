import { NextRequest, NextResponse } from 'next/server';
import {
  buildProxyHeaders,
  forwardToExpressApi,
  getAccessTokenFromRequest,
} from '@/app/api/_utils/proxy';
import { readJsonResponse, upstreamError } from '@/app/api/_utils/feature-scope';

const RESOURCE = 'Subscription';
const EXPRESS_BASE = '/v1/subscriptions';

async function proxy(request: NextRequest, method: string, pathSuffix = '') {
  try {
    const authToken = getAccessTokenFromRequest(request);
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const queryString = request.nextUrl.searchParams.toString();
    const suffix = pathSuffix ? `/${pathSuffix}` : '';
    const expressPath = `${EXPRESS_BASE}${suffix}${queryString ? `?${queryString}` : ''}`;
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

export async function GET(request: NextRequest) {
  return proxy(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxy(request, 'POST');
}
