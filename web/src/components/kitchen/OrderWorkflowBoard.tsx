"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ChefHat,
  CheckCircle,
  AlertTriangle,
  Timer,
  User,
  MapPin,
  Eye,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Bell,
  ArrowRight,
  Utensils,
  Star,
  Flag,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

// Hooks for backend integration
import { 
  useKitchenOrders, 
  useOrderMutations,
  useWebSocketSubscription,
  useWebSocketConnection
} from '@/hooks/useApiIntegration';

// Enhanced Order interface for workflow
interface WorkflowOrder {
  id: string;
  orderNumber: string;
  studentName: string;
  studentId: string;
  studentAvatar?: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  priority: 'low' | 'medium' | 'high';
  orderTime: string;
  estimatedTime: number;
  actualTime?: number;
  assignedStaff?: StaffMember;
  location: string;
  specialInstructions?: string;
  totalAmount: number;
  progress: number; // 0-100
  allergens: string[];
  customerRating?: number;
  notes: string[];
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  preparationTime: number;
  isCompleted: boolean;
  image?: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  efficiency: number;
}

// Note: previous mockWorkflowOrders removed. Data will be sourced from backend via hooks.

// Workflow columns configuration
const workflowColumns = [
  {
    id: 'pending',
    title: 'Pending Orders',
    icon: Clock,
    color: 'yellow',
    description: 'Orders waiting to be prepared'
  },
  {
    id: 'preparing',
    title: 'In Progress',
    icon: ChefHat,
    color: 'blue',
    description: 'Orders currently being prepared'
  },
  {
    id: 'ready',
    title: 'Ready for Pickup',
    icon: CheckCircle,
    color: 'green',
    description: 'Orders ready for collection'
  },
  {
    id: 'completed',
    title: 'Completed',
    icon: Star,
    color: 'gray',
    description: 'Successfully delivered orders'
  }
];

// Utility functions
const getStatusColor = (status: WorkflowOrder['status']) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ready': return 'bg-green-100 text-green-800 border-green-200';
    case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityColor = (priority: WorkflowOrder['priority']) => {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

const getTimeElapsed = (orderTime: string) => {
  const now = new Date().getTime();
  const orderDate = new Date(orderTime).getTime();
  return Math.floor((now - orderDate) / 1000 / 60); // minutes
};

// Enhanced Order Card Component for Workflow
const WorkflowOrderCard = ({ 
  order, 
  onStatusChange 
}: { 
  order: WorkflowOrder;
  onStatusChange: (orderId: string, newStatus: WorkflowOrder['status']) => void;
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(getTimeElapsed(order.orderTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.orderTime]);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', order.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const completedItems = order.items.filter(item => item.isCompleted).length;
  const totalItems = order.items.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-lg border-2 p-4 cursor-move transition-all duration-200 ${
        isDragging 
          ? 'border-blue-400 shadow-lg transform rotate-2' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-testid="order-card"
    >
      {/* Header with Priority and Status */}
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
                    {order.studentName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              )}
              <p className="text-sm font-medium text-gray-700">{order.studentName}</p>
            </div>
          </div>
        </div>
        <Badge className={`${getStatusColor(order.status)} border`}>
          {order.status}
        </Badge>
      </div>

      {/* Progress Bar */}
      {order.status === 'preparing' && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{order.progress}%</span>
          </div>
          <Progress value={order.progress} className="h-2" />
        </div>
      )}

      {/* Items List */}
      <div className="space-y-2 mb-4">
        {order.items.map((item) => (
          <div 
            key={item.id} 
            className={`flex items-center justify-between text-sm p-2 rounded ${
              item.isCompleted ? 'bg-green-50 text-green-800' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                item.isCompleted ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className={item.isCompleted ? 'line-through' : ''}>
                {item.quantity}x {item.name}
              </span>
            </div>
            <span className="text-gray-500">{item.preparationTime}min</span>
          </div>
        ))}
      </div>

      {/* Allergen Alerts */}
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

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> {order.specialInstructions}
          </p>
        </div>
      )}

      {/* Order Details */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {timeElapsed}min ago
        </span>
        <span className="flex items-center">
          <MapPin className="w-3 h-3 mr-1" />
          {order.location}
        </span>
        <span className="font-semibold text-gray-900">
          Rs.{order.totalAmount}
        </span>
      </div>

      {/* Assigned Staff */}
      {order.assignedStaff && (
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <div className="flex items-center space-x-2">
            <Avatar className="w-5 h-5">
              <AvatarImage src={order.assignedStaff.avatar} alt={order.assignedStaff.name} />
              <AvatarFallback className="text-xs">
                {order.assignedStaff.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span>{order.assignedStaff.name}</span>
          </div>
          <span className="flex items-center">
            <Timer className="w-3 h-3 mr-1" />
            Est. {order.estimatedTime}min
          </span>
        </div>
      )}

      {/* Customer Rating (for completed orders) */}
      {order.customerRating && order.status === 'completed' && (
        <div className="flex items-center space-x-2 mb-3">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="text-sm font-medium">{order.customerRating}</span>
          <span className="text-xs text-gray-500">Customer Rating</span>
        </div>
      )}

      {/* Notes */}
      {order.notes.length > 0 && (
        <div className="mb-3">
          {order.notes.map((note, index) => (
            <div key={index} className="text-xs text-gray-600 bg-gray-50 p-1 rounded mb-1">
              • {note}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button size="sm" variant="outline" className="flex-1">
          <Eye className="w-3 h-3 mr-1" />
          View Details
        </Button>
        {order.status !== 'completed' && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              const nextStatus = order.status === 'pending' ? 'preparing' : 
                              order.status === 'preparing' ? 'ready' : 'completed';
              onStatusChange(order.id, nextStatus);
            }}
          >
            <ArrowRight className="w-3 h-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// Workflow Column Component
const WorkflowColumn = ({ 
  column, 
  orders, 
  onStatusChange 
}: { 
  column: typeof workflowColumns[0];
  orders: WorkflowOrder[];
  onStatusChange: (orderId: string, newStatus: WorkflowOrder['status']) => void;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const orderId = e.dataTransfer.getData('text/plain');
    onStatusChange(orderId, column.id as WorkflowOrder['status']);
  };

  const IconComponent = column.icon;

  return (
    <div
      className={`flex-1 min-h-screen transition-colors duration-200 ${
        isDragOver 
          ? 'bg-blue-50 border-blue-300' 
          : 'bg-gray-50 border-gray-200'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className={`flex items-center text-${column.color}-600`}>
            <IconComponent className="w-5 h-5 mr-2" />
            {column.title} ({orders.length})
          </CardTitle>
          <CardDescription>{column.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <AnimatePresence>
            {orders.map((order) => (
              <WorkflowOrderCard 
                key={order.id} 
                order={order} 
                onStatusChange={onStatusChange}
              />
            ))}
          </AnimatePresence>
          
          {orders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <IconComponent className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No orders in this stage</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Main Order Workflow Board Component
export const OrderWorkflowBoard: React.FC = () => {
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Fetch all orders from backend
  const { data: apiOrders, loading, error, refetch } = useKitchenOrders();
  const { updateOrderStatus, loading: mutating } = useOrderMutations();
  const { connected } = useWebSocketConnection();

  // WebSocket real-time updates
  useWebSocketSubscription('order_update', useCallback(() => {
    refetch();
  }, [refetch]));

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => refetch(), 30000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, refetch]);

  // Map API orders to workflow shape with safe defaults
  const orders: WorkflowOrder[] = useMemo(() => {
    const list: any[] = apiOrders || [];
    return list.map((o: any) => ({
      id: o.id || o._id || String(o.orderNumber || Math.random()),
      orderNumber: o.orderNumber || `#${o.id || 'N/A'}`,
      studentName: o.student?.name || o.studentName || 'Student',
      studentId: o.student?.id || o.studentId || 'N/A',
      studentAvatar: o.student?.avatar || undefined,
      items: (o.items || []).map((it: any, idx: number) => ({
        id: it.id || `${o.id}-item-${idx}`,
        name: it.name || 'Item',
        quantity: it.quantity || 1,
        category: it.category || 'General',
        preparationTime: it.preparationTime || 5,
        isCompleted: Boolean(it.isCompleted)
      })),
      status: (o.status || 'pending') as WorkflowOrder['status'],
      priority: (o.priority || 'medium') as WorkflowOrder['priority'],
      orderTime: o.orderTime || o.createdAt || new Date().toISOString(),
      estimatedTime: o.estimatedTime || 15,
      actualTime: o.actualTime,
      assignedStaff: o.assignedStaff ? {
        id: o.assignedStaff.id || o.assignedStaff._id || 'staff',
        name: o.assignedStaff.name || 'Staff',
        role: o.assignedStaff.role || 'chef',
        avatar: o.assignedStaff.avatar || '',
        efficiency: o.assignedStaff.efficiency || 0
      } : undefined,
      location: o.location || 'Kitchen',
      specialInstructions: o.specialInstructions || '',
      totalAmount: o.totalAmount || 0,
      progress: o.progress ?? (o.status === 'completed' ? 100 : o.status === 'preparing' ? 50 : 0),
      allergens: o.allergens || [],
      customerRating: o.customerRating,
      notes: o.notes || []
    }));
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
  const ordersByStatus = useMemo(() => (
    workflowColumns.reduce((acc, column) => {
      acc[column.id] = orders.filter(order => order.status === column.id);
      return acc;
    }, {} as Record<string, WorkflowOrder[]>)
  ), [orders]);

  return (
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
              variant={isAutoRefresh ? "default" : "outline"}
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isAutoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Refresh
            </Button>
            <Badge className={`border ${connected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`} data-testid="connection-status">
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
  );
};

export default OrderWorkflowBoard;
