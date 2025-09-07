"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, ComposedChart,
  RadialBarChart, RadialBar, ScatterChart, Scatter
} from 'recharts';
import { 
  Zap, TrendingUp, Users, Clock, MapPin, CheckCircle2, 
  AlertTriangle, Wifi, Radio, Eye, Activity, Target,
  ThermometerSun, Droplets, Wind, Sun, Smartphone,
  CreditCard, Scan, UserCheck, Package, Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedFeaturesProps {
  className?: string;
}

// Advanced analytics data for demonstration
const mockAdvancedAnalytics = {
  realTimeMetrics: {
    currentLoad: 78,
    peakCapacity: 95,
    efficiency: 89,
    lastUpdate: new Date(),
    trends: [
      { time: '08:00', load: 45, efficiency: 85, orders: 23 },
      { time: '09:00', load: 62, efficiency: 88, orders: 45 },
      { time: '10:00', load: 58, efficiency: 87, orders: 38 },
      { time: '11:00', load: 78, efficiency: 89, orders: 67 },
      { time: '12:00', load: 95, efficiency: 85, orders: 89 },
      { time: '13:00', load: 82, efficiency: 91, orders: 72 },
      { time: '14:00', load: 56, efficiency: 88, orders: 41 }
    ]
  },
  
  smartPredictions: {
    nextPeakTime: '12:45 PM',
    expectedOrders: 95,
    confidenceLevel: 87,
    recommendedActions: [
      { action: 'Add 2 kitchen staff', priority: 'high', impact: '+15% efficiency' },
      { action: 'Pre-prepare popular items', priority: 'medium', impact: '-3min wait time' },
      { action: 'Open secondary counter', priority: 'low', impact: '+10% capacity' }
    ]
  },

  paymentAnalytics: {
    methods: [
      { name: 'RFID Card', value: 65, amount: 49200, transactions: 1240 },
      { name: 'UPI', value: 25, amount: 18900, transactions: 475 },
      { name: 'Cash', value: 8, amount: 6080, transactions: 152 },
      { name: 'Prepaid', value: 2, amount: 1520, transactions: 38 }
    ],
    fraudDetection: {
      suspicious: 3,
      blocked: 1,
      investigated: 7
    }
  },

  deviceHealth: [
    { 
      id: 'RFID-001', 
      name: 'Main Counter Scanner', 
      status: 'active', 
      batteryLevel: 87, 
      signalStrength: 95,
      lastPing: '2 seconds ago',
      dailyScans: 1247,
      errorRate: 0.2
    },
    { 
      id: 'RFID-002', 
      name: 'Secondary Scanner', 
      status: 'active', 
      batteryLevel: 92, 
      signalStrength: 88,
      lastPing: '5 seconds ago',
      dailyScans: 892,
      errorRate: 0.1
    },
    { 
      id: 'POS-001', 
      name: 'Main Payment Terminal', 
      status: 'active', 
      batteryLevel: 76, 
      signalStrength: 92,
      lastPing: '1 second ago',
      dailyScans: 567,
      errorRate: 0.3
    },
    { 
      id: 'RFID-003', 
      name: 'Mobile Cart Scanner', 
      status: 'warning', 
      batteryLevel: 45, 
      signalStrength: 72,
      lastPing: '2 minutes ago',
      dailyScans: 234,
      errorRate: 1.2
    }
  ],

  environmentalData: {
    temperature: 28,
    humidity: 65,
    airQuality: 'Good',
    crowdDensity: 'Moderate',
    noiseLevel: 52, // dB
    impact: {
      orderFrequency: '+12%',
      avgOrderValue: '+₹8',
      waitTime: '+1.2min'
    }
  }
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const AdvancedFeatures: React.FC<AdvancedFeaturesProps> = ({ className }) => {
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('load');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    if (realTimeEnabled) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-600';
    if (level > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const chartConfig: ChartConfig = {
    load: {
      label: "System Load",
      color: "hsl(var(--chart-1))",
    },
    efficiency: {
      label: "Efficiency",
      color: "hsl(var(--chart-2))",
    },
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-3))",
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Real-time System Health Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced System Analytics</h2>
          <p className="text-muted-foreground">Real-time monitoring and intelligent insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm">
            <div className={cn(
              "h-2 w-2 rounded-full",
              realTimeEnabled ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )}></div>
            <span className="text-muted-foreground">
              {realTimeEnabled ? `Live • ${lastUpdate.toLocaleTimeString()}` : 'Offline'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {realTimeEnabled ? 'Pause' : 'Resume'} Live
          </Button>
        </div>
      </div>

      {/* Real-time Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">System Load</p>
                <p className="text-2xl font-bold">{mockAdvancedAnalytics.realTimeMetrics.currentLoad}%</p>
                <Progress 
                  value={mockAdvancedAnalytics.realTimeMetrics.currentLoad} 
                  className="mt-2 h-1 bg-blue-400/30"
                />
              </div>
              <Activity className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Efficiency</p>
                <p className="text-2xl font-bold">{mockAdvancedAnalytics.realTimeMetrics.efficiency}%</p>
                <p className="text-xs text-green-200 mt-1">↑ 2.3% from yesterday</p>
              </div>
              <Target className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Peak Capacity</p>
                <p className="text-2xl font-bold">{mockAdvancedAnalytics.realTimeMetrics.peakCapacity}%</p>
                <p className="text-xs text-orange-200 mt-1">Max today: 98%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Connected Devices</p>
                <p className="text-2xl font-bold">{mockAdvancedAnalytics.deviceHealth.filter(d => d.status === 'active').length}/{mockAdvancedAnalytics.deviceHealth.length}</p>
                <p className="text-xs text-purple-200 mt-1">All systems operational</p>
              </div>
              <Wifi className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue="realtime" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="realtime">Real-time Monitoring</TabsTrigger>
          <TabsTrigger value="predictions">Smart Predictions</TabsTrigger>
          <TabsTrigger value="devices">Device Health</TabsTrigger>
          <TabsTrigger value="payments">Payment Analytics</TabsTrigger>
          <TabsTrigger value="environment">Environmental</TabsTrigger>
        </TabsList>

        {/* Real-time Monitoring */}
        <TabsContent value="realtime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Live System Performance
                </div>
                {realTimeEnabled && (
                  <Badge variant="outline" className="animate-pulse">
                    <Zap className="h-3 w-3 mr-1" />
                    Live Updates
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Metric Selector */}
                <div className="flex space-x-2">
                  {['load', 'efficiency', 'orders'].map((metric) => (
                    <Button
                      key={metric}
                      variant={selectedMetric === metric ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedMetric(metric)}
                    >
                      {metric.charAt(0).toUpperCase() + metric.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Real-time Chart */}
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockAdvancedAnalytics.realTimeMetrics.trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey={selectedMetric} 
                        stroke={`var(--color-${selectedMetric})`}
                        fill={`var(--color-${selectedMetric})`}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Current Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">System Load</span>
                  <span className="font-bold text-blue-600">{mockAdvancedAnalytics.realTimeMetrics.currentLoad}%</span>
                </div>
                <Progress value={mockAdvancedAnalytics.realTimeMetrics.currentLoad} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Efficiency</span>
                  <span className="font-bold text-green-600">{mockAdvancedAnalytics.realTimeMetrics.efficiency}%</span>
                </div>
                <Progress value={mockAdvancedAnalytics.realTimeMetrics.efficiency} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Network Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Excellent
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Server Response</span>
                  <span className="text-sm font-medium text-green-600">12ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uptime</span>
                  <span className="text-sm font-medium">99.98%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Alert Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-muted-foreground">Critical Alerts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-yellow-600">1</div>
                  <div className="text-xs text-muted-foreground">Warning</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Smart Predictions */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Peak Prediction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg border">
                  <div className="text-2xl font-bold text-yellow-600">
                    {mockAdvancedAnalytics.smartPredictions.nextPeakTime}
                  </div>
                  <div className="text-sm text-yellow-700">Next Peak Expected</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {mockAdvancedAnalytics.smartPredictions.confidenceLevel}% confidence
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Expected Orders:</span>
                    <span className="font-medium">{mockAdvancedAnalytics.smartPredictions.expectedOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Confidence Level:</span>
                    <span className="font-medium">{mockAdvancedAnalytics.smartPredictions.confidenceLevel}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAdvancedAnalytics.smartPredictions.recommendedActions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{action.action}</div>
                        <div className="text-xs text-muted-foreground">Impact: {action.impact}</div>
                      </div>
                      <Badge 
                        variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'secondary' : 'outline'}
                        className="ml-2"
                      >
                        {action.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Device Health */}
        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Radio className="h-5 w-5 mr-2" />
                Device Health Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAdvancedAnalytics.deviceHealth.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "h-3 w-3 rounded-full",
                        device.status === 'active' ? 'bg-green-500' : 
                        device.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      )}></div>
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm text-muted-foreground">{device.id}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className={cn("font-medium", getBatteryColor(device.batteryLevel))}>
                          {device.batteryLevel}%
                        </div>
                        <div className="text-xs text-muted-foreground">Battery</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium">{device.signalStrength}%</div>
                        <div className="text-xs text-muted-foreground">Signal</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium">{device.dailyScans}</div>
                        <div className="text-xs text-muted-foreground">Daily Scans</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={cn(
                          "font-medium",
                          device.errorRate < 0.5 ? 'text-green-600' : 
                          device.errorRate < 1.0 ? 'text-yellow-600' : 'text-red-600'
                        )}>
                          {device.errorRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">Error Rate</div>
                      </div>
                      
                      <Badge className={getStatusColor(device.status)}>
                        {device.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Analytics */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Methods Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockAdvancedAnalytics.paymentAnalytics.methods}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name} ${value}%`}
                      >
                        {mockAdvancedAnalytics.paymentAnalytics.methods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [
                        `${value}% (₹${props.payload.amount.toLocaleString()})`,
                        name
                      ]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {mockAdvancedAnalytics.paymentAnalytics.fraudDetection.suspicious}
                    </div>
                    <div className="text-sm text-yellow-700">Suspicious</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {mockAdvancedAnalytics.paymentAnalytics.fraudDetection.blocked}
                    </div>
                    <div className="text-sm text-red-700">Blocked</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {mockAdvancedAnalytics.paymentAnalytics.fraudDetection.investigated}
                    </div>
                    <div className="text-sm text-blue-700">Investigated</div>
                  </div>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Security Status: Good</AlertTitle>
                  <AlertDescription>
                    All payment systems are secure. No critical security issues detected in the last 24 hours.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Environmental Monitoring */}
        <TabsContent value="environment" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Sun className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{mockAdvancedAnalytics.environmentalData.temperature}°C</div>
                <div className="text-sm text-muted-foreground">Temperature</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Droplets className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{mockAdvancedAnalytics.environmentalData.humidity}%</div>
                <div className="text-sm text-muted-foreground">Humidity</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Wind className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-lg font-bold">{mockAdvancedAnalytics.environmentalData.airQuality}</div>
                <div className="text-sm text-muted-foreground">Air Quality</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-lg font-bold">{mockAdvancedAnalytics.environmentalData.crowdDensity}</div>
                <div className="text-sm text-muted-foreground">Crowd Density</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Environmental Impact on Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {mockAdvancedAnalytics.environmentalData.impact.orderFrequency}
                  </div>
                  <div className="text-sm text-blue-700">Order Frequency</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {mockAdvancedAnalytics.environmentalData.impact.avgOrderValue}
                  </div>
                  <div className="text-sm text-green-700">Avg Order Value</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">
                    {mockAdvancedAnalytics.environmentalData.impact.waitTime}
                  </div>
                  <div className="text-sm text-yellow-700">Wait Time Impact</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};