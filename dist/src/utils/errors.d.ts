export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly code?: string;
    constructor(message: string, statusCode?: number, isOperationalOrCode?: boolean | string, code?: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string, code?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string, code?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string, code?: string);
}
export declare class DatabaseError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ExternalServiceError extends AppError {
    constructor(service: string, message?: string, code?: string);
}
export declare class PaymentError extends AppError {
    constructor(message: string, code?: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class BusinessLogicError extends AppError {
    constructor(message: string, code?: string);
}
export declare class Logger {
    static error(error: Error | AppError, context?: any): void;
}
export declare function isOperationalError(error: Error): boolean;
export declare function handleError(error: Error | AppError): {
    statusCode: number;
    message: string;
    code?: string;
};
export declare function getErrorMessage(error: unknown): string;
export declare function createErrorResponse(error: unknown, statusCode?: number): {
    statusCode: number;
    message: string;
    code?: string;
};
//# sourceMappingURL=errors.d.ts.map