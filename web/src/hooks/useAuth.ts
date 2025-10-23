'use client';

import { useState, useEffect } from 'react';
import apiClient, { User, AuthResponse as AuthResponse } from '@/lib/api-client';
import { EnhancedLoginFormData, RegistrationFormData } from '@/components/auth/schemas';

interface UseAuthReturn {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (credentials: EnhancedLoginFormData) => Promise<{ success: boolean; message?: string }>;
  register: (userData: RegistrationFormData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(user);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Check if we have a token
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Verify the token and get current user
      const response = await apiClient.getCurrentUser();

      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setError(null);
      } else {
        // Token might be invalid, try to refresh
        const refreshResponse = await apiClient.refreshToken();

        if (refreshResponse.success) {
          // Try to get user again after refresh
          const userResponse = await apiClient.getCurrentUser();
          if (userResponse.success && userResponse.data?.user) {
            setUser(userResponse.data.user);
            setError(null);
          }
        } else {
          // Refresh failed, clear tokens
          apiClient.clearToken();
          setUser(null);
        }
      }
    } catch (error) {
      apiClient.clearToken();
      setUser(null);
      setError('Authentication initialization failed');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    credentials: EnhancedLoginFormData
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.login(credentials);

      if (response.success && response.user) {
        setUser(response.user);
        setError(null);

        return { success: true, message: response.message };
      } else {
        const errorMessage = response.error || response.message || 'Login failed';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    userData: RegistrationFormData
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.register(userData);

      if (response.success) {
        // Registration successful - typically user needs to verify email
        return { success: true, message: response.message || 'Registration successful' };
      } else {
        const errorMessage = response.error || response.message || 'Registration failed';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Call API logout
      await apiClient.logout();
    } catch (error) {
    } finally {
      // Always clear local state regardless of API response
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!isAuthenticated) return;

    try {
      const response = await apiClient.getCurrentUser();

      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setError(null);
      } else {
        // If getting current user fails, try refresh token
        const refreshResponse = await apiClient.refreshToken();

        if (refreshResponse.success) {
          const userResponse = await apiClient.getCurrentUser();
          if (userResponse.success && userResponse.data?.user) {
            setUser(userResponse.data.user);
            setError(null);
          }
        } else {
          // Refresh failed, user needs to login again
          await logout();
        }
      }
    } catch (error) {
      setError('Session expired. Please login again.');
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Auto-refresh user data periodically (every 15 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(
      () => {
        refreshUser();
      },
      15 * 60 * 1000
    ); // 15 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return {
    // State
    user,
    isLoading,
    isAuthenticated,
    error,

    // Actions
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };
}

export default useAuth;
