'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { InventoryManagement } from '@/components/kitchen/InventoryManagement';

export default function VendorInventoryPage() {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={[UserRole.VENDOR]}>
      <main className="min-h-screen bg-[var(--hasivu-bg-warm)] text-[var(--hasivu-text-primary)]">
        <div className="mx-auto max-w-7xl px-4 pt-8">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--hasivu-secondary)]">
                Vendor workspace
              </p>
              <h1 className="mt-2 text-3xl font-bold">Vendor Inventory</h1>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/vendor">Back to Vendor Dashboard</Link>
            </Button>
          </div>
        </div>
        <InventoryManagement />
      </main>
    </ProtectedRoute>
  );
}
