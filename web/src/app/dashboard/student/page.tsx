'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { useAuth } from '@/contexts/auth-context';

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const actions = [
    {
      title: "Today's Menu",
      description: 'Browse available school meals and nutrition details.',
      href: '/menu',
      testId: 'student-menu',
    },
    {
      title: 'My Orders',
      description: 'Track current orders, pickup status, and order history.',
      href: '/orders',
      testId: 'student-orders',
    },
    {
      title: 'RFID Pickup',
      description: 'Review meal collection status and RFID verification guidance.',
      href: '/rfid-verification',
      testId: 'student-rfid',
    },
    {
      title: 'Profile & Dietary Needs',
      description: 'Keep allergies, dietary preferences, and account details current.',
      href: '/student/profile',
      testId: 'student-profile',
    },
  ];

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={[UserRole.STUDENT]}>
      <main className="min-h-screen bg-[var(--hasivu-bg-warm)] px-4 py-8 text-[var(--hasivu-text-primary)]">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="rounded-3xl border border-[var(--hasivu-border)] bg-[var(--hasivu-surface)] p-6 shadow-[var(--shadow-sm)] md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--hasivu-secondary)]">
                  Student meal workspace
                </p>
                <h1 className="mt-3 text-3xl font-bold md:text-4xl" data-testid="dashboard-title">
                  Welcome, {user?.firstName || 'Student'}
                </h1>
              </div>
              <Button type="button" variant="outline" onClick={handleLogout}>
                Log out
              </Button>
            </div>
            <div className="mt-4 text-sm text-[var(--hasivu-text-secondary)]" data-testid="user-info">
              <span data-testid="user-name">
                {user ? `${user.firstName} ${user.lastName}` : 'Student User'}
              </span>
              <span className="mx-2">/</span>
              <span data-testid="user-role">{user?.role || 'student'}</span>
            </div>
            <p className="mt-5 max-w-2xl text-[var(--hasivu-text-secondary)]">
              Use this dashboard to browse meals, review orders, and confirm safe meal collection
              through RFID verification.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {actions.map(action => (
              <Link key={action.title} href={action.href} data-testid={action.testId}>
                <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
                  <CardHeader>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Meal Balance</CardTitle>
                <CardDescription>Local demo balance for ordering validation.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-700" data-testid="meal-balance">
                  Rs 150.00
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Today's Meal</CardTitle>
                <CardDescription>Representative menu item for the demo workspace.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold" data-testid="todays-meal">
                  Dal Rice & Curry
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Nutrition Tracker</CardTitle>
                <CardDescription>Student-facing nutrition summary.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold" data-testid="nutrition-tracker">
                  1,850 cal today
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
