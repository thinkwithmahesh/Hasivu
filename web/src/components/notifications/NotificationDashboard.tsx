/**
 * HASIVU Platform - Notification Dashboard Component
 * Epic 6: Notifications & Communication System
 *
 * Main notification dashboard integrating all communication channels
 * and providing comprehensive notification management
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  MessageSquare,
  Mail,
  Smartphone,
  BarChart3,
  Settings,
  Send,
  Users,
  TrendingUp,
  Activity,
  MessageCircle,
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { CommunicationPreferences } from './CommunicationPreferences';
import { WhatsAppIntegration } from './WhatsAppIntegration';
import { EmailCommunication } from './EmailCommunication';
import { SMSCommunication } from './SMSCommunication';
import { CommunicationAnalytics } from './CommunicationAnalytics';
import { cn } from '@/lib/utils';

interface NotificationDashboardProps {
  userId: string;
  schoolId?: string;
  className?: string;
}

export const NotificationDashboard: React.FC<NotificationDashboardProps> = ({
  userId,
  schoolId: _schoolId,
  className,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChannel, setSelectedChannel] = useState('all');

  // Mock analytics data
  const analyticsData = {
    totalSent: 12500,
    totalDelivered: 11800,
    totalRead: 9200,
    deliveryRate: 94.4,
    readRate: 77.8,
    channelBreakdown: {
      email: { sent: 5000, delivered: 4800, read: 3600 },
      sms: { sent: 3000, delivered: 2900, read: 2800 },
      whatsapp: { sent: 2500, delivered: 2400, read: 1900 },
      push: { sent: 2000, delivered: 1700, read: 900 },
    },
    recentActivity: [
      { channel: 'email', action: 'sent', count: 150, time: '2 hours ago' },
      { channel: 'whatsapp', action: 'delivered', count: 89, time: '1 hour ago' },
      { channel: 'sms', action: 'sent', count: 45, time: '30 minutes ago' },
      { channel: 'push', action: 'read', count: 23, time: '15 minutes ago' },
    ],
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5" />;
      case 'whatsapp':
        return <MessageCircle className="h-5 w-5" />;
      case 'push':
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
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
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Communication Center</h2>
          <p className="text-muted-foreground">
            Multi-channel notification management and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{analyticsData.totalSent.toLocaleString()}</p>
              </div>
              <Send className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center text-sm text-green-600 mt-2">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12.5% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-bold">{formatPercentage(analyticsData.deliveryRate)}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <Badge variant="secondary" className="mt-2">
              Excellent
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Read Rate</p>
                <p className="text-2xl font-bold">{formatPercentage(analyticsData.readRate)}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <Badge variant="outline" className="mt-2">
              Good engagement
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Channels</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-sm text-gray-600 mt-2">Email, SMS, WhatsApp, Push</div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
          <CardDescription>
            Delivery and engagement metrics by communication channel
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {Object.entries(analyticsData.channelBreakdown).map(([channel, data]) => {
              const deliveryRate = (data.delivered / data.sent) * 100;
              const readRate = (data.read / data.sent) * 100;

              return (
                <div
                  key={channel}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-full bg-gray-50', getChannelColor(channel))}>
                      {getChannelIcon(channel)}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{channel}</p>
                      <p className="text-sm text-gray-600">
                        {data.sent.toLocaleString()} sent • {data.delivered.toLocaleString()}{' '}
                        delivered
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-medium">{formatPercentage(deliveryRate)}</p>
                      <p className="text-gray-600">Delivered</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{formatPercentage(readRate)}</p>
                      <p className="text-gray-600">Read</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{data.sent.toLocaleString()}</p>
                      <p className="text-gray-600">Total</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-xs">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 text-xs">
            <Bell className="h-4 w-4" />
            In-App
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2 text-xs">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2 text-xs">
            <MessageSquare className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2 text-xs">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2 text-xs">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest communication activities across all channels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-full bg-gray-50',
                            getChannelColor(activity.channel)
                          )}
                        >
                          {getChannelIcon(activity.channel)}
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {activity.count} {activity.action} via {activity.channel}
                          </p>
                          <p className="text-sm text-gray-600">{activity.time}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{activity.action}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common communication management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('notifications')}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  View Notifications
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('whatsapp')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send WhatsApp Message
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('preferences')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Preferences
                </Button>

                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <NotificationCenter userId={userId} />
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <EmailCommunication />
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms">
          <SMSCommunication />
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp">
          <WhatsAppIntegration />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <CommunicationAnalytics />
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <CommunicationPreferences userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
