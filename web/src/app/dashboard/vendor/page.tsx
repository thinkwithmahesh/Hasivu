'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole, Permission as Permission } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

export default function VendorDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={[UserRole.VENDOR]}>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Vendor Dashboard</h1>

        <div className="mb-6" data-testid="user-info">
          <div data-testid="user-name">
            {user ? `${user.firstName} ${user.lastName}` : 'Vendor User'}
          </div>
          <div data-testid="user-role">{user?.role || 'vendor'}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                Product Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage your product catalog and inventory</p>
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
              <p className="text-gray-600">View sales analytics and performance metrics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage incoming orders and deliveries</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
