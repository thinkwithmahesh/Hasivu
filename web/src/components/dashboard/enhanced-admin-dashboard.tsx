'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Toggle } from '@/components/ui/toggle';
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
  Area,
  AreaChart,
  ComposedChart,
  RadialBarChart,
  RadialBar,
  Treemap,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { MealOrderDrawer, type MealItem } from '@/components/ui/meal-order-drawer';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Crown,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  Settings,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  School,
  Clock,
  Target,
  Award,
  Bell,
  MessageSquare,
  FileText,
  Download,
  Filter,
  Search,
  RefreshCw,
  Send,
  Shield,
  AlertTriangle,
  Utensils,
  Heart,
  Coffee,
  Apple,
  ChefHat,
  Package,
  Truck,
  Wifi,
  Radio,
  Zap,
  TrendingDown,
  Eye,
  EyeOff,
  Plus,
  X,
  Home,
  CreditCard,
  Smartphone,
  Scan,
  UserCheck,
  MapPin,
  BookOpen,
  GraduationCap,
  TrendingUpDown,
  MoreHorizontal,
  Star,
  Clock3,
  Users2,
  Loader,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  ThermometerSun,
  Droplets,
  Wind,
  Sun,
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

interface EnhancedAdminDashboardProps {
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
    { hour: '3:30 PM', scans: 156, queueTime: 1.5 },
  ],
  deviceStatus: [
    {
      id: 'RFID-001',
      location: 'Main Canteen',
      status: 'active',
      lastScan: '2 minutes ago',
      batteryLevel: 87,
    },
    {
      id: 'RFID-002',
      location: 'Secondary Cafeteria',
      status: 'active',
      lastScan: '5 minutes ago',
      batteryLevel: 92,
    },
    {
      id: 'RFID-003',
      location: 'Staff Kitchen',
      status: 'maintenance',
      lastScan: '1 hour ago',
      batteryLevel: 45,
    },
    {
      id: 'RFID-004',
      location: 'Mobile Cart 1',
      status: 'active',
      lastScan: '1 minute ago',
      batteryLevel: 78,
    },
  ],
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
    dietaryTags: ['vegetarian', 'gluten-free'] as (
      | 'vegan'
      | 'vegetarian'
      | 'gluten-free'
      | 'dairy-free'
      | 'nut-free'
    )[],
    ingredients: ['Paneer', 'Quinoa', 'Bell Peppers', 'Onions', 'Yogurt', 'Spices'],
    popularity: 94,
    healthScore: 89,
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
    dietaryTags: ['vegetarian'] as (
      | 'vegan'
      | 'vegetarian'
      | 'gluten-free'
      | 'dairy-free'
      | 'nut-free'
    )[],
    ingredients: ['Whole Wheat Tortilla', 'Hummus', 'Zucchini', 'Eggplant', 'Feta'],
    popularity: 87,
    healthScore: 92,
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
    dietaryTags: ['vegan', 'gluten-free'] as (
      | 'vegan'
      | 'vegetarian'
      | 'gluten-free'
      | 'dairy-free'
      | 'nut-free'
    )[],
    ingredients: ['Rice', 'Urad Dal', 'Coconut', 'Tomatoes', 'Lentils'],
    popularity: 96,
    healthScore: 85,
  },
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
    recommendedStaff: 8,
  },
};

const mockStudentAnalytics = {
  dietaryPreferences: [
    { preference: 'Vegetarian', count: 456, percentage: 36.5, trend: '+2.3%' },
    { preference: 'Non-Vegetarian', count: 523, percentage: 41.9, trend: '-1.1%' },
    { preference: 'Vegan', count: 156, percentage: 12.5, trend: '+5.8%' },
    { preference: 'Jain', count: 113, percentage: 9.1, trend: '+0.7%' },
  ],
  spendingPatterns: [
    { grade: '6th', avgDaily: 35, avgMonthly: 750, trend: 'up' },
    { grade: '7th', avgDaily: 42, avgMonthly: 920, trend: 'up' },
    { grade: '8th', avgDaily: 48, avgMonthly: 1050, trend: 'stable' },
    { grade: '9th', avgDaily: 55, avgMonthly: 1200, trend: 'up' },
    { grade: '10th', avgDaily: 58, avgMonthly: 1280, trend: 'down' },
    { grade: '11th', avgDaily: 62, avgMonthly: 1350, trend: 'up' },
    { grade: '12th', avgDaily: 65, avgMonthly: 1420, trend: 'stable' },
  ],
  healthMetrics: {
    bmiCompliance: 82.4,
    nutritionGoals: 89.1,
    allergyAlerts: 12,
    specialDiets: 67,
  },
};

const mockWeatherData = {
  current: {
    temperature: 28,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
  },
  impact: {
    expectedOrderIncrease: 15,
    recommendedMenuAdjustments: ['Cold Beverages', 'Light Meals', 'Ice Creams'],
    outdoorServiceViability: 'Good',
  },
};

// Comprehensive mock data for admin dashboard
const mockSchoolAnalytics = {
  overview: {
    totalStudents: 1248,
    activeOrders: 156,
    totalRevenue: 45780,
    monthlyGrowth: 12.5,
    nutritionCompliance: 89.4,
    customerSatisfaction: 4.7,
    operationalEfficiency: 92.1,
    wasteReduction: 15.3,
  },

  orderTrends: [
    { month: 'Aug', orders: 3420, revenue: 38950, satisfaction: 4.5 },
    { month: 'Sep', orders: 3680, revenue: 42100, satisfaction: 4.6 },
    { month: 'Oct', orders: 3920, revenue: 44200, satisfaction: 4.7 },
    { month: 'Nov', orders: 4150, revenue: 47800, satisfaction: 4.8 },
    { month: 'Dec', orders: 3890, revenue: 43600, satisfaction: 4.6 },
    { month: 'Jan', orders: 2450, revenue: 28900, satisfaction: 4.7 },
  ],

  mealDistribution: [
    { name: 'Lunch', value: 45, count: 2890, revenue: 28900 },
    { name: 'Breakfast', value: 25, count: 1608, revenue: 12864 },
    { name: 'Snacks', value: 20, count: 1286, revenue: 6430 },
    { name: 'Dinner', value: 10, count: 643, revenue: 4501 },
  ],

  gradeDistribution: [
    { grade: '1st-2nd', students: 180, orders: 1260, avgSpending: 850 },
    { grade: '3rd-4th', students: 200, orders: 1580, avgSpending: 950 },
    { grade: '5th-6th', students: 220, orders: 1890, avgSpending: 1050 },
    { grade: '7th-8th', students: 240, orders: 2180, avgSpending: 1150 },
    { grade: '9th-10th', students: 208, orders: 2090, avgSpending: 1250 },
    { grade: '11th-12th', students: 200, orders: 2200, avgSpending: 1350 },
  ],

  nutritionCompliance: [
    { week: 'W1', calories: 92, protein: 88, vegetables: 85, fruits: 79 },
    { week: 'W2', calories: 89, protein: 91, vegetables: 87, fruits: 82 },
    { week: 'W3', calories: 94, protein: 86, vegetables: 89, fruits: 85 },
    { week: 'W4', calories: 87, protein: 93, vegetables: 91, fruits: 88 },
  ],

  realTimeMetrics: [
    { time: '09:00', orders: 12, revenue: 850, satisfaction: 4.8 },
    { time: '10:00', orders: 23, revenue: 1650, satisfaction: 4.7 },
    { time: '11:00', orders: 45, revenue: 3200, satisfaction: 4.6 },
    { time: '12:00', orders: 89, revenue: 6400, satisfaction: 4.8 },
    { time: '13:00', orders: 67, revenue: 4800, satisfaction: 4.9 },
    { time: '14:00', orders: 34, revenue: 2400, satisfaction: 4.7 },
    { time: '15:00', orders: 28, revenue: 1950, satisfaction: 4.8 },
  ],
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
    specialRequests: 'Extra vegetables',
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
    specialRequests: null,
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
    specialRequests: 'Vegan alternative',
  },
];

const mockFinancialSummary = {
  daily: { revenue: 2850, orders: 89, avgOrderValue: 32 },
  weekly: { revenue: 18950, orders: 642, avgOrderValue: 29.5 },
  monthly: { revenue: 76800, orders: 2580, avgOrderValue: 29.8 },
  paymentMethods: [
    { method: 'Digital Wallet', percentage: 65, amount: 49920 },
    { method: 'UPI', percentage: 25, amount: 19200 },
    { method: 'Cash', percentage: 10, amount: 7680 },
  ],
};

const mockKitchenOperations = {
  activeStaff: 12,
  totalStaff: 15,
  currentCapacity: 78,
  maxCapacity: 200,
  avgPreparationTime: 18, // minutes
  qualityScore: 4.6,
  efficiency: 89,
  inventory: [
    { item: 'Rice', stock: 85, threshold: 20, status: 'good' },
    { item: 'Chicken', stock: 15, threshold: 25, status: 'low' },
    { item: 'Vegetables', stock: 92, threshold: 30, status: 'good' },
    { item: 'Milk', stock: 8, threshold: 15, status: 'critical' },
  ],
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const EnhancedAdminDashboard: React.FC<EnhancedAdminDashboardProps> = ({
  adminData,
  className,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealItem | null>(null);
  const [isMealDrawerOpen, setIsMealDrawerOpen] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('overview');

  // Real-time data refresh
  const [lastRefresh, setLastRefresh] = useState(new Date());
  React.useEffect(() => {
    if (realTimeEnabled) {
      const interval = setInterval(() => {
        setLastRefresh(new Date());
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500';
      case 'preparing':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-blue-500';
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

  const handleMealSelect = (meal: (typeof mockMealRecommendations)[0]) => {
    const mealItem: MealItem = {
      ...meal,
      customizations: {
        portion: { small: meal.price - 10, regular: meal.price, large: meal.price + 15 },
        addOns: [
          { id: 'extra-portion', name: 'Extra Portion', price: 25 },
          { id: 'extra-veggies', name: 'Extra Vegetables', price: 15 },
          { id: 'extra-protein', name: 'Extra Protein', price: 35 },
        ],
        modifications: ['Less Spicy', 'Extra Spicy', 'No Onions', 'Extra Sauce'],
      },
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
      label: 'Orders',
      color: 'hsl(var(--chart-1))',
    },
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--chart-2))',
    },
    satisfaction: {
      label: 'Satisfaction',
      color: 'hsl(var(--chart-3))',
    },
  };

  return (
    <SidebarProvider>
      <div className={cn('min-h-screen flex w-full', className)}>
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
                    <div className="text-lg font-bold text-primary">
                      {mockRealTimeData.liveOrders}
                    </div>
                    <div className="text-xs text-muted-foreground">Live Orders</div>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <div className="text-lg font-bold text-green-600">
                      ₹{mockRealTimeData.revenueToday.toLocaleString()}
                    </div>
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
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start',
                          activeView === 'overview' && 'bg-accent'
                        )}
                        onClick={() => setActiveView('overview')}
                      >
                        <Home className="h-4 w-4 mr-2" />
                        <span>Overview</span>
                      </Button>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start',
                          activeView === 'analytics' && 'bg-accent'
                        )}
                        onClick={() => setActiveView('analytics')}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        <span>Analytics</span>
                      </Button>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start',
                          activeView === 'orders' && 'bg-accent'
                        )}
                        onClick={() => setActiveView('orders')}
                      >
                        <Utensils className="h-4 w-4 mr-2" />
                        <span>Orders</span>
                        <Badge className="ml-auto" variant="secondary">
                          {mockActiveOrders.length}
                        </Badge>
                      </Button>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        className={cn('w-full justify-start', activeView === 'rfid' && 'bg-accent')}
                        onClick={() => setActiveView('rfid')}
                      >
                        <Radio className="h-4 w-4 mr-2" />
                        <span>RFID System</span>
                        <Badge className="ml-auto" variant="outline">
                          {mockRFIDAnalytics.deviceStatus.filter(d => d.status === 'active').length}
                        </Badge>
                      </Button>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start',
                          activeView === 'meals' && 'bg-accent'
                        )}
                        onClick={() => setActiveView('meals')}
                      >
                        <ChefHat className="h-4 w-4 mr-2" />
                        <span>Meal Management</span>
                      </Button>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start',
                          activeView === 'students' && 'bg-accent'
                        )}
                        onClick={() => setActiveView('students')}
                      >
                        <Users2 className="h-4 w-4 mr-2" />
                        <span>Student Analytics</span>
                      </Button>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start',
                          activeView === 'kitchen' && 'bg-accent'
                        )}
                        onClick={() => setActiveView('kitchen')}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        <span>Kitchen Operations</span>
                      </Button>
                    </SidebarMenuItem>
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
                      <span className="text-sm font-medium">
                        {mockWeatherData.current.temperature}°C
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {mockWeatherData.current.condition}
                    </span>
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
                  {realTimeEnabled ? (
                    <Eye className="h-3 w-3 text-green-600" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-gray-400" />
                  )}
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
                    <span>Live • Updated {lastRefresh.toLocaleTimeString()}</span>
                  </div>
                )}
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Admin Overview Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Students</p>
                      <p className="text-2xl font-bold">
                        {mockSchoolAnalytics.overview.totalStudents}
                      </p>
                      <p className="text-xs text-blue-200 mt-1">
                        +{mockSchoolAnalytics.overview.monthlyGrowth}% this month
                      </p>
                    </div>
                    <School className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Monthly Revenue</p>
                      <p className="text-2xl font-bold">
                        ₹{mockSchoolAnalytics.overview.totalRevenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-200 mt-1">
                        +{mockSchoolAnalytics.overview.monthlyGrowth}% growth
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Active Orders</p>
                      <p className="text-2xl font-bold">
                        {mockSchoolAnalytics.overview.activeOrders}
                      </p>
                      <p className="text-xs text-purple-200 mt-1">Currently processing</p>
                    </div>
                    <Utensils className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Satisfaction</p>
                      <p className="text-2xl font-bold">
                        {mockSchoolAnalytics.overview.customerSatisfaction}/5
                      </p>
                      <p className="text-xs text-orange-200 mt-1">Customer rating</p>
                    </div>
                    <Award className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
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

            {/* Conditional content based on active view */}
            {activeView === 'overview' && (
              <div className="space-y-6">
                {/* Real-time Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Live Orders</p>
                          <p className="text-2xl font-bold">{mockRealTimeData.liveOrders}</p>
                          <p className="text-xs text-blue-200 mt-1">
                            Avg wait: {mockRealTimeData.avgWaitTime}min
                          </p>
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
                          <p className="text-2xl font-bold">
                            ₹{mockRealTimeData.revenueToday.toLocaleString()}
                          </p>
                          <p className="text-xs text-green-200 mt-1">
                            {mockRealTimeData.ordersToday} orders
                          </p>
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
                          <p className="text-2xl font-bold">{mockRealTimeData.kitchenLoad}%</p>
                          <p className="text-xs text-purple-200 mt-1">
                            {mockRealTimeData.deliveryQueue} in queue
                          </p>
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
                          <p className="text-2xl font-bold">
                            {mockRealTimeData.customerSatisfaction}/5
                          </p>
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
                          <Zap className="h-3 w-3 mr-1" />
                          Live
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
                            dot={{ fill: 'var(--color-orders)', strokeWidth: 2 }}
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
              </div>
            )}

            {/* Analytics View */}
            {activeView === 'analytics' && (
              <Tabs defaultValue="analytics" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="analytics">School Analytics</TabsTrigger>
                  <TabsTrigger value="nutrition">Nutrition Reports</TabsTrigger>
                  <TabsTrigger value="financial">Financial Summary</TabsTrigger>
                  <TabsTrigger value="broadcast">Emergency Broadcast</TabsTrigger>
                </TabsList>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">School-wide Analytics</h3>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={selectedPeriod}
                        onValueChange={value => setSelectedPeriod(value as any)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Trends */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <BarChart3 className="h-5 w-5 mr-2" />
                          Order & Revenue Trends
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart data={mockSchoolAnalytics.orderTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Bar yAxisId="left" dataKey="orders" fill="#3b82f6" name="Orders" />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="revenue"
                              stroke="#10b981"
                              strokeWidth={2}
                              name="Revenue (₹)"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Meal Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <PieChartIcon className="h-5 w-5 mr-2" />
                          Meal Type Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={mockSchoolAnalytics.mealDistribution}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, value }) => `${name} ${value}%`}
                            >
                              {mockSchoolAnalytics.mealDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value, name, props) => [
                                `${value}% (${props.payload.count} orders)`,
                                name,
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Grade-wise Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Users className="h-5 w-5 mr-2" />
                          Grade-wise Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={mockSchoolAnalytics.gradeDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="grade" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="students" fill="#3b82f6" name="Students" />
                            <Bar dataKey="orders" fill="#10b981" name="Orders" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Key Metrics */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Activity className="h-5 w-5 mr-2" />
                          Key Performance Indicators
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Nutrition Compliance</span>
                            <span className="text-sm">
                              {mockSchoolAnalytics.overview.nutritionCompliance}%
                            </span>
                          </div>
                          <Progress
                            value={mockSchoolAnalytics.overview.nutritionCompliance}
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Operational Efficiency</span>
                            <span className="text-sm">
                              {mockSchoolAnalytics.overview.operationalEfficiency}%
                            </span>
                          </div>
                          <Progress
                            value={mockSchoolAnalytics.overview.operationalEfficiency}
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Customer Satisfaction</span>
                            <span className="text-sm">
                              {(
                                (mockSchoolAnalytics.overview.customerSatisfaction / 5) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                          <Progress
                            value={(mockSchoolAnalytics.overview.customerSatisfaction / 5) * 100}
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Waste Reduction</span>
                            <span className="text-sm">
                              {mockSchoolAnalytics.overview.wasteReduction}%
                            </span>
                          </div>
                          <Progress
                            value={mockSchoolAnalytics.overview.wasteReduction}
                            className="h-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Nutrition Reports Tab */}
                <TabsContent value="nutrition" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Active Order Management</h3>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Filter className="h-4 w-4 mr-1" />
                        Filter
                      </Button>
                      <Button size="sm" variant="outline" disabled={selectedOrders.length === 0}>
                        Bulk Actions ({selectedOrders.length})
                      </Button>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Utensils className="h-5 w-5 mr-2" />
                          Current Orders Queue
                        </div>
                        <Badge variant="secondary">{mockActiveOrders.length} active orders</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectedOrders.length === mockActiveOrders.length}
                                onCheckedChange={checked => {
                                  if (checked) {
                                    setSelectedOrders(mockActiveOrders.map(order => order.id));
                                  } else {
                                    setSelectedOrders([]);
                                  }
                                }}
                              />
                            </TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Meal Type</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Special Notes</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockActiveOrders.map(order => (
                            <TableRow key={order.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedOrders.includes(order.id)}
                                  onCheckedChange={() => handleOrderSelect(order.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{order.id}</TableCell>
                              <TableCell>{order.studentName}</TableCell>
                              <TableCell>
                                {order.grade}
                                {order.section}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {order.mealType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-32 truncate">{order.items.join(', ')}</div>
                              </TableCell>
                              <TableCell>₹{order.amount}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={order.status === 'ready' ? 'default' : 'secondary'}
                                  className="capitalize"
                                >
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={cn(
                                    'capitalize font-medium',
                                    getPriorityColor(order.priority)
                                  )}
                                >
                                  {order.priority}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-32">
                                  {order.allergies.length > 0 && (
                                    <Badge variant="destructive" className="text-xs mb-1 mr-1">
                                      Allergies: {order.allergies.join(', ')}
                                    </Badge>
                                  )}
                                  {order.specialRequests && (
                                    <p className="text-xs text-gray-600 truncate">
                                      {order.specialRequests}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button size="sm" variant="outline">
                                    View
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="default">
                                        Update
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Update Order Status</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to update the status of order{' '}
                                          {order.id} for {order.studentName}?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction>Update Status</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Financial Summary Tab */}
                <TabsContent value="financial" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Heart className="h-5 w-5 mr-2" />
                          Weekly Nutrition Compliance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={mockSchoolAnalytics.nutritionCompliance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" />
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
                              dataKey="protein"
                              stackId="1"
                              stroke="#10b981"
                              fill="#10b981"
                              fillOpacity={0.6}
                            />
                            <Area
                              type="monotone"
                              dataKey="vegetables"
                              stackId="1"
                              stroke="#f59e0b"
                              fill="#f59e0b"
                              fillOpacity={0.6}
                            />
                            <Area
                              type="monotone"
                              dataKey="fruits"
                              stackId="1"
                              stroke="#ef4444"
                              fill="#ef4444"
                              fillOpacity={0.6}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Target className="h-5 w-5 mr-2" />
                          Nutrition Compliance Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <Apple className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                            <p className="text-2xl font-bold">89.4%</p>
                            <p className="text-sm text-gray-600">Overall Compliance</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <Heart className="h-6 w-6 mx-auto mb-1 text-green-600" />
                            <p className="text-2xl font-bold">94.2%</p>
                            <p className="text-sm text-gray-600">Calorie Targets</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Protein Intake</AlertTitle>
                            <AlertDescription>
                              92% of students are meeting daily protein requirements.
                            </AlertDescription>
                          </Alert>
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Vegetable Consumption</AlertTitle>
                            <AlertDescription>
                              Need to improve vegetable intake - currently at 78% compliance.
                            </AlertDescription>
                          </Alert>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Nutrition Reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="multiple" className="w-full">
                        <AccordionItem value="reports">
                          <AccordionTrigger>
                            <div className="flex items-center">
                              <Download className="h-4 w-4 mr-2" />
                              Download Reports
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="flex space-x-4 mt-2">
                              <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Weekly Report
                              </Button>
                              <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Monthly Summary
                              </Button>
                              <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Grade-wise Analysis
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="settings">
                          <AccordionTrigger>
                            <div className="flex items-center">
                              <Settings className="h-4 w-4 mr-2" />
                              Nutrition Targets & Settings
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 mt-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Daily Calorie Target
                                  </label>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-2xl font-bold">2200</span>
                                    <span className="text-sm text-gray-600">kcal</span>
                                    <Toggle size="sm" variant="outline">
                                      Edit
                                    </Toggle>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Protein Requirement</label>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-2xl font-bold">45</span>
                                    <span className="text-sm text-gray-600">grams</span>
                                    <Toggle size="sm" variant="outline">
                                      Edit
                                    </Toggle>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Emergency Broadcast Tab */}
                <TabsContent value="broadcast" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <ChefHat className="h-5 w-5 mr-2" />
                          Kitchen Status Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                            <p className="text-2xl font-bold">
                              {mockKitchenOperations.activeStaff}/{mockKitchenOperations.totalStaff}
                            </p>
                            <p className="text-sm text-gray-600">Active Staff</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <Clock className="h-6 w-6 mx-auto mb-1 text-green-600" />
                            <p className="text-2xl font-bold">
                              {mockKitchenOperations.avgPreparationTime}m
                            </p>
                            <p className="text-sm text-gray-600">Avg Prep Time</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Current Capacity</span>
                            <span className="text-sm">
                              {mockKitchenOperations.currentCapacity}/
                              {mockKitchenOperations.maxCapacity}
                            </span>
                          </div>
                          <Progress
                            value={
                              (mockKitchenOperations.currentCapacity /
                                mockKitchenOperations.maxCapacity) *
                              100
                            }
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Quality Score</span>
                            <span className="text-sm">{mockKitchenOperations.qualityScore}/5</span>
                          </div>
                          <Progress
                            value={(mockKitchenOperations.qualityScore / 5) * 100}
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Efficiency</span>
                            <span className="text-sm">{mockKitchenOperations.efficiency}%</span>
                          </div>
                          <Progress value={mockKitchenOperations.efficiency} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Package className="h-5 w-5 mr-2" />
                          Inventory Alerts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {mockKitchenOperations.inventory.map(item => (
                            <Alert
                              key={item.item}
                              className={
                                item.status === 'critical'
                                  ? 'border-red-200 bg-red-50'
                                  : item.status === 'low'
                                    ? 'border-yellow-200 bg-yellow-50'
                                    : 'border-green-200 bg-green-50'
                              }
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <AlertTitle
                                    className={
                                      item.status === 'critical'
                                        ? 'text-red-800'
                                        : item.status === 'low'
                                          ? 'text-yellow-800'
                                          : 'text-green-800'
                                    }
                                  >
                                    {item.item}
                                  </AlertTitle>
                                  <AlertDescription
                                    className={
                                      item.status === 'critical'
                                        ? 'text-red-700'
                                        : item.status === 'low'
                                          ? 'text-yellow-700'
                                          : 'text-green-700'
                                    }
                                  >
                                    Stock: {item.stock}% (Threshold: {item.threshold}%)
                                  </AlertDescription>
                                </div>
                                <Badge
                                  variant={
                                    item.status === 'critical'
                                      ? 'destructive'
                                      : item.status === 'low'
                                        ? 'secondary'
                                        : 'default'
                                  }
                                >
                                  {item.status}
                                </Badge>
                              </div>
                            </Alert>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {/* Order Management View - New Structure */}
            {activeView === 'orders' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Daily Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">
                          ₹{mockFinancialSummary.daily.revenue}
                        </p>
                        <p className="text-gray-600">Revenue</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Orders: {mockFinancialSummary.daily.orders}</div>
                        <div>Avg: ₹{mockFinancialSummary.daily.avgOrderValue}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Weekly Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">
                          ₹{mockFinancialSummary.weekly.revenue}
                        </p>
                        <p className="text-gray-600">Revenue</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Orders: {mockFinancialSummary.weekly.orders}</div>
                        <div>Avg: ₹{mockFinancialSummary.weekly.avgOrderValue}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Monthly Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-purple-600">
                          ₹{mockFinancialSummary.monthly.revenue}
                        </p>
                        <p className="text-gray-600">Revenue</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Orders: {mockFinancialSummary.monthly.orders}</div>
                        <div>Avg: ₹{mockFinancialSummary.monthly.avgOrderValue}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockFinancialSummary.paymentMethods.map(method => (
                        <div key={method.method} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{method.method}</span>
                            <span>
                              ₹{method.amount} ({method.percentage}%)
                            </span>
                          </div>
                          <Progress value={method.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Order Management View - New Structure */}
            {activeView === 'orders' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Daily Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">
                          ₹{mockFinancialSummary.daily.revenue}
                        </p>
                        <p className="text-gray-600">Revenue</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Orders: {mockFinancialSummary.daily.orders}</div>
                        <div>Avg: ₹{mockFinancialSummary.daily.avgOrderValue}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Weekly Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">
                          ₹{mockFinancialSummary.weekly.revenue}
                        </p>
                        <p className="text-gray-600">Revenue</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Orders: {mockFinancialSummary.weekly.orders}</div>
                        <div>Avg: ₹{mockFinancialSummary.weekly.avgOrderValue}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Monthly Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-purple-600">
                          ₹{mockFinancialSummary.monthly.revenue}
                        </p>
                        <p className="text-gray-600">Revenue</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Orders: {mockFinancialSummary.monthly.orders}</div>
                        <div>Avg: ₹{mockFinancialSummary.monthly.avgOrderValue}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockFinancialSummary.paymentMethods.map(method => (
                        <div key={method.method} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{method.method}</span>
                            <span>
                              ₹{method.amount} ({method.percentage}%)
                            </span>
                          </div>
                          <Progress value={method.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Kitchen Operations View */}
            {activeView === 'kitchen' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      Emergency Broadcast System
                    </CardTitle>
                    <CardDescription>
                      Send urgent communications to all users of the HASIVU platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch checked={emergencyMode} onCheckedChange={setEmergencyMode} />
                            <span className="font-medium">Emergency Mode</span>
                            {emergencyMode && <Badge variant="destructive">ACTIVE</Badge>}
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Message</label>
                          <textarea
                            className="w-full p-3 border rounded-lg resize-none"
                            rows={4}
                            placeholder="Enter your broadcast message..."
                            value={broadcastMessage}
                            onChange={e => setBroadcastMessage(e.target.value)}
                          />
                        </div>

                        <div className="flex space-x-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                className="flex-1"
                                variant={emergencyMode ? 'destructive' : 'default'}
                                disabled={!broadcastMessage.trim()}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send to All Users
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Broadcast</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will send an {emergencyMode ? 'emergency' : 'urgent'} message
                                  to all active users. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction>Send Broadcast</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            Target Groups
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertTitle>Broadcast Guidelines</AlertTitle>
                      <AlertDescription>
                        Emergency broadcasts are logged and sent immediately to all active users.
                        Use responsibly and only for urgent school-wide communications.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Broadcasts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Weather Alert</p>
                            <p className="text-sm text-gray-600">
                              Due to heavy rain, meal service timings have been adjusted...
                            </p>
                          </div>
                          <Badge variant="secondary">2h ago</Badge>
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Menu Update</p>
                            <p className="text-sm text-gray-600">
                              Special Republic Day menu available today with traditional items...
                            </p>
                          </div>
                          <Badge variant="secondary">1d ago</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </SidebarInset>
      </div>

      {/* Meal Order Drawer */}
      {selectedMeal && (
        <MealOrderDrawer
          meal={selectedMeal}
          isOpen={isMealDrawerOpen}
          onClose={() => setIsMealDrawerOpen(false)}
          onAddToCart={handleAddToCart}
        />
      )}
    </SidebarProvider>
  );
};
