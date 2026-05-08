'use client';

import { ParentShell } from '@/components/layout/ParentShell';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types/auth';

/** Keep bottom nav on Account for parents only — other roles use full-width settings. */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-pm-page-bg text-pm-text-primary">{children}</div>;
  }

  if (user?.role === UserRole.PARENT) {
    return <ParentShell>{children}</ParentShell>;
  }

  return <>{children}</>;
}
