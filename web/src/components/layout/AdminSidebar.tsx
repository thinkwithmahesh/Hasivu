'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navGroups = [
    {
      title: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/(admin)/dashboard',
          icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
        },
        {
          id: 'orders',
          label: 'Order Management',
          href: '/(admin)/orders',
          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          id: 'menu',
          label: 'Menu Planning',
          href: '/(admin)/menu',
          icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
        },
        {
          id: 'students',
          label: 'Students & RFID',
          href: '/(admin)/students',
          icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2',
        },
        {
          id: 'settings',
          label: 'School Settings',
          href: '/(admin)/settings',
          icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        },
      ],
    },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      className="fixed top-0 left-0 bottom-0 z-40 bg-pm-surface-1 border-r border-pm-neutral-200 flex flex-col hide-scrollbar overflow-y-auto"
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-pm-neutral-100 shrink-0">
        <AnimatePresence mode="popLayout">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="font-hero text-[22px] text-pm-primary-600 truncate"
            >
              Hasivu Admin
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-lg text-pm-text-tertiary hover:bg-pm-neutral-100 hover:text-pm-text-primary transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-6">
        {navGroups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-1 px-3">
            {!isCollapsed && (
              <div className="px-3 pb-2 text-[11px] font-ui font-bold uppercase tracking-wider text-pm-text-tertiary">
                {group.title}
              </div>
            )}

            {group.items.map(item => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`relative flex items-center h-10 px-3 rounded-lg font-ui font-bold text-[14px] transition-colors overflow-hidden group ${
                    isActive
                      ? 'text-pm-primary-800'
                      : 'text-pm-text-secondary hover:bg-pm-neutral-100'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-pm-primary-100 rounded-lg -z-10"
                      transition={{ type: 'spring', bounce: 0.1, duration: 0.5 }}
                    />
                  )}
                  <svg
                    className={`w-5 h-5 shrink-0 ${isActive ? 'text-pm-primary-600' : 'text-pm-text-tertiary group-hover:text-pm-text-secondary'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>

                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="ml-3 whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-pm-neutral-100 mt-auto">
        <Link
          href="/auth/login"
          className={`flex items-center h-10 px-3 rounded-lg font-ui font-bold text-[14px] text-pm-semantic-danger hover:bg-red-50 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {!isCollapsed && <span className="ml-3">Log Out</span>}
        </Link>
      </div>
    </motion.aside>
  );
}
