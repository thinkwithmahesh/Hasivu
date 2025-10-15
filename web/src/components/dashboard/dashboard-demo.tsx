'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentDashboard, ParentDashboard, AdminDashboard, KitchenDashboard } from './index';
import { Student } from './types';
import { Users, UserCheck, Shield, ChefHat, School } from 'lucide-react';

// Mock data for demo
const mockStudent: Student = {
  id: 'student-1',
  name: 'Arjun Sharma',
  class: '8',
  section: 'A',
  rollNumber: '15',
  avatar: '/avatars/arjun.jpg',
  rfidCode: 'HSV8A015',
};

const mockChildren: Student[] = [
  {
    id: 'child-1',
    name: 'Arjun Sharma',
    class: '8',
    section: 'A',
    rollNumber: '15',
    avatar: '/avatars/arjun.jpg',
  },
  {
    id: 'child-2',
    name: 'Priya Sharma',
    class: '5',
    section: 'B',
    rollNumber: '22',
    avatar: '/avatars/priya.jpg',
  },
];

export function DashboardDemo() {
  const [currentRole, setCurrentRole] = useState<'student' | 'parent' | 'admin' | 'kitchen'>(
    'student'
  );

  const roleInfo = {
    student: {
      title: 'Student Dashboard',
      description: 'Personal nutrition tracking, meal orders, achievements, and RFID pickup system',
      icon: UserCheck,
      color: 'text-blue-600',
    },
    parent: {
      title: 'Parent Dashboard',
      description:
        "Monitor children's meal orders, nutrition, spending, and receive real-time notifications",
      icon: Users,
      color: 'text-green-600',
    },
    admin: {
      title: 'Admin Dashboard',
      description:
        'School-wide analytics, order management, nutrition reports, and operational insights',
      icon: Shield,
      color: 'text-purple-600',
    },
    kitchen: {
      title: 'Kitchen Dashboard',
      description:
        'Real-time order processing, inventory management, and kitchen operations tracking',
      icon: ChefHat,
      color: 'text-orange-600',
    },
  };

  const currentInfo = roleInfo[currentRole];
  const CurrentIcon = currentInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <School className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">HASIVU Dashboard Demo</h1>
                <p className="text-gray-600 mt-1">
                  Role-based dashboard components for school meal platform
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CurrentIcon className={`h-5 w-5 ${currentInfo.color}`} />
              {currentInfo.title}
            </CardTitle>
            <CardDescription>{currentInfo.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={currentRole}
              onValueChange={value => setCurrentRole(value as any)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Student
                </TabsTrigger>
                <TabsTrigger value="parent" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Parent
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="kitchen" className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4" />
                  Kitchen
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="student" className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Student Dashboard Features:
                    </h3>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Nutrition tracking with daily/weekly progress charts</li>
                      <li>• Meal order history with status updates</li>
                      <li>• Achievement system with progress indicators</li>
                      <li>• RFID pickup code display for contactless collection</li>
                      <li>• Favorite meals carousel and wallet balance</li>
                    </ul>
                  </div>
                  <StudentDashboard student={mockStudent} />
                </TabsContent>

                <TabsContent value="parent" className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-green-900 mb-2">
                      Parent Dashboard Features:
                    </h3>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Multi-child management with individual tracking</li>
                      <li>• Real-time order status and pickup notifications</li>
                      <li>• Spending analytics with weekly/monthly trends</li>
                      <li>• Wallet balance monitoring with low balance alerts</li>
                      <li>• Payment history and nutrition oversight</li>
                    </ul>
                  </div>
                  <ParentDashboard children={mockChildren} />
                </TabsContent>

                <TabsContent value="admin" className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-purple-900 mb-2">
                      Admin Dashboard Features:
                    </h3>
                    <ul className="text-purple-800 text-sm space-y-1">
                      <li>• School-wide analytics with revenue and order metrics</li>
                      <li>• Order management table with bulk operations</li>
                      <li>• Student nutrition compliance reports by grade</li>
                      <li>• Kitchen operations overview and performance tracking</li>
                      <li>• Financial summaries and export capabilities</li>
                    </ul>
                  </div>
                  <AdminDashboard />
                </TabsContent>

                <TabsContent value="kitchen" className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-orange-900 mb-2">
                      Kitchen Dashboard Features:
                    </h3>
                    <ul className="text-orange-800 text-sm space-y-1">
                      <li>• Real-time order queue with priority sorting</li>
                      <li>• Inventory management with low stock alerts</li>
                      <li>• Kitchen operations tracking and task assignment</li>
                      <li>• Preparation time analytics and performance metrics</li>
                      <li>• Daily meal count planning and completion tracking</li>
                    </ul>
                  </div>
                  <KitchenDashboard />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Technical Information */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
            <CardDescription>
              Built with modern React patterns and ShadCN UI components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Components Used</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• ShadCN Cards</li>
                  <li>• Recharts Analytics</li>
                  <li>• Data Tables</li>
                  <li>• Progress Indicators</li>
                  <li>• Tabs Navigation</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Mobile Responsive</li>
                  <li>• TypeScript Interfaces</li>
                  <li>• Real-time Updates</li>
                  <li>• Interactive Charts</li>
                  <li>• Role-based Access</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">School Context</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• RFID Integration</li>
                  <li>• Nutrition Tracking</li>
                  <li>• Meal Programs</li>
                  <li>• Multi-role Support</li>
                  <li>• Real-time Alerts</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Performance</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Optimized Loading</li>
                  <li>• Skeleton States</li>
                  <li>• Efficient Rendering</li>
                  <li>• Data Caching</li>
                  <li>• Error Boundaries</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
