import React from 'react';
import { KitchenShell } from '../../components/layout/KitchenShell';

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return <KitchenShell>{children}</KitchenShell>;
}
