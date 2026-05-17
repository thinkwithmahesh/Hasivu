'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AdminSidebar } from './AdminSidebar';

export interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AdminShell({ children, title }: AdminShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <div className="flex min-h-screen bg-pm-page-bg text-pm-text-primary antialiased font-body selection:bg-pm-primary-200">
      <AdminSidebar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(v => !v)} />
      <motion.main
        initial={false}
        animate={{ paddingLeft: isCollapsed ? 60 : 240 }}
        transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 28 }}
        className="flex-1"
      >
        <header className="sticky top-0 z-30 h-[60px] border-b border-pm-neutral-200 bg-pm-surface-1/90 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-screen-xl items-center justify-between px-6">
            <div>
              <div className="font-ui text-xs uppercase tracking-wide text-pm-text-tertiary">Admin command</div>
              <div className="font-ui text-sm font-semibold text-pm-text-primary">{title || 'Admin Portal'}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-pm-semantic-warning/10 px-2 py-1 text-xs font-semibold text-pm-semantic-warning">
                Cutoff soon
              </span>
              <span className="rounded-full bg-pm-semantic-info/10 px-2 py-1 text-xs font-semibold text-pm-semantic-info">
                38 pending
              </span>
            </div>
          </div>
        </header>
        <div className="w-full max-w-screen-xl mx-auto px-8 py-8">{children}</div>
      </motion.main>
    </div>
  );
}
