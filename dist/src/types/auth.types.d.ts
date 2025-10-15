import type { UserProfile, UserRole } from './api.types';
export type { UserRole, UserProfile } from './api.types';
export type User = UserProfile;
export type UserPermission = 'auth:login' | 'auth:register' | 'auth:logout' | 'auth:refresh' | 'auth:change_password' | 'profile:read' | 'profile:update' | 'orders:create' | 'orders:read' | 'orders:update' | 'orders:delete' | 'orders:list' | 'orders:manage' | 'payments:create' | 'payments:read' | 'payments:refund' | 'menu:read' | 'menu:create' | 'menu:update' | 'menu:delete' | 'delivery:track' | 'delivery:confirm' | 'notifications:send' | 'notifications:manage' | 'admin:users' | 'admin:schools' | 'admin:analytics' | 'admin:settings' | 'super_admin:all';
export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
    deviceFingerprint?: string;
}
export interface RegistrationData {
    email: string;
    password: string;
    passwordConfirmation: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
    schoolId?: string;
    metadata?: Record<string, any>;
}
export interface PasswordChangeRequest {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirmation: string;
}
export interface PasswordResetRequest {
    email: string;
}
export interface PasswordResetConfirmation {
    token: string;
    password: string;
    passwordConfirmation: string;
}
export interface AuthResponse {
    success: boolean;
    user?: User;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    expiresAt?: string;
    sessionId?: string;
    csrfToken?: string;
    message?: string;
    error?: string;
    errorCode?: string;
}
export interface Session {
    id: string;
    userId: string;
    deviceFingerprint: string;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    lastActivity: Date;
    expiresAt: Date;
    isActive: boolean;
    metadata?: Record<string, any>;
}
export interface TokenPayload {
    userId: string;
    email: string;
    role: UserRole;
    permissions: UserPermission[];
    sessionId: string;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    schoolId?: string;
    tokenType: 'access' | 'refresh';
    iat: number;
    exp: number;
    iss?: string;
    aud?: string;
    jti?: string;
}
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    sessionId?: string;
    csrfToken?: string;
    error?: string;
}
export interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<AuthResponse>;
    register: (data: RegistrationData) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<AuthResponse>;
    updateProfile: (data: Partial<User>) => Promise<AuthResponse>;
    changePassword: (data: PasswordChangeRequest) => Promise<AuthResponse>;
    forgotPassword: (data: PasswordResetRequest) => Promise<AuthResponse>;
    resetPassword: (data: PasswordResetConfirmation) => Promise<AuthResponse>;
    checkAuth: () => Promise<boolean>;
    hasRole: (role: UserRole | UserRole[]) => boolean;
    hasPermission: (permission: UserPermission | UserPermission[]) => boolean;
    clearError: () => void;
}
export interface ApiError {
    error: string;
    message: string;
    details?: string;
    code?: string;
    statusCode?: number;
    timestamp?: string;
    path?: string;
    validation?: ValidationError[];
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
    constraint?: string;
}
export interface CSRFToken {
    token: string;
    sessionId: string;
    expiresAt: Date;
}
export interface DeviceFingerprint {
    userAgent: string;
    language: string;
    platform: string;
    timezone: string;
    screen: {
        width: number;
        height: number;
        colorDepth: number;
    };
    hash: string;
}
export interface AuthConfig {
    apiBaseUrl: string;
    tokenStorageKey: string;
    refreshTokenKey: string;
    sessionStorageKey: string;
    csrfTokenKey: string;
    autoRefresh: boolean;
    refreshThreshold: number;
    maxRetries: number;
    timeoutMs: number;
}
export interface SessionValidationResult {
    valid: boolean;
    session?: Session;
    error?: string;
    reason?: 'expired' | 'invalid' | 'fingerprint_mismatch' | 'inactive' | 'not_found';
}
export type RolePermissions = {
    [key in UserRole]: UserPermission[];
};
export declare const DEFAULT_ROLE_PERMISSIONS: RolePermissions;
export declare class AuthUtils {
    static hasRole(user: User | null, role: UserRole | UserRole[]): boolean;
    static hasPermission(user: User | null, permission: UserPermission | UserPermission[]): boolean;
    static getPermissionsForRole(role: UserRole): UserPermission[];
    static validatePassword(password: string): {
        valid: boolean;
        errors: string[];
    };
    static validateEmail(email: string): boolean;
    static generateDeviceFingerprint(): string;
    static isTokenExpired(token: string): boolean;
    static getTokenExpiration(token: string): Date | null | undefined;
}
declare const _default: {
    DEFAULT_ROLE_PERMISSIONS: RolePermissions;
    AuthUtils: typeof AuthUtils;
};
export default _default;
//# sourceMappingURL=auth.types.d.ts.map