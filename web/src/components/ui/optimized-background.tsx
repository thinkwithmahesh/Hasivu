'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'minimal' | 'gradient' | 'pattern';
}

export function OptimizedBackground({
  children,
  className = '',
  variant = 'minimal',
}: OptimizedBackgroundProps) {
  const backgroundClasses = {
    minimal: 'bg-gradient-to-b from-white via-slate-50/50 to-slate-100/30',
    gradient: 'bg-gradient-to-br from-emerald-50/30 via-white to-cyan-50/20',
    pattern:
      'bg-gradient-to-b from-white via-slate-50/80 to-slate-100/60 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.05)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.05)_0%,transparent_50%)]',
  };

  return (
    <div className={cn('min-h-screen relative', backgroundClasses[variant], className)}>
      {/* Subtle decorative elements - CSS only, no JS animations */}
      {variant === 'pattern' && (
        <>
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.02]">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-emerald-400 to-transparent blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-l from-cyan-400 to-transparent blur-3xl" />
          </div>
        </>
      )}
      {children}
    </div>
  );
}
