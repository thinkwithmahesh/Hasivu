import { NextRequest, NextResponse } from 'next/server';

const ACCESS_TOKEN_COOKIE_NAMES = ['accessToken'] as const;
const REFRESH_TOKEN_COOKIE_NAMES = ['refreshToken'] as const;
const PLACEHOLDER_PROXY_HOST = ['your', 'lambda', 'endpoint'].join('-');
const legacyLambdaProxyEnabled = process.env.NEXT_ENABLE_LEGACY_LAMBDA_PROXY === 'true';

const secureCookie = process.env.NODE_ENV === 'production';

function readCookie(request: NextRequest, cookieNames: readonly string[]): string | null {
  for (const name of cookieNames) {
    const value = request.cookies.get(name)?.value;
    if (value) {
      return value;
    }
  }

  return null;
}

function setCookie(response: NextResponse, name: string, value: string, maxAge: number): void {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'strict',
    path: '/',
    maxAge,
  });
}

export function getAccessTokenFromRequest(request: NextRequest): string | null {
  return readCookie(request, ACCESS_TOKEN_COOKIE_NAMES);
}

export function getRefreshTokenFromRequest(request: NextRequest): string | null {
  return readCookie(request, REFRESH_TOKEN_COOKIE_NAMES);
}

export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken?: string; refreshToken?: string }
): NextResponse {
  if (tokens.accessToken) {
    for (const name of ACCESS_TOKEN_COOKIE_NAMES) {
      setCookie(response, name, tokens.accessToken, 60 * 60 * 24);
    }
  }

  if (tokens.refreshToken) {
    for (const name of REFRESH_TOKEN_COOKIE_NAMES) {
      setCookie(response, name, tokens.refreshToken, 60 * 60 * 24 * 7);
    }
  }

  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  for (const name of [...ACCESS_TOKEN_COOKIE_NAMES, ...REFRESH_TOKEN_COOKIE_NAMES]) {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });
  }

  return response;
}

export function resolveProxyUrl(configuredUrl?: string | null): string | null {
  if (!configuredUrl) {
    return null;
  }

  if (configuredUrl.includes(PLACEHOLDER_PROXY_HOST)) {
    return null;
  }

  if (configuredUrl.includes('amazonaws.com') && !legacyLambdaProxyEnabled) {
    return null;
  }

  return configuredUrl;
}

export function misconfiguredProxyResponse(serviceName: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: `${serviceName} is not configured`,
    },
    { status: 503 }
  );
}

export async function fetchConfiguredProxy(
  configuredUrl: string | undefined | null,
  serviceName: string,
  init: RequestInit
): Promise<Response> {
  const url = resolveProxyUrl(configuredUrl);
  if (!url) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `${serviceName} is not configured`,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return fetch(url, init);
}

export function configuredProxyUrl(configuredUrl: string | undefined | null): string | null {
  return resolveProxyUrl(configuredUrl);
}

/** Express API base including `/api` (same as `next.config.js` rewrite destination). */
export function getExpressApiBaseUrl(): string {
  const raw =
    process.env.NEXT_SERVER_API_URL ||
    process.env.BACKEND_INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000/api';
  return raw.replace(/\/$/, '');
}

/** Server-side forward to Express (used when Lambda auth URLs are not configured). */
export function copyUpstreamSetCookieHeaders(from: Response, to: NextResponse): void {
  const h = from.headers as unknown as { getSetCookie?: () => string[] };
  const multi = typeof h.getSetCookie === 'function' ? h.getSetCookie() : [];
  if (multi.length > 0) {
    for (const c of multi) {
      to.headers.append('Set-Cookie', c);
    }
    return;
  }
  const single = from.headers.get('set-cookie');
  if (single) {
    to.headers.append('Set-Cookie', single);
  }
}

export async function forwardToExpressApi(
  request: NextRequest,
  expressPath: string,
  init: RequestInit
): Promise<Response> {
  const base = getExpressApiBaseUrl();
  const path = expressPath.startsWith('/') ? expressPath : `/${expressPath}`;
  const url = `${base}${path}`;
  const headers = new Headers(init.headers as HeadersInit);
  const cookie = request.headers.get('cookie');
  if (cookie) {
    headers.set('Cookie', cookie);
  }
  return fetch(url, { ...init, headers });
}

export function buildProxyHeaders(request: NextRequest, accessToken?: string | null): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    'User-Agent': request.headers.get('user-agent') || '',
    'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
  };
}
