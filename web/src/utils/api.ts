 * HASIVU Platform - API Utilities
 * Centralized API client with authentication, error handling, and response transformation
 * Built on Axios with interceptors for consistent behavior across the application;
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';
import toast from 'react-hot-toast';
 * Extended session interface with access token;
 * Extended axios request config with custom properties;
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {}
 * API configuration and constants;
export const API_CONFIG = {}
} as const
 * API response types;
export interface ApiResponse<T = any> {}
 * Request configuration interfaces;
export interface ApiRequestConfig extends AxiosRequestConfig {}
 * Create and configure the main API client;
    this.setupInterceptors();
   * Setup request and response interceptors;
  private setupInterceptors(): void {}
  // Add authentication token
        const session = await getSession() as ExtendedSession;
        if (session?.accessToken) {}
          config.headers.Authorization = `Bearer ${session.accessToken}``
          console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}``
          console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}``
      code: errorData?.code || `HTTP_${status}``
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}``
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}``
    getById: (id: string) => apiClient.get(`${API_CONFIG.ENDPOINTS.STUDENTS}/ ${id}``
    update: (id: string, data: any) => apiClient.put(`${API_CONFIG.ENDPOINTS.STUDENTS}/${id}``
    delete: (id: string) => apiClient.delete(`${API_CONFIG.ENDPOINTS.STUDENTS}/ ${id}``
    linkRFID: (studentId: string, rfidData: any) => apiClient.post(`${API_CONFIG.ENDPOINTS.STUDENTS}/${studentId}/ rfid``
    getById: (id: string) => apiClient.get(`${API_CONFIG.ENDPOINTS.ORDERS}/ ${id}``
    update: (id: string, data: any) => apiClient.put(`${API_CONFIG.ENDPOINTS.ORDERS}/${id}``
    cancel: (id: string) => apiClient.patch(`${API_CONFIG.ENDPOINTS.ORDERS}/ ${id}/cancel``
    track: (id: string) => apiClient.get(`${API_CONFIG.ENDPOINTS.ORDER_TRACKING}/ ${id}``
    getItemById: (id: string) => apiClient.get(`${API_CONFIG.ENDPOINTS.MENU_ITEMS}/ ${id}``
    topUpWallet: (amount: number) => apiClient.post(`${API_CONFIG.ENDPOINTS.WALLET}/ topup``
    getReports: (type: string, params?: any) => apiClient.get(`${API_CONFIG.ENDPOINTS.REPORTS}/ ${type}``
    markAsRead: (id: string) => apiClient.patch(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/ ${id}/read``