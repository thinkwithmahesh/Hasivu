import { NextRequest, NextResponse } from 'next/server';
import {
  fetchConfiguredProxy,
  forwardToExpressApi,
  resolveProxyUrl,
} from '@/app/api/_utils/proxy';

const LAMBDA_AUTH_FORGOT_PASSWORD_URL = resolveProxyUrl(process.env.LAMBDA_AUTH_FORGOT_PASSWORD_URL);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const upstream = LAMBDA_AUTH_FORGOT_PASSWORD_URL
      ? await fetchConfiguredProxy(LAMBDA_AUTH_FORGOT_PASSWORD_URL, 'LAMBDA_AUTH_FORGOT_PASSWORD_URL', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': request.headers.get('user-agent') || '',
            'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
          },
          body: JSON.stringify(body),
        })
      : await forwardToExpressApi(request, '/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

    const upstreamData = await upstream.json();

    // Handle Lambda response and transform to expected frontend format
    if (upstream.ok) {
      const frontendResponse = {
        success: true,
        message: upstreamData.message || 'Password reset email sent successfully',
      };

      return NextResponse.json(frontendResponse);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: upstreamData.error || upstreamData.message || 'Failed to send password reset email',
        },
        { status: upstream.status }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
