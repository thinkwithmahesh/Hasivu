"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import {
  Apple, Utensils, Trophy, Clock, QrCode, Heart,
  TrendingUp, Target, Award
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Student, MealOrder, DailyNutrition, Achievement, WalletBalance } from './types';

interface StudentDashboardProps {
  student: Student;
  className?: string;
}

// Mock data - replace with actual data fetching
const mockNutritionData: DailyNutrition[] = [
  { date: '2024-01-08', consumed: { calories: 1850, protein: 65, carbs: 230, fat: 45, fiber: 18, sodium: 1200, sugar: 35 }, goal: { calories: 2000, protein: 70, carbs: 250, fat: 50, fiber: 25 }, percentage: 92 },
  { date: '2024-01-09', consumed: { calories: 1920, protein: 72, carbs: 245, fat: 48, fiber: 22, sodium: 1100, sugar: 32 }, goal: { calories: 2000, protein: 70, carbs: 250, fat: 50, fiber: 25 }, percentage: 96 },
  { date: '2024-01-10', consumed: { calories: 1780, protein: 68, carbs: 225, fat: 42, fiber: 20, sodium: 1300, sugar: 38 }, goal: { calories: 2000, protein: 70, carbs: 250, fat: 50, fiber: 25 }, percentage: 89 },
  { date: '2024-01-11', consumed: { calories: 2020, protein: 75, carbs: 255, fat: 52, fiber: 26, sodium: 1150, sugar: 30 }, goal: { calories: 2000, protein: 70, carbs: 250, fat: 50, fiber: 25 }, percentage: 101 },
  { date: '2024-01-12', consumed: { calories: 1900, protein: 70, carbs: 240, fat: 46, fiber: 24, sodium: 1250, sugar: 33 }, goal: { calories: 2000, protein: 70, carbs: 250, fat: 50, fiber: 25 }, percentage: 95 },
];

const mockRecentOrders: MealOrder[] = [
  {
    id: '1',
    studentId: 'student-1',
    studentName: 'Current Student',
    mealType: 'lunch',
    items: [
      { id: '1', name: 'Vegetable Biryani', category: 'main', price: 45, quantity: 1, nutritionalInfo: { calories: 420, protein: 12, carbs: 65, fat: 15, fiber: 6, sodium: 650, sugar: 8 }, isVegetarian: true }
    ],
    status: 'ready',
    orderDate: '2024-01-12',
    totalAmount: 45,
    priority: 'medium'
  },
  {
    id: '2',
    studentId: 'student-1',
    studentName: 'Current Student',
    mealType: 'breakfast',
    items: [
      { id: '2', name: 'Healthy Breakfast Bowl', category: 'main', price: 35, quantity: 1, nutritionalInfo: { calories: 320, protein: 15, carbs: 45, fat: 10, fiber: 8, sodium: 400, sugar: 12 }, isVegetarian: true }
    ],
    status: 'completed',
    orderDate: '2024-01-12',
    pickupTime: '08:30',
    totalAmount: 35,
    priority: 'medium'
  }
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
  }
];

const mockFavoriteMeals = [
  { name: 'Vegetable Biryani', orders: 12, rating: 4.8, image: '/images/biryani.jpg' },
  { name: 'Healthy Bowl', orders: 8, rating: 4.6, image: '/images/bowl.jpg' },
  { name: 'Fruit Salad', orders: 6, rating: 4.9, image: '/images/fruit.jpg' }
];

const mockWalletBalance: WalletBalance = {
  studentId: 'student-1',
  balance: 450,
  lastUpdated: '2024-01-12',
  lowBalanceThreshold: 100
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
    target: day.goal.calories
  }));

  const nutritionBreakdown = todayNutrition ? [
    { name: 'Protein', value: todayNutrition.consumed.protein, color: COLORS.primary },
    { name: 'Carbs', value: todayNutrition.consumed.carbs, color: COLORS.info },
    { name: 'Fat', value: todayNutrition.consumed.fat, color: COLORS.warning },
  ] : [];

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
    <div className={cn("space-y-6", className)}>
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {student.name}!</h1>
            <p className="text-primary-100 mt-1">Class {student.class}{student.section} • Roll #{student.rollNumber}</p>
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
            <div className="h-4 w-4 text-muted-foreground">
