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
  DialogTrigger as _DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea as _ScrollArea } from '@/components/ui/scroll-area';
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
import { PaymentService } from '@/services/payment.service';
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

// Mock data for demonstration
const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic_monthly',
    name: 'Basic Plan',
    description: 'Perfect for small schools getting started',
    price: 99900, // ₹999.00
    currency: 'INR',
    billingCycle: 'monthly',
    planType: 'meal_plan',
    features: [
      { name: 'Meal Planning', description: 'Basic meal planning features', included: true },
      { name: 'Student Management', description: 'Up to 50 students', included: true, limit: 50 },
      { name: 'Menu Customization', description: 'Limited menu options', included: true },
      { name: 'Email Support', description: 'Email support during business hours', included: true },
      { name: 'Analytics', description: 'Basic reports and analytics', included: false },
      { name: 'RFID Integration', description: 'RFID meal tracking', included: false },
    ],
    limits: {
      maxMeals: 1000,
      maxStudents: 50,
      maxLocations: 1,
      storageGB: 5,
      apiCallsPerMonth: 10000,
    },
    benefits: ['Up to 50 students', 'Basic meal planning', 'Email support', 'Monthly billing'],
    trialDays: 14,
    isActive: true,
  },
  {
    id: 'standard_monthly',
    name: 'Standard Plan',
    description: 'Most popular for growing schools',
    price: 249900, // ₹2,499.00
    currency: 'INR',
    billingCycle: 'monthly',
    planType: 'meal_plan',
    features: [
      { name: 'Meal Planning', description: 'Advanced meal planning', included: true },
      { name: 'Student Management', description: 'Up to 200 students', included: true, limit: 200 },
      { name: 'Menu Customization', description: 'Full menu customization', included: true },
      { name: 'Priority Support', description: '24/7 email and chat support', included: true },
      { name: 'Analytics', description: 'Advanced reports and analytics', included: true },
      { name: 'RFID Integration', description: 'RFID meal tracking', included: true },
    ],
    limits: {
      maxMeals: 5000,
      maxStudents: 200,
      maxLocations: 3,
      storageGB: 25,
      apiCallsPerMonth: 50000,
    },
    benefits: [
      'Up to 200 students',
      'Advanced analytics',
      'RFID integration',
      'Priority support',
      '3 locations',
    ],
    isPopular: true,
    trialDays: 14,
    isActive: true,
  },
  {
    id: 'premium_monthly',
    name: 'Premium Plan',
    description: 'Complete solution for large institutions',
    price: 499900, // ₹4,999.00
    currency: 'INR',
    billingCycle: 'monthly',
    planType: 'meal_plan',
    features: [
      { name: 'Meal Planning', description: 'Enterprise meal planning', included: true },
      { name: 'Student Management', description: 'Unlimited students', included: true },
      { name: 'Menu Customization', description: 'Full customization + templates', included: true },
      { name: 'Dedicated Support', description: '24/7 phone and priority support', included: true },
      { name: 'Analytics', description: 'Advanced analytics + AI insights', included: true },
      { name: 'RFID Integration', description: 'RFID + biometric tracking', included: true },
    ],
    limits: {
      maxMeals: -1, // unlimited
      maxStudents: -1,
      maxLocations: 10,
      storageGB: 100,
      apiCallsPerMonth: 200000,
    },
    benefits: [
      'Unlimited students',
      'AI-powered insights',
      'Dedicated support',
      'Custom integrations',
      '10 locations',
      'White-label options',
    ],
    trialDays: 30,
    isActive: true,
  },
  {
    id: 'standard_annual',
    name: 'Standard Annual',
    description: 'Save 20% with annual billing',
    price: 2399000, // ₹23,990.00 (saves ₹5,998)
    currency: 'INR',
    billingCycle: 'annual',
    planType: 'meal_plan',
    features: [
      { name: 'Meal Planning', description: 'Advanced meal planning', included: true },
      { name: 'Student Management', description: 'Up to 200 students', included: true, limit: 200 },
      { name: 'Menu Customization', description: 'Full menu customization', included: true },
      { name: 'Priority Support', description: '24/7 email and chat support', included: true },
      { name: 'Analytics', description: 'Advanced reports and analytics', included: true },
      { name: 'RFID Integration', description: 'RFID meal tracking', included: true },
    ],
    limits: {
      maxMeals: 5000,
      maxStudents: 200,
      maxLocations: 3,
      storageGB: 25,
      apiCallsPerMonth: 50000,
    },
    benefits: [
      'Save 20% annually',
      'All Standard features',
      'Priority support',
      'RFID integration',
    ],
    savings: 20,
    trialDays: 14,
    isActive: true,
  },
];

const MOCK_ACTIVE_SUBSCRIPTION: ActiveSubscription = {
  id: 'sub_standard_123',
  planId: 'standard_monthly',
  planName: 'Standard Plan',
  status: 'active',
  startDate: '2024-01-01T00:00:00Z',
  currentPeriodStart: '2024-01-01T00:00:00Z',
  currentPeriodEnd: '2024-02-01T00:00:00Z',
  nextBillingDate: '2024-02-01T00:00:00Z',
  autoRenew: true,
  billingAmount: 249900,
  currency: 'INR',
  paymentMethodId: 'pm_card_123',
  usageStats: {
    mealsUsed: 3245,
    mealsLimit: 5000,
    studentsCount: 145,
    studentsLimit: 200,
    storageUsedGB: 12.5,
    storageLimit: 25,
    apiCallsThisMonth: 28500,
    apiCallsLimit: 50000,
  },
  upcomingInvoices: [
    {
      id: 'inv_001',
      amount: 249900,
      dueDate: '2024-02-01T00:00:00Z',
      status: 'upcoming',
      description: 'Standard Plan - Monthly Subscription',
    },
  ],
};

const MOCK_BILLING_HISTORY: BillingHistory[] = [
  {
    id: 'bill_001',
    subscriptionId: 'sub_standard_123',
    amount: 249900,
    currency: 'INR',
    status: 'paid',
    billingDate: '2024-01-01T00:00:00Z',
    paidDate: '2024-01-01T10:30:00Z',
    invoiceUrl: '/invoices/INV-2024-001.pdf',
    description: 'Standard Plan - January 2024',
  },
  {
    id: 'bill_002',
    subscriptionId: 'sub_standard_123',
    amount: 249900,
    currency: 'INR',
    status: 'paid',
    billingDate: '2023-12-01T00:00:00Z',
    paidDate: '2023-12-01T09:15:00Z',
    invoiceUrl: '/invoices/INV-2023-012.pdf',
    description: 'Standard Plan - December 2023',
  },
  {
    id: 'bill_003',
    subscriptionId: 'sub_standard_123',
    amount: 99900,
    currency: 'INR',
    status: 'paid',
    billingDate: '2023-11-01T00:00:00Z',
    paidDate: '2023-11-01T14:20:00Z',
    invoiceUrl: '/invoices/INV-2023-011.pdf',
    description: 'Basic Plan - November 2023',
  },
];

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

  const _paymentService = PaymentService.getInstance();

  // Load subscription data
  useEffect(() => {
    loadSubscriptionData();
  }, [schoolId, userId]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      // In a real implementation, fetch from API
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));

      setActiveSubscription(MOCK_ACTIVE_SUBSCRIPTION);
      setAvailablePlans(MOCK_PLANS);
      setBillingHistory(MOCK_BILLING_HISTORY);
    } catch (error) {
    } finally {
      setLoading(false);
    }
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
        color: 'bg-blue-100 text-blue-800',
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
      // Calculate proration preview
      const currentPlan = availablePlans.find(p => p.id === activeSubscription?.planId);
      const newPlan = availablePlans.find(p => p.id === planId);

      if (!currentPlan || !newPlan) return;

      // Mock proration calculation
      const daysInMonth = 30;
      const daysRemaining = 15; // Mock value
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
      // In a real implementation, call API to change subscription
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update local state
      const newPlan = availablePlans.find(p => p.id === selectedPlan);
      if (newPlan && activeSubscription) {
        const updatedSubscription: ActiveSubscription = {
          ...activeSubscription,
          planId: selectedPlan,
          planName: newPlan.name,
          billingAmount: newPlan.price,
        };
        setActiveSubscription(updatedSubscription);
        onSubscriptionUpdate?.(updatedSubscription);
      }

      setShowUpgradeDialog(false);
      setSelectedPlan(null);
      setProrationPreview(null);
    } catch (error) {
    } finally {
      setProcessing(false);
    }
  };

  const handlePauseSubscription = async (reason: string, pauseUntil?: string) => {
    setProcessing(true);
    try {
      // In a real implementation, call API to pause subscription
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (activeSubscription) {
        const updatedSubscription: ActiveSubscription = {
          ...activeSubscription,
          status: 'paused',
          pauseHistory: [
            ...(activeSubscription.pauseHistory || []),
            {
              pausedAt: new Date().toISOString(),
              reason,
              pauseUntil,
            },
          ],
        };
        setActiveSubscription(updatedSubscription);
        onSubscriptionUpdate?.(updatedSubscription);
      }

      setShowPauseDialog(false);
    } catch (error) {
    } finally {
      setProcessing(false);
    }
  };

  const handleResumeSubscription = async () => {
    setProcessing(true);
    try {
      // In a real implementation, call API to resume subscription
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (activeSubscription) {
        const updatedSubscription: ActiveSubscription = {
          ...activeSubscription,
          status: 'active',
        };
        setActiveSubscription(updatedSubscription);
        onSubscriptionUpdate?.(updatedSubscription);
      }
    } catch (error) {
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async (immediate: boolean) => {
    setProcessing(true);
    try {
      // In a real implementation, call API to cancel subscription
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (activeSubscription) {
        const updatedSubscription: ActiveSubscription = {
          ...activeSubscription,
          status: 'cancelled',
          autoRenew: false,
          endDate: immediate ? new Date().toISOString() : activeSubscription.currentPeriodEnd,
        };
        setActiveSubscription(updatedSubscription);
        onSubscriptionUpdate?.(updatedSubscription);
      }

      setShowCancelDialog(false);
    } catch (error) {
    } finally {
      setProcessing(false);
    }
  };

  const toggleAutoRenew = async () => {
    if (!activeSubscription) return;

    setProcessing(true);
    try {
      // In a real implementation, call API to toggle auto-renewal
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedSubscription: ActiveSubscription = {
        ...activeSubscription,
        autoRenew: !activeSubscription.autoRenew,
      };
      setActiveSubscription(updatedSubscription);
      onSubscriptionUpdate?.(updatedSubscription);
    } catch (error) {
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
                      plan.isPopular && !isCurrentPlan && 'border-2 border-blue-500'
                    )}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-blue-500 text-white gap-1">
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
              <Card className="border-blue-200 bg-blue-50">
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
