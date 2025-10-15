/**
 * HASIVU Platform - useAuth Hook Tests
 * Tests for custom authentication hook
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAuth } from '../useAuth';
import authReducer from '@/store/slices/authSlice';

// Mock dependencies
jest.mock('@/lib/api-client', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  getCurrentUser: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useAuth Hook', () => {
  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastActivity: Date.now(),
          ...initialState,
        },
      },
    });
  };

  const wrapper = ({
    children,
    storeState = {},
  }: {
    children: React.ReactNode;
    storeState?: any;
  }) => {
    const store = createMockStore(storeState);
    return <Provider store={store}>{children}</Provider>;
  };

  describe('Hook State', () => {
    test('should return initial unauthenticated state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastActivity).toEqual(expect.any(Number));
    });

    test('should return authenticated state when user is logged in', () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@hasivu.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const authenticatedState = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        isAuthenticated: true,
        lastActivity: Date.now(),
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, storeState: authenticatedState }),
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe('test-token');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('should return loading state', () => {
      const loadingState = {
        isLoading: true,
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, storeState: loadingState }),
      });

      expect(result.current.isLoading).toBe(true);
    });

    test('should return error state', () => {
      const errorState = {
        error: 'Authentication failed',
        isLoading: false,
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, storeState: errorState }),
      });

      expect(result.current.error).toBe('Authentication failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Authentication Methods', () => {
    test('should provide login method', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.login).toBe('function');
    });

    test('should provide logout method', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.logout).toBe('function');
    });

    test('should provide register method', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.register).toBe('function');
    });

    test('should provide refreshAccessToken method', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.refreshAccessToken).toBe('function');
    });

    test('should call login with correct parameters', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const credentials = {
        email: 'test@hasivu.com',
        password: 'password123',
      };

      // Since we're testing the hook interface, not the actual implementation
      expect(() => {
        result.current.login(credentials);
      }).not.toThrow();
    });

    test('should call logout without parameters', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(() => {
        result.current.logout();
      }).not.toThrow();
    });

    test('should call register with user data', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const userData = {
        email: 'test@hasivu.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'student' as const,
      };

      expect(() => {
        result.current.register(userData);
      }).not.toThrow();
    });
  });

  describe('User Management Methods', () => {
    test('should provide updateProfile method', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.updateProfile).toBe('function');
    });

    test('should provide clearAuthError method', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.clearAuthError).toBe('function');
    });

    test('should provide updateActivity method', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.updateActivity).toBe('function');
    });

    test('should call updateProfile with partial user data', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const updates = {
        firstName: 'Updated',
        phone: '+919876543210',
      };

      expect(() => {
        result.current.updateProfile(updates);
      }).not.toThrow();
    });

    test('should call clearAuthError without parameters', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(() => {
        result.current.clearAuthError();
      }).not.toThrow();
    });

    test('should call updateActivity without parameters', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(() => {
        result.current.updateActivity();
      }).not.toThrow();
    });
  });

  describe('Utility Methods', () => {
    test('should provide hasRole method', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.hasRole).toBe('function');
    });

    test('should provide hasAnyRole method', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.hasAnyRole).toBe('function');
    });

    test('should provide isSessionValid method', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.isSessionValid).toBe('function');
    });

    test('should provide getTimeUntilExpiry method', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.getTimeUntilExpiry).toBe('function');
    });

    test('should check role correctly with authenticated user', () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@hasivu.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const authenticatedState = {
        user: mockUser,
        isAuthenticated: true,
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, storeState: authenticatedState }),
      });

      expect(result.current.hasRole('student')).toBe(true);
      expect(result.current.hasRole('admin')).toBe(false);
    });

    test('should check multiple roles correctly', () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@hasivu.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const authenticatedState = {
        user: mockUser,
        isAuthenticated: true,
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, storeState: authenticatedState }),
      });

      expect(result.current.hasAnyRole(['admin', 'student'])).toBe(true);
      expect(result.current.hasAnyRole(['admin', 'vendor'])).toBe(false);
    });

    test('should validate session correctly', () => {
      const recentActivity = Date.now() - 10000; // 10 seconds ago
      const authenticatedState = {
        user: { id: 'test-id', role: 'student' },
        token: 'test-token',
        isAuthenticated: true,
        lastActivity: recentActivity,
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, storeState: authenticatedState }),
      });

      expect(result.current.isSessionValid()).toBe(true);
    });

    test('should invalidate expired session', () => {
      const expiredActivity = Date.now() - 35 * 60 * 1000; // 35 minutes ago
      const expiredState = {
        user: { id: 'test-id', role: 'student' },
        token: 'test-token',
        isAuthenticated: true,
        lastActivity: expiredActivity,
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, storeState: expiredState }),
      });

      expect(result.current.isSessionValid()).toBe(false);
    });

    test('should return correct time until expiry', () => {
      const recentActivity = Date.now() - 10000; // 10 seconds ago
      const authenticatedState = {
        user: { id: 'test-id', role: 'student' },
        token: 'test-token',
        isAuthenticated: true,
        lastActivity: recentActivity,
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, storeState: authenticatedState }),
      });

      const timeUntilExpiry = result.current.getTimeUntilExpiry();
      expect(timeUntilExpiry).toBeGreaterThan(0);
      expect(timeUntilExpiry).toBeLessThan(30 * 60 * 1000); // Less than 30 minutes
    });
  });

  describe('Hook Stability', () => {
    test('should maintain reference equality for methods', () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      const initialMethods = {
        login: result.current.login,
        logout: result.current.logout,
        register: result.current.register,
        updateProfile: result.current.updateProfile,
      };

      rerender();

      expect(result.current.login).toBe(initialMethods.login);
      expect(result.current.logout).toBe(initialMethods.logout);
      expect(result.current.register).toBe(initialMethods.register);
      expect(result.current.updateProfile).toBe(initialMethods.updateProfile);
    });

    test('should update state when store changes', () => {
      const store = createMockStore();

      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

      expect(result.current.isAuthenticated).toBe(false);

      // Simulate login action
      act(() => {
        store.dispatch({
          type: 'auth/loginUser/fulfilled',
          payload: {
            user: { id: 'test-id', role: 'student' },
            token: 'test-token',
            refreshToken: 'test-refresh',
          },
        });
      });

      rerender();

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({ id: 'test-id', role: 'student' });
    });
  });

  describe('Error Handling', () => {
    test('should handle null user gracefully in role checking', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasRole('student')).toBe(false);
      expect(result.current.hasAnyRole(['student', 'admin'])).toBe(false);
    });

    test('should handle missing data in session validation', () => {
      const incompleteState = {
        user: { id: 'test-id', role: 'student' },
        token: null,
        isAuthenticated: false,
        lastActivity: Date.now(),
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, storeState: incompleteState }),
      });

      expect(result.current.isSessionValid()).toBe(false);
    });

    test('should handle missing lastActivity', () => {
      const stateWithoutActivity = {
        user: { id: 'test-id', role: 'student' },
        token: 'test-token',
        isAuthenticated: true,
        lastActivity: 0,
      };

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, storeState: stateWithoutActivity }),
      });

      expect(result.current.getTimeUntilExpiry()).toBe(0);
    });
  });

  describe('Integration with Redux', () => {
    test('should reflect store state changes immediately', () => {
      const store = createMockStore({
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();

      // Dispatch loading action
      act(() => {
        store.dispatch({ type: 'auth/loginUser/pending' });
      });

      expect(result.current.isLoading).toBe(true);

      // Dispatch error action
      act(() => {
        store.dispatch({ type: 'auth/loginUser/rejected', payload: 'Login failed' });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Login failed');
    });

    test('should dispatch actions through hook methods', () => {
      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });

      // Call hook methods
      act(() => {
        result.current.clearAuthError();
        result.current.updateActivity();
      });

      expect(dispatchSpy).toHaveBeenCalledWith({ type: 'auth/clearError' });
      expect(dispatchSpy).toHaveBeenCalledWith({ type: 'auth/updateLastActivity' });

      dispatchSpy.mockRestore();
    });
  });
});
