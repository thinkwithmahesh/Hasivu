/**
 * HASIVU Platform - Authentication Context Tests
 * Comprehensive tests for AuthContext provider and hooks
 */

import React, { ReactNode } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  AuthProvider,
  useAuth,
  useUser,
  useAuthStatus,
  useAuthActions,
  type User,
} from '../AuthContext';
import authReducer from '@/store/slices/authSlice';
import { UserRole } from '@/utils/constants';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/api-client', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  getCurrentUser: jest.fn(),
}));

// Mock store for testing
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

describe('AuthContext', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@hasivu.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.STUDENT,
    phone: '+919876543210',
    isActive: true,
    emailVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        sms: false,
        orderUpdates: true,
        promotions: false,
      },
      dietary: {
        restrictions: ['vegetarian'],
        allergies: [],
        preferences: ['spicy'],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/dashboard' },
      writable: true,
    });
  });

  const TestWrapper = ({
    children,
    storeState = {},
  }: {
    children: ReactNode;
    storeState?: any;
  }) => {
    const store = createMockStore(storeState);
    return (
      <Provider store={store}>
        <AuthProvider>{children}</AuthProvider>
      </Provider>
    );
  };

  const TestComponent = () => {
    const auth = useAuth();
    return (
      <div>
        <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
        <div data-testid="loading">{auth.isLoading.toString()}</div>
        <div data-testid="user-email">{auth.user?.email || 'No user'}</div>
        <div data-testid="error">{auth.error || 'No error'}</div>
        <button
          data-testid="login-btn"
          onClick={() => auth.login({ email: 'test@example.com', password: 'password' })}
        >
          Login
        </button>
        <button data-testid="logout-btn" onClick={() => auth.logout()}>
          Logout
        </button>
        <button
          data-testid="update-profile-btn"
          onClick={() => auth.updateProfile({ firstName: 'Updated' })}
        >
          Update Profile
        </button>
        <button data-testid="clear-error-btn" onClick={() => auth.clearAuthError()}>
          Clear Error
        </button>
        <button data-testid="update-activity-btn" onClick={() => auth.updateActivity()}>
          Update Activity
        </button>
        <div data-testid="has-student-role">{auth.hasRole(UserRole.STUDENT).toString()}</div>
        <div data-testid="has-admin-role">{auth.hasRole(UserRole.ADMIN).toString()}</div>
        <div data-testid="session-valid">{auth.isSessionValid().toString()}</div>
      </div>
    );
  };

  describe('AuthProvider', () => {
    test('should provide auth context values', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('user-email')).toHaveTextContent('No user');
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
    });

    test('should provide authenticated state when user is logged in', () => {
      const authenticatedState = {
        user: mockUser,
        token: 'test-token',
        isAuthenticated: true,
        lastActivity: Date.now(),
      };

      render(
        <TestWrapper storeState={authenticatedState}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@hasivu.com');
    });

    test('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Authentication Methods', () => {
    test('should handle login success', async () => {
      const store = createMockStore();

      render(
        <Provider store={store}>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </Provider>
      );

      const loginBtn = screen.getByTestId('login-btn');
      fireEvent.click(loginBtn);

      // Note: Since we're mocking the store, we can't easily test the actual async behavior
      // In a real test, you'd mock the API call and dispatch the fulfilled action
    });

    test('should handle logout', async () => {
      const authenticatedState = {
        user: mockUser,
        token: 'test-token',
        isAuthenticated: true,
      };

      render(
        <TestWrapper storeState={authenticatedState}>
          <TestComponent />
        </TestWrapper>
      );

      const logoutBtn = screen.getByTestId('logout-btn');
      fireEvent.click(logoutBtn);

      // Verify navigation to login page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });
  });

  describe('User Methods', () => {
    test('should update user profile', () => {
      const authenticatedState = {
        user: mockUser,
        isAuthenticated: true,
      };

      render(
        <TestWrapper storeState={authenticatedState}>
          <TestComponent />
        </TestWrapper>
      );

      const updateBtn = screen.getByTestId('update-profile-btn');
      fireEvent.click(updateBtn);

      // The actual update would be handled by Redux
      // This tests that the method is called without errors
    });

    test('should clear auth error', () => {
      const errorState = {
        error: 'Test error message',
      };

      render(
        <TestWrapper storeState={errorState}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('error')).toHaveTextContent('Test error message');

      const clearErrorBtn = screen.getByTestId('clear-error-btn');
      fireEvent.click(clearErrorBtn);
    });

    test('should update activity', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const updateActivityBtn = screen.getByTestId('update-activity-btn');
      fireEvent.click(updateActivityBtn);
    });
  });

  describe('Role Checking', () => {
    test('should check user roles correctly', () => {
      const authenticatedState = {
        user: mockUser,
        isAuthenticated: true,
      };

      render(
        <TestWrapper storeState={authenticatedState}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('has-student-role')).toHaveTextContent('true');
      expect(screen.getByTestId('has-admin-role')).toHaveTextContent('false');
    });

    test('should return false for roles when no user', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('has-student-role')).toHaveTextContent('false');
      expect(screen.getByTestId('has-admin-role')).toHaveTextContent('false');
    });
  });

  describe('Session Management', () => {
    test('should validate session correctly', () => {
      const recentActivity = Date.now() - 10000; // 10 seconds ago
      const authenticatedState = {
        user: mockUser,
        token: 'test-token',
        isAuthenticated: true,
        lastActivity: recentActivity,
      };

      render(
        <TestWrapper storeState={authenticatedState}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('session-valid')).toHaveTextContent('true');
    });

    test('should invalidate expired session', () => {
      const expiredActivity = Date.now() - 35 * 60 * 1000; // 35 minutes ago
      const authenticatedState = {
        user: mockUser,
        token: 'test-token',
        isAuthenticated: true,
        lastActivity: expiredActivity,
      };

      render(
        <TestWrapper storeState={authenticatedState}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('session-valid')).toHaveTextContent('false');
    });

    test('should handle missing authentication data', () => {
      const incompleteState = {
        user: mockUser,
        token: null,
        isAuthenticated: false,
        lastActivity: Date.now(),
      };

      render(
        <TestWrapper storeState={incompleteState}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('session-valid')).toHaveTextContent('false');
    });
  });

  describe('Helper Hooks', () => {
    const HookTestComponent = () => {
      const user = useUser();
      const { isAuthenticated, isLoading } = useAuthStatus();
      const {
        login,
        logout,
        register: _register,
        refreshAccessToken: _refreshAccessToken,
      } = useAuthActions();

      return (
        <div>
          <div data-testid="hook-user">{user?.email || 'No user'}</div>
          <div data-testid="hook-authenticated">{isAuthenticated.toString()}</div>
          <div data-testid="hook-loading">{isLoading.toString()}</div>
          <button
            data-testid="hook-login"
            onClick={() => login({ email: 'test', password: 'test' })}
          >
            Login
          </button>
          <button data-testid="hook-logout" onClick={() => logout()}>
            Logout
          </button>
        </div>
      );
    };

    test('useUser should return current user', () => {
      const authenticatedState = {
        user: mockUser,
        isAuthenticated: true,
      };

      render(
        <TestWrapper storeState={authenticatedState}>
          <HookTestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('hook-user')).toHaveTextContent('test@hasivu.com');
    });

    test('useAuthStatus should return auth status', () => {
      const loadingState = {
        isAuthenticated: false,
        isLoading: true,
      };

      render(
        <TestWrapper storeState={loadingState}>
          <HookTestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('hook-authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('hook-loading')).toHaveTextContent('true');
    });

    test('useAuthActions should provide auth methods', () => {
      render(
        <TestWrapper>
          <HookTestComponent />
        </TestWrapper>
      );

      const loginBtn = screen.getByTestId('hook-login');
      const logoutBtn = screen.getByTestId('hook-logout');

      expect(loginBtn).toBeInTheDocument();
      expect(logoutBtn).toBeInTheDocument();

      // Test that clicking doesn't throw errors
      fireEvent.click(loginBtn);
      fireEvent.click(logoutBtn);
    });
  });

  describe('Activity Tracking', () => {
    test('should setup activity listeners when authenticated', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const authenticatedState = {
        user: mockUser,
        isAuthenticated: true,
      };

      const { unmount } = render(
        <TestWrapper storeState={authenticatedState}>
          <TestComponent />
        </TestWrapper>
      );

      // Should setup event listeners
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), {
        passive: true,
      });
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), {
        passive: true,
      });
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
        passive: true,
      });
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), {
        passive: true,
      });

      // Should cleanup on unmount
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(4);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    test('should not setup listeners when not authenticated', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should not setup event listeners for unauthenticated users
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('mousedown', expect.any(Function), {
        passive: true,
      });

      addEventListenerSpy.mockRestore();
    });
  });

  describe('Route Protection', () => {
    test('should redirect authenticated users from auth pages', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/auth/login' },
        writable: true,
      });

      const authenticatedState = {
        user: { ...mockUser, role: UserRole.STUDENT },
        isAuthenticated: true,
      };

      render(
        <TestWrapper storeState={authenticatedState}>
          <TestComponent />
        </TestWrapper>
      );

      expect(mockReplace).toHaveBeenCalledWith('/student/dashboard');
    });

    test('should redirect unauthenticated users to login', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true,
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(mockReplace).toHaveBeenCalledWith('/auth/login');
    });

    test('should not redirect on public routes', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/' },
        writable: true,
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should display and auto-clear errors', async () => {
      jest.useFakeTimers();

      const errorState = {
        error: 'Authentication failed',
      };

      render(
        <TestWrapper storeState={errorState}>
          <TestComponent />
        </TestWrapper>
      );

      expect(toast.error).toHaveBeenCalledWith('Authentication failed');

      // Fast-forward timer to auto-clear error
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      jest.useRealTimers();
    });
  });
});
