'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, className = '', id, disabled = false, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();
    const inputId = id || React.useId();

    return (
      <div className={`flex flex-col gap-1 w-full ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-ui font-semibold text-pm-text-secondary"
          >
            {label}
          </label>
        )}
        <motion.div
          animate={error && !shouldReduceMotion ? { x: [-4, 4, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <input
            type="date"
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full h-10 px-3 pr-10 rounded-sm border bg-pm-surface-1 font-body text-[14px] text-pm-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 transition-colors ${
              error
                ? 'border-pm-semantic-danger focus-visible:ring-pm-semantic-danger'
                : 'border-pm-neutral-200 focus-visible:ring-pm-primary-600 hover:border-pm-primary-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-pm-surface-2' : ''}`}
            aria-invalid={!!error}
            {...props}
          />
          {/* Custom Calendar Icon overriding native one visually when un-focused if needed */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-pm-text-tertiary bg-pm-surface-1 pl-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </motion.div>
        {error && <span className="text-[12px] text-pm-semantic-danger font-ui">{error}</span>}
      </div>
    );
  }
);
DatePicker.displayName = 'DatePicker';
