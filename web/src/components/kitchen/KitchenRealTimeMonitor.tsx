'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Clock,
  Thermometer,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  AlertCircle,
  Gauge,
  Users,
  Package,
  Star,
  ShieldCheck,
  Brain,
  BarChart3,
  Eye,
  Settings,
  Target,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription as CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription as AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Real-time monitoring interfaces
interface RealTimeMetrics {
  timestamp: Date;
  orderProcessingRate: number; // orders per minute
  averageWaitTime: number; // minutes
  kitchenCapacityUtilization: number; // percentage
  activeOrdersCount: number;
  completedOrdersToday: number;
  energyConsumption: number; // kWh current
  temperatureCompliance: number; // percentage
  staffEfficiency: number; // percentage
  customerSatisfaction: number; // real-time rating
  criticalAlerts: Alert[];
  equipmentStatus: EquipmentStatus[];
  networkStatus: 'connected' | 'degraded' | 'offline';
  systemHealth: number; // percentage
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
  priority: number;
  category: 'food_safety' | 'equipment' | 'staff' | 'order' | 'system';
  actionRequired?: string;
}

interface EquipmentStatus {
  id: string;
  name: string;
  type: 'oven' | 'refrigerator' | 'fryer' | 'grill' | 'dishwasher' | 'prep_station';
  status: 'operational' | 'warning' | 'error' | 'maintenance';
  temperature?: number;
  utilization: number; // percentage
  batteryLevel?: number; // for wireless equipment
  lastMaintenance: Date;
  nextMaintenance: Date;
  efficiency: number; // percentage
  errorCodes?: string[];
}

interface LiveStats {
  ordersInQueue: number;
  averageOrderTime: number;
  peakCapacityReached: boolean;
  sustainabilityScore: number;
  qualityMetrics: {
    foodSafety: number;
    consistency: number;
    customerFeedback: number;
  };
  predictiveInsights: {
    estimatedRushTime: string;
    recommendedStaffing: number;
    inventoryAlerts: string[];
  };
}

export const KitchenRealTimeMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, _setRefreshInterval] = useState(5000); // 5 seconds

  // Simulate real-time data updates
  useEffect(() => {
    const generateMockMetrics = (): RealTimeMetrics => ({
      timestamp: new Date(),
      orderProcessingRate: 12 + Math.random() * 8, // 12-20 orders/min
      averageWaitTime: 8 + Math.random() * 7, // 8-15 minutes
      kitchenCapacityUtilization: 70 + Math.random() * 25, // 70-95%
      activeOrdersCount: 25 + Math.floor(Math.random() * 15), // 25-40 orders
      completedOrdersToday: 180 + Math.floor(Math.random() * 50), // 180-230 orders
      energyConsumption: 45 + Math.random() * 15, // 45-60 kWh
      temperatureCompliance: 95 + Math.random() * 5, // 95-100%
      staffEfficiency: 85 + Math.random() * 10, // 85-95%
      customerSatisfaction: 4.2 + Math.random() * 0.6, // 4.2-4.8
      criticalAlerts: [
        {
          id: '1',
          type: 'warning',
          message: 'Refrigerator temperature slightly elevated',
          timestamp: new Date(Date.now() - 300000), // 5 minutes ago
          resolved: false,
          priority: 3,
          category: 'equipment',
          actionRequired: 'Check door seals and clean coils',
        },
        {
          id: '2',
          type: 'info',
          message: 'Peak lunch rush approaching',
          timestamp: new Date(Date.now() - 600000), // 10 minutes ago
          resolved: false,
          priority: 1,
          category: 'order',
        },
      ],
      equipmentStatus: [
        {
          id: 'oven1',
          name: 'Main Oven #1',
          type: 'oven',
          status: 'operational',
          temperature: 350,
          utilization: 85,
          lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          nextMaintenance: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // 23 days from now
          efficiency: 92,
        },
        {
          id: 'fridge1',
          name: 'Main Refrigerator',
          type: 'refrigerator',
          status: 'warning',
          temperature: 39,
          utilization: 78,
          lastMaintenance: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
          nextMaintenance: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // 16 days from now
          efficiency: 88,
          errorCodes: ['TEMPHIGH'],
        },
      ],
      networkStatus: 'connected',
      systemHealth: 94,
    });

    const generateLiveStats = (): LiveStats => ({
      ordersInQueue: 15 + Math.floor(Math.random() * 10),
      averageOrderTime: 12 + Math.random() * 6,
      peakCapacityReached: Math.random() > 0.7,
      sustainabilityScore: 85 + Math.random() * 10,
      qualityMetrics: {
        foodSafety: 96 + Math.random() * 4,
        consistency: 88 + Math.random() * 8,
        customerFeedback: 4.3 + Math.random() * 0.5,
      },
      predictiveInsights: {
        estimatedRushTime: '12:30 PM',
        recommendedStaffing: 8 + Math.floor(Math.random() * 3),
        inventoryAlerts: ['Low: Tomatoes', 'Critical: Whole wheat bread'],
      },
    });

    if (autoRefresh) {
      const interval = setInterval(() => {
        setMetrics(generateMockMetrics());
        setLiveStats(generateLiveStats());
        setLastUpdate(new Date());
        setIsConnected(Math.random() > 0.02); // 2% chance of connection issues
      }, refreshInterval);

      // Initial load
      setMetrics(generateMockMetrics());
      setLiveStats(generateLiveStats());

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'maintenance':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  if (!metrics || !liveStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status and Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span
              className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}
            >
              {isConnected ? 'Connected' : 'Connection Issues'}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            Last update: {lastUpdate.toLocaleTimeString()}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 text-green-700' : ''}
          >
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMetrics({ ...metrics, timestamp: new Date() });
              setLastUpdate(new Date());
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-Time KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Processing Rate</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {metrics.orderProcessingRate.toFixed(1)}/min
                  </p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12% from avg
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Wait Time</p>
                  <p className="text-2xl font-bold text-green-900">
                    {metrics.averageWaitTime.toFixed(1)}min
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    -5% improvement
                  </p>
                </div>
                <Clock className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Capacity</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {metrics.kitchenCapacityUtilization.toFixed(0)}%
                  </p>
                  <Progress
                    value={metrics.kitchenCapacityUtilization}
                    className="w-full mt-2 h-2"
                  />
                </div>
                <Gauge className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 mb-1">System Health</p>
                  <p className="text-2xl font-bold text-orange-900">{metrics.systemHealth}%</p>
                  <Badge
                    variant={metrics.systemHealth > 90 ? 'default' : 'destructive'}
                    className="mt-1 text-xs"
                  >
                    {metrics.systemHealth > 90 ? 'Excellent' : 'Needs Attention'}
                  </Badge>
                </div>
                <ShieldCheck className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Active Alerts */}
      {metrics.criticalAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-red-800">
                <AlertCircle className="w-5 h-5 mr-2" />
                Active Alerts ({metrics.criticalAlerts.filter(a => !a.resolved).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence>
                {metrics.criticalAlerts
                  .filter(alert => !alert.resolved)
                  .sort((a, b) => b.priority - a.priority)
                  .map(alert => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge
                              variant={alert.type === 'critical' ? 'destructive' : 'secondary'}
                            >
                              {alert.type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {alert.category.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-1">{alert.message}</p>
                          {alert.actionRequired && (
                            <p className="text-xs text-gray-600">Action: {alert.actionRequired}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {alert.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Resolve
                        </Button>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Equipment Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Equipment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.equipmentStatus.map(equipment => (
              <div
                key={equipment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">{equipment.name}</span>
                    <Badge
                      variant={equipment.status === 'operational' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {equipment.status}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {equipment.temperature && (
                      <span className="flex items-center">
                        <Thermometer className="w-3 h-3 mr-1" />
                        {equipment.temperature}°F
                      </span>
                    )}
                    <span className="flex items-center">
                      <Gauge className="w-3 h-3 mr-1" />
                      {equipment.utilization}% util
                    </span>
                    <span className="flex items-center">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      {equipment.efficiency}% eff
                    </span>
                  </div>

                  {equipment.errorCodes && equipment.errorCodes.length > 0 && (
                    <div className="mt-2">
                      {equipment.errorCodes.map(code => (
                        <Badge key={code} variant="destructive" className="text-xs mr-1">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(equipment.status).replace('text', 'bg')}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Live Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              AI Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">Orders in Queue</p>
                <p className="text-xl font-bold text-blue-900">{liveStats.ordersInQueue}</p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Avg Order Time</p>
                <p className="text-xl font-bold text-green-900">
                  {liveStats.averageOrderTime.toFixed(1)}m
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sustainability Score</span>
                <span className="text-lg font-bold text-green-600">
                  {liveStats.sustainabilityScore.toFixed(0)}%
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Food Safety</span>
                  <span className="font-medium">
                    {liveStats.qualityMetrics.foodSafety.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Consistency</span>
                  <span className="font-medium">
                    {liveStats.qualityMetrics.consistency.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Customer Feedback</span>
                  <span className="font-medium flex items-center">
                    <Star className="w-3 h-3 text-yellow-500 mr-1 fill-current" />
                    {liveStats.qualityMetrics.customerFeedback.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-sm font-medium mb-2">Predictive Insights</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Target className="w-3 h-3 mr-2 text-blue-500" />
                  <span>Next rush: {liveStats.predictiveInsights.estimatedRushTime}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-3 h-3 mr-2 text-green-500" />
                  <span>Recommended staff: {liveStats.predictiveInsights.recommendedStaffing}</span>
                </div>
                {liveStats.predictiveInsights.inventoryAlerts.length > 0 && (
                  <div>
                    <div className="flex items-center mb-1">
                      <Package className="w-3 h-3 mr-2 text-orange-500" />
                      <span>Inventory alerts:</span>
                    </div>
                    <div className="pl-5 space-y-1">
                      {liveStats.predictiveInsights.inventoryAlerts.map((alert, index) => (
                        <p key={index} className="text-xs text-gray-600">
                          {alert}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KitchenRealTimeMonitor;
