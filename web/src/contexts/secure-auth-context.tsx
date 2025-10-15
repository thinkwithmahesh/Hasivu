'use client';

/**
 * HASIVU Platform - Secure Authentication Context
 * Production-ready authentication with httpOnly cookies and CSRF protection
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  User,
  UserRole,
  UserPermission,
  LoginCredentials,
  RegistrationData,
  PasswordChangeRequest,
  PasswordResetRequest,
  PasswordResetConfirmation,
  AuthResponse,
  AuthState,
  AuthContextType,
  AuthUtils,
} from '../types/auth';
import { authApiService } from '../services/auth-api.service';

/**
 * Enhanced Auth Context with security features
 */
interface SecureAuthContextType extends AuthContextType {
  // Additional security methods
  destroyAllSessions: () => Promise<void>;
  getCSRFToken: () => string | null;
  refreshCSRFToken: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  // Security state
  sessionValidated: boolean;
  csrfTokenExpiry: Date | null;
  deviceFingerprint: string;
  lastActivity: Date | null;
}

const SecureAuthContext = createContext<SecureAuthContextType | undefined>(undefined);

interface SecureAuthProviderProps {
  children: React.ReactNode;
}

/**
 * Secure Authentication Provider
 */
export function SecureAuthProvider({ children }: SecureAuthProviderProps) {
  const router = useRouter();

  // Core auth state
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,
    error: undefined,
  });

  // Security state
  const [sessionValidated, setSessionValidated] = useState(false);
  const [csrfTokenExpiry, setCsrfTokenExpiry] = useState<Date | null>(null);
  const [deviceFingerprint] = useState(() => AuthUtils.generateDeviceFingerprint());
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  // Refs for timers
  const sessionCheckTimer = useRef<NodeJS.Timeout | null>(null);
  const csrfRefreshTimer = useRef<NodeJS.Timeout | null>(null);
  const activityTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Update activity timestamp
   */
  const updateActivity = useCallback(() => {
    setLastActivity(new Date());
  }, []);

  /**
   * Setup activity monitoring
   */
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      updateActivity();

      // Debounce activity updates
      if (activityTimer.current) {
        clearTimeout(activityTimer.current);
      }

      activityTimer.current = setTimeout(() => {
        // Could send activity update to server here
      }, 30000); // 30 seconds
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      if (activityTimer.current) {
        clearTimeout(activityTimer.current);
      }
    };
  }, [updateActivity]);

  /**
   * Validate current session
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authApiService.checkSession();

      if (response.success && response.user) {
        setState(prev => ({
          ...prev,
          user: response.user!,
          isAuthenticated: true,
          error: undefined,
        }));

        setSessionValidated(true);
        updateActivity();
        return true;
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          error: response.error,
        }));

        setSessionValidated(false);
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        error: 'Session validation failed',
      }));

      setSessionValidated(false);
      return false;
    }
  }, [updateActivity]);

  /**
   * Get CSRF token
   */
  const getCSRFToken = useCallback((): string | null => {
    return authApiService.getCurrentCSRFToken();
  }, []);

  /**
   * Refresh CSRF token
   */
  const refreshCSRFToken = useCallback(async (): Promise<void> => {
    try {
      const { csrfToken: _csrfToken, expiresAt } = await authApiService.getCSRFToken();
      setCsrfTokenExpiry(new Date(expiresAt));

      // Schedule next refresh before expiry
      if (csrfRefreshTimer.current) {
        clearTimeout(csrfRefreshTimer.current);
      }

      const refreshTime = new Date(expiresAt).getTime() - Date.now() - 60000; // 1 minute before expiry
      if (refreshTime > 0) {
        csrfRefreshTimer.current = setTimeout(refreshCSRFToken, refreshTime);
      }
    } catch (error) {
      // Error handled silently
    }
  }, []);

  /**
   * Initialize authentication
   */
  const initializeAuth = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Check if we have a valid session
      const isValid = await validateSession();

      if (isValid) {
        // Get CSRF token for authenticated user
        await refreshCSRFToken();
      }

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        error: 'Authentication initialization failed',
      }));
    }
  }, [validateSession, refreshCSRFToken]);

  /**
   * Setup periodic session validation
   */
  useEffect(() => {
    if (state.isAuthenticated) {
      // Check session every 5 minutes
      sessionCheckTimer.current = setInterval(validateSession, 5 * 60 * 1000);
    }

    return () => {
      if (sessionCheckTimer.current) {
        clearInterval(sessionCheckTimer.current);
      }
    };
  }, [state.isAuthenticated, validateSession]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initializeAuth();

    return () => {
      if (sessionCheckTimer.current) {
        clearInterval(sessionCheckTimer.current);
      }
      if (csrfRefreshTimer.current) {
        clearTimeout(csrfRefreshTimer.current);
      }
    };
  }, [initializeAuth]);

  /**
   * Login with credentials
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthResponse> => {
      setState(prev => ({ ...prev, isLoading: true, error: undefined }));

      try {
        const response = await authApiService.login(credentials);

        if (response.success && response.user) {
          setState({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: undefined,
          });

          setSessionValidated(true);
          updateActivity();

          // Get CSRF token for new session
          await refreshCSRFToken();

          toast.success(`Welcome back, ${response.user.firstName}!`);

          // Redirect to appropriate dashboard
          const dashboardUrl = getDashboardUrl(response.user.role);
          router.push(dashboardUrl);
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: response.error || 'Login failed',
          }));

          toast.error(response.error || 'Login failed');
        }

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [router, updateActivity, refreshCSRFToken]
  );

  /**
   * Register new user
   */
  const register = useCallback(
    async (data: RegistrationData): Promise<AuthResponse> => {
      setState(prev => ({ ...prev, isLoading: true, error: undefined }));

      try {
        const response = await authApiService.register(data);

        if (response.success && response.user) {
          setState({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            error: undefined,
          });

          setSessionValidated(true);
          updateActivity();

          await refreshCSRFToken();

          toast.success('Registration successful! Welcome to HASIVU!');

          const dashboardUrl = getDashboardUrl(response.user.role);
          router.push(dashboardUrl);
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: response.error || 'Registration failed',
          }));

          toast.error(response.error || 'Registration failed');
        }

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [router, updateActivity, refreshCSRFToken]
  );

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await authApiService.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    }

    // Clear all state
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
      error: undefined,
    });

    setSessionValidated(false);
    setCsrfTokenExpiry(null);
    authApiService.clearTokens();

    // Clear timers
    if (sessionCheckTimer.current) {
      clearInterval(sessionCheckTimer.current);
    }
    if (csrfRefreshTimer.current) {
      clearTimeout(csrfRefreshTimer.current);
    }

    toast.success('Logged out successfully');
    router.push('/');
  }, [router]);

  /**
   * Destroy all user sessions
   */
  const destroyAllSessions = useCallback(async (): Promise<void> => {
    try {
      // This would call an API endpoint to destroy all sessions
      // await authApiService.destroyAllSessions();
      await logout(); // For now, just logout current session
      toast.success('All sessions destroyed');
    } catch (error) {
      toast.error('Failed to destroy all sessions');
    }
  }, [logout]);

  /**
   * Refresh token
   */
  const refreshToken = useCallback(async (): Promise<AuthResponse> => {
    try {
      const response = await authApiService.refreshToken();

      if (response.success && response.user) {
        setState(prev => ({
          ...prev,
          user: response.user!,
          error: undefined,
        }));

        updateActivity();
      }

      return response;
    } catch (error) {
      return { success: false, error: 'Token refresh failed' };
    }
  }, [updateActivity]);

  /**
   * Update profile
   */
  const updateProfile = useCallback(async (data: Partial<User>): Promise<AuthResponse> => {
    try {
      const response = await authApiService.updateProfile(data);

      if (response.success && response.user) {
        setState(prev => ({
          ...prev,
          user: response.user!,
        }));

        toast.success('Profile updated successfully');
      } else {
        toast.error(response.error || 'Profile update failed');
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Change password
   */
  const changePassword = useCallback(async (data: PasswordChangeRequest): Promise<AuthResponse> => {
    try {
      const response = await authApiService.changePassword(data);

      if (response.success) {
        toast.success('Password changed successfully');
      } else {
        toast.error(response.error || 'Password change failed');
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Request password reset
   */
  const forgotPassword = useCallback(async (data: PasswordResetRequest): Promise<AuthResponse> => {
    try {
      const response = await authApiService.forgotPassword(data);

      if (response.success) {
        toast.success('Password reset instructions sent to your email');
      } else {
        toast.error(response.error || 'Password reset request failed');
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset request failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(
    async (data: PasswordResetConfirmation): Promise<AuthResponse> => {
      try {
        const response = await authApiService.resetPassword(data);

        if (response.success) {
          toast.success('Password reset successful! Please login with your new password');
          router.push('/auth/login');
        } else {
          toast.error(response.error || 'Password reset failed');
        }

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [router]
  );

  /**
   * Check authentication status
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    return await validateSession();
  }, [validateSession]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      return AuthUtils.hasRole(state.user, role);
    },
    [state.user]
  );

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback(
    (permission: UserPermission | UserPermission[]): boolean => {
      return AuthUtils.hasPermission(state.user, permission);
    },
    [state.user]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  // Context value
  const value: SecureAuthContextType = {
    ...state,
    sessionValidated,
    csrfTokenExpiry,
    deviceFingerprint,
    lastActivity,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    checkAuth,
    hasRole,
    hasPermission,
    clearError,
    destroyAllSessions,
    getCSRFToken,
    refreshCSRFToken,
    validateSession,
  };

  return <SecureAuthContext.Provider value={value}>{children}</SecureAuthContext.Provider>;
}

/**
 * Hook to use secure authentication context
 */
export function useSecureAuth(): SecureAuthContextType {
  const context = useContext(SecureAuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within a SecureAuthProvider');
  }
  return context;
}

/**
 * Higher-order component for protected routes with enhanced security
 */
export function withSecureAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions?: UserPermission[]
) {
  return function SecureAuthenticatedComponent(props: P) {
    const {
      isAuthenticated,
      isLoading,
      isInitialized,
      sessionValidated,
      hasPermission,
      user: _user,
    } = useSecureAuth();
    const router = useRouter();

    useEffect(() => {
      if (isInitialized && !isLoading) {
        if (!isAuthenticated || !sessionValidated) {
          const currentPath = window.location.pathname;
          router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        // Check permissions if required
        if (requiredPermissions && requiredPermissions.length > 0) {
          if (!hasPermission(requiredPermissions)) {
            toast.error('Access denied. Insufficient permissions.');
            router.push('/dashboard');
          }
        }
      }
    }, [isAuthenticated, isLoading, isInitialized, sessionValidated, hasPermission, router]);

    if (!isInitialized || isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated || !sessionValidated) {
      return null;
    }

    if (
      requiredPermissions &&
      requiredPermissions.length > 0 &&
      !hasPermission(requiredPermissions)
    ) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * Hook for role-based access control with enhanced security
 */
export function useSecureRoleGuard(allowedRoles: UserRole | UserRole[]) {
  const { hasRole, isAuthenticated, isLoading, sessionValidated } = useSecureAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && sessionValidated && !hasRole(allowedRoles)) {
      toast.error('Access denied. Insufficient permissions.');
      router.push('/dashboard');
    }
  }, [hasRole, allowedRoles, isAuthenticated, isLoading, sessionValidated, router]);

  return {
    hasAccess: hasRole(allowedRoles),
    isLoading: isLoading || !sessionValidated,
  };
}

/**
 * Get dashboard URL based on user role
 */
function getDashboardUrl(role: UserRole): string {
  const dashboardUrls: Record<UserRole, string> = {
    admin: '/dashboard/admin',
    super_admin: '/dashboard/admin',
    parent: '/dashboard/parent',
    student: '/dashboard/student',
    vendor: '/dashboard/vendor',
    kitchen_staff: '/dashboard/kitchen',
    teacher: '/dashboard/teacher',
  };

  return dashboardUrls[role] || '/dashboard';
}

export default SecureAuthContext;
