'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';

const forecasts = [
  { label: 'Expected lunch demand', value: '312 meals', detail: '+8% vs last school day' },
  { label: 'Top item forecast', value: 'Vegetable Pulao', detail: 'Likely 96 servings' },
  { label: 'Replenishment risk', value: 'Seasonal vegetables', detail: 'Low stock within 2 days' },
];

export default function VendorForecastingPage() {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={[UserRole.VENDOR]}>
      <main className="min-h-screen bg-[var(--hasivu-bg-warm)] px-4 py-8 text-[var(--hasivu-text-primary)]">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--hasivu-secondary)]">
                Vendor workspace
              </p>
              <h1 className="mt-2 text-3xl font-bold">Demand Forecasting</h1>
              <p className="mt-2 text-[var(--hasivu-text-secondary)]">
                Plan supply volumes using the current launch demand model.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/vendor">Back to Vendor Dashboard</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {forecasts.map(forecast => (
              <Card key={forecast.label}>
                <CardHeader>
                  <CardDescription>{forecast.label}</CardDescription>
                  <CardTitle>{forecast.value}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[var(--hasivu-text-secondary)]">
                  {forecast.detail}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
