/**
 * HASIVU Platform - Subscription Management UI Component
 * CRITICAL-015: Comprehensive subscription management interface
 *
 * Features:
 * - Subscription plan browsing and comparison
 * - Active subscription management with billing details
 * - Plan upgrade/downgrade with proration preview
 * - Subscription pause/resume functionality
 * - Billing history and upcoming invoices
 * - Usage tracking and limits
 * - Payment method management integration
 * - Trial period handling
 * - Automatic renewal settings
 * - Cancellation flow with retention offers
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Crown,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pause,
  Play,
  X,
  RefreshCw,
  IndianRupee,
  Info,
  Check,
  XCircle,
  History,
  Download,
  Gift,
  Activity,
  Star,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Types
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  planType: string;
  features: PlanFeature[];
  limits: PlanLimits;
  benefits: string[];
  isPopular?: boolean;
  savings?: number;
  trialDays?: number;
  isActive: boolean;
}

interface PlanFeature {
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

interface PlanLimits {
  maxMeals?: number;
  maxStudents?: number;
  maxLocations?: number;
  storageGB?: number;
  apiCallsPerMonth?: number;
}

interface ActiveSubscription {
  id: string;
  planId: string;
  planName: string;
  status: 'trial' | 'active' | 'paused' | 'cancelled' | 'expired' | 'suspended';
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndDate?: string;
  autoRenew: boolean;
  paymentMethodId?: string;
  billingAmount: number;
  currency: string;
  usageStats?: UsageStats;
  pauseHistory?: PauseRecord[];
  upcomingInvoices?: UpcomingInvoice[];
}

interface UsageStats {
  mealsUsed: number;
  mealsLimit: number;
  studentsCount: number;
  studentsLimit: number;
  storageUsedGB: number;
  storageLimit: number;
  apiCallsThisMonth: number;
  apiCallsLimit: number;
}

interface PauseRecord {
  pausedAt: string;
  resumedAt?: string;
  reason: string;
  pauseUntil?: string;
}

interface UpcomingInvoice {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  description: string;
}

interface BillingHistory {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'cancelled';
  billingDate: string;
  paidDate?: string;
  invoiceUrl?: string;
  description: string;
}

interface ProrationPreview {
  currentPlanCredit: number;
  newPlanCharge: number;
  prorationAmount: number;
  nextBillingDate: string;
  effectiveDate: string;
}

interface SubscriptionManagementUIProps {
  schoolId: string;
  userId: string;
  userRole: 'parent' | 'school_admin' | 'student';
  className?: string;
  onSubscriptionUpdate?: (subscription: ActiveSubscription) => void;
}

export const SubscriptionManagementUI: React.FC<SubscriptionManagementUIProps> = ({
  schoolId,
  userId,
  userRole: _userRole,
  className,
  onSubscriptionUpdate,
}) => {
  // State management
  const [loading, setLoading] = useState(true);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [prorationPreview, setProrationPreview] = useState<ProrationPreview | null>(null);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  // Load subscription data
  useEffect(() => {
    loadSubscriptionData();
  }, [schoolId, userId]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [plansResponse, currentResponse, invoicesResponse] = await Promise.all([
        fetch('/api/subscriptions/plans', { credentials: 'include' }),
        fetch('/api/subscriptions/current', { credentials: 'include' }),
        fetch('/api/invoices', { credentials: 'include' }),
      ]);

      const plansPayload = await plansResponse.json().catch(() => null);
      const currentPayload = await currentResponse.json().catch(() => null);
      const invoicesPayload = await invoicesResponse.json().catch(() => null);

      if (!plansResponse.ok) {
        throw new Error(
          plansPayload?.error || 'Subscriptions are not enabled in this environment.'
        );
      }

      setAvailablePlans(normalizePlans(plansPayload?.data));
      setActiveSubscription(
        currentResponse.ok && currentPayload?.success
          ? normalizeSubscription(currentPayload.data)
          : null
      );
      setBillingHistory(invoicesResponse.ok ? normalizeBillingHistory(invoicesPayload?.data) : []);
    } catch (error) {
      setActiveSubscription(null);
      setAvailablePlans([]);
      setBillingHistory([]);
      setError(error instanceof Error ? error.message : 'Unable to load subscription data.');
    } finally {
      setLoading(false);
    }
  };

  const parseStringList = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (typeof value !== 'string' || !value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
      if (parsed && typeof parsed === 'object')
        return Object.values(parsed).filter(Boolean).map(String);
    } catch {
      return [value];
    }
    return [];
  };

  const normalizePlans = (data: unknown): SubscriptionPlan[] => {
    const rows = Array.isArray(data) ? data : [];
    return rows.map((plan: any) => {
      const benefits = parseStringList(plan.benefits);
      const maxMeals = Number(plan.mealsPerMonth || plan.mealsPerWeek || plan.mealsPerDay || 0);
      return {
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        price: Number(plan.price || 0) * 100,
        currency: plan.currency || 'INR',
        billingCycle: plan.billingCycle || 'monthly',
        planType: plan.planType || 'meal_plan',
        features: benefits.map(name => ({ name, description: name, included: true })),
        limits: {
          maxMeals,
          maxStudents: Number(plan.maxStudents || 0),
        },
        benefits,
        trialDays: Number(plan.trialPeriodDays || 0),
        isActive: Boolean(plan.isActive),
      } as SubscriptionPlan;
    });
  };

  const normalizeSubscription = (subscription: any): ActiveSubscription | null => {
    if (!subscription) return null;
    const plan = subscription.subscriptionPlan || {};
    const planMealsLimit = Number(plan.mealsPerMonth || plan.mealsPerWeek || plan.mealsPerDay || 0);
    return {
      id: subscription.id,
      planId: subscription.subscriptionPlanId || subscription.planId,
      planName: plan.name || 'Subscription',
      status: subscription.status || 'active',
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      nextBillingDate: subscription.nextBillingDate,
      currentPeriodStart: subscription.startDate,
      currentPeriodEnd:
        subscription.endDate || subscription.nextBillingDate || subscription.startDate,
      trialEndDate: subscription.trialEndDate,
      autoRenew: ['active', 'trial'].includes(subscription.status),
      paymentMethodId: subscription.paymentMethodId,
      billingAmount: Number(subscription.billingAmount || plan.price || 0) * 100,
      currency: subscription.currency || plan.currency || 'INR',
      usageStats: {
        mealsUsed: Number(subscription.mealsUsed || 0),
        mealsLimit: planMealsLimit,
        studentsCount: Number(subscription.studentsCount || 0),
        studentsLimit: Number(plan.maxStudents || 0),
        storageUsedGB: 0,
        storageLimit: Number(plan.storageGB || 0),
        apiCallsThisMonth: 0,
        apiCallsLimit: Number(plan.apiCallsPerMonth || 0),
      },
      upcomingInvoices: [],
    };
  };

  const normalizeBillingHistory = (data: unknown): BillingHistory[] => {
    const rows = Array.isArray(data) ? data : [];
    return rows.map((invoice: any) => ({
      id: invoice.id,
      subscriptionId: invoice.subscriptionId || invoice.id,
      amount: Number(invoice.totalAmount || invoice.amount || 0) * 100,
      currency: invoice.currency || 'INR',
      status: invoice.status === 'generated' ? 'pending' : invoice.status || 'pending',
      billingDate: invoice.invoiceDate || invoice.createdAt,
      paidDate: invoice.paidDate,
      invoiceUrl: invoice.pdfUrl,
      description: invoice.invoiceNumber || 'Invoice',
    }));
  };

  // Helper functions
  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getBillingCycleLabel = (cycle: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      annual: 'Annually',
    };
    return labels[cycle] || cycle;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      trial: {
        color: 'bg-[var(--hasivu-primary)]/10 text-[var(--hasivu-primary-dark)]',
        icon: <Clock className="w-3 h-3" />,
        label: 'Trial',
      },
      active: {
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-3 h-3" />,
        label: 'Active',
      },
      paused: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Pause className="w-3 h-3" />,
        label: 'Paused',
      },
      cancelled: {
        color: 'bg-gray-100 text-gray-800',
        icon: <XCircle className="w-3 h-3" />,
        label: 'Cancelled',
      },
      expired: {
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="w-3 h-3" />,
        label: 'Expired',
      },
      suspended: {
        color: 'bg-orange-100 text-orange-800',
        icon: <AlertTriangle className="w-3 h-3" />,
        label: 'Suspended',
      },
    };

    const config = configs[status] || configs.active;

    return (
      <Badge className={cn(config.color, 'flex items-center gap-1')}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const calculateUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min(100, (used / limit) * 100);
  };

  const _getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Action handlers
  const handlePlanSelect = async (planId: string) => {
    setSelectedPlan(planId);
    setProcessing(true);

    try {
      const currentPlan = availablePlans.find(p => p.id === activeSubscription?.planId);
      const newPlan = availablePlans.find(p => p.id === planId);

      if (!currentPlan || !newPlan) return;

      const daysInMonth = 30;
      const daysRemaining = activeSubscription?.currentPeriodEnd
        ? Math.max(
            0,
            Math.ceil(
              (new Date(activeSubscription.currentPeriodEnd).getTime() - Date.now()) /
                (24 * 60 * 60 * 1000)
            )
          )
        : 0;
      const currentPlanCredit = (currentPlan.price / daysInMonth) * daysRemaining;
      const newPlanCharge = newPlan.price;
      const prorationAmount = newPlanCharge - currentPlanCredit;

      setProrationPreview({
        currentPlanCredit,
        newPlanCharge,
        prorationAmount,
        nextBillingDate: activeSubscription?.nextBillingDate || new Date().toISOString(),
        effectiveDate: new Date().toISOString(),
      });

      setShowUpgradeDialog(true);
    } catch (error) {
    } finally {
      setProcessing(false);
    }
  };

  const handleSubscriptionChange = async () => {
    if (!selectedPlan) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, userId, planId: selectedPlan }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Subscription changes are not enabled yet.');
      }

      const updatedSubscription = normalizeSubscription(payload.data);
      if (updatedSubscription) {
        setActiveSubscription(updatedSubscription);
        onSubscriptionUpdate?.(updatedSubscription);
      }

      setShowUpgradeDialog(false);
      setSelectedPlan(null);
      setProrationPreview(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to change subscription.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePauseSubscription = async (reason: string, pauseUntil?: string) => {
    setProcessing(true);
    try {
      setError(
        'Pause is not enabled until the recurring billing gateway supports mandate-safe pauses.'
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to pause subscription.');
    } finally {
      setProcessing(false);
    }
  };

  const handleResumeSubscription = async () => {
    setProcessing(true);
    try {
      setError(
        'Resume is not enabled until the recurring billing gateway supports mandate-safe resumes.'
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to resume subscription.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async (immediate: boolean) => {
    setProcessing(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Subscription cancellation is not enabled yet.');
      }

      setShowCancelDialog(false);
      await loadSubscriptionData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to cancel subscription.');
    } finally {
      setProcessing(false);
    }
  };

  const toggleAutoRenew = async () => {
    if (!activeSubscription) return;

    setProcessing(true);
    try {
      setError('Auto-renewal changes are disabled until recurring billing is fully enabled.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to update auto-renewal.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Subscription Management</h2>
            <p className="text-muted-foreground mt-1">
              Manage your subscription plan and billing settings
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Subscription service unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Active Subscription Overview */}
        {activeSubscription && (
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    {activeSubscription.planName}
                  </CardTitle>
                  <CardDescription>
                    Active since {formatDate(activeSubscription.startDate)}
                  </CardDescription>
                </div>
                {getStatusBadge(activeSubscription.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Billing Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(activeSubscription.billingAmount, activeSubscription.currency)}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Next Billing Date</p>
                  <p className="text-lg font-semibold">
                    {activeSubscription.nextBillingDate
                      ? formatDate(activeSubscription.nextBillingDate)
                      : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Auto Renewal</p>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={activeSubscription.autoRenew}
                      onCheckedChange={toggleAutoRenew}
                      disabled={processing || activeSubscription.status === 'cancelled'}
                    />
                    <span className="text-sm">
                      {activeSubscription.autoRenew ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Usage Statistics */}
              {activeSubscription.usageStats && (
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Usage This Period
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Meals */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Meals</span>
                        <span className="font-medium">
                          {activeSubscription.usageStats.mealsUsed.toLocaleString()} /{' '}
                          {activeSubscription.usageStats.mealsLimit === -1
                            ? 'Unlimited'
                            : activeSubscription.usageStats.mealsLimit.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={calculateUsagePercentage(
                          activeSubscription.usageStats.mealsUsed,
                          activeSubscription.usageStats.mealsLimit
                        )}
                        className="h-2"
                      />
                    </div>

                    {/* Students */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Students</span>
                        <span className="font-medium">
                          {activeSubscription.usageStats.studentsCount} /{' '}
                          {activeSubscription.usageStats.studentsLimit === -1
                            ? 'Unlimited'
                            : activeSubscription.usageStats.studentsLimit}
                        </span>
                      </div>
                      <Progress
                        value={calculateUsagePercentage(
                          activeSubscription.usageStats.studentsCount,
                          activeSubscription.usageStats.studentsLimit
                        )}
                        className="h-2"
                      />
                    </div>

                    {/* Storage */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Storage</span>
                        <span className="font-medium">
                          {activeSubscription.usageStats.storageUsedGB.toFixed(1)} GB /{' '}
                          {activeSubscription.usageStats.storageLimit} GB
                        </span>
                      </div>
                      <Progress
                        value={calculateUsagePercentage(
                          activeSubscription.usageStats.storageUsedGB,
                          activeSubscription.usageStats.storageLimit
                        )}
                        className="h-2"
                      />
                    </div>

                    {/* API Calls */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">API Calls</span>
                        <span className="font-medium">
                          {activeSubscription.usageStats.apiCallsThisMonth.toLocaleString()} /{' '}
                          {activeSubscription.usageStats.apiCallsLimit.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={calculateUsagePercentage(
                          activeSubscription.usageStats.apiCallsThisMonth,
                          activeSubscription.usageStats.apiCallsLimit
                        )}
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Subscription Actions */}
              <div className="flex flex-wrap gap-3">
                {activeSubscription.status === 'active' && (
                  <>
                    <Button
                      onClick={() => setActiveTab('plans')}
                      variant="default"
                      className="gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Upgrade Plan
                    </Button>
                    <Button
                      onClick={() => setShowPauseDialog(true)}
                      variant="outline"
                      className="gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Pause Subscription
                    </Button>
                  </>
                )}
                {activeSubscription.status === 'paused' && (
                  <Button
                    onClick={handleResumeSubscription}
                    disabled={processing}
                    variant="default"
                    className="gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Resume Subscription
                  </Button>
                )}
                {activeSubscription.status !== 'cancelled' && (
                  <Button
                    onClick={() => setShowCancelDialog(true)}
                    variant="destructive"
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plans">Available Plans</TabsTrigger>
            <TabsTrigger value="billing">Billing History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Upcoming Invoices */}
            {activeSubscription?.upcomingInvoices &&
              activeSubscription.upcomingInvoices.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Upcoming Invoices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activeSubscription.upcomingInvoices.map(invoice => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{invoice.description}</p>
                            <p className="text-sm text-muted-foreground">
                              Due {formatDate(invoice.dueDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{formatCurrency(invoice.amount)}</p>
                            <Badge variant="secondary" className="text-xs">
                              {invoice.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeSubscription?.paymentMethodId ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Card ending in ••••1234</p>
                        <p className="text-sm text-muted-foreground">Expires 12/25</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Change
                    </Button>
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertTitle>No payment method</AlertTitle>
                    <AlertDescription>
                      Please add a payment method to continue your subscription.
                      <Button variant="link" className="pl-0">
                        Add Payment Method
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Available Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            {availablePlans.length === 0 ? (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertTitle>No subscription plans available</AlertTitle>
                <AlertDescription>
                  Plan catalog data is not available for this school or subscriptions are disabled.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availablePlans.map(plan => {
                  const isCurrentPlan = plan.id === activeSubscription?.planId;
                  const isUpgrade = plan.price > (activeSubscription?.billingAmount || 0);

                  return (
                    <Card
                      key={plan.id}
                      className={cn(
                        'relative transition-all',
                        isCurrentPlan && 'border-2 border-primary',
                        plan.isPopular &&
                          !isCurrentPlan &&
                          'border-2 border-[var(--hasivu-primary)]'
                      )}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-[var(--hasivu-primary)] text-white gap-1">
                            <Star className="w-3 h-3" />
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      {isCurrentPlan && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-primary gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Current Plan
                          </Badge>
                        </div>
                      )}

                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {plan.name}
                          {plan.savings && (
                            <Badge variant="secondary" className="gap-1">
                              <Sparkles className="w-3 h-3" />
                              Save {plan.savings}%
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">
                              {formatCurrency(plan.price, plan.currency)}
                            </span>
                            <span className="text-muted-foreground">
                              /{getBillingCycleLabel(plan.billingCycle).toLowerCase()}
                            </span>
                          </div>
                          {plan.trialDays && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {plan.trialDays}-day free trial available
                            </p>
                          )}
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <p className="font-semibold text-sm">Key Features:</p>
                          <ul className="space-y-2">
                            {plan.features.slice(0, 4).map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                {feature.included ? (
                                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                                )}
                                <span className={cn(!feature.included && 'text-muted-foreground')}>
                                  {feature.name}
                                  {feature.limit && ` (${feature.limit})`}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>

                      <CardFooter>
                        {isCurrentPlan ? (
                          <Button variant="outline" className="w-full" disabled>
                            Current Plan
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handlePlanSelect(plan.id)}
                            disabled={processing}
                            className="w-full gap-2"
                            variant={isUpgrade ? 'default' : 'outline'}
                          >
                            {isUpgrade ? (
                              <>
                                <TrendingUp className="w-4 h-4" />
                                Upgrade to {plan.name}
                              </>
                            ) : (
                              <>Change to {plan.name}</>
                            )}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Billing History Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Billing History
                </CardTitle>
                <CardDescription>View and download past invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billingHistory.map(bill => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <IndianRupee className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{bill.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(bill.billingDate)}
                            {bill.paidDate && ` • Paid ${formatDate(bill.paidDate)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(bill.amount, bill.currency)}
                          </p>
                          <Badge
                            variant={
                              bill.status === 'paid'
                                ? 'default'
                                : bill.status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className="text-xs"
                          >
                            {bill.status}
                          </Badge>
                        </div>
                        {bill.invoiceUrl && bill.status === 'paid' && (
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Invoice
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upgrade/Downgrade Dialog */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Change Subscription Plan</DialogTitle>
              <DialogDescription>Review the changes and proration details</DialogDescription>
            </DialogHeader>

            {selectedPlan && prorationPreview && (
              <div className="space-y-4">
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertTitle>Proration Details</AlertTitle>
                  <AlertDescription className="space-y-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span>Credit from current plan:</span>
                      <span className="font-medium">
                        {formatCurrency(prorationPreview.currentPlanCredit)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>New plan charge:</span>
                      <span className="font-medium">
                        {formatCurrency(prorationPreview.newPlanCharge)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Amount to pay today:</span>
                      <span
                        className={cn(
                          prorationPreview.prorationAmount > 0
                            ? 'text-green-600'
                            : 'text-orange-600'
                        )}
                      >
                        {formatCurrency(Math.abs(prorationPreview.prorationAmount))}
                        {prorationPreview.prorationAmount < 0 && ' (credit)'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Changes will take effect immediately. Your next billing date will be{' '}
                      {formatDate(prorationPreview.nextBillingDate)}.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="font-semibold text-sm">New Plan Details:</p>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan:</span>
                      <span className="font-medium">
                        {availablePlans.find(p => p.id === selectedPlan)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Billing:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          availablePlans.find(p => p.id === selectedPlan)?.price || 0
                        )}
                        /
                        {getBillingCycleLabel(
                          availablePlans.find(p => p.id === selectedPlan)?.billingCycle || 'monthly'
                        ).toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpgradeDialog(false);
                  setSelectedPlan(null);
                  setProrationPreview(null);
                }}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button onClick={handleSubscriptionChange} disabled={processing} className="gap-2">
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm Change
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pause Subscription Dialog */}
        <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pause Subscription</DialogTitle>
              <DialogDescription>Temporarily pause your subscription billing</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  While paused, you will not be charged and your subscription features will be
                  disabled. You can resume at any time.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="pause-reason">Reason for pausing (optional)</Label>
                <Input id="pause-reason" placeholder="e.g., School vacation, temporary closure" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pause-until">Resume date (optional)</Label>
                <Input id="pause-until" type="date" min={new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPauseDialog(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const reason =
                    (document.getElementById('pause-reason') as HTMLInputElement)?.value ||
                    'User requested';
                  const pauseUntil = (document.getElementById('pause-until') as HTMLInputElement)
                    ?.value;
                  handlePauseSubscription(reason, pauseUntil || undefined);
                }}
                disabled={processing}
                variant="secondary"
                className="gap-2"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause Subscription
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Subscription Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel Subscription</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel your subscription?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Cancelling your subscription will result in loss of access to premium features.
                </AlertDescription>
              </Alert>

              {/* Retention Offers */}
              <Card className="border-[var(--hasivu-primary)]/20 bg-[var(--hasivu-primary)]/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Before you go...
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Would you consider pausing instead? You can resume anytime without losing your
                    data.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCancelDialog(false);
                      setShowPauseDialog(true);
                    }}
                    className="w-full gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Pause Instead
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <p className="font-medium text-sm">When do you want to cancel?</p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleCancelSubscription(false)}
                    disabled={processing}
                  >
                    <div className="text-left">
                      <p className="font-medium">At end of billing period</p>
                      <p className="text-xs text-muted-foreground">
                        Access until{' '}
                        {activeSubscription?.currentPeriodEnd &&
                          formatDate(activeSubscription.currentPeriodEnd)}
                      </p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleCancelSubscription(true)}
                    disabled={processing}
                  >
                    <div className="text-left">
                      <p className="font-medium">Immediately</p>
                      <p className="text-xs text-muted-foreground">Cancel right now (no refund)</p>
                    </div>
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                disabled={processing}
              >
                Keep Subscription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default SubscriptionManagementUI;
