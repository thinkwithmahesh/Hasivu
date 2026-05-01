// web/src/components/ui/CheckboxPro.tsx
'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export function CheckboxPro({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex min-h-[48px] items-center gap-2">
      <button
        type="button"
        onClick={() => onCheckedChange(!checked)}
        className="relative h-5 w-5 rounded-[6px] border border-[var(--pm-neutral-400)]"
        aria-checked={checked}
        role="checkbox"
        aria-label={label}
      >
        {checked ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-[var(--pm-primary-600)] text-white"
          >
            <Check className="h-3 w-3" />
          </motion.span>
        ) : null}
      </button>
      <span className="text-[14px]">{label}</span>
    </label>
  );
}
