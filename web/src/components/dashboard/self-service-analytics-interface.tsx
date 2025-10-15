'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  RadialBarChart,
  RadialBar,
  Treemap,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  Save,
  Download,
  Share2,
  Copy,
  Eye,
  EyeOff,
  Filter,
  Search,
  RefreshCw,
  Calendar,
  Clock,
  Users,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart3,
  TrendingUp,
  Activity,
  Settings,
  Palette,
  Grid,
  Mouse,
  Smartphone,
  Monitor,
  Tablet,
  FileText,
  Presentation,
  Image,
  Code,
  Database,
  Globe,
  Star,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Send,
  Bot,
  Sparkles,
  Target,
  Gauge,
  Award,
  Shield,
  ChefHat,
  Truck,
  Heart,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  SkipForward,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// SELF-SERVICE ANALYTICS INTERFACES
// =====================================================

interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'metric' | 'text' | 'filter' | 'custom';
  title: string;
  description?: string;
  position: { x: number; y: number; w: number; h: number };
  config: {
    dataSource: string;
    visualization: string;
    metrics: string[];
    dimensions: string[];
    filters: unknown[];
    styling: {
      theme: string;
      colors: string[];
      showLegend: boolean;
      showAxes: boolean;
    };
    interactivity: {
      drillDown: boolean;
      crossFilter: boolean;
      tooltip: boolean;
    };
  };
  data?: unknown[];
  lastUpdated: Date;
  refreshRate: number; // minutes
}

interface CustomDashboard {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'operational' | 'financial' | 'custom';
  visibility: 'private' | 'shared' | 'public';
  widgets: DashboardWidget[];
  layout: 'grid' | 'masonry' | 'flow';
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  tags: string[];
  permissions: {
    view: string[];
    edit: string[];
    share: string[];
  };
}

interface QueryBuilder {
  dataSource: string;
  selectFields: string[];
  groupBy: string[];
  aggregations: Array<{
    field: string;
    function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct';
    alias?: string;
  }>;
  filters: Array<{
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'like' | 'between';
    value: unknown;
    logical?: 'AND' | 'OR';
  }>;
  sorting: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
}

interface ScheduledReport {
  id: string;
  name: string;
  dashboard: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;
    timezone: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  recipients: Array<{
    email: string;
    name: string;
    role: string;
  }>;
  format: 'pdf' | 'excel' | 'email' | 'link';
  active: boolean;
  lastSent?: Date;
  nextSend: Date;
}

interface SelfServiceAnalyticsInterfaceProps {
  className?: string;
  userId?: string;
  userRole?: string;
  availableDataSources?: string[];
  onDashboardSave?: (dashboard: CustomDashboard) => void;
  onReportSchedule?: (report: ScheduledReport) => void;
}

// =====================================================
// MOCK DATA
// =====================================================

const mockDataSources = [
  { id: 'students', name: 'Student Data', tables: ['enrollments', 'demographics', 'preferences'] },
  { id: 'orders', name: 'Order History', tables: ['orders', 'order_items', 'payments'] },
  { id: 'kitchen', name: 'Kitchen Operations', tables: ['production', 'inventory', 'efficiency'] },
  { id: 'suppliers', name: 'Supply Chain', tables: ['suppliers', 'deliveries', 'costs'] },
  { id: 'feedback', name: 'Feedback & Reviews', tables: ['ratings', 'comments', 'surveys'] },
  { id: 'finance', name: 'Financial Data', tables: ['revenue', 'costs', 'budgets'] },
];

const mockFields = {
  students: ['student_id', 'name', 'grade', 'school_id', 'dietary_preferences', 'enrollment_date'],
  orders: ['order_id', 'student_id', 'meal_type', 'amount', 'order_date', 'status'],
  kitchen: ['production_id', 'meal_type', 'quantity', 'prep_time', 'efficiency_score'],
  suppliers: ['supplier_id', 'name', 'delivery_date', 'items', 'cost', 'quality_score'],
  feedback: ['feedback_id', 'student_id', 'rating', 'comment', 'category', 'date'],
  finance: ['transaction_id', 'type', 'amount', 'date', 'category', 'school_id'],
};

const mockDashboards: CustomDashboard[] = [
  {
    id: 'exec-overview',
    name: 'Executive Overview',
    description: 'High-level KPIs and performance metrics for leadership team',
    category: 'executive',
    visibility: 'shared',
    widgets: [
      {
        id: 'total-revenue',
        type: 'kpi',
        title: 'Total Revenue',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {
          dataSource: 'finance',
          visualization: 'kpi',
          metrics: ['revenue'],
          dimensions: [],
          filters: [],
          styling: { theme: 'blue', colors: ['#3B82F6'], showLegend: false, showAxes: false },
          interactivity: { drillDown: true, crossFilter: false, tooltip: true },
        },
        lastUpdated: new Date(),
        refreshRate: 15,
      },
      {
        id: 'student-satisfaction',
        type: 'chart',
        title: 'Student Satisfaction Trend',
        position: { x: 3, y: 0, w: 6, h: 4 },
        config: {
          dataSource: 'feedback',
          visualization: 'line',
          metrics: ['rating'],
          dimensions: ['date'],
          filters: [],
          styling: { theme: 'green', colors: ['#10B981'], showLegend: true, showAxes: true },
          interactivity: { drillDown: true, crossFilter: true, tooltip: true },
        },
        lastUpdated: new Date(),
        refreshRate: 30,
      },
    ],
    layout: 'grid',
    createdBy: 'admin',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastModified: new Date(Date.now() - 1 * 60 * 60 * 1000),
    tags: ['executive', 'overview', 'kpi'],
    permissions: {
      view: ['admin', 'manager', 'analyst'],
      edit: ['admin'],
      share: ['admin', 'manager'],
    },
  },
];

// =====================================================
// WIDGET TEMPLATES
// =====================================================

const widgetTemplates = [
  {
    id: 'revenue-kpi',
    name: 'Revenue KPI',
    type: 'kpi',
    icon: DollarSign,
    description: 'Display key revenue metrics with trend indicators',
    defaultConfig: {
      dataSource: 'finance',
      visualization: 'kpi',
      metrics: ['revenue'],
      dimensions: [],
      styling: { theme: 'green', colors: ['#10B981'], showLegend: false, showAxes: false },
    },
  },
  {
    id: 'satisfaction-chart',
    name: 'Satisfaction Trend',
    type: 'chart',
    icon: TrendingUp,
    description: 'Line chart showing satisfaction scores over time',
    defaultConfig: {
      dataSource: 'feedback',
      visualization: 'line',
      metrics: ['rating'],
      dimensions: ['date'],
      styling: { theme: 'blue', colors: ['#3B82F6'], showLegend: true, showAxes: true },
    },
  },
  {
    id: 'regional-pie',
    name: 'Regional Distribution',
    type: 'chart',
    icon: PieChartIcon,
    description: 'Pie chart showing distribution across regions',
    defaultConfig: {
      dataSource: 'students',
      visualization: 'pie',
      metrics: ['count'],
      dimensions: ['region'],
      styling: {
        theme: 'multi',
        colors: ['#3B82F6', '#10B981', '#F59E0B'],
        showLegend: true,
        showAxes: false,
      },
    },
  },
  {
    id: 'performance-gauge',
    name: 'Performance Gauge',
    type: 'metric',
    icon: Gauge,
    description: 'Gauge chart for performance metrics',
    defaultConfig: {
      dataSource: 'kitchen',
      visualization: 'gauge',
      metrics: ['efficiency_score'],
      dimensions: [],
      styling: { theme: 'orange', colors: ['#F59E0B'], showLegend: false, showAxes: false },
    },
  },
  {
    id: 'data-table',
    name: 'Data Table',
    type: 'table',
    icon: Grid,
    description: 'Tabular display of filtered data',
    defaultConfig: {
      dataSource: 'orders',
      visualization: 'table',
      metrics: ['amount'],
      dimensions: ['student_id', 'meal_type', 'order_date'],
      styling: { theme: 'minimal', colors: [], showLegend: false, showAxes: false },
    },
  },
];

// =====================================================
// SELF-SERVICE ANALYTICS COMPONENT
// =====================================================

const SelfServiceAnalyticsInterface: React.FC<SelfServiceAnalyticsInterfaceProps> = ({
  className,
  userId = 'user-001',
  userRole = 'analyst',
  availableDataSources = mockDataSources.map(ds => ds.id),
  onDashboardSave,
  onReportSchedule,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('builder');
  const [dashboards, setDashboards] = useState<CustomDashboard[]>(mockDashboards);
  const [selectedDashboard, setSelectedDashboard] = useState<CustomDashboard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showWidgetPalette, setShowWidgetPalette] = useState(false);

  // Dashboard builder state
  const [newDashboard, setNewDashboard] = useState<Partial<CustomDashboard>>({
    name: '',
    description: '',
    category: 'custom',
    visibility: 'private',
    widgets: [],
    layout: 'grid',
    tags: [],
  });

  // Query builder state
  const [queryBuilder, setQueryBuilder] = useState<QueryBuilder>({
    dataSource: '',
    selectFields: [],
    groupBy: [],
    aggregations: [],
    filters: [],
    sorting: [],
    limit: 100,
  });

  // Widget configuration state
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
  const [widgetConfigOpen, setWidgetConfigOpen] = useState(false);

  // Scheduled reports state
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [newReport, setNewReport] = useState<Partial<ScheduledReport>>({
    name: '',
    schedule: {
      frequency: 'weekly',
      time: '09:00',
      timezone: 'Asia/Kolkata',
    },
    recipients: [],
    format: 'pdf',
    active: true,
  });

  // Natural language query state
  const [nlQuery, setNlQuery] = useState('');
  const [nlResult, setNlResult] = useState<unknown>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  // Filter available data sources
  const filteredDataSources = useMemo(() => {
    return mockDataSources.filter(ds => availableDataSources.includes(ds.id));
  }, [availableDataSources]);

  // Create new widget
  const createWidget = useCallback(
    (template: (typeof widgetTemplates)[0]) => {
      const newWidget: DashboardWidget = {
        id: `widget-${Date.now()}`,
        type: template.type as AnalyticsTemplate['type'],
        title: template.name,
        description: template.description,
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {
          ...template.defaultConfig,
          filters: [],
          interactivity: { drillDown: false, crossFilter: false, tooltip: true },
        },
        lastUpdated: new Date(),
        refreshRate: 30,
      };

      if (selectedDashboard) {
        const updatedDashboard = {
          ...selectedDashboard,
          widgets: [...selectedDashboard.widgets, newWidget],
          lastModified: new Date(),
        };
        setSelectedDashboard(updatedDashboard);
        setDashboards(prev =>
          prev.map(d => (d.id === selectedDashboard.id ? updatedDashboard : d))
        );
      }

      setShowWidgetPalette(false);
    },
    [selectedDashboard]
  );

  // Update widget configuration
  const updateWidget = useCallback(
    (widgetId: string, updates: Partial<DashboardWidget>) => {
      if (!selectedDashboard) return;

      const updatedDashboard = {
        ...selectedDashboard,
        widgets: selectedDashboard.widgets.map(w =>
          w.id === widgetId ? { ...w, ...updates, lastUpdated: new Date() } : w
        ),
        lastModified: new Date(),
      };

      setSelectedDashboard(updatedDashboard);
      setDashboards(prev => prev.map(d => (d.id === selectedDashboard.id ? updatedDashboard : d)));
    },
    [selectedDashboard]
  );

  // Delete widget
  const deleteWidget = useCallback(
    (widgetId: string) => {
      if (!selectedDashboard) return;

      const updatedDashboard = {
        ...selectedDashboard,
        widgets: selectedDashboard.widgets.filter(w => w.id !== widgetId),
        lastModified: new Date(),
      };

      setSelectedDashboard(updatedDashboard);
      setDashboards(prev => prev.map(d => (d.id === selectedDashboard.id ? updatedDashboard : d)));
    },
    [selectedDashboard]
  );

  // Save dashboard
  const saveDashboard = useCallback(() => {
    if (!selectedDashboard) return;

    onDashboardSave?.(selectedDashboard);
    setIsEditing(false);
  }, [selectedDashboard, onDashboardSave]);

  // Process natural language query
  const processNLQuery = useCallback(async (query: string) => {
    setIsQuerying(true);

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock result based on query
      const result = {
        interpretation: `Analyzing: "${query}"`,
        suggestedVisualization: 'bar',
        dataSource: 'orders',
        metrics: ['amount'],
        dimensions: ['meal_type'],
        filters: [],
        confidence: 0.87,
      };

      setNlResult(result);
    } catch (error) {
      // Error processing NL query
    } finally {
      setIsQuerying(false);
    }
  }, []);

  // Generate mock data for widget
  const generateMockData = useCallback((widget: DashboardWidget) => {
    // Generate appropriate mock data based on widget configuration
    switch (widget.config.visualization) {
      case 'kpi':
        return [{ value: 1247850, change: 12.4, trend: 'up' }];
      case 'line':
        return Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2024, i, 1).toLocaleDateString('en', { month: 'short' }),
          value: 400 + Math.random() * 200,
        }));
      case 'pie':
        return [
          { name: 'North', value: 35 },
          { name: 'South', value: 28 },
          { name: 'West', value: 22 },
          { name: 'East', value: 15 },
        ];
      case 'bar':
        return Array.from({ length: 6 }, (_, i) => ({
          category: `Item ${i + 1}`,
          value: 100 + Math.random() * 150,
        }));
      default:
        return [];
    }
  }, []);

  // Render widget content
  const renderWidget = useCallback(
    (widget: DashboardWidget) => {
      const data = generateMockData(widget);

      switch (widget.config.visualization) {
        case 'kpi': {
          const kpiData = data[0];
          return (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-3xl font-bold text-blue-600">
                ₹{kpiData.value.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-3 w-3" />+{kpiData.change}%
              </div>
            </div>
          );
        }

        case 'line':
          return (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          );

        case 'pie':
          return (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={widget.config.styling.colors[index] || '#3B82F6'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          );

        case 'bar':
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          );

        default:
          return (
            <div className="flex items-center justify-center h-full text-gray-500">
              No visualization configured
            </div>
          );
      }
    },
    [generateMockData]
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-6 w-6 text-indigo-600" />
                Self-Service Analytics
              </CardTitle>
              <CardDescription>
                Build custom dashboards and reports with drag-and-drop interface
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{dashboards.length} Dashboards</Badge>
              <Badge variant="outline">{scheduledReports.length} Scheduled Reports</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Dashboard Builder
          </TabsTrigger>
          <TabsTrigger value="query" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Query Builder
          </TabsTrigger>
          <TabsTrigger value="nl-query" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Natural Language
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Scheduled Reports
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Gallery
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Builder */}
        <TabsContent value="builder" className="space-y-6">
          <div className="flex gap-6">
            {/* Dashboard List Sidebar */}
            <div className="w-80 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">My Dashboards</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-3 w-3 mr-1" />
                          New
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Dashboard</DialogTitle>
                          <DialogDescription>
                            Set up a new custom dashboard for your analytics needs
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Dashboard Name</Label>
                            <Input
                              placeholder="e.g., Executive Overview"
                              value={newDashboard.name}
                              onChange={e =>
                                setNewDashboard(prev => ({ ...prev, name: e.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              placeholder="Brief description of the dashboard purpose"
                              value={newDashboard.description}
                              onChange={e =>
                                setNewDashboard(prev => ({ ...prev, description: e.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <Label>Category</Label>
                            <Select
                              value={newDashboard.category}
                              onValueChange={value =>
                                setNewDashboard(prev => ({
                                  ...prev,
                                  category: value as Dashboard['category'],
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="executive">Executive</SelectItem>
                                <SelectItem value="operational">Operational</SelectItem>
                                <SelectItem value="financial">Financial</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Visibility</Label>
                            <RadioGroup
                              value={newDashboard.visibility}
                              onValueChange={value =>
                                setNewDashboard(prev => ({
                                  ...prev,
                                  visibility: value as Dashboard['visibility'],
                                }))
                              }
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="private" id="private" />
                                <Label htmlFor="private">Private (Only me)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="shared" id="shared" />
                                <Label htmlFor="shared">Shared (My team)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="public" id="public" />
                                <Label htmlFor="public">Public (All users)</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => {
                              const dashboard: CustomDashboard = {
                                id: `dashboard-${Date.now()}`,
                                name: newDashboard.name || 'Untitled Dashboard',
                                description: newDashboard.description || '',
                                category: newDashboard.category || 'custom',
                                visibility: newDashboard.visibility || 'private',
                                widgets: [],
                                layout: 'grid',
                                createdBy: userId,
                                createdAt: new Date(),
                                lastModified: new Date(),
                                tags: [],
                                permissions: {
                                  view: [userId],
                                  edit: [userId],
                                  share: [userId],
                                },
                              };
                              setDashboards(prev => [...prev, dashboard]);
                              setSelectedDashboard(dashboard);
                              setNewDashboard({
                                name: '',
                                description: '',
                                category: 'custom',
                                visibility: 'private',
                                widgets: [],
                                layout: 'grid',
                                tags: [],
                              });
                            }}
                          >
                            Create Dashboard
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {dashboards.map(dashboard => (
                        <Card
                          key={dashboard.id}
                          className={cn(
                            'cursor-pointer transition-colors hover:bg-gray-50',
                            selectedDashboard?.id === dashboard.id && 'ring-2 ring-blue-500'
                          )}
                          onClick={() => setSelectedDashboard(dashboard)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{dashboard.name}</h4>
                                <p className="text-xs text-gray-600 mt-1">
                                  {dashboard.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {dashboard.category}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {dashboard.widgets.length} widgets
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedDashboard(dashboard);
                                    setIsEditing(true);
                                  }}
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Dashboard</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{dashboard.name}"? This
                                        action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          setDashboards(prev =>
                                            prev.filter(d => d.id !== dashboard.id)
                                          );
                                          if (selectedDashboard?.id === dashboard.id) {
                                            setSelectedDashboard(null);
                                          }
                                        }}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Canvas */}
            <div className="flex-1">
              {selectedDashboard ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{selectedDashboard.name}</CardTitle>
                        <CardDescription>{selectedDashboard.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowWidgetPalette(true)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Widget
                            </Button>
                            <Button size="sm" onClick={saveDashboard}>
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(!isEditing)}
                        >
                          {isEditing ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </>
                          ) : (
                            <>
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-12 gap-4 min-h-96">
                      {selectedDashboard.widgets.length === 0 ? (
                        <div className="col-span-12 flex flex-col items-center justify-center py-12">
                          <Layers className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets yet</h3>
                          <p className="text-gray-600 mb-4">
                            Start building your dashboard by adding widgets
                          </p>
                          <Button onClick={() => setShowWidgetPalette(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Widget
                          </Button>
                        </div>
                      ) : (
                        selectedDashboard.widgets.map(widget => (
                          <Card
                            key={widget.id}
                            className={cn('relative group', `col-span-${widget.position.w}`)}
                            style={{ minHeight: `${widget.position.h * 100}px` }}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-sm">{widget.title}</CardTitle>
                                  {widget.description && (
                                    <CardDescription className="text-xs">
                                      {widget.description}
                                    </CardDescription>
                                  )}
                                </div>
                                {isEditing && (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        setSelectedWidget(widget);
                                        setWidgetConfigOpen(true);
                                      }}
                                    >
                                      <Settings className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => deleteWidget(widget.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent
                              className="pt-0"
                              style={{ height: `${widget.position.h * 100 - 80}px` }}
                            >
                              {renderWidget(widget)}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-96">
                  <CardContent className="flex flex-col items-center justify-center h-full">
                    <Layers className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Dashboard</h3>
                    <p className="text-gray-600">
                      Choose a dashboard from the sidebar to start editing
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Widget Palette */}
          <Sheet open={showWidgetPalette} onOpenChange={setShowWidgetPalette}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Widget Palette</SheetTitle>
                <SheetDescription>
                  Choose from pre-built widget templates to add to your dashboard
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                <div className="grid grid-cols-1 gap-4">
                  {widgetTemplates.map(template => {
                    const Icon = template.icon;
                    return (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => createWidget(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Icon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{template.name}</h4>
                              <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                              <Badge variant="outline" className="text-xs mt-2">
                                {template.type}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Widget Configuration */}
          <Dialog open={widgetConfigOpen} onOpenChange={setWidgetConfigOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configure Widget</DialogTitle>
                <DialogDescription>
                  Customize the appearance and data source for your widget
                </DialogDescription>
              </DialogHeader>
              {selectedWidget && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={selectedWidget.title}
                        onChange={e => updateWidget(selectedWidget.id, { title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Visualization Type</Label>
                      <Select
                        value={selectedWidget.config.visualization}
                        onValueChange={value =>
                          updateWidget(selectedWidget.id, {
                            config: { ...selectedWidget.config, visualization: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kpi">KPI</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                          <SelectItem value="gauge">Gauge</SelectItem>
                          <SelectItem value="table">Table</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Data Source</Label>
                    <Select
                      value={selectedWidget.config.dataSource}
                      onValueChange={value =>
                        updateWidget(selectedWidget.id, {
                          config: { ...selectedWidget.config, dataSource: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDataSources.map(ds => (
                          <SelectItem key={ds.id} value={ds.id}>
                            {ds.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Color Theme</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {[
                        { name: 'blue', color: '#3B82F6' },
                        { name: 'green', color: '#10B981' },
                        { name: 'orange', color: '#F59E0B' },
                        { name: 'purple', color: '#8B5CF6' },
                      ].map(theme => (
                        <Button
                          key={theme.name}
                          variant="outline"
                          className={cn(
                            'h-8',
                            selectedWidget.config.styling.theme === theme.name &&
                              'ring-2 ring-blue-500'
                          )}
                          onClick={() =>
                            updateWidget(selectedWidget.id, {
                              config: {
                                ...selectedWidget.config,
                                styling: {
                                  ...selectedWidget.config.styling,
                                  theme: theme.name,
                                  colors: [theme.color],
                                },
                              },
                            })
                          }
                        >
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: theme.color }}
                          />
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-legend"
                        checked={selectedWidget.config.styling.showLegend}
                        onCheckedChange={checked =>
                          updateWidget(selectedWidget.id, {
                            config: {
                              ...selectedWidget.config,
                              styling: { ...selectedWidget.config.styling, showLegend: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="show-legend">Show Legend</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enable-tooltip"
                        checked={selectedWidget.config.interactivity.tooltip}
                        onCheckedChange={checked =>
                          updateWidget(selectedWidget.id, {
                            config: {
                              ...selectedWidget.config,
                              interactivity: {
                                ...selectedWidget.config.interactivity,
                                tooltip: !!checked,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="enable-tooltip">Enable Tooltips</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enable-drilldown"
                        checked={selectedWidget.config.interactivity.drillDown}
                        onCheckedChange={checked =>
                          updateWidget(selectedWidget.id, {
                            config: {
                              ...selectedWidget.config,
                              interactivity: {
                                ...selectedWidget.config.interactivity,
                                drillDown: !!checked,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="enable-drilldown">Enable Drill Down</Label>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setWidgetConfigOpen(false)}>Done</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Query Builder */}
        <TabsContent value="query" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visual Query Builder</CardTitle>
              <CardDescription>Build custom queries with a visual interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Query Builder Coming Soon
                </h3>
                <p className="text-gray-600 mb-6">
                  Visual drag-and-drop query builder for advanced data analysis
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Visual Query Builder
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    SQL Generation
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Join Multiple Tables
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Advanced Filtering
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Natural Language Query */}
        <TabsContent value="nl-query" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                Natural Language Analytics
              </CardTitle>
              <CardDescription>
                Ask questions in plain English and get instant visualizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., 'Show me revenue by region for last quarter'"
                    value={nlQuery}
                    onChange={e => setNlQuery(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter' && nlQuery.trim()) {
                        processNLQuery(nlQuery);
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => processNLQuery(nlQuery)}
                    disabled={!nlQuery.trim() || isQuerying}
                  >
                    {isQuerying ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    'Show revenue trend by month',
                    'Top 5 schools by student count',
                    'Average satisfaction score by region',
                    'Kitchen efficiency this quarter',
                  ].map(suggestion => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => setNlQuery(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>

                {nlResult && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-base">Query Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">{nlResult.interpretation}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{nlResult.suggestedVisualization}</Badge>
                            <Badge variant="outline">
                              {Math.round(nlResult.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Data Source</Label>
                            <p className="text-sm text-gray-600">{nlResult.dataSource}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Metrics</Label>
                            <p className="text-sm text-gray-600">{nlResult.metrics.join(', ')}</p>
                          </div>
                        </div>

                        <Button size="sm">
                          <Plus className="h-3 w-3 mr-1" />
                          Add to Dashboard
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Reports */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scheduled Reports</CardTitle>
                  <CardDescription>Automate report generation and distribution</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule New Report</DialogTitle>
                      <DialogDescription>
                        Set up automated report generation and delivery
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Report Name</Label>
                        <Input placeholder="e.g., Weekly Executive Summary" />
                      </div>
                      <div>
                        <Label>Dashboard</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select dashboard" />
                          </SelectTrigger>
                          <SelectContent>
                            {dashboards.map(dashboard => (
                              <SelectItem key={dashboard.id} value={dashboard.id}>
                                {dashboard.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Frequency</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Format</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="excel">Excel</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="link">Dashboard Link</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Recipients</Label>
                        <Textarea placeholder="Enter email addresses, one per line" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button>Schedule Report</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {scheduledReports.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Reports</h3>
                  <p className="text-gray-600 mb-4">
                    Create automated reports to keep stakeholders informed
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Name</TableHead>
                      <TableHead>Dashboard</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Next Send</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledReports.map(report => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>{report.dashboard}</TableCell>
                        <TableCell className="capitalize">{report.schedule.frequency}</TableCell>
                        <TableCell>{report.recipients.length} recipients</TableCell>
                        <TableCell>{report.nextSend.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={report.active ? 'default' : 'outline'}>
                            {report.active ? 'Active' : 'Paused'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost">
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery */}
        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Gallery</CardTitle>
              <CardDescription>
                Browse pre-built dashboard templates and community contributions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Gallery Coming Soon</h3>
                <p className="text-gray-600 mb-6">
                  Discover and share dashboard templates with the community
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Featured Templates
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Community Shared
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-green-500" />
                    One-Click Import
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SelfServiceAnalyticsInterface;
