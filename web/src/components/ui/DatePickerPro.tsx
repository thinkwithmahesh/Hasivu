// web/src/components/ui/DatePickerPro.tsx
import { InputHTMLAttributes } from 'react';

export function DatePickerPro({
  label,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>
      <input
        id={id}
        type="date"
        className="min-h-[48px] w-full rounded-[6px] border border-[var(--pm-neutral-200)] bg-white px-3 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pm-primary-600)]"
        {...props}
      />
    </div>
  );
}
