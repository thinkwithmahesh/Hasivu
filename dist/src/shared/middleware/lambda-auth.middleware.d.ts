import { APIGatewayProxyEvent } from 'aws-lambda';
export interface AuthenticatedEvent {
    headers: {
        authorization?: string;
        [key: string]: string | undefined;
    };
    requestContext?: {
        authorizer?: {
            userId?: string;
            email?: string;
            role?: string;
        };
    };
    userId?: string;
    userEmail?: string;
    userRole?: string;
}
export interface AuthMiddlewareResult {
    success: boolean;
    userId?: string;
    id?: string;
    email?: string;
    role?: string;
    user?: AuthenticatedUser;
    error?: {
        code: string;
        message: string;
    };
}
export declare function authenticateRequest(event: any): Promise<AuthMiddlewareResult>;
export declare function requireAuth(event: APIGatewayProxyEvent): Promise<AuthMiddlewareResult>;
export declare function requireRole(allowedRoles: string[]): (event: APIGatewayProxyEvent) => Promise<AuthMiddlewareResult>;
export declare const authenticateLambda: typeof authenticateRequest;
export interface AuthenticatedUser {
    id: string;
    userId: string;
    email: string;
    role: string;
    schoolId?: string;
}
//# sourceMappingURL=lambda-auth.middleware.d.ts.map