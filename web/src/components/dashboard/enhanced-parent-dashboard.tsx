"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, ComposedChart
} from 'recharts';
import { 
  Users, CreditCard, Bell, TrendingUp, Calendar, Settings,
  AlertCircle, CheckCircle, Clock, DollarSign, Activity, Heart,
  ShoppingCart, MessageSquare, FileText, Download, Eye,
  Plus, Minus, Star, Target, Award, Utensils, Apple
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Child {
  id: string;
  name: string;
  class: string;
  section: string;
  avatar?: string;
  grade: string;
  age: number;
  allergies: string[];
  preferences: string[];
}

interface ParentData {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  children: Child[];
}

interface EnhancedParentDashboardProps {
  parentData: ParentData;
  className?: string;
}

// Mock data for comprehensive parent dashboard
const mockChildrenData = [
  {
    id: 'child-001',
    name: 'Sarah Johnson',
    class: '8th Grade',
    section: 'A',
    grade: '8',
    age: 13,
    avatar: '/avatars/sarah.jpg',
    allergies: ['Nuts', 'Dairy'],
    preferences: ['Vegetarian', 'Low Sugar'],
    walletBalance: 245.50,
    monthlySpending: 1250,
    monthlyBudget: 1500,
    nutritionScore: 85,
    attendanceRate: 96,
    recentOrders: [
      { id: '1', meal: 'Vegetable Biryani', date: '2024-01-12', status: 'delivered', amount: 45 },
      { id: '2', meal: 'Fruit Salad', date: '2024-01-12', status: 'preparing', amount: 25 }
    ],
    notifications: [
      { id: '1', type: 'approval', message: 'New meal order requires approval', urgent: true },
      { id: '2', type: 'nutrition', message: 'Daily nutrition goal achieved!', urgent: false }
    ]
  },
  {
    id: 'child-002',
    name: 'David Johnson',
    class: '5th Grade',
    section: 'B',
    grade: '5',
    age: 10,
    avatar: '/avatars/david.jpg',
    allergies: ['Shellfish'],
    preferences: ['No Spicy Food'],
    walletBalance: 156.75,
    monthlySpending: 980,
    monthlyBudget: 1200,
    nutritionScore: 78,
    attendanceRate: 92,
    recentOrders: [
      { id: '1', meal: 'Chicken Sandwich', date: '2024-01-12', status: 'delivered', amount: 35 },
      { id: '2', meal: 'Chocolate Milk', date: '2024-01-11', status: 'delivered', amount: 15 }
    ],
    notifications: [
      { id: '1', type: 'wallet', message: 'Wallet balance below ₹200', urgent: true }
    ]
  }
];

const mockSpendingAnalytics = {
  monthly: [
    { month: 'Aug', sarah: 1320, david: 1050, total: 2370 },
    { month: 'Sep', sarah: 1280, david: 1120, total: 2400 },
    { month: 'Oct', sarah: 1450, david: 980, total: 2430 },
    { month: 'Nov', sarah: 1380, david: 1200, total: 2580 },
    { month: 'Dec', sarah: 1250, david: 980, total: 2230 },
    { month: 'Jan', sarah: 890, david: 654, total: 1544 }
  ],
  categories: [
    { name: 'Lunch', value: 60, amount: 1540 },
    { name: 'Breakfast', value: 25, amount: 640 },
    { name: 'Snacks', value: 10, amount: 256 },
    { name: 'Drinks', value: 5, amount: 128 }
  ]
};

const mockNutritionReports = {
  sarah: {
    weeklyCalories: [
      { day: 'Mon', target: 1800, consumed: 1720, variance: -80 },
      { day: 'Tue', target: 1800, consumed: 1950, variance: 150 },
      { day: 'Wed', target: 1800, consumed: 1680, variance: -120 },
      { day: 'Thu', target: 1800, consumed: 1820, variance: 20 },
      { day: 'Fri', target: 1800, consumed: 1780, variance: -20 },
      { day: 'Sat', target: 1800, consumed: 1890, variance: 90 },
      { day: 'Sun', target: 1800, consumed: 1750, variance: -50 }
    ],
    macros: [
      { name: 'Protein', value: 25, target: 30, color: '#3b82f6' },
      { name: 'Carbs', value: 45, target: 50, color: '#10b981' },
      { name: 'Fat', value: 30, target: 20, color: '#f59e0b' }
    ]
  },
  david: {
    weeklyCalories: [
      { day: 'Mon', target: 1600, consumed: 1520, variance: -80 },
      { day: 'Tue', target: 1600, consumed: 1650, variance: 50 },
      { day: 'Wed', target: 1600, consumed: 1480, variance: -120 },
      { day: 'Thu', target: 1600, consumed: 1620, variance: 20 },
      { day: 'Fri', target: 1600, consumed: 1580, variance: -20 },
      { day: 'Sat', target: 1600, consumed: 1690, variance: 90 },
      { day: 'Sun', target: 1600, consumed: 1550, variance: -50 }
    ],
    macros: [
      { name: 'Protein', value: 22, target: 25, color: '#3b82f6' },
      { name: 'Carbs', value: 48, target: 55, color: '#10b981' },
      { name: 'Fat', value: 30, target: 20, color: '#f59e0b' }
    ]
  }
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const EnhancedParentDashboard: React.FC<EnhancedParentDashboardProps> = ({
  parentData,
  className
}) => {
  const [selectedChild, setSelectedChild] = useState(mockChildrenData[0]);
  const [viewMode, setViewMode] = useState<'individual' | 'comparative'>('individual');
  const [notificationSettings, setNotificationSettings] = useState({
    orderApprovals: true,
    lowBalance: true,
    nutritionAlerts: true,
    weeklyReports: true
  });

  const totalSpending = mockChildrenData.reduce((sum, child) => sum + child.monthlySpending, 0);
  const totalBudget = mockChildrenData.reduce((sum, child) => sum + child.monthlyBudget, 0);
  const totalBalance = mockChildrenData.reduce((sum, child) => sum + child.walletBalance, 0);

  const allNotifications = mockChildrenData.flatMap(child => 
    child.notifications.map(notif => ({ ...notif, childName: child.name, childId: child.id }))
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Parent Overview Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Children</p>
                <p className="text-2xl font-bold">{mockChildrenData.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Balance</p>
                <p className="text-2xl font-bold">₹{totalBalance.toFixed(2)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Monthly Spending</p>
                <p className="text-2xl font-bold">₹{totalSpending}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Notifications</p>
                <p className="text-2xl font-bold">{allNotifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Child Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Children Management
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual View</SelectItem>
                  <SelectItem value="comparative">Compare All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockChildrenData.map((child) => (
              <Card 
                key={child.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedChild.id === child.id && viewMode === 'individual'
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  if (viewMode === 'individual') setSelectedChild(child);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={child.avatar} />
                      <AvatarFallback>
                        {child.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{child.name}</h3>
                      <p className="text-sm text-gray-600">{child.class} - Section {child.section}</p>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          Balance: ₹{child.walletBalance}
                        </Badge>
                        <Badge 
                          variant={child.nutritionScore >= 80 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          Nutrition: {child.nutritionScore}%
                        </Badge>
                      </div>
                    </div>
                    
                    {child.notifications.length > 0 && (
                      <div className="flex items-center">
                        <Bell className="h-4 w-4 text-orange-500" />
                        <span className="text-xs bg-red-500 text-white rounded-full px-1 ml-1">
                          {child.notifications.length}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {viewMode === 'individual' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Individual Child Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={selectedChild.avatar} />
                      <AvatarFallback>
                        {selectedChild.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {selectedChild.name} - Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <CreditCard className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                      <p className="text-sm text-gray-600">Wallet Balance</p>
                      <p className="font-semibold">₹{selectedChild.walletBalance}</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <Heart className="h-6 w-6 mx-auto mb-1 text-green-600" />
                      <p className="text-sm text-gray-600">Nutrition Score</p>
                      <p className="font-semibold">{selectedChild.nutritionScore}%</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="font-medium mb-2">Monthly Budget Progress</p>
                    <Progress 
                      value={(selectedChild.monthlySpending / selectedChild.monthlyBudget) * 100}
                      className="h-2"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      ₹{selectedChild.monthlySpending} / ₹{selectedChild.monthlyBudget}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium mb-2">Dietary Information</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Allergies:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedChild.allergies.map((allergy) => (
                            <Badge key={allergy} variant="destructive" className="text-xs">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Preferences:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedChild.preferences.map((pref) => (
                            <Badge key={pref} variant="secondary" className="text-xs">
                              {pref}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Recent Orders - {selectedChild.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedChild.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div>
                          <p className="font-medium">{order.meal}</p>
                          <p className="text-sm text-gray-600">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={order.status === 'delivered' ? 'default' : 'secondary'}
                            className="mb-1"
                          >
                            {order.status}
                          </Badge>
                          <p className="text-sm font-medium">₹{order.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Comparative View */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Children Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Wallet Balances</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={mockChildrenData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="walletBalance" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Nutrition Scores</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={mockChildrenData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="nutritionScore" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Monthly Spending</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={mockChildrenData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="monthlySpending" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Spending Tab */}
        <TabsContent value="spending" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Monthly Spending Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={mockSpendingAnalytics.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sarah" stackId="stack" fill="#3b82f6" name="Sarah" />
                    <Bar dataKey="david" stackId="stack" fill="#10b981" name="David" />
                    <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} name="Total" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Spending by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockSpendingAnalytics.categories}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name} ${value}%`}
                    >
                      {mockSpendingAnalytics.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Spending Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">₹{totalSpending}</p>
                  <p className="text-sm text-gray-600">Total Monthly Spending</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">₹{totalBudget}</p>
                  <p className="text-sm text-gray-600">Monthly Budget</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold">₹{(totalSpending / mockSpendingAnalytics.monthly.length).toFixed(0)}</p>
                  <p className="text-sm text-gray-600">Average Monthly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nutrition Tab */}
        <TabsContent value="nutrition" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Apple className="h-5 w-5 mr-2" />
                  Weekly Calorie Tracking - {selectedChild.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={mockNutritionReports[selectedChild.id === 'child-001' ? 'sarah' : 'david'].weeklyCalories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                    <Bar dataKey="consumed" fill="#3b82f6" name="Consumed" />
                    <Line type="monotone" dataKey="variance" stroke="#ef4444" name="Variance" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Macro Distribution - {selectedChild.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockNutritionReports[selectedChild.id === 'child-001' ? 'sarah' : 'david'].macros.map((macro) => (
                    <div key={macro.name}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{macro.name}</span>
                        <span className="text-sm text-gray-600">{macro.value}% / {macro.target}%</span>
                      </div>
                      <Progress value={(macro.value / macro.target) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Nutrition Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Great Progress</AlertTitle>
                  <AlertDescription>
                    {selectedChild.name} has maintained excellent nutrition this week!
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Protein Intake</AlertTitle>
                  <AlertDescription>
                    Consider adding more protein-rich meals to reach daily targets.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Heart className="h-4 w-4" />
                  <AlertTitle>Balanced Diet</AlertTitle>
                  <AlertDescription>
                    Overall macro balance is within healthy ranges for {selectedChild.age}-year-olds.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Active Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allNotifications.map((notification) => (
                  <Alert key={notification.id} className={notification.urgent ? 'border-red-200 bg-red-50' : ''}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {notification.urgent ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        )}
                        <div className="ml-3">
                          <AlertTitle className="text-sm font-medium">
                            {notification.childName} - {notification.type}
                          </AlertTitle>
                          <AlertDescription className="text-sm">
                            {notification.message}
                          </AlertDescription>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant={notification.urgent ? 'default' : 'secondary'}>
                          {notification.type === 'approval' ? 'Approve' : 'Acknowledge'}
                        </Button>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Wallet Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockChildrenData.map((child) => (
                  <div key={child.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={child.avatar} />
                        <AvatarFallback>
                          {child.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{child.name}</p>
                        <p className="text-sm text-gray-600">Balance: ₹{child.walletBalance}</p>
                      </div>
                    </div>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Top Up
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Wallet Top-up - Sarah</p>
                      <p className="text-sm text-gray-600">2024-01-12 • 08:00 AM</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+₹100</p>
                      <Badge variant="outline" className="text-xs">Completed</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Wallet Top-up - David</p>
                      <p className="text-sm text-gray-600">2024-01-10 • 02:30 PM</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+₹150</p>
                      <Badge variant="outline" className="text-xs">Completed</Badge>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Download Full Statement
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order Approval Notifications</p>
                  <p className="text-sm text-gray-600">Get notified when children place orders requiring approval</p>
                </div>
                <Switch 
                  checked={notificationSettings.orderApprovals}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, orderApprovals: checked}))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Balance Alerts</p>
                  <p className="text-sm text-gray-600">Receive alerts when wallet balance is low</p>
                </div>
                <Switch 
                  checked={notificationSettings.lowBalance}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, lowBalance: checked}))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nutrition Alerts</p>
                  <p className="text-sm text-gray-600">Daily nutrition goals and recommendations</p>
                </div>
                <Switch 
                  checked={notificationSettings.nutritionAlerts}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, nutritionAlerts: checked}))}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-gray-600">Comprehensive weekly nutrition and spending reports</p>
                </div>
                <Switch 
                  checked={notificationSettings.weeklyReports}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, weeklyReports: checked}))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Communication Center
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact School Administration
                </Button>
                <Button className="w-full" variant="outline">
                  <Utensils className="h-4 w-4 mr-2" />
                  Request Special Meal Arrangements
                </Button>
                <Button className="w-full" variant="outline">
                  <Heart className="h-4 w-4 mr-2" />
                  Update Dietary Restrictions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { EnhancedParentDashboard };