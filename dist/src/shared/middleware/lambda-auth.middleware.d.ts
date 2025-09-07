import { APIGatewayProxyEvent } from 'aws-lambda';
export interface AuthenticatedUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolId?: string;
    permissions: string[];
    sessionId: string;
}
export interface AuthenticationResult {
    success: boolean;
    userId?: string;
    user?: AuthenticatedUser;
    error?: string;
    schoolId?: string;
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    permissions?: string[];
    sessionId?: string;
}
export interface AuthMiddlewareOptions {
    roles?: string[];
    permissions?: string[];
    schoolRequired?: boolean;
    optional?: boolean;
}
export declare function authenticateLambda(event: APIGatewayProxyEvent, options?: AuthMiddlewareOptions): Promise<AuthenticationResult>;
//# sourceMappingURL=lambda-auth.middleware.d.ts.map