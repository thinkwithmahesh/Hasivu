# HASIVU Platform - Frontend-Backend Integration Architecture

## 🏗️ Architecture Overview

This document outlines the comprehensive integration strategy for connecting ShadCN UI components with the HASIVU backend services running on localhost:3000.

### Backend Services Available

- **API Server**: Express.js with TypeScript (localhost:3000)
- **Socket.IO**: Real-time WebSocket server
- **Database**: PostgreSQL with Prisma ORM
- **Redis**: Session and caching layer
- **Authentication**: JWT-based with refresh tokens
- **Payment Gateway**: Razorpay integration
- **RFID System**: Device and card management
- **Notifications**: Multi-channel (WhatsApp, Email, Push)

---

## 🔗 API Integration Layer

### 1. Enhanced API Client Configuration

```typescript
// src/lib/api-client.ts
import axios, { AxiosInstance } from 'axios';
import { toast } from 'react-hot-toast';

interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

const config: ApiConfig = {
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.WEB_INTEGRATION_ARCHITECTURE_PASSWORD_1,
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
};

class EnhancedApiClient {
  private client: AxiosInstance;
  private refreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      withCredentials: true, // For cookie-based sessions
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async config => {
        const token = this.getStoredToken();
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor with automatic token refresh
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.refreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          } finally {
            this.refreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    const response = await axios.post(
      `${config.baseURL}/auth/refresh`,
      {},
      { withCredentials: true }
    );

    const newToken = response.data.accessToken;
    this.setStoredToken(newToken);
    return newToken;
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token!);
      }
    });

    this.failedQueue = [];
  }

  private handleAuthFailure() {
    this.clearStoredToken();
    window.location.href = '/auth/login?reason=session_expired';
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private setStoredToken(token: string) {
    localStorage.setItem('accessToken', token);
  }

  private clearStoredToken() {
    localStorage.removeItem('accessToken');
  }
}

export const apiClient = new EnhancedApiClient();
```

### 2. Service Layer Architecture

```typescript
// src/services/AuthService.ts
export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);

    // Store tokens
    localStorage.setItem('accessToken', response.data.tokens.accessToken);
    localStorage.setItem('refreshToken', response.data.tokens.refreshToken);

    return response.data;
  }

  static async register(userData: RegisterData): Promise<AuthResponse> {
    return apiClient.post('/auth/register', userData);
  }

  static async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  static async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get('/auth/me');
    return response.data.user;
  }
}

// src/services/MenuService.ts
export class MenuService {
  static async getCategories(): Promise<MenuCategory[]> {
    const response = await apiClient.get('/meals/categories');
    return response.data;
  }

  static async getMenuItems(categoryId?: string): Promise<MenuItem[]> {
    const params = categoryId ? { category: categoryId } : {};
    const response = await apiClient.get('/meals/items', { params });
    return response.data;
  }

  static async getNutritionInfo(itemId: string): Promise<NutritionInfo> {
    const response = await apiClient.get(`/meals/nutrition/${itemId}`);
    return response.data;
  }
}

// src/services/OrderService.ts
export class OrderService {
  static async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const response = await apiClient.post('/orders/create', orderData);
    return response.data;
  }

  static async getOrderHistory(
    pagination?: PaginationParams
  ): Promise<PaginatedOrders> {
    const response = await apiClient.get('/orders/history', {
      params: pagination,
    });
    return response.data;
  }

  static async trackOrder(orderId: string): Promise<OrderTracking> {
    const response = await apiClient.get(`/orders/track/${orderId}`);
    return response.data;
  }

  static async cancelOrder(orderId: string): Promise<void> {
    await apiClient.patch(`/orders/${orderId}/cancel`);
  }
}

// src/services/PaymentService.ts
export class PaymentService {
  static async initializePayment(
    orderData: PaymentRequest
  ): Promise<RazorpayOrder> {
    const response = await apiClient.post('/payments/initialize', orderData);
    return response.data;
  }

  static async verifyPayment(
    verificationData: PaymentVerification
  ): Promise<PaymentResult> {
    const response = await apiClient.post('/payments/verify', verificationData);
    return response.data;
  }

  static async getWalletBalance(): Promise<WalletBalance> {
    const response = await apiClient.get('/payments/wallet');
    return response.data;
  }
}
```

---

## 🔄 Real-time Integration with Socket.IO

### Enhanced Socket Client

```typescript
// src/lib/socket-client.ts
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

interface SocketEvents {
  // Order events
  order_status_update: (data: {
    orderId: string;
    status: string;
    timestamp: string;
  }) => void;
  order_created: (data: { orderId: string; userId: string }) => void;

  // Payment events
  payment_success: (data: {
    orderId: string;
    transactionId: string;
    amount: number;
  }) => void;
  payment_failed: (data: { orderId: string; error: string }) => void;

  // Delivery events
  delivery_started: (data: { orderId: string; estimatedTime: string }) => void;
  delivery_completed: (data: {
    orderId: string;
    rfidVerified: boolean;
  }) => void;

  // Notifications
  notification: (data: {
    type: string;
    message: string;
    title: string;
  }) => void;
}

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, Set<Function>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
      {
        auth: { token },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
      }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      toast.success('Connected to real-time updates');
    });

    this.socket.on('disconnect', reason => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', error => {
      console.error('Socket connection error:', error);
      this.handleReconnection();
    });

    // Event forwarding to subscribers
    this.socket.onAny((event, data) => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.forEach(listener => listener(data));
      }
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;

      setTimeout(() => {
        console.log(`Reconnection attempt ${this.reconnectAttempts}`);
        this.socket?.connect();
      }, delay);
    } else {
      toast.error('Unable to maintain real-time connection');
    }
  }

  subscribe<T extends keyof SocketEvents>(
    event: T,
    callback: SocketEvents[T]
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(event);
        }
      }
    };
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.eventListeners.clear();
  }
}

export const socketClient = new SocketClient();
```

### React Hook Integration

```typescript
// src/hooks/useSocket.ts
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { socketClient } from '@/lib/socket-client';

export function useSocket() {
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      socketClient.connect(token);
    } else {
      socketClient.disconnect();
    }

    return () => socketClient.disconnect();
  }, [isAuthenticated, token]);

  const subscribe = useCallback((event: string, callback: Function) => {
    return socketClient.subscribe(event, callback);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketClient.emit(event, data);
  }, []);

  return { subscribe, emit };
}

// src/hooks/useOrderUpdates.ts
export function useOrderUpdates(orderId?: string) {
  const { subscribe } = useSocket();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribeStatus = subscribe('order_status_update', (data: any) => {
      if (!orderId || data.orderId === orderId) {
        dispatch(updateOrderStatus(data));
        toast.success(`Order ${data.status}`);
      }
    });

    const unsubscribeDelivery = subscribe('delivery_completed', (data: any) => {
      if (!orderId || data.orderId === orderId) {
        dispatch(markOrderDelivered(data));
        toast.success('Order delivered successfully!');
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeDelivery();
    };
  }, [orderId, subscribe, dispatch]);
}
```

---

## 🔐 Authentication Flow Integration

### Enhanced Auth Context

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthService } from '@/services/AuthService';
import { socketClient } from '@/lib/socket-client';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

function authReducer(state: AuthState, action: any): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return { ...state, isLoading: true, error: null };

    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.tokens.accessToken,
        refreshToken: action.payload.tokens.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isAuthenticated: false,
      };

    case 'LOGOUT':
      return {
        ...initialState,
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await AuthService.login(credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });

      // Connect to socket after successful login
      socketClient.connect(response.tokens.accessToken);
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    dispatch({ type: 'REGISTER_START' });
    try {
      const response = await AuthService.register(userData);
      dispatch({ type: 'REGISTER_SUCCESS', payload: response });

      socketClient.connect(response.tokens.accessToken);
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      socketClient.disconnect();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshAuth = async () => {
    try {
      const profile = await AuthService.getProfile();
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: profile,
          tokens: {
            accessToken: state.token,
            refreshToken: state.refreshToken
          }
        }
      });
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Auto-login on mount if tokens exist
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (token && refreshToken) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: null, // Will be fetched by refreshAuth
          tokens: { accessToken: token, refreshToken },
        },
      });
      refreshAuth();
    }
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

## 🗄️ State Management Integration

### Enhanced Redux Slices

```typescript
// src/store/slices/orderSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { OrderService } from '@/services/OrderService';

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params?: PaginationParams) => {
    const response = await OrderService.getOrderHistory(params);
    return response;
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: CreateOrderRequest) => {
    const response = await OrderService.createOrder(orderData);
    return response;
  }
);

export const trackOrder = createAsyncThunk(
  'orders/trackOrder',
  async (orderId: string) => {
    const response = await OrderService.trackOrder(orderId);
    return response;
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    currentOrder: null,
    tracking: {},
    loading: false,
    error: null,
  },
  reducers: {
    updateOrderStatus: (state, action) => {
      const { orderId, status, estimatedTime } = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        order.status = status;
        order.estimatedTime = estimatedTime;
      }
    },
    markOrderDelivered: (state, action) => {
      const { orderId, deliveredAt, rfidVerified } = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        order.status = 'delivered';
        order.deliveredAt = deliveredAt;
        order.rfidVerified = rfidVerified;
      }
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders = action.payload.orders;
        state.loading = false;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload);
        state.currentOrder = action.payload;
        state.loading = false;
      })
      .addCase(trackOrder.fulfilled, (state, action) => {
        state.tracking[action.payload.orderId] = action.payload;
        state.loading = false;
      });
  },
});

export const { updateOrderStatus, markOrderDelivered, clearError } =
  orderSlice.actions;
export default orderSlice.reducer;

// src/store/slices/menuSlice.ts
export const fetchMenuItems = createAsyncThunk(
  'menu/fetchMenuItems',
  async (categoryId?: string) => {
    const response = await MenuService.getMenuItems(categoryId);
    return response;
  }
);

export const fetchCategories = createAsyncThunk(
  'menu/fetchCategories',
  async () => {
    const response = await MenuService.getCategories();
    return response;
  }
);
```

---

## ⚠️ Error Handling & Recovery

### Comprehensive Error Boundaries

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 text-red-500">
                <AlertTriangle size={48} />
              </div>
              <CardTitle className="text-red-600">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// src/hooks/useErrorHandler.ts
export function useErrorHandler() {
  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Error in ${context}:`, error);

    let message = 'An unexpected error occurred';

    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }

    toast.error(message);
  }, []);

  return { handleError };
}
```

---

## 🚀 Performance Optimization

### React Query Integration

```typescript
// src/lib/react-query.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

// src/hooks/useMenuData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuService } from '@/services/MenuService';

export function useMenuItems(categoryId?: string) {
  return useQuery({
    queryKey: ['menuItems', categoryId],
    queryFn: () => MenuService.getMenuItems(categoryId),
    enabled: true,
    staleTime: 10 * 60 * 1000, // Menu items are relatively stable
  });
}

export function useMenuCategories() {
  return useQuery({
    queryKey: ['menuCategories'],
    queryFn: MenuService.getCategories,
    staleTime: 15 * 60 * 1000, // Categories change rarely
  });
}

// src/hooks/useOrders.ts
export function useOrders(params?: PaginationParams) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => OrderService.getOrderHistory(params),
    keepPreviousData: true,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: OrderService.createOrder,
    onSuccess: newOrder => {
      queryClient.invalidateQueries(['orders']);
      queryClient.setQueryData(['orders', newOrder.id], newOrder);
    },
  });
}
```

### Caching Strategies

```typescript
// src/lib/cache.ts
class CacheManager {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();

  set(key: string, data: any, ttl = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  invalidate(pattern: string) {
    const keys = Array.from(this.cache.keys()).filter(key =>
      key.includes(pattern)
    );
    keys.forEach(key => this.cache.delete(key));
  }

  clear() {
    this.cache.clear();
  }
}

export const cacheManager = new CacheManager();
```

---

## 🎨 ShadCN Component Integration Examples

### Enhanced Login Component

```typescript
// src/components/auth/LoginForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch (error) {
      // Error is handled by AuthContext
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your HASIVU account to order meals
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rememberMe"
              {...register('rememberMe')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="rememberMe" className="text-sm">
              Remember me
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Order Tracking Component

```typescript
// src/components/orders/OrderTracker.tsx
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Truck, MapPin } from 'lucide-react';
import { useOrderUpdates } from '@/hooks/useOrderUpdates';
import { useSocket } from '@/hooks/useSocket';

const statusSteps = [
  { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', icon: Clock },
  { key: 'ready', label: 'Ready for Pickup', icon: CheckCircle },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
];

export function OrderTracker({ orderId }: { orderId: string }) {
  const { subscribe } = useSocket();
  useOrderUpdates(orderId);

  const currentOrder = useAppSelector(state =>
    state.orders.orders.find(order => order.id === orderId)
  );

  const currentStepIndex = statusSteps.findIndex(
    step => step.key === currentOrder?.status
  );

  const progress = currentStepIndex >= 0 ? ((currentStepIndex + 1) / statusSteps.length) * 100 : 0;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Order #{orderId.slice(-8)}</span>
          <Badge variant={currentOrder?.status === 'delivered' ? 'default' : 'secondary'}>
            {currentOrder?.status?.replace('_', ' ').toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-4">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div
                key={step.key}
                className={`flex items-center space-x-3 ${
                  isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    isCompleted
                      ? 'bg-green-100 border-green-500'
                      : 'border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${isCurrent ? 'text-blue-600' : ''}`}>
                    {step.label}
                  </p>
                  {isCurrent && currentOrder?.estimatedTime && (
                    <p className="text-sm text-gray-500">
                      Est. completion: {new Date(currentOrder.estimatedTime).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {currentOrder?.rfidVerified && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 font-medium">
              ✅ Delivery verified with RFID
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 🔧 Development Setup

### Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_RAZORPAY_KEY=your_razorpay_key
NEXT_PUBLIC_APP_ENV=development
```

### Main App Setup

```typescript
// src/pages/_app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'react-hot-toast';

import { store, persistor } from '@/store';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { queryClient } from '@/lib/react-query';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <Component {...pageProps} />
              <Toaster position="top-right" />
            </AuthProvider>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}
```

---

## 📱 Mobile-First Responsive Design

### Responsive Hooks

```typescript
// src/hooks/useResponsive.ts
import { useState, useEffect } from 'react';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useResponsive() {
  const [screenSize, setScreenSize] = useState<keyof typeof breakpoints>('sm');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;

      if (width >= breakpoints['2xl']) setScreenSize('2xl');
      else if (width >= breakpoints.xl) setScreenSize('xl');
      else if (width >= breakpoints.lg) setScreenSize('lg');
      else if (width >= breakpoints.md) setScreenSize('md');
      else setScreenSize('sm');
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return {
    screenSize,
    isMobile: screenSize === 'sm',
    isTablet: screenSize === 'md',
    isDesktop: screenSize >= 'lg',
    isLarge: screenSize >= 'xl',
  };
}
```

---

## 🔒 Security Best Practices

### CSRF Protection

```typescript
// src/lib/csrf.ts
export class CSRFManager {
  private static token: string | null = null;

  static async getToken(): Promise<string> {
    if (!this.token) {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      this.token = data.csrfToken;
    }
    return this.token;
  }

  static async attachToRequest(config: any) {
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase())
    ) {
      const token = await this.getToken();
      config.headers['X-CSRF-Token'] = token;
    }
    return config;
  }
}
```

### Input Sanitization

```typescript
// src/lib/sanitization.ts
import DOMPurify from 'dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}
```

---

This comprehensive integration architecture provides:

✅ **Complete API Integration** - Service layers with authentication, error handling, and retry logic  
✅ **Real-time Features** - Socket.IO integration with automatic reconnection  
✅ **State Management** - Redux Toolkit with proper async actions  
✅ **Error Recovery** - Comprehensive error boundaries and retry mechanisms  
✅ **Performance** - React Query for caching and background updates  
✅ **Security** - CSRF protection, input sanitization, and secure token handling  
✅ **Mobile-First** - Responsive design with ShadCN components  
✅ **Type Safety** - Full TypeScript integration with proper typing

The architecture ensures seamless integration between your ShadCN frontend and the HASIVU backend services, providing a robust foundation for the school food delivery platform.
