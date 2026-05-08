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
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

  /**
   * Get list of menu items with optional filtering and pagination
   */
  async getMenuItems(filters?: MenuFilters): Promise<MenuListResponse> {
    try {
      const params = this.buildFilterParams(filters);
      const response = await this.client.get<{
        data?: MenuItem[];
        items?: MenuItem[];
        pagination?: MenuListResponse['pagination'];
      }>('/v1/menus/items', { params });
      const items = (response.data.items || response.data.data || []).map(item =>
        this.normalizeMenuItem(item)
      );
      return {
        items,
        pagination: response.data.pagination || {
          total: items.length,
          page: 1,
          limit: items.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        categories: [],
      };
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
      const response = await this.client.get<{ data?: MenuItemDetailsResponse } | MenuItemDetailsResponse>(
        `/v1/menus/items/${itemId}`
      );
      const payload = response.data;
      if ('data' in payload && payload.data) {
        return this.normalizeMenuItem(payload.data) as MenuItemDetailsResponse;
      }
      return this.normalizeMenuItem(payload as MenuItemDetailsResponse) as MenuItemDetailsResponse;
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
      const response = await this.client.get<{ categories?: MenuCategory[]; data?: string[] | MenuCategory[] }>(
        '/v1/menus/categories'
      );
      const categories = response.data.categories || response.data.data || [];
      return categories.map((category, index) =>
        typeof category === 'string'
          ? {
              id: category,
              name: category,
              displayOrder: index,
              itemCount: 0,
            }
          : category
      );
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
      const response = await this.client.post<MenuSearchResponse>('/v1/menus/search', searchParams);
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
        '/v1/menus/recommendations',
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
      const response = await this.client.get(`/v1/menus/nutrition/${itemId}`);
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
    if (filters.sortBy && ['name', 'price', 'category', 'createdAt'].includes(filters.sortBy)) {
      params.sortBy = filters.sortBy;
    }
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
      params.available = filters.availability.includes('available') ? 'true' : 'false';
    }

    return params;
  }

  private normalizeMenuItem(raw: any): MenuItem {
    const nutritionalInfo = this.parseJsonObject(raw.nutritionalInfo);
    const allergens = this.parseJsonArray(raw.allergens);
    const tags = this.parseJsonArray(raw.tags);

    return {
      ...raw,
      price: Number(raw.price || 0),
      availability:
        raw.availability ||
        (raw.available === false ? 'unavailable' : raw.available === true ? 'available' : 'limited'),
      preparationTime: Number(raw.preparationTime || 0),
      servingSize: raw.servingSize || raw.portionSize || '1 serving',
      isVegetarian: raw.isVegetarian ?? tags.includes('vegetarian'),
      isVegan: raw.isVegan ?? tags.includes('vegan'),
      isGlutenFree: raw.isGlutenFree ?? !allergens.includes('gluten'),
      isDairyFree: raw.isDairyFree ?? !allergens.includes('dairy'),
      isNutFree: raw.isNutFree ?? !allergens.includes('nuts'),
      spiceLevel: raw.spiceLevel || 'none',
      popularity: Number(raw.popularity || 0),
      nutritionalInfo: nutritionalInfo
        ? {
            calories: Number(nutritionalInfo.calories || raw.calories || 0),
            protein: Number(nutritionalInfo.protein || 0),
            carbohydrates: Number(nutritionalInfo.carbohydrates || nutritionalInfo.carbs || 0),
            fat: Number(nutritionalInfo.fat || 0),
            fiber: Number(nutritionalInfo.fiber || 0),
            sugar: Number(nutritionalInfo.sugar || 0),
            sodium: Number(nutritionalInfo.sodium || 0),
          }
        : undefined,
      allergens,
      tags,
    };
  }

  private parseJsonArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map(String);
    }

    if (typeof value !== 'string' || value.trim() === '') {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  private parseJsonObject(value: unknown): Record<string, unknown> | null {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    if (typeof value !== 'string' || value.trim() === '') {
      return null;
    }

    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
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
