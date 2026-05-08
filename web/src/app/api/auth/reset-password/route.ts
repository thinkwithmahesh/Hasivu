import { NextRequest, NextResponse } from 'next/server';
import {
  fetchConfiguredProxy,
  forwardToExpressApi,
  resolveProxyUrl,
} from '@/app/api/_utils/proxy';

const LAMBDA_AUTH_RESET_PASSWORD_URL = resolveProxyUrl(process.env.LAMBDA_AUTH_RESET_PASSWORD_URL);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.token || !body.newPassword) {
      return NextResponse.json(
        { success: false, error: 'Reset token and new password are required' },
        { status: 400 }
      );
    }

    const upstream = LAMBDA_AUTH_RESET_PASSWORD_URL
      ? await fetchConfiguredProxy(LAMBDA_AUTH_RESET_PASSWORD_URL, 'LAMBDA_AUTH_RESET_PASSWORD_URL', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': request.headers.get('user-agent') || '',
            'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
          },
          body: JSON.stringify(body),
        })
      : await forwardToExpressApi(request, '/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

    const upstreamData = await upstream.json();

    // Handle Lambda response and transform to expected frontend format
    if (upstream.ok) {
      const frontendResponse = {
        success: true,
        message: upstreamData.message || 'Password reset successfully',
      };

      return NextResponse.json(frontendResponse);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: upstreamData.error || upstreamData.message || 'Failed to reset password',
        },
        { status: upstream.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
