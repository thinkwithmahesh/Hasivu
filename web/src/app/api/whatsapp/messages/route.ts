import { NextRequest, NextResponse } from 'next/server';
import { forwardToExpressApi, buildProxyHeaders } from '@/app/api/_utils/proxy';

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function GET(request: NextRequest) {
  try {
    const upstream = await forwardToExpressApi(request, '/v1/whatsapp/messages', {
      method: 'GET',
      headers: buildProxyHeaders(request),
    });

    const json = await readJsonResponse(upstream);
    return NextResponse.json(json, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
