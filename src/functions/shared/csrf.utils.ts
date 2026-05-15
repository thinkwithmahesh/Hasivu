/**
 * CSRF Protection Utilities
 * Provides CSRF token validation for Lambda functions
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import crypto from 'crypto';
import { createErrorResponse } from './response.utils';

const TOKEN_VERSION = 'v1';
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Validate CSRF token from request headers
 */
export function validateCSRFToken(event: APIGatewayProxyEvent): { isValid: boolean; error?: any } {
  try {
    const csrfToken = getHeader(event, 'x-csrf-token');

    if (!csrfToken) {
      return {
        isValid: false,
        error: createErrorResponse('CSRF_VALIDATION_FAILED', 'CSRF token missing', 403),
      };
    }

    if (typeof csrfToken !== 'string') {
      return {
        isValid: false,
        error: createErrorResponse('CSRF_VALIDATION_FAILED', 'Invalid CSRF token format', 403),
      };
    }

    const secret = getCSRFSecret();
    if (!secret) {
      return {
        isValid: false,
        error: createErrorResponse('CSRF_VALIDATION_FAILED', 'CSRF secret not configured', 403),
      };
    }

    const parsed = parseToken(csrfToken);
    if (!parsed) {
      return {
        isValid: false,
        error: createErrorResponse('CSRF_VALIDATION_FAILED', 'Invalid CSRF token format', 403),
      };
    }

    const now = Date.now();
    if (
      Number.isNaN(parsed.timestamp) ||
      now - parsed.timestamp > TOKEN_TTL_MS ||
      parsed.timestamp > now + 30000
    ) {
      return {
        isValid: false,
        error: createErrorResponse('CSRF_VALIDATION_FAILED', 'CSRF token expired', 403),
      };
    }

    const expectedSignature = signToken({
      method: event.httpMethod,
      path: event.path,
      timestamp: parsed.timestamp,
      nonce: parsed.nonce,
      origin: getRequestOrigin(event),
      secret,
    });

    if (!safeEqual(parsed.signature, expectedSignature)) {
      return {
        isValid: false,
        error: createErrorResponse('CSRF_VALIDATION_FAILED', 'Invalid CSRF token signature', 403),
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: createErrorResponse('CSRF_VALIDATION_FAILED', 'CSRF validation error', 403),
    };
  }
}

/**
 * Check if request method requires CSRF protection
 */
export function requiresCSRFProtection(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

export function generateCSRFToken(input: {
  method: string;
  path: string;
  origin?: string;
  timestamp?: number;
  nonce?: string;
}): string {
  const secret = getCSRFSecret();
  if (!secret) {
    throw new Error('CSRF secret not configured');
  }

  const timestamp = input.timestamp || Date.now();
  const nonce = input.nonce || crypto.randomBytes(8).toString('hex');
  const signature = signToken({
    method: input.method,
    path: input.path,
    timestamp,
    nonce,
    origin: input.origin || '',
    secret,
  });

  return `${TOKEN_VERSION}.${timestamp}.${nonce}.${signature}`;
}

function getHeader(event: APIGatewayProxyEvent, headerName: string): string | undefined {
  const normalizedName = headerName.toLowerCase();
  const entry = Object.entries(event.headers || {}).find(
    ([key]) => key.toLowerCase() === normalizedName
  );
  const value = entry?.[1];
  return Array.isArray(value) ? value[0] : value;
}

function getRequestOrigin(event: APIGatewayProxyEvent): string {
  return getHeader(event, 'origin') || getHeader(event, 'referer') || '';
}

function getCSRFSecret(): string | undefined {
  if (process.env.CSRF_SECRET) {
    return process.env.CSRF_SECRET;
  }

  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  return process.env.NODE_ENV === 'production' ? undefined : 'hasivu-dev-csrf-secret';
}

function parseToken(
  token: string
): { timestamp: number; nonce: string; signature: string } | undefined {
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) {
    return undefined;
  }

  const [, timestamp, nonce, signature] = parts;
  if (
    !/^\d{10,13}$/.test(timestamp) ||
    !/^[a-f0-9]{16,64}$/i.test(nonce) ||
    !/^[a-f0-9]{64}$/i.test(signature)
  ) {
    return undefined;
  }

  return {
    timestamp: Number(timestamp),
    nonce,
    signature,
  };
}

function signToken(input: {
  method: string;
  path: string;
  timestamp: number;
  nonce: string;
  origin: string;
  secret: string;
}): string {
  const payload = [
    input.method.toUpperCase(),
    input.path,
    input.timestamp,
    input.nonce,
    input.origin,
  ].join('|');

  return crypto.createHmac('sha256', input.secret).update(payload).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
