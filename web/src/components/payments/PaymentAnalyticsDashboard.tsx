/**
 * HASIVU Platform - Payment Analytics Dashboard Component
 * Epic 5: Payment Processing & Billing System - Story 5.4
 *
 * Comprehensive payment analytics and reporting dashboard
 * with revenue tracking, transaction analysis, and financial insights
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Lock,
  Info,
} from 'lucide-react';
import { PaymentService } from '@/services/payment.service';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useConditionalRender, _FEATURE_FLAGS } from '@/hooks/useFeatureFlag';

interface PaymentAnalyticsProps {
  schoolId?: string;
  className?: string;
}

interface PaymentMetrics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  successRate: number;
  refundRate: number;
  topPaymentMethods: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
  revenueByPeriod: Array<{
    period: string;
    revenue: number;
    transactions: number;
    refunds: number;
  }>;
  subscriptionMetrics: {
    activeSubscriptions: number;
    monthlyRecurringRevenue: number;
    churnRate: number;
    averageLifetimeValue: number;
  };
  paymentMethodPerformance: Array<{
    method: string;
    successRate: number;
    averageProcessingTime: number;
    totalVolume: number;
  }>;
}

const CHARTCOLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];

export const PaymentAnalyticsDashboard: React.FC<PaymentAnalyticsProps> = ({
  schoolId,
  className,
}) => {
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  const paymentService = PaymentService.getInstance();

  // Feature flag for advanced analytics
  const { shouldRender: showAdvancedAnalytics, isLoading: analyticsFlagLoading } =
    useConditionalRender(_FEATURE_FLAGS.ADVANCED_ANALYTICS, {
      fallback: (
        <Card className="p-6">
          <div className="text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Advanced Analytics Unavailable</h3>
            <p className="text-gray-600 mb-4">
              Advanced payment analytics features are currently disabled for your account. Contact
              your administrator to enable this feature.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Info className="h-4 w-4" />
              <span>Basic payment tracking is still available</span>
            </div>
          </div>
        </Card>
      ),
    });

  // Load analytics data
  const loadAnalytics = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      setError(null); // Clear any previous errors

      const dateRange = getDateRange(timeRange);
      const result = await paymentService.getPaymentAnalytics({
        schoolId,
        dateRange,
      });

      if (result.success && result.data) {
        setMetrics(result.data);
      } else {
        // Handle API error
        setError(result.error || 'Failed to load payment analytics');
        setMetrics(null);
      }
    } catch (error) {
      setError('Network error occurred while loading analytics');
      setMetrics(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, schoolId]);

  const getDateRange = (range: string) => {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };
  };

  const _generateMockMetrics = (): PaymentMetrics => ({
    totalRevenue: 125000,
    totalTransactions: 1250,
    averageTransactionValue: 100,
    successRate: 98.5,
    refundRate: 2.1,
    topPaymentMethods: [
      { method: 'UPI', amount: 75000, percentage: 60 },
      { method: 'Card', amount: 37500, percentage: 30 },
      { method: 'Net Banking', amount: 12500, percentage: 10 },
    ],
    revenueByPeriod: Array.from({ length: 12 }, (_, i) => ({
      period: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
        'en-US',
        { month: 'short' }
      ),
      revenue: Math.floor(Math.random() * 15000) + 5000,
      transactions: Math.floor(Math.random() * 150) + 50,
      refunds: Math.floor(Math.random() * 10) + 1,
    })),
    subscriptionMetrics: {
      activeSubscriptions: 450,
      monthlyRecurringRevenue: 67500,
      churnRate: 5.2,
      averageLifetimeValue: 2400,
    },
    paymentMethodPerformance: [
      { method: 'UPI', successRate: 99.2, averageProcessingTime: 2.1, totalVolume: 75000 },
      { method: 'Card', successRate: 97.8, averageProcessingTime: 3.5, totalVolume: 37500 },
      { method: 'Net Banking', successRate: 96.5, averageProcessingTime: 5.2, totalVolume: 12500 },
    ],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Calculate growth metrics
  const revenueGrowth = useMemo(() => {
    if (!metrics?.revenueByPeriod || metrics.revenueByPeriod.length < 2) return 0;
    const current = metrics.revenueByPeriod[metrics.revenueByPeriod.length - 1].revenue;
    const previous = metrics.revenueByPeriod[metrics.revenueByPeriod.length - 2].revenue;
    return ((current - previous) / previous) * 100;
  }, [metrics]);

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Analytics</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => loadAnalytics()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into payment performance and revenue metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics?.totalRevenue || 0)}</p>
              </div>
              <div
                className={cn(
                  'flex items-center text-sm',
                  revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {revenueGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(revenueGrowth).toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">
                  {metrics?.totalTransactions?.toLocaleString() || 0}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{formatPercentage(metrics?.successRate || 0)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Transaction</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(metrics?.averageTransactionValue || 0)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Section */}
      {analyticsFlagLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : showAdvancedAnalytics ? (
        <>
          {/* Charts and Analytics */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="methods">Payment Methods</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Revenue Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={metrics?.revenueByPeriod}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip formatter={value => formatCurrency(value as number)} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Transaction Volume */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Transaction Volume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={metrics?.revenueByPeriod}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="transactions"
                          fill="#10b981"
                          name="Transactions"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="refunds"
                          stroke="#ef4444"
                          name="Refunds"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Payment Methods Tab */}
            <TabsContent value="methods" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Method Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5" />
                      Payment Method Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={metrics?.topPaymentMethods}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ method, percentage }) => `${method} ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {metrics?.topPaymentMethods.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHARTCOLORS[index % CHARTCOLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={value => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Method Performance Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics?.paymentMethodPerformance.map(method => (
                        <div key={method.method} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{method.method}</span>
                            <Badge variant="outline">
                              {formatPercentage(method.successRate)} success
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="block">Processing Time</span>
                              <span className="font-medium">{method.averageProcessingTime}s</span>
                            </div>
                            <div>
                              <span className="block">Total Volume</span>
                              <span className="font-medium">
                                {formatCurrency(method.totalVolume)}
                              </span>
                            </div>
                          </div>
                          <Progress value={method.successRate} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Active Subscriptions
                        </p>
                        <p className="text-2xl font-bold">
                          {metrics?.subscriptionMetrics.activeSubscriptions || 0}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">MRR</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(
                            metrics?.subscriptionMetrics.monthlyRecurringRevenue || 0
                          )}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Churn Rate</p>
                        <p className="text-2xl font-bold">
                          {formatPercentage(metrics?.subscriptionMetrics.churnRate || 0)}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Avg Lifetime Value
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(metrics?.subscriptionMetrics.averageLifetimeValue || 0)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Success Rate Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Success Rate Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={metrics?.revenueByPeriod}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis domain={[95, 100]} />
                        <Tooltip formatter={value => `${value}%`} />
                        <Line
                          type="monotone"
                          dataKey={() => 98.5} // Mock success rate
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Success Rate"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Refund Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Refund Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Overall Refund Rate</span>
                        <Badge
                          variant={
                            metrics?.refundRate && metrics.refundRate > 5
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {formatPercentage(metrics?.refundRate || 0)}
                        </Badge>
                      </div>
                      <Progress value={metrics?.refundRate || 0} className="h-2" />

                      <div className="text-sm text-gray-600">
                        <p>Refunds are within acceptable limits if below 5%</p>
                        <p className="mt-2">
                          Current rate:{' '}
                          {metrics?.refundRate && metrics.refundRate > 5
                            ? 'Above threshold'
                            : 'Within limits'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : // Fallback UI is already handled by useConditionalRender
      null}
    </div>
  );
};

export default function PaymentAnalyticsDashboardWithErrorBoundary(props: PaymentAnalyticsProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Could send to error reporting service here
      }}
      errorMessages={{
        title: 'Payment Analytics Unavailable',
        description:
          "We're experiencing technical difficulties loading the payment analytics dashboard. Please try refreshing the page.",
        actionText: 'Reload Analytics',
      }}
    >
      <PaymentAnalyticsDashboard {...props} />
    </ErrorBoundary>
  );
}
