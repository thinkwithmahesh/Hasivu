'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Calendar,
} from 'lucide-react';

export default function AnalyticsPage() {
  const analyticsData = {
    totalOrders: 1247,
    totalRevenue: '₹45,680',
    activeUsers: 234,
    averageOrderValue: '₹36.60',
    ordersTrend: '+12%',
    revenueTrend: '+8.5%',
    usersTrend: '+18%',
    avgOrderTrend: '+5.2%',
  };

  const recentMetrics = [
    {
      period: 'Today',
      orders: 47,
      revenue: '₹1,720',
      users: 28,
    },
    {
      period: 'This Week',
      orders: 312,
      revenue: '₹11,440',
      users: 156,
    },
    {
      period: 'This Month',
      orders: 1247,
      revenue: '₹45,680',
      users: 234,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <div>
                  <div className="font-display font-bold text-2xl text-primary-600">Analytics</div>
                  <div className="text-sm text-gray-600 -mt-1">HASIVU Platform</div>
                </div>
              </div>
            </div>
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Analytics</h1>
          <p className="text-gray-600">
            Track performance metrics and usage statistics for your school meal platform
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{analyticsData.totalOrders.toLocaleString()}</div>
              <p className="text-xs text-green-600 font-medium">
                {analyticsData.ordersTrend} from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{analyticsData.totalRevenue}</div>
              <p className="text-xs text-green-600 font-medium">
                {analyticsData.revenueTrend} from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
                <Users className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{analyticsData.activeUsers}</div>
              <p className="text-xs text-green-600 font-medium">
                {analyticsData.usersTrend} from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{analyticsData.averageOrderValue}</div>
              <p className="text-xs text-green-600 font-medium">
                {analyticsData.avgOrderTrend} from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Metrics Table */}
        <Card className="border-0 shadow-soft mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Performance Overview
            </CardTitle>
            <CardDescription>Detailed metrics breakdown by time period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Period</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Orders</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Active Users</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMetrics.map((metric, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{metric.period}</td>
                      <td className="py-3 px-4">{metric.orders.toLocaleString()}</td>
                      <td className="py-3 px-4 text-green-600 font-medium">{metric.revenue}</td>
                      <td className="py-3 px-4">{metric.users}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Popular Menu Items</CardTitle>
              <CardDescription>See which meals students love most</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Peak Hours Analysis</CardTitle>
              <CardDescription>Understand busy times for better planning</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Nutrition Reports</CardTitle>
              <CardDescription>Track student nutrition and dietary habits</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
