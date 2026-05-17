// web/src/components/ui/SelectPro.tsx
import { SelectHTMLAttributes } from 'react';

type Option = { label: string; value: string };

export function SelectPro({
  label,
  options,
  id,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Option[];
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>
      <select
        id={id}
        className="min-h-[48px] w-full rounded-[6px] border border-[var(--pm-neutral-200)] bg-white px-3 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pm-primary-600)]"
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
