'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Avatar as _Avatar,
  AvatarFallback as _AvatarFallback,
  AvatarImage as _AvatarImage,
} from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox as _Checkbox } from '@/components/ui/checkbox';
import {
  Table as _Table,
  TableBody as _TableBody,
  TableCell as _TableCell,
  TableHead as _TableHead,
  TableHeader as _TableHeader,
  TableRow as _TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as _PieChart,
  Pie as _Pie,
  Cell as _Cell,
  Area as _Area,
  AreaChart as _AreaChart,
  RadialBarChart as _RadialBarChart,
  RadialBar as _RadialBar,
} from 'recharts';
import {
  ChefHat as _ChefHat,
  Clock,
  Users as _Users,
  Activity,
  AlertCircle,
  CheckCircle,
  Timer,
  Package,
  Truck,
  TrendingUp,
  Target,
  Bell,
  Settings,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  AlertTriangle,
  Zap as _Zap,
  Thermometer,
  Scale,
  Utensils,
  Coffee as _Coffee,
  Apple,
  Beef,
  Fish as _Fish,
  Wheat,
  Milk,
  Plus as _Plus,
  Minus as _Minus,
  RefreshCw,
  Filter as _Filter,
  Search as _Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KitchenData {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
  shift: string;
  specializations: string[];
}

interface EnhancedKitchenDashboardProps {
  kitchenData: KitchenData;
  className?: string;
}

// Comprehensive mock data for kitchen operations
const mockOrderQueue = [
  {
    id: 'ORD-001',
    studentName: 'Emma Wilson',
    grade: '8th',
    section: 'A',
    mealType: 'lunch',
    items: [
      { name: 'Grilled Chicken', prepTime: 15, status: 'cooking', station: 'grill' },
      { name: 'Rice Bowl', prepTime: 5, status: 'ready', station: 'prep' },
      { name: 'Garden Salad', prepTime: 3, status: 'preparing', station: 'cold' },
    ],
    totalPrepTime: 18,
    startTime: '12:15 PM',
    estimatedReady: '12:33 PM',
    actualStartTime: '12:16 PM',
    priority: 'high',
    allergies: ['Nuts'],
    specialRequests: 'Extra vegetables, less oil',
    assignedChef: 'Chef Maria',
    status: 'in_progress',
    timeElapsed: 8,
  },
  {
    id: 'ORD-002',
    studentName: 'James Martinez',
    grade: '5th',
    section: 'B',
    mealType: 'snack',
    items: [
      { name: 'Fresh Fruit Bowl', prepTime: 2, status: 'ready', station: 'prep' },
      { name: 'Orange Juice', prepTime: 1, status: 'ready', station: 'beverage' },
    ],
    totalPrepTime: 3,
    startTime: '11:30 AM',
    estimatedReady: '11:33 AM',
    actualStartTime: '11:30 AM',
    priority: 'medium',
    allergies: [],
    specialRequests: null,
    assignedChef: 'Chef Roberto',
    status: 'ready',
    timeElapsed: 3,
  },
  {
    id: 'ORD-003',
    studentName: 'Sophia Chen',
    grade: '10th',
    section: 'C',
    mealType: 'lunch',
    items: [
      { name: 'Vegetarian Pasta', prepTime: 12, status: 'queued', station: 'main' },
      { name: 'Garlic Bread', prepTime: 5, status: 'queued', station: 'oven' },
      { name: 'Green Smoothie', prepTime: 2, status: 'queued', station: 'beverage' },
    ],
    totalPrepTime: 15,
    startTime: '12:20 PM',
    estimatedReady: '12:35 PM',
    actualStartTime: null,
    priority: 'low',
    allergies: ['Dairy'],
    specialRequests: 'Vegan cheese substitute',
    assignedChef: 'Chef David',
    status: 'queued',
    timeElapsed: 0,
  },
];

const mockKitchenStations = [
  {
    id: 'grill',
    name: 'Grill Station',
    chef: 'Chef Maria Santos',
    status: 'active',
    currentOrders: 3,
    maxCapacity: 6,
    avgTime: 12,
    efficiency: 92,
    temperature: 180,
    lastCleaned: '10:30 AM',
  },
  {
    id: 'prep',
    name: 'Prep Station',
    chef: 'Chef Roberto Martinez',
    status: 'active',
    currentOrders: 5,
    maxCapacity: 8,
    avgTime: 6,
    efficiency: 88,
    temperature: 22,
    lastCleaned: '11:00 AM',
  },
  {
    id: 'main',
    name: 'Main Course',
    chef: 'Chef David Kim',
    status: 'busy',
    currentOrders: 7,
    maxCapacity: 8,
    avgTime: 18,
    efficiency: 85,
    temperature: 165,
    lastCleaned: '09:45 AM',
  },
  {
    id: 'cold',
    name: 'Cold Station',
    chef: 'Chef Sarah Johnson',
    status: 'active',
    currentOrders: 2,
    maxCapacity: 10,
    avgTime: 4,
    efficiency: 95,
    temperature: 4,
    lastCleaned: '11:30 AM',
  },
  {
    id: 'beverage',
    name: 'Beverage Station',
    chef: 'Chef Alex Turner',
    status: 'maintenance',
    currentOrders: 0,
    maxCapacity: 12,
    avgTime: 3,
    efficiency: 0,
    temperature: 15,
    lastCleaned: '08:00 AM',
  },
];

const mockInventoryStatus = [
  {
    id: 'chicken',
    name: 'Chicken Breast',
    category: 'protein',
    currentStock: 25,
    minThreshold: 15,
    maxCapacity: 50,
    unit: 'kg',
    supplier: 'Fresh Farms Ltd',
    lastDelivery: '2024-01-10',
    nextDelivery: '2024-01-14',
    costPerUnit: 320,
    expiryDate: '2024-01-16',
    status: 'good',
    dailyUsage: 8,
  },
  {
    id: 'rice',
    name: 'Basmati Rice',
    category: 'grains',
    currentStock: 45,
    minThreshold: 20,
    maxCapacity: 100,
    unit: 'kg',
    supplier: 'Grain Masters',
    lastDelivery: '2024-01-08',
    nextDelivery: '2024-01-15',
    costPerUnit: 85,
    expiryDate: '2024-03-15',
    status: 'good',
    dailyUsage: 12,
  },
  {
    id: 'vegetables',
    name: 'Mixed Vegetables',
    category: 'produce',
    currentStock: 8,
    minThreshold: 15,
    maxCapacity: 30,
    unit: 'kg',
    supplier: 'Green Valley Farms',
    lastDelivery: '2024-01-11',
    nextDelivery: '2024-01-13',
    costPerUnit: 65,
    expiryDate: '2024-01-15',
    status: 'low',
    dailyUsage: 6,
  },
  {
    id: 'milk',
    name: 'Fresh Milk',
    category: 'dairy',
    currentStock: 3,
    minThreshold: 10,
    maxCapacity: 40,
    unit: 'liters',
    supplier: 'Dairy Best',
    lastDelivery: '2024-01-10',
    nextDelivery: '2024-01-13',
    costPerUnit: 55,
    expiryDate: '2024-01-14',
    status: 'critical',
    dailyUsage: 8,
  },
];

const mockPerformanceMetrics = {
  daily: {
    ordersCompleted: 156,
    avgPrepTime: 14.5,
    onTimeDelivery: 94.2,
    wastePercentage: 4.8,
    qualityScore: 4.7,
    efficiency: 89.3,
  },
  weekly: [
    { day: 'Mon', orders: 180, avgTime: 15.2, onTime: 92.1, waste: 5.2, quality: 4.6 },
    { day: 'Tue', orders: 165, avgTime: 14.8, onTime: 93.8, waste: 4.9, quality: 4.7 },
    { day: 'Wed', orders: 190, avgTime: 16.1, onTime: 90.5, waste: 5.8, quality: 4.5 },
    { day: 'Thu', orders: 175, avgTime: 14.2, onTime: 95.1, waste: 4.1, quality: 4.8 },
    { day: 'Fri', orders: 200, avgTime: 15.7, onTime: 89.2, waste: 6.2, quality: 4.4 },
    { day: 'Sat', orders: 120, avgTime: 13.5, onTime: 96.8, waste: 3.9, quality: 4.9 },
    { day: 'Today', orders: 156, avgTime: 14.5, onTime: 94.2, waste: 4.8, quality: 4.7 },
  ],
  hourlyLoad: [
    { hour: '8AM', orders: 45, capacity: 50 },
    { hour: '9AM', orders: 12, capacity: 50 },
    { hour: '10AM', orders: 8, capacity: 50 },
    { hour: '11AM', orders: 25, capacity: 50 },
    { hour: '12PM', orders: 78, capacity: 80 },
    { hour: '1PM', orders: 95, capacity: 80 },
    { hour: '2PM', orders: 42, capacity: 50 },
    { hour: '3PM', orders: 35, capacity: 50 },
  ],
};

const _COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const EnhancedKitchenDashboard: React.FC<EnhancedKitchenDashboardProps> = ({
  kitchenData: _kitchenData,
  className,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [_selectedStation, _setSelectedStation] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sortBy, setSortBy] = useState<'priority' | 'time' | 'station'>('priority');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const refreshTimer = setInterval(() => {
        // In a real app, this would fetch fresh data
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(refreshTimer);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500';
      case 'in_progress':
      case 'cooking':
      case 'preparing':
        return 'bg-yellow-500';
      case 'queued':
        return 'bg-blue-500';
      case 'maintenance':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getInventoryStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'low':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const _formatTime = (timeString: string) => {
    return new Date(`2024-01-12 ${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const calculateProgress = (order: any) => {
    if (order.status === 'ready') return 100;
    if (order.status === 'queued') return 0;
    return Math.min((order.timeElapsed / order.totalPrepTime) * 100, 100);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Kitchen Overview Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Active Orders</p>
                <p className="text-2xl font-bold">{mockOrderQueue.length}</p>
                <p className="text-xs text-orange-200 mt-1">In queue</p>
              </div>
              <Utensils className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Avg Prep Time</p>
                <p className="text-2xl font-bold">{mockPerformanceMetrics.daily.avgPrepTime}m</p>
                <p className="text-xs text-blue-200 mt-1">Today's average</p>
              </div>
              <Timer className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">On-Time Delivery</p>
                <p className="text-2xl font-bold">{mockPerformanceMetrics.daily.onTimeDelivery}%</p>
                <p className="text-xs text-green-200 mt-1">Performance score</p>
              </div>
              <Target className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Quality Score</p>
                <p className="text-2xl font-bold">{mockPerformanceMetrics.daily.qualityScore}/5</p>
                <p className="text-xs text-purple-200 mt-1">Customer rating</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-refresh controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                <span className="text-sm font-medium">Auto Refresh</span>
              </div>
              <Select value={sortBy} onValueChange={value => setSortBy(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="station">Station</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="px-3 py-1">
                <Clock className="h-4 w-4 mr-1" />
                {currentTime.toLocaleTimeString()}
              </Badge>
              <Button size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="orders">Order Queue</TabsTrigger>
          <TabsTrigger value="stations">Kitchen Stations</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Order Queue Tab */}
        <TabsContent value="orders" className="space-y-6">
          <div className="grid gap-4">
            {mockOrderQueue
              .sort((a, b) => {
                if (sortBy === 'priority') {
                  const priorityOrder = { high: 3, medium: 2, low: 1 };
                  return (
                    priorityOrder[b.priority as keyof typeof priorityOrder] -
                    priorityOrder[a.priority as keyof typeof priorityOrder]
                  );
                } else if (sortBy === 'time') {
                  return a.totalPrepTime - b.totalPrepTime;
                }
                return a.id.localeCompare(b.id);
              })
              .map(order => (
                <Card
                  key={order.id}
                  className={`transition-all duration-200 ${order.status === 'ready' ? 'border-green-500 bg-green-50' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status === 'ready' ? (
                            <CheckCircle className="h-5 w-5 text-white" />
                          ) : order.status === 'in_progress' ? (
                            <PlayCircle className="h-5 w-5 text-white" />
                          ) : (
                            <Clock className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{order.id}</h3>
                          <p className="text-sm text-gray-600">
                            {order.studentName} • {order.grade}
                            {order.section} • {order.mealType}
                          </p>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <Badge
                          variant={order.status === 'ready' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {order.status.replace('_', ' ')}
                        </Badge>
                        <p className={cn('text-sm font-medium', getPriorityColor(order.priority))}>
                          {order.priority.toUpperCase()} PRIORITY
                        </p>
                        <p className="text-xs text-gray-500">Est: {order.estimatedReady}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Preparation Progress</span>
                        <span className="text-sm text-gray-600">
                          {order.timeElapsed}m / {order.totalPrepTime}m
                        </span>
                      </div>
                      <Progress value={calculateProgress(order)} className="h-2" />
                    </div>

                    {/* Order Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Items & Status:</p>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <span className="text-sm">{item.name}</span>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant={item.status === 'ready' ? 'default' : 'secondary'}
                                  className="text-xs capitalize"
                                >
                                  {item.status}
                                </Badge>
                                <span className="text-xs text-gray-500">{item.station}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Details:</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Assigned Chef:</span>
                            <span className="font-medium">{order.assignedChef}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Start Time:</span>
                            <span>{order.actualStartTime || order.startTime}</span>
                          </div>
                          {order.allergies.length > 0 && (
                            <div>
                              <span className="text-red-600 font-medium">Allergies:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {order.allergies.map(allergy => (
                                  <Badge key={allergy} variant="destructive" className="text-xs">
                                    {allergy}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {order.specialRequests && (
                            <div>
                              <span className="font-medium">Special Requests:</span>
                              <p className="text-gray-600 mt-1">{order.specialRequests}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {order.status === 'queued' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Start Cooking
                        </Button>
                      )}
                      {order.status === 'in_progress' && (
                        <>
                          <Button size="sm" variant="outline">
                            <PauseCircle className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Ready
                          </Button>
                        </>
                      )}
                      {order.status === 'ready' && (
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          <Bell className="h-4 w-4 mr-1" />
                          Notify Pickup
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Kitchen Stations Tab */}
        <TabsContent value="stations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {mockKitchenStations.map(station => (
              <Card
                key={station.id}
                className={`transition-all duration-200 ${
                  station.status === 'maintenance'
                    ? 'border-red-300 bg-red-50'
                    : station.status === 'busy'
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-green-300 bg-green-50'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{station.name}</CardTitle>
                    <Badge
                      variant={
                        station.status === 'maintenance'
                          ? 'destructive'
                          : station.status === 'busy'
                            ? 'secondary'
                            : 'default'
                      }
                      className="capitalize"
                    >
                      {station.status}
                    </Badge>
                  </div>
                  <CardDescription>{station.chef}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                      <p className="text-sm text-gray-600">Avg Time</p>
                      <p className="font-semibold">{station.avgTime}m</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <Thermometer className="h-5 w-5 mx-auto mb-1 text-red-600" />
                      <p className="text-sm text-gray-600">Temperature</p>
                      <p className="font-semibold">{station.temperature}°C</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Capacity</span>
                      <span className="text-sm">
                        {station.currentOrders}/{station.maxCapacity}
                      </span>
                    </div>
                    <Progress
                      value={(station.currentOrders / station.maxCapacity) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Efficiency</span>
                      <span className="text-sm">{station.efficiency}%</span>
                    </div>
                    <Progress value={station.efficiency} className="h-2" />
                  </div>

                  <div className="text-xs text-gray-500">Last cleaned: {station.lastCleaned}</div>

                  <div className="flex space-x-2">
                    {station.status === 'maintenance' ? (
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Settings className="h-4 w-4 mr-1" />
                          Settings
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Clean
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Current Stock Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockInventoryStatus.map(item => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          {item.category === 'protein' && <Beef className="h-4 w-4 text-red-500" />}
                          {item.category === 'grains' && (
                            <Wheat className="h-4 w-4 text-yellow-500" />
                          )}
                          {item.category === 'produce' && (
                            <Apple className="h-4 w-4 text-green-500" />
                          )}
                          {item.category === 'dairy' && <Milk className="h-4 w-4 text-blue-500" />}
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span
                            className={cn('font-semibold', getInventoryStatusColor(item.status))}
                          >
                            {item.currentStock} {item.unit}
                          </span>
                          <p className="text-xs text-gray-500">Min: {item.minThreshold}</p>
                        </div>
                      </div>
                      <Progress
                        value={(item.currentStock / item.maxCapacity) * 100}
                        className={cn(
                          'h-2',
                          item.status === 'critical'
                            ? 'bg-red-100'
                            : item.status === 'low'
                              ? 'bg-yellow-100'
                              : 'bg-green-100'
                        )}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          Daily usage: {item.dailyUsage} {item.unit}
                        </span>
                        <span>Expires: {item.expiryDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Delivery Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockInventoryStatus
                    .filter(item => item.status === 'low' || item.status === 'critical')
                    .map(item => (
                      <Alert
                        key={item.id}
                        className={
                          item.status === 'critical'
                            ? 'border-red-200 bg-red-50'
                            : 'border-yellow-200 bg-yellow-50'
                        }
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle
                          className={
                            item.status === 'critical' ? 'text-red-800' : 'text-yellow-800'
                          }
                        >
                          {item.name} - {item.status.toUpperCase()}
                        </AlertTitle>
                        <AlertDescription
                          className={
                            item.status === 'critical' ? 'text-red-700' : 'text-yellow-700'
                          }
                        >
                          Next delivery: {item.nextDelivery} from {item.supplier}
                          <div className="mt-2 flex space-x-2">
                            <Button size="sm" variant="outline">
                              Contact Supplier
                            </Button>
                            <Button size="sm" variant="default">
                              Rush Order
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Weekly Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockPerformanceMetrics.weekly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Orders"
                    />
                    <Line
                      type="monotone"
                      dataKey="avgTime"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Avg Time (min)"
                    />
                    <Line
                      type="monotone"
                      dataKey="onTime"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="On Time %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Hourly Order Load
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockPerformanceMetrics.hourlyLoad}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
                    <Bar dataKey="capacity" fill="#e5e7eb" name="Capacity" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Utensils className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">
                    {mockPerformanceMetrics.daily.ordersCompleted}
                  </p>
                  <p className="text-sm text-gray-600">Orders Completed</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">{mockPerformanceMetrics.daily.efficiency}%</p>
                  <p className="text-sm text-gray-600">Overall Efficiency</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Scale className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold">
                    {mockPerformanceMetrics.daily.wastePercentage}%
                  </p>
                  <p className="text-sm text-gray-600">Waste Percentage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Active Kitchen Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Critical Stock Alert</AlertTitle>
                <AlertDescription className="text-red-700">
                  Fresh Milk stock critically low (3 liters remaining). Immediate restocking
                  required.
                  <Button size="sm" className="mt-2 bg-red-600 hover:bg-red-700">
                    Order Now
                  </Button>
                </AlertDescription>
              </Alert>

              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Station Maintenance</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  Beverage Station is currently under maintenance. Est. completion: 2:00 PM.
                  <Button size="sm" variant="outline" className="mt-2">
                    View Details
                  </Button>
                </AlertDescription>
              </Alert>

              <Alert className="border-blue-200 bg-blue-50">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Peak Hour Approaching</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Lunch rush expected in 30 minutes. Current queue: 3 orders. Recommend prepping
                  popular items.
                  <Button size="sm" variant="outline" className="mt-2">
                    View Prep Suggestions
                  </Button>
                </AlertDescription>
              </Alert>

              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Quality Achievement</AlertTitle>
                <AlertDescription className="text-green-700">
                  Congratulations! Your team achieved a 4.7/5 quality rating today - exceeding the
                  target!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-gray-600">
                    Get notified when inventory falls below threshold
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Queue Overload Warnings</p>
                  <p className="text-sm text-gray-600">Alert when order queue exceeds capacity</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Quality Score Notifications</p>
                  <p className="text-sm text-gray-600">Daily quality performance updates</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Maintenance Reminders</p>
                  <p className="text-sm text-gray-600">Scheduled maintenance and cleaning alerts</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { EnhancedKitchenDashboard };
