'use client';

import { usePathname } from 'next/navigation';
import { ParentShell } from '@/components/layout/ParentShell';

/**
 * Parent-focused dashboard routes share the mobile shell (bottom nav).
 * Admin / vendor / student dashboards stay full-width without ParentShell.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const useParentShell =
    pathname === '/dashboard' ||
    pathname === '/dashboard/parent' ||
    pathname.startsWith('/dashboard/parent/');

  if (useParentShell) {
    return <ParentShell>{children}</ParentShell>;
  }

  return <>{children}</>;
}
