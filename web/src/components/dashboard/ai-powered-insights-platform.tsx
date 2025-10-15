'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  BrainCircuit,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Target,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  BarChart3,
  Activity,
  Zap,
  Bot,
  Sparkles,
  MessageSquare,
  Brain,
  Gauge,
  Award,
  AlertCircle,
  TrendingDown,
  Search,
  Filter,
  RefreshCw,
  Download,
  Share2,
  Eye,
  EyeOff,
  Play,
  Pause,
  SkipForward,
  Calendar,
  FileText,
  Send,
  Settings,
  Crosshair,
  Megaphone,
  Layers,
  Database,
  Globe,
  Star,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  GraduationCap,
  Shield,
  Truck,
  ChefHat,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// AI INSIGHTS INTERFACES
// =====================================================

interface AIInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'optimization';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category:
    | 'financial'
    | 'operational'
    | 'strategic'
    | 'quality'
    | 'customer'
    | 'supply_chain'
    | 'performance';
  title: string;
  description: string;
  insight: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'this_week' | 'this_month' | 'this_quarter';
  dataSource: string[];
  relatedMetrics: string[];
  generatedAt: Date;
  lastUpdated: Date;
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
  estimatedValue?: number;
  implementationCost?: number;
  timeToValue?: number; // days
  evidence: {
    dataPoints: unknown[];
    correlations: Array<{
      metric1: string;
      metric2: string;
      correlation: number;
      significance: number;
    }>;
    historicalPatterns: unknown[];
  };
  recommendations: Array<{
    id: string;
    action: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    timeline: string;
    resources: string[];
    dependencies: string[];
    successMetrics: string[];
  }>;
  aiModel: {
    name: string;
    version: string;
    accuracy: number;
    trainingData: string;
  };
}

interface NaturalLanguageQuery {
  id: string;
  query: string;
  intent: string;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  response: {
    answer: string;
    visualizations?: unknown[];
    followUpQuestions?: string[];
    confidence: number;
  };
  timestamp: Date;
}

interface AnomalyDetection {
  id: string;
  metric: string;
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  expectedValue: number;
  actualValue: number;
  deviation: number;
  description: string;
  possibleCauses: string[];
  suggestedActions: string[];
  context: Record<string, unknown>;
}

interface PredictiveModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'time_series' | 'clustering';
  target: string;
  features: string[];
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: Date;
  dataPoints: number;
  status: 'training' | 'active' | 'outdated' | 'failed';
  predictions: Array<{
    date: Date;
    predicted: number;
    confidence: number;
    actualValue?: number;
  }>;
}

interface AIPoweredInsightsPlatformProps {
  className?: string;
  userId?: string;
  userRole?: string;
  onInsightAction?: (insightId: string, action: string) => void;
}

// =====================================================
// MOCK DATA GENERATORS
// =====================================================

const generateAIInsights = (): AIInsight[] => [
  {
    id: 'ai-insight-001',
    type: 'opportunity',
    priority: 'high',
    category: 'financial',
    title: 'Premium Menu Tier Opportunity',
    description:
      'Student behavior analysis indicates strong demand for premium/organic meal options',
    insight:
      'AI analysis of 15,000+ student interactions reveals 34% would pay 15-20% premium for organic meals. Predictive models show ₹2.8L monthly revenue potential with 89% confidence.',
    confidence: 89,
    impact: 'high',
    urgency: 'this_month',
    dataSource: ['student_orders', 'feedback_surveys', 'payment_history', 'menu_preferences'],
    relatedMetrics: ['revenue_per_student', 'meal_satisfaction', 'premium_adoption'],
    generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
    status: 'new',
    estimatedValue: 280000,
    implementationCost: 45000,
    timeToValue: 30,
    evidence: {
      dataPoints: [
        { metric: 'organic_preference', value: 34, trend: 'increasing' },
        { metric: 'price_sensitivity', value: 0.73, trend: 'stable' },
        { metric: 'premium_trial_rate', value: 67, trend: 'increasing' },
      ],
      correlations: [
        {
          metric1: 'health_consciousness',
          metric2: 'premium_willingness',
          correlation: 0.78,
          significance: 0.95,
        },
        {
          metric1: 'age_group_12-16',
          metric2: 'organic_preference',
          correlation: 0.65,
          significance: 0.92,
        },
      ],
      historicalPatterns: [],
    },
    recommendations: [
      {
        id: 'rec-001',
        action: 'Launch organic meal tier with 3 options daily',
        effort: 'medium',
        impact: 'high',
        timeline: '4-6 weeks',
        resources: ['nutrition_team', 'supplier_network', 'menu_development'],
        dependencies: ['organic_supplier_contracts'],
        successMetrics: ['adoption_rate_target_25%', 'revenue_increase_15%'],
      },
      {
        id: 'rec-002',
        action: 'Implement A/B testing for pricing optimization',
        effort: 'low',
        impact: 'medium',
        timeline: '2 weeks',
        resources: ['data_analytics_team'],
        dependencies: ['menu_app_update'],
        successMetrics: ['optimal_price_point', 'conversion_rate_improvement'],
      },
    ],
    aiModel: {
      name: 'Revenue Optimization Engine',
      version: '2.3.1',
      accuracy: 0.89,
      trainingData: '24 months of transaction data, 50K+ student profiles',
    },
  },
  {
    id: 'ai-insight-002',
    type: 'alert',
    priority: 'critical',
    category: 'supply_chain',
    title: 'Supply Chain Disruption Risk',
    description: 'Predictive models indicate high probability of vegetable price inflation',
    insight:
      'Weather pattern analysis combined with supplier data predicts 25-40% vegetable price increase in next 45 days. Supply chain ML models show 78% probability with 92% confidence based on historical monsoon patterns.',
    confidence: 92,
    impact: 'high',
    urgency: 'immediate',
    dataSource: ['weather_forecasts', 'supplier_pricing', 'market_trends', 'historical_price_data'],
    relatedMetrics: ['food_cost_ratio', 'supplier_reliability', 'menu_cost'],
    generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000),
    status: 'acknowledged',
    estimatedValue: -150000, // negative impact
    implementationCost: 25000,
    timeToValue: 7,
    evidence: {
      dataPoints: [
        { metric: 'monsoon_forecast_intensity', value: 125, trend: 'increasing' },
        { metric: 'supplier_price_volatility', value: 23, trend: 'increasing' },
        { metric: 'inventory_buffer_days', value: 12, trend: 'decreasing' },
      ],
      correlations: [
        {
          metric1: 'rainfall_prediction',
          metric2: 'vegetable_prices',
          correlation: 0.84,
          significance: 0.96,
        },
        {
          metric1: 'supplier_diversification',
          metric2: 'price_stability',
          correlation: -0.67,
          significance: 0.89,
        },
      ],
      historicalPatterns: [],
    },
    recommendations: [
      {
        id: 'rec-003',
        action: 'Secure 90-day fixed-price contracts with top 3 suppliers',
        effort: 'high',
        impact: 'high',
        timeline: '1 week',
        resources: ['procurement_team', 'legal_team', 'finance_approval'],
        dependencies: ['supplier_negotiations'],
        successMetrics: ['cost_protection_coverage_80%', 'price_volatility_reduction'],
      },
      {
        id: 'rec-004',
        action: 'Activate alternative menu protocols for affected items',
        effort: 'medium',
        impact: 'medium',
        timeline: '3 days',
        resources: ['menu_planning_team', 'kitchen_operations'],
        dependencies: ['alternative_recipes_validation'],
        successMetrics: ['student_satisfaction_maintained', 'cost_increase_limited_10%'],
      },
    ],
    aiModel: {
      name: 'Supply Chain Risk Predictor',
      version: '1.8.4',
      accuracy: 0.92,
      trainingData: '10 years weather-price correlation data, 200+ supplier relationships',
    },
  },
  {
    id: 'ai-insight-003',
    type: 'trend',
    priority: 'medium',
    category: 'customer',
    title: 'Health-Conscious Eating Trend',
    description: 'Growing trend towards nutritional awareness among students',
    insight:
      'Student meal choices show 67% increase in health-conscious selections over last quarter. ML analysis identifies this as sustainable behavioral shift, not temporary trend. Opportunity to capitalize on health positioning.',
    confidence: 85,
    impact: 'medium',
    urgency: 'this_quarter',
    dataSource: ['meal_selections', 'nutrition_data', 'feedback_surveys', 'app_interactions'],
    relatedMetrics: ['nutrition_score_preference', 'calorie_consciousness', 'ingredient_awareness'],
    generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000),
    status: 'in_progress',
    estimatedValue: 120000,
    implementationCost: 15000,
    timeToValue: 60,
    evidence: {
      dataPoints: [
        { metric: 'health_meal_selection_rate', value: 67, trend: 'increasing' },
        { metric: 'nutrition_info_views', value: 340, trend: 'increasing' },
        { metric: 'low_calorie_preference', value: 45, trend: 'increasing' },
      ],
      correlations: [
        {
          metric1: 'age_group',
          metric2: 'health_consciousness',
          correlation: 0.72,
          significance: 0.88,
        },
        {
          metric1: 'nutrition_awareness',
          metric2: 'satisfaction_score',
          correlation: 0.59,
          significance: 0.82,
        },
      ],
      historicalPatterns: [],
    },
    recommendations: [
      {
        id: 'rec-005',
        action: 'Enhance nutritional information display in app',
        effort: 'low',
        impact: 'medium',
        timeline: '2 weeks',
        resources: ['app_development_team', 'nutrition_team'],
        dependencies: ['nutrition_database_update'],
        successMetrics: ['nutrition_info_engagement_increase', 'health_meal_adoption_growth'],
      },
    ],
    aiModel: {
      name: 'Student Behavior Analyzer',
      version: '3.1.2',
      accuracy: 0.85,
      trainingData: '18 months behavioral data, 25K+ student interactions',
    },
  },
  {
    id: 'ai-insight-004',
    type: 'anomaly',
    priority: 'high',
    category: 'operational',
    title: 'Chennai Region Demand Anomaly',
    description: 'Unusual pattern detected in Chennai schools demand forecasting',
    insight:
      'ML anomaly detection identified 23% deviation from predicted demand patterns in Chennai region over last 2 weeks. Pattern suggests external factor not captured in current models.',
    confidence: 94,
    impact: 'medium',
    urgency: 'this_week',
    dataSource: ['demand_forecasts', 'actual_orders', 'regional_data', 'competitor_analysis'],
    relatedMetrics: ['demand_accuracy', 'regional_variance', 'competitor_activity'],
    generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'new',
    estimatedValue: 0,
    implementationCost: 5000,
    timeToValue: 14,
    evidence: {
      dataPoints: [
        { metric: 'demand_prediction_error', value: 23, trend: 'increasing' },
        { metric: 'chennai_order_volume', value: -18, trend: 'decreasing' },
        { metric: 'market_penetration_change', value: -3.2, trend: 'decreasing' },
      ],
      correlations: [
        {
          metric1: 'competitor_activity',
          metric2: 'demand_variance',
          correlation: 0.76,
          significance: 0.91,
        },
      ],
      historicalPatterns: [],
    },
    recommendations: [
      {
        id: 'rec-006',
        action: 'Deploy field research team to investigate local factors',
        effort: 'medium',
        impact: 'high',
        timeline: '1 week',
        resources: ['field_team', 'data_analysts'],
        dependencies: ['team_availability'],
        successMetrics: ['root_cause_identification', 'model_accuracy_restoration'],
      },
    ],
    aiModel: {
      name: 'Anomaly Detection Engine',
      version: '2.7.1',
      accuracy: 0.94,
      trainingData: '36 months multi-regional data, anomaly classification training',
    },
  },
  {
    id: 'ai-insight-005',
    type: 'optimization',
    priority: 'medium',
    category: 'performance',
    title: 'Kitchen Efficiency Optimization',
    description: 'AI identifies workflow optimizations for kitchen operations',
    insight:
      'Computer vision analysis of kitchen workflows identifies 12% efficiency improvement potential through optimized station layouts and prep scheduling. Time-motion study shows average 8-minute reduction per order cycle.',
    confidence: 82,
    impact: 'medium',
    urgency: 'this_month',
    dataSource: ['kitchen_cameras', 'order_timestamps', 'staff_schedules', 'workflow_analysis'],
    relatedMetrics: ['prep_time', 'order_completion_time', 'staff_utilization'],
    generatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'new',
    estimatedValue: 85000,
    implementationCost: 20000,
    timeToValue: 45,
    evidence: {
      dataPoints: [
        { metric: 'workflow_efficiency_score', value: 76, trend: 'stable' },
        { metric: 'average_prep_time', value: 24, trend: 'stable' },
        { metric: 'bottleneck_frequency', value: 12, trend: 'increasing' },
      ],
      correlations: [
        {
          metric1: 'station_layout_score',
          metric2: 'efficiency',
          correlation: 0.68,
          significance: 0.85,
        },
      ],
      historicalPatterns: [],
    },
    recommendations: [
      {
        id: 'rec-007',
        action: 'Implement optimized kitchen layout design',
        effort: 'medium',
        impact: 'medium',
        timeline: '6 weeks',
        resources: ['operations_team', 'kitchen_design_consultant'],
        dependencies: ['kitchen_downtime_scheduling'],
        successMetrics: ['prep_time_reduction_15%', 'order_cycle_improvement_8min'],
      },
    ],
    aiModel: {
      name: 'Workflow Optimization Engine',
      version: '1.4.3',
      accuracy: 0.82,
      trainingData: '6 months kitchen video analysis, 50K+ order cycles',
    },
  },
];

const generateNLQueries = (): NaturalLanguageQuery[] => [
  {
    id: 'nlq-001',
    query: 'What was our revenue growth in the South region last month?',
    intent: 'revenue_analysis',
    entities: [
      { type: 'region', value: 'South', confidence: 0.95 },
      { type: 'timeframe', value: 'last month', confidence: 0.92 },
      { type: 'metric', value: 'revenue growth', confidence: 0.98 },
    ],
    response: {
      answer:
        'Revenue in the South region grew by 18.7% last month, reaching ₹24.3L compared to ₹20.5L in the previous month. This growth was driven primarily by new school partnerships in Bangalore (3 schools) and increased premium meal adoption in Chennai schools (34% uptake).',
      visualizations: ['regional_revenue_chart', 'growth_breakdown'],
      followUpQuestions: [
        'Which schools contributed most to this growth?',
        'How does this compare to other regions?',
        'What factors drove the premium meal adoption?',
      ],
      confidence: 0.94,
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'nlq-002',
    query: 'Show me schools with declining satisfaction scores',
    intent: 'satisfaction_analysis',
    entities: [
      { type: 'metric', value: 'satisfaction scores', confidence: 0.97 },
      { type: 'trend', value: 'declining', confidence: 0.89 },
    ],
    response: {
      answer:
        "Currently, 7 schools show declining satisfaction trends over the past 30 days. The most significant declines are: DAV Public School Chennai (-0.4 points to 4.1), St. Mary's Convent (-0.3 points to 4.3), and Ryan International Pune (-0.2 points to 4.5). Common feedback themes include longer wait times and limited vegetarian options.",
      visualizations: ['satisfaction_trend_chart', 'school_comparison'],
      followUpQuestions: [
        'What are the specific complaints from these schools?',
        'How can we improve wait times?',
        'Which vegetarian options should we add?',
      ],
      confidence: 0.91,
    },
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: 'nlq-003',
    query: "Predict next quarter's demand for premium meals",
    intent: 'demand_forecasting',
    entities: [
      { type: 'timeframe', value: 'next quarter', confidence: 0.94 },
      { type: 'product', value: 'premium meals', confidence: 0.96 },
      { type: 'action', value: 'predict', confidence: 0.93 },
    ],
    response: {
      answer:
        'Based on current adoption trends and seasonal patterns, premium meal demand is forecasted to reach 12,450 orders/month by Q2 (confidence: 87%). This represents a 34% increase from current levels. Key drivers include expanding health consciousness (67% growth) and successful pilot programs in tier-1 cities.',
      visualizations: ['demand_forecast_chart', 'driver_analysis'],
      followUpQuestions: [
        'Which regions will see the highest growth?',
        'What capacity do we need for this demand?',
        'How should we adjust pricing?',
      ],
      confidence: 0.87,
    },
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
  },
];

const generateAnomalies = (): AnomalyDetection[] => [
  {
    id: 'anom-001',
    metric: 'daily_revenue',
    detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    severity: 'medium',
    expectedValue: 456000,
    actualValue: 387000,
    deviation: -15.1,
    description:
      'Daily revenue 15.1% below expected range based on historical patterns and current week trends',
    possibleCauses: [
      'Higher than usual student absences',
      'Competing food truck near main schools',
      'Payment system issues reported in afternoon',
      'Popular menu item out of stock',
    ],
    suggestedActions: [
      'Check student attendance records',
      'Investigate payment processing logs',
      'Review inventory status for high-demand items',
      'Monitor competitor activity in the area',
    ],
    context: {
      weekday: 'Tuesday',
      weather: 'Rainy',
      schoolEvents: ['Science fair at DPS Gurgaon'],
      systemIssues: ['Payment gateway latency 2-4 PM'],
    },
  },
  {
    id: 'anom-002',
    metric: 'kitchen_efficiency',
    detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    severity: 'high',
    expectedValue: 87.5,
    actualValue: 72.3,
    deviation: -17.4,
    description:
      'Kitchen efficiency score significantly below normal range, indicating potential operational issues',
    possibleCauses: [
      'Equipment malfunction in prep area',
      'Staff shortage during peak hours',
      'New menu item requiring longer prep time',
      'Supply delivery delays affecting workflow',
    ],
    suggestedActions: [
      'Immediate equipment diagnostics',
      'Check staff scheduling and availability',
      'Review new menu item preparation protocols',
      'Contact suppliers for delivery status',
    ],
    context: {
      peakHours: '11:30 AM - 1:30 PM',
      staffingLevel: '85% of planned',
      equipmentStatus: 'Maintenance overdue on prep station 2',
      newMenuItems: ['Quinoa Buddha Bowl', 'Mediterranean Wrap'],
    },
  },
];

const generatePredictiveModels = (): PredictiveModel[] => [
  {
    id: 'model-001',
    name: 'Student Enrollment Forecaster',
    type: 'time_series',
    target: 'monthly_enrollment',
    features: [
      'historical_enrollment',
      'academic_calendar',
      'demographic_trends',
      'school_performance',
    ],
    accuracy: 0.923,
    precision: 0.917,
    recall: 0.908,
    f1Score: 0.912,
    lastTrained: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dataPoints: 24873,
    status: 'active',
    predictions: [
      { date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), predicted: 1247, confidence: 0.89 },
      { date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), predicted: 1312, confidence: 0.84 },
      { date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), predicted: 1398, confidence: 0.78 },
    ],
  },
  {
    id: 'model-002',
    name: 'Revenue Optimization Engine',
    type: 'regression',
    target: 'daily_revenue',
    features: ['student_count', 'menu_popularity', 'pricing', 'weather', 'events'],
    accuracy: 0.887,
    precision: 0.892,
    recall: 0.881,
    f1Score: 0.887,
    lastTrained: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    dataPoints: 18456,
    status: 'active',
    predictions: [
      { date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), predicted: 478000, confidence: 0.91 },
      { date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), predicted: 512000, confidence: 0.88 },
      { date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), predicted: 495000, confidence: 0.85 },
    ],
  },
  {
    id: 'model-003',
    name: 'Supply Chain Risk Predictor',
    type: 'classification',
    target: 'supply_risk_level',
    features: ['supplier_reliability', 'weather_forecast', 'market_volatility', 'inventory_levels'],
    accuracy: 0.943,
    precision: 0.938,
    recall: 0.947,
    f1Score: 0.942,
    lastTrained: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    dataPoints: 12234,
    status: 'active',
    predictions: [
      { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), predicted: 2.3, confidence: 0.94 },
      { date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), predicted: 3.1, confidence: 0.87 },
      { date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), predicted: 2.8, confidence: 0.82 },
    ],
  },
];

// =====================================================
// AI INSIGHTS PLATFORM COMPONENT
// =====================================================

const AIPoweredInsightsPlatform: React.FC<AIPoweredInsightsPlatformProps> = ({
  className,
  userId,
  userRole,
  onInsightAction,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('insights');
  const [insights, setInsights] = useState<AIInsight[]>(generateAIInsights());
  const [nlQueries, setNLQueries] = useState<NaturalLanguageQuery[]>(generateNLQueries());
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>(generateAnomalies());
  const [models, setModels] = useState<PredictiveModel[]>(generatePredictiveModels());

  // Query state
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryHistory, setQueryHistory] = useState<NaturalLanguageQuery[]>(nlQueries);

  // Filter state
  const [insightFilters, setInsightFilters] = useState({
    priority: 'all',
    category: 'all',
    status: 'all',
    type: 'all',
  });

  // Filtered and sorted insights
  const filteredInsights = useMemo(() => {
    let filtered = insights;

    if (insightFilters.priority !== 'all') {
      filtered = filtered.filter(insight => insight.priority === insightFilters.priority);
    }
    if (insightFilters.category !== 'all') {
      filtered = filtered.filter(insight => insight.category === insightFilters.category);
    }
    if (insightFilters.status !== 'all') {
      filtered = filtered.filter(insight => insight.status === insightFilters.status);
    }
    if (insightFilters.type !== 'all') {
      filtered = filtered.filter(insight => insight.type === insightFilters.type);
    }

    // Sort by priority and confidence
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return filtered.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }, [insights, insightFilters]);

  // AI Query Processing
  const processNaturalLanguageQuery = useCallback(async (query: string) => {
    setIsQuerying(true);

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newQuery: NaturalLanguageQuery = {
        id: `nlq-${Date.now()}`,
        query,
        intent: 'general_analysis',
        entities: [],
        response: {
          answer: `Based on your query "${query}", I found several relevant insights. The data shows positive trends in the requested metrics with 87% confidence. Would you like me to create a detailed visualization or explore specific aspects further?`,
          confidence: 0.87,
          followUpQuestions: [
            'Show me the breakdown by region',
            'What are the key contributing factors?',
            'How does this compare to last year?',
          ],
        },
        timestamp: new Date(),
      };

      setQueryHistory(prev => [newQuery, ...prev.slice(0, 9)]);
      setNaturalLanguageQuery('');
    } catch (error) {
      // Error processing query
    } finally {
      setIsQuerying(false);
    }
  }, []);

  // Insight Actions
  const handleInsightAction = useCallback(
    (insightId: string, action: string) => {
      setInsights(prev =>
        prev.map(insight =>
          insight.id === insightId
            ? { ...insight, status: action as AIInsight['status'], lastUpdated: new Date() }
            : insight
        )
      );
      onInsightAction?.(insightId, action);
    },
    [onInsightAction]
  );

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return Lightbulb;
      case 'alert':
        return AlertTriangle;
      case 'trend':
        return TrendingUp;
      case 'anomaly':
        return AlertCircle;
      case 'opportunity':
        return Target;
      case 'risk':
        return Shield;
      case 'optimization':
        return Zap;
      default:
        return BrainCircuit;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                AI-Powered Insights Platform
              </CardTitle>
              <CardDescription>
                Advanced machine learning insights and natural language analytics
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {models.filter(m => m.status === 'active').length} Active Models
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {insights.filter(i => i.status === 'new').length} New Insights
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Natural Language Query Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Ask AI Assistant
          </CardTitle>
          <CardDescription>
            Ask questions in natural language and get AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., 'What was our revenue growth in the South region last month?'"
              value={naturalLanguageQuery}
              onChange={e => setNaturalLanguageQuery(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter' && naturalLanguageQuery.trim()) {
                  processNaturalLanguageQuery(naturalLanguageQuery);
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={() => processNaturalLanguageQuery(naturalLanguageQuery)}
              disabled={!naturalLanguageQuery.trim() || isQuerying}
            >
              {isQuerying ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Recent Queries */}
          {queryHistory.length > 0 && (
            <div className="mt-4">
              <Label className="text-sm font-medium">Recent Queries</Label>
              <div className="mt-2 space-y-2">
                {queryHistory.slice(0, 3).map(query => (
                  <div key={query.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{query.query}</p>
                        <p className="text-xs text-gray-600 mt-1">{query.response.answer}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(query.response.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    {query.response.followUpQuestions && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {query.response.followUpQuestions.map((q, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs h-6"
                            onClick={() => setNaturalLanguageQuery(q)}
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Anomalies
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Models
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>

                <Select
                  value={insightFilters.priority}
                  onValueChange={value => setInsightFilters(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={insightFilters.category}
                  onValueChange={value => setInsightFilters(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="strategic">Strategic</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="supply_chain">Supply Chain</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={insightFilters.status}
                  onValueChange={value => setInsightFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Insights List */}
          <div className="space-y-4">
            {filteredInsights.map(insight => {
              const TypeIcon = getTypeIcon(insight.type);
              return (
                <Card
                  key={insight.id}
                  className={cn('border-l-4', getPriorityColor(insight.priority))}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn('p-2 rounded-lg', getPriorityColor(insight.priority))}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                            <Badge
                              variant={insight.priority === 'critical' ? 'destructive' : 'outline'}
                            >
                              {insight.priority}
                            </Badge>
                            <Badge variant="outline">{insight.category}</Badge>
                          </div>
                          <CardDescription className="text-sm">
                            {insight.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-xs text-gray-500">
                          <div>Confidence: {insight.confidence}%</div>
                          <div>{insight.urgency}</div>
                        </div>
                        {insight.estimatedValue && (
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Impact</div>
                            <div
                              className={cn(
                                'text-lg font-bold',
                                insight.estimatedValue > 0 ? 'text-green-600' : 'text-red-600'
                              )}
                            >
                              ₹{Math.abs(insight.estimatedValue).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{insight.insight}</p>

                    {/* Evidence Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {insight.evidence.dataPoints.slice(0, 3).map((point, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{point.metric}</span>
                            <div className="flex items-center gap-1">
                              {point.trend === 'increasing' && (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              )}
                              {point.trend === 'decreasing' && (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                              <span className="text-sm font-medium">{point.value}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recommendations */}
                    {insight.recommendations.length > 0 && (
                      <Accordion type="single" collapsible className="mb-4">
                        <AccordionItem value="recommendations">
                          <AccordionTrigger className="text-sm">
                            View Recommendations ({insight.recommendations.length})
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3">
                              {insight.recommendations.map((rec, index) => (
                                <div
                                  key={rec.id}
                                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                                >
                                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{rec.action}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {rec.effort} effort
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {rec.impact} impact
                                      </Badge>
                                      <span className="text-xs text-gray-500">{rec.timeline}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {insight.aiModel.name} v{insight.aiModel.version}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Generated {insight.generatedAt.toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {insight.status === 'new' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInsightAction(insight.id, 'acknowledged')}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                        {insight.status === 'acknowledged' && (
                          <Button
                            size="sm"
                            onClick={() => handleInsightAction(insight.id, 'in_progress')}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start Action
                          </Button>
                        )}
                        {insight.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInsightAction(insight.id, 'resolved')}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Resolved
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {anomalies.map(anomaly => (
              <Card
                key={anomaly.id}
                className={cn(
                  'border-l-4',
                  anomaly.severity === 'critical'
                    ? 'border-red-500'
                    : anomaly.severity === 'high'
                      ? 'border-orange-500'
                      : anomaly.severity === 'medium'
                        ? 'border-yellow-500'
                        : 'border-blue-500'
                )}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">
                        {anomaly.metric.replace('_', ' ').toUpperCase()}
                      </CardTitle>
                      <CardDescription>
                        Detected {anomaly.detectedAt.toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'outline'}>
                      {anomaly.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700">{anomaly.description}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Expected</Label>
                        <p className="text-lg font-bold">
                          {anomaly.expectedValue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Actual</Label>
                        <p className="text-lg font-bold text-red-600">
                          {anomaly.actualValue.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-center p-2 bg-red-50 rounded">
                      <span className="text-sm font-medium text-red-800">
                        {anomaly.deviation > 0 ? '+' : ''}
                        {anomaly.deviation.toFixed(1)}% deviation
                      </span>
                    </div>

                    <Accordion type="single" collapsible>
                      <AccordionItem value="causes">
                        <AccordionTrigger className="text-sm">Possible Causes</AccordionTrigger>
                        <AccordionContent>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {anomaly.possibleCauses.map((cause, index) => (
                              <li key={index}>{cause}</li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="actions">
                        <AccordionTrigger className="text-sm">Suggested Actions</AccordionTrigger>
                        <AccordionContent>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {anomaly.suggestedActions.map((action, index) => (
                              <li key={index}>{action}</li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AI Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {models.map(model => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{model.name}</CardTitle>
                      <CardDescription className="capitalize">{model.type} Model</CardDescription>
                    </div>
                    <Badge
                      variant={model.status === 'active' ? 'default' : 'outline'}
                      className={cn(
                        model.status === 'active' && 'bg-green-100 text-green-800',
                        model.status === 'training' && 'bg-blue-100 text-blue-800',
                        model.status === 'outdated' && 'bg-yellow-100 text-yellow-800',
                        model.status === 'failed' && 'bg-red-100 text-red-800'
                      )}
                    >
                      {model.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Accuracy</Label>
                      <div className="flex items-center gap-2">
                        <Progress value={model.accuracy * 100} className="flex-1 h-2" />
                        <span className="text-sm font-medium">
                          {(model.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">F1 Score</Label>
                      <div className="flex items-center gap-2">
                        <Progress value={model.f1Score * 100} className="flex-1 h-2" />
                        <span className="text-sm font-medium">
                          {(model.f1Score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>
                      Target: <span className="font-medium">{model.target}</span>
                    </p>
                    <p>Features: {model.features.length}</p>
                    <p>Data Points: {model.dataPoints.toLocaleString()}</p>
                    <p>Last Trained: {model.lastTrained.toLocaleDateString()}</p>
                  </div>

                  {model.predictions.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Recent Predictions</Label>
                      <div className="mt-2 space-y-2">
                        {model.predictions.slice(0, 3).map((prediction, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <span className="text-xs text-gray-500">
                              {prediction.date.toLocaleDateString()}
                            </span>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {prediction.predicted.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(prediction.confidence * 100).toFixed(0)}% confidence
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Insights Reports</CardTitle>
              <CardDescription>
                Generate comprehensive reports based on AI insights and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Executive Summary',
                    description: 'High-level insights and recommendations',
                    icon: Crown,
                  },
                  {
                    title: 'Operational Intelligence',
                    description: 'Kitchen and supply chain insights',
                    icon: ChefHat,
                  },
                  {
                    title: 'Financial Analytics',
                    description: 'Revenue optimization and cost analysis',
                    icon: DollarSign,
                  },
                  {
                    title: 'Customer Insights',
                    description: 'Student behavior and satisfaction analysis',
                    icon: Users,
                  },
                  {
                    title: 'Performance Metrics',
                    description: 'KPI analysis and trend reports',
                    icon: BarChart3,
                  },
                  {
                    title: 'Risk Assessment',
                    description: 'Supply chain and operational risk analysis',
                    icon: Shield,
                  },
                ].map((report, index) => {
                  const Icon = report.icon;
                  return (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Icon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                          <h3 className="font-medium mb-2">{report.title}</h3>
                          <p className="text-xs text-gray-600 mb-4">{report.description}</p>
                          <Button size="sm" className="w-full">
                            <Download className="h-3 w-3 mr-1" />
                            Generate
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIPoweredInsightsPlatform;
