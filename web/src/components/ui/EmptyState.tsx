import React from 'react';
import { motion } from 'framer-motion';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-8 text-center bg-pm-surface-2 rounded-xl border border-dashed border-pm-neutral-200 ${className}`}
    >
      {icon && (
        <div className="w-16 h-16 rounded-full bg-pm-surface-1 flex items-center justify-center text-pm-text-tertiary mb-4 shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="font-ui font-bold text-[18px] text-pm-text-primary mb-2">{title}</h3>
      <p className="font-body text-[14px] text-pm-text-secondary max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
