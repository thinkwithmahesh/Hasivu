/**
 * HASIVU Platform - Subscription Manager Component
 * Epic 5: Payment Processing & Billing System - Story 5.2
 *
 * Comprehensive subscription management interface for school meal plans
 * with automated billing, plan upgrades, and payment method management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs as _Tabs,
  TabsContent as _TabsContent,
  TabsList as _TabsList,
  TabsTrigger as _TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select as _Select,
  SelectContent as _SelectContent,
  SelectItem as _SelectItem,
  SelectTrigger as _SelectTrigger,
  SelectValue as _SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert as _Alert, AlertDescription as _AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Crown,
  Calendar,
  CreditCard,
  TrendingUp,
  CheckCircle,
  DollarSign,
  Edit,
  Pause,
  Play,
  X,
  RefreshCw,
} from 'lucide-react';
import { PaymentService } from '@/services/payment.service';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useConditionalRender } from '@/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/types/feature-flags';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  features: string[];
  maxMeals: number;
  popular?: boolean;
  savings?: number;
}

interface ActiveSubscription {
  id: string;
  planId: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  autoRenew: boolean;
  paymentMethodId: string;
  mealsUsed: number;
  mealsRemaining: number;
  totalSpent: number;
}

interface SubscriptionManagerProps {
  schoolId: string;
  parentId: string;
  className?: string;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    description: 'Perfect for occasional meal orders',
    price: 500,
    billingCycle: 'monthly',
    maxMeals: 20,
    features: [
      'Up to 20 meals per month',
      'Basic menu access',
      'Email notifications',
      'Standard delivery',
    ],
  },
  {
    id: 'standard',
    name: 'Standard Plan',
    description: 'Great for regular meal planning',
    price: 1200,
    billingCycle: 'monthly',
    maxMeals: 60,
    popular: true,
    features: [
      'Up to 60 meals per month',
      'Full menu access',
      'Priority notifications',
      'Express delivery',
      'Meal customization',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    description: 'Complete meal management solution',
    price: 2500,
    billingCycle: 'monthly',
    maxMeals: 150,
    features: [
      'Unlimited meals',
      'Premium menu access',
      'Real-time notifications',
      'Dedicated support',
      'Advanced analytics',
      'Bulk discounts',
    ],
  },
  {
    id: 'annual_basic',
    name: 'Annual Basic',
    description: 'Year-round meal planning with savings',
    price: 5000,
    billingCycle: 'annual',
    maxMeals: 240,
    savings: 17,
    features: [
      'Up to 240 meals per year',
      'Basic menu access',
      'Email notifications',
      'Standard delivery',
      '17% annual savings',
    ],
  },
];

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  schoolId,
  parentId,
  className,
}) => {
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [availablePlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [_showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const paymentService = PaymentService.getInstance();

  // Feature flag for new payment methods
  const { shouldRender: showNewPaymentMethods, isLoading: paymentFlagLoading } =
    useConditionalRender(FEATURE_FLAGS.NEW_PAYMENT_METHODS, {
      fallback: null, // No fallback needed, just hide new payment options
    });

  // Load current subscription
  useEffect(() => {
    loadSubscription();
  }, [parentId]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from the API
      // For now, we'll simulate with mock data
      setTimeout(() => {
        setActiveSubscription({
          id: 'sub_123',
          planId: 'standard',
          status: 'active',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          nextBillingDate: '2024-02-01',
          autoRenew: true,
          paymentMethodId: 'pm_123',
          mealsUsed: 45,
          mealsRemaining: 15,
          totalSpent: 1200,
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentPlan = () => {
    return availablePlans.find(plan => plan.id === activeSubscription?.planId);
  };

  const getUsagePercentage = () => {
    if (!activeSubscription) return 0;
    const currentPlan = getCurrentPlan();
    if (!currentPlan) return 0;
    return (activeSubscription.mealsUsed / currentPlan.maxMeals) * 100;
  };

  const handleUpgrade = async (planId: string) => {
    if (!activeSubscription) return;

    setUpgrading(true);
    try {
      const plan = availablePlans.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      const result = await paymentService.createSubscription({
        schoolId,
        parentId,
        planId,
        billingCycle: plan.billingCycle,
        startDate: new Date().toISOString().split('T')[0],
        autoRenew: true,
      });

      if (result.success) {
        // Update subscription
        setActiveSubscription(prev =>
          prev
            ? {
                ...prev,
                planId,
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0],
              }
            : null
        );
        setShowUpgradeDialog(false);
      } else {
        throw new Error(result.error || 'Upgrade failed');
      }
    } catch (error) {
      // Handle error
    } finally {
      setUpgrading(false);
    }
  };

  const handlePauseResume = async () => {
    if (!activeSubscription) return;

    try {
      // In a real implementation, this would call the API
      setActiveSubscription(prev =>
        prev
          ? {
              ...prev,
              status: prev.status === 'active' ? 'paused' : 'active',
            }
          : null
      );
    } catch (error) {
      // Error handled silently
    }
  };

  const handleCancel = async () => {
    if (!activeSubscription) return;

    try {
      // In a real implementation, this would call the API
      setActiveSubscription(prev =>
        prev
          ? {
              ...prev,
              status: 'cancelled',
            }
          : null
      );
    } catch (error) {
      // Error handled silently
    }
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = getCurrentPlan();
  const usagePercentage = getUsagePercentage();

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Current Subscription Status */}
      {activeSubscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Current Subscription
                </CardTitle>
                <CardDescription>
                  {currentPlan?.name} - {activeSubscription.status}
                </CardDescription>
              </div>
              <Badge
                variant={activeSubscription.status === 'active' ? 'default' : 'secondary'}
                className={cn(
                  activeSubscription.status === 'active' && 'bg-green-100 text-green-800',
                  activeSubscription.status === 'paused' && 'bg-yellow-100 text-yellow-800'
                )}
              >
                {activeSubscription.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Usage Overview */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Meals Used</span>
                <span>
                  {activeSubscription.mealsUsed} / {currentPlan?.maxMeals}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              <p className="text-xs text-gray-600">
                {activeSubscription.mealsRemaining} meals remaining this month
              </p>
            </div>

            {/* Subscription Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-gray-600">Monthly Cost</p>
                <p className="text-lg font-bold">{formatCurrency(currentPlan?.price || 0)}</p>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-600">Next Billing</p>
                <p className="text-lg font-bold">
                  {new Date(activeSubscription.nextBillingDate).toLocaleDateString()}
                </p>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-lg font-bold">{formatCurrency(activeSubscription.totalSpent)}</p>
              </div>
            </div>

            {/* Auto-renewal Setting */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="auto-renew" className="font-medium">
                  Auto-renewal
                </Label>
                <p className="text-sm text-gray-600">
                  Automatically renew subscription each billing cycle
                </p>
              </div>
              <Switch
                id="auto-renew"
                checked={activeSubscription.autoRenew}
                onCheckedChange={checked => {
                  setActiveSubscription(prev =>
                    prev
                      ? {
                          ...prev,
                          autoRenew: checked === true,
                        }
                      : null
                  );
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePauseResume} className="flex-1">
                {activeSubscription.status === 'active' ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Upgrade
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Upgrade Your Plan</DialogTitle>
                    <DialogDescription>
                      Choose a new plan that better fits your needs
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availablePlans.map(plan => (
                      <Card
                        key={plan.id}
                        className={cn(
                          'cursor-pointer transition-all',
                          selectedPlan === plan.id && 'ring-2 ring-blue-500',
                          plan.popular && 'border-yellow-200 bg-yellow-50'
                        )}
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            {plan.popular && <Badge className="bg-yellow-500">Popular</Badge>}
                          </div>
                          <div className="text-2xl font-bold">
                            {formatCurrency(plan.price)}
                            <span className="text-sm font-normal text-gray-600">
                              /{plan.billingCycle}
                            </span>
                          </div>
                          {plan.savings && (
                            <Badge variant="secondary" className="w-fit">
                              Save {plan.savings}%
                            </Badge>
                          )}
                        </CardHeader>

                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                          <ul className="space-y-2">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleUpgrade(selectedPlan)}
                      disabled={!selectedPlan || upgrading}
                    >
                      {upgrading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Upgrading...
                        </>
                      ) : (
                        'Upgrade Plan'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="destructive" onClick={handleCancel} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Payment Methods Section */}
      {paymentFlagLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        showNewPaymentMethods && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                New Payment Methods Available
              </CardTitle>
              <CardDescription>
                Try our latest payment options including UPI, digital wallets, and instant transfers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-2xl mb-2">📱</div>
                  <h4 className="font-medium">UPI Payments</h4>
                  <p className="text-sm text-gray-600">Instant payments with any UPI app</p>
                </div>
                <div className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-2xl mb-2">💳</div>
                  <h4 className="font-medium">Digital Wallets</h4>
                  <p className="text-sm text-gray-600">Pay with Paytm, Google Pay, PhonePe</p>
                </div>
                <div className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-2xl mb-2">⚡</div>
                  <h4 className="font-medium">Instant Transfer</h4>
                  <p className="text-sm text-gray-600">
                    Direct bank transfers with instant confirmation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Choose the perfect plan for your family's meal needs</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availablePlans.map(plan => (
              <Card
                key={plan.id}
                className={cn('relative', plan.popular && 'border-yellow-200 shadow-lg')}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-yellow-500 text-white px-3 py-1">Most Popular</Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(plan.price)}
                    <div className="text-sm font-normal text-gray-600">per {plan.billingCycle}</div>
                  </div>
                  {plan.savings && <Badge variant="secondary">Save {plan.savings}%</Badge>}
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-gray-600 text-center mb-4">{plan.description}</p>

                  <ul className="space-y-2 mb-6">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-sm text-gray-600">
                        +{plan.features.length - 3} more features
                      </li>
                    )}
                  </ul>

                  <Button
                    className="w-full"
                    variant={activeSubscription?.planId === plan.id ? 'secondary' : 'default'}
                    disabled={activeSubscription?.planId === plan.id}
                  >
                    {activeSubscription?.planId === plan.id
                      ? 'Current Plan'
                      : 'Select as _Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>View your past payments and invoices</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Billing history will appear here</p>
            <p className="text-sm text-gray-500 mt-2">
              Your invoices and payment records will be displayed once you have an active
              subscription
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function SubscriptionManagerWithErrorBoundary(props: SubscriptionManagerProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Could send to error reporting service here
      }}
      errorMessages={{
        title: 'Subscription Manager Unavailable',
        description:
          "We're experiencing technical difficulties loading the subscription management interface. Please try refreshing the page.",
        actionText: 'Reload Subscription Manager',
      }}
    >
      <SubscriptionManager {...props} />
    </ErrorBoundary>
  );
}
