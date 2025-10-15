'use client';

/**
 * HASIVU Platform - Production Authentication Context
 * With Real API Integration and Token Management
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { AuthApiService } from '@/services/auth-api.service';

// Simple user type for demo
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Simple credentials types
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (userData: RegistrationData) => Promise<boolean>;
  logout: () => Promise<void>;
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
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start as loading
    isInitialized: false, // Not initialized until auth check completes
  });

  const router = useRouter();
  const authApi = new AuthApiService();

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const result = await authApi.checkAuth();

        if (result.authenticated && result.user) {
          setState({
            user: result.user as User,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
        } else {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
        }
      } catch (error) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
      }
    };

    initAuth();
  }, []);

  // Real API login method
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Call real API
      const response = await authApi.login(credentials);

      if (response.success && response.user) {
        setState({
          user: response.user as User,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });

        toast.success(`Welcome back, ${response.user.firstName}!`);
        return true;
      } else {
        toast.error(response.error || 'Login failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Real API register method
  const register = useCallback(async (userData: RegistrationData): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Call real API
      const response = await authApi.register({
        ...userData,
        passwordConfirm: userData.password, // Assuming password confirm is same
      });

      if (response.success && response.user) {
        setState({
          user: response.user as User,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });

        toast.success(`Welcome, ${response.user.firstName}!`);
        return true;
      } else {
        toast.error(response.error || 'Registration failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(errorMessage);
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Real API logout method
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });

      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      // Still clear local state even if API call fails
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
      toast.success('Logged out');
      router.push('/');
    }
  }, [router]);

  // Real API update profile method
  const updateProfile = useCallback(
    async (data: Partial<User>): Promise<boolean> => {
      if (!state.user) {
        toast.error('You must be logged in');
        return false;
      }

      try {
        const response = await authApi.updateProfile(data);

        if (response.success && response.user) {
          setState(prev => ({
            ...prev,
            user: response.user as User,
          }));
          toast.success('Profile updated successfully');
          return true;
        } else {
          toast.error(response.error || 'Profile update failed');
          return false;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Update failed';
        toast.error(errorMessage);
        return false;
      }
    },
    [state.user]
  );

  // Real API change password method
  const changePassword = useCallback(
    async (data: {
      currentPassword: string;
      newPassword: string;
      newPasswordConfirm: string;
    }): Promise<boolean> => {
      // Validate passwords match
      if (data.newPassword !== data.newPasswordConfirm) {
        toast.error('Passwords do not match');
        return false;
      }

      try {
        const response = await authApi.changePassword(data);

        if (response.success) {
          toast.success('Password changed successfully');
          return true;
        } else {
          toast.error(response.error || 'Password change failed');
          return false;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Password change failed';
        toast.error(errorMessage);
        return false;
      }
    },
    []
  );

  // Real API refresh profile method
  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const user = await authApi.getProfile();
      if (user) {
        setState(prev => ({
          ...prev,
          user: user as User,
        }));
      }
    } catch (error) {
      // Error handled silently
    }
  }, []);

  // Real API check auth method
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const result = await authApi.checkAuth();

      if (result.authenticated && result.user) {
        setState(prev => ({
          ...prev,
          user: result.user as User,
          isAuthenticated: true,
        }));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, []);

  // Real API forgot password method
  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      const response = await authApi.forgotPassword(email);

      if (response.success) {
        toast.success('Password reset instructions sent to your email');
        return true;
      } else {
        toast.error(response.error || 'Request failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  // Real API reset password method
  const resetPassword = useCallback(
    async (token: string, password: string, passwordConfirm: string): Promise<boolean> => {
      if (password !== passwordConfirm) {
        toast.error('Passwords do not match');
        return false;
      }

      try {
        const response = await authApi.resetPassword(token, password, passwordConfirm);

        if (response.success) {
          toast.success('Password reset successful');
          return true;
        } else {
          toast.error(response.error || 'Password reset failed');
          return false;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Reset failed';
        toast.error(errorMessage);
        return false;
      }
    },
    []
  );

  const hasRole = useCallback(
    (role: string | string[]): boolean => {
      if (!state.user) return false;

      const userRole = state.user.role;
      if (Array.isArray(role)) {
        return role.includes(userRole);
      }
      return userRole === role;
    },
    [state.user]
  );

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshProfile,
    checkAuth,
    forgotPassword,
    resetPassword,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to get dashboard URL based on role
function _getDashboardUrl(role: string): string {
  const dashboardUrls: Record<string, string> = {
    admin: '/dashboard/admin',
    teacher: '/dashboard/teacher',
    parent: '/dashboard/parent',
    student: '/dashboard/student',
    vendor: '/dashboard/vendor',
    kitchen_staff: '/dashboard/kitchen',
  };

  return dashboardUrls[role] || '/dashboard';
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, isInitialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (isInitialized && !isLoading && !isAuthenticated) {
        const currentPath = router.asPath;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      }
    }, [isAuthenticated, isLoading, isInitialized, router]);

    if (!isInitialized || isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Hook for role-based access control
export function useRoleGuard(allowedRoles: string | string[]) {
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

export default AuthContext;
