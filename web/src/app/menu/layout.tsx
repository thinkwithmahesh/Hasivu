// web/src/app/menu/layout.tsx
import { ReactNode } from 'react';
import { ParentShell } from '@/components/layout/ParentShell';

export default function MenuLayout({ children }: { children: ReactNode }) {
  return <ParentShell>{children}</ParentShell>;
}
