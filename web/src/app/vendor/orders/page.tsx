'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';

const vendorOrders = [
  {
    id: 'VO-1001',
    school: 'Hasivu Demo School',
    items: 'Brown rice, seasonal vegetables',
    status: 'Ready for kitchen confirmation',
    amount: 'Rs.1,125',
  },
  {
    id: 'VO-1002',
    school: 'Hasivu Demo School',
    items: 'Dal, fruit cups',
    status: 'Scheduled for tomorrow',
    amount: 'Rs.2,480',
  },
];

export default function VendorOrdersPage() {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={[UserRole.VENDOR]}>
      <main className="min-h-screen bg-[var(--hasivu-bg-warm)] px-4 py-8 text-[var(--hasivu-text-primary)]">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--hasivu-secondary)]">
                Vendor workspace
              </p>
              <h1 className="mt-2 text-3xl font-bold">Vendor Order Queue</h1>
              <p className="mt-2 text-[var(--hasivu-text-secondary)]">
                Track meal demand, fulfillment status, and kitchen handoff readiness.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/vendor">Back to Vendor Dashboard</Link>
            </Button>
          </div>

          <div className="grid gap-4">
            {vendorOrders.map(order => (
              <Card key={order.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3">
                    <span>{order.id}</span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                      {order.status}
                    </span>
                  </CardTitle>
                  <CardDescription>{order.school}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <span className="font-semibold">Items:</span> {order.items}
                  </p>
                  <p>
                    <span className="font-semibold">Value:</span> {order.amount}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
