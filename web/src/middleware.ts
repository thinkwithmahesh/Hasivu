/**
 * HASIVU Platform - Route access middleware
 * Enforces auth + role-scoped dashboard access.
 */

import { NextRequest, NextResponse } from 'next/server';

const DASHBOARD_PREFIX = '/dashboard/';
const VALID_DASHBOARD_ROLES = new Set(['admin', 'parent', 'kitchen', 'vendor']);

type AuthUser = {
  role?: string;
};

function extractRequestedRole(pathname: string): string | null {
  if (!pathname.startsWith(DASHBOARD_PREFIX)) {
    return null;
  }

  const [, role] = pathname.slice(1).split('/');
  if (!role || !VALID_DASHBOARD_ROLES.has(role)) {
    return null;
  }

  return role;
}

function normalizeRole(role: string | null): string | null {
  if (!role) {
    return null;
  }

  if (role === 'kitchen_staff') {
    return 'kitchen';
  }

  return role;
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const requestedRole = extractRequestedRole(request.nextUrl.pathname);
  if (!requestedRole) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('accessToken')?.value;
  if (!accessToken) {
    return redirectToLogin(request);
  }

  const payload = parseJwtPayload(accessToken);
  const userRole = normalizeRole(typeof payload?.role === 'string' ? payload.role : null);
  const exp = typeof payload?.exp === 'number' ? payload.exp : null;
  const expired = typeof exp === 'number' && exp * 1000 <= Date.now();
  const normalizedRequestedRole = normalizeRole(requestedRole);

  if (!userRole || !normalizedRequestedRole || !VALID_DASHBOARD_ROLES.has(userRole) || expired) {
    return redirectToLogin(request);
  }

  if (userRole !== normalizedRequestedRole) {
    return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
