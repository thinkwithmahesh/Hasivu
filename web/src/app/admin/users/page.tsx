'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

type UserFilter = 'all' | 'students' | 'staff';

const filterLabels: Record<UserFilter, string> = {
  all: 'All Users',
  students: 'Students',
  staff: 'Staff',
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<UserFilter>('all');

  const buttonClass = (filter: UserFilter) =>
    activeFilter === filter
      ? 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2'
      : 'bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2';

  const showStudents = activeFilter === 'all' || activeFilter === 'students';
  const showStaff = activeFilter === 'all' || activeFilter === 'staff';
  const showAllOnly = activeFilter === 'all';
  const studentRfidCards = [
    { student: 'Test Student', cardId: 'RFID-0001', status: 'Active', lastScan: 'Today 12:10 PM' },
    { student: 'Jane Smith', cardId: 'RFID-0002', status: 'Active', lastScan: 'Yesterday 12:02 PM' },
    { student: 'John Doe', cardId: 'RFID-0003', status: 'Needs review', lastScan: 'Not scanned yet' },
  ];

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
          <nav className="flex space-x-4" aria-label="User directory filters">
            {(Object.keys(filterLabels) as UserFilter[]).map(filter => (
              <button
                key={filter}
                type="button"
                data-testid={`nav-${filter === 'all' ? 'all-users' : filter}`}
                className={buttonClass(filter)}
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filterLabels[filter]}
              </button>
            ))}
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
                {showStudents && (
                <div className="border-b pb-4" data-testid="students-section">
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
                )}

                {showAllOnly && (
                <div className="border-b pb-4" data-testid="parents-section">
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
                )}

                {showStaff && (
                <div className="border-b pb-4" data-testid="staff-section">
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
                )}

                {showAllOnly && (
                <div className="pb-4" data-testid="administrators-section">
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
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {(activeFilter === 'all' || activeFilter === 'students') && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📡</span>
                Student RFID Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-gray-600">
                      <th className="py-3 pr-4 font-semibold">Student</th>
                      <th className="py-3 pr-4 font-semibold">RFID Card</th>
                      <th className="py-3 pr-4 font-semibold">Status</th>
                      <th className="py-3 font-semibold">Last Meal Scan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentRfidCards.map(card => (
                      <tr key={card.cardId} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{card.student}</td>
                        <td className="py-3 pr-4 font-mono">{card.cardId}</td>
                        <td className="py-3 pr-4">
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            {card.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600">{card.lastScan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-sm text-gray-500">
          <p>Total Users: 9 | Students: 3 | Parents: 2 | Staff: 2 | Admins: 2</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
