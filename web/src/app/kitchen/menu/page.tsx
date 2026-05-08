'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Permission, UserRole } from '@/types/auth';

const prepItems = [
  {
    item: 'Chicken Biryani',
    station: 'Hot line',
    prep: '25 min',
    note: 'Keep raita separate. Contains dairy side.',
  },
  {
    item: 'Vegetable Pulao',
    station: 'Vegetarian line',
    prep: '20 min',
    note: 'Use allergy-safe serving utensils.',
  },
  {
    item: 'Dal Rice & Curry',
    station: 'Main line',
    prep: '18 min',
    note: 'Batch by grade pickup window.',
  },
];

export default function KitchenMenuPage() {
  return (
    <ProtectedRoute
      requireAuth={true}
      allowedRoles={[UserRole.KITCHEN_STAFF]}
      requiredPermissions={[Permission.KITCHEN_ACCESS]}
    >
      <main className="min-h-screen bg-[var(--hasivu-bg-warm)] px-4 py-8 text-[var(--hasivu-text-primary)]">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--hasivu-secondary)]">
                Kitchen workspace
              </p>
              <h1 className="mt-2 text-3xl font-bold">Kitchen Menu Items</h1>
              <p className="mt-2 text-[var(--hasivu-text-secondary)]">
                Preparation notes for today’s school meal service.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/kitchen">Back to Kitchen Dashboard</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {prepItems.map(item => (
              <Card key={item.item}>
                <CardHeader>
                  <CardDescription>{item.station}</CardDescription>
                  <CardTitle>{item.item}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-[var(--hasivu-text-secondary)]">
                  <p>Prep time: {item.prep}</p>
                  <p>{item.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
