'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole, Permission } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ParentDashboard() {
  const workspaces = [
    {
      icon: '👶',
      title: 'My Children',
      description: "Manage your children's profiles and meal preferences",
      href: '/children',
    },
    {
      icon: '🛒',
      title: 'Place Orders',
      description: 'Order meals for your children and schedule deliveries',
      href: '/menu',
    },
    {
      icon: '💳',
      title: 'Payment Methods',
      description: 'Manage payment methods and view transaction history',
      href: '/payment-methods',
    },
    {
      icon: '📋',
      title: 'Order History',
      description: 'View past orders and track current meal deliveries',
      href: '/orders',
    },
  ];

  return (
    <ProtectedRoute
      requireAuth={true}
      allowedRoles={[UserRole.PARENT]}
      requiredPermissions={[Permission.MANAGE_CHILDREN, Permission.PLACE_ORDERS]}
    >
      <div className="min-h-screen bg-[var(--hasivu-bg-warm)] px-4 py-8 text-[var(--hasivu-text-primary)]">
        <div className="container mx-auto">
          <h1 className="mb-8 text-3xl font-bold">Parent Dashboard</h1>

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
