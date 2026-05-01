// web/src/components/ui/SwitchPro.tsx
'use client';

import { motion } from 'framer-motion';

export function SwitchPro({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="text-[14px]">{label}</span>
      <button
        type="button"
        onClick={() => onCheckedChange(!checked)}
        className={`relative h-7 w-12 rounded-[999px] ${checked ? 'bg-[var(--pm-primary-600)]' : 'bg-[var(--pm-neutral-200)]'}`}
        aria-checked={checked}
        role="switch"
        aria-label={label}
      >
        <motion.span
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="absolute top-1 inline-block h-5 w-5 rounded-[999px] bg-white"
        />
      </button>
    </label>
  );
}
