import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenFromRequest } from '@/app/api/_utils/proxy';
import { verifyHs256Jwt } from '@/lib/security/jwt-verify';

export async function GET(request: NextRequest) {
  try {
    const authToken = getAccessTokenFromRequest(request);
    if (!authToken) {
      return NextResponse.json(
        {
          authenticated: false,
          message: 'No valid authentication found',
        },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        {
          authenticated: false,
          error: 'Auth secret not configured',
        },
        { status: 500 }
      );
    }

    const verification = verifyHs256Jwt(authToken, jwtSecret);
    if (
      verification?.expired ||
      !verification?.payload?.userId ||
      !verification.payload.email ||
      !verification.payload.role
    ) {
      return NextResponse.json(
        {
          authenticated: false,
          message: 'No valid authentication found',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: verification.payload.userId,
        email: verification.payload.email,
        role: verification.payload.role,
        permissions: Array.isArray(verification.payload.permissions)
          ? verification.payload.permissions
          : [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        authenticated: false,
        error: 'Authentication check failed',
      },
      { status: 500 }
    );
  }
}
