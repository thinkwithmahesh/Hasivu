 * HASIVU Platform - Enhanced API Client with Full ShadCN Integration
 * Production-ready API integration layer that connects all ShadCN components
 * with backend services, real-time updates, and optimistic UI patterns;
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';
import { socketClient } from './socket-client';
  // Enhanced types for component integration
interface ApiResponse<T = any> {}
const config: ApiConfig = {}
  }> = [];
  private optimisticUpdates: Map<string, OptimisticUpdate> = new Map();
  private realTimeSubscriptions: Map<string, RealTimeSubscription> = new Map();
  private componentStates: Map<string, ComponentState> = new Map();
  private requestQueue: Array<() => Promise<any>> = [];
  private isOffline = false;
    this.setupInterceptors();
  private setupInterceptors() {}
          config.headers.Authorization = `Bearer ${token}``
          console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}``
                  originalRequest.headers.Authorization = `Bearer ${token}``
            originalRequest.headers.Authorization = `Bearer ${newToken}``
      `${config.baseURL}/ auth/refresh``
      const redirectUrl = `/ auth/login?redirect=${encodeURIComponent(currentPath)}&reason=session_expired``
        code: data?.code || `HTTP_${status}``
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}``
    getItem: (id: string) => apiClient.get(`/meals/items/${id}``
    getNutrition: (id: string) => apiClient.get(`/m eals/nutrition/${id}``
    getById: (id: string) => apiClient.get(`/ orders/${id}``
    track: (id: string) => apiClient.get(`/ orders/track/${id}``
    cancel: (id: string) => apiClient.patch(`/orders/${id}/cancel``
    markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read``