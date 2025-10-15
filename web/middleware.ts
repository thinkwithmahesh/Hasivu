/**
 * HASIVU Platform - Production Middleware Integration
 * Entry point for Next.js middleware with comprehensive security
 * Temporarily disabled due to edge runtime crypto module issue
 */

import { NextRequest } from 'next/server';
// import { securityMiddleware } from './src/middleware/security';

export async function middleware(_request: NextRequest) {
  // TODO: Re-enable security middleware after fixing edge runtime crypto issue
  // Apply security middleware to all requests
  // const _securityResponse =  await securityMiddleware(request);
  //
  // if (securityResponse) {
  //   return securityResponse;
  // }
  // If security middleware doesn't return a response, continue to next middleware or route
}

export const _config = {
  runtime: 'nodejs',
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
