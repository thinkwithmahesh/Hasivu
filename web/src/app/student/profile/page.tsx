'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { useAuth } from '@/contexts/auth-context';

export default function StudentProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={[UserRole.STUDENT]}>
      <main className="min-h-screen bg-[var(--hasivu-bg-warm)] px-4 py-8 text-[var(--hasivu-text-primary)]">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--hasivu-secondary)]">
                Student workspace
              </p>
              <h1 className="mt-2 text-3xl font-bold">Profile & Dietary Needs</h1>
              <p className="mt-2 text-[var(--hasivu-text-secondary)]">
                Review student meal preferences, allergies, and pickup guidance.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/student">Back to Student Dashboard</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardDescription>Student</CardDescription>
                <CardTitle>
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Demo Student'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-[var(--hasivu-text-secondary)]">
                <p>Email: {user?.email || 'student.demo@hasivu.local'}</p>
                <p>Meal balance: Rs 150.00</p>
                <p>Pickup method: RFID verification</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Dietary profile</CardDescription>
                <CardTitle>No critical allergy alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-[var(--hasivu-text-secondary)]">
                <p>Preference: Balanced vegetarian options available</p>
                <p>Nutrition goal: Lunch under 750 calories</p>
                <p>School contact updates are managed by the parent or school admin.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
