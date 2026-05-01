// web/src/components/ui/BadgePill.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'veg' | 'nonVeg' | 'nuts' | 'gf' | 'df' | 'default';

const variantClass: Record<Variant, string> = {
  veg: 'bg-emerald-100 text-emerald-800',
  nonVeg: 'bg-red-100 text-red-800',
  nuts: 'bg-amber-100 text-amber-800',
  gf: 'bg-blue-100 text-blue-800',
  df: 'bg-gray-100 text-gray-800',
  default: 'bg-[var(--pm-surface-2)] text-[var(--pm-text-secondary)]',
};

export function BadgePill({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-[999px] px-2 py-1 text-[11px] font-semibold',
        variantClass[variant]
      )}
    >
      {children}
    </span>
  );
}
