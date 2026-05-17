'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/contexts/auth-context';

function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  if (href === '/orders' && pathname.startsWith('/orders')) return true;
  if (href === '/menu' && pathname.startsWith('/menu')) return true;
  if (href === '/dashboard/parent' && pathname.startsWith('/dashboard/parent')) return true;
  if (href === '/dashboard/student' && pathname.startsWith('/dashboard/student')) return true;
  if (href === '/children' && pathname.startsWith('/children')) return true;
  if (href === '/rfid-verification' && pathname.startsWith('/rfid-verification')) return true;
  if (href === '/settings' && pathname.startsWith('/settings')) return true;
  return false;
}

export function BottomNav() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      href: isStudent ? '/dashboard/student' : '/dashboard/parent',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: 'menu',
      label: 'Menu',
      href: '/menu',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
    {
      id: 'orders',
      label: 'Orders',
      href: '/orders',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: isStudent ? 'rfid' : 'kids',
      label: isStudent ? 'RFID' : 'Kids',
      href: isStudent ? '/rfid-verification' : '/children',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      id: 'account',
      label: 'Account',
      href: '/settings',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 inset-x-0 border-t border-pm-neutral-200/80 bg-pm-surface-1/85 pb-safe z-40 shadow-[0_-4px_16px_rgba(20,18,16,0.06)] backdrop-blur-xl supports-[backdrop-filter]:bg-pm-surface-1/70 md:hidden"
    >
      <div className="flex items-stretch justify-around min-h-[64px] h-[68px]">
        {navItems.map(item => {
          const isActive = isNavActive(pathname, item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center min-h-touch-target min-w-touch-target pt-1"
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <motion.div
                whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
                className={`relative flex items-center justify-center w-12 h-10 rounded-full mb-0.5 ${isActive ? 'text-pm-primary-600' : 'text-pm-text-tertiary hover:text-pm-text-secondary'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-0 bg-pm-primary-100 rounded-full"
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', bounce: 0.2, duration: 0.6 }
                    }
                  />
                )}
                <span className="relative z-10">{item.icon}</span>
              </motion.div>
              <span
                className={`text-[11px] font-ui font-bold leading-tight ${isActive ? 'text-pm-primary-600' : 'text-pm-text-tertiary'}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
