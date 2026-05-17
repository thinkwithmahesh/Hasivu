import { act, renderHook, waitFor } from '@testing-library/react';
import {
  useApiData,
  useAuth,
  useInventoryMutations,
  useKitchenOrders,
  useNotificationMutations,
  useOrderMutations,
  useWebSocketConnection,
  useWebSocketSubscription,
} from '../useApiIntegration';
import {
  handleApiError,
  inventoryApi,
  kitchenApi,
  notificationsApi,
  userApi,
  wsManager,
} from '../../services/api';

jest.mock('../../services/api', () => ({
  kitchenApi: {
    getOrders: jest.fn(),
    getKitchenMetrics: jest.fn(),
    getKitchenStaff: jest.fn(),
    updateOrderStatus: jest.fn(),
    assignOrder: jest.fn(),
    createOrder: jest.fn(),
  },
  inventoryApi: {
    getItems: jest.fn(),
    getSuppliers: jest.fn(),
    getPurchaseOrders: jest.fn(),
    getInventoryMetrics: jest.fn(),
    getLowStockAlerts: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    updateStock: jest.fn(),
    createPurchaseOrder: jest.fn(),
    updatePurchaseOrderStatus: jest.fn(),
  },
  staffApi: {
    getStaff: jest.fn(),
    getTasks: jest.fn(),
    getSchedules: jest.fn(),
    getStaffMetrics: jest.fn(),
    createStaff: jest.fn(),
    updateStaff: jest.fn(),
    updateStaffStatus: jest.fn(),
    createTask: jest.fn(),
    updateTaskStatus: jest.fn(),
    createSchedule: jest.fn(),
  },
  notificationsApi: {
    getNotifications: jest.fn(),
    getSettings: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    updateSettings: jest.fn(),
  },
  userApi: {
    getProfile: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  },
  rfidApi: {},
  analyticsApi: {
    getDashboardMetrics: jest.fn(),
  },
  wsManager: {
    isEnabled: jest.fn(() => false),
    isConnected: jest.fn(),
    connect: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
  handleApiError: jest.fn((error: unknown) =>
    error instanceof Error ? error.message : 'API request failed'
  ),
}));

const mockedKitchenApi = kitchenApi as jest.Mocked<typeof kitchenApi>;
const mockedInventoryApi = inventoryApi as jest.Mocked<typeof inventoryApi>;
const mockedNotificationsApi = notificationsApi as jest.Mocked<typeof notificationsApi>;
const mockedUserApi = userApi as jest.Mocked<typeof userApi>;
const mockedWsManager = wsManager as jest.Mocked<typeof wsManager>;
const mockedHandleApiError = handleApiError as jest.Mock;

describe('useApiIntegration hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedHandleApiError.mockImplementation((error: unknown) =>
      error instanceof Error ? error.message : 'API request failed'
    );
  });

  describe('useApiData', () => {
    it('loads data and exposes a manual refetch path', async () => {
      const apiCall = jest
        .fn()
        .mockResolvedValueOnce({ data: ['first'] })
        .mockResolvedValueOnce({ data: ['second'] });
      const onSuccess = jest.fn();

      const { result } = renderHook(() =>
        useApiData(apiCall, [], { onSuccess })
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data).toEqual(['first']);
      expect(result.current.error).toBeNull();
      expect(onSuccess).toHaveBeenCalledWith(['first']);

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => expect(result.current.data).toEqual(['second']));
      expect(apiCall).toHaveBeenCalledTimes(2);
    });

    it('captures handled API errors and calls onError', async () => {
      const apiCall = jest.fn().mockRejectedValue(new Error('Meal service down'));
      const onError = jest.fn();

      const { result } = renderHook(() =>
        useApiData(apiCall, [], { onError })
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Meal service down');
      expect(onError).toHaveBeenCalledWith('Meal service down');
    });

    it('does not fetch when explicitly disabled', async () => {
      const apiCall = jest.fn().mockResolvedValue({ data: ['hidden'] });

      const { result } = renderHook(() =>
        useApiData(apiCall, [], { enabled: false })
      );

      expect(apiCall).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
    });
  });

  describe('kitchen and order hooks', () => {
    it('passes filters to kitchen order polling', async () => {
      mockedKitchenApi.getOrders.mockResolvedValue({
        data: [{ id: 'order-1' }],
        success: true,
        message: 'ok',
        timestamp: 'now',
      } as never);

      const filters = { status: 'PREPARING' };
      const { result } = renderHook(() => useKitchenOrders(filters));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockedKitchenApi.getOrders).toHaveBeenCalledWith(filters);
      expect(result.current.data).toEqual([{ id: 'order-1' }]);
    });

    it('returns successful mutation data and resets loading state', async () => {
      mockedKitchenApi.updateOrderStatus.mockResolvedValue({
        data: { id: 'order-1', status: 'READY' },
        success: true,
        message: 'ok',
        timestamp: 'now',
      } as never);

      const { result } = renderHook(() => useOrderMutations());

      await act(async () => {
        const response = await result.current.updateOrderStatus('order-1', 'READY');
        expect(response).toEqual({ id: 'order-1', status: 'READY' });
      });

      expect(mockedKitchenApi.updateOrderStatus).toHaveBeenCalledWith('order-1', 'READY');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('surfaces mutation errors for callers and UI state', async () => {
      mockedKitchenApi.assignOrder.mockRejectedValue(new Error('Staff unavailable'));

      const { result } = renderHook(() => useOrderMutations());

      await act(async () => {
        await expect(result.current.assignOrder('order-1', 'staff-1')).rejects.toThrow(
          'Staff unavailable'
        );
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Staff unavailable');
    });
  });

  describe('operational mutation hooks', () => {
    it('creates inventory items and updates stock through typed API wrappers', async () => {
      mockedInventoryApi.createItem.mockResolvedValue({
        data: { id: 'item-1', name: 'Rice', status: 'ACTIVE' },
        success: true,
        message: 'ok',
        timestamp: 'now',
      } as never);
      mockedInventoryApi.updateStock.mockResolvedValue({
        data: { id: 'item-1', quantity: 42 },
        success: true,
        message: 'ok',
        timestamp: 'now',
      } as never);

      const { result } = renderHook(() => useInventoryMutations());

      await act(async () => {
        await expect(result.current.createItem({ name: 'Rice' })).resolves.toEqual({
          id: 'item-1',
          name: 'Rice',
          status: 'ACTIVE',
        });
        await expect(result.current.updateStock('item-1', 10, 'add')).resolves.toEqual({
          id: 'item-1',
          quantity: 42,
        });
      });

      expect(mockedInventoryApi.createItem).toHaveBeenCalledWith({ name: 'Rice' });
      expect(mockedInventoryApi.updateStock).toHaveBeenCalledWith('item-1', 10, 'add');
      expect(result.current.error).toBeNull();
    });

    it('marks notifications as read and stores handled failures', async () => {
      mockedNotificationsApi.markAsRead.mockResolvedValue(undefined as never);
      mockedNotificationsApi.deleteNotification.mockRejectedValue(new Error('Delete blocked'));

      const { result } = renderHook(() => useNotificationMutations());

      await act(async () => {
        await result.current.markAsRead(['notification-1']);
      });

      expect(mockedNotificationsApi.markAsRead).toHaveBeenCalledWith(['notification-1']);

      await act(async () => {
        await expect(result.current.deleteNotification('notification-1')).rejects.toThrow(
          'Delete blocked'
        );
      });

      expect(result.current.error).toBe('Delete blocked');
    });
  });

  describe('auth hook', () => {
    it('hydrates profile and exposes authenticated state', async () => {
      mockedUserApi.getProfile.mockResolvedValue({
        data: {
          id: 'user-1',
          email: 'parent.demo@hasivu.local',
          name: 'Demo Parent',
          role: 'PARENT',
          status: 'ACTIVE',
          createdAt: 'now',
          updatedAt: 'now',
        },
        success: true,
        message: 'ok',
        timestamp: 'now',
      } as never);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('parent.demo@hasivu.local');
    });

    it('updates auth state on login and clears it on logout', async () => {
      mockedUserApi.getProfile.mockRejectedValue(new Error('unauthenticated'));
      mockedUserApi.login.mockResolvedValue({
        data: {
          user: {
            id: 'admin-1',
            email: 'admin.demo@hasivu.local',
            name: 'Demo Admin',
            role: 'ADMIN',
            status: 'ACTIVE',
            createdAt: 'now',
            updatedAt: 'now',
          },
        },
        success: true,
        message: 'ok',
        timestamp: 'now',
      } as never);
      mockedUserApi.logout.mockResolvedValue({
        data: null,
        success: true,
        message: 'ok',
        timestamp: 'now',
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.login({
          email: 'admin.demo@hasivu.local',
          password: 'Hasivu123!',
        });
      });

      expect(result.current.user?.role).toBe('ADMIN');
      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('websocket hooks', () => {
    beforeEach(() => {
      mockedWsManager.isEnabled.mockReturnValue(true);
    });

    it('connects once and reports connection status', () => {
      mockedWsManager.isConnected
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const { result, unmount } = renderHook(() => useWebSocketConnection());

      expect(mockedWsManager.connect).toHaveBeenCalledTimes(1);
      expect(result.current.connected).toBe(true);

      unmount();
    });

    it('subscribes and unsubscribes by message type', () => {
      const handler = jest.fn();
      const { unmount } = renderHook(() =>
        useWebSocketSubscription<{ id: string }>('order.updated', handler)
      );

      const subscribedHandler = mockedWsManager.subscribe.mock.calls[0]?.[1] as
        | ((data: unknown) => void)
        | undefined;
      subscribedHandler?.({ id: 'order-1' });

      expect(mockedWsManager.subscribe).toHaveBeenCalledWith(
        'order.updated',
        expect.any(Function)
      );
      expect(handler).toHaveBeenCalledWith({ id: 'order-1' });

      unmount();
      expect(mockedWsManager.unsubscribe).toHaveBeenCalledWith('order.updated');
    });
  });
});
