// web/src/components/ui/CardPro.tsx
import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function CardPro({
  children,
  className,
  clickable = false,
}: {
  children: ReactNode;
  className?: string;
  clickable?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      whileHover={clickable && !reduced ? { y: -2, scale: 1.01 } : undefined}
      className={cn(
        'rounded-[10px] border border-[var(--pm-neutral-200)] bg-white p-4 shadow-[var(--pm-shadow-sm)]',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
