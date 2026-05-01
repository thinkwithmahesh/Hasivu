/// <reference types="cookie-parser" />
import type { Request } from 'express';
export declare function getClientIpForSession(req: Request): string;
export declare function buildSessionDeviceFingerprint(userAgent: string, acceptLanguage: string, acceptEncoding: string, ipAddress: string): string;
//# sourceMappingURL=session-fingerprint.util.d.ts.map