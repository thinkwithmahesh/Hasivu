// React hooks for API integration and data management
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  kitchenApi,
  inventoryApi,
  staffApi,
  notificationsApi,
  userApi,
  rfidApi,
  analyticsApi,
  wsManager,
  handleApiError,
} from '../services/api';

// Generic hook for API data fetching with loading, error, and caching
export function useApiData<T>(
  apiCall: () => Promise<{ data: T }>,
  dependencies: any[] = [],
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data);
      options?.onSuccess?.(response.data);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      options?.onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiCall, options?.onSuccess, options?.onError]);

  useEffect(() => {
    if (options?.enabled !== false) {
      fetchData();
    }

    // Setup auto-refetch interval
    if (options?.refetchInterval && options.refetchInterval > 0) {
      intervalRef.current = setInterval(fetchData, options.refetchInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, options?.refetchInterval, options?.enabled]);

  // Separate effect for dependency changes to prevent infinite loops
  useEffect(() => {
    if (options?.enabled !== false) {
      fetchData();
    }
  }, dependencies);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Kitchen Management Hooks
export function useKitchenOrders(filters?: any) {
  return useApiData(
    () => kitchenApi.getOrders(filters),
    [filters],
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );
}

export function useKitchenMetrics(period?: string) {
  return useApiData(
    () => kitchenApi.getKitchenMetrics(period),
    [period],
    { refetchInterval: 60000 } // Refetch every minute
  );
}

export function useOrderMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await kitchenApi.updateOrderStatus(orderId, status);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignOrder = useCallback(async (orderId: string, staffId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await kitchenApi.assignOrder(orderId, staffId);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (orderData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await kitchenApi.createOrder(orderData);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateOrderStatus,
    assignOrder,
    createOrder,
    loading,
    error,
  };
}

// Inventory Management Hooks
export function useInventoryItems(filters?: any) {
  return useApiData(
    () => inventoryApi.getItems(filters),
    [filters],
    { refetchInterval: 120000 } // Refetch every 2 minutes
  );
}

export function useInventorySuppliers() {
  return useApiData(
    () => inventoryApi.getSuppliers(),
    [],
    { refetchInterval: 300000 } // Refetch every 5 minutes
  );
}

export function usePurchaseOrders(filters?: any) {
  return useApiData(() => inventoryApi.getPurchaseOrders(filters), [filters], {
    refetchInterval: 120000,
  });
}

export function useInventoryMetrics() {
  return useApiData(() => inventoryApi.getInventoryMetrics(), [], { refetchInterval: 60000 });
}

export function useLowStockAlerts() {
  return useApiData(
    () => inventoryApi.getLowStockAlerts(),
    [],
    { refetchInterval: 30000 } // Check frequently for stock alerts
  );
}

export function useInventoryMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createItem = useCallback(async (itemData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryApi.createItem(itemData);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (itemId: string, itemData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryApi.updateItem(itemId, itemData);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStock = useCallback(
    async (itemId: string, quantity: number, type: 'add' | 'remove') => {
      try {
        setLoading(true);
        setError(null);
        const response = await inventoryApi.updateStock(itemId, quantity, type);
        return response.data;
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createPurchaseOrder = useCallback(async (orderData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryApi.createPurchaseOrder(orderData);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePurchaseOrderStatus = useCallback(async (orderId: string, status: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryApi.updatePurchaseOrderStatus(orderId, status);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createItem,
    updateItem,
    updateStock,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    loading,
    error,
  };
}

// Staff Management Hooks
export function useStaffMembers(filters?: any) {
  return useApiData(
    () => staffApi.getStaff(filters),
    [filters],
    { refetchInterval: 180000 } // Refetch every 3 minutes
  );
}

export function useStaffTasks(filters?: any) {
  return useApiData(() => staffApi.getTasks(filters), [filters], { refetchInterval: 60000 });
}

export function useStaffSchedules(filters?: any) {
  return useApiData(
    () => staffApi.getSchedules(filters),
    [filters],
    { refetchInterval: 300000 } // Refetch every 5 minutes
  );
}

export function useStaffMetrics() {
  return useApiData(() => staffApi.getStaffMetrics(), [], { refetchInterval: 180000 });
}

export function useStaffMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStaff = useCallback(async (staffData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await staffApi.createStaff(staffData);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStaff = useCallback(async (staffId: string, staffData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await staffApi.updateStaff(staffId, staffData);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStaffStatus = useCallback(async (staffId: string, status: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await staffApi.updateStaffStatus(staffId, status);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (taskData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await staffApi.createTask(taskData);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await staffApi.updateTaskStatus(taskId, status);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSchedule = useCallback(async (scheduleData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await staffApi.createSchedule(scheduleData);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createStaff,
    updateStaff,
    updateStaffStatus,
    createTask,
    updateTaskStatus,
    createSchedule,
    loading,
    error,
  };
}

// Notifications Hooks
export function useNotifications(filters?: any) {
  return useApiData(
    () => notificationsApi.getNotifications(filters),
    [filters],
    { refetchInterval: 15000 } // Refetch every 15 seconds
  );
}

export function useNotificationSettings() {
  return useApiData(() => notificationsApi.getSettings(), []);
}

export function useNotificationMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      await notificationsApi.markAsRead(notificationIds);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await notificationsApi.markAllAsRead();
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      setLoading(true);
      setError(null);
      await notificationsApi.deleteNotification(notificationId);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (settings: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationsApi.updateSettings(settings);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings,
    loading,
    error,
  };
}

// Authentication Hooks
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing auth token on mount
    const token = localStorage.getItem('authToken');
    if (token) {
      userApi
        .getProfile()
        .then(response => {
          setUser(response.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('authToken');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userApi.login(credentials);
      localStorage.setItem('authToken', response.data.token);
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await userApi.logout();
    } catch (err) {
    } finally {
      setUser(null);
      localStorage.removeItem('authToken');
    }
  }, []);

  const register = useCallback(async (userData: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userApi.register(userData);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };
}

// WebSocket hooks for real-time updates
export function useWebSocketConnection() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !wsManager.isConnected()) {
      wsManager.connect(token);
    }

    // Monitor connection status
    const checkConnection = () => {
      setConnected(wsManager.isConnected());
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection(); // Initial check

    return () => clearInterval(interval);
  }, []);

  return { connected };
}

export function useWebSocketSubscription<T>(messageType: string, handler: (data: T) => void) {
  const handlerRef = useRef(handler);

  // Update the ref when handler changes to avoid re-subscriptions
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const stableHandler = (data: T) => handlerRef.current(data);
    wsManager.subscribe(messageType, stableHandler);
    return () => wsManager.unsubscribe(messageType);
  }, [messageType]); // Only re-subscribe when messageType changes
}

// Analytics Hooks
export function useDashboardAnalytics(period?: string) {
  return useApiData(
    () => analyticsApi.getDashboardMetrics(period),
    [period],
    { refetchInterval: 300000 } // Refetch every 5 minutes
  );
}

// RFID System Hooks
export function useRfidDevices() {
  return useApiData(() => rfidApi.getDevices(), [], { refetchInterval: 60000 });
}

export function useRfidTransactions(filters?: any) {
  return useApiData(() => rfidApi.getTransactions(filters), [filters], { refetchInterval: 30000 });
}

export function useRfidMetrics() {
  return useApiData(() => rfidApi.getRfidMetrics(), [], { refetchInterval: 60000 });
}
