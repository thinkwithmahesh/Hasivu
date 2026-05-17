'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { useAuth } from '@/contexts/auth-context';

export default function VendorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const workspaces = [
    {
      title: 'Order Queue',
      description: 'Review school meal demand and fulfillment status.',
      href: '/vendor/orders',
      testId: 'vendor-orders',
    },
    {
      title: 'Inventory',
      description: 'Track ingredients, low-stock risks, and replenishment needs.',
      href: '/vendor/inventory',
      testId: 'vendor-inventory',
    },
    {
      title: 'Forecasting',
      description: 'Plan supply volumes from order trends and upcoming menus.',
      href: '/vendor/forecasting',
      testId: 'vendor-forecasting',
    },
    {
      title: 'Payments',
      description: 'Review payment status, settlements, and refunds.',
      href: '/vendor/payments',
      testId: 'vendor-payments',
    },
  ];

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={[UserRole.VENDOR]}>
      <main className="min-h-screen bg-[var(--hasivu-bg-warm)] px-4 py-8 text-[var(--hasivu-text-primary)]">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="rounded-3xl border border-[var(--hasivu-border)] bg-[var(--hasivu-surface)] p-6 shadow-[var(--shadow-sm)] md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--hasivu-secondary)]">
                  Vendor portal
                </p>
                <h1 className="mt-3 text-3xl font-bold md:text-4xl" data-testid="dashboard-title">
                  Vendor Dashboard
                </h1>
              </div>
              <Button type="button" variant="outline" onClick={handleLogout}>
                Log out
              </Button>
            </div>
            <div className="mt-4 text-sm text-[var(--hasivu-text-secondary)]" data-testid="user-info">
              <span data-testid="user-name">
                {user ? `${user.firstName} ${user.lastName}` : 'Vendor User'}
              </span>
              <span className="mx-2">/</span>
              <span data-testid="user-role">{user?.role || 'vendor'}</span>
            </div>
            <p className="mt-5 max-w-3xl text-[var(--hasivu-text-secondary)]">
              Coordinate meal demand, inventory, fulfillment, and payment readiness from one
              secure vendor workspace.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workspaces.map(workspace => (
              <Link key={workspace.title} href={workspace.href} data-testid={workspace.testId}>
                <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
                  <CardHeader>
                    <CardTitle className="text-lg">{workspace.title}</CardTitle>
                    <CardDescription>{workspace.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Open Orders</CardTitle>
                <CardDescription>Orders awaiting vendor review.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-700">24</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Items</CardTitle>
                <CardDescription>Inventory lines needing attention.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-700">3</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Settlement Status</CardTitle>
                <CardDescription>Current payment processing summary.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-700">Ready</p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
