'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Database,
  Globe,
  Zap,
  Shield,
  Key,
  Webhook,
  Code,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Settings,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Play,
  Pause,
  SkipForward,
  Server,
  Cloud,
  Smartphone,
  Monitor,
  Tablet,
  Router,
  Wifi,
  Lock,
  Unlock,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Send,
  ArrowUpDown,
  ArrowDownUp,
  BarChart3,
  LineChart3,
  Target,
  Gauge,
  Heart,
  Cpu,
  HardDrive,
  Network,
  Archive,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// INTEGRATION & API INTERFACES
// =====================================================

interface APIEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  description: string;
  category: 'data' | 'analytics' | 'insights' | 'reports' | 'admin';
  version: string;
  status: 'active' | 'deprecated' | 'beta' | 'maintenance';
  authentication: 'none' | 'api_key' | 'oauth' | 'jwt' | 'basic';
  rateLimit: {
    requests: number;
    window: string; // e.g., '1h', '1d'
  };
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required: boolean;
    description: string;
    example: unknown;
  }>;
  response: {
    schema: unknown;
    example: unknown;
  };
  usage: {
    calls: number;
    errors: number;
    avgResponseTime: number;
    lastUsed: Date;
  };
}

interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'stream' | 'warehouse';
  provider: string;
  connectionString?: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: Date;
  syncFrequency: 'realtime' | '5min' | '15min' | '1h' | '6h' | '1d';
  dataSize: number; // MB
  tableCount?: number;
  recordCount?: number;
  health: {
    uptime: number; // percentage
    latency: number; // ms
    errorRate: number; // percentage
  };
  configuration: {
    autoRetry: boolean;
    timeout: number;
    batchSize: number;
    compression: boolean;
  };
}

interface ThirdPartyIntegration {
  id: string;
  name: string;
  provider: string;
  type: 'analytics' | 'visualization' | 'alerting' | 'reporting' | 'storage';
  description: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  version: string;
  apiKey?: string;
  webhook?: string;
  configuration: Record<string, unknown>;
  capabilities: string[];
  lastSync: Date;
  dataFlow: 'inbound' | 'outbound' | 'bidirectional';
  usage: {
    dataTransferred: number; // MB
    apiCalls: number;
    webhookDeliveries: number;
    errors: number;
  };
}

interface WebhookSubscription {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'failed';
  secret?: string;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  headers: Record<string, string>;
  deliveries: Array<{
    id: string;
    timestamp: Date;
    event: string;
    status: 'success' | 'failed' | 'pending';
    responseCode?: number;
    responseTime?: number;
    attempts: number;
  }>;
  lastDelivery?: Date;
  successRate: number;
}

interface RealTimeStream {
  id: string;
  name: string;
  source: string;
  type: 'kafka' | 'websocket' | 'sse' | 'pubsub';
  status: 'active' | 'inactive' | 'error';
  messageRate: number; // messages per second
  lag: number; // ms
  consumers: number;
  retentionPeriod: string; // e.g., '7d'
  partitions?: number;
  compression: 'none' | 'gzip' | 'snappy' | 'lz4';
  metrics: {
    messagesProduced: number;
    messagesConsumed: number;
    bytesProduced: number;
    bytesConsumed: number;
    errors: number;
  };
}

interface SecurityPolicy {
  id: string;
  name: string;
  type: 'authentication' | 'authorization' | 'encryption' | 'access_control';
  description: string;
  enabled: boolean;
  rules: Array<{
    condition: string;
    action: 'allow' | 'deny' | 'log';
    priority: number;
  }>;
  appliedTo: string[];
  lastModified: Date;
  violations: number;
}

interface IntegrationAPILayerProps {
  className?: string;
  userRole?: string;
  onAPIKeyGenerate?: (key: string) => void;
  onWebhookCreate?: (webhook: WebhookSubscription) => void;
  onDataSourceConnect?: (source: DataSource) => void;
}

// =====================================================
// MOCK DATA
// =====================================================

const mockAPIEndpoints: APIEndpoint[] = [
  {
    id: 'api-001',
    name: 'Get Dashboard Data',
    method: 'GET',
    endpoint: '/api/v1/dashboards/{id}/data',
    description: 'Retrieve real-time data for a specific dashboard',
    category: 'data',
    version: 'v1.2.3',
    status: 'active',
    authentication: 'api_key',
    rateLimit: { requests: 1000, window: '1h' },
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Dashboard ID',
        example: 'dash-001',
      },
      {
        name: 'timeRange',
        type: 'string',
        required: false,
        description: 'Time range filter',
        example: '7d',
      },
      {
        name: 'filters',
        type: 'object',
        required: false,
        description: 'Additional filters',
        example: { school: 'school-001' },
      },
    ],
    response: {
      schema: { type: 'object', properties: { data: { type: 'array' }, meta: { type: 'object' } } },
      example: {
        data: [{ metric: 'revenue', value: 125000 }],
        meta: { count: 1, lastUpdated: '2024-01-15T10:30:00Z' },
      },
    },
    usage: {
      calls: 15643,
      errors: 23,
      avgResponseTime: 156,
      lastUsed: new Date(Date.now() - 5 * 60 * 1000),
    },
  },
  {
    id: 'api-002',
    name: 'Create AI Insight',
    method: 'POST',
    endpoint: '/api/v1/insights',
    description: 'Generate new AI-powered insights from data',
    category: 'insights',
    version: 'v2.1.0',
    status: 'active',
    authentication: 'oauth',
    rateLimit: { requests: 100, window: '1h' },
    parameters: [
      {
        name: 'dataSource',
        type: 'string',
        required: true,
        description: 'Data source identifier',
        example: 'orders',
      },
      {
        name: 'analysisType',
        type: 'string',
        required: true,
        description: 'Type of analysis',
        example: 'trend',
      },
      {
        name: 'timeFrame',
        type: 'string',
        required: false,
        description: 'Analysis time frame',
        example: '30d',
      },
    ],
    response: {
      schema: {
        type: 'object',
        properties: { insight: { type: 'object' }, confidence: { type: 'number' } },
      },
      example: {
        insight: { type: 'opportunity', title: 'Revenue Growth Potential' },
        confidence: 0.87,
      },
    },
    usage: {
      calls: 2847,
      errors: 12,
      avgResponseTime: 2340,
      lastUsed: new Date(Date.now() - 15 * 60 * 1000),
    },
  },
  {
    id: 'api-003',
    name: 'Export Report',
    method: 'POST',
    endpoint: '/api/v1/reports/export',
    description: 'Export dashboard or custom report in various formats',
    category: 'reports',
    version: 'v1.1.5',
    status: 'active',
    authentication: 'jwt',
    rateLimit: { requests: 50, window: '1h' },
    parameters: [
      {
        name: 'reportId',
        type: 'string',
        required: true,
        description: 'Report or dashboard ID',
        example: 'report-001',
      },
      {
        name: 'format',
        type: 'string',
        required: true,
        description: 'Export format',
        example: 'pdf',
      },
      {
        name: 'parameters',
        type: 'object',
        required: false,
        description: 'Report parameters',
        example: { dateRange: '30d' },
      },
    ],
    response: {
      schema: {
        type: 'object',
        properties: { downloadUrl: { type: 'string' }, expiresAt: { type: 'string' } },
      },
      example: {
        downloadUrl: 'https://api.hasivu.com/downloads/report-123.pdf',
        expiresAt: '2024-01-15T18:00:00Z',
      },
    },
    usage: {
      calls: 892,
      errors: 5,
      avgResponseTime: 4560,
      lastUsed: new Date(Date.now() - 45 * 60 * 1000),
    },
  },
];

const mockDataSources: DataSource[] = [
  {
    id: 'ds-001',
    name: 'PostgreSQL Production DB',
    type: 'database',
    provider: 'PostgreSQL',
    status: 'connected',
    lastSync: new Date(Date.now() - 2 * 60 * 1000),
    syncFrequency: 'realtime',
    dataSize: 2847,
    tableCount: 34,
    recordCount: 1250000,
    health: { uptime: 99.8, latency: 45, errorRate: 0.02 },
    configuration: { autoRetry: true, timeout: 30000, batchSize: 1000, compression: true },
  },
  {
    id: 'ds-002',
    name: 'Analytics Data Warehouse',
    type: 'warehouse',
    provider: 'Snowflake',
    status: 'connected',
    lastSync: new Date(Date.now() - 15 * 60 * 1000),
    syncFrequency: '15min',
    dataSize: 15600,
    tableCount: 128,
    recordCount: 8450000,
    health: { uptime: 99.95, latency: 234, errorRate: 0.01 },
    configuration: { autoRetry: true, timeout: 60000, batchSize: 5000, compression: true },
  },
  {
    id: 'ds-003',
    name: 'Real-time Event Stream',
    type: 'stream',
    provider: 'Apache Kafka',
    status: 'connected',
    lastSync: new Date(Date.now() - 30 * 1000),
    syncFrequency: 'realtime',
    dataSize: 567,
    health: { uptime: 99.7, latency: 12, errorRate: 0.05 },
    configuration: { autoRetry: true, timeout: 5000, batchSize: 100, compression: true },
  },
];

const mockIntegrations: ThirdPartyIntegration[] = [
  {
    id: 'int-001',
    name: 'Slack Notifications',
    provider: 'Slack',
    type: 'alerting',
    description: 'Send AI insights and alerts to Slack channels',
    status: 'active',
    version: '2.1.0',
    webhook: 'https://hooks.slack.com/services/...',
    configuration: { channels: ['#analytics', '#alerts'], userMentions: true },
    capabilities: ['notifications', 'interactive_messages', 'file_sharing'],
    lastSync: new Date(Date.now() - 10 * 60 * 1000),
    dataFlow: 'outbound',
    usage: { dataTransferred: 45, apiCalls: 234, webhookDeliveries: 156, errors: 2 },
  },
  {
    id: 'int-002',
    name: 'Tableau Integration',
    provider: 'Tableau',
    type: 'visualization',
    description: 'Sync data and visualizations with Tableau Server',
    status: 'active',
    version: '1.3.2',
    configuration: { serverUrl: 'https://tableau.company.com', syncDashboards: true },
    capabilities: ['data_sync', 'dashboard_embedding', 'user_auth'],
    lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
    dataFlow: 'bidirectional',
    usage: { dataTransferred: 1250, apiCalls: 89, webhookDeliveries: 0, errors: 1 },
  },
  {
    id: 'int-003',
    name: 'AWS S3 Storage',
    provider: 'Amazon',
    type: 'storage',
    description: 'Store exported reports and backup data in S3',
    status: 'active',
    version: '3.0.1',
    configuration: { bucket: 'hasivu-analytics-exports', region: 'ap-south-1', encryption: true },
    capabilities: ['file_storage', 'versioning', 'lifecycle_management'],
    lastSync: new Date(Date.now() - 30 * 60 * 1000),
    dataFlow: 'outbound',
    usage: { dataTransferred: 5600, apiCalls: 456, webhookDeliveries: 0, errors: 0 },
  },
];

const mockWebhooks: WebhookSubscription[] = [
  {
    id: 'wh-001',
    name: 'Critical Alerts Webhook',
    url: 'https://alerts.company.com/webhook/hasivu',
    events: ['insight.critical', 'anomaly.detected', 'system.error'],
    status: 'active',
    secret: 'whsec_abc123...',
    retryPolicy: { maxRetries: 3, backoffMultiplier: 2, initialDelay: 1000 },
    headers: { 'X-Source': 'HASIVU-BI', 'Content-Type': 'application/json' },
    deliveries: [
      {
        id: 'del-001',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        event: 'anomaly.detected',
        status: 'success',
        responseCode: 200,
        responseTime: 234,
        attempts: 1,
      },
      {
        id: 'del-002',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        event: 'insight.critical',
        status: 'success',
        responseCode: 200,
        responseTime: 156,
        attempts: 1,
      },
    ],
    lastDelivery: new Date(Date.now() - 10 * 60 * 1000),
    successRate: 98.5,
  },
  {
    id: 'wh-002',
    name: 'Dashboard Updates',
    url: 'https://internal.company.com/api/dashboard-updates',
    events: ['dashboard.updated', 'report.generated'],
    status: 'active',
    retryPolicy: { maxRetries: 5, backoffMultiplier: 1.5, initialDelay: 500 },
    headers: { Authorization: 'Bearer token123', 'X-API-Version': 'v2' },
    deliveries: [
      {
        id: 'del-003',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        event: 'dashboard.updated',
        status: 'success',
        responseCode: 201,
        responseTime: 89,
        attempts: 1,
      },
    ],
    lastDelivery: new Date(Date.now() - 30 * 60 * 1000),
    successRate: 99.2,
  },
];

const mockStreams: RealTimeStream[] = [
  {
    id: 'stream-001',
    name: 'Order Events',
    source: 'order-service',
    type: 'kafka',
    status: 'active',
    messageRate: 125.6,
    lag: 45,
    consumers: 3,
    retentionPeriod: '7d',
    partitions: 6,
    compression: 'snappy',
    metrics: {
      messagesProduced: 1250000,
      messagesConsumed: 1248500,
      bytesProduced: 567000000,
      bytesConsumed: 565800000,
      errors: 23,
    },
  },
  {
    id: 'stream-002',
    name: 'Student Activity',
    source: 'app-analytics',
    type: 'websocket',
    status: 'active',
    messageRate: 89.3,
    lag: 12,
    consumers: 2,
    retentionPeriod: '3d',
    compression: 'gzip',
    metrics: {
      messagesProduced: 890000,
      messagesConsumed: 889500,
      bytesProduced: 234000000,
      bytesConsumed: 233900000,
      errors: 5,
    },
  },
];

// =====================================================
// INTEGRATION API LAYER COMPONENT
// =====================================================

const IntegrationAPILayer: React.FC<IntegrationAPILayerProps> = ({
  className,
  userRole = 'admin',
  onAPIKeyGenerate,
  onWebhookCreate,
  onDataSourceConnect,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [endpoints] = useState<APIEndpoint[]>(mockAPIEndpoints);
  const [dataSources] = useState<DataSource[]>(mockDataSources);
  const [integrations] = useState<ThirdPartyIntegration[]>(mockIntegrations);
  const [webhooks] = useState<WebhookSubscription[]>(mockWebhooks);
  const [streams] = useState<RealTimeStream[]>(mockStreams);

  // API Key Management
  const [apiKeys, setApiKeys] = useState<
    Array<{
      id: string;
      name: string;
      key: string;
      permissions: string[];
      createdAt: Date;
      lastUsed?: Date;
      expiresAt?: Date;
      status: 'active' | 'revoked';
    }>
  >([
    {
      id: 'key-001',
      name: 'Production Dashboard API',
      key: 'hasivu_live_abc123...',
      permissions: ['read:dashboards', 'read:analytics'],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'active',
    },
  ]);

  // New API Key Dialog
  const [newKeyDialog, setNewKeyDialog] = useState(false);
  const [newKeyConfig, setNewKeyConfig] = useState({
    name: '',
    permissions: [] as string[],
    expiresAt: '',
  });

  // Monitoring state
  const [monitoringData, setMonitoringData] = useState({
    totalRequests: 125643,
    successRate: 99.7,
    avgResponseTime: 189,
    errorRate: 0.3,
    activeConnections: 1247,
    dataTransferred: 15.6, // GB
  });

  // Get overall system health
  const systemHealth = useMemo(() => {
    const connectedSources = dataSources.filter(ds => ds.status === 'connected').length;
    const totalSources = dataSources.length;
    const avgUptime = dataSources.reduce((sum, ds) => sum + ds.health.uptime, 0) / totalSources;
    const avgLatency = dataSources.reduce((sum, ds) => sum + ds.health.latency, 0) / totalSources;

    return {
      connectivity: (connectedSources / totalSources) * 100,
      uptime: avgUptime,
      latency: avgLatency,
      status: avgUptime > 99 ? 'excellent' : avgUptime > 95 ? 'good' : 'warning',
    };
  }, [dataSources]);

  // Generate new API key
  const generateAPIKey = useCallback(() => {
    const newKey = {
      id: `key-${Date.now()}`,
      name: newKeyConfig.name || 'Untitled Key',
      key: `hasivu_live_${Math.random().toString(36).substring(2, 15)}`,
      permissions: newKeyConfig.permissions,
      createdAt: new Date(),
      status: 'active' as const,
      expiresAt: newKeyConfig.expiresAt ? new Date(newKeyConfig.expiresAt) : undefined,
    };

    setApiKeys(prev => [...prev, newKey]);
    onAPIKeyGenerate?.(newKey.key);
    setNewKeyDialog(false);
    setNewKeyConfig({ name: '', permissions: [], expiresAt: '' });
  }, [newKeyConfig, onAPIKeyGenerate]);

  // Format file size
  const formatFileSize = useCallback((mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  }, []);

  // Get status color
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'inactive':
      case 'disconnected':
      case 'paused':
        return 'text-gray-600 bg-gray-50';
      case 'error':
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'warning':
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'beta':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-6 w-6 text-indigo-600" />
                Integration & API Layer
              </CardTitle>
              <CardDescription>
                Manage data connections, API access, and third-party integrations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn('', getStatusColor(systemHealth.status))}>
                System {systemHealth.status}
              </Badge>
              <Badge variant="outline">{systemHealth.uptime.toFixed(1)}% Uptime</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="apis" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            API Endpoints
          </TabsTrigger>
          <TabsTrigger value="datasources" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Sources
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* System Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">API Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {monitoringData.totalRequests.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <ArrowUpDown className="h-3 w-3" />
                  +12.3% vs last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monitoringData.successRate}%</div>
                <Progress value={monitoringData.successRate} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monitoringData.avgResponseTime}ms</div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <ArrowDownUp className="h-3 w-3" />
                  -15ms vs last week
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Data Transferred
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monitoringData.dataTransferred}GB</div>
                <div className="text-sm text-gray-600">This month</div>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-600" />
                  Data Sources Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dataSources.slice(0, 4).map(source => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            source.status === 'connected'
                              ? 'bg-green-500'
                              : source.status === 'error'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                          )}
                        />
                        <div>
                          <p className="font-medium text-sm">{source.name}</p>
                          <p className="text-xs text-gray-500">{source.provider}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={cn('text-xs', getStatusColor(source.status))}>
                          {source.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{source.health.latency}ms</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  Active Integrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations.map(integration => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            integration.status === 'active'
                              ? 'bg-green-500'
                              : integration.status === 'error'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                          )}
                        />
                        <div>
                          <p className="font-medium text-sm">{integration.name}</p>
                          <p className="text-xs text-gray-500">{integration.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={cn('text-xs', getStatusColor(integration.status))}>
                          {integration.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {integration.usage.apiCalls} calls
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    time: '2 minutes ago',
                    event: 'API endpoint /api/v1/dashboards called successfully',
                    status: 'success',
                  },
                  {
                    time: '5 minutes ago',
                    event: 'Data source sync completed for PostgreSQL Production DB',
                    status: 'success',
                  },
                  {
                    time: '10 minutes ago',
                    event: 'Webhook delivery failed for Critical Alerts Webhook',
                    status: 'error',
                  },
                  {
                    time: '15 minutes ago',
                    event: 'New integration activated: Tableau Integration',
                    status: 'success',
                  },
                  {
                    time: '30 minutes ago',
                    event: 'API key regenerated for Production Dashboard API',
                    status: 'warning',
                  },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full mt-1.5',
                        activity.status === 'success'
                          ? 'bg-green-500'
                          : activity.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                      )}
                    />
                    <div className="flex-1">
                      <p className="text-sm">{activity.event}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Endpoints Tab */}
        <TabsContent value="apis" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">API Endpoints</h3>
              <p className="text-sm text-gray-600">Manage and monitor your API endpoints</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FileText className="h-3 w-3 mr-1" />
                Documentation
              </Button>
              <Dialog open={newKeyDialog} onOpenChange={setNewKeyDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Key className="h-3 w-3 mr-1" />
                    Generate API Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate New API Key</DialogTitle>
                    <DialogDescription>
                      Create a new API key with specific permissions and access controls
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Key Name</Label>
                      <Input
                        placeholder="e.g., Production Dashboard API"
                        value={newKeyConfig.name}
                        onChange={e => setNewKeyConfig(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Permissions</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          'read:dashboards',
                          'write:dashboards',
                          'read:analytics',
                          'write:analytics',
                          'read:insights',
                          'write:insights',
                          'read:reports',
                          'write:reports',
                        ].map(permission => (
                          <label key={permission} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newKeyConfig.permissions.includes(permission)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setNewKeyConfig(prev => ({
                                    ...prev,
                                    permissions: [...prev.permissions, permission],
                                  }));
                                } else {
                                  setNewKeyConfig(prev => ({
                                    ...prev,
                                    permissions: prev.permissions.filter(p => p !== permission),
                                  }));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{permission}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Expires At (Optional)</Label>
                      <Input
                        type="datetime-local"
                        value={newKeyConfig.expiresAt}
                        onChange={e =>
                          setNewKeyConfig(prev => ({ ...prev, expiresAt: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={generateAPIKey}>Generate Key</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map(key => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {key.key.substring(0, 20)}...
                          </code>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {key.permissions.slice(0, 2).map(perm => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                          {key.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{key.permissions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {key.lastUsed ? key.lastUsed.toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(getStatusColor(key.status))}>{key.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Endpoints List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {endpoints.map(endpoint => (
                  <Card key={endpoint.id} className="border">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                endpoint.method === 'GET'
                                  ? 'text-green-600 border-green-600'
                                  : endpoint.method === 'POST'
                                    ? 'text-blue-600 border-blue-600'
                                    : endpoint.method === 'PUT'
                                      ? 'text-orange-600 border-orange-600'
                                      : 'text-red-600 border-red-600'
                              )}
                            >
                              {endpoint.method}
                            </Badge>
                            <code className="text-sm font-mono">{endpoint.endpoint}</code>
                            <Badge className={cn(getStatusColor(endpoint.status))}>
                              {endpoint.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{endpoint.description}</p>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Calls:</span>
                              <span className="ml-1 font-medium">
                                {endpoint.usage.calls.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Avg Response:</span>
                              <span className="ml-1 font-medium">
                                {endpoint.usage.avgResponseTime}ms
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Error Rate:</span>
                              <span className="ml-1 font-medium">
                                {((endpoint.usage.errors / endpoint.usage.calls) * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                          <Button size="sm" variant="outline">
                            <Code className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Sources Tab */}
        <TabsContent value="datasources" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Data Sources</h3>
              <p className="text-sm text-gray-600">Configure and monitor your data connections</p>
            </div>
            <Button>
              <Plus className="h-3 w-3 mr-1" />
              Add Data Source
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {dataSources.map(source => (
              <Card key={source.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      <CardTitle className="text-base">{source.name}</CardTitle>
                    </div>
                    <Badge className={cn(getStatusColor(source.status))}>{source.status}</Badge>
                  </div>
                  <CardDescription>{source.provider}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Data Size</span>
                      <span className="font-medium">{formatFileSize(source.dataSize)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Sync Frequency</span>
                      <span className="font-medium">{source.syncFrequency}</span>
                    </div>
                    {source.tableCount && (
                      <div>
                        <span className="text-gray-500 block">Tables</span>
                        <span className="font-medium">{source.tableCount}</span>
                      </div>
                    )}
                    {source.recordCount && (
                      <div>
                        <span className="text-gray-500 block">Records</span>
                        <span className="font-medium">{source.recordCount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Uptime</span>
                        <span>{source.health.uptime.toFixed(1)}%</span>
                      </div>
                      <Progress value={source.health.uptime} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block">Latency</span>
                        <span className="font-medium">{source.health.latency}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Error Rate</span>
                        <span className="font-medium">{source.health.errorRate.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
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

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Third-party Integrations</h3>
              <p className="text-sm text-gray-600">Connect with external tools and services</p>
            </div>
            <Button>
              <Plus className="h-3 w-3 mr-1" />
              Add Integration
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {integrations.map(integration => (
              <Card key={integration.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{integration.name}</CardTitle>
                      <CardDescription>
                        {integration.provider} • {integration.type}
                      </CardDescription>
                    </div>
                    <Badge className={cn(getStatusColor(integration.status))}>
                      {integration.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{integration.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Data Flow</span>
                      <span className="font-medium capitalize">{integration.dataFlow}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Version</span>
                      <span className="font-medium">{integration.version}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Capabilities</Label>
                    <div className="flex flex-wrap gap-1">
                      {integration.capabilities.map(capability => (
                        <Badge key={capability} variant="outline" className="text-xs">
                          {capability.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">API Calls</span>
                      <span className="font-medium">{integration.usage.apiCalls}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Data Transfer</span>
                      <span className="font-medium">
                        {formatFileSize(integration.usage.dataTransferred)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Webhook Subscriptions</h3>
              <p className="text-sm text-gray-600">Configure real-time event notifications</p>
            </div>
            <Button>
              <Plus className="h-3 w-3 mr-1" />
              Create Webhook
            </Button>
          </div>

          <div className="space-y-4">
            {webhooks.map(webhook => (
              <Card key={webhook.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{webhook.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <code className="text-xs">{webhook.url}</code>
                        <Badge className={cn(getStatusColor(webhook.status))}>
                          {webhook.status}
                        </Badge>
                      </CardDescription>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{webhook.successRate.toFixed(1)}%</div>
                      <div className="text-gray-500">Success Rate</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm">Subscribed Events</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {webhook.events.map(event => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Deliveries</span>
                      <span className="font-medium">{webhook.deliveries.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Last Delivery</span>
                      <span className="font-medium">
                        {webhook.lastDelivery ? webhook.lastDelivery.toLocaleString() : 'Never'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Max Retries</span>
                      <span className="font-medium">{webhook.retryPolicy.maxRetries}</span>
                    </div>
                  </div>

                  {webhook.deliveries.length > 0 && (
                    <div>
                      <Label className="text-sm">Recent Deliveries</Label>
                      <div className="mt-2 space-y-2">
                        {webhook.deliveries.slice(0, 3).map(delivery => (
                          <div
                            key={delivery.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  delivery.status === 'success'
                                    ? 'bg-green-500'
                                    : delivery.status === 'failed'
                                      ? 'bg-red-500'
                                      : 'bg-yellow-500'
                                )}
                              />
                              <span className="text-xs font-mono">{delivery.event}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {delivery.timestamp.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                    <Button size="sm" variant="outline">
                      <Send className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Security & Access Control</h3>
            <p className="text-sm text-gray-600">Manage security policies and access controls</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">99.8%</div>
                    <div className="text-sm text-green-800">Security Score</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-blue-800">Active Threats</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'SSL/TLS Encryption', status: 'enabled', color: 'green' },
                    { name: 'API Rate Limiting', status: 'enabled', color: 'green' },
                    { name: 'Request Validation', status: 'enabled', color: 'green' },
                    { name: 'Audit Logging', status: 'enabled', color: 'green' },
                  ].map(feature => (
                    <div key={feature.name} className="flex items-center justify-between">
                      <span className="text-sm">{feature.name}</span>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            feature.color === 'green' ? 'bg-green-500' : 'bg-red-500'
                          )}
                        />
                        <span className="text-xs capitalize">{feature.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4 text-blue-600" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Authentication Methods</Label>
                    <div className="mt-1 space-y-2">
                      {[
                        { name: 'API Keys', count: apiKeys.length, enabled: true },
                        { name: 'OAuth 2.0', count: 3, enabled: true },
                        { name: 'JWT Tokens', count: 156, enabled: true },
                        { name: 'Basic Auth', count: 0, enabled: false },
                      ].map(method => (
                        <div
                          key={method.name}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full',
                                method.enabled ? 'bg-green-500' : 'bg-gray-400'
                              )}
                            />
                            <span className="text-sm">{method.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">{method.count} active</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm">Rate Limits</Label>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>• 1000 requests/hour per API key</p>
                      <p>• 100 requests/hour for AI endpoints</p>
                      <p>• 50 requests/hour for export endpoints</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationAPILayer;
