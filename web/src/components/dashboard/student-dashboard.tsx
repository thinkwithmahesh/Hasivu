'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  Apple,
  Utensils,
  Trophy,
  Clock,
  QrCode,
  Heart,
  TrendingUp,
  Target,
  Award,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Student, MealOrder, DailyNutrition, Achievement, WalletBalance } from './types';

interface StudentDashboardProps {
  student: Student;
  className?: string;
}

// Mock data - replace with actual data fetching
const mockNutritionData: DailyNutrition[] = [
  {
    date: '2024-01-08',
    consumed: {
      calories: 1850,
      protein: 65,
      carbs: 230,
      fat: 45,
      fiber: 18,
      sodium: 1200,
      sugar: 35,
    },
    goal: { calories: 2000, protein: 70, carbs: 250, fat: 50, fiber: 25 },
    percentage: 92,
  },
  {
    date: '2024-01-09',
    consumed: {
      calories: 1920,
      protein: 72,
      carbs: 245,
      fat: 48,
      fiber: 22,
      sodium: 1100,
      sugar: 32,
    },
    goal: { calories: 2000, protein: 70, carbs: 250, fat: 50, fiber: 25 },
    percentage: 96,
  },
  {
    date: '2024-01-10',
    consumed: {
      calories: 1780,
      protein: 68,
      carbs: 225,
      fat: 42,
      fiber: 20,
      sodium: 1300,
      sugar: 38,
    },
    goal: { calories: 2000, protein: 70, carbs: 250, fat: 50, fiber: 25 },
    percentage: 89,
  },
  {
    date: '2024-01-11',
    consumed: {
      calories: 2020,
      protein: 75,
      carbs: 255,
      fat: 52,
      fiber: 26,
      sodium: 1150,
      sugar: 30,
    },
    goal: { calories: 2000, protein: 70, carbs: 250, fat: 50, fiber: 25 },
    percentage: 101,
  },
  {
    date: '2024-01-12',
    consumed: {
      calories: 1900,
      protein: 70,
      carbs: 240,
      fat: 46,
      fiber: 24,
      sodium: 1250,
      sugar: 33,
    },
    goal: { calories: 2000, protein: 70, carbs: 250, fat: 50, fiber: 25 },
    percentage: 95,
  },
];

const mockRecentOrders: MealOrder[] = [
  {
    id: '1',
    studentId: 'student-1',
    studentName: 'Current Student',
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
      },
    ],
    status: 'ready',
    orderDate: '2024-01-12',
    totalAmount: 45,
    priority: 'medium',
  },
  {
    id: '2',
    studentId: 'student-1',
    studentName: 'Current Student',
    mealType: 'breakfast',
    items: [
      {
        id: '2',
        name: 'Healthy Breakfast Bowl',
        category: 'main',
        price: 35,
        quantity: 1,
        nutritionalInfo: {
          calories: 320,
          protein: 15,
          carbs: 45,
          fat: 10,
          fiber: 8,
          sodium: 400,
          sugar: 12,
        },
        isVegetarian: true,
      },
    ],
    status: 'completed',
    orderDate: '2024-01-12',
    pickupTime: '08:30',
    totalAmount: 35,
    priority: 'medium',
  },
];

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Nutrition Champion',
    description: 'Met daily nutrition goals for 7 consecutive days',
    icon: 'trophy',
    progress: 5,
    maxProgress: 7,
    category: 'nutrition',
  },
  {
    id: '2',
    title: 'Variety Explorer',
    description: 'Tried 10 different healthy meals',
    icon: 'star',
    progress: 8,
    maxProgress: 10,
    category: 'variety',
  },
  {
    id: '3',
    title: 'Consistency King',
    description: 'Ordered meals 15 days in a row',
    icon: 'calendar',
    progress: 12,
    maxProgress: 15,
    category: 'consistency',
  },
];

const mockFavoriteMeals = [
  { name: 'Vegetable Biryani', orders: 12, rating: 4.8, image: '/images/biryani.jpg' },
  { name: 'Healthy Bowl', orders: 8, rating: 4.6, image: '/images/bowl.jpg' },
  { name: 'Fruit Salad', orders: 6, rating: 4.9, image: '/images/fruit.jpg' },
];

const mockWalletBalance: WalletBalance = {
  studentId: 'student-1',
  balance: 450,
  lastUpdated: '2024-01-12',
  lowBalanceThreshold: 100,
};

const COLORS = {
  primary: '#4CAF50',
  secondary: '#9C27B0',
  accent: '#FF9800',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
};

export function StudentDashboard({ student, className }: StudentDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [todayNutrition, setTodayNutrition] = useState<DailyNutrition | null>(null);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setTodayNutrition(mockNutritionData[mockNutritionData.length - 1]);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const generateRFIDCode = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const weeklyNutritionChart = mockNutritionData.map(day => ({
    date: formatDate(new Date(day.date), 'short'),
    calories: day.consumed.calories,
    protein: day.consumed.protein,
    target: day.goal.calories,
  }));

  const nutritionBreakdown = todayNutrition
    ? [
        { name: 'Protein', value: todayNutrition.consumed.protein, color: COLORS.primary },
        { name: 'Carbs', value: todayNutrition.consumed.carbs, color: COLORS.info },
        { name: 'Fat', value: todayNutrition.consumed.fat, color: COLORS.warning },
      ]
    : [];

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
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {student.name}!</h1>
            <p className="text-primary-100 mt-1">
              Class {student.class}
              {student.section} • Roll #{student.rollNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-primary-100">Today's Nutrition Goal</p>
            <p className="text-2xl font-bold">{todayNutrition?.percentage}%</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">💳</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-600">
              {formatCurrency(mockWalletBalance.balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockWalletBalance.balance < mockWalletBalance.lowBalanceThreshold
                ? 'Consider adding funds'
                : 'Balance is healthy'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Calories</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayNutrition?.consumed.calories || 0}</div>
            <Progress value={todayNutrition?.percentage || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Goal: {todayNutrition?.goal.calories || 0} cal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockRecentOrders.filter(order => order.status !== 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockRecentOrders.find(order => order.status === 'ready')
                ? 'Order ready for pickup!'
                : 'No pending orders'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAchievements.filter(a => a.progress >= a.maxProgress).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockAchievements.filter(a => a.progress < a.maxProgress).length} in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="nutrition" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="pickup">Pickup</TabsTrigger>
        </TabsList>

        <TabsContent value="nutrition" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Nutrition Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Weekly Nutrition Progress
                </CardTitle>
                <CardDescription>Your daily calorie intake vs goals</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weeklyNutritionChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="calories"
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.6}
                      name="Consumed Calories"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke={COLORS.warning}
                      strokeDasharray="5 5"
                      name="Target Calories"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Today's Nutrition Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Today's Nutrition
                </CardTitle>
                <CardDescription>Macronutrient breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={nutritionBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}g`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {nutritionBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                {todayNutrition && (
                  <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                    <div>
                      <p className="text-sm font-medium">Protein</p>
                      <p className="text-2xl font-bold text-primary-600">
                        {todayNutrition.consumed.protein}g
                      </p>
                      <Progress
                        value={
                          (todayNutrition.consumed.protein / todayNutrition.goal.protein) * 100
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Carbs</p>
                      <p className="text-2xl font-bold text-info-600">
                        {todayNutrition.consumed.carbs}g
                      </p>
                      <Progress
                        value={(todayNutrition.consumed.carbs / todayNutrition.goal.carbs) * 100}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Fat</p>
                      <p className="text-2xl font-bold text-warning-600">
                        {todayNutrition.consumed.fat}g
                      </p>
                      <Progress
                        value={(todayNutrition.consumed.fat / todayNutrition.goal.fat) * 100}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your meal order history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRecentOrders.map(order => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full',
                          order.status === 'ready' && 'bg-success-500',
                          order.status === 'preparing' && 'bg-warning-500',
                          order.status === 'completed' && 'bg-gray-400',
                          order.status === 'pending' && 'bg-info-500'
                        )}
                      />
                      <div>
                        <p className="font-medium">{order.items[0]?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(new Date(order.orderDate))} • {order.mealType}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                      <p
                        className={cn(
                          'text-xs capitalize',
                          order.status === 'ready' && 'text-success-600',
                          order.status === 'preparing' && 'text-warning-600',
                          order.status === 'completed' && 'text-gray-500',
                          order.status === 'pending' && 'text-info-600'
                        )}
                      >
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Favorite Meals */}
            <Card>
              <CardHeader>
                <CardTitle>Your Favorites</CardTitle>
                <CardDescription>Most ordered meals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockFavoriteMeals.map((meal, _index) => (
                  <div key={meal.name} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🍽️</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{meal.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{meal.orders} orders</span>
                        <span>•</span>
                        <div className="flex items-center">
                          <Heart className="h-3 w-3 text-error-500 mr-1" fill="currentColor" />
                          <span>{meal.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockAchievements.map(achievement => (
              <Card key={achievement.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Award
                      className={cn(
                        'h-8 w-8',
                        achievement.progress >= achievement.maxProgress
                          ? 'text-warning-500'
                          : 'text-muted-foreground'
                      )}
                    />
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {achievement.progress}/{achievement.maxProgress}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((achievement.progress / achievement.maxProgress) * 100)}%
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold mb-2">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                  <Progress
                    value={(achievement.progress / achievement.maxProgress) * 100}
                    className="mb-2"
                  />
                  {achievement.progress >= achievement.maxProgress && (
                    <p className="text-xs text-success-600 font-medium">🎉 Achievement Unlocked!</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pickup" className="space-y-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <QrCode className="h-6 w-6" />
                  RFID Pickup Code
                </CardTitle>
                <CardDescription>Show this code to collect your order</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="bg-gray-100 rounded-lg p-8">
                  <div className="text-4xl font-mono font-bold text-primary-600 tracking-wider">
                    {student.rfidCode || generateRFIDCode()}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Valid for today only</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Present this code at the kitchen counter to collect your order
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Kitchen hours: 7:00 AM - 7:00 PM</span>
                  </div>
                </div>

                {mockRecentOrders.find(order => order.status === 'ready') && (
                  <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                    <p className="text-success-800 font-medium">
                      ✅ Your lunch order is ready for pickup!
                    </p>
                    <p className="text-success-600 text-sm mt-1">
                      Order #{mockRecentOrders.find(order => order.status === 'ready')?.id}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
