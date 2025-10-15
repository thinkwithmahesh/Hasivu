'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '../ErrorBoundary';

// Hooks for backend integration
import {
  useKitchenOrders,
  useOrderMutations,
  useWebSocketSubscription,
  useWebSocketConnection,
} from '@/hooks/useApiIntegration';

// Import modular components and utilities
import { WorkflowOrder } from './types';
import { workflowColumns } from './config';
import { WorkflowColumn } from './WorkflowColumn';
import { mapApiOrdersToWorkflowOrders } from './utils';

// Main Order Workflow Board Component
export const OrderWorkflowBoard: React.FC = () => {
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Fetch all orders from backend
  const { data: apiOrders, loading, error, refetch } = useKitchenOrders();
  const { updateOrderStatus, loading: _mutating } = useOrderMutations();
  const { connected } = useWebSocketConnection();

  // WebSocket real-time updates
  useWebSocketSubscription(
    'order_update',
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => refetch(), 30000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, refetch]);

  // Map API orders to workflow shape with safe defaults
  const orders: WorkflowOrder[] = useMemo(() => {
    return mapApiOrdersToWorkflowOrders(apiOrders || []);
  }, [apiOrders]);

  const handleStatusChange = async (orderId: string, newStatus: WorkflowOrder['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      refetch();
    } catch (e) {
      // Error toast handled in hook; keep UI stable
    }
  };

  // Group orders by status
  const ordersByStatus = useMemo(
    () =>
      workflowColumns.reduce(
        (acc, column) => {
          acc[column.id] = orders.filter(order => order.status === column.id);
          return acc;
        },
        {} as Record<string, WorkflowOrder[]>
      ),
    [orders]
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Workflow Board</h1>
              <p className="text-gray-600">Drag and drop orders to update their status</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant={isAutoRefresh ? 'default' : 'outline'}
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isAutoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </Button>
              <Button variant="outline" onClick={() => refetch()} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
              <Badge
                className={`border ${connected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                data-testid="connection-status"
              >
                {connected ? 'Live' : 'Reconnecting...'}
              </Badge>
            </div>
          </div>

          {/* Loading / Error States */}
          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800">
              Failed to load orders. Please try again.
            </div>
          )}

          {/* Workflow Board */}
          <div className="flex space-x-6 overflow-x-auto pb-6">
            {workflowColumns.map(column => (
              <WorkflowColumn
                key={column.id}
                column={column}
                orders={ordersByStatus[column.id] || []}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default OrderWorkflowBoard;
