import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export interface IdempotencyOptions {
    headerName?: string;
    ttlSeconds?: number;
    includeUserId?: boolean;
    allowedMethods?: string[];
}
export declare const idempotencyMiddleware: (options?: IdempotencyOptions) => {
    before: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult | null>;
    after: (event: APIGatewayProxyEvent, result: APIGatewayProxyResult) => Promise<APIGatewayProxyResult>;
};
export declare const generateIdempotencyKey: () => string;
export declare const cleanupExpiredIdempotencyKeys: () => Promise<number>;
//# sourceMappingURL=idempotency.middleware.d.ts.map