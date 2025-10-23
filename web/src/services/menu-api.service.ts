/**
 * Menu API Service
 * Handles all menu-related API calls to backend Lambda functions
 */

import axios, { AxiosInstance } from 'axios';
import {
  MenuItem,
  MenuCategory,
  MenuFilters,
  MenuListResponse,
  MenuItemDetailsResponse,
  MenuSearchParams,
  MenuSearchResponse,
} from '@/types/menu';

class MenuAPIService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      config => {
        // Get token from localStorage or cookies
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          // Handle token refresh or logout
          // You can integrate with your auth service here
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Get from localStorage or cookies
    return localStorage.getItem('accessToken');
  }

  /**
   * Get list of menu items with optional filtering and pagination
   */
  async getMenuItems(filters?: MenuFilters): Promise<MenuListResponse> {
    try {
      const params = this.buildFilterParams(filters);
      const response = await this.client.get<MenuListResponse>('/menu/items', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get detailed information about a specific menu item
   */
  async getMenuItem(itemId: string): Promise<MenuItemDetailsResponse> {
    try {
      const response = await this.client.get<MenuItemDetailsResponse>(`/menu/items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching menu item ${itemId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get all menu categories
   */
  async getCategories(): Promise<MenuCategory[]> {
    try {
      const response = await this.client.get<{ categories: MenuCategory[] }>('/menu/categories');
      return response.data.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Search menu items
   */
  async searchMenuItems(searchParams: MenuSearchParams): Promise<MenuSearchResponse> {
    try {
      const response = await this.client.post<MenuSearchResponse>('/menu/search', searchParams);
      return response.data;
    } catch (error) {
      console.error('Error searching menu items:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get menu item recommendations
   */
  async getRecommendations(studentId?: string): Promise<MenuItem[]> {
    try {
      const params = studentId ? { studentId } : {};
      const response = await this.client.get<{ recommendations: MenuItem[] }>(
        '/menu/recommendations',
        { params }
      );
      return response.data.recommendations;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get nutritional information for a menu item
   */
  async getNutritionalInfo(itemId: string) {
    try {
      const response = await this.client.get(`/menu/nutrition/${itemId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching nutritional info for item ${itemId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Build query parameters from filters
   */
  private buildFilterParams(filters?: MenuFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters.category) params.category = filters.category;
    if (filters.searchQuery) params.search = filters.searchQuery;
    if (filters.schoolId) params.schoolId = filters.schoolId;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    // Dietary filters
    if (filters.dietary && filters.dietary.length > 0) {
      filters.dietary.forEach(diet => {
        params[diet] = true;
      });
    }

    // Spice level filters
    if (filters.spiceLevel && filters.spiceLevel.length > 0) {
      params.spiceLevel = filters.spiceLevel.join(',');
    }

    // Price range
    if (filters.priceRange) {
      params.minPrice = filters.priceRange.min;
      params.maxPrice = filters.priceRange.max;
    }

    // Availability
    if (filters.availability && filters.availability.length > 0) {
      params.availability = filters.availability.join(',');
    }

    return params;
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'An error occurred';
      const errorObj = new Error(message);
      (errorObj as any).statusCode = error.response?.status;
      (errorObj as any).data = error.response?.data;
      return errorObj;
    }
    return error instanceof Error ? error : new Error('Unknown error occurred');
  }
}

// Export singleton instance
export const menuAPIService = new MenuAPIService();
export default menuAPIService;
