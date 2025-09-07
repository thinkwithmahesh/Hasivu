import { APIGatewayProxyEvent } from 'aws-lambda';
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
    tokenType: 'access' | 'refresh';
    iat: number;
    exp: number;
    iss?: string;
    aud?: string;
    jti?: string;
    businessId?: string;
    sessionId?: string;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    schoolId?: string;
}
export interface JWTExtractionResult {
    isValid: boolean;
    payload: JWTPayload | null;
    token: string | null;
    error?: string;
    errorCode?: string;
    expiresAt?: Date;
    issuedAt?: Date;
    remainingTTL?: number;
}
export interface TokenGenerationOptions {
    expiresIn?: string | number;
    audience?: string;
    issuer?: string;
    jwtid?: string;
    notBefore?: string | number;
    subject?: string;
    keyid?: string;
    includeSessionData?: boolean;
    includeDeviceInfo?: boolean;
}
export interface RefreshTokenResult {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    error?: string;
    errorCode?: string;
}
export declare class JWTService {
    private static instance;
    private readonly jwtSecret;
    private readonly refreshSecret;
    private readonly issuer;
    private readonly audience;
    private readonly defaultExpiresIn;
    private readonly refreshExpiresIn;
    private constructor();
    static getInstance(): JWTService;
    private validateJWTConfiguration;
    extractTokenFromEvent(event: APIGatewayProxyEvent): string | null;
    private parseCookies;
    verifyToken(token: string): JWTExtractionResult;
    generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'tokenType'>, options?: TokenGenerationOptions): string;
    generateRefreshToken(payload: Pick<JWTPayload, 'userId' | 'email' | 'role' | 'sessionId'>, options?: TokenGenerationOptions): string;
    verifyRefreshToken(token: string): JWTExtractionResult;
    refreshAccessToken(refreshToken: string): Promise<RefreshTokenResult>;
    decodeToken(token: string): JWTPayload | null;
    isTokenExpired(token: string): boolean;
    getTokenExpiration(token: string): Date | null;
    getTokenTTL(token: string): number | null;
    hasPermission(payload: JWTPayload, requiredPermission: string): boolean;
    hasRole(payload: JWTPayload, requiredRole: string): boolean;
    generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp' | 'tokenType'>, options?: TokenGenerationOptions): {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
    revokeToken(token: string): Promise<boolean>;
    healthCheck(): {
        status: 'healthy' | 'unhealthy';
        details: any;
    };
}
export declare const jwtService: JWTService;
//# sourceMappingURL=jwt.service.d.ts.map