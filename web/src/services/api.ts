// Production-level API services for HASIVU platform
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Generic API response type
interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// User Management API
export const userApi = {
  // Authentication
  login: async (credentials: { email: string; password: string }): Promise<ApiResponse<{ token: string; user: any }>> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: any): Promise<ApiResponse<{ user: any }>> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/auth/logout');
    localStorage.removeItem('authToken');
    return response.data;
  },

  // Profile management
  getProfile: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  updateProfile: async (profileData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put('/users/profile', profileData);
    return response.data;
  },

  // User management (admin only)
  getUsers: async (params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  createUser: async (userData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  updateUser: async (userId: string, userData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  }
};

// Kitchen Management API
export const kitchenApi = {
  // Orders
  getOrders: async (params?: { 
    status?: string; 
    priority?: string; 
    date?: string; 
    page?: number; 
    limit?: number;
  }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/kitchen/orders', { params });
    return response.data;
  },

  createOrder: async (orderData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/kitchen/orders', orderData);
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch(`/kitchen/orders/${orderId}/status`, { status });
    return response.data;
  },

  assignOrder: async (orderId: string, staffId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch(`/kitchen/orders/${orderId}/assign`, { staffId });
    return response.data;
  },

  // Kitchen metrics
  getKitchenMetrics: async (period?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/kitchen/metrics', { params: { period } });
    return response.data;
  }
};

// Inventory Management API
export const inventoryApi = {
  // Items
  getItems: async (params?: { 
    category?: string; 
    status?: string; 
    search?: string;
    page?: number; 
    limit?: number;
  }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/inventory/items', { params });
    return response.data;
  },

  createItem: async (itemData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/inventory/items', itemData);
    return response.data;
  },

  updateItem: async (itemId: string, itemData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/inventory/items/${itemId}`, itemData);
    return response.data;
  },

  deleteItem: async (itemId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/inventory/items/${itemId}`);
    return response.data;
  },

  updateStock: async (itemId: string, quantity: number, type: 'add' | 'remove'): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch(`/inventory/items/${itemId}/stock`, { quantity, type });
    return response.data;
  },

  // Suppliers
  getSuppliers: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/inventory/suppliers');
    return response.data;
  },

  createSupplier: async (supplierData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/inventory/suppliers', supplierData);
    return response.data;
  },

  updateSupplier: async (supplierId: string, supplierData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/inventory/suppliers/${supplierId}`, supplierData);
    return response.data;
  },

  // Purchase Orders
  getPurchaseOrders: async (params?: { status?: string; supplierId?: string }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/inventory/purchase-orders', { params });
    return response.data;
  },

  createPurchaseOrder: async (orderData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/inventory/purchase-orders', orderData);
    return response.data;
  },

  updatePurchaseOrderStatus: async (orderId: string, status: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch(`/inventory/purchase-orders/${orderId}/status`, { status });
    return response.data;
  },

  // Inventory metrics
  getInventoryMetrics: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/inventory/metrics');
    return response.data;
  },

  getLowStockAlerts: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/inventory/low-stock-alerts');
    return response.data;
  }
};

// Staff Management API
export const staffApi = {
  // Staff members
  getStaff: async (params?: { 
    role?: string; 
    department?: string; 
    status?: string; 
    search?: string;
    page?: number; 
    limit?: number;
  }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/staff/members', { params });
    return response.data;
  },

  createStaff: async (staffData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/staff/members', staffData);
    return response.data;
  },

  updateStaff: async (staffId: string, staffData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/staff/members/${staffId}`, staffData);
    return response.data;
  },

  updateStaffStatus: async (staffId: string, status: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch(`/staff/members/${staffId}/status`, { status });
    return response.data;
  },

  // Tasks
  getTasks: async (params?: { 
    assignedTo?: string; 
    status?: string; 
    priority?: string;
    page?: number; 
    limit?: number;
  }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/staff/tasks', { params });
    return response.data;
  },

  createTask: async (taskData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/staff/tasks', taskData);
    return response.data;
  },

  updateTask: async (taskId: string, taskData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/staff/tasks/${taskId}`, taskData);
    return response.data;
  },

  updateTaskStatus: async (taskId: string, status: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch(`/staff/tasks/${taskId}/status`, { status });
    return response.data;
  },

  // Schedules
  getSchedules: async (params?: { staffId?: string; date?: string; week?: string }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/staff/schedules', { params });
    return response.data;
  },

  createSchedule: async (scheduleData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/staff/schedules', scheduleData);
    return response.data;
  },

  updateSchedule: async (scheduleId: string, scheduleData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/staff/schedules/${scheduleId}`, scheduleData);
    return response.data;
  },

  // Staff metrics
  getStaffMetrics: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/staff/metrics');
    return response.data;
  },

  getAttendanceReport: async (params?: { staffId?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/staff/attendance', { params });
    return response.data;
  }
};

// RFID System API
export const rfidApi = {
  // RFID devices
  getDevices: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/rfid/devices');
    return response.data;
  },

  updateDeviceStatus: async (deviceId: string, status: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.patch(`/rfid/devices/${deviceId}/status`, { status });
    return response.data;
  },

  // RFID transactions
  getTransactions: async (params?: { 
    studentId?: string; 
    deviceId?: string; 
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number; 
    limit?: number;
  }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/rfid/transactions', { params });
    return response.data;
  },

  verifyRfidScan: async (scanData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/rfid/verify', scanData);
    return response.data;
  },

  // RFID metrics
  getRfidMetrics: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/rfid/metrics');
    return response.data;
  }
};

// Notifications API
export const notificationsApi = {
  // Get notifications
  getNotifications: async (params?: { 
    type?: string; 
    read?: boolean; 
    page?: number; 
    limit?: number;
  }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  markAsRead: async (notificationIds: string[]): Promise<ApiResponse<null>> => {
    const response = await apiClient.patch('/notifications/mark-read', { notificationIds });
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.patch('/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (notificationId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Notification settings
  getSettings: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/notifications/settings');
    return response.data;
  },

  updateSettings: async (settings: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put('/notifications/settings', settings);
    return response.data;
  }
};

// Menu Management API
export const menuApi = {
  // Menus
  getMenus: async (params?: { 
    date?: string; 
    category?: string; 
    active?: boolean;
    page?: number; 
    limit?: number;
  }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/menus', { params });
    return response.data;
  },

  createMenu: async (menuData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/menus', menuData);
    return response.data;
  },

  updateMenu: async (menuId: string, menuData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/menus/${menuId}`, menuData);
    return response.data;
  },

  deleteMenu: async (menuId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/menus/${menuId}`);
    return response.data;
  },

  // Menu items
  getMenuItems: async (menuId: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/menus/${menuId}/items`);
    return response.data;
  },

  addMenuItem: async (menuId: string, itemData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/menus/${menuId}/items`, itemData);
    return response.data;
  },

  updateMenuItem: async (menuId: string, itemId: string, itemData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/menus/${menuId}/items/${itemId}`, itemData);
    return response.data;
  },

  removeMenuItem: async (menuId: string, itemId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/menus/${menuId}/items/${itemId}`);
    return response.data;
  }
};

// Analytics API
export const analyticsApi = {
  // Dashboard analytics
  getDashboardMetrics: async (period?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/analytics/dashboard', { params: { period } });
    return response.data;
  },

  // Revenue analytics
  getRevenueAnalytics: async (params?: { 
    startDate?: string; 
    endDate?: string; 
    groupBy?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/analytics/revenue', { params });
    return response.data;
  },

  // Order analytics
  getOrderAnalytics: async (params?: { 
    startDate?: string; 
    endDate?: string; 
    groupBy?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/analytics/orders', { params });
    return response.data;
  },

  // Student analytics
  getStudentAnalytics: async (params?: { 
    grade?: string; 
    period?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/analytics/students', { params });
    return response.data;
  },

  // Performance reports
  getPerformanceReport: async (type: string, params?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/analytics/reports/${type}`, { params });
    return response.data;
  },

  // Export data
  exportData: async (type: string, params?: any): Promise<Blob> => {
    const response = await apiClient.get(`/analytics/export/${type}`, { 
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};

// File Upload API
export const fileApi = {
  uploadFile: async (file: File, category?: string): Promise<ApiResponse<{ url: string; filename: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);

    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadMultipleFiles: async (files: File[], category?: string): Promise<ApiResponse<Array<{ url: string; filename: string }>>> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (category) formData.append('category', category);

    const response = await apiClient.post('/files/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteFile: async (filename: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/files/${filename}`);
    return response.data;
  }
};

// WebSocket connection manager
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  connect(token?: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(WS_BASE_URL);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Send authentication token
        if (token) {
          this.send('auth', { token });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectInterval);
    }
  }

  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  subscribe(messageType: string, handler: (data: any) => void) {
    this.messageHandlers.set(messageType, handler);
  }

  unsubscribe(messageType: string) {
    this.messageHandlers.delete(messageType);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create singleton WebSocket manager
export const wsManager = new WebSocketManager();

// Initialize WebSocket connection on app start
export const initializeWebSocket = () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    wsManager.connect(token);
  }
};

// Error handler utility
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// API status checker
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/health');
    return response.data.status === 'ok';
  } catch (error) {
    return false;
  }
};

export default apiClient;
