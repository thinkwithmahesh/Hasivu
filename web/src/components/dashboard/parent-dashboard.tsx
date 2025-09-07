"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  Wallet, Users, Bell, TrendingUp, Calendar, CreditCard,
  Apple, AlertTriangle, CheckCircle, Clock, User
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Student, MealOrder, PaymentHistory, WalletBalance, SpendingAnalytics } from './types';

interface ParentDashboardProps {
  children: Student[];
  className?: string;
}

// Mock data - replace with actual data fetching
const mockChildrenOrders: Record<string, MealOrder[]> = {
  'child-1': [
    {
      id: '1',
      studentId: 'child-1',
      studentName: 'Arjun Sharma',
      mealType: 'lunch',
      items: [
        { id: '1', name: 'Vegetable Biryani', category: 'main', price: 45, quantity: 1, nutritionalInfo: { calories: 420, protein: 12, carbs: 65, fat: 15, fiber: 6, sodium: 650, sugar: 8 }, isVegetarian: true }
      ],
      status: 'preparing',
      orderDate: '2024-01-12',
      totalAmount: 45,
      priority: 'medium'
    }
  ],
  'child-2': [
    {
      id: '2',
      studentId: 'child-2',
      studentName: 'Priya Sharma',
      mealType: 'lunch',
      items: [
        { id: '2', name: 'Dal Rice Bowl', category: 'main', price: 40, quantity: 1, nutritionalInfo: { calories: 380, protein: 14, carbs: 60, fat: 12, fiber: 8, sodium: 580, sugar: 5 }, isVegetarian: true }
      ],
      status: 'ready',
      orderDate: '2024-01-12',
      totalAmount: 40,
      priority: 'medium'
    }
  ]
};

const mockPaymentHistory: PaymentHistory[] = [
  {
    id: '1',
    studentId: 'child-1',
    amount: 500,
    type: 'credit',
    description: 'Wallet top-up',
    date: '2024-01-10',
    status: 'completed'
  },
  {
    id: '2',
    studentId: 'child-1',
    amount: 45,
    type: 'debit',
    description: 'Lunch order',
    date: '2024-01-12',
    status: 'completed',
    orderId: '1'
  },
  {
    id: '3',
    studentId: 'child-2',
    amount: 300,
    type: 'credit',
    description: 'Wallet top-up',
    date: '2024-01-08',
    status: 'completed'
  }
];

const mockWalletBalances: Record<string, WalletBalance> = {
  'child-1': {
    studentId: 'child-1',
    balance: 455,
    lastUpdated: '2024-01-12',
    lowBalanceThreshold: 100
  },
  'child-2': {
    studentId: 'child-2',
    balance: 85,
    lastUpdated: '2024-01-12',
    lowBalanceThreshold: 100
  }
};

const mockSpendingAnalytics: SpendingAnalytics = {
  studentId: 'all',
  period: 'weekly',
  data: [
    { date: '2024-01-06', amount: 120, category: 'Lunch' },
    { date: '2024-01-07', amount: 95, category: 'Lunch' },
    { date: '2024-01-08', amount: 150, category: 'Lunch' },
    { date: '2024-01-09', amount: 110, category: 'Lunch' },
    { date: '2024-01-10', amount: 130, category: 'Lunch' },
    { date: '2024-01-11', amount: 85, category: 'Lunch' },
    { date: '2024-01-12', amount: 140, category: 'Lunch' },
  ],
  totalSpent: 830,
  averagePerDay: 118.5,
  trends: {
    direction: 'up',
    percentage: 12
  }
};

const mockNotifications = [
  {
    id: '1',
    type: 'order_ready',
    message: 'Priya\'s lunch order is ready for pickup',
    studentId: 'child-2',
    timestamp: '2024-01-12T12:30:00Z',
    read: false
  },
  {
    id: '2',
    type: 'low_balance',
    message: 'Priya\'s wallet balance is low (₹85)',
    studentId: 'child-2',
    timestamp: '2024-01-12T08:00:00Z',
    read: false
  },
  {
    id: '3',
    type: 'order_placed',
    message: 'Arjun placed a lunch order',
    studentId: 'child-1',
    timestamp: '2024-01-12T11:00:00Z',
    read: true
  }
];

const COLORS = {
  primary: '#4CAF50',
  secondary: '#9C27B0',
  accent: '#FF9800',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3'
};

const mockChildren: Student[] = [
  {
    id: 'child-1',
    name: 'Arjun Sharma',
    class: '8',
    section: 'A',
    rollNumber: '15',
    avatar: '/avatars/arjun.jpg'
  },
  {
    id: 'child-2',
    name: 'Priya Sharma',
    class: '5',
    section: 'B',
    rollNumber: '22',
    avatar: '/avatars/priya.jpg'
  }
];

export function ParentDashboard({ children = mockChildren, className }: ParentDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [unreadNotifications, setUnreadNotifications] = useState(mockNotifications.filter(n => !n.read).length);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const totalBalance = Object.values(mockWalletBalances).reduce((sum, wallet) => sum + wallet.balance, 0);
  const lowBalanceChildren = Object.entries(mockWalletBalances).filter(([_, wallet]) => 
    wallet.balance < wallet.lowBalanceThreshold
  );

  const allActiveOrders = Object.values(mockChildrenOrders).flat().filter(order => 
    order.status !== 'completed' && order.status !== 'cancelled'
  );

  const spendingChartData = mockSpendingAnalytics.data.map(item => ({
    date: formatDate(new Date(item.date), 'short'),
    amount: item.amount,
  }));

  const nutritionSummary = children.map(child => {
    const orders = mockChildrenOrders[child.id] || [];
    const todayOrders = orders.filter(order => order.orderDate === '2024-01-12');
    const totalCalories = todayOrders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => 
        itemSum + (item.nutritionalInfo.calories * item.quantity), 0), 0);
    
    return {
      name: child.name,
      calories: totalCalories,
      target: 1800, // Mock target for children
      percentage: Math.min((totalCalories / 1800) * 100, 100)
    };
  });

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
            <h1 className="text-2xl font-bold">Parent Dashboard</h1>
            <p className="text-primary-100 mt-1">Managing {children.length} children</p>
          </div>
          <div className="flex items-center gap-4">
            {unreadNotifications > 0 && (
              <div className="relative">
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              </div>
            )}
            <div className="text-right">
              <p className="text-sm text-primary-100">Total Balance</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{children.length}</div>
            <p className="text-xs text-muted-foreground">
              All children active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allActiveOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              {allActiveOrders.filter(o => o.status === 'ready').length} ready for pickup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Spending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mockSpendingAnalytics.totalSpent)}
            </div>
            <p className={cn(
              "text-xs",
              mockSpendingAnalytics.trends.direction === 'up' ? "text-error-600" : "text-success-600"
            )}>
              {mockSpendingAnalytics.trends.direction === 'up' ? '+' : '-'}
              {mockSpendingAnalytics.trends.percentage}% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-600">
              {unreadNotifications}
            </div>
            <p className="text-xs text-muted-foreground">
              {lowBalanceChildren.length > 0 
                ? `${lowBalanceChildren.length} low balance alerts`
                : "All balances healthy"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Balance Alert */}
      {lowBalanceChildren.length > 0 && (
        <Card className="border-warning-200 bg-warning-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
              <CardTitle className="text-warning-800">Low Balance Alert</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowBalanceChildren.map(([childId, wallet]) => {
                const child = children.find(c => c.id === childId);
                return (
                  <div key={childId} className="flex items-center justify-between">
                    <p className="text-warning-700">
                      {child?.name}'s balance is low
                    </p>
                    <p className="font-semibold text-warning-800">
                      {formatCurrency(wallet.balance)}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Children Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Children Overview</CardTitle>
                <CardDescription>Wallet balances and activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {children.map((child) => {
                  const wallet = mockWalletBalances[child.id];
                  const orders = mockChildrenOrders[child.id] || [];
                  const activeOrder = orders.find(o => o.status !== 'completed');
                  
                  return (
                    <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium">{child.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Class {child.class}{child.section} • Roll #{child.rollNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span className={cn(
                            "font-semibold",
                            wallet && wallet.balance < wallet.lowBalanceThreshold 
                              ? "text-error-600" 
                              : "text-success-600"
                          )}>
                            {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
                          </span>
                        </div>
                        {activeOrder && (
                          <p className={cn(
                            "text-xs capitalize",
                            activeOrder.status === 'ready' && "text-success-600",
                            activeOrder.status === 'preparing' && "text-warning-600",
                            activeOrder.status === 'pending' && "text-info-600"
                          )}>
                            {activeOrder.mealType} {activeOrder.status}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Nutrition Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Apple className="h-5 w-5" />
                  Today's Nutrition Summary
                </CardTitle>
                <CardDescription>Calorie intake for each child</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={nutritionSummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'calories' ? `${value} cal` : `${value} cal`,
                        name === 'calories' ? 'Consumed' : 'Target'
                      ]}
                    />
                    <Bar dataKey="calories" fill={COLORS.primary} name="calories" />
                    <Bar dataKey="target" fill={COLORS.info} opacity={0.3} name="target" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="spending" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Spending Trend</CardTitle>
                <CardDescription>Combined spending across all children</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={spendingChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount Spent']} />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke={COLORS.primary} 
                      fill={COLORS.primary} 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spending Analytics</CardTitle>
                <CardDescription>Weekly summary and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary-50 rounded-lg">
                    <p className="text-2xl font-bold text-primary-600">
                      {formatCurrency(mockSpendingAnalytics.totalSpent)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total This Week</p>
                  </div>
                  <div className="text-center p-4 bg-info-50 rounded-lg">
                    <p className="text-2xl font-bold text-info-600">
                      {formatCurrency(mockSpendingAnalytics.averagePerDay)}
                    </p>
                    <p className="text-sm text-muted-foreground">Daily Average</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trend vs Last Week</span>
                    <span className={cn(
                      "text-sm font-medium",
                      mockSpendingAnalytics.trends.direction === 'up' 
                        ? "text-error-600" 
                        : "text-success-600"
                    )}>
                      {mockSpendingAnalytics.trends.direction === 'up' ? '+' : '-'}
                      {mockSpendingAnalytics.trends.percentage}%
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Lunch Orders</span>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Snacks</span>
                      <span className="text-sm font-medium">15%</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>All children's meal orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(mockChildrenOrders).map(([childId, orders]) => {
                  const child = children.find(c => c.id === childId);
                  return orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          order.status === 'ready' && "bg-success-500",
                          order.status === 'preparing' && "bg-warning-500",
                          order.status === 'completed' && "bg-gray-400",
                          order.status === 'pending' && "bg-info-500"
                        )} />
                        <div>
                          <p className="font-medium">{child?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.items[0]?.name} • {order.mealType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(order.orderDate))}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                        <p className={cn(
                          "text-xs capitalize",
                          order.status === 'ready' && "text-success-600",
                          order.status === 'preparing' && "text-warning-600",
                          order.status === 'completed' && "text-gray-500",
                          order.status === 'pending' && "text-info-600"
                        )}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                  ));
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>Wallet transactions and order payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPaymentHistory.map((payment) => {
                  const child = children.find(c => c.id === payment.studentId);
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          payment.type === 'credit' ? "bg-success-100" : "bg-error-100"
                        )}>
                          {payment.type === 'credit' ? (
                            <TrendingUp className={cn("h-4 w-4 text-success-600")} />
                          ) : (
                            <CreditCard className={cn("h-4 w-4 text-error-600")} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{child?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(payment.date))}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-semibold",
                          payment.type === 'credit' ? "text-success-600" : "text-error-600"
                        )}>
                          {payment.type === 'credit' ? '+' : '-'}{formatCurrency(payment.amount)}
                        </p>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-success-500" />
                          <span className="text-xs text-success-600 capitalize">
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Updates about your children's meals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockNotifications.map((notification) => {
                  const child = children.find(c => c.id === notification.studentId);
                  return (
                    <div key={notification.id} className={cn(
                      "flex items-start justify-between p-4 border rounded-lg",
                      !notification.read && "bg-blue-50 border-blue-200"
                    )}>
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center mt-1",
                          notification.type === 'order_ready' && "bg-success-100",
                          notification.type === 'low_balance' && "bg-warning-100",
                          notification.type === 'order_placed' && "bg-info-100"
                        )}>
                          {notification.type === 'order_ready' && <CheckCircle className="h-4 w-4 text-success-600" />}
                          {notification.type === 'low_balance' && <AlertTriangle className="h-4 w-4 text-warning-600" />}
                          {notification.type === 'order_placed' && <Clock className="h-4 w-4 text-info-600" />}
                        </div>
                        <div>
                          <p className="font-medium">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(notification.timestamp), 'short')} at {new Date(notification.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}