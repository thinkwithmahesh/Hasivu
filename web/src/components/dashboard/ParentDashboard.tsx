"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  Clock,
  MapPin,
  Bell,
  Star,
  CheckCircle,
  AlertTriangle,
  Heart,
  Utensils,
  Calendar,
  Settings,
  Plus,
  Eye,
  Download,
  Filter,
  Search,
  ChevronDown,
  ArrowRight,
  Activity,
  Target,
  Shield,
  Trophy,
  Zap
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

// Enhanced TypeScript interfaces for parent dashboard
interface Child {
  id: string;
  name: string;
  grade: string;
  school: string;
  avatar: string;
  dietaryRestrictions: string[];
  favoriteItems: string[];
  nutritionScore: number;
  weeklyStreak: number;
  allergies: string[];
  preferences: {
    spiceLevel: 'mild' | 'medium' | 'hot';
    cuisineType: string[];
    mealTime: string;
  };
}

interface Order {
  id: string;
  childId: string;
  childName: string;
  items: OrderItem[];
  status: 'ordered' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderTime: string;
  deliveryTime?: string;
  totalAmount: number;
  nutritionScore: number;
  rfidVerified: boolean;
  photoProof?: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'topup';
  amount: number;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
  fraudScore?: number;
}

interface NutritionInsight {
  period: string;
  totalMeals: number;
  averageScore: number;
  topNutrients: string[];
  recommendations: string[];
}

// Mock data for demonstration
const mockChildren: Child[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    grade: '7th Grade',
    school: 'DPS Bangalore East',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    dietaryRestrictions: ['Vegetarian'],
    favoriteItems: ['Masala Dosa', 'Sambar Rice', 'Coconut Chutney'],
    nutritionScore: 87,
    weeklyStreak: 5,
    allergies: ['Nuts'],
    preferences: {
      spiceLevel: 'mild',
      cuisineType: ['South Indian', 'North Indian'],
      mealTime: '12:30 PM'
    }
  },
  {
    id: '2', 
    name: 'Arjun Sharma',
    grade: '4th Grade',
    school: 'DPS Bangalore East',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    dietaryRestrictions: [],
    favoriteItems: ['Chicken Biryani', 'Roti', 'Dal Makhani'],
    nutritionScore: 92,
    weeklyStreak: 7,
    allergies: [],
    preferences: {
      spiceLevel: 'medium',
      cuisineType: ['North Indian', 'Continental'],
      mealTime: '1:00 PM'
    }
  }
];

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    childId: '1',
    childName: 'Priya Sharma',
    items: [
      {
        id: '1',
        name: 'Masala Dosa with Sambar',
        quantity: 1,
        price: 85,
        category: 'South Indian',
        nutritionInfo: { calories: 320, protein: 12, carbs: 58, fat: 8 }
      }
    ],
    status: 'delivered',
    orderTime: '2024-01-15T11:30:00Z',
    deliveryTime: '2024-01-15T12:45:00Z',
    totalAmount: 85,
    nutritionScore: 88,
    rfidVerified: true,
    photoProof: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200&h=150&fit=crop'
  },
  {
    id: 'ORD-002',
    childId: '2',
    childName: 'Arjun Sharma',
    items: [
      {
        id: '2',
        name: 'Chicken Biryani',
        quantity: 1,
        price: 120,
        category: 'North Indian',
        nutritionInfo: { calories: 450, protein: 25, carbs: 65, fat: 15 }
      }
    ],
    status: 'preparing',
    orderTime: '2024-01-15T12:00:00Z',
    totalAmount: 120,
    nutritionScore: 85,
    rfidVerified: false
  }
];

// Multi-child selector component
const ChildSelector = ({ children, selectedChild, onSelect }: {
  children: Child[];
  selectedChild: Child | null;
  onSelect: (child: Child) => void;
}) => {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {children.map((child) => (
        <motion.button
          key={child.id}
          onClick={() => onSelect(child)}
          className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
            selectedChild?.id === child.id
              ? 'border-hasivu-orange-500 bg-hasivu-orange-50 shadow-glow-orange'
              : 'border-gray-200 bg-white hover:border-hasivu-orange-300 hover:bg-hasivu-orange-25'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Avatar className="w-12 h-12">
            <AvatarImage src={child.avatar} alt={child.name} />
            <AvatarFallback>{child.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <div className="font-semibold text-gray-900">{child.name}</div>
            <div className="text-sm text-gray-500">{child.grade}</div>
            <div className="text-xs text-hasivu-green-600 font-medium">
              {child.weeklyStreak} day streak
            </div>
          </div>
          {selectedChild?.id === child.id && (
            <CheckCircle className="w-5 h-5 text-hasivu-orange-500" />
          )}
        </motion.button>
      ))}
      
      <motion.button
        className="flex items-center justify-center p-4 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-hasivu-orange-300 hover:bg-hasivu-orange-25 transition-all duration-200 min-w-[120px]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="text-center">
          <Plus className="w-6 h-6 text-gray-400 mx-auto mb-1" />
          <div className="text-sm font-medium text-gray-600">Add Child</div>
        </div>
      </motion.button>
    </div>
  );
};

// Order status component with real-time updates
const OrderTracker = ({ order }: { order: Order }) => {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'ordered': return 'text-blue-600 bg-blue-100';
      case 'preparing': return 'text-yellow-600 bg-yellow-100';
      case 'ready': return 'text-orange-600 bg-orange-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'ordered', label: 'Order Placed', icon: ShoppingCart },
      { key: 'preparing', label: 'Preparing', icon: Utensils },
      { key: 'ready', label: 'Ready', icon: Bell },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle }
    ];
    
    return steps;
  };

  return (
    <Card className="hover:shadow-soft transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{order.childName}</CardTitle>
            <CardDescription>Order #{order.id}</CardDescription>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Items */}
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <span className="font-medium">{item.name}</span>
                <span className="text-sm text-gray-500 ml-2">×{item.quantity}</span>
              </div>
              <span className="font-semibold">Rs.{item.price}</span>
            </div>
          ))}
        </div>
        
        <Separator />
        
        {/* Status Timeline */}
        <div className="space-y-2">
          {getStatusSteps().map((step, index) => {
            const isActive = order.status === step.key;
            const isCompleted = ['ordered', 'preparing', 'ready', 'delivered'].indexOf(order.status) >= 
                              ['ordered', 'preparing', 'ready', 'delivered'].indexOf(step.key);
            
            return (
              <div key={step.key} className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-hasivu-green-100 text-hasivu-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <span className={`text-sm ${isActive ? 'font-semibold text-hasivu-orange-600' : 'text-gray-600'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* RFID Verification */}
        {order.rfidVerified && (
          <div className="flex items-center space-x-2 p-3 bg-hasivu-green-50 rounded-lg border border-hasivu-green-200">
            <Shield className="w-4 h-4 text-hasivu-green-600" />
            <span className="text-sm font-medium text-hasivu-green-700">RFID Verified</span>
            {order.photoProof && (
              <Button variant="outline" size="sm" className="ml-auto">
                <Eye className="w-3 h-3 mr-1" />
                Photo
              </Button>
            )}
          </div>
        )}
        
        {/* Nutrition Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Nutrition Score</span>
          <div className="flex items-center space-x-2">
            <Progress value={order.nutritionScore} className="w-16 h-2" />
            <span className="text-sm font-semibold text-hasivu-green-600">{order.nutritionScore}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Nutrition insights component with gamification
const NutritionInsights = ({ child }: { child: Child }) => {
  const weeklyData = [
    { day: 'Mon', score: 85, meals: 1 },
    { day: 'Tue', score: 90, meals: 1 },
    { day: 'Wed', score: 88, meals: 1 },
    { day: 'Thu', score: 92, meals: 1 },
    { day: 'Fri', score: 87, meals: 1 },
    { day: 'Sat', score: 0, meals: 0 },
    { day: 'Sun', score: 0, meals: 0 }
  ];
  
  const achievements = [
    { id: 1, name: 'Healthy Week', description: '5 days of balanced meals', icon: Trophy, unlocked: true },
    { id: 2, name: 'Protein Power', description: 'Met protein goals 3 days in a row', icon: Target, unlocked: true },
    { id: 3, name: 'Variety Explorer', description: 'Tried 3 new dishes this week', icon: Star, unlocked: false }
  ];

  return (
    <div className="space-y-6">
      {/* Weekly Streak */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-hasivu-orange-500" />
            Weekly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-bold text-hasivu-green-600">{child.weeklyStreak}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
            <div className="flex space-x-1">
              {weeklyData.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">{day.day}</div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    day.meals > 0 ? 'bg-hasivu-green-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {day.score || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Progress value={(child.weeklyStreak / 7) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div key={achievement.id} className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                achievement.unlocked 
                  ? 'bg-hasivu-green-50 border border-hasivu-green-200' 
                  : 'bg-gray-50 border border-gray-200 opacity-60'
              }`}>
                <achievement.icon className={`w-6 h-6 ${
                  achievement.unlocked ? 'text-hasivu-green-600' : 'text-gray-400'
                }`} />
                <div className="flex-1">
                  <div className="font-medium">{achievement.name}</div>
                  <div className="text-sm text-gray-600">{achievement.description}</div>
                </div>
                {achievement.unlocked && (
                  <CheckCircle className="w-5 h-5 text-hasivu-green-600" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Nutritional Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Dietary Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Dietary Restrictions</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {child.dietaryRestrictions.length > 0 ? child.dietaryRestrictions.map((restriction) => (
                <Badge key={restriction} variant="secondary" className="bg-blue-100 text-blue-800">
                  {restriction}
                </Badge>
              )) : (
                <span className="text-sm text-gray-500">None</span>
              )}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Allergies</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {child.allergies.length > 0 ? child.allergies.map((allergy) => (
                <Badge key={allergy} variant="destructive" className="bg-red-100 text-red-800">
                  {allergy}
                </Badge>
              )) : (
                <span className="text-sm text-gray-500">None reported</span>
              )}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Preferred Cuisines</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {child.preferences.cuisineType.map((cuisine) => (
                <Badge key={cuisine} className="bg-hasivu-orange-100 text-hasivu-orange-800">
                  {cuisine}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Spice Preference</label>
            <Badge className="ml-2 bg-yellow-100 text-yellow-800">
              {child.preferences.spiceLevel.charAt(0).toUpperCase() + child.preferences.spiceLevel.slice(1)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main dashboard component
export const ParentDashboard: React.FC = () => {
  const [selectedChild, setSelectedChild] = useState<Child | null>(mockChildren[0]);
  const [activeTab, setActiveTab] = useState('overview');
  const [orders] = useState<Order[]>(mockOrders);

  const todaysOrders = orders.filter(order => {
    const orderDate = new Date(order.orderTime).toDateString();
    const today = new Date().toDateString();
    return orderDate === today;
  });

  const childOrders = selectedChild 
    ? orders.filter(order => order.childId === selectedChild.id)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
              <p className="text-gray-600">Manage your children's meal plans and nutrition</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button className="flex items-center bg-hasivu-orange-600 hover:bg-hasivu-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Quick Order
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Child Selection */}
        <ChildSelector 
          children={mockChildren}
          selectedChild={selectedChild}
          onSelect={setSelectedChild}
        />

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders & Tracking</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition & Goals</TabsTrigger>
            <TabsTrigger value="payments">Payments & Wallet</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {selectedChild && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Stats */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center">
                          <div className="p-2 bg-hasivu-green-100 rounded-full">
                            <Utensils className="w-6 h-6 text-hasivu-green-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-2xl font-bold">{todaysOrders.length}</p>
                            <p className="text-gray-600">Today's Orders</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center">
                          <div className="p-2 bg-hasivu-orange-100 rounded-full">
                            <Star className="w-6 h-6 text-hasivu-orange-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-2xl font-bold">{selectedChild.nutritionScore}%</p>
                            <p className="text-gray-600">Nutrition Score</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center">
                          <div className="p-2 bg-hasivu-blue-100 rounded-full">
                            <Trophy className="w-6 h-6 text-hasivu-blue-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-2xl font-bold">{selectedChild.weeklyStreak}</p>
                            <p className="text-gray-600">Day Streak</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Orders */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Recent Orders</CardTitle>
                        <Button variant="ghost" size="sm">
                          View All <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {childOrders.slice(0, 3).map((order) => (
                          <OrderTracker key={order.id} order={order} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Nutrition Insights Sidebar */}
                <div>
                  <NutritionInsights child={selectedChild} />
                </div>
              </div>
            )}
          </TabsContent>

          {/* Orders & Tracking Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Orders & Tracking</h2>
                <p className="text-gray-600">Monitor all meal orders and delivery status</p>
              </div>
              <div className="flex items-center space-x-3">
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter orders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all-status">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-status">All Status</SelectItem>
                    <SelectItem value="ordered">Ordered</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-hasivu-orange-600 hover:bg-hasivu-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Order
                </Button>
              </div>
            </div>

            {/* Order Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold">24</p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-sm text-gray-600">In Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold">21</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold">Rs.2,340</p>
                      <p className="text-sm text-gray-600">Total Spent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Orders
                  <div className="flex items-center space-x-2">
                    <Input 
                      placeholder="Search orders..." 
                      className="w-64"
                      prefix={<Search className="w-4 h-4" />}
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <OrderTracker key={order.id} order={order} />
                  ))}
                  
                  {/* Enhanced Order Cards */}
                  <div className="grid gap-4">
                    {[
                      {
                        id: 'ORD-003',
                        childName: 'Priya Sharma',
                        items: [{ name: 'Paneer Butter Masala with Rice', quantity: 1, price: 95 }],
                        status: 'ready' as const,
                        orderTime: '2024-01-15T12:15:00Z',
                        estimatedDelivery: '12:45 PM',
                        nutritionScore: 91,
                        specialInstructions: 'Less spicy, extra rice'
                      },
                      {
                        id: 'ORD-004', 
                        childName: 'Arjun Sharma',
                        items: [{ name: 'Chicken Fried Rice', quantity: 1, price: 110 }],
                        status: 'ordered' as const,
                        orderTime: '2024-01-15T12:20:00Z',
                        estimatedDelivery: '1:15 PM',
                        nutritionScore: 88,
                        specialInstructions: 'No vegetables'
                      }
                    ].map((order) => (
                      <Card key={order.id} className="border-l-4 border-l-hasivu-orange-500 hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback>{order.childName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-semibold">{order.childName}</h4>
                                    <p className="text-sm text-gray-600">Order #{order.id}</p>
                                  </div>
                                </div>
                                <Badge className={`${
                                  order.status === 'ready' ? 'bg-orange-100 text-orange-800' :
                                  order.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.status === 'ready' ? 'Ready for Pickup' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2 mb-4">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-gray-600">Rs.{item.price}</span>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>Ordered: {new Date(order.orderTime).toLocaleTimeString()}</span>
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  ETA: {order.estimatedDelivery}
                                </span>
                              </div>
                              
                              {order.specialInstructions && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                                  <p className="text-sm text-amber-800">
                                    <strong>Special Instructions:</strong> {order.specialInstructions}
                                  </p>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">Nutrition Score:</span>
                                  <Progress value={order.nutritionScore} className="w-20 h-2" />
                                  <span className="text-sm font-semibold text-hasivu-green-600">{order.nutritionScore}%</span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Button variant="outline" size="sm">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    Track
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Bell className="w-4 h-4 mr-1" />
                                    Notify
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Nutrition & Goals</h2>
                <p className="text-gray-600">AI-powered nutrition insights and personalized goals</p>
              </div>
              <div className="flex items-center space-x-3">
                <Select defaultValue="week">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">3 Months</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>

            {selectedChild && (() => {
              const weeklyData = [
                { day: 'Mon', score: 85, meals: 1 },
                { day: 'Tue', score: 90, meals: 1 },
                { day: 'Wed', score: 88, meals: 1 },
                { day: 'Thu', score: 92, meals: 1 },
                { day: 'Fri', score: 87, meals: 1 },
                { day: 'Sat', score: 0, meals: 0 },
                { day: 'Sun', score: 0, meals: 0 }
              ];
              
              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Nutrition Analytics */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Nutrition Score Trends */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-hasivu-green-600" />
                          Nutrition Score Trends
                        </CardTitle>
                        <CardDescription>Weekly nutrition performance for {selectedChild.name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 flex items-end justify-between space-x-2">
                          {weeklyData.map((day, index) => {
                          const height = day.meals > 0 ? (day.score / 100) * 200 : 0;
                          return (
                            <div key={index} className="flex flex-col items-center flex-1">
                              <div className="w-full bg-gray-200 rounded-t-lg relative overflow-hidden" style={{ height: '200px' }}>
                                <motion.div 
                                  className={`absolute bottom-0 w-full rounded-t-lg ${
                                    day.score >= 90 ? 'bg-gradient-to-t from-green-500 to-green-400' :
                                    day.score >= 80 ? 'bg-gradient-to-t from-yellow-500 to-yellow-400' :
                                    day.score >= 70 ? 'bg-gradient-to-t from-orange-500 to-orange-400' :
                                    day.meals > 0 ? 'bg-gradient-to-t from-red-500 to-red-400' : ''
                                  }`}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${height}px` }}
                                  transition={{ delay: index * 0.1, duration: 0.5 }}
                                />
                              </div>
                              <div className="text-center mt-2">
                                <div className="text-xs text-gray-500">{day.day}</div>
                                <div className="text-sm font-semibold">{day.score || '-'}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Nutritional Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Weekly Nutritional Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Protein', value: 24, unit: 'g', target: 30, color: 'bg-red-500' },
                          { label: 'Carbs', value: 180, unit: 'g', target: 200, color: 'bg-blue-500' },
                          { label: 'Fat', value: 45, unit: 'g', target: 50, color: 'bg-yellow-500' },
                          { label: 'Fiber', value: 18, unit: 'g', target: 25, color: 'bg-green-500' }
                        ].map((nutrient) => (
                          <div key={nutrient.label} className="text-center">
                            <div className="relative w-20 h-20 mx-auto mb-2">
                              <svg className="w-20 h-20 transform -rotate-90">
                                <circle 
                                  cx="40" cy="40" r="36" 
                                  stroke="currentColor" 
                                  strokeWidth="4" 
                                  fill="none" 
                                  className="text-gray-200" 
                                />
                                <circle 
                                  cx="40" cy="40" r="36" 
                                  stroke="currentColor" 
                                  strokeWidth="4" 
                                  fill="none" 
                                  strokeDasharray={`${2 * Math.PI * 36}`} 
                                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - nutrient.value / nutrient.target)}`}
                                  className={nutrient.color.replace('bg-', 'text-')}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold">{Math.round((nutrient.value / nutrient.target) * 100)}%</span>
                              </div>
                            </div>
                            <div className="font-medium">{nutrient.label}</div>
                            <div className="text-sm text-gray-600">{nutrient.value}{nutrient.unit} / {nutrient.target}{nutrient.unit}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-purple-600" />
                        AI Nutrition Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          {
                            type: 'success',
                            icon: CheckCircle,
                            title: 'Great Protein Intake!',
                            description: 'Priya is meeting her protein goals consistently. Keep including dal and paneer.',
                            color: 'text-green-600 bg-green-50 border-green-200'
                          },
                          {
                            type: 'warning',
                            icon: AlertTriangle,
                            title: 'Increase Fiber Intake',
                            description: 'Consider adding more vegetables and fruits. Try mixed vegetable curry or fresh fruit sides.',
                            color: 'text-amber-600 bg-amber-50 border-amber-200'
                          },
                          {
                            type: 'info',
                            icon: Target,
                            title: 'Balanced Meal Suggestion',
                            description: 'Tomorrow, try: Rajma Rice + Mixed Veg + Curd + Apple for optimal nutrition balance.',
                            color: 'text-blue-600 bg-blue-50 border-blue-200'
                          }
                        ].map((rec, index) => {
                          const IconComponent = rec.icon;
                          return (
                            <div key={index} className={`flex items-start space-x-3 p-4 rounded-lg border ${rec.color}`}>
                              <IconComponent className="w-5 h-5 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold mb-1">{rec.title}</h4>
                                <p className="text-sm opacity-90">{rec.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar - Goals & Achievements */}
                <div className="space-y-6">
                  {/* Weekly Goals */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Weekly Goals</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { label: 'Healthy Meals', current: 5, target: 7, icon: Utensils },
                        { label: 'Nutrition Score', current: 87, target: 90, icon: Star },
                        { label: 'Variety Score', current: 8, target: 10, icon: Heart }
                      ].map((goal, index) => {
                        const IconComponent = goal.icon;
                        const progress = (goal.current / goal.target) * 100;
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <IconComponent className="w-4 h-4 text-hasivu-orange-600" />
                                <span className="font-medium text-sm">{goal.label}</span>
                              </div>
                              <span className="text-sm text-gray-600">{goal.current}/{goal.target}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Recent Achievements */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                        Recent Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          {
                            title: 'Protein Champion',
                            description: 'Met protein goals 5 days straight!',
                            date: '2 days ago',
                            icon: '🏆'
                          },
                          {
                            title: 'Variety Explorer', 
                            description: 'Tried 3 new healthy dishes',
                            date: '1 week ago', 
                            icon: '🌟'
                          },
                          {
                            title: 'Consistent Eater',
                            description: 'No missed meals this week',
                            date: '3 days ago',
                            icon: '💪'
                          }
                        ].map((achievement, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                            <div className="text-2xl">{achievement.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{achievement.title}</h4>
                              <p className="text-xs text-gray-600 mb-1">{achievement.description}</p>
                              <p className="text-xs text-gray-500">{achievement.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Health Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Health Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Heart className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-sm text-green-800">Overall Health</span>
                        </div>
                        <p className="text-xs text-green-700">Excellent nutrition balance. Keep up the good work!</p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-sm text-blue-800">Growth Tracking</span>
                        </div>
                        <p className="text-xs text-blue-700">Nutrition supporting healthy growth patterns</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Payments & Wallet</h2>
                <p className="text-gray-600">Manage payments, wallet balance, and security</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Transaction History
                </Button>
                <Button className="bg-hasivu-green-600 hover:bg-hasivu-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Money
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Payment Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Wallet Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-hasivu-blue-600" />
                      Wallet Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-r from-hasivu-green-500 to-hasivu-blue-500 text-white p-6 rounded-2xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-hasivu-green-100 text-sm">Available Balance</p>
                            <p className="text-2xl font-bold">Rs.1,250</p>
                          </div>
                          <CreditCard className="w-8 h-8 text-hasivu-green-100" />
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-hasivu-green-100">Wallet ID: WAL-2024-001</span>
                          <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                            Top Up
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                          <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Monthly Spending</p>
                          <p className="text-xl font-bold text-gray-900">Rs.3,240</p>
                          <p className="text-xs text-green-600">↓ 12% from last month</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                          <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Fraud Protection</p>
                          <p className="text-xl font-bold text-green-600">Active</p>
                          <p className="text-xs text-gray-500">99.7% accuracy</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Recent Transactions</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Select defaultValue="all">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="payment">Payments</SelectItem>
                            <SelectItem value="refund">Refunds</SelectItem>
                            <SelectItem value="topup">Top-ups</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          id: 'TXN-001',
                          type: 'payment' as const,
                          description: 'Lunch - Masala Dosa & Sambar',
                          amount: -85,
                          status: 'success' as const,
                          timestamp: '2024-01-15T12:45:00Z',
                          child: 'Priya Sharma',
                          fraudScore: 0.1
                        },
                        {
                          id: 'TXN-002',
                          type: 'payment' as const,
                          description: 'Lunch - Chicken Biryani',
                          amount: -120,
                          status: 'success' as const,
                          timestamp: '2024-01-15T13:00:00Z',
                          child: 'Arjun Sharma',
                          fraudScore: 0.05
                        },
                        {
                          id: 'TXN-003',
                          type: 'topup' as const,
                          description: 'Wallet Top-up via UPI',
                          amount: 1000,
                          status: 'success' as const,
                          timestamp: '2024-01-14T10:30:00Z',
                          child: '',
                          fraudScore: 0
                        },
                        {
                          id: 'TXN-004',
                          type: 'refund' as const,
                          description: 'Cancelled Order Refund',
                          amount: 95,
                          status: 'pending' as const,
                          timestamp: '2024-01-14T16:20:00Z',
                          child: 'Priya Sharma',
                          fraudScore: 0
                        }
                      ].map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full ${
                              transaction.type === 'payment' ? 'bg-red-100' :
                              transaction.type === 'topup' ? 'bg-green-100' :
                              transaction.type === 'refund' ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              {transaction.type === 'payment' && <ArrowRight className="w-4 h-4 text-red-600 rotate-90" />}
                              {transaction.type === 'topup' && <ArrowRight className="w-4 h-4 text-green-600 -rotate-90" />}
                              {transaction.type === 'refund' && <ArrowRight className="w-4 h-4 text-blue-600 -rotate-90" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{transaction.description}</h4>
                                {transaction.fraudScore > 0.5 && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Flagged
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>#{transaction.id}</span>
                                {transaction.child && <span>{transaction.child}</span>}
                                <span>{new Date(transaction.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${
                              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}Rs.{Math.abs(transaction.amount)}
                            </div>
                            <Badge className={`text-xs ${
                              transaction.status === 'success' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Fraud Detection Dashboard */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-purple-600" />
                      AI Fraud Detection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">99.7%</div>
                        <div className="text-sm text-green-700">Detection Accuracy</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">Rs.15,420</div>
                        <div className="text-sm text-blue-700">Protected This Year</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">0</div>
                        <div className="text-sm text-orange-700">Suspicious Activities</div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                          <h4 className="font-semibold text-green-800">All Systems Protected</h4>
                          <p className="text-sm text-green-700">Your account is fully secured with real-time fraud monitoring</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Quick Actions & Settings */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment Method
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Auto-reload Settings
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download Statements
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Bell className="w-4 h-4 mr-2" />
                      Notification Settings
                    </Button>
                  </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Saved Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { type: 'UPI', details: 'parent@upi', primary: true },
                      { type: 'Card', details: '**** **** **** 1234', primary: false },
                      { type: 'Net Banking', details: 'SBI ****5678', primary: false }
                    ].map((method, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{method.type}</div>
                            <div className="text-xs text-gray-600">{method.details}</div>
                          </div>
                        </div>
                        {method.primary && (
                          <Badge className="bg-hasivu-orange-100 text-hasivu-orange-800 text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Security Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Two-Factor Auth</div>
                        <div className="text-xs text-gray-600">SMS verification for transactions</div>
                      </div>
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Transaction Limits</div>
                        <div className="text-xs text-gray-600">Rs.500 per transaction</div>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Auto-reload</div>
                        <div className="text-xs text-gray-600">When balance &lt; Rs. 100</div>
                      </div>
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ParentDashboard;
