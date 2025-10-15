 * HASIVU Platform - Dashboard Data Integration Hook
 * Real-time dashboard updates with analytics and live metrics;
import { useState, useCallback, useEffect, useMemo } from 'react';
import { api } from '../lib/api-client';
import { useAuth } from '../contexts/auth-context';
import { useLiveAnalytics } from './use-realtime';
  }>;
  }>;
  recentOrders: any[];
  notifications: any[];
  isLoading: boolean;
  lastUpdated: Date | null;
// TODO: Refactor this function - it may be too long
  const { user, hasRole } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({}
    orderTrends: { labels: [], datasets: [] },
    revenueTrends: { labels: [], datasets: [] },
    userEngagement: { labels: [], datasets: [] },
    popularItems: [],
    recentOrders: [],
    notifications: [],
    isLoading: false,
    lastUpdated: null
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const _liveAnalytics =  useLiveAnalytics(hasRole(['admin', 'teacher']) ? 'school' : 'user');
  // Load dashboard data
  const _loadDashboardData =  useCallback(async (
      setDashboardData(prev 
      const _params =  {}
  // Load different data based on user role
      const dataPromises 
  // Add user engagement for admins/ teachers
      if (hasRole(['admin', 'teacher'])) {}
      const []
] = await Promise.all(dataPromises);
      // Process dashboard metrics
      let metrics: _DashboardMetrics =  {}
      if (dashboardResponse.success) {}
        metrics 
  // Process chart data
      let orderTrends: _ChartData =  { labels: [], datasets: [] };
      if (orderStatsResponse.success) {}
]
      let revenueTrends: _ChartData =  { labels: [], datasets: [] };
      if (revenueStatsResponse.success) {}
]
      let userEngagement: _ChartData =  { labels: [], datasets: [] };
      if (userEngagementResponse?.success) {}
]
  // Process popular items
      const _popularItems =  popularItemsResponse.success
        ? popularItemsResponse.data.map((item: any) 
      setDashboardData({}
      setDashboardData(_prev = > ({ ...prev, isLoading: false }));
  }, [period, user, hasRole]);
  // Apply live analytics updates
  useEffect((
        lastUpdated: new Date(value.timestamp)
  }, [liveAnalytics.metrics]);
  // Auto-refresh dashboard data
  useEffect((
  }, [loadDashboardData, refreshInterval]);
  // Calculate percentage changes
  const _percentageChanges =  useMemo((
  }, [dashboardData.lastUpdated]);
  // Export dashboard data
  const exportDashboard = useCallback(async (format: 'pdf' | 'excel' = 'pdf'
      if (response) {}
        link.download = `dashboard-report-${period}.${format}``
          { label: 'Total Revenue', value: `₹${dashboard.metrics.totalRevenue}``
          { label: 'Customer Satisfaction', value: `${dashboard.metrics.customerSatisfaction}%``
          { label: 'Today Revenue', value: `₹${dashboard.metrics.todayRevenue}``
          { label: 'Today Revenue', value: `₹${dashboard.metrics.todayRevenue}``
          { label: 'Avg Prep Time', value: `${dashboard.metrics.averageDeliveryTime}min``
          { label: 'Fulfillment Rate', value: `${dashboard.metrics.orderFulfillmentRate}%``
        { label: 'Wallet Balance', value: `₹${user?.wallet?.balance || 0}``
        { label: 'This Month Spent', value: `₹${dashboard.metrics.monthlyRevenue}``
        { label: 'Avg Order Value', value: `₹${dashboard.metrics.averageOrderValue}``