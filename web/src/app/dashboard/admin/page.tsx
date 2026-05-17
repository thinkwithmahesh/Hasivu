'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole, Permission } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const workspaces = [
    {
      icon: '👥',
      title: 'User Management',
      description: 'Manage users, roles, and permissions across the platform',
      href: '/admin/users',
    },
    {
      icon: '🍽️',
      title: 'Menu Management',
      description: 'Configure meal options, pricing, and availability',
      href: '/menu',
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'View system analytics, reports, and performance metrics',
      href: '/analytics',
    },
  ];

  return (
    <ProtectedRoute
      requireAuth={true}
      allowedRoles={[UserRole.ADMIN, UserRole.SCHOOL_ADMIN]}
      requiredPermissions={[Permission.ADMIN_ACCESS]}
      requireEmailVerification={true}
    >
      <div className="min-h-screen bg-[var(--hasivu-bg-warm)] px-4 py-8 text-[var(--hasivu-text-primary)]">
        <div className="container mx-auto">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--hasivu-secondary)]">
                Admin workspace
              </p>
              <h1 className="mt-3 text-3xl font-bold">Admin Dashboard</h1>
              <p className="mt-2 text-[var(--hasivu-text-secondary)]">
                Manage school users, menus, permissions, and operational analytics.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => {
                void logout();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map(workspace => (
              <Link key={workspace.title} href={workspace.href} className="block h-full">
                <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{workspace.icon}</span>
                      {workspace.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[var(--hasivu-text-secondary)]">{workspace.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
