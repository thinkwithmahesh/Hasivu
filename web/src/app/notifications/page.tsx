'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Bell,
  BellRing,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
} from 'lucide-react';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'system' | 'orders'>('all');

  const notifications = [
    {
      id: 1,
      type: 'order',
      title: 'New Order Received',
      message: 'Order #ORD-001 has been placed by Sarah Johnson for lunch delivery at 12:30 PM',
      time: '2 minutes ago',
      read: false,
      priority: 'high',
      icon: BellRing,
      color: 'text-orange-600',
    },
    {
      id: 2,
      type: 'system',
      title: 'Payment Successful',
      message: 'Payment of ₹85 has been processed successfully for Order #ORD-002',
      time: '5 minutes ago',
      read: false,
      priority: 'medium',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      id: 3,
      type: 'system',
      title: 'Low Inventory Alert',
      message: 'Butter Chicken ingredients are running low. Please restock before tomorrow.',
      time: '15 minutes ago',
      read: true,
      priority: 'high',
      icon: AlertTriangle,
      color: 'text-red-600',
    },
    {
      id: 4,
      type: 'order',
      title: 'Order Delivered',
      message: 'Order #ORD-003 has been successfully delivered to David Johnson',
      time: '1 hour ago',
      read: true,
      priority: 'low',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      id: 5,
      type: 'system',
      title: 'New User Registration',
      message: 'New parent account created: Michael Johnson (michael.johnson@email.com)',
      time: '2 hours ago',
      read: true,
      priority: 'medium',
      icon: MessageSquare,
      color: 'text-blue-600',
    },
    {
      id: 6,
      type: 'order',
      title: 'Order Preparation Started',
      message: 'Kitchen has started preparing Order #ORD-004 - Mini Idli with Sambar',
      time: '3 hours ago',
      read: true,
      priority: 'medium',
      icon: Clock,
      color: 'text-yellow-600',
    },
  ];

  const filterNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'system':
        return notifications.filter(n => n.type === 'system');
      case 'orders':
        return notifications.filter(n => n.type === 'order');
      default:
        return notifications;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filterNotifications();

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
                  <div className="font-display font-bold text-2xl text-primary-600">
                    Notifications
                  </div>
                  <div className="text-sm text-gray-600 -mt-1">HASIVU Platform</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                <Bell className="h-4 w-4 mr-1" />
                {unreadCount} unread
              </Badge>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications Center</h1>
          <p className="text-gray-600">
            Stay updated with system alerts, order updates, and platform activities
          </p>
        </div>

        {/* Notification Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 inline-flex">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              {
                key: 'system',
                label: 'System',
                count: notifications.filter(n => n.type === 'system').length,
              },
              {
                key: 'orders',
                label: 'Orders',
                count: notifications.filter(n => n.type === 'order').length,
              },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Today</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-red-600">2</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Order Updates</p>
                  <p className="text-2xl font-bold text-green-600">8</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">System Alerts</p>
                  <p className="text-2xl font-bold text-orange-600">3</p>
                </div>
                <Settings className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Notifications</span>
              <Button variant="outline" size="sm">
                Mark all as read
              </Button>
            </CardTitle>
            <CardDescription>{filteredNotifications.length} notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredNotifications.map(notification => {
                const IconComponent = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                      notification.read
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-blue-50 border-blue-200 shadow-sm'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full bg-white border-2 ${
                        notification.read ? 'border-gray-300' : 'border-blue-300'
                      }`}
                    >
                      <IconComponent className={`h-4 w-4 ${notification.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4
                          className={`font-medium ${
                            notification.read ? 'text-gray-700' : 'text-gray-900'
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={getPriorityColor(notification.priority)}
                          >
                            {notification.priority}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p
                        className={`text-sm mb-2 ${
                          notification.read ? 'text-gray-600' : 'text-gray-700'
                        }`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">{notification.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
