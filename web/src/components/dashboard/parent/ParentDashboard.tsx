'use client';

import React, { useState, useEffect } from 'react';
import { useSelector as _useSelector, useDispatch as _useDispatch } from 'react-redux';
import { useReducedMotion } from 'framer-motion';
import { Aarav } from '@/components/characters/HasivuFriend';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import {
  ShoppingCart,
  Clock,
  CreditCard,
  Bell,
  User,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Child, Order, DashboardAnalytics } from '@/types/dashboard';

// Import child components
import { ChildManagement } from './components/ChildManagement';
import { OrderHistory } from './components/OrderHistory';
import { OrderTracking } from './components/OrderTracking';
import { PaymentMethods } from './components/PaymentMethods';
import { NotificationCenter } from './components/NotificationCenter';
import { SubscriptionManagement } from './components/SubscriptionManagement';
import { NutritionDashboard } from './components/NutritionDashboard';

interface DashboardOverviewProps {
  children: Child[];
  recentOrders: Order[];
  analytics: DashboardAnalytics | null;
  onQuickAction: (action: string, data?: any) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  children,
  recentOrders,
  analytics,
  onQuickAction,
}) => {
  const shouldReduce = useReducedMotion();

  const getStatusColor = (status: Order['status']) => {
    const colors: Record<Order['status'], string> = {
      pending: 'bg-hasivu-warning/15 text-hasivu-warning',
      completed: 'bg-hasivu-primary/15 text-hasivu-primary',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-hasivu-success/15 text-hasivu-success',
      delivered: 'bg-hasivu-bg-warm text-hasivu-text-secondary',
      cancelled: 'bg-hasivu-danger/15 text-hasivu-danger',
    };
    return colors[status] || 'bg-hasivu-bg-warm text-hasivu-text-secondary';
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-hasivu-success" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-hasivu-danger" />;
      case 'ready':
        return <Clock className="h-4 w-4 text-hasivu-success" />;
      default:
        return <Clock className="h-4 w-4 text-hasivu-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-hasivu-primary to-hasivu-primary-dark text-white rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-2 -top-2" aria-hidden="true">
          <Aarav size={48} animation="breathe" respectReducedMotion />
        </div>
        <h1 className="text-2xl font-display font-bold mb-2">Welcome back!</h1>
        <p className="text-white/80">
          Manage your children's meals and track their nutrition journey
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-hasivu-text-secondary">Active Children</p>
                <p className="text-2xl font-bold">{children.filter(c => c.isActive).length}</p>
              </div>
              <User className="h-8 w-8 text-hasivu-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-hasivu-text-secondary">Orders This Month</p>
                <p className="text-2xl font-bold">{analytics?.totalOrders || 0}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-hasivu-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-hasivu-text-secondary">Total Spent</p>
                <p className="text-2xl font-bold">₹{analytics?.totalSpent?.toFixed(2) || '0.00'}</p>
              </div>
              <CreditCard className="h-8 w-8 text-hasivu-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-hasivu-text-secondary">Avg Order Value</p>
                <p className="text-2xl font-bold">
                  ₹{analytics?.averageOrderValue?.toFixed(2) || '0.00'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Children Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Children</CardTitle>
            <CardDescription>Manage profiles and preferences</CardDescription>
          </div>
          <Button onClick={() => onQuickAction('add_child')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Child
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.slice(0, 6).map(child => (
              <div key={child.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Avatar>
                  <AvatarImage src={child.avatar} alt={child.firstName || child.name} />
                  <AvatarFallback>
                    {child.firstName?.[0] || child.name?.[0] || '?'}
                    {child.lastName?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {child.firstName && child.lastName
                      ? `${child.firstName} ${child.lastName}`
                      : child.name}
                  </p>
                  <p className="text-xs text-hasivu-text-secondary">
                    Grade {child.grade}, Class {child.class}
                  </p>
                  {child.allergies && child.allergies.length > 0 && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {child.allergies.length} allergi{child.allergies.length === 1 ? 'y' : 'es'}
                    </Badge>
                  )}
                </div>
                {child.isActive ? (
                  <Badge className="bg-hasivu-success/15 text-hasivu-success">Active</Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </div>
            ))}
          </div>
          {children.length > 6 && (
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => onQuickAction('view_all_children')}>
                View All Children ({children.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest meal orders and their status</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => onQuickAction('refresh_orders')}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-hasivu-text-secondary/50 mx-auto mb-4" />
              <p className="text-hasivu-text-secondary">No recent orders</p>
              <Button className="mt-4" onClick={() => onQuickAction('create_order')}>
                Place Your First Order
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.slice(0, 5).map(order => {
                const child = children.find(c => c.id === order.childId);
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">{getStatusIcon(order.status)}</div>
                      <div>
                        <p className="font-medium">Order #{order.id.slice(-8)}</p>
                        <p className="text-sm text-hasivu-text-secondary">
                          {child?.firstName && child?.lastName
                            ? `${child.firstName} ${child.lastName}`
                            : child?.name || 'Unknown'}{' '}
                          • {order.items.length} item
                          {order.items.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-hasivu-text-secondary/70">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : order.orderDate}{' '}
                          • ₹{order.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onQuickAction('track_order', order.id)}
                      >
                        Track
                      </Button>
                    </div>
                  </div>
                );
              })}
              {recentOrders.length > 5 && (
                <div className="text-center">
                  <Button variant="outline" onClick={() => onQuickAction('view_all_orders')}>
                    View All Orders
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Commonly used features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col space-y-2"
              onClick={() => onQuickAction('create_order')}
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="text-sm">New Order</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col space-y-2"
              onClick={() => onQuickAction('view_menu')}
            >
              <Calendar className="h-6 w-6" />
              <span className="text-sm">View Menu</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col space-y-2"
              onClick={() => onQuickAction('view_nutrition')}
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Nutrition</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col space-y-2"
              onClick={() => onQuickAction('manage_payments')}
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">Payments</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ParentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual Redux selectors
  const children: Child[] = [];
  const recentOrders: Order[] = [];
  const analytics: DashboardAnalytics | null = null;

  useEffect(() => {
    // Load dashboard data
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch data from API
        // dispatch(fetchChildren());
        // dispatch(fetchRecentOrders());
        // dispatch(fetchAnalytics());
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleQuickAction = (action: string, data?: any) => {
    switch (action) {
      case 'add_child':
        setActiveTab('children');
        break;
      case 'view_all_orders':
        setActiveTab('orders');
        break;
      case 'track_order':
        setActiveTab('tracking');
        break;
      case 'manage_payments':
        setActiveTab('payments');
        break;
      case 'view_nutrition':
        setActiveTab('nutrition');
        break;
      case 'refresh_orders':
        // Refresh orders data
        break;
      default:
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hasivu-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-hasivu-text-primary">
            Parent Dashboard
          </h1>
          <p className="text-hasivu-text-secondary">Manage your children's meals and nutrition</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Avatar>
            <AvatarFallback>P</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="children">Children</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
          <TabsTrigger value="subscriptions">Plans</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardOverview
            children={children}
            recentOrders={recentOrders}
            analytics={analytics}
            onQuickAction={handleQuickAction}
          />
        </TabsContent>

        <TabsContent value="children">
          <ChildManagement children={children} />
        </TabsContent>

        <TabsContent value="orders"></TabsContent>

        <TabsContent value="tracking"></TabsContent>

        <TabsContent value="payments">
          <PaymentMethods paymentMethods={[]} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationCenter notifications={[]} />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionManagement subscription={null} />
        </TabsContent>

        <TabsContent value="nutrition">
          <NutritionDashboard nutritionData={null} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
