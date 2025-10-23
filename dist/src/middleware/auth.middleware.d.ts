/// <reference types="cookie-parser" />
/// <reference types="node" />
import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        permissions: string[];
        schoolId?: string;
        tenantId?: string;
    };
    sessionId?: string;
}
export interface AuthOptions {
    roles?: string[];
    permissions?: string[];
    optional?: boolean;
}
export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse<import("http").IncomingMessage>, next: (err?: unknown) => void) => void;
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const generalRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const validateInput: (req: Request, res: Response, next: NextFunction) => void;
export declare const corsMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuthMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: string | string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requirePermission: (permissions: string | string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const authorize: (options: AuthOptions) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const auditLog: (operation: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requestTimeout: (timeoutMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map