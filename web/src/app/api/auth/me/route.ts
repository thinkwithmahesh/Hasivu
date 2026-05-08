import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenFromRequest } from '@/app/api/_utils/proxy';
import { verifyHs256Jwt } from '@/lib/security/jwt-verify';

export async function GET(request: NextRequest) {
  try {
    const authToken = getAccessTokenFromRequest(request);
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { success: false, error: 'Auth secret not configured' },
        { status: 500 }
      );
    }

    const verification = verifyHs256Jwt(authToken, jwtSecret);
    if (
      !verification?.payload?.userId ||
      !verification.payload.email ||
      !verification.payload.role
    ) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (verification.expired) {
      return NextResponse.json({ success: false, error: 'Token expired' }, { status: 401 });
    }

    const user = {
      id: verification.payload.userId,
      email: verification.payload.email,
      role: verification.payload.role,
      permissions: Array.isArray(verification.payload.permissions)
        ? verification.payload.permissions
        : [],
      firstName: verification.payload.firstName || '',
      lastName: verification.payload.lastName || '',
      emailVerified: verification.payload.emailVerified ?? true,
    };

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
