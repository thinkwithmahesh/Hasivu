/**
 * HASIVU Platform - Communication Analytics Dashboard Component
 * Epic 6: Notifications & Communication System - Story 6.6
 *
 * Comprehensive analytics dashboard for all communication channels
 * with insights, optimization recommendations, and performance tracking
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  _TrendingDown,
  Users,
  MessageSquare,
  Mail,
  Smartphone,
  CheckCircle,
  _XCircle,
  Clock,
  Target,
  Zap,
  AlertTriangle,
  Lightbulb,
  _Download,
  RefreshCw,
  _Calendar,
  _Filter,
} from 'lucide-react';
import { NotificationService } from '@/services/notification.service';
import { cn } from '@/lib/utils';

interface CommunicationAnalyticsProps {
  className?: string;
}

interface ChannelMetrics {
  channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  cost: number;
  revenue: number;
  roi: number;
}

interface TimeSeriesData {
  date: string;
  email: number;
  sms: number;
  whatsapp: number;
  push: number;
  in_app: number;
}

interface OptimizationRecommendation {
  id: string;
  type: 'channel_optimization' | 'timing_optimization' | 'content_optimization' | 'segmentation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  potentialImprovement: number;
  channel?: string;
}

export const CommunicationAnalytics: React.FC<CommunicationAnalyticsProps> = ({ className }) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ChannelMetrics[]>([]);
  const [_timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);

  const _notificationService = NotificationService.getInstance();

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, selectedChannel]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Mock comprehensive analytics data
      const mockMetrics: ChannelMetrics[] = [
        {
          channel: 'email',
          sent: 12500,
          delivered: 11875,
          opened: 3750,
          clicked: 1125,
          bounced: 625,
          unsubscribed: 125,
          deliveryRate: 95.0,
          openRate: 31.6,
          clickRate: 9.5,
          bounceRate: 5.0,
          unsubscribeRate: 1.0,
          cost: 2500,
          revenue: 22500,
          roi: 800,
        },
        {
          channel: 'sms',
          sent: 8200,
          delivered: 7954,
          opened: 7954, // SMS are "opened" when delivered
          clicked: 0, // SMS don't have click tracking
          bounced: 246,
          unsubscribed: 0,
          deliveryRate: 96.9,
          openRate: 96.9,
          clickRate: 0,
          bounceRate: 3.0,
          unsubscribeRate: 0,
          cost: 12300,
          revenue: 16400,
          roi: 33,
        },
        {
          channel: 'whatsapp',
          sent: 4500,
          delivered: 4320,
          opened: 3240,
          clicked: 810,
          bounced: 180,
          unsubscribed: 45,
          deliveryRate: 96.0,
          openRate: 72.0,
          clickRate: 18.0,
          bounceRate: 4.0,
          unsubscribeRate: 1.0,
          cost: 2250,
          revenue: 18000,
          roi: 700,
        },
        {
          channel: 'push',
          sent: 3200,
          delivered: 2880,
          opened: 864,
          clicked: 259,
          bounced: 320,
          unsubscribed: 32,
          deliveryRate: 90.0,
          openRate: 27.0,
          clickRate: 8.1,
          bounceRate: 10.0,
          unsubscribeRate: 1.0,
          cost: 160,
          revenue: 6400,
          roi: 3900,
        },
        {
          channel: 'in_app',
          sent: 15800,
          delivered: 15800,
          opened: 7900,
          clicked: 2370,
          bounced: 0,
          unsubscribed: 0,
          deliveryRate: 100.0,
          openRate: 50.0,
          clickRate: 15.0,
          bounceRate: 0,
          unsubscribeRate: 0,
          cost: 0,
          revenue: 31600,
          roi: Infinity,
        },
      ];

      // Filter by selected channel
      const filteredMetrics =
        selectedChannel === 'all'
          ? mockMetrics
          : mockMetrics.filter(m => m.channel === selectedChannel);

      setMetrics(filteredMetrics);

      // Mock time series data
      const mockTimeSeries: TimeSeriesData[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          email: Math.floor(Math.random() * 500) + 200,
          sms: Math.floor(Math.random() * 300) + 100,
          whatsapp: Math.floor(Math.random() * 200) + 50,
          push: Math.floor(Math.random() * 150) + 25,
          in_app: Math.floor(Math.random() * 600) + 300,
        };
      });

      setTimeSeriesData(mockTimeSeries);

      // Generate optimization recommendations
      const mockRecommendations: OptimizationRecommendation[] = [
        {
          id: 'rec_001',
          type: 'timing_optimization',
          title: 'Optimize Email Send Times',
          description:
            'Send emails during peak engagement hours (10 AM - 2 PM) to improve open rates by 25%',
          impact: 'high',
          effort: 'low',
          potentialImprovement: 25,
          channel: 'email',
        },
        {
          id: 'rec_002',
          type: 'channel_optimization',
          title: 'Increase WhatsApp Usage',
          description:
            "WhatsApp has 18% click rate vs email's 9.5%. Migrate transactional messages to WhatsApp.",
          impact: 'high',
          effort: 'medium',
          potentialImprovement: 45,
          channel: 'whatsapp',
        },
        {
          id: 'rec_003',
          type: 'content_optimization',
          title: 'Personalize SMS Content',
          description: 'Add recipient names and order details to SMS for better engagement',
          impact: 'medium',
          effort: 'low',
          potentialImprovement: 15,
          channel: 'sms',
        },
        {
          id: 'rec_004',
          type: 'segmentation',
          title: 'Implement User Segmentation',
          description: 'Create segments based on user behavior to send more relevant messages',
          impact: 'high',
          effort: 'high',
          potentialImprovement: 35,
        },
        {
          id: 'rec_005',
          type: 'channel_optimization',
          title: 'Leverage Push Notifications',
          description:
            'Push notifications have 3,900% ROI. Increase usage for time-sensitive alerts.',
          impact: 'medium',
          effort: 'medium',
          potentialImprovement: 20,
          channel: 'push',
        },
      ];

      setRecommendations(mockRecommendations);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5" />;
      case 'whatsapp':
        return <MessageSquare className="h-5 w-5" />;
      case 'push':
        return <Smartphone className="h-5 w-5" />;
      case 'in_app':
        return <BarChart3 className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'text-blue-600';
      case 'sms':
        return 'text-green-600';
      case 'whatsapp':
        return 'text-green-600';
      case 'push':
        return 'text-purple-600';
      case 'in_app':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getImpactBadge = (impact: string) => {
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'outline',
    } as const;

    return (
      <Badge variant={variants[impact as keyof typeof variants] || 'secondary'}>
        {impact} impact
      </Badge>
    );
  };

  const getEffortBadge = (effort: string) => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'default',
    } as const;

    return (
      <Badge variant={variants[effort as keyof typeof variants] || 'secondary'}>
        {effort} effort
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totals = metrics.reduce(
    (acc, metric) => ({
      sent: acc.sent + metric.sent,
      delivered: acc.delivered + metric.delivered,
      opened: acc.opened + metric.opened,
      clicked: acc.clicked + metric.clicked,
      cost: acc.cost + metric.cost,
      revenue: acc.revenue + metric.revenue,
    }),
    { sent: 0, delivered: 0, opened: 0, clicked: 0, cost: 0, revenue: 0 }
  );

  const overallDeliveryRate = totals.sent > 0 ? (totals.delivered / totals.sent) * 100 : 0;
  const overallOpenRate = totals.delivered > 0 ? (totals.opened / totals.delivered) * 100 : 0;
  const overallClickRate = totals.opened > 0 ? (totals.clicked / totals.opened) * 100 : 0;
  const overallROI = totals.cost > 0 ? ((totals.revenue - totals.cost) / totals.cost) * 100 : 0;

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Communication Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights across all communication channels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="push">Push</SelectItem>
              <SelectItem value="in_app">In-App</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{totals.sent.toLocaleString()}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center text-sm text-green-600 mt-2">
              <TrendingUp className="h-4 w-4 mr-1" />
              {formatPercentage(overallDeliveryRate)} delivered
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                <p className="text-2xl font-bold">{formatPercentage(overallOpenRate)}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center text-sm text-blue-600 mt-2">
              <Target className="h-4 w-4 mr-1" />
              {formatPercentage(overallClickRate)} click rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.revenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center text-sm text-green-600 mt-2">
              <TrendingUp className="h-4 w-4 mr-1" />
              {formatPercentage(overallROI)} ROI
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.cost)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex items-center text-sm text-gray-600 mt-2">
              <Clock className="h-4 w-4 mr-1" />
              {totals.sent > 0 ? formatCurrency(totals.cost / totals.sent) : '₹0.00'} per message
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Channel Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Channel Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance Comparison</CardTitle>
              <CardDescription>Detailed metrics for each communication channel</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                {metrics.map(metric => (
                  <div key={metric.channel} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-full bg-gray-50',
                          getChannelColor(metric.channel)
                        )}
                      >
                        {getChannelIcon(metric.channel)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium capitalize">{metric.channel}</h4>
                        <p className="text-sm text-gray-600">
                          {metric.sent.toLocaleString()} sent • {formatCurrency(metric.cost)} cost •{' '}
                          {formatCurrency(metric.revenue)} revenue
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        {metric.roi === Infinity ? '∞' : `${metric.roi}%`} ROI
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-11">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Delivery</span>
                          <span>{formatPercentage(metric.deliveryRate)}</span>
                        </div>
                        <Progress value={metric.deliveryRate} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Open Rate</span>
                          <span>{formatPercentage(metric.openRate)}</span>
                        </div>
                        <Progress value={metric.openRate} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Click Rate</span>
                          <span>{formatPercentage(metric.clickRate)}</span>
                        </div>
                        <Progress value={metric.clickRate} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Bounce Rate</span>
                          <span className="text-red-600">
                            {formatPercentage(metric.bounceRate)}
                          </span>
                        </div>
                        <Progress value={metric.bounceRate} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends & Insights */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Channel Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Message Distribution</CardTitle>
                <CardDescription>Messages sent by channel over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.map(metric => {
                    const percentage = totals.sent > 0 ? (metric.sent / totals.sent) * 100 : 0;
                    return (
                      <div key={metric.channel} className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-full bg-gray-50',
                            getChannelColor(metric.channel)
                          )}
                        >
                          {getChannelIcon(metric.channel)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{metric.channel}</span>
                            <span>{formatPercentage(percentage)}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{metric.sent.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">sent</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Important findings from your communication data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Best Performing Channel</h4>
                        <p className="text-sm text-blue-700">
                          Push notifications have the highest ROI at{' '}
                          {Math.max(...metrics.map(m => (m.roi === Infinity ? 0 : m.roi)))}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">Highest Delivery Rate</h4>
                        <p className="text-sm text-green-700">
                          In-app notifications achieve 100% delivery rate
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-900">Improvement Opportunity</h4>
                        <p className="text-sm text-orange-700">
                          Email open rates could be improved with better subject lines
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Recommendations */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>
                AI-powered suggestions to improve your communication performance
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {recommendations.map(rec => (
                  <div key={rec.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-full">
                          <Lightbulb className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{rec.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getImpactBadge(rec.impact)}
                        {getEffortBadge(rec.effort)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {rec.channel && (
                          <div className="flex items-center gap-2">
                            {getChannelIcon(rec.channel)}
                            <span className="capitalize">{rec.channel}</span>
                          </div>
                        )}
                        <span className="text-green-600 font-medium">
                          +{rec.potentialImprovement}% potential improvement
                        </span>
                      </div>
                      <Button size="sm" variant="outline">
                        <Zap className="h-4 w-4 mr-2" />
                        Implement
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Optimization Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Mail className="h-6 w-6 mb-2" />
                  <span className="text-sm">A/B Test Email Subject Lines</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  <span className="text-sm">Optimize Send Times</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-sm">Create User Segments</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
