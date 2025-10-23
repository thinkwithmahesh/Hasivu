'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton as Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Avatar as Avatar,
  AvatarFallback as AvatarFallback,
  AvatarImage as AvatarImage,
} from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  BarChart as BarChart,
  Bar as Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as LineChart,
  Line as Line,
  PieChart as PieChart,
  Pie as Pie,
  Cell as Cell,
  Area,
  AreaChart,
  RadialBarChart as RadialBarChart,
  RadialBar as RadialBar,
} from 'recharts';
import {
  Apple,
  Utensils as Utensils,
  Trophy,
  Clock,
  QrCode,
  Heart,
  Wallet,
  TrendingUp,
  Calendar as Calendar,
  Target,
  Award as Award,
  Star as Star,
  Timer,
  CheckCircle,
  AlertCircle as AlertCircle,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Gift as Gift,
  Zap,
  Flame,
  Droplets,
  Activity,
  TrendingDown as TrendingDown,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
  rollNumber: string;
  avatar?: string;
  rfidCode?: string;
}

interface EnhancedStudentDashboardProps {
  student: Student;
  className?: string;
}

// Enhanced mock data with comprehensive features
const mockTodayMeals = [
  {
    id: 'breakfast-1',
    type: 'breakfast',
    name: 'Healthy Breakfast Combo',
    time: '08:30 AM',
    status: 'completed',
    items: ['Oatmeal with Berries', 'Orange Juice', 'Banana'],
    nutrition: { calories: 320, protein: 12, carbs: 58, fat: 6 },
    cost: 25,
    timeLeft: 0,
  },
  {
    id: 'lunch-1',
    type: 'lunch',
    name: 'Nutritious Lunch Plate',
    time: '12:30 PM',
    status: 'preparing',
    items: ['Grilled Chicken', 'Brown Rice', 'Green Salad', 'Yogurt'],
    nutrition: { calories: 485, protein: 32, carbs: 45, fat: 15 },
    cost: 55,
    timeLeft: 45, // minutes
  },
  {
    id: 'snack-1',
    type: 'snack',
    name: 'Afternoon Energy Boost',
    time: '03:00 PM',
    status: 'pending',
    items: ['Mixed Nuts', 'Apple Slices', 'Water'],
    nutrition: { calories: 180, protein: 6, carbs: 22, fat: 8 },
    cost: 15,
    timeLeft: 180,
  },
];

const mockNutritionProgress = {
  daily: {
    calories: { consumed: 825, target: 1800, percentage: 46 },
    protein: { consumed: 50, target: 65, percentage: 77 },
    carbs: { consumed: 125, target: 225, percentage: 56 },
    fat: { consumed: 29, target: 60, percentage: 48 },
    fiber: { consumed: 18, target: 25, percentage: 72 },
    water: { consumed: 1200, target: 2000, percentage: 60 },
  },
  weekly: [
    { day: 'Mon', calories: 95, nutrition: 88 },
    { day: 'Tue', calories: 92, nutrition: 85 },
    { day: 'Wed', calories: 88, nutrition: 90 },
    { day: 'Thu', calories: 91, nutrition: 87 },
    { day: 'Fri', calories: 89, nutrition: 92 },
    { day: 'Sat', calories: 94, nutrition: 89 },
    { day: 'Today', calories: 46, nutrition: 65 },
  ],
};

const mockAchievements = [
  {
    id: 'healthy-week',
    title: 'Healthy Week Warrior',
    description: 'Maintained balanced nutrition for 7 days',
    icon: '🏆',
    progress: 6,
    maxProgress: 7,
    category: 'nutrition',
    points: 100,
    earnedDate: null,
    status: 'in_progress',
  },
  {
    id: 'variety-master',
    title: 'Variety Master',
    description: 'Tried 15 different meal items this month',
    icon: '🌟',
    progress: 15,
    maxProgress: 15,
    category: 'variety',
    points: 75,
    earnedDate: '2024-01-10',
    status: 'completed',
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Never missed breakfast for 10 days',
    icon: '🌅',
    progress: 8,
    maxProgress: 10,
    category: 'consistency',
    points: 50,
    earnedDate: null,
    status: 'in_progress',
  },
];

const mockWalletData = {
  balance: 245.5,
  monthlyBudget: 800,
  spent: 354.5,
  transactions: [
    {
      id: '1',
      type: 'debit',
      amount: 55,
      description: 'Lunch - Grilled Chicken Plate',
      date: '2024-01-12',
      time: '12:30 PM',
    },
    {
      id: '2',
      type: 'credit',
      amount: 100,
      description: 'Parent Top-up',
      date: '2024-01-12',
      time: '08:00 AM',
    },
    {
      id: '3',
      type: 'debit',
      amount: 25,
      description: 'Breakfast - Healthy Combo',
      date: '2024-01-12',
      time: '08:30 AM',
    },
    {
      id: '4',
      type: 'debit',
      amount: 45,
      description: 'Lunch - Vegetable Biryani',
      date: '2024-01-11',
      time: '12:30 PM',
    },
    {
      id: '5',
      type: 'debit',
      amount: 15,
      description: 'Snack - Energy Boost',
      date: '2024-01-11',
      time: '03:00 PM',
    },
  ],
};

const mockQuickOrderItems = [
  { id: '1', name: "Today's Special", price: 45, image: '🍛', category: 'lunch', popular: true },
  { id: '2', name: 'Healthy Salad Bowl', price: 35, image: '🥗', category: 'lunch', new: true },
  { id: '3', name: 'Energy Smoothie', price: 25, image: '🥤', category: 'drink', popular: true },
  { id: '4', name: 'Protein Bar', price: 20, image: '🍫', category: 'snack', healthy: true },
];

export const EnhancedStudentDashboard: React.FC<EnhancedStudentDashboardProps> = ({
  student,
  className,
}) => {
  const [_currentTime, _setCurrentTime] = useState(new Date());
  const [_isLoading, _setIsLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => _setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (minutes: number) => {
    if (minutes <= 0) return 'Available now';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'preparing':
        return 'bg-yellow-500';
      case 'ready':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'preparing':
        return Timer;
      case 'ready':
        return Bell;
      default:
        return Clock;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Quick Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">RFID Code</p>
                <p className="text-2xl font-bold">{student.rfidCode || 'RF-789123'}</p>
              </div>
              <QrCode className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Wallet Balance</p>
                <p className="text-2xl font-bold">₹{mockWalletData.balance}</p>
              </div>
              <Wallet className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Today's Nutrition</p>
                <p className="text-2xl font-bold">
                  {mockNutritionProgress.daily.calories.percentage}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Achievement Points</p>
                <p className="text-2xl font-bold">225</p>
              </div>
              <Trophy className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="today">Today's Meals</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="order">Quick Order</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
        </TabsList>

        {/* Today's Meals Tab */}
        <TabsContent value="today" className="space-y-4">
          <div className="grid gap-4">
            {mockTodayMeals.map(meal => {
              const StatusIcon = getStatusIcon(meal.status);

              return (
                <Card
                  key={meal.id}
                  className={`transition-all duration-200 ${selectedMeal === meal.id ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getStatusColor(meal.status)}`}>
                          <StatusIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{meal.name}</h3>
                          <p className="text-sm text-gray-600">
                            {meal.time} • ₹{meal.cost}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge
                          variant={meal.status === 'completed' ? 'default' : 'secondary'}
                          className="mb-2"
                        >
                          {meal.status}
                        </Badge>
                        {meal.timeLeft > 0 && (
                          <p className="text-sm font-medium text-blue-600">
                            <Timer className="h-4 w-4 inline mr-1" />
                            {formatCountdown(meal.timeLeft)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                        <div className="space-y-1">
                          {meal.items.map((item, index) => (
                            <div key={index} className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                              <span className="text-sm text-gray-600">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Nutrition:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center">
                            <Flame className="h-3 w-3 mr-1 text-red-500" />
                            {meal.nutrition.calories} cal
                          </div>
                          <div className="flex items-center">
                            <Zap className="h-3 w-3 mr-1 text-blue-500" />
                            {meal.nutrition.protein}g protein
                          </div>
                          <div className="flex items-center">
                            <Apple className="h-3 w-3 mr-1 text-green-500" />
                            {meal.nutrition.carbs}g carbs
                          </div>
                          <div className="flex items-center">
                            <Droplets className="h-3 w-3 mr-1 text-yellow-500" />
                            {meal.nutrition.fat}g fat
                          </div>
                        </div>
                      </div>
                    </div>

                    {meal.status === 'ready' && (
                      <Alert className="mt-4 border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Ready for Pickup!</AlertTitle>
                        <AlertDescription className="text-green-700">
                          Your meal is ready. Please use your RFID card at the pickup counter.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Nutrition Tab */}
        <TabsContent value="nutrition" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Today's Nutrition Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(mockNutritionProgress.daily).map(([key, data]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">{key}</span>
                      <span className="text-sm text-gray-600">
                        {data.consumed} / {data.target}{' '}
                        {key === 'water' ? 'ml' : key === 'calories' ? 'cal' : 'g'}
                      </span>
                    </div>
                    <Progress value={data.percentage} className="h-2" />
                    <p className="text-xs text-gray-500">{data.percentage}% of daily goal</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Weekly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Weekly Nutrition Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockNutritionProgress.weekly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="calories"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="nutrition"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Nutrition Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Personalized Nutrition Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Alert>
                  <Droplets className="h-4 w-4" />
                  <AlertTitle>Hydration</AlertTitle>
                  <AlertDescription>
                    You're 40% behind your water goal. Try drinking a glass every hour.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Apple className="h-4 w-4" />
                  <AlertTitle>Fiber Intake</AlertTitle>
                  <AlertDescription>
                    Great job on fiber! You've reached 72% of your daily target.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertTitle>Protein</AlertTitle>
                  <AlertDescription>
                    Excellent protein intake today! You're exceeding your goals.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Order Tab */}
        <TabsContent value="order" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Quick Order Menu
              </CardTitle>
              <CardDescription>Order your favorite meals with just a few clicks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockQuickOrderItems.map(item => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-4xl mb-2">{item.image}</div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-lg font-bold text-green-600">₹{item.price}</p>

                        <div className="flex justify-center space-x-1 mt-2">
                          {item.popular && (
                            <Badge variant="secondary" className="text-xs">
                              Popular
                            </Badge>
                          )}
                          {item.new && (
                            <Badge variant="destructive" className="text-xs">
                              New
                            </Badge>
                          )}
                          {item.healthy && (
                            <Badge variant="outline" className="text-xs">
                              Healthy
                            </Badge>
                          )}
                        </div>

                        <Button className="w-full mt-3" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid gap-4">
            {mockAchievements.map(achievement => (
              <Card
                key={achievement.id}
                className={
                  achievement.status === 'completed'
                    ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200'
                    : ''
                }
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{achievement.icon}</div>
                      <div>
                        <h3 className="font-semibold text-lg">{achievement.title}</h3>
                        <p className="text-gray-600">{achievement.description}</p>
                        <Badge variant="outline" className="mt-1">
                          {achievement.points} points
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="mb-2">
                        <span className="text-2xl font-bold">{achievement.progress}</span>
                        <span className="text-gray-500">/{achievement.maxProgress}</span>
                      </div>
                      <Progress
                        value={(achievement.progress / achievement.maxProgress) * 100}
                        className="w-32"
                      />
                      {achievement.status === 'completed' && (
                        <p className="text-xs text-green-600 mt-1">
                          Earned {achievement.earnedDate}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Wallet Tab */}
        <TabsContent value="wallet" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Balance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Balance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">₹{mockWalletData.balance}</p>
                  <p className="text-gray-600">Available Balance</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Monthly Budget</span>
                    <span>₹{mockWalletData.monthlyBudget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spent This Month</span>
                    <span className="text-red-600">₹{mockWalletData.spent}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Remaining</span>
                    <span className="text-green-600">
                      ₹{mockWalletData.monthlyBudget - mockWalletData.spent}
                    </span>
                  </div>
                </div>

                <Progress
                  value={(mockWalletData.spent / mockWalletData.monthlyBudget) * 100}
                  className="h-2"
                />
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockWalletData.transactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-full ${transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}
                        >
                          {transaction.type === 'credit' ? (
                            <Plus className={`h-4 w-4 text-green-600`} />
                          ) : (
                            <Minus className={`h-4 w-4 text-red-600`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {transaction.date} • {transaction.time}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
