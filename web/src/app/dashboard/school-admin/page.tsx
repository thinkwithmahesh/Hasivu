'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole, Permission } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

export default function SchoolAdminDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute
      requireAuth={true}
      allowedRoles={[UserRole.SCHOOL_ADMIN]}
      requiredPermissions={[Permission.SCHOOL_ADMIN_ACCESS]}
    >
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">School Admin Dashboard</h1>

        <div className="mb-6" data-testid="user-info">
          <div data-testid="user-name">
            {user ? `${user.firstName} ${user.lastName}` : 'School Admin User'}
          </div>
          <div data-testid="user-role">{user?.role || 'school_admin'}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                School Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage school staff, teachers, and students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                School Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View school-specific performance and usage metrics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🍽️</span>
                School Menu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage school-specific menu and meal programs</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
