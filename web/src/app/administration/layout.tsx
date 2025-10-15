'use client';

import { AdminNavigation } from '@/components/administration/AdminNavigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/types/auth';

export default function AdministrationLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute
      requireAuth={true}
      allowedRoles={[UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN]}
    >
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation />
        <div className="lg:pl-64">{children}</div>
      </div>
    </ProtectedRoute>
  );
}
