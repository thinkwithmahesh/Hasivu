'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  label?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  label,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colors = {
    primary: 'bg-pm-primary-600',
    success: 'bg-pm-semantic-success',
    warning: 'bg-pm-semantic-warning',
    danger: 'bg-pm-semantic-danger',
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <div className="flex justify-between items-center text-[12px] font-ui font-semibold text-pm-text-secondary">
          <span>{label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={`w-full bg-pm-neutral-200 rounded-full overflow-hidden ${heights[size]} relative`}
      >
        <motion.div
          className={`${colors[color]} absolute top-0 left-0 bottom-0 rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ ease: 'easeOut', duration: 0.6 }}
        />
      </div>
    </div>
  );
}
