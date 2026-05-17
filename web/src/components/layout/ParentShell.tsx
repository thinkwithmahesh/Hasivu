'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { BottomNav } from './BottomNav';
import { ParentTopBar } from './ParentTopBar';
import { useAuth } from '@/contexts/auth-context';

export interface ParentShellProps {
  children: React.ReactNode;
  hideNav?: boolean;
  /** Hide the fixed parent top bar while keeping bottom nav (e.g. immersive flows). */
  hideTopBar?: boolean;
}

function getDesktopNavItems(role?: string) {
  if (role === 'student') {
    return [
      { id: 'home', label: 'Home', href: '/dashboard/student' },
      { id: 'menu', label: 'Menu', href: '/menu' },
      { id: 'orders', label: 'Orders', href: '/orders' },
      { id: 'rfid', label: 'RFID', href: '/rfid-verification' },
      { id: 'account', label: 'Account', href: '/settings' },
    ];
  }

  return [
    { id: 'home', label: 'Home', href: '/dashboard/parent' },
    { id: 'menu', label: 'Menu', href: '/menu' },
    { id: 'orders', label: 'Orders', href: '/orders' },
    { id: 'kids', label: 'Kids', href: '/children' },
    { id: 'account', label: 'Account', href: '/settings' },
  ];
}

function isDesktopNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function ParentShell({ children, hideNav = false, hideTopBar = false }: ParentShellProps) {
  const showChrome = !hideNav;
  const showTopBar = showChrome && !hideTopBar;
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const { user } = useAuth();
  const desktopNavItems = getDesktopNavItems(user?.role);
  const workspaceLabel = user?.role === 'student' ? 'Student Workspace' : 'Parent Workspace';
  const workspaceDescription =
    user?.role === 'student'
      ? 'Meals, orders, and safe pickup'
      : 'Fast ordering and school-day control';

  return (
    <div className="flex min-h-screen bg-pm-page-bg text-pm-text-primary antialiased font-body selection:bg-pm-primary-200">
      {showTopBar && <ParentTopBar />}
      {showChrome && (
        <aside className="fixed left-0 bottom-0 top-[calc(52px+env(safe-area-inset-top,0px))] hidden w-[244px] border-r border-pm-neutral-200/80 bg-pm-surface-1/95 md:flex md:flex-col">
          <div className="border-b border-pm-neutral-100 px-4 py-4">
            <p className="font-ui text-xs font-semibold uppercase tracking-wide text-pm-text-secondary">
              {workspaceLabel}
            </p>
            <p className="mt-1 text-sm text-pm-text-secondary">
              {workspaceDescription}
            </p>
          </div>
          <nav className="w-full space-y-2 px-3 py-4" aria-label="Parent desktop navigation">
            {desktopNavItems.map(item => {
              const active = isDesktopNavActive(pathname, item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="relative flex min-h-touch-target items-center rounded-[10px] px-3 font-ui text-[14px] font-semibold transition-colors hover:bg-pm-neutral-100/70"
                >
                  {active && (
                    <motion.span
                      layoutId="parent-desktop-nav-active"
                      className="absolute inset-0 rounded-[10px] bg-pm-primary-100"
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 320, damping: 28 }
                      }
                    />
                  )}
                  <span
                    className={`relative ${active ? 'text-pm-primary-700' : 'text-pm-text-secondary'}`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>
      )}
      <main
        className={`flex w-full flex-1 flex-col px-0 md:px-4 lg:px-6 xl:px-8 max-w-md mx-auto md:max-w-3xl lg:max-w-5xl xl:max-w-6xl ${
          showTopBar ? 'pt-[calc(52px+env(safe-area-inset-top,0px))]' : ''
        } ${showChrome ? 'pb-[calc(68px+env(safe-area-inset-bottom,0px))] md:pb-0' : ''} md:ml-[244px]`}
      >
        {children}
      </main>
      {showChrome && <BottomNav />}
    </div>
  );
}
