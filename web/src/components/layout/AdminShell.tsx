'use client';

import React from 'react';
import { AdminSidebar } from './AdminSidebar';

export interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AdminShell({ children, title }: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-pm-page-bg text-pm-text-primary antialiased font-body selection:bg-pm-primary-200">
      <AdminSidebar />
      <main className="flex-1 transition-all duration-400 ease-in-out pl-[260px] max-lg:pl-20">
        <div className="w-full max-w-7xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
