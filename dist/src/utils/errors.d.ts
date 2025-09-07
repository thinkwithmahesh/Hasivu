export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    readonly field?: string;
    constructor(message: string, field?: string);
}
export declare class NotFoundError extends AppError {
    readonly resourceType: string;
    readonly resourceId?: string;
    constructor(resourceType: string, resourceId?: string);
}
export declare class ConflictError extends AppError {
    readonly conflictType: string;
    constructor(message: string, conflictType?: string);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    readonly requiredPermission?: string;
    constructor(message?: string, requiredPermission?: string);
}
export declare class BusinessLogicError extends AppError {
    readonly ruleType: string;
    constructor(message: string, ruleType?: string);
}
export declare class ExternalServiceError extends AppError {
    readonly service: string;
    readonly originalError?: Error;
    constructor(service: string, message: string, originalError?: Error);
}
export declare class DatabaseError extends AppError {
    readonly operation: string;
    readonly originalError?: Error;
    constructor(operation: string, message: string, originalError?: Error);
}
export declare class RateLimitError extends AppError {
    readonly retryAfter?: number;
    constructor(message?: string, retryAfter?: number);
}
export declare function isOperationalError(error: Error): boolean;
export declare function getErrorMessage(error: unknown): string;
export declare function createErrorResponse(error: AppError | Error): {
    error: {
        retryAfter: number;
        operation: string;
        service: string;
        ruleType: string;
        requiredPermission: string;
        conflictType: string;
        resourceType: string;
        resourceId: string;
        field: string;
        isOperational: boolean;
        name: string;
        message: string;
        statusCode: number;
    };
};
//# sourceMappingURL=errors.d.ts.map