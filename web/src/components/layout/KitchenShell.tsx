'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';

export interface KitchenShellProps {
  children: React.ReactNode;
}

export function KitchenShell({ children }: KitchenShellProps) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  const tabs = [
    { id: 'by-class', label: 'By Class', href: '/dashboard/kitchen' },
    { id: 'by-meal', label: 'By Meal', href: '/kitchen/schedule' },
    { id: 'served', label: 'Served', href: '/kitchen/inventory' },
    { id: 'pending', label: 'Pending', href: '/kitchen-management' },
  ];

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-pm-page-bg text-pm-text-primary antialiased font-ui">
      <header className="shrink-0 border-b border-pm-neutral-200 bg-pm-surface-1 px-5 py-4">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between">
          <div>
            <h1 className="text-[24px] font-bold leading-[1.3]">Thursday, 10 April</h1>
            <p className="text-[16px] text-pm-text-secondary">247 orders today</p>
          </div>
          <Link
            href="/auth/login"
            className="min-h-touch-target px-4 text-[16px] font-semibold text-pm-semantic-danger"
            aria-label="End kitchen shift"
          >
            End shift
          </Link>
        </div>
        <div className="mx-auto mt-3 flex w-full max-w-[1400px] items-center gap-3 rounded-xl border border-pm-semantic-warning/40 bg-pm-semantic-warning/10 px-3 py-2">
          <span className="text-[16px] font-semibold text-pm-semantic-warning">Rush window</span>
          <span className="text-[16px] text-pm-text-primary">42 pending • prioritize Grade 2 & 3</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-4 scroll-smooth">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0 }}
          animate={reducedMotion ? undefined : { opacity: 1 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}
          className="mx-auto h-full w-full max-w-[1400px]"
        >
          {children}
        </motion.div>
      </main>

      <nav
        aria-label="Kitchen quick tabs"
        className="grid grid-cols-4 border-t border-pm-neutral-200 bg-pm-surface-1"
      >
        {tabs.map(tab => {
          const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="relative flex min-h-touch-target items-center justify-center px-2 py-2 text-[16px] font-semibold"
            >
              {isActive && (
                <motion.span
                  layoutId="kitchen-tab-active"
                  className="absolute inset-1 rounded-[10px] bg-pm-primary-100"
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 320, damping: 28 }
                  }
                />
              )}
              <span className={`relative ${isActive ? 'text-pm-primary-700' : 'text-pm-text-secondary'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
