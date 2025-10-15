/**
 * HASIVU Platform - Real-time Delivery Tracking Component
 * Parent-facing interface for tracking meal deliveries via RFID
 * Story 2.4: Parent Mobile Integration
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format, isToday, differenceInMinutes } from 'date-fns';
import {
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  BellIcon,
  RefreshIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

// Hooks and services
import { useAuth } from '../../contexts/auth-context';
import { useRealTimeNotifications } from '../../hooks/use-realtime-notifications';
import { api } from '../../lib/api-client';

/**
 * Delivery verification data interface
 */
interface DeliveryVerification {
  id: string;
  orderId: string;
  orderNumber: string;
  studentId: string;
  studentName: string;
  verifiedAt: Date;
  status: 'verified' | 'pending' | 'failed';
  location: string;
  readerName: string;
  cardNumber: string;
  schoolName: string;
  mealDetails?: {
    items: string[];
    totalAmount: number;
    currency: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Order tracking data interface
 */
interface OrderTracking {
  id: string;
  orderNumber: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled';
  studentName: string;
  deliveryDate: Date;
  totalAmount: number;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  trackingSteps: Array<{
    status: string;
    timestamp: Date;
    location?: string;
    notes?: string;
  }>;
  deliveryVerification?: DeliveryVerification;
}

/**
 * Props for the DeliveryTracking component
 */
interface DeliveryTrackingProps {
  studentId?: string;
  orderId?: string;
  showHistorical?: boolean;
  autoRefresh?: boolean;
  className?: string;
}

/**
 * Real-time Delivery Tracking Component
 */
export const DeliveryTracking: React.FC<DeliveryTrackingProps> = ({
  studentId,
  orderId,
  showHistorical = false,
  autoRefresh = true,
  className = '',
}) => {
  const { user, hasPermission: _hasPermission } = useAuth();
  const { isConnected, lastMessage } = useRealTimeNotifications();

  // State management
  const [orders, setOrders] = useState<OrderTracking[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'today' | 'pending' | 'all'>('today');

  /**
   * Load delivery tracking data
   */
  const loadDeliveryData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (studentId) params.append('studentId', studentId);
      if (orderId) params.append('orderId', orderId);
      if (!showHistorical) params.append('dateFilter', 'today');

      const response = await api.get(`/api/v1/mobile/tracking/orders?${params.toString()}`);

      if (response.data.success) {
        const trackingData = response.data.data.map((order: any) => ({
          ...order,
          deliveryDate: new Date(order.deliveryDate),
          estimatedDeliveryTime: order.estimatedDeliveryTime
            ? new Date(order.estimatedDeliveryTime)
            : undefined,
          actualDeliveryTime: order.actualDeliveryTime
            ? new Date(order.actualDeliveryTime)
            : undefined,
          trackingSteps: order.trackingSteps.map((step: any) => ({
            ...step,
            timestamp: new Date(step.timestamp),
          })),
          deliveryVerification: order.deliveryVerification
            ? {
                ...order.deliveryVerification,
                verifiedAt: new Date(order.deliveryVerification.verifiedAt),
              }
            : undefined,
        }));

        setOrders(trackingData);

        // Auto-select first order if specific order not provided
        if (!orderId && trackingData.length > 0) {
          setSelectedOrder(trackingData[0]);
        } else if (orderId) {
          const specificOrder = trackingData.find((o: OrderTracking) => o.id === orderId);
          if (specificOrder) {
            setSelectedOrder(specificOrder);
          }
        }
      } else {
        throw new Error(response.data.error?.message || 'Failed to load delivery data');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, studentId, orderId, showHistorical]);

  /**
   * Handle manual refresh
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadDeliveryData();
  }, [loadDeliveryData]);

  /**
   * Handle real-time delivery updates
   */
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'delivery_verification') {
      const verificationData = lastMessage.data;

      // Update order with delivery verification
      setOrders(prevOrders =>
        prevOrders.map(order => {
          if (order.id === verificationData.orderId) {
            return {
              ...order,
              status: 'delivered',
              actualDeliveryTime: new Date(verificationData.timestamp),
              deliveryVerification: {
                id: verificationData.verificationId,
                orderId: verificationData.orderId,
                orderNumber: order.orderNumber,
                studentId: verificationData.studentId,
                studentName: verificationData.studentName,
                verifiedAt: new Date(verificationData.timestamp),
                status: 'verified',
                location: verificationData.location,
                readerName: verificationData.readerName,
                cardNumber: verificationData.cardNumber || '',
                schoolName: verificationData.schoolName || '',
              },
              trackingSteps: [
                ...order.trackingSteps,
                {
                  status: 'delivered',
                  timestamp: new Date(verificationData.timestamp),
                  location: verificationData.location,
                  notes: `Delivered via RFID verification - ${verificationData.readerName}`,
                },
              ],
            };
          }
          return order;
        })
      );

      // Update selected order if it matches
      if (selectedOrder && selectedOrder.id === verificationData.orderId) {
        setSelectedOrder(prevSelected => {
          if (!prevSelected) return null;

          const updatedOrder = orders.find(o => o.id === verificationData.orderId);
          return updatedOrder || prevSelected;
        });
      }

      // Show success notification
      toast.success(`🍽️ ${verificationData.studentName}'s meal delivered successfully!`, {
        duration: 5000,
        icon: '✅',
      });
    }
  }, [lastMessage, orders, selectedOrder]);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    if (autoRefresh && !isLoading) {
      const interval = setInterval(() => {
        loadDeliveryData();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, isLoading, loadDeliveryData]);

  /**
   * Initial data load
   */
  useEffect(() => {
    loadDeliveryData();
  }, [loadDeliveryData]);

  /**
   * Filter orders based on selected filter
   */
  const filteredOrders = orders.filter(order => {
    switch (filter) {
      case 'today':
        return isToday(order.deliveryDate);
      case 'pending':
        return ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(
          order.status
        );
      case 'all':
      default:
        return true;
    }
  });

  /**
   * Get status color
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'out_for_delivery':
        return 'text-blue-600 bg-blue-100';
      case 'ready':
        return 'text-yellow-600 bg-yellow-100';
      case 'preparing':
        return 'text-orange-600 bg-orange-100';
      case 'confirmed':
        return 'text-indigo-600 bg-indigo-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircleSolid className="h-5 w-5 text-green-600" />;
      case 'out_for_delivery':
        return <MapPinIcon className="h-5 w-5 text-blue-600" />;
      case 'ready':
        return <BellIcon className="h-5 w-5 text-yellow-600" />;
      case 'preparing':
        return <ClockIcon className="h-5 w-5 text-orange-600" />;
      case 'confirmed':
        return <CheckCircleIcon className="h-5 w-5 text-indigo-600" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (date: Date): string => {
    const minutes = differenceInMinutes(new Date(), date);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return format(date, 'MMM d, h:mm a');
  };

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Delivery Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshIcon className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Delivery Tracking</h2>
            <p className="text-sm text-gray-600">
              Real-time updates on meal deliveries
              {!isConnected && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Offline
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="mt-4">
          <div className="sm:hidden">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="today">Today's Orders</option>
              <option value="pending">Pending Orders</option>
              <option value="all">All Orders</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="flex space-x-8">
              {[
                { key: 'today', label: "Today's Orders" },
                { key: 'pending', label: 'Pending Orders' },
                { key: 'all', label: 'All Orders' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`${
                    filter === key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600">
              {filter === 'today' && 'No orders scheduled for today.'}
              {filter === 'pending' && 'No pending orders at the moment.'}
              {filter === 'all' && 'No orders found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedOrder?.id === order.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200'
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">Order #{order.orderNumber}</h4>
                      <p className="text-sm text-gray-600">
                        {order.studentName} • {format(order.deliveryDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                    >
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {order.actualDeliveryTime && (
                      <p className="text-xs text-gray-500 mt-1">
                        Delivered {formatTimeAgo(order.actualDeliveryTime)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Delivery verification badge */}
                {order.deliveryVerification && (
                  <div className="mt-3 flex items-center text-sm text-green-600">
                    <CheckCircleSolid className="h-4 w-4 mr-1" />
                    Verified via RFID at {order.deliveryVerification.location}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Selected order details */}
        <AnimatePresence>
          {selectedOrder && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 border-t pt-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Order Details - #{selectedOrder.orderNumber}
              </h3>

              {/* Tracking timeline */}
              <div className="flow-root">
                <ul className="-mb-8">
                  {selectedOrder.trackingSteps.map((step, stepIdx) => (
                    <li key={stepIdx}>
                      <div className="relative pb-8">
                        {stepIdx !== selectedOrder.trackingSteps.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>{getStatusIcon(step.status)}</div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {step.status.replace('_', ' ').toUpperCase()}
                                {step.location && (
                                  <span className="font-medium text-gray-900">
                                    {' '}
                                    at {step.location}
                                  </span>
                                )}
                              </p>
                              {step.notes && (
                                <p className="text-xs text-gray-400 mt-1">{step.notes}</p>
                              )}
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {format(step.timestamp, 'h:mm a')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Delivery verification details */}
              {selectedOrder.deliveryVerification && (
                <div className="mt-6 bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Delivery Verified ✅</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700 font-medium">Verified At:</span>
                      <p className="text-green-600">
                        {format(
                          selectedOrder.deliveryVerification.verifiedAt,
                          'MMM d, yyyy h:mm a'
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Location:</span>
                      <p className="text-green-600">
                        {selectedOrder.deliveryVerification.location}
                      </p>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Reader:</span>
                      <p className="text-green-600">
                        {selectedOrder.deliveryVerification.readerName}
                      </p>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Card:</span>
                      <p className="text-green-600">
                        ****{selectedOrder.deliveryVerification.cardNumber.slice(-4)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Meal details */}
              {selectedOrder.deliveryVerification?.mealDetails && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Meal Details</h4>
                  <div className="space-y-2 text-sm">
                    {selectedOrder.deliveryVerification.mealDetails.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-600">{item}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-medium">
                      <span>Total</span>
                      <span>
                        {selectedOrder.deliveryVerification.mealDetails.currency}{' '}
                        {selectedOrder.deliveryVerification.mealDetails.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DeliveryTracking;
