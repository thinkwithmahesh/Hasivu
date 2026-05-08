/**
 * HASIVU Platform - Authentication API Service
 * Client-side authentication service for login, logout, and user management
 */

import {
  User,
  UserRole,
  AuthTokens,
  AuthResponse,
  PasswordResetRequest,
  PasswordChangeRequest,
  PasswordResetConfirmation,
} from '@/types/auth';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId?: string;
  passwordConfirm?: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export type { AuthResponse, PasswordResetRequest };

class AuthApiService {
  private refreshPromise: Promise<AuthTokens> | null = null;

  /** Same-origin in the browser so httpOnly cookies always match the page host/port. */
  private getApiBase(): string {
    if (typeof window !== 'undefined') {
      return '/api';
    }
    return (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
  }

  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.getApiBase()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      const payload = data?.data ?? data;
      const user = payload?.user;
      return {
        user,
        tokens: payload?.tokens,
        success: !!user,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.getApiBase()}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      return {
        user: data.user,
        tokens: data.tokens,
        success: true,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${this.getApiBase()}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('user');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._refreshToken();

    try {
      const tokens = await this.refreshPromise;
      return tokens;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async _refreshToken(): Promise<AuthTokens> {
    try {
      const response = await fetch(`${this.getApiBase()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const body = await response.json();
      const tokens = body?.tokens ?? body?.data?.tokens ?? body;

      return tokens;
    } catch (error) {
      // Clear tokens on refresh failure
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await fetch(`${this.getApiBase()}/auth/me`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshToken();
          return this.getCurrentUser();
        }
        throw new Error('Failed to get user profile');
      }

      const body = (await response.json()) as {
        user?: User;
        data?: { user?: User };
        email?: string;
      };
      const user = body?.user ?? body?.data?.user;
      if (user && typeof user === 'object' && 'email' in user) {
        return user as User;
      }
      throw new Error('Invalid user profile response');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    try {
      const response = await fetch(`${this.getApiBase()}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset request failed');
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    try {
      const response = await fetch(`${this.getApiBase()}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset confirm error:', error);
      throw error;
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await fetch(`${this.getApiBase()}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Email verification failed');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return false;
  }

  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    return null;
  }

  /**
   * Get refresh token from storage
   */
  getRefreshToken(): string | null {
    return null;
  }

  /**
   * Store tokens in local storage
   */
  setTokens(tokens: AuthTokens): void {
    void tokens;
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    localStorage.removeItem('user');
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  /**
   * Store user data
   */
  setStoredUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Check whether the client has a valid session and return the current user when possible.
   */
  async checkAuth(): Promise<{ authenticated: boolean; user?: User; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      return { authenticated: true, user };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Auth check failed';
      return { authenticated: false, error: message };
    }
  }

  /**
   * Request password reset email (wrapper for existing requestPasswordReset).
   */
  async forgotPassword(emailOrRequest: string | PasswordResetRequest): Promise<AuthResponse> {
    const email = typeof emailOrRequest === 'string' ? emailOrRequest : emailOrRequest.email;
    try {
      await this.requestPasswordReset({ email });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed';
      return { success: false, error: message };
    }
  }

  /**
   * Complete password reset with token (maps to confirmPasswordReset).
   */
  async resetPassword(
    tokenOrData: string | PasswordResetConfirmation,
    password?: string,
    _passwordConfirm?: string
  ): Promise<AuthResponse> {
    try {
      if (typeof tokenOrData === 'object') {
        await this.confirmPasswordReset({
          token: tokenOrData.token,
          newPassword: tokenOrData.password,
        });
      } else {
        await this.confirmPasswordReset({
          token: tokenOrData,
          newPassword: password ?? '',
        });
      }
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reset failed';
      return { success: false, error: message };
    }
  }

  /**
   * Session probe used by secure-auth (wraps `checkAuth` with a success flag).
   */
  async checkSession(): Promise<{ success: boolean; user?: User; error?: string }> {
    const result = await this.checkAuth();
    if (result.authenticated && result.user) {
      return { success: true, user: result.user };
    }
    return { success: false, user: result.user, error: result.error };
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  getCurrentCSRFToken(): string | null {
    return this.getCookie('csrfToken');
  }

  async getCSRFToken(): Promise<{ csrfToken: string; expiresAt: string }> {
    let token = this.getCurrentCSRFToken();
    if (!token && typeof document !== 'undefined') {
      token = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      document.cookie = `csrfToken=${token}; path=/; max-age=86400; samesite=strict`;
    }
    const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString();
    return { csrfToken: token || '', expiresAt };
  }

  /**
   * Update profile (Bearer `PATCH` — same base URL pattern as `getCurrentUser`).
   */
  async updateProfile(
    data: Partial<User>
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }
      const response = await fetch(`${this.getApiBase()}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as { message?: string };
        return { success: false, error: err.message || 'Update failed' };
      }
      const user = (await response.json()) as User;
      this.setStoredUser(user);
      return { success: true, user };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed';
      return { success: false, error: message };
    }
  }

  async changePassword(data: PasswordChangeRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }
      const response = await fetch(`${this.getApiBase()}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as { message?: string };
        return { success: false, error: err.message || 'Change failed' };
      }
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Change failed';
      return { success: false, error: message };
    }
  }
}

// Export singleton instance
export const authApiService = new AuthApiService();
export { AuthApiService };
