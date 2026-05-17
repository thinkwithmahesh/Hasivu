import { createHmac, timingSafeEqual } from 'crypto';

export type AuthJwtPayload = {
  userId?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  exp?: number;
};

type JwtVerificationResult = {
  payload: AuthJwtPayload;
  expired: boolean;
};

function decodeBase64Url(segment: string): Buffer {
  const raw = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = raw.padEnd(raw.length + ((4 - (raw.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64');
}

export function verifyHs256Jwt(
  token: string,
  secret: string
): JwtVerificationResult | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const [headerSegment, payloadSegment, signatureSegment] = parts;
    const header = JSON.parse(decodeBase64Url(headerSegment).toString('utf8')) as { alg?: string };
    if (header.alg !== 'HS256') {
      return null;
    }

    const expectedSig = createHmac('sha256', secret).update(`${headerSegment}.${payloadSegment}`).digest();
    const actualSig = decodeBase64Url(signatureSegment);
    if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) {
      return null;
    }

    const payload = JSON.parse(decodeBase64Url(payloadSegment).toString('utf8')) as AuthJwtPayload;
    const expired = typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
    return { payload, expired };
  } catch {
    return null;
  }
}

export function normalizeRoleForDashboard(role: string | null): string | null {
  if (!role) return null;
  if (role === 'kitchen_staff') return 'kitchen';
  return role;
}
