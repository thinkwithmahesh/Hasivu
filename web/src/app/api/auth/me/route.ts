import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenFromRequest } from '@/app/api/_utils/proxy';

type JwtPayload = {
  userId?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  exp?: number;
};

function decodePayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = raw.padEnd(raw.length + ((4 - (raw.length % 4)) % 4), '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as JwtPayload;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authToken = getAccessTokenFromRequest(request);
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const payload = decodePayload(authToken);
    if (!payload?.userId || !payload?.email || !payload?.role) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const expired = typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
    if (expired) {
      return NextResponse.json({ success: false, error: 'Token expired' }, { status: 401 });
    }

    const user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
      firstName: '',
      lastName: '',
    };

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
