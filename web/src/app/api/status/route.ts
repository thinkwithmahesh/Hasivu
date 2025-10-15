// System status endpoint for deployment validation
import { NextRequest, NextResponse } from 'next/server';

interface _StatusResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  build: {
    version: string;
    commit?: string;
    timestamp?: string;
  };
}

export async function GET(_request: NextRequest) {
  try {
    const statusData: _StatusResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      build: {
        version: process.env.npm_package_version || '1.0.0',
        commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA,
        timestamp: process.env.BUILD_TIMESTAMP,
      },
    };

    return NextResponse.json(statusData);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: 0,
        environment: 'error',
        build: { version: '1.0.0' },
      },
      { status: 500 }
    );
  }
}
