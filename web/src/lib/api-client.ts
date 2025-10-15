/**
 * API Client for HASIVU Platform
 * Handles communication with the backend Express server
 */

import {
  EnhancedLoginFormData,
  RegistrationFormData,
  ForgotPasswordFormData,
  ProfileManagementFormData,
} from '@/components/auth/schemas';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Response types
interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions?: string[];
    roles?: string[];
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  sessionId?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  timezone?: string;
  language?: string;
  preferences?: any;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
  roles?: string[];
}

// HTTP Client class
class APIClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private csrfToken: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    // Load token from cookies on client-side
    if (typeof window !== 'undefined') {
      this.accessToken = this.getCookie('accessToken');
      this.csrfToken = this.getCookie('csrfToken') || this.generateCSRFToken();
      this.setCookie('csrfToken', this.csrfToken, {
        maxAge: 24 * 3600, // 24 hours
        httpOnly: false,
        secure: true,
        sameSite: 'strict',
      });
    }
  }

  // Generate CSRF token
  private generateCSRFToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Helper method to get cookie value
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  // Helper method to set httpOnly cookie (server-side only)
  private setCookie(
    name: string,
    value: string,
    options: {
      maxAge?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
    } = {}
  ): void {
    // Note: httpOnly cookies can only be set server-side
    // For client-side, we'll use regular cookies with httpOnly=false
    if (typeof document !== 'undefined') {
      let cookieString = `${name}=${value}`;
      if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
      if (options.secure !== false) cookieString += '; secure';
      if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
      document.cookie = cookieString;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add authorization header if token exists
    if (this.accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.accessToken}`,
      };
    }

    // Add CSRF token for auth endpoints
    if (
      this.csrfToken &&
      endpoint.startsWith('/auth/') &&
      (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')
    ) {
      config.headers = {
        ...config.headers,
        'X-CSRF-Token': this.csrfToken,
      };
    }

    try {
      const response = await fetch(url, config);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
        return { success: true };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}`,
          ...data,
        };
      }

      return {
        success: true,
        ...data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Token management
  setToken(token: string): void {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      // Set access token as regular cookie (httpOnly would need server-side)
      this.setCookie('accessToken', token, {
        maxAge: 15 * 60, // 15 minutes
        httpOnly: false, // Can't set httpOnly from client-side
        secure: true,
        sameSite: 'strict',
      });
    }
  }

  clearToken(): void {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      // Clear cookies by setting them to expire
      this.setCookie('accessToken', '', { maxAge: 0 });
      this.setCookie('refreshToken', '', { maxAge: 0 });
      this.setCookie('csrfToken', '', { maxAge: 0 });
    }
  }

  // Authentication endpoints
  async login(credentials: EnhancedLoginFormData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data?.tokens?.accessToken) {
      this.setToken(response.data.tokens.accessToken);

      // Store refresh token in cookie
      if (typeof window !== 'undefined' && response.data.tokens.refreshToken) {
        this.setCookie('refreshToken', response.data.tokens.refreshToken, {
          maxAge: 7 * 24 * 3600, // 7 days
          httpOnly: false,
          secure: true,
          sameSite: 'strict',
        });
      }
    }

    return response as AuthResponse;
  }

  async register(userData: RegistrationFormData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }) as Promise<AuthResponse>;
  }

  async logout(): Promise<APIResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });

    this.clearToken();
    return response;
  }

  async logoutAll(): Promise<APIResponse> {
    const response = await this.request('/auth/logout-all', {
      method: 'POST',
    });

    this.clearToken();
    return response;
  }

  async forgotPassword(data: ForgotPasswordFormData): Promise<APIResponse> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<APIResponse<{ user: User; sessionId: string }>> {
    return this.request<{ user: User; sessionId: string }>('/auth/me');
  }

  async updateProfile(
    data: Partial<ProfileManagementFormData>
  ): Promise<APIResponse<{ user: User }>> {
    return this.request<{ user: User }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
  }): Promise<APIResponse> {
    return this.request('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async checkAuthStatus(): Promise<
    APIResponse<{ authenticated: boolean; userId?: string; sessionId?: string }>
  > {
    return this.request<{ authenticated: boolean; userId?: string; sessionId?: string }>(
      '/auth/status'
    );
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = typeof window !== 'undefined' ? this.getCookie('refreshToken') : null;
    if (!refreshToken) {
      return { success: false, message: 'No refresh token available' };
    }

    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.success && response.data?.tokens?.accessToken) {
      this.setToken(response.data.tokens.accessToken);
    }

    return response as AuthResponse;
  }

  async validatePassword(password: string): Promise<APIResponse<{ validation: any }>> {
    return this.request<{ validation: any }>('/auth/validate-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  // Menu endpoints
  async getMenuItems(): Promise<APIResponse<any[]>> {
    return this.request<any[]>('/menu/items');
  }

  async getMenuByDate(date: string): Promise<APIResponse<any>> {
    return this.request<any>(`/menu/daily?date=${encodeURIComponent(date)}`);
  }

  // Order endpoints
  async getOrders(): Promise<APIResponse<any[]>> {
    return this.request<any[]>('/orders');
  }

  async createOrder(orderData: any): Promise<APIResponse<any>> {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrderById(orderId: string): Promise<APIResponse<any>> {
    return this.request<any>(`/orders/${orderId}`);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<APIResponse<any>> {
    return this.request<any>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Payment endpoints
  async processPayment(paymentData: any): Promise<APIResponse<any>> {
    return this.request<any>('/payments/process', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getPaymentHistory(): Promise<APIResponse<any[]>> {
    return this.request<any[]>('/payments/history');
  }

  // Kitchen endpoints (for staff)
  async getKitchenOrders(): Promise<APIResponse<any[]>> {
    return this.request<any[]>('/kitchen/orders');
  }

  async updateKitchenOrderStatus(orderId: string, status: string): Promise<APIResponse<any>> {
    return this.request<any>(`/kitchen/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Admin endpoints
  async getUsers(): Promise<APIResponse<any[]>> {
    return this.request<any[]>('/admin/users');
  }

  async updateUserRole(userId: string, role: string): Promise<APIResponse<any>> {
    return this.request<any>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async getSystemStats(): Promise<APIResponse<any>> {
    return this.request<any>('/admin/stats');
  }
}

// Create singleton instance
const apiClient = new APIClient();

// Automatic token refresh on 401 errors
const originalRequest = apiClient['request'];
apiClient['request'] = async function <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const response = (await originalRequest.call(this, endpoint, options)) as APIResponse<T>;
  // If we get 401 and have a refresh token, try to refresh
  if (!response.success && response.error?.includes('401') && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshResponse = await this.refreshToken();
      if (refreshResponse.success) {
        // Retry the original request with new token
        return originalRequest.call(this, endpoint, options) as Promise<APIResponse<T>>;
      }
    }
  }

  return response;
};

// Named exports for backward compatibility
export const api = apiClient;
export { apiClient };

// Default export
export default apiClient;
export type { APIResponse, AuthResponse, User };
