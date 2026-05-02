'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface KitchenShellProps {
  children: React.ReactNode;
}

export function KitchenShell({ children }: KitchenShellProps) {
  const pathname = usePathname();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard/kitchen' },
    { id: 'schedule', label: 'Schedule', href: '/kitchen/schedule' },
    { id: 'inventory', label: 'Inventory', href: '/kitchen/inventory' },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-pm-surface-2 text-pm-text-primary antialiased font-ui overflow-hidden">
      {/* Massive Top Navigation for Tablets */}
      <header className="h-[88px] flex-shrink-0 bg-pm-surface-1 shadow-sm border-b border-pm-neutral-200 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-6">
          <div className="font-hero text-[32px] text-pm-primary-600 leading-none">
            Kitchen<span className="text-pm-text-tertiary ml-2 text-[24px]">10:45 AM</span>
          </div>
          <div className="h-10 w-px bg-pm-neutral-200 mx-2" />
          <nav aria-label="Kitchen navigation" className="flex gap-4">
            {tabs.map(tab => {
              const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center h-[56px] px-6 rounded-xl font-bold text-[20px] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pm-primary-600 ${
                    isActive
                      ? 'bg-pm-primary-600 text-pm-text-inverse shadow-md'
                      : 'bg-pm-surface-2 text-pm-text-secondary hover:bg-pm-neutral-200'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="flex items-center justify-center h-[56px] px-6 rounded-xl bg-pm-surface-2 text-pm-semantic-danger font-bold text-[18px] hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-pm-primary-600"
          >
            End Shift
          </Link>
        </div>
      </header>

      {/* Main Tablet Content Area */}
      <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
        <div className="max-w-[1400px] mx-auto w-full h-full">{children}</div>
      </main>
    </div>
  );
}
