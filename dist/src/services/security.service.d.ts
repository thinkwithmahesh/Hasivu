export interface SecurityAuditLog {
    id: string;
    timestamp: Date;
    action: string;
    userId?: string;
    ipAddress: string;
    userAgent?: string;
    resource: string;
    result: 'success' | 'failure' | 'blocked';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    metadata?: any;
}
export interface RateLimitConfig {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
}
export interface CSRFConfig {
    secret: string;
    cookie: {
        httpOnly: boolean;
        secure: boolean;
        sameSite: 'strict' | 'lax' | 'none';
    };
}
export declare class SecurityService {
    private static instance;
    private initialized;
    private csrfSecret;
    private encryptionKey;
    private rateLimiters;
    private auditLog;
    constructor();
    static getInstance(): SecurityService;
    initialize(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    cleanup(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    scanForVulnerabilities(target: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    checkRateLimit(key: string, identifier: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    validateCSRF(token: string, sessionId: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    encryptData(data: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    decryptData(encryptedData: string, iv: string, authTag: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    generateToken(type?: 'access' | 'refresh' | 'csrf'): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    validateToken(token: string, type?: 'access' | 'refresh' | 'csrf'): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    auditAction(action: string, metadata?: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    private setupRateLimiters;
    private initializeSecurityMonitoring;
    private generateCSRFToken;
    private detectSQLInjection;
    getSecurityLogs(filters?: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    modifySecuritySettings(settings: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    validateEnvironmentSecurity(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    getSecurityTestCoverage(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    validateSecurityBaseline(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    private detectXSS;
    checkDependencyVulnerabilities(): {
        vulnerabilities: any[];
        summary: any;
    };
}
export declare const securityService: SecurityService;
export default SecurityService;
//# sourceMappingURL=security.service.d.ts.map