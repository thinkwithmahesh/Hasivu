'use client';

/**
 * HASIVU Platform - Production Authentication Context
 *
 * FIXES: CRITICAL-001 through CRITICAL-005
 * - Real authentication with backend API
 * - Secure httpOnly cookie-based token storage
 * - CSRF protection
 * - Session management with auto-refresh
 * - Complete RBAC implementation
 *
 * Replaces: auth-context.tsx (demo mode)
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { User, UserRole, Permission, ROLE_PERMISSIONS } from '../types/auth';

// API Service singleton
class ProductionAuthService {
  private baseUrl: string;
  private csrfToken: string | null = null;
  private tokenRefreshTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.baseUrl = process.env.NEXTPUBLICAPIURL || 'http://localhost:3000/api';
  }

  /**
   * Make authenticated API request with CSRF protection
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add CSRF token for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET')) {
      if (this.csrfToken) {
        headers['X-CSRF-Token'] = this.csrfToken;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include httpOnly cookies
      mode: 'cors',
    });

    // Extract CSRF token from response headers
    const newCsrfToken = response.headers.get('X-CSRF-Token');
    if (newCsrfToken) {
      this.csrfToken = newCsrfToken;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Request failed',
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.message || errorData.error || 'Request failed');
    }

    return await response.json();
  }

  /**
   * Get CSRF token from server
   */
  async fetchCSRFToken(): Promise<void> {
    try {
      const response = await this.makeRequest<{ csrfToken: string }>('/auth/csrf-token');
      this.csrfToken = response.csrfToken;
    } catch (error) {
      // Error handled silently
    }
  }

  /**
   * Login with credentials
   */
  async login(
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<{
    success: boolean;
    user?: User;
    message?: string;
  }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        user: any;
        tokens: { accessToken: string; refreshToken: string };
        message: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (response.success && response.user) {
        return {
          success: true,
          user: this.transformUserFromBackend(response.user),
          message: response.message,
        };
      }

      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Register new user
   */
  async register(data: {
    email: string;
    password: string;
    passwordConfirm: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<{
    success: boolean;
    user?: User;
    message?: string;
  }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        user: any;
        message: string;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.success && response.user) {
        return {
          success: true,
          user: this.transformUserFromBackend(response.user),
          message: response.message,
        };
      }

      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', { method: 'POST' });
      this.csrfToken = null;

      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout);
        this.tokenRefreshTimeout = null;
      }
    } catch (error) {
      // Continue with logout even if API call fails
      this.csrfToken = null;
    }
  }

  /**
   * Logout from all sessions
   */
  async logoutAll(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout-all', { method: 'POST' });
      this.csrfToken = null;

      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout);
        this.tokenRefreshTimeout = null;
      }
    } catch (error) {
      // Error handled silently
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ success: boolean; user?: User }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        accessToken: string;
        user?: any;
      }>('/auth/refresh', { method: 'POST' });

      if (response.success && response.user) {
        return {
          success: true,
          user: this.transformUserFromBackend(response.user),
        };
      }

      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Get current user session
   */
  async getCurrentUser(): Promise<{ success: boolean; user?: User }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        user: any;
      }>('/auth/me');

      if (response.success && response.user) {
        return {
          success: true,
          user: this.transformUserFromBackend(response.user),
        };
      }

      return { success: false };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<{
    success: boolean;
    user?: User;
    message?: string;
  }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        user: any;
        message: string;
      }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (response.success && response.user) {
        return {
          success: true,
          user: this.transformUserFromBackend(response.user),
          message: response.message,
        };
      }

      return { success: false, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Profile update failed',
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        message: string;
      }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password change failed',
      };
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        message: string;
      }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password reset request failed',
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    password: string,
    passwordConfirm: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.makeRequest<{
        success: boolean;
        message: string;
      }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password, passwordConfirm }),
      });

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password reset failed',
      };
    }
  }

  /**
   * Schedule automatic token refresh
   */
  scheduleTokenRefresh(callback: () => void, intervalMs: number = 14 * 60 * 1000): void {
    // Clear existing timeout
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    // Schedule next refresh (14 minutes by default, tokens usually expire in 15 min)
    this.tokenRefreshTimeout = setTimeout(() => {
      callback();
    }, intervalMs);
  }

  /**
   * Transform backend user object to frontend User type
   */
  private transformUserFromBackend(backendUser: any): User {
    return {
      id: backendUser.id,
      email: backendUser.email,
      firstName: backendUser.firstName || backendUser.first_name || '',
      lastName: backendUser.lastName || backendUser.last_name || '',
      role: (backendUser.role as UserRole) || UserRole.STUDENT,
      phone: backendUser.phone,
      avatar: backendUser.profilePictureUrl || backendUser.avatar,
      isActive: backendUser.isActive ?? true,
      emailVerified: backendUser.emailVerified ?? false,
      schoolId: backendUser.schoolId || backendUser.school_id,
      studentId: backendUser.studentId,
      grade: backendUser.grade,
      section: backendUser.section,
      createdAt: new Date(backendUser.createdAt || backendUser.created_at),
      updatedAt: new Date(backendUser.updatedAt || backendUser.updated_at),
      lastLoginAt: backendUser.lastLoginAt ? new Date(backendUser.lastLoginAt) : undefined,
      permissions: ROLE_PERMISSIONS[backendUser.role as UserRole] || [],
      preferences: backendUser.preferences
        ? typeof backendUser.preferences === 'string'
          ? JSON.parse(backendUser.preferences)
          : backendUser.preferences
        : undefined,
    };
  }
}

// Singleton instance
const authService = new ProductionAuthService();

// Auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  sessionExpiresAt: Date | null;
}

// Auth context interface
interface AuthContextType extends AuthState {
  login: (credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<boolean>;
  register: (userData: {
    email: string;
    password: string;
    passwordConfirm: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
  }) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string, passwordConfirm: string) => Promise<boolean>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: Permission | Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function ProductionAuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,
    sessionExpiresAt: null,
  });

  const router = useRouter();
  const initializationAttempted = useRef(false);

  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    if (!initializationAttempted.current) {
      initializationAttempted.current = true;
      initializeAuth();
    }
  }, []);

  /**
   * Initialize authentication state
   */
  const initializeAuth = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Fetch CSRF token first
      await authService.fetchCSRFToken();

      // Try to get current user from server (via httpOnly cookie)
      const result = await authService.getCurrentUser();

      if (result.success && result.user) {
        setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          sessionExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        });

        // Schedule token refresh
        authService.scheduleTokenRefresh(handleTokenRefresh);
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          sessionExpiresAt: null,
        });
      }
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        sessionExpiresAt: null,
      });
    }
  };

  /**
   * Handle automatic token refresh
   */
  const handleTokenRefresh = async () => {
    try {
      const result = await authService.refreshToken();

      if (result.success && result.user) {
        setState(prev => ({
          ...prev,
          user: result.user!,
          sessionExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        }));

        // Schedule next refresh
        authService.scheduleTokenRefresh(handleTokenRefresh);
      } else {
        // Token refresh failed, logout user
        await logout();
        toast.error('Session expired. Please login again.');
      }
    } catch (error) {
      await logout();
    }
  };

  /**
   * Login user
   */
  const login = useCallback(
    async (credentials: {
      email: string;
      password: string;
      rememberMe?: boolean;
    }): Promise<boolean> => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));

        const result = await authService.login(
          credentials.email,
          credentials.password,
          credentials.rememberMe || false
        );

        if (result.success && result.user) {
          setState({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            sessionExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
          });

          // Schedule token refresh
          authService.scheduleTokenRefresh(handleTokenRefresh);

          toast.success(result.message || 'Login successful!');
          return true;
        } else {
          toast.error(result.message || 'Login failed. Please check your credentials.');
          setState(prev => ({ ...prev, isLoading: false }));
          return false;
        }
      } catch (error) {
        toast.error('Login failed. Please try again.');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }
    },
    []
  );

  /**
   * Register new user
   */
  const register = useCallback(
    async (userData: {
      email: string;
      password: string;
      passwordConfirm: string;
      firstName: string;
      lastName: string;
      role?: string;
    }): Promise<boolean> => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));

        const result = await authService.register(userData);

        if (result.success && result.user) {
          setState({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            sessionExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
          });

          // Schedule token refresh
          authService.scheduleTokenRefresh(handleTokenRefresh);

          toast.success(result.message || 'Registration successful!');
          return true;
        } else {
          toast.error(result.message || 'Registration failed.');
          setState(prev => ({ ...prev, isLoading: false }));
          return false;
        }
      } catch (error) {
        toast.error('Registration failed. Please try again.');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }
    },
    []
  );

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        sessionExpiresAt: null,
      });

      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      // Force logout even if API call fails
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        sessionExpiresAt: null,
      });
      router.push('/');
    }
  }, [router]);

  /**
   * Logout from all sessions
   */
  const logoutAll = useCallback(async (): Promise<void> => {
    try {
      await authService.logoutAll();

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        sessionExpiresAt: null,
      });

      toast.success('Logged out from all devices');
      router.push('/');
    } catch (error) {
      toast.error('Failed to logout from all devices');
    }
  }, [router]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: Partial<User>): Promise<boolean> => {
    try {
      const result = await authService.updateProfile(data);

      if (result.success && result.user) {
        setState(prev => ({
          ...prev,
          user: result.user!,
        }));

        toast.success(result.message || 'Profile updated successfully');
        return true;
      } else {
        toast.error(result.message || 'Profile update failed');
        return false;
      }
    } catch (error) {
      toast.error('Failed to update profile');
      return false;
    }
  }, []);

  /**
   * Change password
   */
  const changePassword = useCallback(
    async (data: {
      currentPassword: string;
      newPassword: string;
      newPasswordConfirm: string;
    }): Promise<boolean> => {
      try {
        // Client-side validation
        if (data.newPassword !== data.newPasswordConfirm) {
          toast.error('Passwords do not match');
          return false;
        }

        if (data.newPassword.length < 8) {
          toast.error('Password must be at least 8 characters long');
          return false;
        }

        const result = await authService.changePassword(data);

        if (result.success) {
          toast.success(result.message || 'Password changed successfully');
          return true;
        } else {
          toast.error(result.message || 'Password change failed');
          return false;
        }
      } catch (error) {
        toast.error('Failed to change password');
        return false;
      }
    },
    []
  );

  /**
   * Refresh user profile from server
   */
  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const result = await authService.getCurrentUser();

      if (result.success && result.user) {
        setState(prev => ({
          ...prev,
          user: result.user!,
        }));
      }
    } catch (error) {
      // Error handled silently
    }
  }, []);

  /**
   * Check authentication status
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const result = await authService.getCurrentUser();

      if (result.success && result.user) {
        setState(prev => ({
          ...prev,
          user: result.user!,
          isAuthenticated: true,
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
        }));
        return false;
      }
    } catch (error) {
      return false;
    }
  }, []);

  /**
   * Request password reset
   */
  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      const result = await authService.forgotPassword(email);

      if (result.success) {
        toast.success(result.message || 'Password reset instructions sent to your email');
        return true;
      } else {
        toast.error(result.message || 'Password reset request failed');
        return false;
      }
    } catch (error) {
      toast.error('Failed to request password reset');
      return false;
    }
  }, []);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(
    async (token: string, password: string, passwordConfirm: string): Promise<boolean> => {
      try {
        if (password !== passwordConfirm) {
          toast.error('Passwords do not match');
          return false;
        }

        if (password.length < 8) {
          toast.error('Password must be at least 8 characters long');
          return false;
        }

        const result = await authService.resetPassword(token, password, passwordConfirm);

        if (result.success) {
          toast.success(result.message || 'Password reset successful');
          return true;
        } else {
          toast.error(result.message || 'Password reset failed');
          return false;
        }
      } catch (error) {
        toast.error('Failed to reset password');
        return false;
      }
    },
    []
  );

  /**
   * Check if user has specific role(s)
   */
  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!state.user) return false;

      const userRole = state.user.role;
      if (Array.isArray(role)) {
        return role.includes(userRole);
      }
      return userRole === role;
    },
    [state.user]
  );

  /**
   * Check if user has specific permission(s)
   */
  const hasPermission = useCallback(
    (permission: Permission | Permission[]): boolean => {
      if (!state.user || !state.user.permissions) return false;

      const userPermissions = state.user.permissions;
      if (Array.isArray(permission)) {
        return permission.some(p => userPermissions.includes(p));
      }
      return userPermissions.includes(permission);
    },
    [state.user]
  );

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    logoutAll,
    updateProfile,
    changePassword,
    refreshProfile,
    checkAuth,
    forgotPassword,
    resetPassword,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a ProductionAuthProvider');
  }
  return context;
}

/**
 * Higher-order component for protected routes
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, isInitialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (isInitialized && !isLoading && !isAuthenticated) {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
        router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      }
    }, [isAuthenticated, isLoading, isInitialized, router]);

    if (!isInitialized || isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Hook for role-based access control
 */
export function useRoleGuard(allowedRoles: UserRole | UserRole[]) {
  const { hasRole, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasRole(allowedRoles)) {
      toast.error('Access denied. Insufficient permissions.');
      router.push('/dashboard');
    }
  }, [hasRole, allowedRoles, isAuthenticated, isLoading, router]);

  return {
    hasAccess: hasRole(allowedRoles),
    isLoading,
  };
}

/**
 * Hook for permission-based access control
 */
export function usePermissionGuard(requiredPermissions: Permission | Permission[]) {
  const { hasPermission, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasPermission(requiredPermissions)) {
      toast.error('Access denied. Insufficient permissions.');
      router.push('/dashboard');
    }
  }, [hasPermission, requiredPermissions, isAuthenticated, isLoading, router]);

  return {
    hasAccess: hasPermission(requiredPermissions),
    isLoading,
  };
}

export default AuthContext;
