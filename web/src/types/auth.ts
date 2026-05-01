/**
 * HASIVU Platform - Authentication Types
 * TypeScript interfaces and types for authentication system
 */

// User roles in the system
export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  PARENT = 'parent',
  STUDENT = 'student',
  VENDOR = 'vendor',
  KITCHEN_STAFF = 'kitchen_staff',
  SCHOOL_ADMIN = 'school_admin',
  SUPER_ADMIN = 'super_admin',
}

// Role configuration for UI display
export interface RoleConfig {
  label: string;
  description?: string;
  defaultRoute?: string;
}

// Configuration mapping for each user role
export const USER_ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  [UserRole.ADMIN]: {
    label: 'Admin',
    description: 'Platform administrator',
    defaultRoute: '/admin/dashboard',
  },
  [UserRole.SCHOOL_ADMIN]: {
    label: 'School Admin',
    description: 'School-level administrator',
    defaultRoute: '/school-admin/dashboard',
  },
  [UserRole.TEACHER]: {
    label: 'Teacher',
    description: 'Teaching staff',
    defaultRoute: '/teacher/dashboard',
  },
  [UserRole.PARENT]: {
    label: 'Parent',
    description: 'Parent or guardian',
    defaultRoute: '/menu',
  },
  [UserRole.STUDENT]: {
    label: 'Student',
    description: 'Student',
    defaultRoute: '/student/dashboard',
  },
  [UserRole.VENDOR]: {
    label: 'Vendor',
    description: 'Food vendor or supplier',
    defaultRoute: '/vendor/dashboard',
  },
  [UserRole.KITCHEN_STAFF]: {
    label: 'Kitchen',
    description: 'Kitchen staff',
    defaultRoute: '/kitchen/dashboard',
  },
  [UserRole.SUPER_ADMIN]: {
    label: 'Super Admin',
    description: 'Super administrator',
    defaultRoute: '/super-admin/dashboard',
  },
};

// Permission types for role-based access control
export enum Permission {
  // User management
  READ_USERS = 'read_users',
  WRITE_USERS = 'write_users',
  DELETE_USERS = 'delete_users',
  MANAGE_USERS = 'manage_users',

  // Order management
  READ_ORDERS = 'read_orders',
  WRITE_ORDERS = 'write_orders',
  DELETE_ORDERS = 'delete_orders',
  PLACE_ORDERS = 'place_orders',
  UPDATE_ORDER_STATUS = 'update_order_status',

  // Menu management
  READ_MENU = 'read_menu',
  WRITE_MENU = 'write_menu',
  MANAGE_MENU = 'manage_menu',

  // Payment management
  READ_PAYMENTS = 'read_payments',
  WRITE_PAYMENTS = 'write_payments',
  MANAGE_PAYMENT_METHODS = 'manage_payment_methods',
  PROCESS_PAYMENTS = 'process_payments',

  // Analytics and reports
  READ_ANALYTICS = 'read_analytics',
  VIEW_REPORTS = 'view_reports',
  EXPORT_DATA = 'exportdata',

  // System administration
  ADMIN_ACCESS = 'admin_access',
  SCHOOL_ADMIN_ACCESS = 'school_admin_access',
  SYSTEM_SETTINGS = 'systemsettings',

  // Kitchen and inventory
  KITCHEN_ACCESS = 'kitchen_access',
  MANAGE_INVENTORY = 'manage_inventory',
  VIEW_KITCHEN_QUEUE = 'view_kitchen_queue',

  // Student-specific
  VIEW_OWN_ORDERS = 'view_own_orders',
  UPDATE_PROFILE = 'update_profile',

  // Parent-specific
  VIEW_STUDENT_ORDERS = 'view_student_orders',
  MANAGE_CHILDREN = 'manage_children',

  // Notifications
  VIEW_NOTIFICATIONS = 'view_notifications',
  SEND_NOTIFICATIONS = 'send_notifications',
}

// Role-permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Full system access
    Permission.ADMIN_ACCESS,
    Permission.MANAGE_USERS,
    Permission.READ_USERS,
    Permission.WRITE_USERS,
    Permission.DELETE_USERS,
    Permission.READ_ORDERS,
    Permission.WRITE_ORDERS,
    Permission.DELETE_ORDERS,
    Permission.UPDATE_ORDER_STATUS,
    Permission.READ_MENU,
    Permission.WRITE_MENU,
    Permission.MANAGE_MENU,
    Permission.READ_PAYMENTS,
    Permission.WRITE_PAYMENTS,
    Permission.PROCESS_PAYMENTS,
    Permission.READ_ANALYTICS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
    Permission.SYSTEM_SETTINGS,
    Permission.SEND_NOTIFICATIONS,
    Permission.VIEW_NOTIFICATIONS,
  ],

  [UserRole.SCHOOL_ADMIN]: [
    // School-level administration
    Permission.SCHOOL_ADMIN_ACCESS,
    Permission.READ_USERS,
    Permission.WRITE_USERS,
    Permission.READ_ORDERS,
    Permission.WRITE_ORDERS,
    Permission.UPDATE_ORDER_STATUS,
    Permission.READ_MENU,
    Permission.WRITE_MENU,
    Permission.MANAGE_MENU,
    Permission.READ_PAYMENTS,
    Permission.READ_ANALYTICS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
    Permission.SEND_NOTIFICATIONS,
    Permission.VIEW_NOTIFICATIONS,
  ],

  [UserRole.TEACHER]: [
    // Teacher access
    Permission.READ_ORDERS,
    Permission.VIEW_STUDENT_ORDERS,
    Permission.READ_MENU,
    Permission.VIEW_REPORTS,
    Permission.UPDATE_PROFILE,
    Permission.VIEW_NOTIFICATIONS,
  ],

  [UserRole.PARENT]: [
    // Parent access
    Permission.PLACE_ORDERS,
    Permission.VIEW_STUDENT_ORDERS,
    Permission.MANAGE_CHILDREN,
    Permission.READ_MENU,
    Permission.READ_PAYMENTS,
    Permission.MANAGE_PAYMENT_METHODS,
    Permission.UPDATE_PROFILE,
    Permission.VIEW_NOTIFICATIONS,
  ],

  [UserRole.STUDENT]: [
    // Student access
    Permission.PLACE_ORDERS,
    Permission.VIEW_OWN_ORDERS,
    Permission.READ_MENU,
    Permission.UPDATE_PROFILE,
    Permission.VIEW_NOTIFICATIONS,
  ],

  [UserRole.VENDOR]: [
    // Vendor/supplier access
    Permission.READ_ORDERS,
    Permission.MANAGE_MENU,
    Permission.READ_MENU,
    Permission.WRITE_MENU,
    Permission.MANAGE_INVENTORY,
    Permission.VIEW_REPORTS,
    Permission.READ_ANALYTICS,
    Permission.UPDATE_PROFILE,
    Permission.VIEW_NOTIFICATIONS,
  ],

  [UserRole.KITCHEN_STAFF]: [
    // Kitchen staff access
    Permission.KITCHEN_ACCESS,
    Permission.READ_ORDERS,
    Permission.UPDATE_ORDER_STATUS,
    Permission.VIEW_KITCHEN_QUEUE,
    Permission.MANAGE_INVENTORY,
    Permission.READ_MENU,
    Permission.UPDATE_PROFILE,
    Permission.VIEW_NOTIFICATIONS,
  ],

  [UserRole.SUPER_ADMIN]: [
    // Full system access with additional super admin permissions
    Permission.ADMIN_ACCESS,
    Permission.MANAGE_USERS,
    Permission.READ_USERS,
    Permission.WRITE_USERS,
    Permission.DELETE_USERS,
    Permission.READ_ORDERS,
    Permission.WRITE_ORDERS,
    Permission.DELETE_ORDERS,
    Permission.UPDATE_ORDER_STATUS,
    Permission.READ_MENU,
    Permission.WRITE_MENU,
    Permission.MANAGE_MENU,
    Permission.READ_PAYMENTS,
    Permission.WRITE_PAYMENTS,
    Permission.PROCESS_PAYMENTS,
    Permission.READ_ANALYTICS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
    Permission.SYSTEM_SETTINGS,
    Permission.SEND_NOTIFICATIONS,
    Permission.VIEW_NOTIFICATIONS,
  ],
};

// User profile interface (aligned with backend `AuthResult.user` in
// `src/services/auth.service.ts`: id, email, firstName, lastName, role, permissions, schoolId;
// JWT claims add sessionId via token decode — optional here.)
export interface User {
  id: string;
  email: string;
  /** Backend may return null when not set (`AuthResult.user` in auth.service.ts). */
  firstName: string | null;
  lastName: string | null;
  name?: string; // Optional computed full name for convenience
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  schoolId?: string;
  studentId?: string;
  grade?: string;
  section?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  /** String permission ids from JWT / login payload (`JWTPayload.permissions` in auth.service.ts). */
  permissions?: string[];

  // Role-specific fields
  children?: string[]; // For parents
  managedClasses?: string[]; // For teachers
  /** Fine-grained UI permissions (optional; not always on API user). */
  permissionEnums?: Permission[];

  // Enhanced auth / MFA (optional; not on minimal JWT user)
  mfaEnabled?: boolean;
  mfaMethods?: ('sms' | 'email' | 'totp')[];
  lastLogin?: Date;

  // Preferences
  preferences?: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    language: string;
    timezone: string;
  };

  // Wallet/payment info
  wallet?: {
    balance: number;
    currency: string;
  };
}

// Login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Registration data interface
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  grade?: string;
  section?: string;
  schoolId?: string;
  studentId?: string;
}

// Auth tokens interface
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Auth response from API (flat shape used by `auth-api.service.ts` and secure auth)
export interface AuthResponse {
  success: boolean;
  user?: User;
  tokens?: AuthTokens;
  message?: string;
  error?: string;
  /** Legacy nested shape from some gateways — optional */
  data?: {
    user: User;
    tokens: AuthTokens;
  };
}

// Auth state interface
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error?: string | null;
}

// Password reset interfaces
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

/** Alias for secure-auth / API naming */
export type PasswordResetRequest = ForgotPasswordRequest;

export interface PasswordResetConfirmation {
  token: string;
  password: string;
  confirmPassword?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm?: string;
}

/** Registration payload used by secure-auth (role optional until mapped to `RegisterData`). */
export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole | string;
  schoolId?: string;
  grade?: string;
  section?: string;
}

export type UserPermission = Permission;

/**
 * Base auth context contract consumed by `secure-auth-context.tsx`.
 * Other providers may define their own local `AuthContextType` with a different shape.
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

// Profile update interface
export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: Partial<User['preferences']>;
}

// Session data interface
export interface SessionData extends AuthTokens {
  userId: string;
  sessionId: string;
  expiresAt: Date;
}

// Permission check utilities
export class PermissionChecker {
  static hasPermission(user: User | null, permission: Permission): boolean {
    if (!user) return false;

    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    return rolePermissions.includes(permission);
  }

  static hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
    if (!user) return false;

    return permissions.some(permission => this.hasPermission(user, permission));
  }

  static hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
    if (!user) return false;

    return permissions.every(permission => this.hasPermission(user, permission));
  }

  static hasRole(user: User | null, role: UserRole): boolean {
    if (!user) return false;
    return user.role === role;
  }

  static hasAnyRole(user: User | null, roles: UserRole[]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
  }

  static isAdmin(user: User | null): boolean {
    return this.hasAnyRole(user, [UserRole.ADMIN, UserRole.SCHOOL_ADMIN]);
  }

  static canManageUsers(user: User | null): boolean {
    return this.hasPermission(user, Permission.MANAGE_USERS);
  }

  static canPlaceOrders(user: User | null): boolean {
    return this.hasPermission(user, Permission.PLACE_ORDERS);
  }

  static canViewAnalytics(user: User | null): boolean {
    return this.hasPermission(user, Permission.READ_ANALYTICS);
  }
}

/** Shared helpers for secure auth and fingerprinting */
export class AuthUtils {
  static generateDeviceFingerprint(): string {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'ssr';
    }
    try {
      const raw = [
        navigator.userAgent,
        navigator.language,
        String(screen?.width),
        String(screen?.height),
      ].join('|');
      return typeof btoa === 'function' ? btoa(raw).slice(0, 128) : raw.slice(0, 128);
    } catch {
      return 'unknown-device';
    }
  }

  static hasRole(user: User | null, role: UserRole | UserRole[]): boolean {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.some(r => user.role === r);
  }

  static hasPermission(user: User | null, permission: UserPermission | UserPermission[]): boolean {
    if (!user) return false;
    const perms = Array.isArray(permission) ? permission : [permission];
    return perms.every(p => PermissionChecker.hasPermission(user, p));
  }
}

// Type guards
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

export function isValidPermission(permission: string): permission is Permission {
  return Object.values(Permission).includes(permission as Permission);
}

// Export types for convenience
export type UserProfile = User;
export type LoginFormData = LoginCredentials;
export type RegisterFormData = RegisterData;
export type AuthTokenData = AuthTokens;
