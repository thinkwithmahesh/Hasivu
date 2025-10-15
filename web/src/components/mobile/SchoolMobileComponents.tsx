'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SwipeableCard, TouchContainer, PullToRefresh } from './TouchOptimized';
import { BottomSheet, useBottomSheet } from './BottomSheet';
import { ShareButton } from './PWAFeatures';
import {
  Clock,
  MapPin,
  Users,
  Star,
  Heart,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Utensils,
  Timer,
  Zap,
  ArrowRight,
  RefreshCw,
  MessageCircle,
  Camera,
  Smartphone,
  Plus,
  Minus,
  X,
} from 'lucide-react';

// Quick meal ordering carousel for lunch breaks
interface QuickMealCarouselProps {
  meals: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    preparationTime: number;
    rating: number;
    isAvailable: boolean;
    isPopular?: boolean;
  }>;
  onOrderMeal: (mealId: string, quantity: number) => void;
  className?: string;
}

export const QuickMealCarousel: React.FC<QuickMealCarouselProps> = ({
  meals,
  onOrderMeal,
  className,
}) => {
  const [selectedQuantity, setSelectedQuantity] = useState<{ [key: string]: number }>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateQuantity = useCallback((mealId: string, delta: number) => {
    setSelectedQuantity(prev => ({
      ...prev,
      [mealId]: Math.max(0, (prev[mealId] || 0) + delta),
    }));
  }, []);

  const handleQuickOrder = useCallback(
    (mealId: string) => {
      const quantity = selectedQuantity[mealId] || 1;
      onOrderMeal(mealId, quantity);

      // Reset quantity
      setSelectedQuantity(prev => ({ ...prev, [mealId]: 0 }));

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 10, 20]);
      }
    },
    [selectedQuantity, onOrderMeal]
  );

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-bold text-gray-900">Quick Order</h2>
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Fast pickup
        </Badge>
      </div>

      <div
        ref={scrollRef}
        className="flex space-x-3 overflow-x-auto scrollbar-none px-4 snap-x snap-mandatory"
      >
        {meals.map(meal => (
          <TouchContainer key={meal.id} className="flex-none w-72 snap-start" hapticFeedback>
            <Card
              className={cn(
                'relative overflow-hidden transition-all duration-200',
                !meal.isAvailable && 'opacity-60'
              )}
            >
              {/* Popular badge */}
              {meal.isPopular && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              )}

              {/* Meal image */}
              <div className="relative h-32 bg-gray-100">
                <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                {/* Quick add button */}
                <div className="absolute bottom-2 right-2">
                  <Button
                    size="fabSmall"
                    variant="floating"
                    onClick={() => updateQuantity(meal.id, 1)}
                    disabled={!meal.isAvailable}
                    haptic
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Meal info */}
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{meal.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-lg font-bold text-green-600">₹{meal.price}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs text-gray-500">{meal.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Timer className="h-3 w-3" />
                    <span>{meal.preparationTime} min</span>
                  </div>
                  <div
                    className={cn(
                      'flex items-center space-x-1',
                      meal.isAvailable ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        meal.isAvailable ? 'bg-green-500' : 'bg-red-500'
                      )}
                    />
                    <span>{meal.isAvailable ? 'Available' : 'Sold out'}</span>
                  </div>
                </div>

                {/* Quantity selector and order button */}
                {(selectedQuantity[meal.id] || 0) > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(meal.id, -1)}
                        className="h-8 w-8 p-0"
                        haptic
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-semibold text-lg w-8 text-center">
                        {selectedQuantity[meal.id]}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(meal.id, 1)}
                        className="h-8 w-8 p-0"
                        haptic
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleQuickOrder(meal.id)}
                      disabled={!meal.isAvailable}
                      className="px-4"
                      haptic
                    >
                      Add ₹{meal.price * selectedQuantity[meal.id]}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </TouchContainer>
        ))}
      </div>
    </div>
  );
};

// Live order tracking for mobile
interface LiveOrderTrackingProps {
  order: {
    id: string;
    items: Array<{ name: string; quantity: number }>;
    status: 'placed' | 'preparing' | 'ready' | 'completed';
    estimatedTime: number;
    actualTime?: number;
    pickupLocation: string;
  };
  onRefresh?: () => void;
}

export const LiveOrderTracking: React.FC<LiveOrderTrackingProps> = ({ order, onRefresh }) => {
  const [timeRemaining, setTimeRemaining] = useState(order.estimatedTime);

  useEffect(() => {
    if (order.status === 'preparing') {
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [order.status]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'placed':
        return { color: 'bg-blue-500', icon: <Clock className="h-4 w-4" />, text: 'Order Placed' };
      case 'preparing':
        return {
          color: 'bg-orange-500',
          icon: <Utensils className="h-4 w-4" />,
          text: 'Preparing',
        };
      case 'ready':
        return {
          color: 'bg-green-500',
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Ready for Pickup',
        };
      case 'completed':
        return {
          color: 'bg-gray-500',
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Completed',
        };
      default:
        return { color: 'bg-gray-400', icon: <Clock className="h-4 w-4" />, text: 'Unknown' };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const progress = (() => {
    switch (order.status) {
      case 'placed':
        return 25;
      case 'preparing':
        return 50;
      case 'ready':
        return 100;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  })();

  return (
    <Card className="mx-4 mb-4 border-l-4 border-l-primary">
      <div className="p-4">
        {/* Header with refresh */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={cn('p-2 rounded-full text-white', statusInfo.color)}>
              {statusInfo.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Order #{order.id.slice(-6)}</h3>
              <p className="text-sm text-gray-600">{statusInfo.text}</p>
            </div>
          </div>

          {onRefresh && (
            <Button size="sm" variant="ghost" onClick={onRefresh} className="h-8 w-8 p-0" haptic>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Time remaining */}
        {order.status === 'preparing' && timeRemaining > 0 && (
          <div className="flex items-center justify-center mb-4 p-3 bg-orange-50 rounded-lg">
            <Timer className="h-5 w-5 text-orange-600 mr-2" />
            <div className="text-center">
              <p className="font-semibold text-orange-900">{timeRemaining} min remaining</p>
              <p className="text-sm text-orange-700">Estimated time</p>
            </div>
          </div>
        )}

        {/* Ready for pickup */}
        {order.status === 'ready' && (
          <div className="flex items-center justify-center mb-4 p-3 bg-green-50 rounded-lg animate-pulse">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div className="text-center">
              <p className="font-semibold text-green-900">Ready for pickup!</p>
              <p className="text-sm text-green-700">{order.pickupLocation}</p>
            </div>
          </div>
        )}

        {/* Order items */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Items ordered:</h4>
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.name}</span>
              <span className="text-gray-900">x{item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Pickup location */}
        <div className="flex items-center mt-3 pt-3 border-t">
          <MapPin className="h-4 w-4 text-gray-500 mr-2" />
          <span className="text-sm text-gray-600">Pickup: {order.pickupLocation}</span>
        </div>
      </div>
    </Card>
  );
};

// Parent approval interface for mobile
interface ParentApprovalProps {
  pendingOrders: Array<{
    id: string;
    studentName: string;
    items: Array<{ name: string; price: number; quantity: number }>;
    total: number;
    requestedTime: Date;
    dietaryNotes?: string;
  }>;
  onApprove: (orderId: string) => void;
  onReject: (orderId: string, reason?: string) => void;
  onModify: (orderId: string) => void;
}

export const ParentApprovalInterface: React.FC<ParentApprovalProps> = ({
  pendingOrders,
  onApprove,
  onReject,
  onModify,
}) => {
  const rejectSheet = useBottomSheet();
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = useCallback(
    (orderId: string) => {
      setSelectedOrderId(orderId);
      rejectSheet.open();
    },
    [rejectSheet]
  );

  const confirmReject = useCallback(() => {
    if (selectedOrderId) {
      onReject(selectedOrderId, rejectReason);
      setRejectReason('');
      rejectSheet.close();
    }
  }, [selectedOrderId, rejectReason, onReject, rejectSheet]);

  if (pendingOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-1">All caught up!</h3>
        <p className="text-gray-600">No pending meal approvals</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-bold text-gray-900">Pending Approvals</h2>
          <Badge variant="destructive" className="px-2 py-1">
            {pendingOrders.length} pending
          </Badge>
        </div>

        {pendingOrders.map(order => (
          <SwipeableCard
            key={order.id}
            className="mx-4"
            leftAction={{
              icon: <X className="h-5 w-5" />,
              color: 'bg-red-500 text-white',
              label: 'Reject',
            }}
            rightAction={{
              icon: <CheckCircle className="h-5 w-5" />,
              color: 'bg-green-500 text-white',
              label: 'Approve',
            }}
            onSwipeLeft={() => handleReject(order.id)}
            onSwipeRight={() => onApprove(order.id)}
          >
            <Card className="border-amber-200 bg-amber-50">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{order.studentName}</h3>
                    <p className="text-sm text-gray-600">
                      Requested {order.requestedTime.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">₹{order.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 mb-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="text-gray-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Dietary notes */}
                {order.dietaryNotes && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium">Dietary Note:</p>
                    <p className="text-sm text-blue-700">{order.dietaryNotes}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex space-x-2 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(order.id)}
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                    haptic
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onModify(order.id)}
                    className="flex-1"
                    haptic
                  >
                    Modify
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onApprove(order.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    haptic
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </Card>
          </SwipeableCard>
        ))}
      </div>

      {/* Reject reason bottom sheet */}
      <BottomSheet
        isOpen={rejectSheet.isOpen}
        onClose={rejectSheet.close}
        title="Reject Order"
        snapPoints={[50]}
      >
        <div className="p-4 space-y-4">
          <p className="text-gray-600">Please provide a reason for rejecting this meal order:</p>

          <div className="space-y-3">
            {[
              'Too expensive',
              'Unhealthy choice',
              'Already had lunch',
              'Dietary restrictions',
              'Other',
            ].map(reason => (
              <button
                key={reason}
                onClick={() => setRejectReason(reason)}
                className={cn(
                  'w-full p-3 text-left rounded-lg border transition-colors',
                  rejectReason === reason
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                {reason}
              </button>
            ))}
          </div>

          {rejectReason === 'Other' && (
            <textarea
              placeholder="Please specify..."
              value={rejectReason === 'Other' ? '' : rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full p-3 border rounded-lg resize-none"
              rows={3}
            />
          )}

          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={rejectSheet.close} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              disabled={!rejectReason}
              className="flex-1 bg-red-600 hover:bg-red-700"
              haptic
            >
              Reject Order
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};

// School schedule integration
interface SchoolScheduleIntegrationProps {
  currentPeriod: {
    subject: string;
    teacher: string;
    room: string;
    endTime: Date;
  };
  nextMealTime: {
    type: 'lunch' | 'snack';
    time: Date;
    location: string;
  };
  isOrderingOpen: boolean;
  onQuickOrder: () => void;
}

export const SchoolScheduleIntegration: React.FC<SchoolScheduleIntegrationProps> = ({
  currentPeriod,
  nextMealTime,
  isOrderingOpen,
  onQuickOrder,
}) => {
  const [timeUntilMeal, setTimeUntilMeal] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const diff = nextMealTime.time.getTime() - now.getTime();

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
          setTimeUntilMeal(`${hours}h ${minutes}m`);
        } else {
          setTimeUntilMeal(`${minutes}m`);
        }
      } else {
        setTimeUntilMeal('Now');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [nextMealTime.time]);

  return (
    <Card className="mx-4 mb-4 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="p-4">
        {/* Current class */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Current Class</h3>
              <p className="text-sm text-gray-600">
                {currentPeriod.subject} • {currentPeriod.teacher}
              </p>
              <p className="text-xs text-gray-500">
                Room {currentPeriod.room} • Ends {currentPeriod.endTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Next meal */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Utensils className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 capitalize">Next {nextMealTime.type}</p>
                <p className="text-sm text-gray-600">
                  {nextMealTime.location} • in {timeUntilMeal}
                </p>
              </div>
            </div>

            {isOrderingOpen && (
              <Button size="sm" onClick={onQuickOrder} className="px-4" haptic>
                <Zap className="h-4 w-4 mr-1" />
                Quick Order
              </Button>
            )}
          </div>

          {!isOrderingOpen && (
            <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
              <p className="text-xs text-amber-800">
                Ordering opens 30 minutes before {nextMealTime.type} time
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
