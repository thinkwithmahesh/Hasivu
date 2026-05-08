import { NextRequest, NextResponse } from 'next/server';
import {
  buildProxyHeaders,
  copyUpstreamSetCookieHeaders,
  fetchConfiguredProxy,
  forwardToExpressApi,
  getRefreshTokenFromRequest,
  resolveProxyUrl,
  setAuthCookies,
} from '@/app/api/_utils/proxy';

const LAMBDA_AUTH_REFRESH_URL = resolveProxyUrl(process.env.LAMBDA_AUTH_REFRESH_URL);

export async function POST(request: NextRequest) {
  try {
    if (LAMBDA_AUTH_REFRESH_URL) {
      const refreshToken = getRefreshTokenFromRequest(request);
      if (!refreshToken) {
        return NextResponse.json(
          { success: false, error: 'No refresh token found' },
          { status: 401 }
        );
      }

      const upstream = await fetchConfiguredProxy(LAMBDA_AUTH_REFRESH_URL, 'LAMBDA_AUTH_REFRESH_URL', {
        method: 'POST',
        headers: buildProxyHeaders(request),
        body: JSON.stringify({ refreshToken }),
      });

      const data = await upstream.json();
      if (!upstream.ok) {
        return NextResponse.json(
          { success: false, error: data?.error || 'Token refresh failed' },
          { status: upstream.status }
        );
      }

      const accessToken = data?.tokens?.accessToken || data?.accessToken;
      const nextRefreshToken = data?.tokens?.refreshToken || data?.refreshToken;
      const response = NextResponse.json({
        success: true,
        message: data?.message || 'Token refreshed',
      });

      return setAuthCookies(response, { accessToken, refreshToken: nextRefreshToken });
    }

    const upstream = await forwardToExpressApi(request, '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const text = await upstream.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      data = { success: false, error: 'Invalid response from auth server' };
    }

    const response = NextResponse.json(data, { status: upstream.status });
    copyUpstreamSetCookieHeaders(upstream, response);
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
