import { NextRequest, NextResponse } from 'next/server';
import {
  buildProxyHeaders,
  copyUpstreamSetCookieHeaders,
  fetchConfiguredProxy,
  forwardToExpressApi,
  resolveProxyUrl,
  setAuthCookies,
} from '@/app/api/_utils/proxy';

const LAMBDA_AUTH_LOGIN_URL = resolveProxyUrl(process.env.LAMBDA_AUTH_LOGIN_URL);

// POST /api/auth/login - User login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    const upstream = LAMBDA_AUTH_LOGIN_URL
      ? await fetchConfiguredProxy(LAMBDA_AUTH_LOGIN_URL, 'LAMBDA_AUTH_LOGIN_URL', {
      method: 'POST',
          headers: buildProxyHeaders(request),
      body: JSON.stringify(body),
        })
      : await forwardToExpressApi(request, '/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

    const text = await upstream.text();
    let upstreamData: Record<string, any> = {};
    try {
      upstreamData = text ? JSON.parse(text) : {};
    } catch {
      upstreamData = { success: false, error: 'Invalid response from auth server' };
    }

    if (upstream.ok) {
      // Extract tokens and set them as httpOnly cookies.
      // Upstream shape can be either:
      // - { accessToken, refreshToken, ...user }
      // - { success, message, user, tokens: { accessToken, refreshToken } }
      const payload = upstreamData?.data || upstreamData;
      const accessToken = payload?.accessToken || payload?.tokens?.accessToken;
      const refreshToken = payload?.refreshToken || payload?.tokens?.refreshToken;
      const { accessToken: _at, refreshToken: _rt, tokens: _tokens, ...userData } = payload || {};

      const response = NextResponse.json({
        success: true,
        data: userData,
        message: 'Login successful',
      });
      copyUpstreamSetCookieHeaders(upstream, response);
      return setAuthCookies(response, { accessToken, refreshToken });
    }

    return NextResponse.json(
      {
        success: false,
        error: upstreamData.error || upstreamData.message || 'Login failed',
      },
      { status: upstream.status }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
