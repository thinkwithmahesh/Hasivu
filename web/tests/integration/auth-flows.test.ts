/**
 * HASIVU Platform - Authentication Integration Tests
 * Tests for complete authentication workflows and API integration
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loginUser, logoutUser, refreshToken, getCurrentUser } from '@/store/slices/authSlice';
import { UserRole, Permission } from '@/types/auth';

// Mock the API client
const _mockApiClient =  {
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  getCurrentUser: jest.fn(),
};

jest.mock(_'@/lib/api-client', _() => mockApiClient);

describe(_'Authentication Integration Tests', _() => {
  let store: ReturnType<typeof configureStore>;

  const _mockUser =  {
    id: 'test-user-123',
    email: 'test@hasivu.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.STUDENT,
    phone: '+919876543210',
    timezone: 'Asia/Kolkata',
    language: 'en',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    permissions: [Permission.PLACE_ORDERS, Permission.VIEW_OWN_ORDERS],
    roles: ['student'],
  };

  beforeEach(_() => {
    _store =  configureStore({
      reducer: {
        auth: authReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe(_'Login Flow Integration', _() => {
    test(_'should complete successful login flow', _async () => {
      // Mock successful API response
      mockApiClient.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
        message: 'Login successful',
      });

      const _credentials =  {
        email: 'test@hasivu.com',
        password: 'password123',
        rememberMe: true,
      };

      // Dispatch login action
      const _result =  await store.dispatch(loginUser(credentials));

      // Verify API was called with correct parameters
      expect(mockApiClient.login).toHaveBeenCalledWith(credentials);
      expect(mockApiClient.login).toHaveBeenCalledTimes(1);

      // Verify action was fulfilled
      expect(result.type).toBe('auth/loginUser/fulfilled');
      expect(result.payload).toEqual({
        user: mockUser,
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        message: 'Login successful',
      });

      // Verify store state
      const _state =  store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('mock-access-token');
      expect(state.refreshToken).toBe('mock-refresh-token');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    test(_'should handle login failure', _async () => {
      // Mock failed API response
      mockApiClient.login.mockResolvedValueOnce({
        success: false,
        error: 'Invalid credentials',
      });

      const _credentials =  {
        email: 'test@hasivu.com',
        password: 'wrong-password',
      };

      // Dispatch login action
      const _result =  await store.dispatch(loginUser(credentials));

      // Verify action was rejected
      expect(result.type).toBe('auth/loginUser/rejected');
      expect(result.payload).toBe('Invalid credentials');

      // Verify store state
      const _state =  store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    test(_'should handle login network error', _async () => {
      // Mock network error
      mockApiClient.login.mockRejectedValueOnce(new Error('Network error'));

      const _credentials =  {
        email: 'test@hasivu.com',
        password: 'password123',
      };

      // Dispatch login action
      const _result =  await store.dispatch(loginUser(credentials));

      // Verify action was rejected
      expect(result.type).toBe('auth/loginUser/rejected');
      expect(result.payload).toBe('Network error');

      // Verify store state
      const _state =  store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Network error');
    });

    test(_'should handle malformed API response', _async () => {
      // Mock malformed response
      mockApiClient.login.mockResolvedValueOnce({
        success: true,
        // Missing user and tokens
      });

      const _credentials =  {
        email: 'test@hasivu.com',
        password: 'password123',
      };

      // Dispatch login action
      const _result =  await store.dispatch(loginUser(credentials));

      // Should handle gracefully
      expect(result.type).toBe('auth/loginUser/fulfilled');
      expect(result.payload.user).toBeUndefined();
      expect(result.payload.token).toBeNull();
    });
  });

  describe(_'Logout Flow Integration', _() => {
    beforeEach(_() => {
      // Set authenticated state
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: mockUser,
          token: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      });
    });

    test(_'should complete successful logout flow', _async () => {
      mockApiClient.logout.mockResolvedValueOnce(true);

      // Dispatch logout action
      const _result =  await store.dispatch(logoutUser());

      // Verify API was called
      expect(mockApiClient.logout).toHaveBeenCalledTimes(1);

      // Verify action was fulfilled
      expect(result.type).toBe('auth/logoutUser/fulfilled');

      // Verify store state is cleared
      const _state =  store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    test(_'should clear state even if logout API fails', _async () => {
      mockApiClient.logout.mockRejectedValueOnce(new Error('Server error'));

      // Dispatch logout action
      const _result =  await store.dispatch(logoutUser());

      // Verify action still fulfills
      expect(result.type).toBe('auth/logoutUser/fulfilled');

      // Verify store state is still cleared
      const _state =  store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });
  });

  describe(_'Token Refresh Flow Integration', _() => {
    beforeEach(_() => {
      // Set authenticated state with tokens
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: mockUser,
          token: 'old-access-token',
          refreshToken: 'old-refresh-token',
        },
      });
    });

    test(_'should successfully refresh tokens', _async () => {
      mockApiClient.refreshToken.mockResolvedValueOnce({
        success: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      // Dispatch refresh action
      const _result =  await store.dispatch(refreshToken());

      // Verify API was called
      expect(mockApiClient.refreshToken).toHaveBeenCalledTimes(1);

      // Verify action was fulfilled
      expect(result.type).toBe('auth/refreshToken/fulfilled');
      expect(result.payload).toEqual({
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      // Verify tokens are updated
      const _state =  store.getState().auth;
      expect(state.token).toBe('new-access-token');
      expect(state.refreshToken).toBe('new-refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser); // User should remain
      expect(state.error).toBeNull();
    });

    test(_'should clear auth on refresh failure', _async () => {
      mockApiClient.refreshToken.mockResolvedValueOnce({
        success: false,
        message: 'Invalid refresh token',
      });

      // Dispatch refresh action
      const _result =  await store.dispatch(refreshToken());

      // Verify action was rejected
      expect(result.type).toBe('auth/refreshToken/rejected');

      // Verify auth state is cleared
      const _state =  store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.error).toBe('Session expired. Please login again.');
    });

    test(_'should handle refresh network error', _async () => {
      mockApiClient.refreshToken.mockRejectedValueOnce(new Error('Network timeout'));

      // Dispatch refresh action
      const _result =  await store.dispatch(refreshToken());

      // Verify action was rejected
      expect(result.type).toBe('auth/refreshToken/rejected');
      expect(result.payload).toBe('Network timeout');

      // Verify auth state is cleared on error
      const _state =  store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe(_'Current User Flow Integration', _() => {
    test(_'should successfully fetch current user', _async () => {
      mockApiClient.getCurrentUser.mockResolvedValueOnce({
        success: true,
        data: { user: mockUser },
      });

      // Dispatch getCurrentUser action
      const _result =  await store.dispatch(getCurrentUser());

      // Verify API was called
      expect(mockApiClient.getCurrentUser).toHaveBeenCalledTimes(1);

      // Verify action was fulfilled
      expect(result.type).toBe('auth/getCurrentUser/fulfilled');
      expect(result.payload).toEqual(mockUser);

      // Verify store state
      const _state =  store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    test(_'should handle getCurrentUser failure', _async () => {
      mockApiClient.getCurrentUser.mockResolvedValueOnce({
        success: false,
        error: 'User not found',
      });

      // Dispatch getCurrentUser action
      const _result =  await store.dispatch(getCurrentUser());

      // Verify action was rejected
      expect(result.type).toBe('auth/getCurrentUser/rejected');
      expect(result.payload).toBe('User not found');

      // Verify error in state but auth not cleared
      const _state =  store.getState().auth;
      expect(state.error).toBe('User not found');
      expect(state.isLoading).toBe(false);
      // Note: getCurrentUser failure doesn't clear auth state by design
    });
  });

  describe(_'Role-Based Permission Integration', _() => {
    test(_'should handle different user roles correctly', _async () => {
      const _roles =  [
        { role: UserRole.ADMIN, permissions: ['admin_access', 'manage_users'] },
        { role: UserRole.STUDENT, permissions: ['place_orders', 'view_own_orders'] },
        { role: UserRole.PARENT, permissions: ['place_orders', 'view_student_orders'] },
        { role: UserRole.KITCHEN_STAFF, permissions: ['kitchen_access', 'view_kitchen_queue'] },
        { role: UserRole.VENDOR, permissions: ['read_orders', 'manage_inventory'] },
      ];

      for (const { role, permissions } of roles) {
        const _roleUser =  { ...mockUser, role, permissions };
        
        mockApiClient.login.mockResolvedValueOnce({
          success: true,
          user: roleUser,
          tokens: {
            accessToken: `${role}-token`,
            refreshToken: `${role}-refresh`,
          },
        });

        const _result =  await store.dispatch(loginUser({
          email: `${role}@hasivu.com`,
          password: 'password123',
        }));

        expect(result.type).toBe('auth/loginUser/fulfilled');
        
        const _state =  store.getState().auth;
        expect(state.user?.role).toBe(role);
        expect(state.user?.permissions).toEqual(permissions);
      }
    });
  });

  describe(_'Session Management Integration', _() => {
    test(_'should handle session timeout scenario', _async () => {
      // Start with authenticated state
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: mockUser,
          token: 'expired-token',
          refreshToken: 'expired-refresh',
        },
      });

      // Simulate expired refresh token
      mockApiClient.refreshToken.mockRejectedValueOnce(new Error('Token expired'));

      // Try to refresh token
      const _result =  await store.dispatch(refreshToken());

      // Should clear auth state
      expect(result.type).toBe('auth/refreshToken/rejected');
      
      const _state =  store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Session expired. Please login again.');
    });

    test(_'should handle concurrent login attempts', _async () => {
      // Mock different responses for concurrent logins
      mockApiClient.login
        .mockResolvedValueOnce({
          success: true,
          user: mockUser,
          tokens: { accessToken: 'token1', refreshToken: 'refresh1' },
        })
        .mockResolvedValueOnce({
          success: true,
          user: { ...mockUser, id: 'user2' },
          tokens: { accessToken: 'token2', refreshToken: 'refresh2' },
        });

      // Dispatch concurrent login actions
      const [result1, result2] = await Promise.all([
        store.dispatch(loginUser({ email: 'user1@hasivu.com', password: 'pass1' })),
        store.dispatch(loginUser({ email: 'user2@hasivu.com', password: 'pass2' })),
      ]);

      // Both should succeed
      expect(result1.type).toBe('auth/loginUser/fulfilled');
      expect(result2.type).toBe('auth/loginUser/fulfilled');

      // Store should reflect the last successful login
      const _state =  store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      // Last dispatch wins
      expect(state.user?.id).toBe('user2');
      expect(state.token).toBe('token2');
    });
  });

  describe(_'Error Recovery Integration', _() => {
    test(_'should recover from network errors', _async () => {
      // First attempt fails
      mockApiClient.login.mockRejectedValueOnce(new Error('Network error'));

      let _result =  await store.dispatch(loginUser({
        email: 'test@hasivu.com',
        password: 'password123',
      }));

      expect(result.type).toBe('auth/loginUser/rejected');
      expect(store.getState().auth.error).toBe('Network error');

      // Clear error and retry
      store.dispatch({ type: 'auth/clearError' });

      // Second attempt succeeds
      mockApiClient.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
      });

      _result =  await store.dispatch(loginUser({
        email: 'test@hasivu.com',
        password: 'password123',
      }));

      expect(result.type).toBe('auth/loginUser/fulfilled');
      
      const _state =  store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    test(_'should handle partial API failures gracefully', _async () => {
      // Login succeeds but getCurrentUser fails
      mockApiClient.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
      });

      const _loginResult =  await store.dispatch(loginUser({
        email: 'test@hasivu.com',
        password: 'password123',
      }));

      expect(loginResult.type).toBe('auth/loginUser/fulfilled');

      // Now getCurrentUser fails
      mockApiClient.getCurrentUser.mockRejectedValueOnce(new Error('Server error'));

      const _getUserResult =  await store.dispatch(getCurrentUser());
      expect(getUserResult.type).toBe('auth/getCurrentUser/rejected');

      // Should still be authenticated
      const _state =  store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBe('Server error');
    });
  });

  describe(_'State Persistence Integration', _() => {
    test(_'should maintain state consistency across actions', _async () => {
      // Login
      mockApiClient.login.mockResolvedValueOnce({
        success: true,
        user: mockUser,
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
      });

      await store.dispatch(loginUser({ email: 'test@hasivu.com', password: 'pass' }));
      
      let _state =  store.getState().auth;
      const _initialActivity =  state.lastActivity;
      
      // Update activity
      store.dispatch({ type: 'auth/updateLastActivity' });
      
      _state =  store.getState().auth;
      expect(state.lastActivity).toBeGreaterThan(initialActivity);
      expect(state.user).toEqual(mockUser); // User should remain
      expect(state.isAuthenticated).toBe(true);

      // Update profile
      const _profileUpdate =  { firstName: 'Updated', phone: '+911234567890' };
      store.dispatch({ type: 'auth/updateUserProfile', payload: profileUpdate });

      _state =  store.getState().auth;
      expect(state.user?.firstName).toBe('Updated');
      expect(state.user?.phone).toBe('+911234567890');
      expect(state.user?.lastName).toBe(mockUser.lastName); // Other fields preserved
      expect(state.isAuthenticated).toBe(true);
    });

    test(_'should clear all related state on logout', _async () => {
      // Login first
      store.dispatch({
        type: 'auth/loginUser/fulfilled',
        payload: {
          user: mockUser,
          token: 'token',
          refreshToken: 'refresh',
        },
      });

      // Add some activity and errors
      store.dispatch({ type: 'auth/updateLastActivity' });
      store.dispatch({ type: 'auth/loginUser/rejected', payload: 'Some error' });

      let _state =  store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBe('Some error');

      // Logout
      mockApiClient.logout.mockResolvedValueOnce(true);
      await store.dispatch(logoutUser());

      // Everything should be cleared
      _state =  store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.lastActivity).toEqual(expect.any(Number));
    });
  });
});