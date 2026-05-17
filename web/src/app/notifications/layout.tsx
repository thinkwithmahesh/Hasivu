'use client';

import { ParentShell } from '@/components/layout/ParentShell';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types/auth';

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-pm-page-bg text-pm-text-primary">{children}</div>;
  }

  if (user?.role === UserRole.PARENT) {
    return <ParentShell>{children}</ParentShell>;
  }

  return <>{children}</>;
}
