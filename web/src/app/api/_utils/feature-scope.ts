import { NextResponse } from 'next/server';

export function deferredFeatureResponse(featureName: string, targetPhase = 'Phase 2'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: `${featureName} is not enabled in the pilot launch scope`,
      code: 'FEATURE_DEFERRED',
      targetPhase,
    },
    { status: 501 }
  );
}

export async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export function upstreamError(data: unknown, fallbackError: string): Record<string, unknown> {
  const payload =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  return {
    success: false,
    error: payload.error ?? payload.message ?? fallbackError,
  };
}
