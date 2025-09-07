"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  Users, DollarSign, TrendingUp, ChefHat, AlertCircle,
  CheckCircle2, Clock, Filter, Download, School
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { MealOrder, Student, SchoolAnalytics, NutritionalInfo } from './types';

interface AdminDashboardProps {
  className?: string;
}

// Mock data - replace with actual data fetching
const mockSchoolAnalytics: SchoolAnalytics = {
  totalStudents: 1250,
  totalOrders: 3450,
  totalRevenue: 156750,
  averageOrderValue: 45.5,
  popularMeals: [
    { name: 'Vegetable Biryani', orders: 450, revenue: 20250 },
    { name: 'Dal Rice Bowl', orders: 380, revenue: 15200 },
    { name: 'Healthy Breakfast Bowl', orders: 320, revenue: 11200 },
    { name: 'Fruit Salad', orders: 280, revenue: 8400 },
    { name: 'Sandwich Combo', orders: 250, revenue: 10000 },
  ],
  nutritionCompliance: 92,
  wasteReduction: 15
};

const mockRecentOrders: (MealOrder & { 
  checked?: boolean; 
  estimatedTime?: string;
  kitchenNotes?: string;
})[] = [
  {
    id: '1',
    studentId: 'student-1',
    studentName: 'Arjun Sharma',
    class: '8A',
    section: 'A',
    mealType: 'lunch',
    items: [
      { 
        id: '1', 
        name: 'Vegetable Biryani', 
        category: 'main', 
        price: 45, 
        quantity: 1, 
        nutritionalInfo: { calories: 420, protein: 12, carbs: 65, fat: 15, fiber: 6, sodium: 650, sugar: 8 }, 
        isVegetarian: true 
      }
    ],
    status: 'pending',
    orderDate: '2024-01-12',
    totalAmount: 45,
    priority: 'high',
    checked: false,
    estimatedTime: '15 min',
    kitchenNotes: 'Extra vegetables requested'
  },
  {
    id: '2',
    studentId: 'student-2',
    studentName: 'Priya Singh',
    class: '7B',
    section: 'B',
    mealType: 'lunch',
    items: [
      { 
        id: '2', 
        name: 'Dal Rice Bowl', 
        category: 'main', 
        price: 40, 
        quantity: 1, 
        nutritionalInfo: { calories: 380, protein: 14, carbs: 60, fat: 12, fiber: 8, sodium: 580, sugar: 5 }, 
        isVegetarian: true 
      }
    ],
    status: 'preparing',
    orderDate: '2024-01-12',
    totalAmount: 40,
    priority: 'medium',
    checked: false,
    estimatedTime: '10 min'
  },
  {
    id: '3',
    studentId: 'student-3',
    studentName: 'Raj Patel',
    class: '9A',
    section: 'A',
    mealType: 'snack',
    items: [
      { 
        id: '3', 
        name: 'Fruit Salad', 
        category: 'dessert', 
        price: 30, 
        quantity: 2, 
        nutritionalInfo: { calories: 120, protein: 2, carbs: 25, fat: 1, fiber: 4, sodium: 10, sugar: 20 }, 
        isVegetarian: true 
      }
    ],
    status: 'ready',
    orderDate: '2024-01-12',
    totalAmount: 60,
    priority: 'low',
    checked: false
  },
  {
    id: '4',
    studentId: 'student-4',
    studentName: 'Ananya Kumar',
    class: '6C',
    section: 'C',
    mealType: 'breakfast',
    items: [
      { 
        id: '4', 
        name: 'Healthy Breakfast Bowl', 
        category: 'main', 
        price: 35, 
        quantity: 1, 
        nutritionalInfo: { calories: 320, protein: 15, carbs: 45, fat: 10, fiber: 8, sodium: 400, sugar: 12 }, 
        isVegetarian: true 
      }
    ],
    status: 'completed',
    orderDate: '2024-01-12',
    totalAmount: 35,
    priority: 'medium',
    checked: true
  }
];

const mockRevenueData = [
  { month: 'Jul', revenue: 125000, orders: 2800 },
  { month: 'Aug', revenue: 132000, orders: 2950 },
  { month: 'Sep', revenue: 145000, orders: 3200 },
  { month: 'Oct', revenue: 138000, orders: 3100 },
  { month: 'Nov', revenue: 152000, orders: 3350 },
  { month: 'Dec', revenue: 156750, orders: 3450 }
];

const mockNutritionReports = [
  {
    class: '6th Grade',
    students: 180,
    averageCalories: 1650,
    proteinGoal: 88,
    nutritionScore: 85,
    compliance: 92
  },
  {
    class: '7th Grade',
    students: 200,
    averageCalories: 1720,
    proteinGoal: 90,
    nutritionScore: 89,
    compliance: 94
  },
  {
    class: '8th Grade',
    students: 190,
    averageCalories: 1800,
    proteinGoal: 95,
    nutritionScore: 91,
    compliance: 96
  },
  {
    class: '9th Grade',
    students: 220,
    averageCalories: 1900,
    proteinGoal: 98,
    nutritionScore: 87,
    compliance: 89
  },
  {
    class: '10th Grade',
    students: 210,
    averageCalories: 1950,
    proteinGoal: 100,
    nutritionScore: 93,
    compliance: 95
  }
];

const mockOperationalMetrics = {
  kitchenEfficiency: 94,
  orderFulfillmentTime: 12.5, // minutes
  customerSatisfaction: 4.6, // out of 5
  wasteReduction: 15, // percentage
  energyConsumption: 85, // percentage of optimal
};

const COLORS = {
  primary: '#4CAF50',
  secondary: '#9C27B0',
  accent: '#FF9800',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3'
};

export function AdminDashboard({ className }: AdminDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [orders, setOrders] = useState(mockRecentOrders);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleOrderSelect = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
    
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, checked } : order
    ));
  };

  const handleSelectAll = (checked: boolean) => {
    const visibleOrderIds = orders.filter(order => order.status !== 'completed').map(order => order.id);
    setSelectedOrders(checked ? visibleOrderIds : []);
    setOrders(orders.map(order => ({ ...order, checked: checked && order.status !== 'completed' })));
  };

  const revenueGrowth = mockRevenueData.length > 1 ? 
    ((mockRevenueData[mockRevenueData.length - 1].revenue - mockRevenueData[mockRevenueData.length - 2].revenue) / 
     mockRevenueData[mockRevenueData.length - 2].revenue * 100) : 0;

  const popularMealsData = mockSchoolAnalytics.popularMeals.map((meal, index) => ({
    ...meal,
    fill: `hsl(${120 + index * 60}, 70%, 50%)`
  }));

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
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
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-primary-100 mt-1">School Meal Program Management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-primary-100">This Month</p>
              <p className="text-2xl font-bold">{formatCurrency(mockSchoolAnalytics.totalRevenue)}</p>
            </div>
            <School className="h-8 w-8 text-primary-200" />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSchoolAnalytics.totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Active in meal program
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mockSchoolAnalytics.totalRevenue)}
            </div>
            <p className={cn(
              "text-xs",
              revenueGrowth >= 0 ? "text-success-600" : "text-error-600"
            )}>
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSchoolAnalytics.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg {formatCurrency(mockSchoolAnalytics.averageOrderValue)} per order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nutrition Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-600">
              {mockSchoolAnalytics.nutritionCompliance}%
            </div>
            <Progress 
              value={mockSchoolAnalytics.nutritionCompliance} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Order Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition Reports</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue and order volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(Number(value)) : value,
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={COLORS.primary} 
                      fill={COLORS.primary} 
                      fillOpacity={0.6}
                      name="revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Popular Meals */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Meals</CardTitle>
                <CardDescription>Top 5 most ordered items this month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={popularMealsData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => [value, 'Orders']} />
                    <Bar dataKey="orders" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Kitchen Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-success-600">
                    {mockOperationalMetrics.kitchenEfficiency}%
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-success-500" />
                </div>
                <Progress value={mockOperationalMetrics.kitchenEfficiency} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Avg Fulfillment Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-info-600">
                  {mockOperationalMetrics.orderFulfillmentTime} min
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: &lt; 15 min
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning-600">
                  {mockOperationalMetrics.customerSatisfaction}/5
                </div>
                <div className="flex text-warning-500 mt-1">
                  {'★'.repeat(Math.floor(mockOperationalMetrics.customerSatisfaction))}
                  {'☆'.repeat(5 - Math.floor(mockOperationalMetrics.customerSatisfaction))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Waste Reduction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success-600">
                  {mockOperationalMetrics.wasteReduction}%
                </div>
                <p className="text-xs text-success-600 mt-1">
                  vs last month
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order Management</span>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    {selectedOrders.length} selected
                  </span>
                </div>
              </CardTitle>
              <CardDescription>
                Manage and track meal orders across the school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedOrders.length === orders.filter(o => o.status !== 'completed').length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Checkbox
                            checked={order.checked || false}
                            onCheckedChange={(checked) => handleOrderSelect(order.id, !!checked)}
                            disabled={order.status === 'completed'}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {order.studentName}
                        </TableCell>
                        <TableCell>{order.class}</TableCell>
                        <TableCell className="capitalize">{order.mealType}</TableCell>
                        <TableCell>
                          <div className="max-w-32 truncate">
                            {order.items.map(item => item.name).join(', ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            order.status === 'pending' && "bg-info-100 text-info-800",
                            order.status === 'preparing' && "bg-warning-100 text-warning-800",
                            order.status === 'ready' && "bg-success-100 text-success-800",
                            order.status === 'completed' && "bg-gray-100 text-gray-800"
                          )}>
                            {order.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {order.status === 'preparing' && <ChefHat className="w-3 h-3 mr-1" />}
                            {order.status === 'ready' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            <span className="capitalize">{order.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.estimatedTime || formatDate(new Date(order.orderDate), 'short')}
                        </TableCell>
                        <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                        <TableCell>
                          <div className={cn(
                            "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
                            order.priority === 'high' && "bg-error-100 text-error-700",
                            order.priority === 'medium' && "bg-warning-100 text-warning-700",
                            order.priority === 'low' && "bg-success-100 text-success-700"
                          )}>
                            {order.priority === 'high' && <AlertCircle className="w-3 h-3 mr-1" />}
                            <span className="capitalize">{order.priority}</span>
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
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      Mark as Preparing
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

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Volume by Time</CardTitle>
                <CardDescription>Peak hours and meal distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { time: '7:00', breakfast: 45, lunch: 0, snack: 0 },
                    { time: '8:00', breakfast: 120, lunch: 0, snack: 0 },
                    { time: '9:00', breakfast: 80, lunch: 0, snack: 15 },
                    { time: '10:00', breakfast: 20, lunch: 0, snack: 45 },
                    { time: '11:00', breakfast: 5, lunch: 30, snack: 25 },
                    { time: '12:00', breakfast: 0, lunch: 200, snack: 10 },
                    { time: '13:00', breakfast: 0, lunch: 350, snack: 5 },
                    { time: '14:00', breakfast: 0, lunch: 180, snack: 20 },
                    { time: '15:00', breakfast: 0, lunch: 45, snack: 60 },
                    { time: '16:00', breakfast: 0, lunch: 10, snack: 80 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="breakfast" stroke={COLORS.warning} name="Breakfast" />
                    <Line type="monotone" dataKey="lunch" stroke={COLORS.primary} name="Lunch" />
                    <Line type="monotone" dataKey="snack" stroke={COLORS.info} name="Snack" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Revenue breakdown and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary-50 rounded-lg">
                    <p className="text-2xl font-bold text-primary-600">
                      {formatCurrency(mockSchoolAnalytics.totalRevenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                  <div className="text-center p-4 bg-info-50 rounded-lg">
                    <p className="text-2xl font-bold text-info-600">
                      {formatCurrency(mockSchoolAnalytics.averageOrderValue)}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lunch Orders</span>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Breakfast Orders</span>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Snack Orders</span>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Reports by Grade</CardTitle>
              <CardDescription>Student nutrition compliance and health metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Avg Daily Calories</TableHead>
                      <TableHead>Protein Goal %</TableHead>
                      <TableHead>Nutrition Score</TableHead>
                      <TableHead>Compliance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockNutritionReports.map((report) => (
                      <TableRow key={report.class}>
                        <TableCell className="font-medium">{report.class}</TableCell>
                        <TableCell>{report.students}</TableCell>
                        <TableCell>{report.averageCalories} cal</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={report.proteinGoal} className="flex-1" />
                            <span className="text-sm">{report.proteinGoal}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            report.nutritionScore >= 90 && "bg-success-100 text-success-800",
                            report.nutritionScore >= 80 && report.nutritionScore < 90 && "bg-warning-100 text-warning-800",
                            report.nutritionScore < 80 && "bg-error-100 text-error-800"
                          )}>
                            {report.nutritionScore}/100
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={report.compliance} className="flex-1" />
                            <span className={cn(
                              "text-sm font-medium",
                              report.compliance >= 95 && "text-success-600",
                              report.compliance >= 85 && report.compliance < 95 && "text-warning-600",
                              report.compliance < 85 && "text-error-600"
                            )}>
                              {report.compliance}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kitchen Operations</CardTitle>
                <CardDescription>Real-time kitchen performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Kitchen Efficiency</span>
                    <span className="text-sm text-success-600 font-bold">
                      {mockOperationalMetrics.kitchenEfficiency}%
                    </span>
                  </div>
                  <Progress value={mockOperationalMetrics.kitchenEfficiency} />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Energy Consumption</span>
                    <span className="text-sm text-info-600 font-bold">
                      {mockOperationalMetrics.energyConsumption}%
                    </span>
                  </div>
                  <Progress value={mockOperationalMetrics.energyConsumption} />
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">
                        {mockOperationalMetrics.orderFulfillmentTime}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg. Time (min)</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">
                        {mockOperationalMetrics.wasteReduction}%
                      </p>
                      <p className="text-xs text-muted-foreground">Waste Reduction</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Reports</CardTitle>
                <CardDescription>Download detailed reports and analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span className="text-sm font-medium">Daily Orders Report</span>
                  </div>
                  <span className="text-xs text-muted-foreground">CSV</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span className="text-sm font-medium">Nutrition Analysis</span>
                  </div>
                  <span className="text-xs text-muted-foreground">PDF</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span className="text-sm font-medium">Financial Summary</span>
                  </div>
                  <span className="text-xs text-muted-foreground">XLSX</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span className="text-sm font-medium">Student Reports</span>
                  </div>
                  <span className="text-xs text-muted-foreground">PDF</span>
                </button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}