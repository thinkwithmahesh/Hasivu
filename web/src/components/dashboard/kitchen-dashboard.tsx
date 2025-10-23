'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ChefHat,
  Clock,
  Package,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Users,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { MealOrder, InventoryItem, KitchenOperation } from './types';

interface KitchenDashboardProps {
  className?: string;
}

// Mock data - replace with actual data fetching
const mockActiveOrders: (MealOrder & {
  prepTime?: number;
  ingredients?: string[];
  allergens?: string[];
  specialInstructions?: string;
})[] = [
  {
    id: '1',
    studentId: 'student-1',
    studentName: 'Arjun Sharma',
    class: '8A',
    mealType: 'lunch',
    items: [
      {
        id: '1',
        name: 'Vegetable Biryani',
        category: 'main',
        price: 45,
        quantity: 1,
        nutritionalInfo: {
          calories: 420,
          protein: 12,
          carbs: 65,
          fat: 15,
          fiber: 6,
          sodium: 650,
          sugar: 8,
        },
        isVegetarian: true,
        allergens: ['gluten'],
      },
    ],
    status: 'pending',
    orderDate: '2024-01-12T11:30:00Z',
    totalAmount: 45,
    priority: 'high',
    prepTime: 25,
    ingredients: ['Basmati Rice', 'Mixed Vegetables', 'Spices', 'Ghee'],
    specialInstructions: 'Extra vegetables, less spicy',
  },
  {
    id: '2',
    studentId: 'student-2',
    studentName: 'Priya Singh',
    class: '7B',
    mealType: 'lunch',
    items: [
      {
        id: '2',
        name: 'Dal Rice Bowl',
        category: 'main',
        price: 40,
        quantity: 2,
        nutritionalInfo: {
          calories: 380,
          protein: 14,
          carbs: 60,
          fat: 12,
          fiber: 8,
          sodium: 580,
          sugar: 5,
        },
        isVegetarian: true,
      },
    ],
    status: 'preparing',
    orderDate: '2024-01-12T11:45:00Z',
    totalAmount: 80,
    priority: 'medium',
    prepTime: 15,
    ingredients: ['Dal', 'Rice', 'Turmeric', 'Cumin'],
  },
  {
    id: '3',
    studentId: 'student-3',
    studentName: 'Raj Patel',
    class: '9A',
    mealType: 'lunch',
    items: [
      {
        id: '3',
        name: 'Paneer Curry',
        category: 'main',
        price: 50,
        quantity: 1,
        nutritionalInfo: {
          calories: 450,
          protein: 18,
          carbs: 25,
          fat: 28,
          fiber: 4,
          sodium: 720,
          sugar: 8,
        },
        isVegetarian: true,
        allergens: ['dairy'],
      },
    ],
    status: 'ready',
    orderDate: '2024-01-12T11:00:00Z',
    totalAmount: 50,
    priority: 'low',
    prepTime: 30,
  },
  {
    id: '4',
    studentId: 'student-4',
    studentName: 'Ananya Kumar',
    class: '6C',
    mealType: 'breakfast',
    items: [
      {
        id: '4',
        name: 'Poha',
        category: 'main',
        price: 25,
        quantity: 1,
        nutritionalInfo: {
          calories: 250,
          protein: 8,
          carbs: 35,
          fat: 8,
          fiber: 3,
          sodium: 400,
          sugar: 5,
        },
        isVegetarian: true,
      },
    ],
    status: 'preparing',
    orderDate: '2024-01-12T08:30:00Z',
    totalAmount: 25,
    priority: 'medium',
    prepTime: 10,
    ingredients: ['Poha', 'Onions', 'Peanuts', 'Curry Leaves'],
  },
];

const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Basmati Rice',
    category: 'Grains',
    currentStock: 45,
    minThreshold: 50,
    unit: 'kg',
    supplier: 'Local Farm Co-op',
    cost: 120,
    status: 'low_stock',
  },
  {
    id: '2',
    name: 'Dal (Toor)',
    category: 'Legumes',
    currentStock: 28,
    minThreshold: 20,
    unit: 'kg',
    supplier: 'Organic Supplies',
    cost: 180,
    status: 'in_stock',
  },
  {
    id: '3',
    name: 'Paneer',
    category: 'Dairy',
    currentStock: 8,
    minThreshold: 15,
    unit: 'kg',
    supplier: 'Fresh Dairy',
    expiryDate: '2024-01-15',
    cost: 320,
    status: 'low_stock',
  },
  {
    id: '4',
    name: 'Mixed Vegetables',
    category: 'Vegetables',
    currentStock: 0,
    minThreshold: 25,
    unit: 'kg',
    supplier: 'Green Mart',
    cost: 80,
    status: 'out_of_stock',
  },
  {
    id: '5',
    name: 'Cooking Oil',
    category: 'Oils',
    currentStock: 15,
    minThreshold: 10,
    unit: 'L',
    supplier: 'Oil Mills',
    cost: 150,
    status: 'in_stock',
  },
];

const mockKitchenOperations: KitchenOperation[] = [
  {
    id: '1',
    operationType: 'prep',
    description: 'Chop vegetables for lunch orders',
    assignedTo: 'Ravi Kumar',
    startTime: '2024-01-12T10:00:00Z',
    estimatedDuration: 45,
    status: 'in_progress',
    priority: 'high',
  },
  {
    id: '2',
    operationType: 'cook',
    description: 'Prepare Dal for lunch service',
    assignedTo: 'Sunita Devi',
    startTime: '2024-01-12T11:00:00Z',
    estimatedDuration: 30,
    status: 'pending',
    priority: 'high',
  },
  {
    id: '3',
    operationType: 'clean',
    description: 'Deep clean prep area',
    assignedTo: 'Mohan Singh',
    startTime: '2024-01-12T14:00:00Z',
    estimatedDuration: 60,
    status: 'pending',
    priority: 'medium',
  },
];

const mockMealCountData = [
  { mealType: 'Breakfast', planned: 180, prepared: 165, remaining: 15 },
  { mealType: 'Lunch', planned: 450, prepared: 320, remaining: 130 },
  { mealType: 'Snacks', planned: 200, prepared: 85, remaining: 115 },
];

const mockPreparationTimes = [
  { dish: 'Dal Rice', avgTime: 15, todayTime: 12 },
  { dish: 'Biryani', avgTime: 30, todayTime: 35 },
  { dish: 'Poha', avgTime: 10, todayTime: 8 },
  { dish: 'Paneer Curry', avgTime: 25, todayTime: 28 },
];

const COLORS = {
  primary: '#4CAF50',
  secondary: '#9C27B0',
  accent: '#FF9800',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
};

export function KitchenDashboard({ className }: KitchenDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Update current time every minute
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearTimeout(timer);
      clearInterval(timeTimer);
    };
  }, []);

  const handleOrderSelect = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const pendingOrders = mockActiveOrders.filter(order => order.status === 'pending');
  const preparingOrders = mockActiveOrders.filter(order => order.status === 'preparing');
  const readyOrders = mockActiveOrders.filter(order => order.status === 'ready');

  const totalPlannedMeals = mockMealCountData.reduce((sum, meal) => sum + meal.planned, 0);
  const totalPreparedMeals = mockMealCountData.reduce((sum, meal) => sum + meal.prepared, 0);
  const completionRate = (totalPreparedMeals / totalPlannedMeals) * 100;

  const lowStockItems = mockInventory.filter(
    item => item.status === 'low_stock' || item.status === 'out_of_stock'
  );

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kitchen Dashboard</h1>
            <p className="text-primary-100 mt-1">Real-time kitchen operations</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-primary-100">Current Time</p>
              <p className="text-xl font-bold">
                {currentTime.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <ChefHat className="h-8 w-8 text-primary-200" />
          </div>
        </div>
      </div>

      {/* Alert for Low Stock */}
      {lowStockItems.length > 0 && (
        <Card className="border-warning-200 bg-warning-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
              <CardTitle className="text-warning-800">Inventory Alert</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {lowStockItems.slice(0, 3).map(item => (
                <p key={item.id} className="text-warning-700 text-sm">
                  {item.name}:{' '}
                  {item.status === 'out_of_stock'
                    ? 'Out of stock'
                    : `${item.currentStock} ${item.unit} remaining`}
                </p>
              ))}
              {lowStockItems.length > 3 && (
                <p className="text-warning-600 text-sm font-medium">
                  +{lowStockItems.length - 3} more items need attention
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-600">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Avg prep time: 20 min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preparing</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info-600">{preparingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Currently cooking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Pickup</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-600">{readyOrders.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting collection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-600">{completionRate.toFixed(0)}%</div>
            <Progress value={completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {totalPreparedMeals}/{totalPlannedMeals} meals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orders">Active Orders</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Orders</span>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">Sort by priority</span>
                </div>
              </CardTitle>
              <CardDescription>
                Orders requiring kitchen attention, sorted by priority and time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead>Order #</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Prep Time</TableHead>
                      <TableHead>Special Notes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Order Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockActiveOrders
                      .filter(order => order.status !== 'completed')
                      .sort((a, b) => {
                        // Sort by priority first (high > medium > low)
                        const priorityOrder: Record<string, number> = {
                          high: 3,
                          medium: 2,
                          low: 1,
                        };
                        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                          return priorityOrder[b.priority] - priorityOrder[a.priority];
                        }
                        // Then by order time (oldest first)
                        return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
                      })
                      .map(order => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedOrders.includes(order.id)}
                              onCheckedChange={checked => handleOrderSelect(order.id, !!checked)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.studentName}</p>
                              <p className="text-xs text-muted-foreground">{order.class}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {order.items.map((item, index) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium">{item.quantity}x</span> {item.name}
                                  {item.allergens && item.allergens.length > 0 && (
                                    <div className="text-xs text-warning-600">
                                      ⚠️ {item.allergens.join(', ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-sm">{order.prepTime} min</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-32 text-xs text-muted-foreground">
                              {order.specialInstructions || 'None'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                order.status === 'pending' && 'bg-warning-100 text-warning-800',
                                order.status === 'preparing' && 'bg-info-100 text-info-800',
                                order.status === 'ready' && 'bg-success-100 text-success-800'
                              )}
                            >
                              {order.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {order.status === 'preparing' && <Flame className="w-3 h-3 mr-1" />}
                              {order.status === 'ready' && (
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                              )}
                              <span className="capitalize">{order.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={cn(
                                'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                                order.priority === 'high' && 'bg-error-100 text-error-700',
                                order.priority === 'medium' && 'bg-warning-100 text-warning-700',
                                order.priority === 'low' && 'bg-success-100 text-success-700'
                              )}
                            >
                              {order.priority === 'high' && <ArrowUp className="w-3 h-3 mr-1" />}
                              {order.priority === 'low' && <ArrowDown className="w-3 h-3 mr-1" />}
                              <span className="capitalize">{order.priority}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(order.orderDate).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              {selectedOrders.length > 0 && (
                <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-800">
                    {selectedOrders.length} orders selected
                  </span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-info-600 text-white rounded text-sm hover:bg-info-700">
                      Start Preparation
                    </button>
                    <button className="px-3 py-1 bg-success-600 text-white rounded text-sm hover:bg-success-700">
                      Mark as Ready
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kitchen Operations</CardTitle>
                <CardDescription>Current tasks and assignments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockKitchenOperations.map(operation => (
                  <div
                    key={operation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          operation.status === 'pending' && 'bg-warning-100',
                          operation.status === 'in_progress' && 'bg-info-100',
                          operation.status === 'completed' && 'bg-success-100'
                        )}
                      >
                        {operation.operationType === 'prep' && (
                          <Package className="h-4 w-4 text-warning-600" />
                        )}
                        {operation.operationType === 'cook' && (
                          <Flame className="h-4 w-4 text-info-600" />
                        )}
                        {operation.operationType === 'clean' && (
                          <CheckCircle2 className="h-4 w-4 text-success-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{operation.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Assigned to: {operation.assignedTo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Duration: {operation.estimatedDuration} min
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          operation.status === 'pending' && 'bg-warning-100 text-warning-800',
                          operation.status === 'in_progress' && 'bg-info-100 text-info-800',
                          operation.status === 'completed' && 'bg-success-100 text-success-800'
                        )}
                      >
                        <span className="capitalize">{operation.status.replace('_', ' ')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Start:{' '}
                        {new Date(operation.startTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Meal Count</CardTitle>
                <CardDescription>Planned vs prepared meals</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockMealCountData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mealType" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="planned" fill={COLORS.info} name="Planned" />
                    <Bar dataKey="prepared" fill={COLORS.success} name="Prepared" />
                    <Bar dataKey="remaining" fill={COLORS.warning} name="Remaining" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Status
              </CardTitle>
              <CardDescription>Current stock levels and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min Threshold</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockInventory.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>
                              {item.currentStock} {item.unit}
                            </span>
                            {item.currentStock <= item.minThreshold && (
                              <AlertTriangle className="h-4 w-4 text-warning-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.minThreshold} {item.unit}
                        </TableCell>
                        <TableCell>
                          <div
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              item.status === 'in_stock' && 'bg-success-100 text-success-800',
                              item.status === 'low_stock' && 'bg-warning-100 text-warning-800',
                              item.status === 'out_of_stock' && 'bg-error-100 text-error-800'
                            )}
                          >
                            {item.status === 'in_stock' && (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            )}
                            {item.status === 'low_stock' && (
                              <AlertTriangle className="w-3 h-3 mr-1" />
                            )}
                            {item.status === 'out_of_stock' && (
                              <AlertTriangle className="w-3 h-3 mr-1" />
                            )}
                            <span>{item.status.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{item.supplier}</TableCell>
                        <TableCell>{formatCurrency(item.cost)}</TableCell>
                        <TableCell>
                          {item.expiryDate ? (
                            <span
                              className={cn(
                                'text-sm',
                                new Date(item.expiryDate) <
                                  new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                                  ? 'text-error-600 font-medium'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {formatDate(new Date(item.expiryDate), 'short')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Preparation Time Analysis</CardTitle>
                <CardDescription>Average vs today's preparation times</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockPreparationTimes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dish" />
                    <YAxis />
                    <Tooltip formatter={value => [`${value} min`, '']} />
                    <Bar dataKey="avgTime" fill={COLORS.info} name="Average Time" />
                    <Bar dataKey="todayTime" fill={COLORS.primary} name="Today's Time" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kitchen Performance</CardTitle>
                <CardDescription>Today's operational metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Order Fulfillment Rate</span>
                    <span className="text-sm text-success-600 font-bold">94%</span>
                  </div>
                  <Progress value={94} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">On-Time Delivery</span>
                    <span className="text-sm text-success-600 font-bold">87%</span>
                  </div>
                  <Progress value={87} />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Kitchen Efficiency</span>
                    <span className="text-sm text-info-600 font-bold">91%</span>
                  </div>
                  <Progress value={91} />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-3 bg-success-50 rounded-lg">
                    <p className="text-lg font-bold text-success-600">{totalPreparedMeals}</p>
                    <p className="text-xs text-muted-foreground">Meals Prepared</p>
                  </div>
                  <div className="text-center p-3 bg-info-50 rounded-lg">
                    <p className="text-lg font-bold text-info-600">12.5</p>
                    <p className="text-xs text-muted-foreground">Avg Time (min)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
