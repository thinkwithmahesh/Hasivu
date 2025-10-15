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
  ExclamationTriangleIcon
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
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
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
  className = ''
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
          estimatedDeliveryTime: order.estimatedDeliveryTime ? new Date(order.estimatedDeliveryTime) : undefined,
          actualDeliveryTime: order.actualDeliveryTime ? new Date(order.actualDeliveryTime) : undefined,
          trackingSteps: order.trackingSteps.map((step: any) => ({
            ...step,
            timestamp: new Date(step.timestamp)
          })),
          deliveryVerification: order.deliveryVerification ? {
            ...order.deliveryVerification,
            verifiedAt: new Date(order.deliveryVerification.verifiedAt)
          } : undefined
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
                schoolName: verificationData.schoolName || ''
              },
              trackingSteps: [
                ...order.trackingSteps,
                {
                  status: 'delivered',
                  timestamp: new Date(verificationData.timestamp),
                  location: verificationData.location,
                  notes: `Delivered via RFID verification - ${verificationData.readerName}`
                }
              ]
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
      toast.success(
        `🍽️ ${verificationData.studentName}'s meal delivered successfully!`,
        {
          duration: 5000,
