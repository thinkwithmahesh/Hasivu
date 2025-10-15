"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton as _Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar as _Avatar, AvatarFallback as _AvatarFallback, AvatarImage as _AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BarChart as _BarChart, Bar as _Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart as _LineChart, Line as _Line, PieChart as _PieChart, Pie as _Pie, Cell as _Cell, Area, AreaChart, RadialBarChart as _RadialBarChart, RadialBar as _RadialBar
} from 'recharts';
import {
  Apple, Utensils as _Utensils, Trophy, Clock, QrCode, Heart, Wallet,
  TrendingUp, Calendar as _Calendar, Target, Award as _Award, Star as _Star, Timer, CheckCircle,
  AlertCircle as _AlertCircle, Plus, Minus, ShoppingCart, CreditCard, Gift as _Gift,
  Zap, Flame, Droplets, Activity, TrendingDown as _TrendingDown, Bell
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
    timeLeft: 0
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
    timeLeft: 45 // minutes
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
    timeLeft: 180
  }
];

const mockNutritionProgress = {
  daily: {
    calories: { consumed: 825, target: 1800, percentage: 46 },
    protein: { consumed: 50, target: 65, percentage: 77 },
    carbs: { consumed: 125, target: 225, percentage: 56 },
    fat: { consumed: 29, target: 60, percentage: 48 },
    fiber: { consumed: 18, target: 25, percentage: 72 },
    water: { consumed: 1200, target: 2000, percentage: 60 }
  },
  weekly: [
    { day: 'Mon', calories: 95, nutrition: 88 },
    { day: 'Tue', calories: 92, nutrition: 85 },
    { day: 'Wed', calories: 88, nutrition: 90 },
    { day: 'Thu', calories: 91, nutrition: 87 },
    { day: 'Fri', calories: 89, nutrition: 92 },
    { day: 'Sat', calories: 94, nutrition: 89 },
    { day: 'Today', calories: 46, nutrition: 65 }
  ]
};

const mockAchievements = [
  {
    id: 'healthy-week',
    title: 'Healthy Week Warrior',
    description: 'Maintained balanced nutrition for 7 days',
