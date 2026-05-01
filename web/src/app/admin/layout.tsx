// web/src/app/admin/layout.tsx
import { ReactNode } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';

export default function AdminSegmentLayout({ children }: { children: ReactNode }) {
  return <AdminShell title="Admin Portal">{children}</AdminShell>;
}
