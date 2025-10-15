import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (event: APIGatewayProxyEvent) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}
export declare const rateLimitingMiddleware: (options: RateLimitOptions) => {
    before: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult | null>;
    after: (event: APIGatewayProxyEvent, result: APIGatewayProxyResult) => Promise<APIGatewayProxyResult>;
};
export declare const userKeyGenerator: (event: APIGatewayProxyEvent) => string;
export declare const ipKeyGenerator: (event: APIGatewayProxyEvent) => string;
export declare const paymentRateLimiter: {
    before: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult | null>;
    after: (event: APIGatewayProxyEvent, result: APIGatewayProxyResult) => Promise<APIGatewayProxyResult>;
};
export declare const paymentCreationRateLimiter: {
    before: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult | null>;
    after: (event: APIGatewayProxyEvent, result: APIGatewayProxyResult) => Promise<APIGatewayProxyResult>;
};
export declare const webhookRateLimiter: {
    before: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult | null>;
    after: (event: APIGatewayProxyEvent, result: APIGatewayProxyResult) => Promise<APIGatewayProxyResult>;
};
export declare const getRateLimitStatus: (key: string, windowMs: number) => Promise<{
    current: number;
    limit: number;
    remaining: number;
    reset: number;
} | null>;
//# sourceMappingURL=rate-limiting.middleware.d.ts.map