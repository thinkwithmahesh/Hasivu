'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole, Permission } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <ProtectedRoute
      requireAuth={true}
      allowedRoles={[UserRole.ADMIN, UserRole.SCHOOL_ADMIN]}
      requiredPermissions={[Permission.ADMIN_ACCESS]}
      requireEmailVerification={true}
    >
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage users, roles, and permissions across the platform
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🍽️</span>
                Menu Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Configure meal options, pricing, and availability</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                View system analytics, reports, and performance metrics
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
