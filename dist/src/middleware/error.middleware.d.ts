import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
    isOperational?: boolean;
}
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
        timestamp: string;
        requestId?: string;
        path: string;
    };
}
export declare const ErrorCodes: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR";
    readonly AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE";
    readonly RESOURCE_CONFLICT: "RESOURCE_CONFLICT";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR";
    readonly CONFIGURATION_ERROR: "CONFIGURATION_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export declare function createError(code: string, message: string, statusCode?: number, details?: any): AppError;
export declare function createValidationError(message: string, details?: any): AppError;
export declare function createNotFoundError(resource: string, identifier?: string): AppError;
export declare function createAuthenticationError(message?: string): AppError;
export declare function createAuthorizationError(message?: string): AppError;
export declare function createRateLimitError(message?: string): AppError;
export declare function createServiceUnavailableError(message?: string): AppError;
export declare function createConflictError(message?: string): AppError;
export declare function createDatabaseError(message: string, details?: any): AppError;
export declare const errorHandler: (err: AppError, req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validationErrorHandler: (req: Request, res: Response, next: NextFunction) => void;
export declare const transformDatabaseError: (error: any) => AppError;
export declare const uncaughtExceptionHandler: (error: Error) => void;
export declare const unhandledRejectionHandler: (reason: any, promise: Promise<any>) => void;
export declare const installGlobalErrorHandlers: () => void;
//# sourceMappingURL=error.middleware.d.ts.map