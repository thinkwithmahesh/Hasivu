import { Response } from 'express';
declare module 'express' {
    interface Response {
        success<T = any>(data?: T, message?: string, statusCode?: number): this;
        error(message: string, statusCode?: number, code?: string, details?: Record<string, any>): this;
        validationError(errors: ValidationError[], message?: string): this;
    }
}
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: ErrorDetails;
    meta?: ResponseMeta;
    timestamp: string;
    requestId?: string;
}
export interface ErrorDetails {
    code: string;
    message: string;
    details?: Record<string, any>;
    stack?: string;
    field?: string;
    validation?: ValidationError[];
}
export interface ValidationError {
    field: string;
    value: any;
    message: string;
    code: string;
}
export interface ResponseMeta {
    pagination?: PaginationMeta;
    performance?: PerformanceMeta;
    version?: string;
    environment?: string;
    rateLimit?: RateLimitMeta;
    cache?: CacheMeta;
}
export interface PaginationMeta {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage?: number;
    previousPage?: number;
}
export interface PerformanceMeta {
    responseTime: number;
    queryCount?: number;
    queryTime?: number;
    cacheHits?: number;
    cacheMisses?: number;
}
export interface RateLimitMeta {
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
}
export interface CacheMeta {
    hit: boolean;
    ttl?: number;
    key?: string;
    strategy?: string;
}
export interface ListResponse<T = any> {
    items: T[];
    pagination: PaginationMeta;
}
export declare enum HttpStatusCode {
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NO_CONTENT = 204,
    MOVED_PERMANENTLY = 301,
    FOUND = 302,
    NOT_MODIFIED = 304,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    CONFLICT = 409,
    UNPROCESSABLE_ENTITY = 422,
    TOO_MANY_REQUESTS = 429,
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
    GATEWAY_TIMEOUT = 504
}
export declare class ResponseUtil {
    private static generateRequestId;
    static success<T = any>(message?: string, data?: T, meta?: ResponseMeta, requestId?: string): ApiResponse<T>;
    static error(message: string, code?: string, details?: Record<string, any>, requestId?: string): ApiResponse<null>;
    static validationError(message: string, errors: ValidationError[], requestId?: string): ApiResponse<null>;
    static paginatedList<T = any>(items: T[], pagination: PaginationMeta, message?: string, requestId?: string): ApiResponse<ListResponse<T>>;
    static noContent(message?: string, requestId?: string): ApiResponse<null>;
}
export declare class ExpressResponseHelper {
    static sendSuccess<T = any>(res: Response, data?: T, message?: string, statusCode?: HttpStatusCode, meta?: ResponseMeta): Response;
    static sendError(res: Response, message: string, statusCode?: HttpStatusCode, code?: string, details?: Record<string, any>): Response;
    static sendValidationError(res: Response, errors: ValidationError[], message?: string): Response;
    static sendPaginatedList<T = any>(res: Response, items: T[], pagination: PaginationMeta, message?: string): Response;
    static sendNoContent(res: Response, message?: string): Response;
    static sendCreated<T = any>(res: Response, data: T, message?: string): Response;
    static sendAccepted<T = any>(res: Response, data?: T, message?: string): Response;
    static sendNotFound(res: Response, message?: string, resourceType?: string): Response;
    static sendUnauthorized(res: Response, message?: string): Response;
    static sendForbidden(res: Response, message?: string): Response;
    static sendConflict(res: Response, message?: string, details?: Record<string, any>): Response;
    static sendRateLimit(res: Response, retryAfter: number, message?: string): Response;
    static sendInternalError(res: Response, message?: string, error?: Error): Response;
}
export declare class LambdaResponseHelper {
    static success<T = any>(data?: T, message?: string, statusCode?: HttpStatusCode, headers?: Record<string, string>): {
        statusCode: HttpStatusCode;
        headers: {
            'Content-Type': string;
            'Access-Control-Allow-Origin': string;
            'Access-Control-Allow-Methods': string;
            'Access-Control-Allow-Headers': string;
        };
        body: string;
    };
    static error(message: string, statusCode?: HttpStatusCode, code?: string, details?: Record<string, any>, headers?: Record<string, string>): {
        statusCode: HttpStatusCode;
        headers: {
            'Content-Type': string;
            'Access-Control-Allow-Origin': string;
            'Access-Control-Allow-Methods': string;
            'Access-Control-Allow-Headers': string;
        };
        body: string;
    };
    static validationError(errors: ValidationError[], message?: string, headers?: Record<string, string>): {
        statusCode: HttpStatusCode;
        headers: {
            'Content-Type': string;
            'Access-Control-Allow-Origin': string;
            'Access-Control-Allow-Methods': string;
            'Access-Control-Allow-Headers': string;
        };
        body: string;
    };
}
export declare class PaginationUtil {
    static calculatePagination(totalItems: number, currentPage?: number, itemsPerPage?: number): PaginationMeta;
    static calculateOffset(page?: number, limit?: number): number;
    static validatePaginationParams(page?: number, limit?: number, maxLimit?: number): {
        page: number;
        limit: number;
        errors: ValidationError[];
    };
}
export declare function responseFormatterMiddleware(): (req: any, res: Response, next: any) => void;
export declare class ErrorMapper {
    static mapDatabaseError(error: any): {
        statusCode: HttpStatusCode;
        code: string;
        message: string;
    };
    static mapValidationError(error: any): ValidationError[];
}
declare const _default: {
    ResponseUtil: typeof ResponseUtil;
    ExpressResponseHelper: typeof ExpressResponseHelper;
    LambdaResponseHelper: typeof LambdaResponseHelper;
    PaginationUtil: typeof PaginationUtil;
    ErrorMapper: typeof ErrorMapper;
    HttpStatusCode: typeof HttpStatusCode;
    responseFormatterMiddleware: typeof responseFormatterMiddleware;
};
export default _default;
//# sourceMappingURL=response.d.ts.map