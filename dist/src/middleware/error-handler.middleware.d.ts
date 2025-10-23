import { Request, Response, NextFunction } from 'express';
export interface ErrorResponse {
    error: string;
    message: string;
    statusCode: number;
    timestamp: string;
    requestId: string;
    details?: any;
    degradedServices?: string[];
    retryAfter?: number;
}
export declare enum ErrorType {
    VALIDATION = "validation",
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    NOT_FOUND = "not_found",
    RATE_LIMIT = "rate_limit",
    SERVICE_UNAVAILABLE = "service_unavailable",
    DATABASE = "database",
    EXTERNAL_SERVICE = "external_service",
    TIMEOUT = "timeout",
    INTERNAL = "internal",
    CIRCUIT_BREAKER = "circuit_breaker"
}
export declare const errorHandler: (error: any, req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
export declare function createValidationError(message: string, details?: any): Error;
export declare function createNotFoundError(resource: string): Error;
export declare function createServiceUnavailableError(service: string, retryAfter?: number): Error;
export declare function createAuthorizationError(message?: string): Error;
export declare function createCircuitBreakerError(service: string): Error;
//# sourceMappingURL=error-handler.middleware.d.ts.map