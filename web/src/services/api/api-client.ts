/**
 * HASIVU Platform - API Client
 * Centralized API client for making HTTP requests to the backend
 */

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  message: string;
  status: number;
  errors?: string[];
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 30000; // 30 seconds

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  }

  /**
   * Make a GET request
   */
  async get<T = any>(
    endpoint: string,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body: data });
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body: data });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body: data });
  }

  /**
   * Generic request method
   */
  private async request<T = any>(endpoint: string, config: RequestConfig): Promise<ApiResponse<T>> {
    const { method = 'GET', headers = {}, body, params, timeout = this.defaultTimeout } = config;

    // Build URL with query parameters
    let url = `${this.baseUrl}${endpoint}`;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add authorization header if token exists
    const token = this.getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout),
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestOptions);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let responseData: any;

      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        const httpError = new Error(
          responseData.message || responseData.error || `HTTP ${response.status}`
        ) as ApiError;
        httpError.status = response.status;
        httpError.errors = responseData.errors;
        throw httpError;
      }

      // Return standardized response
      return {
        data: responseData,
        success: true,
        message: responseData.message,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        const timeoutError = new Error('Request timeout') as ApiError;
        timeoutError.status = 408;
        throw timeoutError;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        const abortError = new Error('Request aborted') as ApiError;
        abortError.status = 499;
        throw abortError;
      }

      // Re-throw API errors (they're already Error objects from earlier throws)
      if (error && typeof error === 'object' && 'status' in error && error instanceof Error) {
        throw error;
      }

      // Handle network errors
      const networkError = new Error(
        error instanceof Error ? error.message : 'Network error'
      ) as ApiError;
      networkError.status = 0;
      throw networkError;
    }
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  /**
   * Set base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Set default timeout
   */
  setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }

  /**
   * Upload file
   */
  async uploadFile(
    endpoint: string,
    file: File,
    fieldName = 'file',
    additionalData?: Record<string, any>
  ): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const token = this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        const uploadError = new Error(responseData.message || 'Upload failed') as ApiError;
        uploadError.status = response.status;
        uploadError.errors = responseData.errors;
        throw uploadError;
      }

      return {
        data: responseData,
        success: true,
        message: responseData.message,
      };
    } catch (error) {
      // If it's already an ApiError, re-throw it
      if (error && typeof error === 'object' && 'status' in error) {
        throw error;
      }
      // Otherwise wrap it in an Error object
      const wrappedError = new Error(
        error instanceof Error ? error.message : 'Upload error'
      ) as ApiError;
      wrappedError.status = 0;
      throw wrappedError;
    }
  }
}

// Export singleton instance
export const hasivuApiClient = new ApiClient();
export { ApiClient };
