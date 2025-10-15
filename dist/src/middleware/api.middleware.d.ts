/// <reference types="cookie-parser" />
/// <reference types="node" />
/// <reference types="qs" />
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export interface APIRequest extends Request {
    user?: {
        id: string;
        role: string;
        permissions?: string[];
        sessionId?: string;
        schoolId?: string;
    };
    apiVersion?: string;
    requestId?: string;
    startTime?: number;
    rateLimit?: {
        limit: number;
        remaining: number;
        reset: number;
    };
}
export interface APIResponse extends Response {
    locals: {
        requestId?: string;
        userId?: string;
        userRole?: string;
        processingTime?: number;
    };
}
export declare const requestIdMiddleware: (req: APIRequest, res: APIResponse, next: NextFunction) => void;
export declare const apiVersionMiddleware: (req: APIRequest, res: APIResponse, next: NextFunction) => void;
export declare const performanceMiddleware: (req: APIRequest, res: APIResponse, next: NextFunction) => void;
export declare const securityHeadersMiddleware: (req: import("http").IncomingMessage, res: import("http").ServerResponse<import("http").IncomingMessage>, next: (err?: unknown) => void) => void;
export declare const compressionMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const sanitizationMiddleware: (req: APIRequest, res: APIResponse, next: NextFunction) => void;
export declare const validateRequest: (schemas: {
    body?: z.ZodSchema;
    query?: z.ZodSchema;
    params?: z.ZodSchema;
}) => (req: APIRequest, res: APIResponse, next: NextFunction) => void;
export declare const createRateLimiter: (endpointConfig?: {
    requests: number;
    windowMs: number;
    skipSuccessfulRequests?: boolean;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const paginationMiddleware: (req: APIRequest, res: APIResponse, next: NextFunction) => void;
export declare const validateContentType: (allowedTypes: string[]) => (req: APIRequest, res: APIResponse, next: NextFunction) => void;
export declare const corsPreflightMiddleware: (req: APIRequest, res: APIResponse, next: NextFunction) => void;
declare module 'express-serve-static-core' {
    interface Request {
        pagination?: {
            page: number;
            limit: number;
            offset: number;
        };
    }
    interface Response {
        sendPaginated?: (data: any[] | undefined, total: number, metadata?: any) => void;
    }
}
//# sourceMappingURL=api.middleware.d.ts.map