export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}
export declare function successResponse<T>(data: T, statusCode?: number): {
    statusCode: number;
    body: string;
    headers: {
        [key: string]: string;
    };
};
export declare function errorResponse(code: string, message: string, statusCode?: number, details?: any): {
    statusCode: number;
    body: string;
    headers: {
        [key: string]: string;
    };
};
export declare function validationErrorResponse(message: string, details?: any): {
    statusCode: number;
    body: string;
    headers: {
        [key: string]: string;
    };
};
export declare function notFoundResponse(resource?: string): {
    statusCode: number;
    body: string;
    headers: {
        [key: string]: string;
    };
};
export declare function unauthorizedResponse(message?: string): {
    statusCode: number;
    body: string;
    headers: {
        [key: string]: string;
    };
};
export declare function serverErrorResponse(error: Error): {
    statusCode: number;
    body: string;
    headers: {
        [key: string]: string;
    };
};
export declare function handleError(error: Error | any, message?: string, statusCode?: number, requestId?: string): {
    statusCode: number;
    body: string;
    headers: {
        [key: string]: string;
    };
};
export declare const createSuccessResponse: typeof successResponse;
export declare const createErrorResponse: typeof errorResponse;
//# sourceMappingURL=response.utils.d.ts.map