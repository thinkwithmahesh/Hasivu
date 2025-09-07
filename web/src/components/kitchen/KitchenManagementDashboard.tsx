"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Users,
  ChefHat,
  Package,
  AlertTriangle,
  CheckCircle,
  Timer,
  Utensils,
  TrendingUp,
  Bell,
  Settings,
  BarChart3,
  Calendar,
  MapPin,
  User,
  Star,
  Activity,
  Zap,
  ShoppingCart,
  Eye,
  MoreHorizontal,
  Filter,
  Search,
  RefreshCw,
  Plus,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-hot-toast';

// Import API integration hooks
import {
  useKitchenOrders,
  useKitchenMetrics,
  useOrderMutations,
  useStaffMembers,
  useInventoryItems,
  useLowStockAlerts,
  useWebSocketSubscription,
  useWebSocketConnection
} from '@/hooks/useApiIntegration';

// TypeScript interfaces for Kitchen Management
interface Order {
  id: string;
  orderNumber: string;
  studentName: string;
  studentId: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  orderTime: string;
  estimatedTime: number; // in minutes
  actualTime?: number;
  assignedStaff?: string;
  location: string;
  specialInstructions?: string;
  totalAmount: number;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  allergens: string[];
  preparationTime: number;
  image?: string;
}

interface KitchenStaff {
  id: string;
  name: string;
  role: 'chef' | 'assistant' | 'prep' | 'manager';
  avatar: string;
  status: 'active' | 'break' | 'offline';
  currentTask?: string;
  efficiency: number;
  hoursWorked: number;
  tasksCompleted: number;
  shift: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  supplier: string;
  lastUpdated: string;
  expiryDate?: string;
  costPerUnit: number;
}

interface KitchenMetrics {
  ordersInProgress: number;
  averagePreparationTime: number;
  completionRate: number;
  staffEfficiency: number;
  dailyRevenue: number;
  customerSatisfaction: number;
  lowStockItems: number;
  activeStaff: number;
}

// Mock data for demonstration
const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    orderNumber: '#12341',
    studentName: 'Priya Sharma',
    studentId: 'STU-001',
    items: [
      { id: 'ITM-001', name: 'Masala Dosa', quantity: 1, category: 'Main', allergens: [], preparationTime: 12, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=100&h=100&fit=crop' },
      { id: 'ITM-002', name: 'Coconut Chutney', quantity: 1, category: 'Side', allergens: ['coconut'], preparationTime: 3 }
    ],
    status: 'preparing',
    priority: 'high',
    orderTime: '2024-01-15T12:15:00Z',
    estimatedTime: 15,
    assignedStaff: 'Rajesh Kumar',
    location: 'Main Cafeteria',
    totalAmount: 125
  },
  {
    id: 'ORD-002',
    orderNumber: '#12342',
    studentName: 'Arjun Patel',
    studentId: 'STU-002',
    items: [
      { id: 'ITM-003', name: 'Chicken Biryani', quantity: 1, category: 'Main', allergens: [], preparationTime: 25 },
      { id: 'ITM-004', name: 'Raita', quantity: 1, category: 'Side', allergens: ['dairy'], preparationTime: 5 }
    ],
    status: 'pending',
    priority: 'medium',
    orderTime: '2024-01-15T12:20:00Z',
    estimatedTime: 30,
    location: 'South Wing',
    totalAmount: 180
  },
  {
    id: 'ORD-003',
    orderNumber: '#12343',
    studentName: 'Meera Singh',
    studentId: 'STU-003',
    items: [
      { id: 'ITM-005', name: 'Vegetable Pulao', quantity: 1, category: 'Main', allergens: [], preparationTime: 20 }
    ],
    status: 'ready',
    priority: 'low',
    orderTime: '2024-01-15T12:10:00Z',
    estimatedTime: 20,
    actualTime: 18,
    assignedStaff: 'Sunita Devi',
    location: 'Main Cafeteria',
    totalAmount: 95
  }
];

const mockStaff: KitchenStaff[] = [
  {
    id: 'STF-001',
    name: 'Rajesh Kumar',
    role: 'chef',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    status: 'active',
    currentTask: 'Preparing Masala Dosa (#12341)',
    efficiency: 92,
    hoursWorked: 6.5,
    tasksCompleted: 23,
    shift: 'Morning (8:00 AM - 4:00 PM)'
  },
  {
    id: 'STF-002',
    name: 'Sunita Devi',
    role: 'assistant',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    status: 'active',
    currentTask: 'Cleaning Station 3',
    efficiency: 88,
    hoursWorked: 7.2,
    tasksCompleted: 31,
    shift: 'Morning (7:00 AM - 3:00 PM)'
  },
  {
    id: 'STF-003',
    name: 'Mohammed Ali',
    role: 'prep',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    status: 'break',
    efficiency: 85,
    hoursWorked: 4.0,
    tasksCompleted: 18,
    shift: 'Afternoon (12:00 PM - 8:00 PM)'
  }
];

const mockInventory: InventoryItem[] = [
  { id: 'INV-001', name: 'Rice', category: 'Grains', currentStock: 25, minStock: 20, maxStock: 100, unit: 'kg', supplier: 'ABC Grains Ltd', lastUpdated: '2024-01-15T10:30:00Z', costPerUnit: 45 },
  { id: 'INV-002', name: 'Chicken', category: 'Protein', currentStock: 8, minStock: 15, maxStock: 50, unit: 'kg', supplier: 'Fresh Meat Co', lastUpdated: '2024-01-15T09:15:00Z', expiryDate: '2024-01-17', costPerUnit: 280 },
  { id: 'INV-003', name: 'Tomatoes', category: 'Vegetables', currentStock: 12, minStock: 10, maxStock: 30, unit: 'kg', supplier: 'Green Farms', lastUpdated: '2024-01-15T11:00:00Z', expiryDate: '2024-01-18', costPerUnit: 35 }
];

const mockMetrics: KitchenMetrics = {
  ordersInProgress: 15,
  averagePreparationTime: 18.5,
  completionRate: 94.2,
  staffEfficiency: 88.3,
  dailyRevenue: 15420,
  customerSatisfaction: 4.6,
  lowStockItems: 3,
  activeStaff: 8
};

// Order Status Colors
const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ready': return 'bg-green-100 text-green-800 border-green-200';
    case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityColor = (priority: Order['priority']) => {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

// Order Card Component
const OrderCard = ({ order }: { order: Order }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const orderTime = new Date(order.orderTime).getTime();
      setTimeElapsed(Math.floor((now - orderTime) / 1000 / 60)); // minutes
    }, 1000);

    return () => clearInterval(interval);
  }, [order.orderTime]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(order.priority)}`} />
          <div>
            <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
            <p className="text-sm text-gray-600">{order.studentName}</p>
          </div>
        </div>
        <Badge className={`${getStatusColor(order.status)} border`}>
          {order.status}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="flex-1">{item.quantity}x {item.name}</span>
            <span className="text-gray-500">{item.preparationTime}min</span>
          </div>
        ))}
      </div>

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

      {order.assignedStaff && (
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <span className="flex items-center">
            <User className="w-3 h-3 mr-1" />
            {order.assignedStaff}
          </span>
          <span className="flex items-center">
            <Timer className="w-3 h-3 mr-1" />
            Est. {order.estimatedTime}min
          </span>
        </div>
      )}

      <div className="flex space-x-2">
        <Button size="sm" variant="outline" className="flex-1">
          <Eye className="w-3 h-3 mr-1" />
          View
        </Button>
        <Button size="sm" variant="outline">
          <MoreHorizontal className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
};

// Staff Card Component
const StaffCard = ({ staff }: { staff: KitchenStaff }) => {
  const getStatusColor = (status: KitchenStaff['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'break': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: KitchenStaff['role']) => {
    switch (role) {
      case 'chef': return <ChefHat className="w-4 h-4" />;
      case 'assistant': return <Users className="w-4 h-4" />;
      case 'prep': return <Utensils className="w-4 h-4" />;
      case 'manager': return <Settings className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarImage src={staff.avatar} alt={staff.name} />
              <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(staff.status)}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">{staff.name}</h3>
              <div className="text-gray-500">
                {getRoleIcon(staff.role)}
              </div>
            </div>
            <p className="text-sm text-gray-600 capitalize">{staff.role}</p>
          </div>
        </div>

        {staff.currentTask && (
          <div className="mb-4 p-2 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-800 font-medium">Current Task:</p>
            <p className="text-sm text-blue-700">{staff.currentTask}</p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Efficiency</span>
              <span className="font-semibold">{staff.efficiency}%</span>
            </div>
            <Progress value={staff.efficiency} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-900">{staff.hoursWorked}h</div>
              <div className="text-xs text-gray-600">Hours Worked</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-900">{staff.tasksCompleted}</div>
              <div className="text-xs text-gray-600">Tasks Done</div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <p>{staff.shift}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Inventory Alert Component
const InventoryAlert = ({ item }: { item: InventoryItem }) => {
  const isLowStock = item.currentStock <= item.minStock;
  const stockPercentage = (item.currentStock / item.maxStock) * 100;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      isLowStock ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center space-x-3">
        {isLowStock && <AlertTriangle className="w-5 h-5 text-red-500" />}
        <div>
          <h4 className="font-medium">{item.name}</h4>
          <p className="text-sm text-gray-600">{item.category} • {item.supplier}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center space-x-2">
          <span className={`font-semibold ${isLowStock ? 'text-red-700' : 'text-gray-900'}`}>
            {item.currentStock} {item.unit}
          </span>
          <Progress value={stockPercentage} className="w-16 h-2" />
        </div>
        <p className="text-xs text-gray-500">Min: {item.minStock} {item.unit}</p>
      </div>
    </div>
  );
};

// Main Kitchen Management Dashboard
export const KitchenManagementDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('orders');
  const [orderFilters, setOrderFilters] = useState({});
  const [staffFilters, setStaffFilters] = useState({});
  const [inventoryFilters, setInventoryFilters] = useState({});

  // API Integration hooks
  const { data: orders, loading: ordersLoading, error: ordersError, refetch: refetchOrders } = useKitchenOrders(orderFilters);
  const { data: metrics, loading: metricsLoading } = useKitchenMetrics('today');
  const { data: staff, loading: staffLoading } = useStaffMembers(staffFilters);
  const { data: inventory, loading: inventoryLoading } = useInventoryItems(inventoryFilters);
  const { data: lowStockAlerts, loading: alertsLoading } = useLowStockAlerts();
  const { updateOrderStatus, assignOrder, loading: mutationLoading, error: mutationError } = useOrderMutations();
  const { connected: wsConnected } = useWebSocketConnection();

  // Real-time updates via WebSocket
  useWebSocketSubscription('order_update', useCallback((orderData: any) => {
    toast.success(`Order ${orderData.orderNumber} status updated to ${orderData.status}`);
    refetchOrders();
  }, [refetchOrders]));

  useWebSocketSubscription('kitchen_alert', useCallback((alertData: any) => {
    toast.error(alertData.message);
  }, []));

  // Handle order status updates
  const handleOrderStatusUpdate = useCallback(async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated successfully');
      refetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  }, [updateOrderStatus, refetchOrders]);

  // Handle order assignment
  const handleOrderAssignment = useCallback(async (orderId: string, staffId: string) => {
    try {
      await assignOrder(orderId, staffId);
      toast.success('Order assigned successfully');
      refetchOrders();
    } catch (error) {
      toast.error('Failed to assign order');
    }
  }, [assignOrder, refetchOrders]);

  // Use fallback data if API calls fail or data is not available
  const ordersData = orders || mockOrders;
  const metricsData = metrics || mockMetrics;
  const staffData = staff || mockStaff;
  const inventoryData = inventory || mockInventory;

  // Filter orders by status
  const pendingOrders = ordersData.filter(order => order.status === 'pending');
  const preparingOrders = ordersData.filter(order => order.status === 'preparing');
  const readyOrders = ordersData.filter(order => order.status === 'ready');

  // Check if any critical data is loading
  const isLoading = ordersLoading || metricsLoading;
  const hasError = ordersError || mutationError;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Connection Status */}
        {!wsConnected && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Real-time connection lost. Data may not be current.
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {hasError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {hasError}
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="kitchen-header">Kitchen Management</h1>
            <p className="text-gray-600">Real-time order tracking and kitchen operations</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => refetchOrders()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button disabled={mutationLoading}>
              <Plus className="w-4 h-4 mr-2" />
              Add Order
            </Button>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{metricsData.ordersInProgress}</p>
                  <p className="text-gray-600">Orders in Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-full">
                  <Timer className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{metricsData.averagePreparationTime}min</p>
                  <p className="text-gray-600">Avg Prep Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{metricsData.completionRate}%</p>
                  <p className="text-gray-600">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{metricsData.activeStaff}</p>
                  <p className="text-gray-600">Active Staff</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pending Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-yellow-600" />
                    Pending ({pendingOrders.length})
                  </CardTitle>
                  <CardDescription>Orders waiting to be prepared</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AnimatePresence>
                    {pendingOrders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Preparing Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ChefHat className="w-5 h-5 mr-2 text-blue-600" />
                    Preparing ({preparingOrders.length})
                  </CardTitle>
                  <CardDescription>Orders currently being prepared</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AnimatePresence>
                    {preparingOrders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Ready Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Ready ({readyOrders.length})
                  </CardTitle>
                  <CardDescription>Orders ready for pickup</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AnimatePresence>
                    {readyOrders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staffData.map((member) => (
                <StaffCard key={member.id} staff={member} />
              ))}
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                    Low Stock Alerts
                  </CardTitle>
                  <CardDescription>Items that need restocking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {inventoryData.filter(item => item.currentStock <= item.minStock).map((item) => (
                    <InventoryAlert key={item.id} item={item} />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2 text-green-600" />
                    All Inventory Items
                  </CardTitle>
                  <CardDescription>Current stock levels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {inventoryData.map((item) => (
                    <InventoryAlert key={item.id} item={item} />
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    Rs.{metricsData.dailyRevenue.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">
                    +12.5% from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-2">
                    <div className="text-3xl font-bold text-yellow-600">
                      {metricsData.customerSatisfaction}
                    </div>
                    <Star className="w-6 h-6 text-yellow-500 ml-1 fill-current" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Based on {245} reviews today
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default KitchenManagementDashboard;
