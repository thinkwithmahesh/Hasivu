/// <reference types="qs" />
import { Request, Response, NextFunction } from 'express';
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const passwordResetRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const paymentRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const rfidRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const registrationRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const uploadRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const adminRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const suspiciousActivityRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const dynamicRateLimit: (req: Request, res: Response, next: NextFunction) => void;
export declare const detectSuspiciousActivity: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const ipWhitelistCheck: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const burstProtection: import("express-rate-limit").RateLimitRequestHandler;
declare const _default: {
    general: import("express-rate-limit").RateLimitRequestHandler;
    auth: import("express-rate-limit").RateLimitRequestHandler;
    passwordReset: import("express-rate-limit").RateLimitRequestHandler;
    payment: import("express-rate-limit").RateLimitRequestHandler;
    rfid: import("express-rate-limit").RateLimitRequestHandler;
    registration: import("express-rate-limit").RateLimitRequestHandler;
    upload: import("express-rate-limit").RateLimitRequestHandler;
    admin: import("express-rate-limit").RateLimitRequestHandler;
    suspicious: import("express-rate-limit").RateLimitRequestHandler;
    dynamic: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => void;
    detectSuspicious: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>;
    ipWhitelist: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Response<any, Record<string, any>>;
    burst: import("express-rate-limit").RateLimitRequestHandler;
};
export default _default;
//# sourceMappingURL=rateLimiter.middleware.d.ts.map