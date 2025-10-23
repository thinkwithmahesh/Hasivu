/// <reference types="cookie-parser" />
import { Request, Response } from 'express';
export interface SessionData {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
    schoolId?: string;
    deviceFingerprint: string;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    lastActivity: Date;
    expiresAt: Date;
    isActive: boolean;
    concurrentSessions?: string[];
}
export interface SessionValidationResult {
    valid: boolean;
    session?: SessionData;
    error?: string;
    reason?: 'expired' | 'invalid' | 'fingerprint_mismatch' | 'inactive' | 'not_found';
}
export interface SessionOptions {
    rememberMe?: boolean;
    deviceFingerprint?: string;
    maxConcurrentSessions?: number;
}
export interface CookieConfig {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    domain?: string;
    path: string;
}
export interface CSRFToken {
    token: string;
    sessionId: string;
    expiresAt: Date;
}
export declare class SessionService {
    private static instance;
    private redis;
    private readonly sessionPrefix;
    private readonly csrfPrefix;
    private readonly userSessionsPrefix;
    private readonly blacklistPrefix;
    private constructor();
    static getInstance(): SessionService;
    createSession(req: Request, res: Response, sessionData: Omit<SessionData, 'sessionId' | 'createdAt' | 'lastActivity' | 'expiresAt' | 'isActive'>, options?: SessionOptions): Promise<{
        sessionId: string;
        accessToken: string;
        refreshToken: string;
    }>;
    validateSession(sessionId: string, req?: Request): Promise<SessionValidationResult>;
    updateSessionActivity(sessionId: string, metadata?: {
        userAgent?: string;
        ipAddress?: string;
    }): Promise<boolean>;
    destroySession(sessionId: string): Promise<boolean>;
    destroyAllUserSessions(userId: string, excludeSessionId?: string): Promise<number>;
    generateCSRFToken(sessionId: string): Promise<CSRFToken>;
    validateCSRFToken(sessionId: string, token: string): Promise<boolean>;
    private setSecureCookies;
    clearAuthCookies(res: Response): void;
    private generateSecureSessionId;
    private createDeviceFingerprint;
    private getClientIP;
    private getMaxSessionsForRole;
    private getUserSessions;
    private addUserSession;
    private removeUserSession;
    getSessionStats(): Promise<{
        totalActiveSessions: number;
        sessionsByRole: Record<string, number>;
        averageSessionDuration: number;
    }>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: any;
    }>;
}
export declare const sessionService: SessionService;
//# sourceMappingURL=session.service.d.ts.map