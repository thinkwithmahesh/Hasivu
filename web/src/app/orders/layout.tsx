// web/src/app/orders/layout.tsx
import { ReactNode } from 'react';
import { ParentShell } from '@/components/layout/ParentShell';

export default function OrdersLayout({ children }: { children: ReactNode }) {
  return <ParentShell>{children}</ParentShell>;
}
