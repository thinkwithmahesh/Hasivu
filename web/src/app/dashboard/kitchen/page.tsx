'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole, Permission } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

export default function KitchenDashboard() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const workspaces = [
    {
      icon: '⏰',
      title: 'Preparation Queue',
      description: 'View and manage the meal preparation queue',
      href: '/kitchen-management',
    },
    {
      icon: '📦',
      title: 'Inventory',
      description: 'Track ingredients and manage kitchen inventory',
      href: '/kitchen/inventory',
    },
    {
      icon: '✅',
      title: 'Order Status',
      description: 'Update order preparation and completion status',
      href: '/kitchen-management',
    },
    {
      icon: '🍽️',
      title: 'Menu Items',
      description: 'View available menu items and preparation notes',
      href: '/kitchen/menu',
    },
  ];

  return (
    <ProtectedRoute
      requireAuth={true}
      allowedRoles={[UserRole.KITCHEN_STAFF]}
      requiredPermissions={[Permission.KITCHEN_ACCESS, Permission.VIEW_KITCHEN_QUEUE]}
    >
      <div className="min-h-screen bg-[var(--hasivu-bg-warm)] px-4 py-8 text-[var(--hasivu-text-primary)]">
        <div className="container mx-auto">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--hasivu-secondary)]">
                Kitchen workspace
              </p>
              <h1 className="mt-3 text-3xl font-bold">Kitchen Management</h1>
            </div>
            <Button type="button" variant="outline" onClick={handleLogout}>
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
