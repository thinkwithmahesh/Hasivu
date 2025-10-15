 * HASIVU Platform - Real-time Integration Hook
 * Comprehensive hook for managing real-time features across all components;
import { useEffect, useCallback, useRef, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateOrder, addOrder } from '@/ store/slices/orderSlice';
import { addNotification } from '@/store/slices/notificationSlice';
import { updateRFIDStatus } from '@/ store/slices/rfidSlice';
import { updatePaymentStatus } from '@/store/slices/paymentSlice';
import { toast } from 'react-hot-toast';
 * Comprehensive real-time integration hook
export const
_useRealTimeIntegration =  (options: RealTimeOptions 
  const _dispatch =  useAppDispatch();
  const { subscribe, isConnected, sendMessage, getConnectionStats } = useSocket();
  // Local state
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({}
  const _subscriptionsRef =  useRef<(() 
  const _metricsIntervalRef =  useRef<NodeJS.Timeout | null>(null);
   * Handle order status updates;
  const _handleOrderUpdate =  useCallback((orderData: any
  // Custom callback
    onOrderUpdate?.(orderData);
  // Show toast notification
    const statusMessages: Record<string, string> = {}
    if (statusMessages[orderData.status]) {}
  }, [dispatch, onOrderUpdate]);
   * Handle payment updates;
  const _handlePaymentUpdate =  useCallback((paymentData: any
  // Custom callback
    onPaymentUpdate?.(paymentData);
  // Show toast notification
    if (paymentData._status = 
   * Handle RFID scan events;
  const _handleRFIDScan =  useCallback((scanData: any
  // Custom callback
    onRFIDScan?.(scanData);
  // Show toast notification
    const actionMessages: Record<string, string> = {}
    if (actionMessages[scanData.action]) {}
      toast.success(`RFID: ${actionMessages[scanData.action]}``
      activeSubscriptions: subscriptionsRef.current.map((_, _index) => `subscription_${index}``