"use client"

import React, { useState, useEffect } from 'react';
import { io, Socket } from "socket.io-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Toggle } from "@/components/ui/toggle";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, ComposedChart,
  RadialBarChart, RadialBar, Treemap, ScatterChart, Scatter, ReferenceLine
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { 
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, 
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, 
  SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarInset
} from "@/components/ui/sidebar";
import { MealOrderDrawer, type MealItem } from "@/components/ui/meal-order-drawer";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Crown, Users, DollarSign, TrendingUp, AlertCircle, CheckCircle,
  Calendar, Settings, BarChart3, PieChart as PieChartIcon, Activity,
  School, Clock, Target, Award, Bell, MessageSquare, FileText,
  Download, Filter, Search, RefreshCw, Send, Shield, AlertTriangle,
  Utensils, Heart, Coffee, Apple, ChefHat, Package, Truck,
  Wifi, Radio, Zap, TrendingDown, Eye, EyeOff, Plus, X,
  Home, CreditCard, Smartphone, Scan, UserCheck, MapPin,
  BookOpen, GraduationCap, TrendingUpDown, MoreHorizontal,
  Star, Clock3, Users2, Loader, CheckCircle2, XCircle,
  AlertOctagon, ThermometerSun, Droplets, Wind, Sun
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminData {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
  permissions: string[];
}

interface EnhancedAdminDashboardV2Props {
  adminData: AdminData;
  className?: string;
}

// Enhanced mock data for comprehensive admin dashboard
const mockRFIDAnalytics = {
  activeStudents: 1186,
  scanSuccess: 97.3,
  averageQueueTime: 2.8, // minutes
  peakHours: [
    { hour: '8:00 AM', scans: 145, queueTime: 1.2 },
    { hour: '10:30 AM', scans: 89, queueTime: 0.8 },
    { hour: '12:00 PM', scans: 567, queueTime: 4.2 },
    { hour: '1:00 PM', scans: 423, queueTime: 3.1 },
    { hour: '3:30 PM', scans: 156, queueTime: 1.5 }
  ],
  deviceStatus: [
    { id: 'RFID-001', location: 'Main Canteen', status: 'active', lastScan: '2 minutes ago', batteryLevel: 87 },
    { id: 'RFID-002', location: 'Secondary Cafeteria', status: 'active', lastScan: '5 minutes ago', batteryLevel: 92 },
    { id: 'RFID-003', location: 'Staff Kitchen', status: 'maintenance', lastScan: '1 hour ago', batteryLevel: 45 },
    { id: 'RFID-004', location: 'Mobile Cart 1', status: 'active', lastScan: '1 minute ago', batteryLevel: 78 }
  ]
};

const mockMealRecommendations = [
  {
    id: 'meal-001',
    name: 'Paneer Tikka Bowl',
    description: 'Grilled paneer with aromatic spices, quinoa, and fresh vegetables',
    price: 85,
    image: '/api/placeholder/300/200',
    category: 'Main Course',
    preparationTime: 15,
    rating: 4.8,
    nutrition: { calories: 420, protein: 22, carbs: 35, fats: 18, fiber: 8 },
    allergens: ['Dairy'],
    dietaryTags: ['vegetarian', 'gluten-free'] as const,
    ingredients: ['Paneer', 'Quinoa', 'Bell Peppers', 'Onions', 'Yogurt', 'Spices'],
    popularity: 94,
    healthScore: 89
  },
  {
    id: 'meal-002', 
    name: 'Mediterranean Wrap',
    description: 'Whole wheat wrap with hummus, grilled vegetables, and feta cheese',
    price: 75,
    image: '/api/placeholder/300/200',
    category: 'Wraps & Rolls',
    preparationTime: 10,
    rating: 4.6,
    nutrition: { calories: 380, protein: 16, carbs: 45, fats: 14, fiber: 12 },
    allergens: ['Gluten', 'Dairy'],
    dietaryTags: ['vegetarian'] as const,
    ingredients: ['Whole Wheat Tortilla', 'Hummus', 'Zucchini', 'Eggplant', 'Feta'],
    popularity: 87,
    healthScore: 92
  },
  {
    id: 'meal-003',
    name: 'Masala Dosa Combo',
    description: 'Traditional South Indian dosa with sambar and coconut chutney',
    price: 65,
    image: '/api/placeholder/300/200',
    category: 'South Indian',
    preparationTime: 20,
    rating: 4.9,
    nutrition: { calories: 350, protein: 12, carbs: 58, fats: 8, fiber: 6 },
    allergens: [],
    dietaryTags: ['vegan', 'gluten-free'] as const,
    ingredients: ['Rice', 'Urad Dal', 'Coconut', 'Tomatoes', 'Lentils'],
    popularity: 96,
    healthScore: 85
  }
];

const mockRealTimeData = {
  liveOrders: 23,
  kitchenLoad: 78,
  deliveryQueue: 12,
  avgWaitTime: 8.5,
  customerSatisfaction: 4.7,
  revenueToday: 28450,
  ordersToday: 187,
  peakPrediction: {
    nextPeak: '12:45 PM',
    estimatedOrders: 85,
    recommendedStaff: 8
  }
};

const mockStudentAnalytics = {
  dietaryPreferences: [
    { preference: 'Vegetarian', count: 456, percentage: 36.5, trend: '+2.3%' },
    { preference: 'Non-Vegetarian', count: 523, percentage: 41.9, trend: '-1.1%' },
    { preference: 'Vegan', count: 156, percentage: 12.5, trend: '+5.8%' },
    { preference: 'Jain', count: 113, percentage: 9.1, trend: '+0.7%' }
  ],
  spendingPatterns: [
    { grade: '6th', avgDaily: 35, avgMonthly: 750, trend: 'up' },
    { grade: '7th', avgDaily: 42, avgMonthly: 920, trend: 'up' },
    { grade: '8th', avgDaily: 48, avgMonthly: 1050, trend: 'stable' },
    { grade: '9th', avgDaily: 55, avgMonthly: 1200, trend: 'up' },
    { grade: '10th', avgDaily: 58, avgMonthly: 1280, trend: 'down' },
    { grade: '11th', avgDaily: 62, avgMonthly: 1350, trend: 'up' },
    { grade: '12th', avgDaily: 65, avgMonthly: 1420, trend: 'stable' }
  ],
  healthMetrics: {
    bmiCompliance: 82.4,
    nutritionGoals: 89.1,
    allergyAlerts: 12,
    specialDiets: 67
  }
};

const mockWeatherData = {
  current: {
    temperature: 28,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12
  },
  impact: {
    expectedOrderIncrease: 15,
    recommendedMenuAdjustments: ['Cold Beverages', 'Light Meals', 'Ice Creams'],
    outdoorServiceViability: 'Good'
  }
};

const mockSchoolAnalytics = {
  overview: {
    totalStudents: 1248,
    activeOrders: 156,
    totalRevenue: 45780,
    monthlyGrowth: 12.5,
    nutritionCompliance: 89.4,
    customerSatisfaction: 4.7,
    operationalEfficiency: 92.1,
    wasteReduction: 15.3
  },
  
  orderTrends: [
    { month: 'Aug', orders: 3420, revenue: 38950, satisfaction: 4.5 },
    { month: 'Sep', orders: 3680, revenue: 42100, satisfaction: 4.6 },
    { month: 'Oct', orders: 3920, revenue: 44200, satisfaction: 4.7 },
    { month: 'Nov', orders: 4150, revenue: 47800, satisfaction: 4.8 },
    { month: 'Dec', orders: 3890, revenue: 43600, satisfaction: 4.6 },
    { month: 'Jan', orders: 2450, revenue: 28900, satisfaction: 4.7 }
  ],

  mealDistribution: [
    { name: 'Lunch', value: 45, count: 2890, revenue: 28900 },
    { name: 'Breakfast', value: 25, count: 1608, revenue: 12864 },
    { name: 'Snacks', value: 20, count: 1286, revenue: 6430 },
    { name: 'Dinner', value: 10, count: 643, revenue: 4501 }
  ],

  gradeDistribution: [
    { grade: '1st-2nd', students: 180, orders: 1260, avgSpending: 850 },
    { grade: '3rd-4th', students: 200, orders: 1580, avgSpending: 950 },
    { grade: '5th-6th', students: 220, orders: 1890, avgSpending: 1050 },
    { grade: '7th-8th', students: 240, orders: 2180, avgSpending: 1150 },
    { grade: '9th-10th', students: 208, orders: 2090, avgSpending: 1250 },
    { grade: '11th-12th', students: 200, orders: 2200, avgSpending: 1350 }
  ],

  nutritionCompliance: [
    { week: 'W1', calories: 92, protein: 88, vegetables: 85, fruits: 79 },
    { week: 'W2', calories: 89, protein: 91, vegetables: 87, fruits: 82 },
    { week: 'W3', calories: 94, protein: 86, vegetables: 89, fruits: 85 },
    { week: 'W4', calories: 87, protein: 93, vegetables: 91, fruits: 88 }
  ],

  realTimeMetrics: [
    { time: '09:00', orders: 12, revenue: 850, satisfaction: 4.8 },
    { time: '10:00', orders: 23, revenue: 1650, satisfaction: 4.7 },
    { time: '11:00', orders: 45, revenue: 3200, satisfaction: 4.6 },
    { time: '12:00', orders: 89, revenue: 6400, satisfaction: 4.8 },
    { time: '13:00', orders: 67, revenue: 4800, satisfaction: 4.9 },
    { time: '14:00', orders: 34, revenue: 2400, satisfaction: 4.7 },
    { time: '15:00', orders: 28, revenue: 1950, satisfaction: 4.8 }
  ]
};

const mockActiveOrders = [
  {
    id: 'ORD-001',
    studentName: 'Emma Wilson',
    grade: '8th',
    section: 'A',
    mealType: 'lunch',
    items: ['Grilled Chicken', 'Rice Bowl', 'Salad'],
    amount: 65,
    status: 'preparing',
    orderTime: '12:15 PM',
    estimatedReady: '12:45 PM',
    priority: 'high',
    allergies: ['Nuts'],
    specialRequests: 'Extra vegetables'
  },
  {
    id: 'ORD-002',
    studentName: 'James Martinez',
    grade: '5th',
    section: 'B',
    mealType: 'snack',
    items: ['Fruit Bowl', 'Juice'],
    amount: 25,
    status: 'ready',
    orderTime: '11:30 AM',
    estimatedReady: '11:45 AM',
    priority: 'medium',
    allergies: [],
    specialRequests: null
  },
  {
    id: 'ORD-003',
    studentName: 'Sophia Chen',
    grade: '10th',
    section: 'C',
    mealType: 'lunch',
    items: ['Vegetarian Pasta', 'Garlic Bread', 'Smoothie'],
    amount: 55,
    status: 'pending',
    orderTime: '12:20 PM',
    estimatedReady: '12:50 PM',
    priority: 'low',
    allergies: ['Dairy'],
    specialRequests: 'Vegan alternative'
  }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const EnhancedAdminDashboardV2: React.FC<EnhancedAdminDashboardV2Props> = ({
  adminData,
  className
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealItem | null>(null);
  const [isMealDrawerOpen, setIsMealDrawerOpen] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [ordersData, setOrdersData] = useState(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [rfidData, setRfidData] = useState(null);
  const [isLoadingRfid, setIsLoadingRfid] = useState(false);
  const [rfidError, setRfidError] = useState(null);
  const [realTimeData, setRealTimeData] = useState(mockRealTimeData);
  
  useEffect(() => {
    const socket: Socket = io("http://localhost:3002");

    socket.on("connect", () => {
    });

    socket.on("disconnect", () => {
    });

    socket.on("realtime_stats", (data) => {
      setRealTimeData(prevData => ({ ...prevData, ...data }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (activeView === 'analytics') {
      const fetchAnalyticsData = async () => {
        setIsLoadingAnalytics(true);
        setAnalyticsError(null);
        try {
          // Assuming the backend runs on port 3002
          const response = await fetch('http://localhost:3002/api/v1/analytics/dashboard');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setAnalyticsData(data);
        } catch (error) {
          setAnalyticsError(error.message);
        } finally {
          setIsLoadingAnalytics(false);
        }
      };
      fetchAnalyticsData();
    }
  }, [activeView]);

  React.useEffect(() => {
    if (activeView === 'orders') {
      const fetchOrdersData = async () => {
        setIsLoadingOrders(true);
        setOrdersError(null);
        try {
          const response = await fetch('http://localhost:3002/api/v1/orders');
          if (!response.ok) {
            throw new Error('Failed to fetch orders data');
          }
          const data = await response.json();
          setOrdersData(data);
        } catch (error) {
          setOrdersError(error.message);
        } finally {
          setIsLoadingOrders(false);
        }
      };
      fetchOrdersData();
    }
  }, [activeView]);

  React.useEffect(() => {
    if (activeView === 'rfid') {
      const fetchRfidData = async () => {
        setIsLoadingRfid(true);
        setRfidError(null);
        try {
          const response = await fetch('http://localhost:3002/api/v1/rfid/analytics');
          if (!response.ok) {
            throw new Error('Failed to fetch RFID data');
          }
          const data = await response.json();
          setRfidData(data);
        } catch (error) {
          setRfidError(error.message);
        } finally {
          setIsLoadingRfid(false);
        }
      };
      fetchRfidData();
    }
  }, [activeView]);

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500';
      case 'preparing': return 'bg-yellow-500';
      case 'pending': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const handleMealSelect = (meal: typeof mockMealRecommendations[0]) => {
    const mealItem: MealItem = {
      ...meal,
      customizations: {
        portion: { small: meal.price - 10, regular: meal.price, large: meal.price + 15 },
        addOns: [
          { id: 'extra-portion', name: 'Extra Portion', price: 25 },
          { id: 'extra-veggies', name: 'Extra Vegetables', price: 15 },
          { id: 'extra-protein', name: 'Extra Protein', price: 35 }
        ],
        modifications: ['Less Spicy', 'Extra Spicy', 'No Onions', 'Extra Sauce']
      }
    };
    setSelectedMeal(mealItem);
    setIsMealDrawerOpen(true);
  };

  const handleAddToCart = (meal: MealItem, customizations: any) => {
    // Implementation for adding to cart
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const chartConfig: ChartConfig = {
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-1))",
    },
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-2))",
    },
    satisfaction: {
      label: "Satisfaction",
      color: "hsl(var(--chart-3))",
    }
  };

  return (
    <SidebarProvider>
      <div className={cn("min-h-screen flex w-full", className)}>
        {/* Enhanced Sidebar */}
        <Sidebar className="border-r">
          <SidebarHeader className="border-b px-6 py-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <School className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">HASIVU Admin</span>
                <span className="text-xs text-muted-foreground">v2.1.0</span>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-4 py-2">
            {/* Quick Stats */}
            <SidebarGroup>
              <SidebarGroupLabel>Quick Overview</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <div className="text-lg font-bold text-primary">{realTimeData.liveOrders}</div>
                    <div className="text-xs text-muted-foreground">Live Orders</div>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <div className="text-lg font-bold text-green-600">₹{realTimeData.revenueToday.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Today's Revenue</div>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Navigation Menu */}
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setActiveView('overview')}
                      isActive={activeView === 'overview'}
                    >
                      <Home className="h-4 w-4" />
                      <span>Overview</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setActiveView('analytics')}
                      isActive={activeView === 'analytics'}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Analytics</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setActiveView('orders')}
                      isActive={activeView === 'orders'}
                    >
                      <Utensils className="h-4 w-4" />
                      <span>Orders</span>
                      <Badge className="ml-auto" variant="secondary">
                        {mockActiveOrders.length}
                      </Badge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setActiveView('rfid')}
                      isActive={activeView === 'rfid'}
                      data-testid="rfid-nav"
                    >
                      <Radio className="h-4 w-4" />
                      <span>RFID System</span>
                      <Badge className="ml-auto" variant="outline">
                        {mockRFIDAnalytics.deviceStatus.filter(d => d.status === 'active').length}
                      </Badge>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setActiveView('meals')}
                      isActive={activeView === 'meals'}
                    >
                      <ChefHat className="h-4 w-4" />
                      <span>Meal Management</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setActiveView('students')}
                      isActive={activeView === 'students'}
                    >
                      <Users2 className="h-4 w-4" />
                      <span>Student Analytics</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setActiveView('kitchen')}
                      isActive={activeView === 'kitchen'}
                    >
                      <Package className="h-4 w-4" />
                      <span>Kitchen Operations</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Weather Impact */}
            <SidebarGroup>
              <SidebarGroupLabel>Today's Weather Impact</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="p-3 rounded-lg bg-blue-50 border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{mockWeatherData.current.temperature}°C</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{mockWeatherData.current.condition}</span>
                  </div>
                  <div className="text-xs text-blue-600">
                    Expected +{mockWeatherData.impact.expectedOrderIncrease}% orders
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-muted-foreground">System Online</span>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                >
                  {realTimeEnabled ? 
                    <Eye className="h-3 w-3 text-green-600" /> : 
                    <EyeOff className="h-3 w-3 text-gray-400" />
                  }
                </Button>
                <SidebarTrigger />
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <SidebarInset className="flex-1">
          <div className="p-6 space-y-6">
            {/* Header with Real-time Status */}
            <div className="flex items-center justify-between">
              <div>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Enhanced Admin Panel</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-2xl font-bold mt-2">Welcome back, {adminData.name}</h1>
              </div>
              <div className="flex items-center space-x-3">
                {realTimeEnabled && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span>Live • Updated {new Date().toLocaleTimeString()}</span>
                  </div>
                )}
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Emergency Broadcast Section */}
            {emergencyMode && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Emergency Mode Active</AlertTitle>
                <AlertDescription className="text-red-700">
                  Emergency protocols are enabled. All communications will be marked as urgent.
                </AlertDescription>
              </Alert>
            )}

            {/* Overview View */}
            {activeView === 'overview' && (
              <div className="space-y-6">
                {/* Real-time Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Live Orders</p>
                          <p className="text-2xl font-bold">{realTimeData.liveOrders}</p>
                          <p className="text-xs text-blue-200 mt-1">Avg wait: {realTimeData.avgWaitTime}min</p>
                        </div>
                        <div className="relative">
                          <Utensils className="h-8 w-8 text-blue-200" />
                          {realTimeEnabled && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm">Today's Revenue</p>
                          <p className="text-2xl font-bold">₹{realTimeData.revenueToday.toLocaleString()}</p>
                          <p className="text-xs text-green-200 mt-1">{realTimeData.ordersToday} orders</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm">Kitchen Load</p>
                          <p className="text-2xl font-bold">{realTimeData.kitchenLoad}%</p>
                          <p className="text-xs text-purple-200 mt-1">{realTimeData.deliveryQueue} in queue</p>
                        </div>
                        <ChefHat className="h-8 w-8 text-purple-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm">Satisfaction</p>
                          <p className="text-2xl font-bold">{realTimeData.customerSatisfaction}/5</p>
                          <p className="text-xs text-orange-200 mt-1">Customer rating</p>
                        </div>
                        <Award className="h-8 w-8 text-orange-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Real-time Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Activity className="h-5 w-5 mr-2" />
                        Real-time Performance
                      </div>
                      {realTimeEnabled && (
                        <Badge variant="secondary" className="animate-pulse">
                          <Zap className="h-3 w-3 mr-1" />Live
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockSchoolAnalytics.realTimeMetrics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="orders" 
                            stroke="var(--color-orders)" 
                            strokeWidth={3}
                            dot={{ fill: "var(--color-orders)", strokeWidth: 2 }}
                          />
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="satisfaction" 
                            stroke="var(--color-satisfaction)" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Peak Prediction and Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Clock3 className="h-5 w-5 mr-2" />
                        Peak Prediction
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {realTimeData.peakPrediction.nextPeak}
                          </div>
                          <div className="text-sm text-yellow-700">Next Peak Expected</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Est. Orders:</span>
                            <span className="font-medium ml-2">{realTimeData.peakPrediction.estimatedOrders}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Staff Needed:</span>
                            <span className="font-medium ml-2">{realTimeData.peakPrediction.recommendedStaff}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ThermometerSun className="h-5 w-5 mr-2" />
                        Weather Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Temperature</span>
                          <span className="font-medium">{mockWeatherData.current.temperature}°C</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Condition</span>
                          <span className="font-medium">{mockWeatherData.current.condition}</span>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            +{mockWeatherData.impact.expectedOrderIncrease}%
                          </div>
                          <div className="text-xs text-blue-700">Expected increase</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users2 className="h-5 w-5 mr-2" />
                        Active Students
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {mockRFIDAnalytics.activeStudents}
                          </div>
                          <div className="text-sm text-green-700">Active Today</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">RFID Success:</span>
                            <span className="font-medium">{mockRFIDAnalytics.scanSuccess}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Avg Queue:</span>
                            <span className="font-medium">{mockRFIDAnalytics.averageQueueTime}min</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Meal Management View */}
            {activeView === 'meals' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Smart Meal Recommendations</h2>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Meal
                    </Button>
                    <Button size="sm" variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>

                <Carousel className="w-full">
                  <CarouselContent>
                    {mockMealRecommendations.map((meal) => (
                      <CarouselItem key={meal.id} className="md:basis-1/2 lg:basis-1/3">
                        <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleMealSelect(meal)}>
                          <div className="aspect-video relative overflow-hidden rounded-t-lg">
                            <img 
                              src={meal.image} 
                              alt={meal.name}
                              className="object-cover w-full h-full"
                            />
                            <div className="absolute top-2 right-2 flex space-x-1">
                              <Badge className={getHealthScoreColor(meal.healthScore)}>
                                ❤️ {meal.healthScore}
                              </Badge>
                              <Badge variant="secondary">
                                ⭐ {meal.rating}
                              </Badge>
                            </div>
                            <div className="absolute bottom-2 left-2">
                              <Badge variant="outline" className="bg-white/90">
                                <Clock className="h-3 w-3 mr-1" />
                                {meal.preparationTime}min
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">{meal.name}</h3>
                                <span className="text-lg font-bold text-primary">₹{meal.price}</span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{meal.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {meal.dietaryTags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
