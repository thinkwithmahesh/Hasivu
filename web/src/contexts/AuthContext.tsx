'use client';

/**
 * HASIVU Platform - Authentication Context Provider
 * Wraps Redux auth state with React Context for easy access
 * Handles token refresh, session management, and auth methods
 */

import React, { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  loginUser, 
  logoutUser, 
  refreshToken, 
  clearError, 
  updateLastActivity, 
  updateUserProfile,
  clearAuth,
  getCurrentUser
} from '@/store/slices/authSlice';

// Import UserRole from constants for consistency
import { UserRole } from '@/utils/constants';

// User types definition
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };
  dietary: {
    restrictions: string[];
    allergies: string[];
    preferences: string[];
  };
}

// Login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
}

// Auth context interface
export interface AuthContextType {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: number;

  // Auth methods
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  
  // User methods
  updateProfile: (updates: Partial<User>) => void;
  clearAuthError: () => void;
  updateActivity: () => void;
  
  // Utility methods
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isSessionValid: () => boolean;
  getTimeUntilExpiry: () => number;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  schoolId?: string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout configuration (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;
const REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh 5 minutes before expiry

/**
 * Auth Provider Component
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  // Get auth state from Redux
  const { 
    user, 
    token, 
    refreshToken: refreshTokenValue, 
    isAuthenticated, 
    isLoading, 
    error, 
    lastActivity 
  } = useAppSelector((state) => state.auth);

  /**
   * Login method
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    try {
      await dispatch(loginUser(credentials)).unwrap();
      toast.success('Login successful!');
      
      // Redirect based on user role
      const redirectPath = getRedirectPath(user?.role);
      router.push(redirectPath);
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [dispatch, router, user?.role]);

  /**
   * Logout method
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully');
      router.push('/auth/login');
    } catch (error: any) {
      // Even if API call fails, clear local auth state
      dispatch(clearAuth());
      router.push('/auth/login');
      console.error('Logout error:', error);
    }
  }, [dispatch, router]);

  /**
   * Register method
   */
  const register = useCallback(async (userData: RegisterData): Promise<void> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const result = await response.json();
      toast.success('Registration successful! Please verify your email.');
      
      // Optionally auto-login after registration
      if (result.autoLogin) {
        await login({ email: userData.email, password: userData.password });
      } else {
        router.push('/auth/login');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [login, router]);

  /**
   * Refresh access token
   */
  const refreshAccessToken = useCallback(async (): Promise<void> => {
    try {
      await dispatch(refreshToken()).unwrap();
      dispatch(updateLastActivity());
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  }, [dispatch, logout]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback((updates: Partial<User>) => {
    dispatch(updateUserProfile(updates));
  }, [dispatch]);

  /**
   * Clear auth error
   */
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * Update last activity timestamp
   */
  const updateActivity = useCallback(() => {
    dispatch(updateLastActivity());
  }, [dispatch]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user?.role]);

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  /**
   * Check if session is still valid
   */
  const isSessionValid = useCallback((): boolean => {
    if (!isAuthenticated || !token || !lastActivity) return false;
    const timeSinceActivity = Date.now() - lastActivity;
    return timeSinceActivity < SESSION_TIMEOUT;
  }, [isAuthenticated, token, lastActivity]);

  /**
   * Get time until session expiry in milliseconds
   */
  const getTimeUntilExpiry = useCallback((): number => {
    if (!lastActivity) return 0;
    const expiry = lastActivity + SESSION_TIMEOUT;
    return Math.max(0, expiry - Date.now());
  }, [lastActivity]);

  /**
   * Get redirect path based on user role
   */
  const getRedirectPath = (role?: UserRole): string => {
    switch (role) {
      case 'student':
        return '/student/dashboard';
      case 'parent':
        return '/parent/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'admin':
      case 'school_admin':
        return '/admin/dashboard';
      case 'vendor':
        return '/kitchen/dashboard';
      case 'delivery_partner':
        return '/delivery/dashboard';
      default:
        return '/dashboard';
    }
  };

  /**
   * Auto token refresh effect
   */
  useEffect(() => {
    if (!isAuthenticated || !token || !refreshTokenValue) return;

    const timeUntilExpiry = getTimeUntilExpiry();
    
    // If session is expired, logout
    if (timeUntilExpiry <= 0) {
      logout();
      return;
    }

    // Set up auto-refresh timer
    const refreshTime = Math.max(1000, timeUntilExpiry - REFRESH_THRESHOLD);
    const refreshTimer = setTimeout(() => {
      refreshAccessToken();
    }, refreshTime);

    return () => clearTimeout(refreshTimer);
  }, [isAuthenticated, token, refreshTokenValue, getTimeUntilExpiry, logout, refreshAccessToken]);

  /**
   * Activity tracking effect
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUserActivity = () => {
      updateActivity();
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isAuthenticated, updateActivity]);

  /**
   * Route protection effect
   * Note: Using window.location.pathname for Next.js App Router compatibility
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/', '/about', '/contact'];
    const currentPath = window.location.pathname;
    
    // Redirect authenticated users away from auth pages
    if (isAuthenticated && currentPath.startsWith('/auth/')) {
      const redirectPath = getRedirectPath(user?.role);
      router.replace(redirectPath);
    }
    
    // Redirect unauthenticated users to login (except for public routes)
    if (!isAuthenticated && !publicRoutes.includes(currentPath) && !currentPath.startsWith('/auth/')) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, user?.role, router]);

  /**
   * Error handling effect
   */
  useEffect(() => {
    if (error) {
      toast.error(error);
      // Auto-clear error after showing
      const timer = setTimeout(() => {
        clearAuthError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, clearAuthError]);

  // Context value
  const contextValue: AuthContextType = {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    lastActivity,

    // Auth methods
    login,
    logout,
    register,
    refreshAccessToken,

    // User methods
    updateProfile,
    clearAuthError,
    updateActivity,

    // Utility methods
    hasRole,
    hasAnyRole,
    isSessionValid,
    getTimeUntilExpiry,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use Auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper hooks
export const useUser = () => {
  const { user } = useAuth();
  return user;
};

export const useAuthStatus = () => {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
};

export const useAuthActions = () => {
  const { login, logout, register, refreshAccessToken } = useAuth();
  return { login, logout, register, refreshAccessToken };
};

export default AuthContext;