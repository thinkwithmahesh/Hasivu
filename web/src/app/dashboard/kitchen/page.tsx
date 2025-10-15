'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole, Permission } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function KitchenDashboard() {
  return (
    <ProtectedRoute
      requireAuth={true}
      allowedRoles={[UserRole.KITCHEN_STAFF]}
      requiredPermissions={[Permission.KITCHEN_ACCESS, Permission.VIEW_KITCHEN_QUEUE]}
    >
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Kitchen Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⏰</span>
                Preparation Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View and manage the meal preparation queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Track ingredients and manage kitchen inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Update order preparation and completion status</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🍽️</span>
                Menu Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">View available menu items and preparation notes</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
