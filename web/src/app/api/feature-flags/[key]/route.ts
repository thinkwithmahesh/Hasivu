import { NextRequest, NextResponse } from 'next/server';
import { getFeatureFlagService } from '../../../../services/feature-flag.service';
import { FeatureFlagKey } from '../../../../types/feature-flags';
import { getAccessTokenFromRequest } from '@/app/api/_utils/proxy';
import { verifyHs256Jwt } from '@/lib/security/jwt-verify';

const FEATURE_FLAG_ADMIN_ROLES = new Set(['admin', 'school_admin', 'super_admin']);

function authorizeFeatureFlagMutation(request: NextRequest): NextResponse | null {
  const authToken = getAccessTokenFromRequest(request);
  if (!authToken) {
    return NextResponse.json(
      { error: 'Authentication required', success: false },
      { status: 401 }
    );
  }

  const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!jwtSecret) {
    return NextResponse.json(
      { error: 'Auth secret not configured', success: false },
      { status: 500 }
    );
  }

  const verification = verifyHs256Jwt(authToken, jwtSecret);
  const role = typeof verification?.payload?.role === 'string' ? verification.payload.role : '';
  const normalizedRole = role.toLowerCase();
  if (!verification || verification.expired || !FEATURE_FLAG_ADMIN_ROLES.has(normalizedRole)) {
    return NextResponse.json({ error: 'Forbidden', success: false }, { status: 403 });
  }

  return null;
}

// GET /api/feature-flags/[key] - Get specific feature flag
export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const service = getFeatureFlagService();
    const flag = service.getFlag(params.key as FeatureFlagKey);

    if (!flag) {
      return NextResponse.json(
        { error: 'Feature flag not found', success: false },
        { status: 404 }
      );
    }

    // Evaluate the flag with context from query params
    const { searchParams } = new URL(request.url);
    const context = {
      userId: searchParams.get('userId') || undefined,
      userType: searchParams.get('userType') || undefined,
      schoolId: searchParams.get('schoolId') || undefined,
      role: searchParams.get('role') || undefined,
      region: searchParams.get('region') || undefined,
      environment: (searchParams.get('environment') as any) || 'development',
    };

    const evaluation = service.evaluate(params.key as FeatureFlagKey, context);

    return NextResponse.json({
      flag,
      evaluation,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch feature flag', success: false },
      { status: 500 }
    );
  }
}

// PUT /api/feature-flags/[key] - Update specific feature flag
export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const authorizationError = authorizeFeatureFlagMutation(request);
    if (authorizationError) return authorizationError;

    const body = await request.json();
    const service = getFeatureFlagService();

    const existingFlag = service.getFlag(params.key as FeatureFlagKey);
    if (!existingFlag) {
      return NextResponse.json(
        { error: 'Feature flag not found', success: false },
        { status: 404 }
      );
    }

    const updatedFlag = {
      ...existingFlag,
      ...body,
      key: params.key, // Ensure key doesn't change
      metadata: {
        ...existingFlag.metadata,
        ...body.metadata,
        updatedAt: new Date(),
      },
    };

    service.updateFlag(updatedFlag);

    return NextResponse.json({
      flag: updatedFlag,
      success: true,
      message: 'Feature flag updated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update feature flag', success: false },
      { status: 500 }
    );
  }
}

// DELETE /api/feature-flags/[key] - Delete feature flag (soft delete by disabling)
export async function DELETE(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const authorizationError = authorizeFeatureFlagMutation(request);
    if (authorizationError) return authorizationError;

    const service = getFeatureFlagService();
    const flag = service.getFlag(params.key as FeatureFlagKey);

    if (!flag) {
      return NextResponse.json(
        { error: 'Feature flag not found', success: false },
        { status: 404 }
      );
    }

    // Soft delete by disabling the flag
    const disabledFlag = {
      ...flag,
      enabled: false,
      metadata: {
        ...flag.metadata,
        updatedAt: new Date(),
      },
    };

    service.updateFlag(disabledFlag);

    return NextResponse.json({
      success: true,
      message: 'Feature flag disabled successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to disable feature flag', success: false },
      { status: 500 }
    );
  }
}
