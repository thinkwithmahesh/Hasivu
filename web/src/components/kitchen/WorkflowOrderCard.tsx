/**
 * Workflow Order Card Component
 * Individual order card for the workflow board
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Clock, MapPin, Timer, Star, AlertTriangle, Eye, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

import { WorkflowOrder } from './types';
import { getStatusColor, getPriorityColor, getTimeElapsed } from './utils';

interface WorkflowOrderCardProps {
  order: WorkflowOrder;
  onStatusChange: (orderId: string, newStatus: WorkflowOrder['status']) => void;
}

export const WorkflowOrderCard: React.FC<WorkflowOrderCardProps> = ({ order, onStatusChange }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(getTimeElapsed(order.orderTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.orderTime]);

  const handleDragStart = (_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
    setIsDragging(true);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
    setIsDragging(false);
  };

  const completedItemsCount = useMemo(
    () => order.items.filter(item => item.isCompleted).length,
    [order.items]
  );

  const getNextStatus = (currentStatus: WorkflowOrder['status']): WorkflowOrder['status'] => {
    switch (currentStatus) {
      case 'pending':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'completed';
      default:
        return currentStatus;
    }
  };

  const renderOrderHeader = () => (
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${getPriorityColor(order.priority)}`} />
        <div>
          <h3 className="font-bold text-gray-900">{order.orderNumber}</h3>
          <div className="flex items-center space-x-2">
            {order.studentAvatar && (
              <Avatar className="w-6 h-6">
                <AvatarImage src={order.studentAvatar} alt={order.studentName} />
                <AvatarFallback className="text-xs">
                  {order.studentName
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
            )}
            <p className="text-sm font-medium text-gray-700">{order.studentName}</p>
          </div>
        </div>
      </div>
      <Badge className={`${getStatusColor(order.status)} border`}>{order.status}</Badge>
    </div>
  );

  const renderProgressBar = () =>
    order.status === 'preparing' && (
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{order.progress}%</span>
        </div>
        <Progress value={order.progress} className="h-2" />
      </div>
    );

  const renderItemsList = () => (
    <div className="space-y-2 mb-4">
      {order.items.map(item => (
        <div
          key={item.id}
          className={`flex items-center justify-between text-sm p-2 rounded ${
            item.isCompleted ? 'bg-green-50 text-green-800' : 'bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                item.isCompleted ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className={item.isCompleted ? 'line-through' : ''}>
              {item.quantity}x {item.name}
            </span>
          </div>
          <span className="text-gray-500">{item.preparationTime}min</span>
        </div>
      ))}
    </div>
  );

  const renderAlertsAndNotes = () => (
    <>
      {order.allergens.length > 0 && (
        <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-800">
              Allergens: {order.allergens.join(', ')}
            </span>
          </div>
        </div>
      )}

      {order.specialInstructions && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> {order.specialInstructions}
          </p>
        </div>
      )}
    </>
  );

  const renderOrderDetails = () => (
    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
      <span className="flex items-center">
        <Clock className="w-3 h-3 mr-1" />
        {timeElapsed}min ago
      </span>
      <span className="flex items-center">
        <MapPin className="w-3 h-3 mr-1" />
        {order.location}
      </span>
      <span className="font-semibold text-gray-900">Rs.{order.totalAmount}</span>
    </div>
  );

  const renderAssignedStaff = () =>
    order.assignedStaff && (
      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
        <div className="flex items-center space-x-2">
          <Avatar className="w-5 h-5">
            <AvatarImage src={order.assignedStaff.avatar} alt={order.assignedStaff.name} />
            <AvatarFallback className="text-xs">
              {order.assignedStaff.name
                .split(' ')
                .map(n => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <span>{order.assignedStaff.name}</span>
        </div>
        <span className="flex items-center">
          <Timer className="w-3 h-3 mr-1" />
          Est. {order.estimatedTime}min
        </span>
      </div>
    );

  const renderCustomerRating = () =>
    order.customerRating &&
    order.status === 'completed' && (
      <div className="flex items-center space-x-2 mb-3">
        <Star className="w-4 h-4 text-yellow-500 fill-current" />
        <span className="text-sm font-medium">{order.customerRating}</span>
        <span className="text-xs text-gray-500">Customer Rating</span>
      </div>
    );

  const renderNotes = () =>
    order.notes.length > 0 && (
      <div className="mb-3">
        {order.notes.map((note, index) => (
          <div key={index} className="text-xs text-gray-600 bg-gray-50 p-1 rounded mb-1">
            • {note}
          </div>
        ))}
      </div>
    );

  const renderActionButtons = () => (
    <div className="flex space-x-2">
      <Button size="sm" variant="outline" className="flex-1">
        <Eye className="w-3 h-3 mr-1" />
        View Details
      </Button>
      {order.status !== 'completed' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onStatusChange(order.id, getNextStatus(order.status))}
        >
          <ArrowRight className="w-3 h-3" />
        </Button>
      )}
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`bg-white rounded-lg border-2 p-4 cursor-move transition-all duration-200 ${
        isDragging
          ? 'border-blue-400 shadow-lg transform rotate-2'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      data-testid="order-card"
    >
      {renderOrderHeader()}
      {renderProgressBar()}
      {renderItemsList()}
      {renderAlertsAndNotes()}
      {renderOrderDetails()}
      {renderAssignedStaff()}
      {renderCustomerRating()}
      {renderNotes()}
      {renderActionButtons()}
    </motion.div>
  );
};
