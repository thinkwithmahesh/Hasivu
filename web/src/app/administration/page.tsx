'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/auth';
import { useAuth } from '@/contexts/auth-context';
import {
  DashboardMetrics,
  Alert,
  AlertSeverity,
  AlertType,
  AdminLevel,
  SchoolOverview,
} from '@/types/administration';
import {
  Building2,
  Users,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Clock,
  MapPin,
  Settings,
  BarChart3,
  Bell,
  Activity,
  Target,
} from 'lucide-react';

// Mock data - In production, this would come from APIs
const mockDashboardMetrics: DashboardMetrics = {
  schools: {
    total: 1247,
    active: 1205,
    inactive: 42,
    newThisMonth: 28,
    byTier: {
      BASIC: 523,
      STANDARD: 456,
      PREMIUM: 189,
      ENTERPRISE: 37,
    },
    byState: {
      Karnataka: 287,
      'Tamil Nadu': 234,
      'Andhra Pradesh': 198,
      Kerala: 156,
      Others: 372,
    },
    performanceDistribution: {
      excellent: 312,
      good: 578,
      average: 289,
      poor: 68,
    },
  },
  operations: {
    todayOrders: 24567,
    activeKitchens: 1189,
    studentsServed: 156789,
    mealsDelivered: 23890,
    averageDeliveryTime: 18.5,
    qualityScore: 94.2,
    incidentsReported: 3,
    emergencyAlerts: 0,
  },
  financial: {
    totalRevenue: 2458967,
    totalCosts: 1967523,
    profitMargin: 19.97,
    outstandingPayments: 125678,
    budgetUtilization: 87.3,
    costPerMeal: 82.5,
    revenueGrowth: 12.8,
    paymentSuccessRate: 97.8,
  },
  compliance: {
    overallScore: 96.2,
    safetyCompliance: 98.1,
    nutritionalCompliance: 95.7,
    regulatoryCompliance: 94.8,
    auditsPending: 12,
    violationsReported: 2,
    correctiveActions: 8,
    certificationStatus: 99.2,
  },
  performance: {
    averageRating: 4.6,
    customerSatisfaction: 92.4,
    operationalEfficiency: 89.7,
    staffProductivity: 87.3,
    resourceUtilization: 91.2,
    innovationIndex: 78.9,
    sustainabilityScore: 85.6,
    technologyAdoption: 94.1,
  },
  alerts: [
    {
      id: '1',
      type: AlertType.KITCHEN_DOWN,
      severity: AlertSeverity.HIGH,
      title: 'Kitchen Offline',
      message: 'Kitchen at Bangalore Public School has been offline for 45 minutes',
      source: { type: 'kitchen', id: 'k-001', name: 'BPS Kitchen Unit 1' },
      status: 'open',
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
      updatedAt: new Date(Date.now() - 45 * 60 * 1000),
    },
    {
      id: '2',
      type: AlertType.BUDGET_EXCEEDED,
      severity: AlertSeverity.MEDIUM,
      title: 'Budget Alert',
      message: 'Monthly budget exceeded by 5% in Chennai District',
      source: { type: 'school', id: 's-002', name: 'Chennai District' },
      status: 'in_progress',
      assignedTo: 'district-officer-chennai',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: '3',
      type: AlertType.QUALITY_ISSUE,
      severity: AlertSeverity.LOW,
      title: 'Quality Score Drop',
      message: 'Quality score decreased to 88% at Mysore Zone schools',
      source: { type: 'school', id: 's-003', name: 'Mysore Zone' },
      status: 'open',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  ],
  timestamp: new Date(),
};

const getSeverityColor = (severity: AlertSeverity): string => {
  switch (severity) {
    case AlertSeverity.CRITICAL:
      return 'bg-red-100 text-red-800 border-red-200';
    case AlertSeverity.HIGH:
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case AlertSeverity.MEDIUM:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case AlertSeverity.LOW:
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const MetricsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'text-blue-600',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: number;
  color?: string;
}) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div
              className={`flex items-center mt-2 text-sm ${
                trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend >= 0 ? '+' : ''}
              {trend}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-gray-50 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AdministrationDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>(mockDashboardMetrics);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    setRefreshing(true);
    // In production, fetch real data from APIs
    setTimeout(() => {
      setMetrics({
        ...mockDashboardMetrics,
        timestamp: new Date(),
      });
      setRefreshing(false);
    }, 1000);
  };

  const getAdminLevel = (): AdminLevel => {
    // Determine admin level based on user role
    if (user?.role === UserRole.SUPER_ADMIN) return AdminLevel.STATE;
    if (user?.role === UserRole.ADMIN) return AdminLevel.DISTRICT;
    if (user?.role === UserRole.SCHOOL_ADMIN) return AdminLevel.SCHOOL;
    return AdminLevel.SCHOOL;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={[UserRole.ADMIN, UserRole.SCHOOL_ADMIN]}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">HASIVU Administration Center</h1>
                <p className="text-gray-600 mt-1">
                  Centralized multi-school nutrition program management
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="px-3 py-1">
                  {getAdminLevel().toUpperCase()} LEVEL
                </Badge>
                <Button
                  variant="outline"
                  onClick={refreshData}
                  disabled={refreshing}
                  className="flex items-center space-x-2"
                >
                  <Activity className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
                <Button className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="schools">Schools</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Alert Banner */}
              {metrics.alerts.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <div>
                          <h3 className="font-medium text-orange-900">
                            {metrics.alerts.length} Active Alert
                            {metrics.alerts.length !== 1 ? 's' : ''}
                          </h3>
                          <p className="text-sm text-orange-700">Requires immediate attention</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View All Alerts
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricsCard
                  title="Total Schools"
                  value={formatNumber(metrics.schools.total)}
                  subtitle={`${metrics.schools.active} active`}
                  icon={Building2}
                  trend={2.3}
                  color="text-blue-600"
                />
                <MetricsCard
                  title="Students Served Today"
                  value={formatNumber(metrics.operations.studentsServed)}
                  subtitle={`${formatNumber(metrics.operations.todayOrders)} orders`}
                  icon={Users}
                  trend={8.1}
                  color="text-green-600"
                />
                <MetricsCard
                  title="Monthly Revenue"
                  value={formatCurrency(metrics.financial.totalRevenue)}
                  subtitle={`${metrics.financial.revenueGrowth}% growth`}
                  icon={DollarSign}
                  trend={metrics.financial.revenueGrowth}
                  color="text-emerald-600"
                />
                <MetricsCard
                  title="Compliance Score"
                  value={`${metrics.compliance.overallScore}%`}
                  subtitle="All categories"
                  icon={Shield}
                  trend={1.2}
                  color="text-purple-600"
                />
              </div>

              {/* Performance Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="w-5 h-5" />
                      <span>Performance Overview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Customer Satisfaction</span>
                        <span className="text-sm text-gray-600">
                          {metrics.performance.customerSatisfaction}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${metrics.performance.customerSatisfaction}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Operational Efficiency</span>
                        <span className="text-sm text-gray-600">
                          {metrics.performance.operationalEfficiency}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${metrics.performance.operationalEfficiency}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Technology Adoption</span>
                        <span className="text-sm text-gray-600">
                          {metrics.performance.technologyAdoption}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${metrics.performance.technologyAdoption}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Recent Alerts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {metrics.alerts.slice(0, 3).map((alert: Alert) => (
                        <div
                          key={alert.id}
                          className="flex items-start space-x-3 p-3 rounded-lg border"
                        >
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {alert.title}
                            </p>
                            <p className="text-sm text-gray-600 truncate">{alert.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {alert.source.name} • {new Date(alert.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {metrics.alerts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                          <p>No active alerts</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* School Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Schools by Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-sm">Excellent ({'>'}90%)</span>
                        </div>
                        <span className="text-sm font-medium">
                          {metrics.schools.performanceDistribution.excellent}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span className="text-sm">Good (70-90%)</span>
                        </div>
                        <span className="text-sm font-medium">
                          {metrics.schools.performanceDistribution.good}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                          <span className="text-sm">Average (50-70%)</span>
                        </div>
                        <span className="text-sm font-medium">
                          {metrics.schools.performanceDistribution.average}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span className="text-sm">Needs Improvement ({'<'}50%)</span>
                        </div>
                        <span className="text-sm font-medium">
                          {metrics.schools.performanceDistribution.poor}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(metrics.schools.byState).map(([state, count]) => (
                        <div key={state} className="flex items-center justify-between">
                          <span className="text-sm">{state}</span>
                          <span className="text-sm font-medium">{count as number} schools</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="schools">
              <Card>
                <CardHeader>
                  <CardTitle>Schools Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    School management interface will be implemented here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operations">
              <Card>
                <CardHeader>
                  <CardTitle>Operations Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Operations monitoring interface will be implemented here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financials">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Financial management interface will be implemented here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance & Audit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Compliance monitoring interface will be implemented here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
