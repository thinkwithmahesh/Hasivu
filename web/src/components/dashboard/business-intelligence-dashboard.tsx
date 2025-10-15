'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
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
  Treemap,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from 'recharts';
import {
  Crown,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BarChart3,
  School,
  Clock,
  Target,
  Award,
  Filter,
  RefreshCw,
  AlertTriangle,
  Heart,
  ChefHat,
  Truck,
  TrendingDown,
  Star,
  BrainCircuit,
  Lightbulb,
  Brain,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnalyticsService } from '@/services/analytics.service';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// =====================================================
// BUSINESS INTELLIGENCE INTERFACES
// =====================================================

interface ExecutiveKPI {
  id: string;
  title: string;
  value: number | string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  format: 'currency' | 'percentage' | 'number' | 'duration';
  timeframe: string;
  target?: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: number[];
  insights: string[];
}

interface SchoolPerformanceMetrics {
  schoolId: string;
  schoolName: string;
  region: string;
  studentCount: number;
  revenueGrowth: number;
  satisfactionScore: number;
  operationalEfficiency: number;
  riskScore: number;
  benchmarkRank: number;
  totalRevenue: number;
  avgMealCost: number;
  nutritionScore: number;
  trendData: Array<{
    month: string;
    revenue: number;
    satisfaction: number;
    efficiency: number;
  }>;
}

interface AIInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'trend' | 'anomaly' | 'opportunity';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: 'financial' | 'operational' | 'strategic' | 'quality' | 'risk';
  actionable: boolean;
  estimatedValue?: number;
  deadline?: Date;
  relatedMetrics: string[];
  recommendations: Array<{
    action: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    timeline: string;
  }>;
}

interface DashboardFilter {
  timeRange: 'today' | '7d' | '30d' | '90d' | '1y' | 'custom';
  schools: string[];
  regions: string[];
  metrics: string[];
  customDateRange?: {
    start: Date;
    end: Date;
  };
}

interface BusinessIntelligenceDashboardProps {
  userRole: 'super_admin' | 'regional_admin' | 'school_admin' | 'analyst';
  accessLevel: number;
  schoolIds?: string[];
  className?: string;
}

// =====================================================
// MOCK DATA GENERATORS
// =====================================================

const generateExecutiveKPIs = (): ExecutiveKPI[] => [
  {
    id: 'total_revenue',
    title: 'Total Revenue',
    value: 2847520,
    change: 12.4,
    changeType: 'increase',
    format: 'currency',
    timeframe: 'vs last month',
    target: 3000000,
    status: 'good',
    trend: [2200000, 2350000, 2520000, 2680000, 2847520],
    insights: [
      'Revenue growth driven by 15% increase in premium meal subscriptions',
      'School expansion in Bangalore region contributing 18% of growth',
      'On track to exceed quarterly target by 8%',
    ],
  },
  {
    id: 'student_satisfaction',
    title: 'Student Satisfaction',
    value: 4.7,
    change: 0.3,
    changeType: 'increase',
    format: 'number',
    timeframe: 'rating (5.0 scale)',
    target: 4.8,
    status: 'excellent',
    trend: [4.2, 4.3, 4.5, 4.6, 4.7],
    insights: [
      'New AI-optimized menu planning improving meal variety',
      'Reduced wait times through better queue management',
      'Nutritionist feedback integration showing positive results',
    ],
  },
  {
    id: 'operational_efficiency',
    title: 'Operational Efficiency',
    value: 87.3,
    change: 5.2,
    changeType: 'increase',
    format: 'percentage',
    timeframe: 'efficiency score',
    target: 90,
    status: 'good',
    trend: [78, 82, 84, 86, 87.3],
    insights: [
      'Automated inventory management reducing waste by 12%',
      'Predictive staffing optimization improving service times',
      'Supply chain AI reducing procurement costs by 8%',
    ],
  },
  {
    id: 'market_penetration',
    title: 'Market Penetration',
    value: 23.8,
    change: 2.1,
    changeType: 'increase',
    format: 'percentage',
    timeframe: 'regional market share',
    status: 'good',
    trend: [19.2, 20.5, 21.8, 22.7, 23.8],
    insights: [
      'Strongest growth in tier-2 cities with 34% market share',
      'Premium school partnerships driving expansion',
      'Competitive advantage in technology adoption',
    ],
  },
  {
    id: 'customer_acquisition',
    title: 'New School Partnerships',
    value: 47,
    change: 13.3,
    changeType: 'increase',
    format: 'number',
    timeframe: 'schools this quarter',
    status: 'excellent',
    trend: [28, 32, 38, 42, 47],
    insights: [
      'Referral program contributing 65% of new acquisitions',
      'Demo conversion rate improved to 78%',
      'Strong demand in Delhi NCR and Chennai markets',
    ],
  },
  {
    id: 'risk_score',
    title: 'Overall Risk Score',
    value: 2.3,
    change: -0.4,
    changeType: 'decrease',
    format: 'number',
    timeframe: 'risk index (0-10)',
    status: 'excellent',
    trend: [3.2, 2.9, 2.7, 2.5, 2.3],
    insights: [
      'Supply chain diversification reducing vendor risk',
      'Improved financial reserves and cash flow stability',
      'Enhanced compliance monitoring across all locations',
    ],
  },
];

const generateSchoolPerformanceData = (): SchoolPerformanceMetrics[] => [
  {
    schoolId: 'school-001',
    schoolName: 'Delhi Public School, Gurgaon',
    region: 'NCR',
    studentCount: 1250,
    revenueGrowth: 15.8,
    satisfactionScore: 4.8,
    operationalEfficiency: 92.5,
    riskScore: 1.8,
    benchmarkRank: 3,
    totalRevenue: 487500,
    avgMealCost: 45,
    nutritionScore: 94,
    trendData: [
      { month: 'Jan', revenue: 420000, satisfaction: 4.5, efficiency: 87 },
      { month: 'Feb', revenue: 445000, satisfaction: 4.6, efficiency: 89 },
      { month: 'Mar', revenue: 467500, satisfaction: 4.7, efficiency: 91 },
      { month: 'Apr', revenue: 487500, satisfaction: 4.8, efficiency: 92.5 },
    ],
  },
  {
    schoolId: 'school-002',
    schoolName: 'Ryan International, Bangalore',
    region: 'South',
    studentCount: 980,
    revenueGrowth: 22.3,
    satisfactionScore: 4.6,
    operationalEfficiency: 89.2,
    riskScore: 2.1,
    benchmarkRank: 1,
    totalRevenue: 412800,
    avgMealCost: 42,
    nutritionScore: 91,
    trendData: [
      { month: 'Jan', revenue: 325000, satisfaction: 4.2, efficiency: 84 },
      { month: 'Feb', revenue: 358000, satisfaction: 4.4, efficiency: 86 },
      { month: 'Mar', revenue: 385600, satisfaction: 4.5, efficiency: 88 },
      { month: 'Apr', revenue: 412800, satisfaction: 4.6, efficiency: 89.2 },
    ],
  },
  {
    schoolId: 'school-003',
    schoolName: 'DAV Public School, Chennai',
    region: 'South',
    studentCount: 1120,
    revenueGrowth: 8.7,
    satisfactionScore: 4.4,
    operationalEfficiency: 85.8,
    riskScore: 2.9,
    benchmarkRank: 8,
    totalRevenue: 378400,
    avgMealCost: 38,
    nutritionScore: 87,
    trendData: [
      { month: 'Jan', revenue: 348000, satisfaction: 4.1, efficiency: 82 },
      { month: 'Feb', revenue: 356500, satisfaction: 4.2, efficiency: 83 },
      { month: 'Mar', revenue: 367200, satisfaction: 4.3, efficiency: 84 },
      { month: 'Apr', revenue: 378400, satisfaction: 4.4, efficiency: 85.8 },
    ],
  },
  {
    schoolId: 'school-004',
    schoolName: 'Kendriya Vidyalaya, Mumbai',
    region: 'West',
    studentCount: 1450,
    revenueGrowth: 18.9,
    satisfactionScore: 4.5,
    operationalEfficiency: 88.7,
    riskScore: 2.4,
    benchmarkRank: 5,
    totalRevenue: 523500,
    avgMealCost: 41,
    nutritionScore: 89,
    trendData: [
      { month: 'Jan', revenue: 440000, satisfaction: 4.2, efficiency: 85 },
      { month: 'Feb', revenue: 468500, satisfaction: 4.3, efficiency: 86 },
      { month: 'Mar', revenue: 495800, satisfaction: 4.4, efficiency: 87 },
      { month: 'Apr', revenue: 523500, satisfaction: 4.5, efficiency: 88.7 },
    ],
  },
];

// Transform functions for API responses
const transformExecutiveKPIs = (data: any): ExecutiveKPI[] => {
  // Transform Lambda response to ExecutiveKPI format
  if (Array.isArray(data)) {
    return data.map(item => ({
      id: item.id || item.metricId,
      title: item.title || item.metricName,
      value: item.value,
      change: item.change || 0,
      changeType: item.changeType || (item.change >= 0 ? 'increase' : 'decrease'),
      format: item.format || 'number',
      timeframe: item.timeframe || 'vs last period',
      target: item.target,
      status: item.status || 'good',
      trend: item.trend || [],
      insights: item.insights || [],
    }));
  }
  return generateExecutiveKPIs(); // Fallback
};

const transformSchoolPerformance = (data: any): SchoolPerformanceMetrics[] => {
  // Transform Lambda response to SchoolPerformanceMetrics format
  if (Array.isArray(data)) {
    return data.map(item => ({
      schoolId: item.schoolId,
      schoolName: item.schoolName,
      region: item.region,
      studentCount: item.studentCount || 0,
      revenueGrowth: item.revenueGrowth || 0,
      satisfactionScore: item.satisfactionScore || 0,
      operationalEfficiency: item.operationalEfficiency || 0,
      riskScore: item.riskScore || 0,
      benchmarkRank: item.benchmarkRank || 0,
      totalRevenue: item.totalRevenue || 0,
      avgMealCost: item.avgMealCost || 0,
      nutritionScore: item.nutritionScore || 0,
      trendData: item.trendData || [],
    }));
  }
  return generateSchoolPerformanceData(); // Fallback
};

const transformAIInsights = (data: any): AIInsight[] => {
  // Transform Lambda response to AIInsight format
  if (Array.isArray(data)) {
    return data.map(item => ({
      id: item.id || item.insightId,
      type: item.type || 'recommendation',
      priority: item.priority || 'medium',
      title: item.title,
      description: item.description,
      confidence: item.confidence || 80,
      impact: item.impact || 'medium',
      category: item.category || 'operational',
      actionable: item.actionable || false,
      estimatedValue: item.estimatedValue,
      deadline: item.deadline ? new Date(item.deadline) : undefined,
      relatedMetrics: item.relatedMetrics || [],
      recommendations: item.recommendations || [],
    }));
  }
  return generateAIInsights(); // Fallback
};

const getTimeframeFromFilter = (
  filters: DashboardFilter
): { startDate: string; endDate: string } => {
  const now = new Date();
  let startDate: Date;

  switch (filters.timeRange) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
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
    case 'custom':
      if (filters.customDateRange) {
        return {
          startDate: filters.customDateRange.start.toISOString().split('T')[0],
          endDate: filters.customDateRange.end.toISOString().split('T')[0],
        };
      }
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  };
};

const generateAIInsights = (): AIInsight[] => [
  {
    id: 'insight-001',
    type: 'opportunity',
    priority: 'high',
    title: 'Premium Menu Optimization Opportunity',
    description:
      'AI analysis shows 34% of students would pay 15% more for organic/healthy options. Implementing premium tier could increase revenue by ₹2.8L monthly.',
    confidence: 87,
    impact: 'high',
    category: 'financial',
    actionable: true,
    estimatedValue: 280000,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    relatedMetrics: ['revenue_growth', 'student_satisfaction', 'avg_meal_cost'],
    recommendations: [
      {
        action: 'Launch premium organic meal tier',
        effort: 'medium',
        impact: 'high',
        timeline: '4-6 weeks',
      },
      {
        action: 'Partner with local organic suppliers',
        effort: 'medium',
        impact: 'medium',
        timeline: '2-3 weeks',
      },
      {
        action: 'Implement nutrition education program',
        effort: 'low',
        impact: 'medium',
        timeline: '1-2 weeks',
      },
    ],
  },
  {
    id: 'insight-002',
    type: 'alert',
    priority: 'critical',
    title: 'Supply Chain Disruption Risk',
    description:
      'Predictive models indicate 78% probability of vegetable price inflation (25-40%) due to monsoon forecasts. Immediate hedging recommended.',
    confidence: 92,
    impact: 'high',
    category: 'risk',
    actionable: true,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    relatedMetrics: ['operational_costs', 'profit_margin', 'risk_score'],
    recommendations: [
      {
        action: 'Secure 3-month vegetable supply contracts',
        effort: 'high',
        impact: 'high',
        timeline: '1 week',
      },
      {
        action: 'Diversify supplier base across regions',
        effort: 'medium',
        impact: 'high',
        timeline: '2-3 weeks',
      },
      {
        action: 'Implement menu flexibility protocols',
        effort: 'low',
        impact: 'medium',
        timeline: 'Immediate',
      },
    ],
  },
  {
    id: 'insight-003',
    type: 'recommendation',
    priority: 'medium',
    title: 'Regional Expansion Strategy',
    description:
      'Market analysis reveals untapped opportunity in Pune and Ahmedabad regions. Low competition and high demand potential identified.',
    confidence: 81,
    impact: 'high',
    category: 'strategic',
    actionable: true,
    estimatedValue: 1250000,
    relatedMetrics: ['market_penetration', 'customer_acquisition', 'revenue_growth'],
    recommendations: [
      {
        action: 'Conduct detailed market research in target cities',
        effort: 'medium',
        impact: 'high',
        timeline: '4-6 weeks',
      },
      {
        action: 'Establish pilot partnerships with 2-3 schools',
        effort: 'high',
        impact: 'medium',
        timeline: '8-10 weeks',
      },
      {
        action: 'Develop region-specific menu variations',
        effort: 'low',
        impact: 'medium',
        timeline: '2-3 weeks',
      },
    ],
  },
  {
    id: 'insight-004',
    type: 'trend',
    priority: 'medium',
    title: 'Nutritional Awareness Driving Preferences',
    description:
      'Student preference data shows 67% increase in health-conscious meal choices. Trend accelerating among 12-16 age group.',
    confidence: 89,
    impact: 'medium',
    category: 'strategic',
    actionable: true,
    relatedMetrics: ['student_satisfaction', 'nutrition_score', 'menu_popularity'],
    recommendations: [
      {
        action: 'Expand nutritional information display',
        effort: 'low',
        impact: 'medium',
        timeline: '1-2 weeks',
      },
      {
        action: 'Introduce calorie counting features in app',
        effort: 'medium',
        impact: 'medium',
        timeline: '6-8 weeks',
      },
      {
        action: 'Partner with nutritionists for menu validation',
        effort: 'medium',
        impact: 'high',
        timeline: '4-6 weeks',
      },
    ],
  },
  {
    id: 'insight-005',
    type: 'anomaly',
    priority: 'high',
    title: 'Unusual Pattern in Chennai Region',
    description:
      'Demand prediction models detecting 23% deviation from normal patterns in Chennai schools. Investigation recommended.',
    confidence: 94,
    impact: 'medium',
    category: 'operational',
    actionable: true,
    relatedMetrics: ['demand_forecast', 'operational_efficiency', 'student_count'],
    recommendations: [
      {
        action: 'Deploy field team for data collection',
        effort: 'medium',
        impact: 'high',
        timeline: '1 week',
      },
      {
        action: 'Review local competitor activities',
        effort: 'low',
        impact: 'medium',
        timeline: '2-3 days',
      },
      {
        action: 'Analyze student feedback patterns',
        effort: 'low',
        impact: 'medium',
        timeline: '1-2 days',
      },
    ],
  },
];

// =====================================================
// BUSINESS INTELLIGENCE DASHBOARD COMPONENT
// =====================================================

const BusinessIntelligenceDashboard: React.FC<BusinessIntelligenceDashboardProps> = ({
  userRole,
  accessLevel,
  schoolIds,
  className,
}) => {
  // State management
  // const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('executive');
  const [filters, setFilters] = useState<DashboardFilter>({
    timeRange: '30d',
    schools: schoolIds || [],
    regions: [],
    metrics: [],
  });
  // const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  // const [dashboardLayout, setDashboardLayout] = useState('default');

  // Data state
  const [executiveKPIs, setExecutiveKPIs] = useState<ExecutiveKPI[]>([]);
  const [schoolPerformance, setSchoolPerformance] = useState<SchoolPerformanceMetrics[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Memoized data processing
  const processedKPIs = useMemo(() => {
    return executiveKPIs.map(kpi => ({
      ...kpi,
      formattedValue: formatKPIValue(kpi.value, kpi.format),
      progressToTarget: kpi.target ? (Number(kpi.value) / kpi.target) * 100 : undefined,
    }));
  }, [executiveKPIs]);

  const filteredSchoolData = useMemo(() => {
    let filtered = schoolPerformance;

    if (filters.schools.length > 0) {
      filtered = filtered.filter(school => filters.schools.includes(school.schoolId));
    }

    if (filters.regions.length > 0) {
      filtered = filtered.filter(school => filters.regions.includes(school.region));
    }

    return filtered.sort((a, b) => b.benchmarkRank - a.benchmarkRank);
  }, [schoolPerformance, filters]);

  const prioritizedInsights = useMemo(() => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return aiInsights
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, 10); // Show top 10 insights
  }, [aiInsights]);

  // Real-time data connection
  useEffect(() => {
    const newSocket = io('/business-intelligence', {
      auth: { userRole, accessLevel },
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('kpi-update', (data: Partial<ExecutiveKPI>) => {
      setExecutiveKPIs(prev => prev.map(kpi => (kpi.id === data.id ? { ...kpi, ...data } : kpi)));
    });

    newSocket.on('school-performance-update', (data: Partial<SchoolPerformanceMetrics>) => {
      setSchoolPerformance(prev =>
        prev.map(school => (school.schoolId === data.schoolId ? { ...school, ...data } : school))
      );
    });

    newSocket.on('ai-insight', (insight: AIInsight) => {
      setAIInsights(prev => [insight, ...prev.slice(0, 19)]); // Keep latest 20 insights
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userRole, accessLevel]);

  // Initialize dashboard data
  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);

      try {
        // Load data from analytics service
        const analyticsService = AnalyticsService.getInstance();

        // Load executive dashboard data
        const executiveData = await analyticsService.getExecutiveDashboard({
          organizationId: schoolIds?.[0] || 'default-org',
          dashboardType: 'comprehensive',
        });

        if (executiveData.success && executiveData.data) {
          // Transform Lambda response to component format
          setExecutiveKPIs(transformExecutiveKPIs(executiveData.data));
        } else {
          // Fallback to mock data if API fails
          setExecutiveKPIs(generateExecutiveKPIs());
        }

        // Load business intelligence data
        const biData = await analyticsService.getBusinessIntelligence({
          organizationId: schoolIds?.[0] || 'default-org',
          timeframe: getTimeframeFromFilter(filters),
        });

        if (biData.success && biData.data) {
          setSchoolPerformance(transformSchoolPerformance(biData.data));
        } else {
          setSchoolPerformance(generateSchoolPerformanceData());
        }

        // Load predictive insights
        const insightsData = await analyticsService.getPredictiveInsights({
          organizationId: schoolIds?.[0] || 'default-org',
          insightType: 'comprehensive',
        });

        if (insightsData.success && insightsData.data) {
          setAIInsights(transformAIInsights(insightsData.data));
        } else {
          setAIInsights(generateAIInsights());
        }
      } catch (error) {
        // Fallback to mock data on error
        setExecutiveKPIs(generateExecutiveKPIs());
        setSchoolPerformance(generateSchoolPerformanceData());
        setAIInsights(generateAIInsights());
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [filters, refreshKey, schoolIds]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Utility functions
  const formatKPIValue = (value: number | string, format: string): string => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'duration':
        return `${value}min`;
      default:
        return value.toLocaleString();
    }
  };

  const getKPIStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50';
      case 'good':
        return 'text-blue-600 bg-blue-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getInsightPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const handleFilterChange = useCallback((newFilters: Partial<DashboardFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleExportData = useCallback((format: 'pdf' | 'excel' | 'csv') => {
    // Export functionality would be implemented here
  }, []);

  const handleRefreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  if (loading) {
    return (
      <div className={cn('min-h-screen bg-gray-50 p-6', className)}>
        <div className="max-w-8xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-8xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BrainCircuit className="h-6 w-6 text-blue-600" />
              Business Intelligence Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time insights and analytics across all HASIVU operations
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div
                className={cn('h-2 w-2 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500')}
              />
              <span className="text-xs text-gray-600">{isConnected ? 'Live' : 'Offline'}</span>
            </div>

            {/* Auto Refresh Toggle */}
            <div className="flex items-center gap-2">
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <span className="text-xs text-gray-600">Auto-refresh</span>
            </div>

            {/* Manual Refresh */}
            <Button variant="outline" size="sm" onClick={handleRefreshData} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>

            {/* Export Options */}
            <Select onValueChange={value => handleExportData(value as any)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">Export PDF</SelectItem>
                <SelectItem value="excel">Export Excel</SelectItem>
                <SelectItem value="csv">Export CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto p-6">
        {/* Filter Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              <Select
                value={filters.timeRange}
                onValueChange={value => handleFilterChange({ timeRange: value as any })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="ncr">NCR</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                  <SelectItem value="west">West</SelectItem>
                  <SelectItem value="east">East</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="executive" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Executive
            </TabsTrigger>
            <TabsTrigger value="operational" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Operational
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Builder
            </TabsTrigger>
          </TabsList>

          {/* Executive Intelligence Dashboard */}
          <TabsContent value="executive" className="space-y-6">
            {/* Executive KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {processedKPIs.map(kpi => (
                <Card key={kpi.id} className="relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {kpi.title}
                      </CardTitle>
                      <Badge className={cn('text-xs', getKPIStatusColor(kpi.status))}>
                        {kpi.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {kpi.formattedValue}
                        </span>
                        <div className="flex items-center gap-1">
                          {kpi.changeType === 'increase' && (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          )}
                          {kpi.changeType === 'decrease' && (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span
                            className={cn(
                              'text-xs font-medium',
                              kpi.changeType === 'increase'
                                ? 'text-green-600'
                                : kpi.changeType === 'decrease'
                                  ? 'text-red-600'
                                  : 'text-gray-500'
                            )}
                          >
                            {kpi.changeType !== 'neutral' && (kpi.change > 0 ? '+' : '')}
                            {kpi.change}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500">{kpi.timeframe}</p>

                      {kpi.progressToTarget && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Progress to target</span>
                            <span>{kpi.progressToTarget.toFixed(1)}%</span>
                          </div>
                          <Progress value={kpi.progressToTarget} className="h-1" />
                        </div>
                      )}

                      {/* Mini trend chart */}
                      <div className="h-8 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={kpi.trend.map((value, index) => ({ value, index }))}>
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#3B82F6"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>

                  {/* Insights tooltip trigger */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-60 hover:opacity-100"
                      >
                        <Lightbulb className="h-3 w-3" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>{kpi.title} - Insights</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6 space-y-4">
                        {kpi.insights.map((insight, index) => (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-700">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                </Card>
              ))}
            </div>

            {/* Executive Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Revenue Trend Analysis
                  </CardTitle>
                  <CardDescription>Monthly revenue performance across all schools</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={filteredSchoolData[0]?.trendData || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="revenue" orientation="left" />
                        <YAxis yAxisId="efficiency" orientation="right" />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 shadow-lg rounded-lg border">
                                  <p className="font-medium">{label}</p>
                                  {payload.map((entry, index) => (
                                    <p key={index} style={{ color: entry.color }}>
                                      {entry.name}: {entry.value}
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar yAxisId="revenue" dataKey="revenue" fill="#3B82F6" opacity={0.7} />
                        <Line
                          yAxisId="efficiency"
                          type="monotone"
                          dataKey="efficiency"
                          stroke="#10B981"
                          strokeWidth={3}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* School Performance Matrix */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5 text-purple-600" />
                    School Performance Matrix
                  </CardTitle>
                  <CardDescription>Revenue vs. satisfaction score positioning</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart data={filteredSchoolData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="satisfactionScore" domain={[4.0, 5.0]} />
                        <YAxis dataKey="totalRevenue" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 shadow-lg rounded-lg border">
                                  <p className="font-medium">{data.schoolName}</p>
                                  <p>Revenue: ₹{data.totalRevenue.toLocaleString()}</p>
                                  <p>Satisfaction: {data.satisfactionScore}/5.0</p>
                                  <p>Students: {data.studentCount}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter dataKey="totalRevenue" fill="#8B5CF6" />
                        <ReferenceLine x={4.5} stroke="#ef4444" strokeDasharray="5 5" />
                        <ReferenceLine y={400000} stroke="#ef4444" strokeDasharray="5 5" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Schools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Top Performing Schools
                </CardTitle>
                <CardDescription>
                  Schools ranked by comprehensive performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Growth</TableHead>
                        <TableHead className="text-right">Satisfaction</TableHead>
                        <TableHead className="text-right">Efficiency</TableHead>
                        <TableHead className="text-right">Risk Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchoolData.slice(0, 10).map((school, index) => (
                        <TableRow key={school.schoolId}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                                  index === 0
                                    ? 'bg-yellow-500'
                                    : index === 1
                                      ? 'bg-gray-400'
                                      : index === 2
                                        ? 'bg-orange-600'
                                        : 'bg-blue-500'
                                )}
                              >
                                {index + 1}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{school.schoolName}</p>
                              <p className="text-xs text-gray-500">{school.schoolId}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{school.region}</Badge>
                          </TableCell>
                          <TableCell>{school.studentCount.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{school.totalRevenue.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <TrendingUp className="h-3 w-3 text-green-600" />
                              <span className="text-green-600 font-medium">
                                +{school.revenueGrowth}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>{school.satisfactionScore}/5.0</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Progress value={school.operationalEfficiency} className="w-12 h-1" />
                              <span className="text-xs">{school.operationalEfficiency}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              className={cn(
                                school.riskScore < 2.5
                                  ? 'bg-green-100 text-green-800'
                                  : school.riskScore < 3.5
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              )}
                            >
                              {school.riskScore.toFixed(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operational Intelligence Dashboard */}
          <TabsContent value="operational" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Kitchen Efficiency */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-orange-600" />
                    Kitchen Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Preparation Time</span>
                      <span className="font-medium">-12% vs target</span>
                    </div>
                    <Progress value={88} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Food Quality Score</span>
                      <span className="font-medium">4.6/5.0</span>
                    </div>
                    <Progress value={92} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Waste Reduction</span>
                      <span className="font-medium">23% improvement</span>
                    </div>
                    <Progress value={77} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Supply Chain */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    Supply Chain Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">On-time Delivery</span>
                      <span className="font-medium">94.8%</span>
                    </div>
                    <Progress value={94.8} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Vendor Reliability</span>
                      <span className="font-medium">4.3/5.0</span>
                    </div>
                    <Progress value={86} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cost Optimization</span>
                      <span className="font-medium">₹1.2L saved</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Student Engagement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-600" />
                    Student Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">App Usage</span>
                      <span className="font-medium">78% daily active</span>
                    </div>
                    <Progress value={78} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Feedback Response</span>
                      <span className="font-medium">4.2/5.0</span>
                    </div>
                    <Progress value={84} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Meal Participation</span>
                      <span className="font-medium">89% enrollment</span>
                    </div>
                    <Progress value={89} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Operational Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Real-time Kitchen Capacity */}
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Kitchen Capacity</CardTitle>
                  <CardDescription>
                    Current capacity utilization across all kitchens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { kitchen: 'Main Kitchen', capacity: 87, target: 85 },
                          { kitchen: 'Secondary', capacity: 92, target: 90 },
                          { kitchen: 'Prep Station', capacity: 78, target: 80 },
                          { kitchen: 'Mobile Unit', capacity: 65, target: 70 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="kitchen" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="capacity" fill="#3B82F6" />
                        <Bar dataKey="target" fill="#10B981" opacity={0.5} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Demand vs Supply */}
              <Card>
                <CardHeader>
                  <CardTitle>Demand vs Supply Analysis</CardTitle>
                  <CardDescription>Predicted vs actual meal demand by time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { time: '8:00', predicted: 120, actual: 135, supply: 150 },
                          { time: '10:00', predicted: 80, actual: 75, supply: 100 },
                          { time: '12:00', predicted: 450, actual: 478, supply: 500 },
                          { time: '14:00', predicted: 320, actual: 298, supply: 350 },
                          { time: '16:00', predicted: 180, actual: 165, supply: 200 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="supply"
                          stackId="1"
                          stroke="#10B981"
                          fill="#10B981"
                          opacity={0.3}
                        />
                        <Area
                          type="monotone"
                          dataKey="predicted"
                          stackId="2"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          opacity={0.7}
                        />
                        <Area
                          type="monotone"
                          dataKey="actual"
                          stackId="3"
                          stroke="#F59E0B"
                          fill="#F59E0B"
                          opacity={0.9}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Advanced Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Attribution Analysis</CardTitle>
                  <CardDescription>Revenue breakdown by source and channel</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <Treemap
                        data={[
                          { name: 'Regular Meals', value: 1250000, fill: '#3B82F6' },
                          { name: 'Premium Plans', value: 890000, fill: '#10B981' },
                          { name: 'Special Events', value: 320000, fill: '#F59E0B' },
                          { name: 'Catering', value: 180000, fill: '#8B5CF6' },
                          { name: 'Merchandise', value: 85000, fill: '#EF4444' },
                        ]}
                        dataKey="value"
                        aspectRatio={4 / 3}
                        stroke="#fff"
                      />
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Segmentation */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Segmentation</CardTitle>
                  <CardDescription>Student demographics and behavior patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Regular Users', value: 45, fill: '#3B82F6' },
                            { name: 'Premium Subscribers', value: 28, fill: '#10B981' },
                            { name: 'Occasional Users', value: 18, fill: '#F59E0B' },
                            { name: 'New Users', value: 9, fill: '#8B5CF6' },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Regular Users', value: 45, fill: '#3B82F6' },
                            { name: 'Premium Subscribers', value: 28, fill: '#10B981' },
                            { name: 'Occasional Users', value: 18, fill: '#F59E0B' },
                            { name: 'New Users', value: 9, fill: '#8B5CF6' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Predictive Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-purple-600" />
                  Predictive Analytics Dashboard
                </CardTitle>
                <CardDescription>AI-powered forecasting and trend analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={[
                            {
                              month: 'Jan',
                              actual: 420000,
                              predicted: 415000,
                              confidence: [395000, 435000],
                            },
                            {
                              month: 'Feb',
                              actual: 445000,
                              predicted: 448000,
                              confidence: [425000, 470000],
                            },
                            {
                              month: 'Mar',
                              actual: 467500,
                              predicted: 465000,
                              confidence: [440000, 490000],
                            },
                            {
                              month: 'Apr',
                              actual: 487500,
                              predicted: 485000,
                              confidence: [460000, 510000],
                            },
                            {
                              month: 'May',
                              actual: null,
                              predicted: 512000,
                              confidence: [485000, 540000],
                            },
                            {
                              month: 'Jun',
                              actual: null,
                              predicted: 535000,
                              confidence: [505000, 565000],
                            },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="actual" fill="#3B82F6" opacity={0.7} />
                          <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="#10B981"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Revenue Forecast</h4>
                      <p className="text-2xl font-bold text-blue-900">₹5.12L</p>
                      <p className="text-sm text-blue-700">Next month (87% confidence)</p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900">Growth Prediction</h4>
                      <p className="text-2xl font-bold text-green-900">+14.8%</p>
                      <p className="text-sm text-green-700">Quarterly growth rate</p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900">Risk Assessment</h4>
                      <p className="text-2xl font-bold text-purple-900">Low</p>
                      <p className="text-sm text-purple-700">Supply chain stability</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Critical Insights */}
              <div className="lg:col-span-2 space-y-4">
                {prioritizedInsights.map(insight => (
                  <Card
                    key={insight.id}
                    className={cn('border-l-4', getInsightPriorityColor(insight.priority))}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {insight.type === 'recommendation' && (
                            <Lightbulb className="h-4 w-4 text-yellow-600" />
                          )}
                          {insight.type === 'alert' && (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          {insight.type === 'opportunity' && (
                            <Target className="h-4 w-4 text-green-600" />
                          )}
                          {insight.type === 'trend' && (
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                          )}
                          {insight.type === 'anomaly' && (
                            <AlertCircle className="h-4 w-4 text-purple-600" />
                          )}

                          <div>
                            <CardTitle className="text-base">{insight.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  insight.priority === 'critical' ? 'destructive' : 'outline'
                                }
                              >
                                {insight.priority}
                              </Badge>
                              <Badge variant="outline">{insight.category}</Badge>
                              <span className="text-xs text-gray-500">
                                {insight.confidence}% confidence
                              </span>
                            </div>
                          </div>
                        </div>

                        {insight.estimatedValue && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Potential Value</p>
                            <p className="text-lg font-bold text-green-600">
                              ₹{insight.estimatedValue.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{insight.description}</p>

                      {insight.recommendations.length > 0 && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value="recommendations">
                            <AccordionTrigger className="text-sm">
                              View Recommendations ({insight.recommendations.length})
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3">
                                {insight.recommendations.map((rec, index) => (
                                  <div
                                    key={index}
                                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{rec.action}</p>
                                      <div className="flex items-center gap-4 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          {rec.effort} effort
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {rec.impact} impact
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                          {rec.timeline}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {insight.deadline && (
                        <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800">
                              Action needed by: {insight.deadline.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Insights Summary */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Insights Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Critical</span>
                      <Badge variant="destructive">
                        {aiInsights.filter(i => i.priority === 'critical').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">High Priority</span>
                      <Badge variant="outline">
                        {aiInsights.filter(i => i.priority === 'high').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Medium Priority</span>
                      <Badge variant="outline">
                        {aiInsights.filter(i => i.priority === 'medium').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Actionable</span>
                      <Badge variant="outline">{aiInsights.filter(i => i.actionable).length}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">AI Model Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Prediction Accuracy</span>
                        <span>89.7%</span>
                      </div>
                      <Progress value={89.7} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Model Confidence</span>
                        <span>87.3%</span>
                      </div>
                      <Progress value={87.3} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Data Quality</span>
                        <span>94.1%</span>
                      </div>
                      <Progress value={94.1} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Insight Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Financial', value: 35, fill: '#3B82F6' },
                              { name: 'Operational', value: 28, fill: '#10B981' },
                              { name: 'Strategic', value: 22, fill: '#F59E0B' },
                              { name: 'Quality', value: 10, fill: '#8B5CF6' },
                              { name: 'Risk', value: 5, fill: '#EF4444' },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={60}
                            dataKey="value"
                          >
                            {[
                              { name: 'Financial', value: 35, fill: '#3B82F6' },
                              { name: 'Operational', value: 28, fill: '#10B981' },
                              { name: 'Strategic', value: 22, fill: '#F59E0B' },
                              { name: 'Quality', value: 10, fill: '#8B5CF6' },
                              { name: 'Risk', value: 5, fill: '#EF4444' },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Self-Service Dashboard Builder */}
          <TabsContent value="builder" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-600" />
                  Custom Dashboard Builder
                </CardTitle>
                <CardDescription>
                  Create personalized dashboards with drag-and-drop interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="mx-auto max-w-md">
                    <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Dashboard Builder Coming Soon
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Our advanced drag-and-drop dashboard builder will allow you to create custom
                      visualizations and reports tailored to your specific needs.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Drag & Drop Interface
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Custom Widgets
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Real-time Data
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Export Options
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default function BusinessIntelligenceDashboardWithErrorBoundary(
  props: BusinessIntelligenceDashboardProps
) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Could send to error reporting service here
      }}
      errorMessages={{
        title: 'Dashboard Unavailable',
        description:
          "We're experiencing technical difficulties loading the business intelligence dashboard. Please try refreshing the page.",
        actionText: 'Reload Dashboard',
      }}
    >
      <BusinessIntelligenceDashboard {...props} />
    </ErrorBoundary>
  );
}
