'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

export default function AdminUsersPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={[UserRole.ADMIN, UserRole.SCHOOL_ADMIN]}>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">User Management</h1>

        <div className="mb-6" data-testid="user-info">
          <div data-testid="user-name">
            {user ? `${user.firstName} ${user.lastName}` : 'Admin User'}
          </div>
          <div data-testid="user-role">{user?.role || 'admin'}</div>
        </div>

        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              data-testid="nav-all-users"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              All Users
            </button>
            <button
              data-testid="nav-students"
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Students
            </button>
            <button
              data-testid="nav-staff"
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Staff
            </button>
          </nav>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              User Directory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="user-list">
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold">Students</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="font-medium">Test Student</p>
                      <p className="text-sm text-gray-600">student@hasivu.test</p>
                      <p className="text-sm text-gray-500">ID: STU-001</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="font-medium">Jane Smith</p>
                      <p className="text-sm text-gray-600">jane.smith@hasivu.test</p>
                      <p className="text-sm text-gray-500">ID: STU-002</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-gray-600">john.doe@hasivu.test</p>
                      <p className="text-sm text-gray-500">ID: STU-003</p>
                    </div>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-semibold">Parents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    <div className="p-3 bg-green-50 rounded">
                      <p className="font-medium">Test Parent</p>
                      <p className="text-sm text-gray-600">parent@hasivu.test</p>
                      <p className="text-sm text-gray-500">ID: PAR-001</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <p className="font-medium">Mary Johnson</p>
                      <p className="text-sm text-gray-600">mary.johnson@hasivu.test</p>
                      <p className="text-sm text-gray-500">ID: PAR-002</p>
                    </div>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-semibold">Staff</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    <div className="p-3 bg-orange-50 rounded">
                      <p className="font-medium">Kitchen Staff</p>
                      <p className="text-sm text-gray-600">kitchen@hasivu.test</p>
                      <p className="text-sm text-gray-500">Role: Kitchen Staff</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded">
                      <p className="font-medium">Test Teacher</p>
                      <p className="text-sm text-gray-600">teacher@hasivu.test</p>
                      <p className="text-sm text-gray-500">Role: Teacher</p>
                    </div>
                  </div>
                </div>

                <div className="pb-4">
                  <h3 className="font-semibold">Administrators</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    <div className="p-3 bg-red-50 rounded">
                      <p className="font-medium">Test Admin</p>
                      <p className="text-sm text-gray-600">admin@hasivu.test</p>
                      <p className="text-sm text-gray-500">Role: Admin</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded">
                      <p className="font-medium">School Admin</p>
                      <p className="text-sm text-gray-600">school_admin@hasivu.test</p>
                      <p className="text-sm text-gray-500">Role: School Admin</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-sm text-gray-500">
          <p>Total Users: 9 | Students: 3 | Parents: 2 | Staff: 2 | Admins: 2</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
