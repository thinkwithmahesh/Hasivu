// web/src/components/ui/InputPro.tsx
'use client';

import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
  error?: string;
};

export function InputPro({ label, helperText, error, id, className, ...props }: Props) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-[13px] font-semibold text-[var(--pm-text-primary)]">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          'min-h-[48px] w-full rounded-[6px] border bg-white px-3 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pm-primary-600)]',
          error ? 'border-red-500' : 'border-[var(--pm-neutral-200)]',
          className
        )}
        {...props}
      />
      <p className={cn('text-[12px]', error ? 'text-red-600' : 'text-[var(--pm-text-tertiary)]')}>
        {error || helperText}
      </p>
    </div>
  );
}
