'use client';

/**
 * HASIVU Platform - Order Card Component
 * Displays order information with real-time status updates
 */

import React, { useState, useEffect } from 'react';
import { motion, _AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  ChefHat,
  MapPin,
  Calendar,
  User,
  _CreditCard,
  MoreVertical,
  Eye,
  Download,
  _RefreshCw,
  X,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { OrderCancellationModal } from './OrderCancellationModal';
import { Order, _OrderItem, _OrderStatus, OrderStatusEntry, OrderCardProps } from '@/types/orders';

export function OrderCard({
  order,
  onOrderUpdate,
  onViewDetails,
  onOrderCancel,
  showActions = true,
  className = '',
}: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusProgress, setStatusProgress] = useState(0);
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  // Calculate status progress
  useEffect(() => {
    const statusMap = {
      pending: 10,
      confirmed: 25,
      preparing: 50,
      ready: 75,
      delivered: 100,
      cancelled: 0,
    };
    setStatusProgress(statusMap[order.status] || 0);
  }, [order.status]);

  const getStatusConfig = (status: Order['status']) => {
    const configs = {
      pending: {
        color: 'orange',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
        icon: Clock,
        message: 'Order received',
      },
      confirmed: {
        color: 'blue',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        icon: CheckCircle,
        message: 'Order confirmed',
      },
      preparing: {
        color: 'purple',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        icon: ChefHat,
        message: 'Being prepared',
      },
      ready: {
        color: 'green',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        icon: CheckCircle,
        message: 'Ready for pickup',
      },
      delivered: {
        color: 'green',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        icon: Truck,
        message: 'Delivered successfully',
      },
      cancelled: {
        color: 'red',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        icon: AlertCircle,
        message: 'Order cancelled',
      },
    };
    return configs[status];
  };

  const getPaymentStatusBadge = (paymentStatus: Order['paymentStatus']) => {
    const variants = {
      pending: { variant: 'secondary' as const, text: 'Payment Pending' },
      completed: { variant: 'default' as const, text: 'Paid' },
      failed: { variant: 'destructive' as const, text: 'Payment Failed' },
      refunded: { variant: 'outline' as const, text: 'Refunded' },
    };
    return variants[paymentStatus];
  };

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    if (!onOrderUpdate) return;

    setIsUpdating(true);
    try {
      const newStatusEntry: OrderStatusEntry = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        message: `Order ${newStatus}`,
      };

      await onOrderUpdate(order.id, {
        status: newStatus,
        statusHistory: [...order.statusHistory, newStatusEntry],
      });
    } catch (error) {
    } finally {
      setIsUpdating(false);
    }
  };

  // Check if order can be cancelled
  const canCancelOrder = () => {
    const cancellableStatuses = ['pending', 'confirmed', 'preparing'];
    return cancellableStatuses.includes(order.status) && order.status !== 'cancelled';
  };

  // Handle order cancellation
  const handleOrderCancellation = (result: any) => {
    if (result.success && onOrderCancel) {
      onOrderCancel(order.id, result);
    }
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const paymentBadge = getPaymentStatusBadge(order.paymentStatus);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={className}
      data-testid={`order-card-${order.id}`}
    >
      <Card
        className={`relative overflow-hidden border-2 ${statusConfig.borderColor} ${statusConfig.bgColor}`}
      >
        {/* Status progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <motion.div
            className={`h-full bg-${statusConfig.color}-500`}
            initial={{ width: 0 }}
            animate={{ width: `${statusProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={order.studentAvatar} alt={order.studentName} />
                <AvatarFallback>
                  {order.studentName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg font-semibold">Order #{order.orderNumber}</CardTitle>
                <p className="text-sm text-gray-600 flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {order.studentName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant={paymentBadge.variant} className="text-xs">
                {paymentBadge.text}
              </Badge>

              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails?.(order.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download Receipt
                    </DropdownMenuItem>
                    {order.status === 'pending' && (
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate('confirmed')}
                        disabled={isUpdating}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirm Order
                      </DropdownMenuItem>
                    )}
                    {canCancelOrder() && (
                      <DropdownMenuItem
                        onClick={() => setShowCancellationModal(true)}
                        disabled={isUpdating}
                        className="text-red-600 focus:text-red-600"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel Order
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Order Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{
                  rotate: isUpdating ? 360 : 0,
                }}
                transition={{
                  duration: 1,
                  repeat: isUpdating ? Infinity : 0,
                  ease: 'linear',
                }}
              >
                <StatusIcon className={`h-5 w-5 ${statusConfig.textColor}`} />
              </motion.div>
              <span className={`font-medium ${statusConfig.textColor}`}>
                {statusConfig.message}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(order.placedAt).toLocaleTimeString()}
            </span>
          </div>

          {/* Progress bar */}
          <Progress value={statusProgress} className="h-2" />

          {/* Order Items */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Order Items</h4>
            <div className="space-y-1">
              {order.items.slice(0, 3).map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="flex-1">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">₹{item.price * item.quantity}</span>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className="text-xs text-gray-500">+{order.items.length - 3} more items</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {order.location}
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(order.placedAt).toLocaleDateString()}
              </div>
              {order.rfidVerified && (
                <Badge variant="outline" className="text-xs">
                  RFID Verified
                </Badge>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">₹{order.totalAmount}</p>
            </div>
          </div>

          {/* Estimated Delivery */}
          {order.estimatedDelivery && order.status !== 'delivered' && (
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">Estimated ready time:</span>
              <span className="font-medium text-blue-800">
                {new Date(order.estimatedDelivery).toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Notes:</strong> {order.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Cancellation Modal */}
      <OrderCancellationModal
        isOpen={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        orderId={order.id}
        orderNumber={order.orderNumber}
        orderAmount={order.totalAmount}
        onCancellationComplete={handleOrderCancellation}
      />
    </motion.div>
  );
}

// Demo order data generator
export function generateDemoOrder(): Order {
  const orderNumber = `ORD-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  const statuses: Order['status'][] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    id: `order-${Date.now()}`,
    orderNumber,
    studentId: 'student-123',
    studentName: 'Priya Sharma',
    studentAvatar:
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    items: [
      {
        id: 'item-1',
        name: 'Masala Dosa',
        quantity: 1,
        price: 45,
      },
      {
        id: 'item-2',
        name: 'Sambar & Chutney',
        quantity: 1,
        price: 15,
      },
    ],
    totalAmount: 60,
    status: randomStatus,
    statusHistory: [
      {
        status: 'pending',
        timestamp: new Date().toISOString(),
        message: 'Order placed',
      },
    ],
    placedAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 1800000).toISOString(), // 30 minutes
    location: 'Cafeteria - Main Counter',
    paymentStatus: 'completed',
    paymentMethod: 'RFID Card',
    notes: 'Extra spicy please',
    rfidVerified: true,
  };
}

export default OrderCard;
