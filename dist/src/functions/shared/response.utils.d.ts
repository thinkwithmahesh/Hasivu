import { APIGatewayProxyResult } from 'aws-lambda';
export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    code?: string;
    meta?: {
        timestamp: string;
        requestId?: string;
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}
export interface ErrorResponse {
    success: false;
    error: string;
    message: string;
    code?: string;
    details?: any;
    meta: {
        timestamp: string;
        requestId?: string;
    };
}
export declare function createSuccessResponse<T>(data: T, message?: string, statusCode?: number, requestId?: string): APIGatewayProxyResult;
export declare function createErrorResponse(statusCode: number, message: string, details?: any, code?: string, requestId?: string): APIGatewayProxyResult;
export declare function handleError(error: Error, message?: string, statusCode?: number, requestId?: string): APIGatewayProxyResult;
export declare function createPaginatedResponse<T>(items: T[], total: number, page: number, limit: number, requestId?: string, additional?: any): APIGatewayProxyResult;
export declare function handleCorsPrelight(): APIGatewayProxyResult;
export declare function parseRequestBody<T>(body: string | null, required?: boolean): T;
export declare function extractPathParameter(pathParameters: Record<string, string> | null, paramName: string, required?: boolean): string | null;
export declare function extractQueryParameter(queryStringParameters: Record<string, string> | null, paramName: string, defaultValue?: string): string | null;
export declare function validateUUID(value: string, paramName?: string): void;
//# sourceMappingURL=response.utils.d.ts.map