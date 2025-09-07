import { APIGatewayProxyEvent } from 'aws-lambda';
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    sessionId: string;
    tokenType: 'access' | 'refresh';
    permissions: string[];
    iat: number;
    exp: number;
    iss: string;
    aud: string;
}
export interface JWTExtractionResult {
    payload: JWTPayload;
    token: string;
    isValid: boolean;
    error?: string;
}
export interface TokenGenerationOptions {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
    sessionId?: string;
    expiresIn?: string | number;
    tokenType?: 'access' | 'refresh';
}
export interface RefreshTokenPayload extends JWTPayload {
    tokenType: 'refresh';
    accessTokenId?: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
}
export declare class JWTServiceError extends Error {
    readonly code: string;
    readonly details: any;
    constructor(message: string, code?: string, details?: any);
}
export declare class JWTService {
    private static instance;
    private readonly jwtSecret;
    private readonly jwtRefreshSecret;
    private readonly jwtIssuer;
    private readonly jwtAudience;
    private readonly tokenBlacklist;
    private readonly refreshTokens;
    private constructor();
    static getInstance(): JWTService;
    private validateConfiguration;
    generateTokenPair(options: TokenGenerationOptions): TokenPair;
    refreshAccessToken(refreshToken: string): Promise<TokenPair>;
    extractTokenFromEvent(event: APIGatewayProxyEvent): string | null;
    private isValidTokenFormat;
    private parseCookies;
    verifyToken(token: string, expectedType?: 'access' | 'refresh'): Promise<JWTExtractionResult>;
    verifyRefreshToken(refreshToken: string): Promise<JWTExtractionResult>;
    private validateTokenPayload;
    blacklistToken(token: string): void;
    blacklistSession(sessionId: string): void;
    isTokenBlacklisted(token: string): boolean;
    cleanupExpiredTokens(): void;
    private generateSessionId;
    private generateTokenId;
    decodeToken(token: string): {
        header: any;
        payload: any;
    } | null;
    healthCheck(): {
        status: 'healthy' | 'unhealthy';
        timestamp: number;
        configuration: {
            secretConfigured: boolean;
            refreshSecretConfigured: boolean;
            issuer: string;
            audience: string;
        };
        metrics: {
            blacklistedTokens: number;
            activeRefreshTokens: number;
        };
        error?: string;
    };
}
export declare const jwtService: JWTService;
//# sourceMappingURL=jwt.service.d.ts.map