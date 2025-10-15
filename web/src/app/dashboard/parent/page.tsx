'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole, Permission } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ParentDashboard() {
  return (
    <ProtectedRoute
      requireAuth={true}
      allowedRoles={[UserRole.PARENT]}
      requiredPermissions={[Permission.MANAGE_CHILDREN, Permission.PLACE_ORDERS]}
    >
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Parent Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">👶</span>
                My Children
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage your children's profiles and meal preferences</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                Place Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Order meals for your children and schedule deliveries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💳</span>
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage payment methods and view transaction history</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View past orders and track current meal deliveries</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
