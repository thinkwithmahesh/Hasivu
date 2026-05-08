'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

const SCHOOL_FALLBACK = 'School meals';

function schoolDisplayName(): string {
  if (typeof process.env.NEXT_PUBLIC_SCHOOL_DISPLAY_NAME === 'string') {
    const v = process.env.NEXT_PUBLIC_SCHOOL_DISPLAY_NAME.trim();
    if (v) return v;
  }
  return SCHOOL_FALLBACK;
}

export function ParentTopBar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const school = schoolDisplayName();
  const roleFallback = user?.role === 'student' ? 'Student' : 'Parent';
  const greeting =
    user?.firstName?.trim() || user?.name?.trim()?.split(/\s+/)[0] || roleFallback;

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 w-full border-b border-pm-neutral-200/80 bg-pm-surface-1/80 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md supports-[backdrop-filter]:bg-pm-surface-1/65"
      role="banner"
    >
      <div className="mx-auto flex h-[52px] w-full items-center justify-between gap-3 px-4 md:pl-[260px]">
        <div className="min-w-0 flex-1">
          <p className="truncate font-ui text-sm font-bold text-pm-text-primary">{school}</p>
          <p className="truncate text-xs text-pm-text-secondary">Hi, {greeting}</p>
        </div>
        <Link
          href="/notifications"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-pm-text-secondary transition-colors hover:bg-pm-primary-50 hover:text-pm-primary-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-3 font-ui text-xs font-bold text-pm-text-secondary transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pm-primary-500 focus-visible:ring-offset-2"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
