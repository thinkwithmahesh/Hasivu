import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { JWTPayload } from '../jwt.service';
export interface AuthResult {
    isAuthenticated: boolean;
    success: boolean;
    user?: JWTPayload;
    error?: string;
    statusCode?: number;
    headers?: Record<string, string>;
    schoolId?: string;
}
export interface AuthOptions {
    requiredRole?: string;
    requiredPermissions?: string[];
    allowExpired?: boolean;
    requireBusinessContext?: boolean;
    requireSessionValidation?: boolean;
    customValidation?: (payload: JWTPayload) => Promise<boolean> | boolean;
}
export interface MiddlewareResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}
export declare const authenticateJWT: (event: APIGatewayProxyEvent, options?: AuthOptions) => Promise<AuthResult>;
export declare const requireRole: (role: string) => (event: APIGatewayProxyEvent) => Promise<AuthResult>;
export declare const requirePermissions: (permissions: string[]) => (event: APIGatewayProxyEvent) => Promise<AuthResult>;
export declare const requireAdmin: (event: APIGatewayProxyEvent) => Promise<AuthResult>;
export declare const requireBusinessOwner: (event: APIGatewayProxyEvent) => Promise<AuthResult>;
export declare const requireManager: (event: APIGatewayProxyEvent) => Promise<AuthResult>;
export declare const requireStaff: (event: APIGatewayProxyEvent) => Promise<AuthResult>;
export declare const requireCustomer: (event: APIGatewayProxyEvent) => Promise<AuthResult>;
export declare const optionalAuth: (event: APIGatewayProxyEvent) => Promise<AuthResult>;
export declare const rateLimitMiddleware: (event: APIGatewayProxyEvent, limits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
}) => Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
}>;
export declare const corsMiddleware: (origin?: string, methods?: string[], headers?: string[]) => Record<string, string>;
export declare const securityHeaders: () => Record<string, string>;
export declare const createAuthErrorResponse: (statusCode: number, message: string, errorCode?: string, details?: any) => APIGatewayProxyResult;
export declare const withAuth: (handler: (event: APIGatewayProxyEvent, user: JWTPayload) => Promise<APIGatewayProxyResult>, authOptions?: AuthOptions) => (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const withOptionalAuth: (handler: (event: APIGatewayProxyEvent, user?: JWTPayload) => Promise<APIGatewayProxyResult>) => (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const authMiddlewareHealthCheck: () => {
    status: 'healthy' | 'unhealthy';
    details: any;
};
//# sourceMappingURL=auth.d.ts.map