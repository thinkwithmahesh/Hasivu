/**
 * HASIVU Platform - Real-time Order Tracker Component
 * ShadCN-based component for tracking order status with Socket.IO integration
 * Displays order progress, delivery updates, and RFID verification
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  MapPin, 
  AlertCircle,
  RefreshCw,
  Eye,
  Phone,
  MessageSquare
} from 'lucide-react';
import { useOrderTracking, useSocketConnection } from '@/hooks/useSocket';
import { cn, formatTime, formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface OrderTrackerProps {
  orderId: string;
  className?: string;
  showActions?: boolean;
  compact?: boolean;
}

interface StatusStep {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: {
    bg: string;
    text: string;
    border: string;
    icon: string;
  };
}

const statusSteps: StatusStep[] = [
  {
    key: 'pending',
    label: 'Order Placed',
    description: 'Your order has been received',
    icon: AlertCircle,
    color: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-300',
      icon: 'text-gray-500',
    },
  },
  {
    key: 'confirmed',
    label: 'Order Confirmed',
    description: 'Restaurant has accepted your order',
    icon: CheckCircle,
    color: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-300',
      icon: 'text-blue-500',
    },
  },
  {
    key: 'preparing',
    label: 'Preparing',
    description: 'Your meal is being prepared',
    icon: Clock,
    color: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-300',
      icon: 'text-yellow-500',
    },
  },
  {
    key: 'ready',
    label: 'Ready for Pickup',
    description: 'Your order is ready',
    icon: CheckCircle,
    color: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-300',
      icon: 'text-green-500',
    },
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    description: 'Your order is on the way',
    icon: Truck,
    color: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-300',
      icon: 'text-purple-500',
    },
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Your order has been delivered',
    icon: MapPin,
    color: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-300',
      icon: 'text-green-500',
    },
  },
];

export function OrderTracker({ 
  orderId, 
  className,
  showActions = true,
  compact = false 
}: OrderTrackerProps) {
  const trackingData = useOrderTracking(orderId);
  const { isConnected, connectionState, reconnect } = useSocketConnection();
  const [showFullHistory, setShowFullHistory] = useState(false);

  const currentStepIndex = statusSteps.findIndex(
    step => step.key === trackingData.status
  );

  const progress = currentStepIndex >= 0 
    ? ((currentStepIndex + 1) / statusSteps.length) * 100 
    : 0;

  const currentStep = statusSteps.find(step => step.key === trackingData.status);
  const isCompleted = trackingData.status === 'delivered';
  const isCancelled = trackingData.status === 'cancelled';

  // Show connection issues
  const showConnectionAlert = !isConnected && connectionState !== 'connecting';

  const handleRefresh = () => {
    if (!isConnected) {
      reconnect();
    } else {
      toast.success('Order status is up to date');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'confirmed':
      case 'preparing':
      case 'ready':
      case 'out_for_delivery':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-3', className)}>
        <div className="flex-shrink-0">
          {currentStep && (
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full border-2',
              currentStep.color.bg,
              currentStep.color.border
            )}>
              <currentStep.icon className={cn('w-4 h-4', currentStep.color.icon)} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              Order #{orderId.slice(-8)}
            </p>
            <Badge variant={getStatusBadgeVariant(trackingData.status)}>
              {trackingData.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          {trackingData.estimatedTime && (
            <p className="text-xs text-gray-500">
              Est. {formatTime(trackingData.estimatedTime)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Order #{orderId.slice(-8)}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={getStatusBadgeVariant(trackingData.status)}>
              {trackingData.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {showActions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={connectionState === 'connecting'}
              >
                <RefreshCw className={cn(
                  'w-4 h-4',
                  connectionState === 'connecting' && 'animate-spin'
                )} />
              </Button>
            )}
          </div>
        </div>
        
        {trackingData.estimatedTime && !isCompleted && (
          <p className="text-sm text-muted-foreground">
            Estimated completion: {formatTime(trackingData.estimatedTime)}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Connection Alert */}
        {showConnectionAlert && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Real-time updates unavailable</span>
              <Button
                variant="outline"
                size="sm"
                onClick={reconnect}
                disabled={connectionState === 'connecting'}
              >
                {connectionState === 'connecting' ? 'Connecting...' : 'Reconnect'}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        {!isCancelled && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress 
              value={progress} 
              className={cn(
                'h-2',
                isCompleted && 'bg-green-100'
              )}
            />
          </div>
        )}

        {/* Status Steps */}
        <div className="space-y-4">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div
                key={step.key}
                className={cn(
                  'flex items-start space-x-3 transition-all duration-200',
                  isCompleted && 'opacity-100',
                  isCurrent && 'opacity-100 scale-105',
                  isPending && 'opacity-60'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                    isCompleted && step.color.bg,
                    isCompleted && step.color.border,
                    isCurrent && 'ring-2 ring-offset-2 ring-blue-500',
                    isPending && 'border-gray-200 bg-gray-50'
                  )}
                >
                  <Icon className={cn(
                    'w-5 h-5 transition-colors duration-200',
                    isCompleted && step.color.icon,
                    isPending && 'text-gray-400'
                  )} />
                </div>
                <div className="flex-1 pb-4">
                  <p className={cn(
                    'font-medium transition-colors duration-200',
                    isCurrent && 'text-blue-600',
                    isCompleted && !isCurrent && step.color.text,
                    isPending && 'text-gray-500'
                  )}>
                    {step.label}
                  </p>
                  <p className={cn(
                    'text-sm transition-colors duration-200',
                    isCurrent && 'text-blue-500',
                    isCompleted && !isCurrent && 'text-gray-600',
                    isPending && 'text-gray-400'
                  )}>
                    {step.description}
                  </p>
                  
                  {/* Show current step details */}
                  {isCurrent && trackingData.estimatedTime && (
                    <p className="text-xs text-blue-500 mt-1">
                      Est. completion: {formatTime(trackingData.estimatedTime)}
                    </p>
                  )}
                  
                  {/* Show delivery person info */}
                  {isCurrent && step.key === 'out_for_delivery' && trackingData.deliveryPersonId && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Button variant="outline" size="sm">
                        <Phone className="w-3 h-3 mr-1" />
                        Call Driver
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* RFID Verification Status */}
        {isCompleted && (
          <Alert className={cn(
            trackingData.location ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
          )}>
            <CheckCircle className={cn(
              'h-4 w-4',
              trackingData.location ? 'text-green-600' : 'text-yellow-600'
            )} />
            <AlertDescription className={cn(
              trackingData.location ? 'text-green-800' : 'text-yellow-800'
            )}>
              {trackingData.location 
                ? '✅ Delivery verified with RFID' 
                : '⏳ Delivery completed - RFID verification pending'
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Order Updates History */}
        {trackingData.updates.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Order Updates</h4>
              {trackingData.updates.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullHistory(!showFullHistory)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {showFullHistory ? 'Show Less' : 'View All'}
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              {(showFullHistory ? trackingData.updates : trackingData.updates.slice(0, 3))
                .map((update, index) => (
                  <div key={index} className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-medium text-gray-900">
                        {update.status.replace('_', ' ').toUpperCase()}
                      </p>
                      {update.message && (
                        <p className="text-gray-600">{update.message}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatTime(update.timestamp)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && !isCompleted && !isCancelled && (
          <div className="flex space-x-2 pt-4 border-t">
            <Button variant="outline" className="flex-1">
              <Phone className="w-4 h-4 mr-2" />
              Call Restaurant
            </Button>
            <Button variant="outline" className="flex-1">
              <MessageSquare className="w-4 h-4 mr-2" />
              Support
            </Button>
          </div>
        )}

        {/* Connection Status Indicator */}
        <div className="flex items-center justify-center pt-2">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span>
              {isConnected ? 'Live updates active' : 'Connection lost'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default OrderTracker;