import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Basic kitchen status endpoint
    return NextResponse.json({
      status: 'operational',
      queue: {
        pending: 5,
        preparing: 3,
        ready: 2,
      },
      staff: {
        online: 4,
        available: 3,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Kitchen service unavailable',
      },
      { status: 500 }
    );
  }
}
