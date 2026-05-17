/**
 * Nonce utilities for CSP
 * Retrieves nonce from request headers set by middleware
 */

import { headers } from 'next/headers';

/**
 * Get CSP nonce from request headers
 * Returns undefined if not available (shouldn't happen in production)
 */
export async function getNonce(): Promise<string | undefined> {
  try {
    const headersList = await headers();
    return headersList.get('x-nonce') || undefined;
  } catch (error) {
    // During static generation, request headers are unavailable; return undefined silently.
    // Keep development diagnostics lightweight for non-static failures.
    if (
      process.env.NODE_ENV !== 'production' &&
      !(error instanceof Error && error.message.includes('Dynamic server usage'))
    ) {
      console.warn('Nonce unavailable in this render context');
    }
    return undefined;
  }
}

/**
 * Get nonce for synchronous contexts
 * Note: Use getNonce() (async) whenever possible
 */
export function getNonceSync(): string | undefined {
  // This is a fallback for edge cases where async is not possible
  // In practice, always use getNonce() in Server Components
  return undefined;
}
