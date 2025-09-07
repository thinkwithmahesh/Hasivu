/**
 * HASIVU Platform - Production API Service Layer
 * Complete integration with backend Lambda functions and services
 * Implements authentication, RFID, payments, and all core features
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSession, signIn, signOut } from 'next-auth/react';

// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.hasivu.com',
  STAGE: process.env.NEXT_PUBLIC_STAGE || 'prod',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      VERIFY_EMAIL: '/auth/verify-email',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password'
    },
    // User Management
    USERS: {
      LIST: '/api/v1/users',
      GET: '/api/v1/users/:id',
      UPDATE: '/api/v1/users/:id',
      DELETE: '/api/v1/users/:id',
      BULK_IMPORT: '/api/v1/users/bulk-import',
      MANAGE_CHILDREN: '/api/v1/users/:id/children',
      PROFILE: '/api/v1/users/profile',
      PREFERENCES: '/api/v1/users/:id/preferences'
    },
    // Payment System
    PAYMENTS: {
      CREATE_ORDER: '/payments/orders',
      VERIFY: '/payments/verify',
      WEBHOOK: '/payments/webhook',
      REFUND: '/payments/refund',
      STATUS: '/payments/status/:orderId',
      METHODS: '/payments/methods',
      ADVANCED: '/payments/advanced',
      RETRY: '/payments/retry/:paymentId',
      SUBSCRIPTION: '/payments/subscription',
      INVOICE: '/payments/invoice/:paymentId',
      ANALYTICS: '/payments/analytics'
    },
    // RFID System
    RFID: {
      CREATE_CARD: '/rfid/cards',
      GET_CARD: '/rfid/cards/:cardId',
      VERIFY_CARD: '/rfid/verify',
      BULK_IMPORT: '/rfid/bulk-import',
      DELIVERY_VERIFICATION: '/rfid/delivery-verification',
      MANAGE_READERS: '/rfid/readers',
      MOBILE_TRACKING: '/rfid/mobile-tracking',
      CARD_ANALYTICS: '/rfid/analytics'
    },
    // Order Management
    ORDERS: {
      CREATE: '/orders',
      GET: '/orders/:orderId',
      UPDATE: '/orders/:orderId',
      CANCEL: '/orders/:orderId/cancel',
      LIST: '/orders',
      TRACK: '/orders/:orderId/track',
      HISTORY: '/orders/history',
      BULK_CREATE: '/orders/bulk'
    },
    // Menu System
    MENU: {
      ITEMS: '/menu/items',
      ITEM: '/menu/items/:itemId',
      CATEGORIES: '/menu/categories',
      SCHEDULE: '/menu/schedule',
      PLANNING: '/menu/planning',
      NUTRITION: '/menu/nutrition/:itemId',
      RECOMMENDATIONS: '/menu/recommendations',
      SEARCH: '/menu/search'
    },
    // Analytics & Reporting
    ANALYTICS: {
      DASHBOARD: '/analytics/dashboard',
      REPORTS: '/analytics/reports/:type',
      METRICS: '/analytics/metrics',
      EXPORT: '/analytics/export',
      REAL_TIME: '/analytics/real-time',
      INSIGHTS: '/analytics/insights'
    },
    // School Management
    SCHOOLS: {
      LIST: '/schools',
      GET: '/schools/:schoolId',
      UPDATE: '/schools/:schoolId',
      STATISTICS: '/schools/:schoolId/stats',
      SETTINGS: '/schools/:schoolId/settings',
      STAFF: '/schools/:schoolId/staff'
    },
    // Notifications
    NOTIFICATIONS: {
      LIST: '/notifications',
      SEND: '/notifications/send',
      MARK_READ: '/notifications/:id/read',
      PREFERENCES: '/notifications/preferences',
      SUBSCRIBE: '/notifications/subscribe',
      UNSUBSCRIBE: '/notifications/unsubscribe'
    }
  }
};

// Type Definitions
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolId?: string;
  };
  tokens: AuthTokens;
}

// API Client Class
class HASIVUApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': 'v1',
        'X-Client-Type': 'web'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const session = await getSession();
        
        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        // Add timestamp
        config.headers['X-Request-Timestamp'] = new Date().toISOString();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const tokens = await this.refreshAccessToken();
            if (tokens) {
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Redirect to login
            await signOut({ callbackUrl: '/login' });
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async refreshAccessToken(): Promise<AuthTokens | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const tokens = await this.refreshPromise;
      this.refreshPromise = null;
      return tokens;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  private async performTokenRefresh(): Promise<AuthTokens> {
    const session = await getSession();
    
    if (!session?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post(
      API_CONFIG.ENDPOINTS.AUTH.REFRESH,
      { refreshToken: session.refreshToken }
    );

    return response.data;
  }

  private handleApiError(error: AxiosError): Error {
    const errorResponse = error.response?.data as ApiResponse;
    
    const errorMessage = errorResponse?.error?.message || 
                        error.message || 
                        'An unexpected error occurred';
    
    const errorCode = errorResponse?.error?.code || 
                     `HTTP_${error.response?.status || 'UNKNOWN'}`;

    const enhancedError = new Error(errorMessage) as Error & {
      code: string;
      status: number;
      details: any;
    };

    enhancedError.code = errorCode;
    enhancedError.status = error.response?.status || 0;
    enhancedError.details = errorResponse?.error?.details;

    return enhancedError;
  }

  // Authentication Methods
  async login(email: string, password: string): Promise<ApiResponse<UserSession>> {
    const response = await this.client.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      email,
      password
    });
    return response.data;
  }

  async register(userData: any): Promise<ApiResponse<UserSession>> {
    const response = await this.client.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
    return response.data;
  }

  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    const response = await this.client.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
    return response.data;
  }

  // RFID Methods
  async createRFIDCard(cardData: any): Promise<ApiResponse<any>> {
    const response = await this.client.post(API_CONFIG.ENDPOINTS.RFID.CREATE_CARD, cardData);
    return response.data;
  }

  async verifyRFIDCard(cardNumber: string, readerId: string): Promise<ApiResponse<any>> {
    const response = await this.client.post(API_CONFIG.ENDPOINTS.RFID.VERIFY_CARD, {
      cardNumber,
      readerId,
      timestamp: new Date().toISOString()
    });
    return response.data;
  }

  async getRFIDAnalytics(params?: any): Promise<ApiResponse<any>> {
    const response = await this.client.get(API_CONFIG.ENDPOINTS.RFID.CARD_ANALYTICS, { params });
    return response.data;
  }

  // Payment Methods
  async createPaymentOrder(orderData: any): Promise<ApiResponse<any>> {
    const response = await this.client.post(API_CONFIG.ENDPOINTS.PAYMENTS.CREATE_ORDER, orderData);
    return response.data;
  }

  async verifyPayment(paymentData: any): Promise<ApiResponse<any>> {
    const response = await this.client.post(API_CONFIG.ENDPOINTS.PAYMENTS.VERIFY, paymentData);
    return response.data;
  }

  async getPaymentAnalytics(params?: any): Promise<ApiResponse<any>> {
    const response = await this.client.get(API_CONFIG.ENDPOINTS.PAYMENTS.ANALYTICS, { params });
    return response.data;
  }

  // Order Methods
  async createOrder(orderData: any): Promise<ApiResponse<any>> {
    const response = await this.client.post(API_CONFIG.ENDPOINTS.ORDERS.CREATE, orderData);
    return response.data;
  }

  async getOrder(orderId: string): Promise<ApiResponse<any>> {
    const url = API_CONFIG.ENDPOINTS.ORDERS.GET.replace(':orderId', orderId);
    const response = await this.client.get(url);
    return response.data;
  }

  async trackOrder(orderId: string): Promise<ApiResponse<any>> {
    const url = API_CONFIG.ENDPOINTS.ORDERS.TRACK.replace(':orderId', orderId);
    const response = await this.client.get(url);
    return response.data;
  }

  // Menu Methods
  async getMenuItems(params?: any): Promise<ApiResponse<any>> {
    const response = await this.client.get(API_CONFIG.ENDPOINTS.MENU.ITEMS, { params });
    return response.data;
  }

  async searchMenu(query: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(API_CONFIG.ENDPOINTS.MENU.SEARCH, {
      params: { q: query }
    });
    return response.data;
  }

  async getMenuRecommendations(userId?: string): Promise<ApiResponse<any>> {
    const response = await this.client.get(API_CONFIG.ENDPOINTS.MENU.RECOMMENDATIONS, {
      params: { userId }
    });
    return response.data;
  }

  // Analytics Methods
  async getDashboardData(): Promise<ApiResponse<any>> {
    const response = await this.client.get(API_CONFIG.ENDPOINTS.ANALYTICS.DASHBOARD);
    return response.data;
  }

  async getAnalyticsReport(type: string, params?: any): Promise<ApiResponse<any>> {
    const url = API_CONFIG.ENDPOINTS.ANALYTICS.REPORTS.replace(':type', type);
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async getRealTimeMetrics(): Promise<ApiResponse<any>> {
    const response = await this.client.get(API_CONFIG.ENDPOINTS.ANALYTICS.REAL_TIME);
    return response.data;
  }

  // School Methods
  async getSchoolStatistics(schoolId: string): Promise<ApiResponse<any>> {
    const url = API_CONFIG.ENDPOINTS.SCHOOLS.STATISTICS.replace(':schoolId', schoolId);
    const response = await this.client.get(url);
    return response.data;
  }

  async getSchoolList(params?: any): Promise<ApiResponse<any>> {
    const response = await this.client.get(API_CONFIG.ENDPOINTS.SCHOOLS.LIST, { params });
    return response.data;
  }

  // Demo Booking Methods (for landing page)
  async bookDemo(demoData: {
    name: string;
    email: string;
    phone: string;
    schoolName: string;
    role: string;
    studentCount?: number;
    message?: string;
  }): Promise<ApiResponse<any>> {
    // This would typically go to a CRM endpoint or notification service
    const response = await this.client.post('/demo/book', demoData);
    return response.data;
  }

  async requestTrial(trialData: {
    schoolName: string;
    adminEmail: string;
    adminName: string;
    studentCount: number;
    expectedStartDate?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/trial/request', trialData);
    return response.data;
  }

  // Public Statistics (for landing page)
  async getPublicStatistics(): Promise<ApiResponse<{
    totalStudents: number;
    totalSchools: number;
    totalOrders: number;
    fraudDetectionRate: number;
    deliveryAccuracy: number;
    averageCostReduction: number;
    systemUptime: number;
    rfidVerifications: number;
  }>> {
    const response = await this.client.get('/public/statistics');
    return response.data;
  }

  // Testimonials (for landing page)
  async getTestimonials(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/public/testimonials');
    return response.data;
  }
}

// Export singleton instance
export const hasiviApi = new HASIVUApiClient();

// Export types
export type { ApiResponse, AuthTokens, UserSession };
