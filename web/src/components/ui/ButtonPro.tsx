// web/src/components/ui/ButtonPro.tsx
'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variantClass: Record<Variant, string> = {
  primary: 'bg-[var(--pm-primary-600)] text-white',
  secondary: 'bg-[var(--pm-secondary-600)] text-white',
  ghost: 'bg-transparent text-[var(--pm-text-primary)]',
  danger: 'bg-red-600 text-white',
};

const sizeClass: Record<Size, string> = {
  sm: 'min-h-[40px] px-3 text-[13px]',
  md: 'min-h-[48px] px-4 text-[14px]',
  lg: 'min-h-[56px] px-5 text-[16px]',
};

export function ButtonPro({
  children,
  loading = false,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      whileHover={reduced ? undefined : { scale: 1.02 }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
    >
      <button
        disabled={loading || props.disabled}
        className={cn(
          'inline-flex min-w-[48px] items-center justify-center gap-2 rounded-[6px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pm-primary-600)] disabled:opacity-60',
          variantClass[variant],
          sizeClass[size],
          className
        )}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : null}
        {children}
      </button>
    </motion.span>
  );
}
