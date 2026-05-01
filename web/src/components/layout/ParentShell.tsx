'use client';

import React from 'react';
import { BottomNav } from './BottomNav';

export interface ParentShellProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export function ParentShell({ children, hideNav = false }: ParentShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-pm-page-bg text-pm-text-primary antialiased font-body selection:bg-pm-primary-200">
      <main
        className={`flex-1 flex flex-col w-full max-w-md mx-auto ${!hideNav ? 'pb-[calc(68px+env(safe-area-inset-bottom))]' : ''}`}
      >
        {children}
      </main>
      {!hideNav && (
        <div className="w-full max-w-md mx-auto">
          <BottomNav />
        </div>
      )}
    </div>
  );
}
