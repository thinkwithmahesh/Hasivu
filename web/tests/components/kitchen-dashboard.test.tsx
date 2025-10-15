/**
 * Kitchen Dashboard Live Orders - Unit Tests
 * Epic 1 → Story 1: Kitchen Dashboard Live Orders System
 * Tests for KitchenManagementDashboard component functionality
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock the API integration hooks
const mockUseKitchenOrders = jest.fn();
const mockUseKitchenMetrics = jest.fn();
const mockUseOrderMutations = jest.fn();
const mockUseWebSocketConnection = jest.fn();
const mockUseWebSocketSubscription = jest.fn();

jest.mock('../../src/hooks/useApiIntegration', () => ({
  useKitchenOrders: () => mockUseKitchenOrders(),
  useKitchenMetrics: () => mockUseKitchenMetrics(),
  useOrderMutations: () => mockUseOrderMutations(),
  useStaffMembers: () => ({ data: [], loading: false, error: null }),
  useInventoryItems: () => ({ data: [], loading: false, error: null }),
  useLowStockAlerts: () => ({ data: [], loading: false, error: null }),
  useWebSocketConnection: () => mockUseWebSocketConnection(),
  useWebSocketSubscription: mockUseWebSocketSubscription,
}));

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import { KitchenManagementDashboard } from '../../src/components/kitchen/KitchenManagementDashboard';

// Mock data
const mockOrders = [
  {
    id: 'ORD-001',
    orderNumber: '#12341',
    studentName: 'Priya Sharma',
    studentId: 'STU-001',
    items: [
      {
        id: 'ITM-001',
        name: 'Masala Dosa',
        quantity: 1,
        category: 'Main',
        allergens: [],
        preparationTime: 12,
      },
    ],
    status: 'preparing' as const,
    priority: 'high' as const,
    orderTime: '2024-01-15T12:15:00Z',
    estimatedTime: 15,
    assignedStaff: 'Rajesh Kumar',
    location: 'Main Cafeteria',
    totalAmount: 125,
  },
  {
    id: 'ORD-002',
    orderNumber: '#12342',
    studentName: 'Arjun Patel',
    studentId: 'STU-002',
    items: [
      {
        id: 'ITM-003',
        name: 'Chicken Biryani',
        quantity: 1,
        category: 'Main',
        allergens: [],
        preparationTime: 25,
      },
    ],
    status: 'pending' as const,
    priority: 'medium' as const,
    orderTime: '2024-01-15T12:20:00Z',
    estimatedTime: 30,
    location: 'South Wing',
    totalAmount: 180,
  },
];

const mockMetrics = {
  ordersInProgress: 15,
  averagePreparationTime: 18.5,
  completionRate: 94.2,
  staffEfficiency: 88.3,
  dailyRevenue: 15420,
  customerSatisfaction: 4.6,
  lowStockItems: 3,
  activeStaff: 8,
};

describe('KitchenManagementDashboard', () => {
  const mockRefetch = jest.fn();
  const mockUpdateOrderStatus = jest.fn();
  const mockAssignOrder = jest.fn();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock returns
    mockUseKitchenOrders.mockReturnValue({
      data: mockOrders,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    mockUseKitchenMetrics.mockReturnValue({
      data: mockMetrics,
      loading: false,
      error: null,
    });

    mockUseOrderMutations.mockReturnValue({
      updateOrderStatus: mockUpdateOrderStatus,
      assignOrder: mockAssignOrder,
      loading: false,
      error: null,
    });

    mockUseWebSocketConnection.mockReturnValue({
      connected: true,
    });
  });

  describe('Component Rendering', () => {
    test('should render kitchen header with correct testid', () => {
      render(<KitchenManagementDashboard />);
      expect(screen.getByTestId('kitchen-header')).toBeInTheDocument();
      expect(screen.getByTestId('kitchen-header')).toHaveTextContent('Kitchen Management');
    });

    test('should display kitchen metrics correctly', () => {
      render(<KitchenManagementDashboard />);

      // Check metrics are displayed
      expect(screen.getByText('15')).toBeInTheDocument(); // ordersInProgress
      expect(screen.getByText('18.5min')).toBeInTheDocument(); // averagePreparationTime
      expect(screen.getByText('94.2%')).toBeInTheDocument(); // completionRate
      expect(screen.getByText('8')).toBeInTheDocument(); // activeStaff
    });

    test('should render all tabs correctly', () => {
      render(<KitchenManagementDashboard />);

      expect(screen.getByRole('tab', { name: 'Orders' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Staff' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Inventory' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Analytics' })).toBeInTheDocument();
    });
  });

  describe('Order Management', () => {
    test('should display orders in correct status columns', () => {
      render(<KitchenManagementDashboard />);

      // Check order cards are rendered
      expect(screen.getByText('#12341')).toBeInTheDocument();
      expect(screen.getByText('#12342')).toBeInTheDocument();
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      expect(screen.getByText('Arjun Patel')).toBeInTheDocument();
    });

    test('should categorize orders by status correctly', () => {
      render(<KitchenManagementDashboard />);

      // Check status columns show correct counts
      expect(screen.getByText('Pending (1)')).toBeInTheDocument();
      expect(screen.getByText('Preparing (1)')).toBeInTheDocument();
      expect(screen.getByText('Ready (0)')).toBeInTheDocument();
    });

    test('should handle refresh button click', async () => {
      const user = userEvent.setup();
      render(<KitchenManagementDashboard />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    test('should show skeleton loading when data is loading', () => {
      mockUseKitchenOrders.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: mockRefetch,
      });

      mockUseKitchenMetrics.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      render(<KitchenManagementDashboard />);

      // Should show skeleton elements
      expect(screen.getByTestId('kitchen-header')).not.toBeInTheDocument();
      // Should show loading skeletons instead
      expect(document.querySelectorAll('[class*="animate-pulse"]')).toHaveLength.greaterThan(0);
    });

    test('should disable refresh button when loading', () => {
      mockUseKitchenOrders.mockReturnValue({
        data: mockOrders,
        loading: true,
        error: null,
        refetch: mockRefetch,
      });

      render(<KitchenManagementDashboard />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    test('should display error alert when API fails', () => {
      mockUseKitchenOrders.mockReturnValue({
        data: null,
        loading: false,
        error: 'Failed to fetch orders',
        refetch: mockRefetch,
      });

      render(<KitchenManagementDashboard />);

      expect(screen.getByText('Failed to fetch orders')).toBeInTheDocument();
    });

    test('should fallback to mock data when API fails', () => {
      mockUseKitchenOrders.mockReturnValue({
        data: null,
        loading: false,
        error: 'API Error',
        refetch: mockRefetch,
      });

      render(<KitchenManagementDashboard />);

      // Should still render orders using fallback mock data
      expect(screen.getByTestId('kitchen-header')).toBeInTheDocument();
    });
  });

  describe('WebSocket Integration', () => {
    test('should show connection status when WebSocket is disconnected', () => {
      mockUseWebSocketConnection.mockReturnValue({
        connected: false,
      });

      render(<KitchenManagementDashboard />);

      expect(screen.getByText(/real-time connection lost/i)).toBeInTheDocument();
    });

    test('should not show connection warning when WebSocket is connected', () => {
      mockUseWebSocketConnection.mockReturnValue({
        connected: true,
      });

      render(<KitchenManagementDashboard />);

      expect(screen.queryByText(/real-time connection lost/i)).not.toBeInTheDocument();
    });

    test('should setup WebSocket subscriptions for order updates', () => {
      render(<KitchenManagementDashboard />);

      // Verify WebSocket subscriptions are registered
      expect(mockUseWebSocketSubscription).toHaveBeenCalledWith(
        'order_update',
        expect.any(Function)
      );
      expect(mockUseWebSocketSubscription).toHaveBeenCalledWith(
        'kitchen_alert',
        expect.any(Function)
      );
    });
  });

  describe('Real-time Updates', () => {
    test('should handle order status updates via WebSocket', async () => {
      let orderUpdateHandler: (data: any) => void;

      mockUseWebSocketSubscription.mockImplementation((messageType: string, handler: Function) => {
        if (messageType === 'order_update') {
          orderUpdateHandler = handler as (data: any) => void;
        }
      });

      render(<KitchenManagementDashboard />);

      // Simulate WebSocket order update
      act(() => {
        orderUpdateHandler!({
          orderNumber: '#12341',
          status: 'ready',
        });
      });

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });
  });

  describe('Tab Navigation', () => {
    test('should switch between tabs correctly', async () => {
      const user = userEvent.setup();
      render(<KitchenManagementDashboard />);

      // Initially should show Orders tab
      expect(screen.getByText('Pending (1)')).toBeInTheDocument();

      // Click Staff tab
      await user.click(screen.getByRole('tab', { name: 'Staff' }));
      expect(screen.queryByText('Pending (1)')).not.toBeInTheDocument();

      // Click back to Orders tab
      await user.click(screen.getByRole('tab', { name: 'Orders' }));
      expect(screen.getByText('Pending (1)')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper accessibility attributes', () => {
      render(<KitchenManagementDashboard />);

      // Check header has correct heading level
      const header = screen.getByTestId('kitchen-header');
      expect(header.tagName).toBe('H1');

      // Check tabs have proper roles
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(4);
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<KitchenManagementDashboard />);

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: /refresh/i })).toHaveFocus();
    });
  });
});
