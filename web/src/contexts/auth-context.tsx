'use client';

/**
 * HASIVU Platform - Simplified Authentication Context for Demo
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

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
    isLoading: false,
    isInitialized: true,
  });

  const router = useRouter();

  // Simple demo user for development
  const demoUser: User = {
    id: 'demo-user-1',
    email: 'admin@hasivu.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  };

  // Simple login method for demo
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo authentication - accept any email/password
      if (credentials.email && credentials.password) {
        setState({
          user: demoUser,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
        
        // Store demo token
        if (typeof window !== 'undefined') {
          localStorage.setItem('demoToken', 'demo-token-123');
        }
        
        toast.success('Login successful!');
        return true;
      }
      
      toast.error('Please enter email and password');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const register = useCallback(async (userData: RegistrationData): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo registration
      const newUser: User = {
        id: 'demo-user-' + Date.now(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'student'
      };
      
      setState({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
      
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed');
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    });
    
    // Clear demo token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demoToken');
    }
    
    toast.success('Logged out successfully');
    router.push('/');
  }, [router]);

  // Simple demo methods
  const updateProfile = useCallback(async (data: Partial<User>): Promise<boolean> => {
    if (state.user) {
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...data } : null
      }));
      toast.success('Profile updated successfully');
      return true;
    }
    return false;
  }, [state.user]);

  const changePassword = useCallback(async (data: {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
  }): Promise<boolean> => {
    // Simple validation
    if (data.newPassword !== data.newPasswordConfirm) {
      toast.error('Passwords do not match');
      return false;
    }
    toast.success('Password changed successfully');
    return true;
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    // Demo: do nothing
  }, []);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    // Check if demo token exists
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('demoToken');
      if (token) {
        setState(prev => ({
          ...prev,
          user: demoUser,
          isAuthenticated: true,
        }));
        return true;
      }
    }
    return false;
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    toast.success('Password reset instructions sent to your email');
    return true;
  }, []);

  const resetPassword = useCallback(async (
    token: string, 
    password: string, 
    passwordConfirm: string
  ): Promise<boolean> => {
    if (password !== passwordConfirm) {
      toast.error('Passwords do not match');
      return false;
    }
    toast.success('Password reset successful');
    return true;
  }, []);

  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!state.user) return false;
    
    const userRole = state.user.role;
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    return userRole === role;
  }, [state.user]);

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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to get dashboard URL based on role
function getDashboardUrl(role: string): string {
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
