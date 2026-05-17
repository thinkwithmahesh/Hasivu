'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';

const settlements = [
  { period: 'This week', amount: 'Rs.12,840', status: 'Ready for settlement' },
  { period: 'Last week', amount: 'Rs.10,620', status: 'Settled' },
];

export default function VendorPaymentsPage() {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={[UserRole.VENDOR]}>
      <main className="min-h-screen bg-[var(--hasivu-bg-warm)] px-4 py-8 text-[var(--hasivu-text-primary)]">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--hasivu-secondary)]">
                Vendor workspace
              </p>
              <h1 className="mt-2 text-3xl font-bold">Vendor Payments</h1>
              <p className="mt-2 text-[var(--hasivu-text-secondary)]">
                Review settlement readiness and recent payment status without entering parent checkout.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/vendor">Back to Vendor Dashboard</Link>
            </Button>
          </div>

          <div className="grid gap-4">
            {settlements.map(settlement => (
              <Card key={settlement.period}>
                <CardHeader>
                  <CardDescription>{settlement.period}</CardDescription>
                  <CardTitle>{settlement.amount}</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {settlement.status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
