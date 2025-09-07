import { APIGatewayProxyResult } from 'aws-lambda';
interface StandardResponse {
    data?: any;
    message?: string;
    error?: string;
    code?: string;
    timestamp?: string;
    requestId?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
    service?: string;
}
export declare const createSuccessResponse: (response: StandardResponse, statusCode?: number) => APIGatewayProxyResult;
export declare const createErrorResponse: (message: string, statusCode?: number, code?: string) => APIGatewayProxyResult;
export declare const createValidationErrorResponse: (errors: string[], statusCode?: number) => APIGatewayProxyResult;
export declare const createUnauthorizedResponse: (message?: string) => APIGatewayProxyResult;
export declare const createForbiddenResponse: (message?: string) => APIGatewayProxyResult;
export declare const createNotFoundResponse: (resource?: string) => APIGatewayProxyResult;
export declare const createMethodNotAllowedResponse: (method: string) => APIGatewayProxyResult;
export declare const createConflictResponse: (message: string) => APIGatewayProxyResult;
export declare const createTooManyRequestsResponse: (message?: string) => APIGatewayProxyResult;
export declare const createInternalServerErrorResponse: (message?: string) => APIGatewayProxyResult;
export declare const handleError: (error: any, defaultMessage?: string) => APIGatewayProxyResult;
export {};
//# sourceMappingURL=response.utils.d.ts.map