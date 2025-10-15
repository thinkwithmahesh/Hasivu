/**
 * HASIVU Platform - Unified Authentication Types
 * Shared types between frontend and backend for consistency
 */

// Import types from api.types.ts for consistency
import type { UserProfile, UserRole } from './api.types';

// Re-export UserRole from api.types.ts for consistency
export type { UserRole, UserProfile } from './api.types';

// Type alias for backward compatibility
export type User = UserProfile;

/**
 * User permissions
 */
export type UserPermission =
  | 'auth:login'
  | 'auth:register'
  | 'auth:logout'
  | 'auth:refresh'
  | 'auth:change_password'
  | 'profile:read'
  | 'profile:update'
  | 'orders:create'
  | 'orders:read'
  | 'orders:update'
  | 'orders:delete'
  | 'orders:list'
  | 'orders:manage'
  | 'payments:create'
  | 'payments:read'
  | 'payments:refund'
  | 'menu:read'
  | 'menu:create'
  | 'menu:update'
  | 'menu:delete'
  | 'delivery:track'
  | 'delivery:confirm'
  | 'notifications:send'
  | 'notifications:manage'
  | 'admin:users'
  | 'admin:schools'
  | 'admin:analytics'
  | 'admin:settings'
  | 'super_admin:all';

/**
 * Authentication credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceFingerprint?: string;
}

/**
 * Registration data
 */
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

/**
 * Password change request
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirmation {
  token: string;
  password: string;
  passwordConfirmation: string;
}

/**
 * Authentication response
 */
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

/**
 * Session data
 */
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

/**
 * Token payload for JWT
 */
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

/**
 * Authentication state for frontend
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  sessionId?: string;
  csrfToken?: string;
  error?: string;
}

/**
 * Authentication context type for React
 */
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

/**
 * API error response
 */
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

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  constraint?: string;
}

/**
 * CSRF token data
 */
export interface CSRFToken {
  token: string;
  sessionId: string;
  expiresAt: Date;
}

/**
 * Device fingerprint data
 */
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

/**
 * Authentication configuration
 */
export interface AuthConfig {
  apiBaseUrl: string;
  tokenStorageKey: string;
  refreshTokenKey: string;
  sessionStorageKey: string;
  csrfTokenKey: string;
  autoRefresh: boolean;
  refreshThreshold: number; // Seconds before expiry to refresh
  maxRetries: number;
  timeoutMs: number;
}

/**
 * Session validation result
 */
export interface SessionValidationResult {
  valid: boolean;
  session?: Session;
  error?: string;
  reason?: 'expired' | 'invalid' | 'fingerprint_mismatch' | 'inactive' | 'not_found';
}

/**
 * Role-based access control (RBAC) configuration
 */
export type RolePermissions = {
  [key in UserRole]: UserPermission[];
};

/**
 * Default role permissions
 */
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  super_admin: ['super_admin:all'],
  school_admin: [
    'auth:login',
    'auth:logout',
    'auth:refresh',
    'auth:change_password',
    'profile:read',
    'profile:update',
    'orders:create',
    'orders:read',
    'orders:update',
    'orders:delete',
    'orders:list',
    'orders:manage',
    'payments:create',
    'payments:read',
    'payments:refund',
    'menu:create',
    'menu:read',
    'menu:update',
    'menu:delete',
    'delivery:track',
    'delivery:confirm',
    'notifications:send',
    'notifications:manage',
    'admin:users',
    'admin:schools',
    'admin:analytics',
    'admin:settings',
  ],
  teacher: [
    'auth:login',
    'auth:logout',
    'auth:refresh',
    'auth:change_password',
    'profile:read',
    'profile:update',
    'orders:read',
    'orders:list',
    'menu:read',
    'delivery:track',
  ],
  student: [
    'auth:login',
    'auth:logout',
    'auth:refresh',
    'auth:change_password',
    'profile:read',
    'profile:update',
    'orders:create',
    'orders:read',
    'menu:read',
    'delivery:track',
  ],
  parent: [
    'auth:login',
    'auth:logout',
    'auth:refresh',
    'auth:change_password',
    'profile:read',
    'profile:update',
    'orders:create',
    'orders:read',
    'orders:list',
    'payments:create',
    'payments:read',
    'menu:read',
    'delivery:track',
  ],
  staff: [
    'auth:login',
    'auth:logout',
    'auth:refresh',
    'auth:change_password',
    'profile:read',
    'profile:update',
    'orders:read',
    'orders:update',
    'orders:list',
    'menu:read',
    'delivery:confirm',
  ],
  canteen_manager: [
    'auth:login',
    'auth:logout',
    'auth:refresh',
    'auth:change_password',
    'profile:read',
    'profile:update',
    'orders:read',
    'orders:update',
    'orders:list',
    'orders:manage',
    'menu:create',
    'menu:read',
    'menu:update',
    'menu:delete',
    'delivery:track',
    'delivery:confirm',
    'notifications:send',
    'admin:analytics',
  ],
  accountant: [
    'auth:login',
    'auth:logout',
    'auth:refresh',
    'auth:change_password',
    'profile:read',
    'profile:update',
    'payments:create',
    'payments:read',
    'payments:refund',
    'orders:read',
    'orders:list',
    'admin:analytics',
  ],
};

/**
 * Utility functions for authentication
 */
export class AuthUtils {
  /**
   * Check if user has specific role
   */
  static hasRole(user: User | null, role: UserRole | UserRole[]): boolean {
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }

    return user.role === role || user.role === 'super_admin';
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(user: User | null, permission: UserPermission | UserPermission[]): boolean {
    if (!user) return false;

    // Super admin has all permissions
    if (user.role === 'super_admin' || user.permissions.includes('super_admin:all')) {
      return true;
    }

    if (Array.isArray(permission)) {
      return permission.some(p => user.permissions.includes(p));
    }

    return user.permissions.includes(permission);
  }

  /**
   * Get permissions for role
   */
  static getPermissionsForRole(role: UserRole): UserPermission[] {
    return DEFAULT_ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain more than 2 consecutive identical characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate device fingerprint hash
   */
  static generateDeviceFingerprint(): string {
    if (typeof window === 'undefined') {
      return 'server-side-fingerprint';
    }

    const fingerprint: DeviceFingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      hash: '',
    };

    // Create hash from fingerprint data
    const fingerprintString = JSON.stringify(fingerprint);
    fingerprint.hash = btoa(fingerprintString).substring(0, 32);

    return fingerprint.hash;
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }
}

export default {
  DEFAULT_ROLE_PERMISSIONS,
  AuthUtils,
};
