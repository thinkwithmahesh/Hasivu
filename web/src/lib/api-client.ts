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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || '/api';

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
  error?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions?: string[];
    roles?: string[];
    createdAt?: string;
    updatedAt?: string;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  data?: {
    user?: AuthResponse['user'];
    tokens?: {
      accessToken: string;
      refreshToken: string;
    };
  };
  /** Flat shape returned by some refresh handlers */
  accessToken?: string;
  refreshToken?: string;
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
    this.baseURL = baseURL.replace(/\/$/, '');
    if (typeof window !== 'undefined') {
      this.csrfToken = this.getCookie('csrfToken');
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

  async get<T = unknown>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async put<T = unknown>(endpoint: string, body: unknown): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const base = typeof window !== 'undefined' ? '/api' : this.baseURL;
    const url = `${base}${endpoint}`;
    const config: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

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
    void token;
    this.accessToken = null;
  }

  clearToken(): void {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      this.setCookie('csrfToken', '', { maxAge: 0 });
    }
  }

  // Authentication endpoints
  async login(credentials: EnhancedLoginFormData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

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
    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
    });

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
    const refreshResponse = await this.refreshToken();
    if (refreshResponse.success) {
      return originalRequest.call(this, endpoint, options) as Promise<APIResponse<T>>;
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
