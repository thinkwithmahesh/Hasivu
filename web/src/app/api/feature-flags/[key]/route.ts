import { NextRequest, NextResponse } from 'next/server';
import { getFeatureFlagService } from '../../../../services/feature-flag.service';
import { FeatureFlagKey } from '../../../../types/feature-flags';

// GET /api/feature-flags/[key] - Get specific feature flag
export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const _service = getFeatureFlagService();
    const _flag = service.getFlag(params.key as FeatureFlagKey);

    if (!flag) {
      return NextResponse.json(
        { error: 'Feature flag not found', success: false },
        { status: 404 }
      );
    }

    // Evaluate the flag with context from query params
    const { searchParams } = new URL(request.url);
    const _context = {
      userId: searchParams.get('userId') || undefined,
      userType: searchParams.get('userType') || undefined,
      schoolId: searchParams.get('schoolId') || undefined,
      role: searchParams.get('role') || undefined,
      region: searchParams.get('region') || undefined,
      environment: (searchParams.get('environment') as any) || 'development',
    };

    const _evaluation = service.evaluate(params.key as FeatureFlagKey, context);

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
    const _body = await request.json();
    const _service = getFeatureFlagService();

    const _existingFlag = service.getFlag(params.key as FeatureFlagKey);
    if (!existingFlag) {
      return NextResponse.json(
        { error: 'Feature flag not found', success: false },
        { status: 404 }
      );
    }

    const _updatedFlag = {
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
    const _service = getFeatureFlagService();
    const _flag = service.getFlag(params.key as FeatureFlagKey);

    if (!flag) {
      return NextResponse.json(
        { error: 'Feature flag not found', success: false },
        { status: 404 }
      );
    }

    // Soft delete by disabling the flag
    const _disabledFlag = {
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
