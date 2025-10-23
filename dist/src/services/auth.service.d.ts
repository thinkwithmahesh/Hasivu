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
export interface AuthResult {
    success: boolean;
    user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: string;
        permissions: string[];
        schoolId?: string;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
    sessionId: string;
    schoolId?: string;
    error?: string;
}
export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
    userAgent?: string;
    ipAddress?: string;
}
export interface PasswordRequirements {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
}
export interface SessionValidationResult {
    valid: boolean;
    user?: {
        id: string;
        email: string;
        role: string;
        permissions: string[];
    };
    sessionId?: string;
    error?: string;
}
export interface PasswordValidationResult {
    valid: boolean;
    isValid: boolean;
    message?: string;
    errors?: string[];
    score?: number;
    requirements?: {
        length: boolean;
        uppercase: boolean;
        lowercase: boolean;
        numbers: boolean;
        symbols: boolean;
    };
}
export declare class AuthService {
    private static instance;
    private jwtSecret;
    private jwtRefreshSecret;
    private passwordRequirements;
    private sessionTimeout;
    private maxFailedAttempts;
    private lockoutDuration;
    private redis;
    constructor();
    static getInstance(): AuthService;
    validateConfiguration(): {
        isValid: boolean;
        missingConfigs: string[];
        securityIssues: string[];
    };
    private getRolePermissions;
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
    validatePassword(password: string): PasswordValidationResult;
    private calculatePasswordScore;
    private generateToken;
    verifyToken(token: string, expectedType?: 'access' | 'refresh'): Promise<JWTPayload>;
    private generateSessionId;
    private createSession;
    updateSessionActivity(sessionId: string, metadata?: any): Promise<void>;
    revokeSession(sessionId: string): Promise<void>;
    blacklistToken(token: string): Promise<void>;
    authenticate(credentials: LoginCredentials): Promise<AuthResult>;
    login(emailOrRequest: string | {
        protocol?: string;
        headers?: any;
        body?: {
            email: string;
            password: string;
        };
    }, password?: string): Promise<{
        success: boolean;
        token?: string;
        user?: any;
        message?: string;
        error?: string;
        headers?: any;
        cookies?: any;
    }>;
    private recordFailedAttempt;
    logout(sessionId: string, token?: string): Promise<void>;
    logoutAll(userId: string): Promise<void>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    cleanupSessions(): Promise<void>;
    createUser(userData: any): Promise<any>;
    generateSecureToken(length?: number): Promise<string>;
    encryptPersonalData(data: any): Promise<any>;
    decryptPersonalData(encryptedData: any): Promise<any>;
    initialize(): Promise<{
        success: boolean;
        message?: string;
    }>;
    getAllUsers(token: string, filters?: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    deleteUser(userId: string, token: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    modifyUserRole(userId: string, newRole: string, token: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    manageSchoolUsers(token: string, schoolId?: string, action?: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    viewSchoolAnalytics(token: string, schoolId?: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    configureSchoolSettings(token: string, schoolId?: string, settings?: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    validateToken(token: string): Promise<{
        success: boolean;
        valid?: boolean;
        error?: string;
    }>;
    createUserResource(userId: string, resourceData: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    getUserResource(resourceId: string, token: string): Promise<{
        success: boolean;
        resource?: any;
        error?: string;
    }>;
    uploadFile(fileData: any, token?: string): Promise<{
        success: boolean;
        fileId?: string;
        filename?: string;
        sanitizedContent?: string;
        mimeType?: string;
        error?: string;
    }>;
    downloadFile(fileId: string, token: string): Promise<{
        success: boolean;
        content?: string;
        error?: string;
    }>;
    cleanup(): Promise<{
        success: boolean;
        message?: string;
    }>;
    getUserProfile(userId: string, token: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    followRedirect(url: string): Promise<{
        success: boolean;
        finalUrl?: string;
        data?: any;
        error?: string;
    }>;
    callAPIVersion(version: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    createSessionForTesting(userId: string, metadata?: any): Promise<{
        sessionId: string;
        expiresAt: Date;
    }>;
    validateSession(sessionId: string): Promise<{
        success: boolean;
        valid?: boolean;
        userId?: string;
        error?: string;
    }>;
    getCORSHeaders(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    getUserById(userId: string): Promise<any>;
    findUserByQuery(query: string | any): Promise<any>;
    uploadUserDocument(userId: string, file: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
        filename?: string;
        fileId?: string;
    }>;
    readFile(fileId: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    searchUserByName(name: string): Promise<any[]>;
    getCSPHeaders(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
        headers?: any;
    }>;
    getSecurityHeaders(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
        headers?: any;
    }>;
    getServerResponse(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
        response?: any;
        headers?: any;
    }>;
    testConfigurationError(): Promise<{
        success: boolean;
        error?: string;
        isSecure?: boolean;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        success: boolean;
        message?: string;
        error?: string;
    }>;
    forgotPassword(email: string): Promise<{
        success: boolean;
        message?: string;
        error?: string;
    }>;
    initiatePasswordReset(email: string): Promise<{
        success: boolean;
        message?: string;
        error?: string;
    }>;
    resetPassword(resetToken: string, newPassword: string): Promise<{
        success: boolean;
        message?: string;
        error?: string;
    }>;
    register(userData: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        role?: string;
        schoolId?: string;
    }): Promise<{
        success: boolean;
        user?: any;
        error?: string;
    }>;
    updateProfile(userId: string, profileData: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        language?: string;
        timezone?: string;
    }): Promise<{
        success: boolean;
        user?: any;
        error?: string;
    }>;
    refreshAccessToken(refreshToken: string): Promise<{
        success: boolean;
        tokens?: {
            accessToken: string;
            refreshToken: string;
        };
        error?: string;
    }>;
    validateConfigurationForTesting(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map