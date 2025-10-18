/**
 * HASIVU School Registration API Routes
 * Epic 2 Story 2: School Onboarding APIs
 *
 * Handles school registration and onboarding operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { hasiviApi } from '@/services/api/hasivu-api.service';

// GET /api/schools - List schools
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);

    const response = await hasiviApi.getSchoolList(params);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error?.message || 'Failed to fetch schools' },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/schools - Register new school
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    let response;

    switch (action) {
      case 'register':
        // Initial school registration
        response = await hasiviApi.updateSchoolInfo({
          ...data,
          step: 'school_info',
        });
        break;

      case 'update_profile':
        // Update admin profile
        response = await hasiviApi.updateUserProfile({
          ...data,
          step: 'admin_setup',
        });
        break;

      case 'configure_stakeholders':
        // Configure stakeholders
        response = await hasiviApi.configureStakeholders({
          ...data,
          step: 'stakeholder_setup',
        });
        break;

      case 'update_branding':
        // Update school branding
        response = await hasiviApi.updateSchoolBranding({
          ...data,
          step: 'branding',
        });
        break;

      case 'updateconfiguration':
        // Update system configuration
        response = await hasiviApi.updateSchoolConfiguration({
          ...data,
          step: 'configuration',
        });
        break;

      case 'configure_rfid':
        // Configure RFID system
        response = await hasiviApi.configureRFIDSystem({
          ...data,
          step: 'rfid_setup',
        });
        break;

      case 'complete_onboarding':
        // Complete onboarding
        response = await hasiviApi.completeOnboarding({
          ...data,
          step: 'completion',
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!response.success) {
      return NextResponse.json(
        { error: response.error?.message || 'Operation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/schools - Update school information
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const response = await hasiviApi.updateSchoolInfo(body);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error?.message || 'Failed to update school' },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
