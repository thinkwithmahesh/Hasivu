/**
 * HASIVU Platform - Payment Dashboard Component
 * Epic 5: Payment Processing & Billing System
 *
 * Main payment dashboard that integrates all payment-related components
 * including forms, subscriptions, analytics, billing, and security
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Receipt,
  BarChart3,
  Shield,
  Settings,
  Plus,
  DollarSign,
  TrendingUp,
  Users,
  Activity,
} from 'lucide-react';
import { PaymentForm } from './PaymentForm';
import { SubscriptionManager } from './SubscriptionManager';
import { PaymentAnalyticsDashboard } from './PaymentAnalyticsDashboard';
import { BillingDashboard } from './BillingDashboard';
import { PaymentSecurityDashboard } from './PaymentSecurityDashboard';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '../ErrorBoundary';

interface PaymentDashboardProps {
  schoolId: string;
  parentId: string;
  className?: string;
}

export const PaymentDashboard: React.FC<PaymentDashboardProps> = ({
  schoolId,
  parentId,
  className,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Mock data for overview
  const overviewData = {
    totalRevenue: 125000,
    monthlyRevenue: 15000,
    activeSubscriptions: 450,
    pendingPayments: 8,
    successRate: 98.5,
    recentTransactions: 1250,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <ErrorBoundary>
      <div className={cn('w-full space-y-6', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Payment Management</h2>
            <p className="text-muted-foreground">
              Comprehensive payment processing, billing, and analytics dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowPaymentForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Make Payment
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(overviewData.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex items-center text-sm text-green-600 mt-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12.5% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                  <p className="text-2xl font-bold">{overviewData.activeSubscriptions}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex items-center text-sm text-blue-600 mt-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                +8.2% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{overviewData.successRate}%</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
              <Badge variant="secondary" className="mt-2">
                Excellent
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold">{overviewData.pendingPayments}</p>
                </div>
                <CreditCard className="h-8 w-8 text-yellow-600" />
              </div>
              <Badge variant="outline" className="mt-2">
                Requires attention
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Make a Payment</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowPaymentForm(false)}>
                    ×
                  </Button>
                </div>
                <PaymentForm
                  orderId={`order_${Date.now()}`}
                  schoolId={schoolId}
                  parentId={parentId}
                  amount={1200}
                  description="Meal Plan Payment"
                  onSuccess={transactionId => {
                    setShowPaymentForm(false);
                  }}
                  onError={error => {}}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest payment transactions and activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: 'payment', amount: 1200, status: 'success', time: '2 hours ago' },
                      { type: 'subscription', amount: 2500, status: 'success', time: '1 day ago' },
                      { type: 'refund', amount: -800, status: 'success', time: '2 days ago' },
                      { type: 'payment', amount: 1500, status: 'pending', time: '3 days ago' },
                    ].map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              activity.status === 'success'
                                ? 'bg-green-500'
                                : activity.status === 'pending'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            )}
                          />
                          <div>
                            <p className="font-medium capitalize">{activity.type}</p>
                            <p className="text-sm text-gray-600">{activity.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              'font-bold',
                              activity.amount > 0 ? 'text-green-600' : 'text-red-600'
                            )}
                          >
                            {activity.amount > 0 ? '+' : ''}
                            {formatCurrency(activity.amount)}
                          </p>
                          <Badge variant={activity.status === 'success' ? 'default' : 'secondary'}>
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common payment management tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setShowPaymentForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Make a Payment
                  </Button>

                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setActiveTab('subscriptions')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Subscriptions
                  </Button>

                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setActiveTab('billing')}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    View Invoices
                  </Button>

                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <SubscriptionManager schoolId={schoolId} parentId={parentId} />
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <BillingDashboard parentId={parentId} schoolId={schoolId} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <PaymentAnalyticsDashboard schoolId={schoolId} />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <PaymentSecurityDashboard schoolId={schoolId} />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};
