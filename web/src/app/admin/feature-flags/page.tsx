/**
 * HASIVU Platform - Feature Flags Management Admin Page
 * Admin interface for managing feature flags with rollout controls
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Tabs as _Tabs,
  TabsContent as _TabsContent,
  TabsList as _TabsList,
  TabsTrigger as _TabsTrigger,
} from '@/components/ui/tabs';
import { Alert as _Alert, AlertDescription as _AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Flag,
  Users,
  BarChart3,
  Edit,
  Plus,
  Search,
  CheckCircle,
  Target,
  Zap,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { useFeatureFlagAnalytics } from '@/hooks/useFeatureFlag';
import {
  FeatureFlag,
  UserSegment,
  FeatureFlagRolloutStrategy,
  FeatureFlagEnvironment,
} from '@/types/feature-flags';
import { cn } from '@/lib/utils';

interface FeatureFlagFormData {
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  category: 'payment' | 'notification' | 'analytics' | 'ui' | 'experimental';
  priority: 'low' | 'medium' | 'high' | 'critical';
  rules: {
    strategy: FeatureFlagRolloutStrategy;
    percentage?: number;
    environments: FeatureFlagEnvironment[];
    segments?: string[];
  }[];
}

const STRATEGY_ICONS = {
  percentage: Target,
  'user-segment': Users,
  environment: Shield,
  gradual: TrendingUp,
};

const CATEGORY_ICONS = {
  payment: '💳',
  notification: '📢',
  analytics: '📊',
  ui: '🎨',
  experimental: '🧪',
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function FeatureFlagsAdminPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [_segments, setSegments] = useState<UserSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [formData, setFormData] = useState<FeatureFlagFormData>({
    name: '',
    key: '',
    description: '',
    enabled: false,
    category: 'experimental',
    priority: 'medium',
    rules: [
      {
        strategy: 'percentage',
        percentage: 10,
        environments: ['development'],
      },
    ],
  });

  const analytics = useFeatureFlagAnalytics();

  // Load feature flags data
  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/feature-flags');
      if (response.ok) {
        const data = await response.json();
        setFlags(data.flags || []);
        setSegments(data.segments || []);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlag = async () => {
    try {
      const response = await fetch('/api/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadFeatureFlags();
        setShowCreateDialog(false);
        resetForm();
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const handleUpdateFlag = async (flag: FeatureFlag) => {
    try {
      const response = await fetch(`/api/feature-flags/${flag.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flag),
      });

      if (response.ok) {
        await loadFeatureFlags();
        setEditingFlag(null);
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const handleToggleFlag = async (flag: FeatureFlag) => {
    const updatedFlag = { ...flag, enabled: !flag.enabled };
    await handleUpdateFlag(updatedFlag);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      key: '',
      description: '',
      enabled: false,
      category: 'experimental',
      priority: 'medium',
      rules: [
        {
          strategy: 'percentage',
          percentage: 10,
          environments: ['development'],
        },
      ],
    });
  };

  const filteredFlags = flags.filter(flag => {
    const matchesSearch =
      flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || flag.metadata.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'enabled' && flag.enabled) ||
      (statusFilter === 'disabled' && !flag.enabled);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStrategyDescription = (rule: any) => {
    switch (rule.strategy) {
      case 'percentage':
        return `${rule.percentage}% rollout`;
      case 'user-segment':
        return `Segments: ${rule.segments?.join(', ') || 'None'}`;
      case 'environment':
        return `Envs: ${rule.environments?.join(', ') || 'All'}`;
      case 'gradual':
        return `Gradual rollout (${rule.percentage}%)`;
      default:
        return rule.strategy;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flag className="h-8 w-8" />
            Feature Flags Management
          </h1>
          <p className="text-gray-600 mt-1">
            Control feature rollouts, manage user segments, and monitor flag performance
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Flag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Feature Flag</DialogTitle>
              <DialogDescription>
                Set up a new feature flag with rollout rules and targeting
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Flag Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="New Payment Methods"
                  />
                </div>
                <div>
                  <Label htmlFor="key">Flag Key</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={e => setFormData(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="new_payment_methods"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enable new payment methods like UPI, digital wallets"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) =>
                      setFormData(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="ui">UI</SelectItem>
                      <SelectItem value="experimental">Experimental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) =>
                      setFormData(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={checked =>
                      setFormData(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label htmlFor="enabled">Enabled</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFlag}>Create Flag</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Flags</p>
                <p className="text-2xl font-bold">{analytics.totalFlags}</p>
              </div>
              <Flag className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enabled Flags</p>
                <p className="text-2xl font-bold text-green-600">{analytics.enabledFlags}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Flags</p>
                <p className="text-2xl font-bold">{analytics.flagsByCategory.payment || 0}</p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Analytics Flags</p>
                <p className="text-2xl font-bold">{analytics.flagsByCategory.analytics || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search flags..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="ui">UI</SelectItem>
                <SelectItem value="experimental">Experimental</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>
            Manage feature flag configurations and rollout strategies
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flag</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlags.map(flag => (
                <TableRow key={flag.id}>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{CATEGORY_ICONS[flag.metadata.category]}</span>
                        <div>
                          <p className="font-medium">{flag.name}</p>
                          <p className="text-sm text-gray-500 font-mono">{flag.key}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {flag.metadata.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={() => handleToggleFlag(flag)}
                      />
                      <span
                        className={cn(
                          'text-sm font-medium',
                          flag.enabled ? 'text-green-600' : 'text-gray-500'
                        )}
                      >
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {flag.rules.map((rule, index) => {
                        const Icon = STRATEGY_ICONS[rule.strategy];
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="text-sm">{getStrategyDescription(rule)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={PRIORITY_COLORS[flag.metadata.priority]}>
                      {flag.metadata.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(flag.metadata.updatedAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingFlag(flag)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredFlags.length === 0 && (
            <div className="text-center py-8">
              <Flag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No feature flags found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingFlag && (
        <Dialog open={!!editingFlag} onOpenChange={() => setEditingFlag(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Feature Flag</DialogTitle>
              <DialogDescription>
                Modify the configuration and rollout rules for {editingFlag.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Flag Name</Label>
                  <Input value={editingFlag.name} readOnly />
                </div>
                <div>
                  <Label>Flag Key</Label>
                  <Input value={editingFlag.key} readOnly />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={editingFlag.description}
                  onChange={e =>
                    setEditingFlag(prev =>
                      prev
                        ? {
                            ...prev,
                            description: e.target.value,
                          }
                        : null
                    )
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingFlag.enabled}
                  onCheckedChange={checked =>
                    setEditingFlag(prev =>
                      prev
                        ? {
                            ...prev,
                            enabled: checked,
                          }
                        : null
                    )
                  }
                />
                <Label>Enabled</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingFlag(null)}>
                  Cancel
                </Button>
                <Button onClick={() => editingFlag && handleUpdateFlag(editingFlag)}>
                  Update Flag
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
