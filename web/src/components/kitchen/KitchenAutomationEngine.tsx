'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence as _AnimatePresence } from 'framer-motion';
import {
  Bot,
  Settings,
  Play,
  Pause,
  Zap,
  Brain,
  CheckCircle,
  Target,
  TrendingUp,
  BarChart3,
  Activity,
  Workflow,
  Cpu,
  Eye,
  Gauge,
  Timer,
  RefreshCw,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Automation engine interfaces
interface AutomationRule {
  id: string;
  name: string;
  description: string;
  category:
    | 'order_management'
    | 'staff_optimization'
    | 'inventory'
    | 'quality_control'
    | 'energy_management';
  isActive: boolean;
  priority: number;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  successRate: number;
  timeSaved: number; // minutes per day
  lastTriggered?: Date;
  triggerCount: number;
}

interface AutomationCondition {
  type:
    | 'time'
    | 'order_count'
    | 'wait_time'
    | 'staff_availability'
    | 'inventory_level'
    | 'temperature'
    | 'customer_rating';
  operator: 'greater_than' | 'less_than' | 'equals' | 'between';
  value: number | string;
  threshold?: number;
}

interface AutomationAction {
  type:
    | 'notify_staff'
    | 'adjust_staffing'
    | 'reorder_inventory'
    | 'adjust_temperature'
    | 'priority_boost'
    | 'quality_check';
  parameters: Record<string, any>;
  description: string;
}

interface AutomationMetrics {
  totalRulesActive: number;
  rulesTriggeredToday: number;
  timeSavedToday: number; // minutes
  efficiencyGain: number; // percentage
  errorReduction: number; // percentage
  customerSatisfactionImpact: number; // percentage
  automationHealth: number; // percentage
  mlModelAccuracy: number; // percentage
}

interface WorkflowOptimization {
  id: string;
  name: string;
  currentEfficiency: number;
  potentialEfficiency: number;
  optimizationSuggestions: string[];
  implementationComplexity: 'low' | 'medium' | 'high';
  estimatedBenefit: string;
  aiConfidence: number;
}

export const KitchenAutomationEngine: React.FC = () => {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [metrics, setMetrics] = useState<AutomationMetrics | null>(null);
  const [workflowOptimizations, setWorkflowOptimizations] = useState<WorkflowOptimization[]>([]);
  const [isEngineRunning, setIsEngineRunning] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Initialize automation data
  useEffect(() => {
    const mockRules: AutomationRule[] = [
      {
        id: '1',
        name: 'Peak Hour Staff Optimization',
        description: 'Automatically adjust staff assignments during peak hours',
        category: 'staff_optimization',
        isActive: true,
        priority: 1,
        conditions: [
          { type: 'time', operator: 'between', value: '11:30-13:30' },
          { type: 'order_count', operator: 'greater_than', value: 20 },
        ],
        actions: [
          {
            type: 'adjust_staffing',
            parameters: { increase: 2, positions: ['prep', 'assembly'] },
            description: 'Add 2 staff members to prep and assembly stations',
          },
          {
            type: 'notify_staff',
            parameters: { message: 'Peak hour mode activated', priority: 'high' },
            description: 'Alert all staff about peak mode activation',
          },
        ],
        successRate: 94,
        timeSaved: 25,
        lastTriggered: new Date(Date.now() - 3600000), // 1 hour ago
        triggerCount: 127,
      },
      {
        id: '2',
        name: 'Smart Inventory Reordering',
        description: 'Predict and automatically reorder low-stock items',
        category: 'inventory',
        isActive: true,
        priority: 2,
        conditions: [{ type: 'inventory_level', operator: 'less_than', value: 20, threshold: 100 }],
        actions: [
          {
            type: 'reorder_inventory',
            parameters: { supplier: 'primary', urgency: 'standard' },
            description: 'Generate purchase order for predicted needs',
          },
        ],
        successRate: 88,
        timeSaved: 45,
        lastTriggered: new Date(Date.now() - 1800000), // 30 minutes ago
        triggerCount: 89,
      },
      {
        id: '3',
        name: 'Quality Control Alerts',
        description: 'Monitor temperature and food safety automatically',
        category: 'quality_control',
        isActive: true,
        priority: 3,
        conditions: [
          { type: 'temperature', operator: 'greater_than', value: 40 }, // Refrigerator temp
          { type: 'temperature', operator: 'less_than', value: 140 }, // Hot holding temp
        ],
        actions: [
          {
            type: 'quality_check',
            parameters: { checkType: 'temperature', immediate: true },
            description: 'Trigger immediate temperature compliance check',
          },
          {
            type: 'notify_staff',
            parameters: { role: 'food_safety_manager', urgency: 'critical' },
            description: 'Alert food safety manager immediately',
          },
        ],
        successRate: 96,
        timeSaved: 15,
        triggerCount: 23,
      },
      {
        id: '4',
        name: 'Order Priority Optimization',
        description: 'Dynamically adjust order priorities based on wait times',
        category: 'order_management',
        isActive: true,
        priority: 4,
        conditions: [{ type: 'wait_time', operator: 'greater_than', value: 15 }],
        actions: [
          {
            type: 'priority_boost',
            parameters: { increase: 'high', reason: 'extended_wait' },
            description: 'Boost priority for orders exceeding wait time threshold',
          },
        ],
        successRate: 91,
        timeSaved: 18,
        triggerCount: 156,
      },
      {
        id: '5',
        name: 'Energy Management System',
        description: 'Optimize equipment usage for energy efficiency',
        category: 'energy_management',
        isActive: true,
        priority: 5,
        conditions: [
          { type: 'time', operator: 'between', value: '14:00-16:00' }, // Low activity period
          { type: 'order_count', operator: 'less_than', value: 5 },
        ],
        actions: [
          {
            type: 'adjust_temperature',
            parameters: { equipment: 'non_critical', mode: 'energy_save' },
            description: 'Switch non-critical equipment to energy saving mode',
          },
        ],
        successRate: 85,
        timeSaved: 0, // Energy savings, not time
        triggerCount: 67,
      },
    ];

    const mockMetrics: AutomationMetrics = {
      totalRulesActive: 5,
      rulesTriggeredToday: 23,
      timeSavedToday: 127,
      efficiencyGain: 34,
      errorReduction: 67,
      customerSatisfactionImpact: 12,
      automationHealth: 92,
      mlModelAccuracy: 89,
    };

    const mockOptimizations: WorkflowOptimization[] = [
      {
        id: '1',
        name: 'Prep Station Workflow',
        currentEfficiency: 78,
        potentialEfficiency: 94,
        optimizationSuggestions: [
          'Reorganize ingredient placement for 30% less movement',
          'Implement batch preparation for similar items',
          'Add automated portioning tools',
        ],
        implementationComplexity: 'medium',
        estimatedBenefit: '16% efficiency gain, 8min/order reduction',
        aiConfidence: 87,
      },
      {
        id: '2',
        name: 'Order Assembly Line',
        currentEfficiency: 82,
        potentialEfficiency: 96,
        optimizationSuggestions: [
          'Implement parallel assembly for complex orders',
          'Add visual confirmation system for accuracy',
          'Optimize packaging workflow',
        ],
        implementationComplexity: 'high',
        estimatedBenefit: '14% efficiency gain, 5min/order reduction',
        aiConfidence: 91,
      },
      {
        id: '3',
        name: 'Quality Check Process',
        currentEfficiency: 88,
        potentialEfficiency: 97,
        optimizationSuggestions: [
          'Integrate automated temperature scanning',
          'Add visual inspection AI assistance',
          'Streamline documentation process',
        ],
        implementationComplexity: 'low',
        estimatedBenefit: '9% efficiency gain, improved accuracy',
        aiConfidence: 94,
      },
    ];

    setAutomationRules(mockRules);
    setMetrics(mockMetrics);
    setWorkflowOptimizations(mockOptimizations);
  }, []);

  const toggleRule = (ruleId: string) => {
    setAutomationRules(prev =>
      prev.map(rule => (rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule))
    );
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      order_management: 'bg-blue-100 text-blue-800 border-blue-200',
      staff_optimization: 'bg-green-100 text-green-800 border-green-200',
      inventory: 'bg-orange-100 text-orange-800 border-orange-200',
      quality_control: 'bg-red-100 text-red-800 border-red-200',
      energy_management: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredRules =
    selectedCategory === 'all'
      ? automationRules
      : automationRules.filter(rule => rule.category === selectedCategory);

  if (!metrics) {
    return <div className="animate-pulse space-y-4">Loading automation engine...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Engine Status and Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">Kitchen Automation Engine</h2>
            <Badge variant={isEngineRunning ? 'default' : 'secondary'}>
              {isEngineRunning ? 'Running' : 'Paused'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEngineRunning(!isEngineRunning)}
            className={isEngineRunning ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}
          >
            {isEngineRunning ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pause Engine
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Start Engine
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-1" />
            Configure
          </Button>
        </div>
      </div>

      {/* Automation Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Active Rules</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.totalRulesActive}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {metrics.rulesTriggeredToday} triggered today
                </p>
              </div>
              <Workflow className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Time Saved</p>
                <p className="text-2xl font-bold text-green-900">{metrics.timeSavedToday}min</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {metrics.efficiencyGain}% efficiency gain
                </p>
              </div>
              <Timer className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">ML Accuracy</p>
                <p className="text-2xl font-bold text-purple-900">{metrics.mlModelAccuracy}%</p>
                <p className="text-xs text-purple-600 mt-1">
                  {metrics.errorReduction}% error reduction
                </p>
              </div>
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 mb-1">System Health</p>
                <p className="text-2xl font-bold text-orange-900">{metrics.automationHealth}%</p>
                <Progress value={metrics.automationHealth} className="w-full mt-2 h-2" />
              </div>
              <Gauge className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Automation Tabs */}
      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="workflows">Workflow Optimization</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Automation Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm font-medium">Filter by category:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              <option value="order_management">Order Management</option>
              <option value="staff_optimization">Staff Optimization</option>
              <option value="inventory">Inventory</option>
              <option value="quality_control">Quality Control</option>
              <option value="energy_management">Energy Management</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRules.map(rule => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className={`${rule.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <CardTitle className="text-lg">{rule.name}</CardTitle>
                          <Badge className={getCategoryColor(rule.category)}>
                            {rule.category.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardDescription>{rule.description}</CardDescription>
                      </div>
                      <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Success Rate:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <Progress value={rule.successRate} className="flex-1 h-2" />
                          <span className="font-medium">{rule.successRate}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Time Saved:</span>
                        <p className="font-medium text-green-600 mt-1">{rule.timeSaved}min/day</p>
                      </div>
                    </div>

                    <div className="text-sm space-y-2">
                      <div>
                        <span className="font-medium text-gray-600">Conditions:</span>
                        <ul className="ml-4 space-y-1 text-xs">
                          {rule.conditions.map((condition, index) => (
                            <li key={index} className="flex items-center space-x-1">
                              <Target className="w-3 h-3 text-blue-500" />
                              <span>
                                {condition.type.replace('_', ' ')}{' '}
                                {condition.operator.replace('_', ' ')} {condition.value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-medium text-gray-600">Actions:</span>
                        <ul className="ml-4 space-y-1 text-xs">
                          {rule.actions.map((action, index) => (
                            <li key={index} className="flex items-center space-x-1">
                              <Zap className="w-3 h-3 text-orange-500" />
                              <span>{action.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-500">
                      <span>Triggered {rule.triggerCount} times</span>
                      {rule.lastTriggered && (
                        <span>Last: {rule.lastTriggered.toLocaleTimeString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Workflow Optimization Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Alert>
            <Brain className="w-4 h-4" />
            <AlertDescription>
              AI-powered workflow analysis identifies optimization opportunities based on
              operational patterns and industry best practices.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {workflowOptimizations.map(optimization => (
              <Card key={optimization.id} className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{optimization.name}</span>
                        <Badge
                          variant="outline"
                          className={getComplexityColor(optimization.implementationComplexity)}
                        >
                          {optimization.implementationComplexity} complexity
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Current: {optimization.currentEfficiency}% → Potential:{' '}
                        {optimization.potentialEfficiency}%
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">AI Confidence</div>
                      <div className="text-lg font-bold text-blue-600">
                        {optimization.aiConfidence}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-2">
                        Current Efficiency
                      </div>
                      <Progress value={optimization.currentEfficiency} className="h-3" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-2">
                        Potential Efficiency
                      </div>
                      <Progress value={optimization.potentialEfficiency} className="h-3" />
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Optimization Suggestions:
                    </div>
                    <ul className="space-y-1">
                      {optimization.optimizationSuggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-sm">
                      <span className="font-medium text-green-600">Estimated Benefit: </span>
                      <span>{optimization.estimatedBenefit}</span>
                    </div>
                    <Button size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Performance Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Efficiency Improvement</span>
                    <span className="font-bold text-green-600">+{metrics.efficiencyGain}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Error Reduction</span>
                    <span className="font-bold text-blue-600">-{metrics.errorReduction}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer Satisfaction</span>
                    <span className="font-bold text-purple-600">
                      +{metrics.customerSatisfactionImpact}%
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600 mb-2">Daily Impact</p>
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.timeSavedToday} minutes saved
                  </div>
                  <p className="text-xs text-gray-500">≈ $127 in operational cost savings</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Real-time Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Automation Engine</span>
                    <Badge variant={isEngineRunning ? 'default' : 'secondary'}>
                      {isEngineRunning ? 'Running' : 'Paused'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ML Models</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Pipeline</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">System Health</span>
                    <span className="font-bold">{metrics.automationHealth}%</span>
                  </div>
                  <Progress value={metrics.automationHealth} className="h-2" />
                </div>

                <div className="pt-3 border-t">
                  <Button className="w-full" size="sm">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh All Models
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cpu className="w-5 h-5 mr-2" />
                Predictive Analytics Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-1">Next Peak Prediction</div>
                  <div className="text-lg font-bold text-blue-900">12:45 PM</div>
                  <div className="text-xs text-blue-600">Confidence: 89%</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-800 mb-1">Inventory Alert</div>
                  <div className="text-lg font-bold text-green-900">3 items</div>
                  <div className="text-xs text-green-600">Auto-order in 2 hours</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm font-medium text-orange-800 mb-1">Quality Risk</div>
                  <div className="text-lg font-bold text-orange-900">Low</div>
                  <div className="text-xs text-orange-600">All systems normal</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KitchenAutomationEngine;
