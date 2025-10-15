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
  Activity
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
  className
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
    recentTransactions: 1250
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
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
            <Button
              onClick={() => setShowPaymentForm(true)}
              className="flex items-center gap-2"
            >
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentForm(false)}
                >
