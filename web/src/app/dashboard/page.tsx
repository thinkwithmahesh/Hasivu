'use client';

import { ParentDashboard } from '@/components/dashboard/ParentDashboard';
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';

export default function DashboardPage() {
  const reduced = useReducedMotion();

  return (
    <LazyMotion features={domAnimation}>
      <m.main
        aria-label="Dashboard"
        initial={reduced ? undefined : { opacity: 0, y: 12 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.35 }}
      >
        <ParentDashboard />
      </m.main>
    </LazyMotion>
  );
}
