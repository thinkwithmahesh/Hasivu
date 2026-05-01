// web/src/app/kitchen/layout.tsx
import { ReactNode } from 'react';
import { KitchenShell } from '@/components/layout/KitchenShell';

export default function KitchenSegmentLayout({ children }: { children: ReactNode }) {
  return <KitchenShell>{children}</KitchenShell>;
}
