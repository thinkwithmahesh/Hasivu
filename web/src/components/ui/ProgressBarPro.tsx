// web/src/components/ui/ProgressBarPro.tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function ProgressBarPro({ value, max = 100 }: { value: number; max?: number }) {
  const reduced = useReducedMotion();
  const percent = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 w-full rounded-[999px] bg-[var(--pm-surface-3)]">
      <motion.div
        initial={reduced ? undefined : { width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: reduced ? 0 : 0.3 }}
        className="h-full rounded-[999px] bg-[var(--pm-primary-600)]"
      />
    </div>
  );
}
