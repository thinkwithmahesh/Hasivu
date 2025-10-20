/**
 * Order API Service
 * Integrates with Epic 3 Lambda functions:
 * - create-order.ts: POST /orders
 * - get-order.ts: GET /orders/{orderId}
 * - get-orders.ts: GET /orders (with filtering)
 * - update-order.ts: PUT /orders/{orderId}
 * - update-status.ts: PUT /orders/{orderId}/status
 */

import axios, { AxiosInstance } from 'axios';
import {
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  UpdateOrderStatusRequest,
  GetOrdersRequest,
  GetOrdersResponse,
  OrderTracking,
} from '@/types/order';

class OrderAPIService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://api.hasivu.com';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - could trigger re-login
          console.warn('Unauthorized request - token may be expired');
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  /**
   * Create a new order (Epic 3: create-order Lambda)
   * POST /orders
   */
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      const response = await this.client.post<Order>('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific order by ID (Epic 3: get-order Lambda)
   * GET /orders/:orderId
   */
  async getOrder(orderId: string): Promise<Order> {
    try {
      const response = await this.client.get<Order>(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get list of orders with filtering (Epic 3: get-orders Lambda)
   * GET /orders
   */
  async getOrders(params?: GetOrdersRequest): Promise<GetOrdersResponse> {
    try {
      const queryParams = this.buildOrderQueryParams(params);
      const response = await this.client.get<GetOrdersResponse>('/orders', {
        params: queryParams,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing order (Epic 3: update-order Lambda)
   * PUT /orders/:orderId
   */
  async updateOrder(orderId: string, updates: UpdateOrderRequest): Promise<Order> {
    try {
      const response = await this.client.put<Order>(`/orders/${orderId}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Error updating order ${orderId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Update order status (Epic 3: update-status Lambda)
   * PUT /orders/:orderId/status
   */
  async updateOrderStatus(
    orderId: string,
    statusUpdate: UpdateOrderStatusRequest
  ): Promise<Order> {
    try {
      const response = await this.client.put<Order>(
        `/orders/${orderId}/status`,
        statusUpdate
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating order status ${orderId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Cancel an order
   * Convenience method that calls updateOrderStatus
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    return this.updateOrderStatus(orderId, {
      status: 'cancelled',
      reason,
    });
  }

  /**
   * Get order tracking information
   * GET /orders/:orderId/track
   */
  async trackOrder(orderId: string): Promise<OrderTracking> {
    try {
      const response = await this.client.get<OrderTracking>(`/orders/${orderId}/track`);
      return response.data;
    } catch (error) {
      console.error(`Error tracking order ${orderId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get order history for a student
   * Convenience method that calls getOrders with student filter
   */
  async getStudentOrderHistory(studentId: string, limit: number = 10): Promise<Order[]> {
    try {
      const response = await this.getOrders({
        studentId,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      return response.orders;
    } catch (error) {
      console.error(`Error fetching order history for student ${studentId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Build query parameters from GetOrdersRequest
   */
  private buildOrderQueryParams(params?: GetOrdersRequest): Record<string, any> {
    if (!params) return {};

    const queryParams: Record<string, any> = {};

    if (params.studentId) queryParams.studentId = params.studentId;
    if (params.schoolId) queryParams.schoolId = params.schoolId;
    if (params.paymentStatus) queryParams.paymentStatus = params.paymentStatus;
    if (params.dateFrom) queryParams.dateFrom = params.dateFrom;
    if (params.dateTo) queryParams.dateTo = params.dateTo;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.sortBy) queryParams.sortBy = params.sortBy;
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

    // Handle status as array or single value
    if (params.status) {
      queryParams.status = Array.isArray(params.status)
        ? params.status.join(',')
        : params.status;
    }

    return queryParams;
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
export const orderAPIService = new OrderAPIService();
export default orderAPIService;
