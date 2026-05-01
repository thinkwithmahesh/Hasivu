/**
 * Shared session device fingerprint + client IP extraction.
 * Keeps AuthService Redis sessions aligned with SessionService.validateSession.
 */

import { createHash } from 'crypto';
import type { Request } from 'express';

export function getClientIpForSession(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  const xffFirst =
    typeof xff === 'string'
      ? xff.split(',')[0]?.trim() || ''
      : Array.isArray(xff)
        ? xff[0]?.trim() || ''
        : '';
  const xRealIp = req.headers['x-real-ip'];
  const realIp = typeof xRealIp === 'string' ? xRealIp.trim() : '';

  return (
    xffFirst ||
    realIp ||
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
}

export function buildSessionDeviceFingerprint(
  userAgent: string,
  acceptLanguage: string,
  acceptEncoding: string,
  ipAddress: string
): string {
  const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${ipAddress}`;
  return createHash('sha256').update(fingerprintData).digest('hex');
}
