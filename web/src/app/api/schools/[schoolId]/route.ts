import { NextRequest, NextResponse } from 'next/server';

import { deferredFeatureResponse } from '../../_utils/feature-scope';
import { getAccessTokenFromRequest } from '@/app/api/_utils/proxy';

function requireAuth(request: NextRequest): NextResponse | null {
  if (getAccessTokenFromRequest(request)) {
    return null;
  }

  return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) {
    return authError;
  }

  return deferredFeatureResponse('School detail API');
}

export async function PUT(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) {
    return authError;
  }

  return deferredFeatureResponse('School update API');
}

export async function DELETE(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) {
    return authError;
  }

  return deferredFeatureResponse('School deletion API');
}
