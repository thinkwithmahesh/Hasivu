'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { User, NotificationItem, CartItem, SchoolStatus } from '@/types/navigation';
import { MainHeader } from './header/main-header';
import { SidebarNav } from './sidebar/sidebar-nav';

interface SidebarLayoutProps {
  children: React.ReactNode;
  user: User;
  notifications?: NotificationItem[];
  cartItems?: CartItem[];
  schoolStatus: SchoolStatus;
  onLogout?: () => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  initialCollapsed?: boolean;
}

export function SidebarLayout({
  children,
  user,
  notifications = [],
  cartItems = [],
  schoolStatus,
  onLogout,
  title,
  subtitle,
  actions,
  className,
  headerClassName,
  contentClassName,
  initialCollapsed = false,
}: SidebarLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialCollapsed);

  // Only show sidebar layout for admin and kitchen roles
  const showSidebar = ['admin', 'kitchen'].includes(user.role);

  if (!showSidebar) {
    // Fallback to regular layout for other roles
    return (
      <div className={cn('min-h-screen bg-background', className)}>
        <MainHeader
          user={user}
          notifications={notifications}
          cartItems={cartItems}
          schoolStatus={schoolStatus}
          onLogout={onLogout}
          className={headerClassName}
        />
        <main className={cn('flex-1', contentClassName)}>
          <div className="container mx-auto px-4 py-6">
            {(title || subtitle || actions) && (
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    {title && (
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
                    )}
                    {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
                  </div>
                  {actions && <div className="flex-shrink-0">{actions}</div>}
                </div>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Header */}
      <MainHeader
        user={user}
        notifications={notifications}
        cartItems={cartItems}
        schoolStatus={schoolStatus}
        onLogout={onLogout}
        className={headerClassName}
      />

      {/* Layout with sidebar */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        <SidebarNav
          user={user}
          collapsed={sidebarCollapsed}
          onToggle={setSidebarCollapsed}
          className="hidden md:flex"
        />

        {/* Main content area */}
        <main className={cn('flex-1 overflow-y-auto', contentClassName)}>
          <div className="p-6">
            {/* Page header */}
            {(title || subtitle || actions) && (
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    {title && (
                      <h1
                        className={cn(
                          'text-2xl font-bold text-gray-900',
                          sidebarCollapsed ? 'sm:text-3xl' : 'lg:text-3xl'
                        )}
                      >
                        {title}
                      </h1>
                    )}
                    {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
                  </div>
                  {actions && <div className="flex-shrink-0">{actions}</div>}
                </div>
              </div>
            )}

            {/* Content */}
            <div className={cn('space-y-6', sidebarCollapsed ? 'max-w-none' : 'max-w-full')}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Specialized layout for admin dashboard
export function AdminDashboardLayout({
  children,
  user,
  notifications = [],
  cartItems = [],
  schoolStatus,
  onLogout,
  title = 'Admin Dashboard',
  subtitle,
  actions,
  className,
}: SidebarLayoutProps) {
  // Ensure user is admin
  if (user.role !== 'admin') {
    throw new Error('AdminDashboardLayout can only be used with admin users');
  }

  return (
    <SidebarLayout
      user={user}
      notifications={notifications}
      cartItems={cartItems}
      schoolStatus={schoolStatus}
      onLogout={onLogout}
      title={title}
      subtitle={subtitle || "Manage your school's meal service and users"}
      actions={actions}
      className={className}
      initialCollapsed={false}
    >
      {children}
    </SidebarLayout>
  );
}

// Specialized layout for kitchen dashboard
export function KitchenDashboardLayout({
  children,
  user,
  notifications = [],
  cartItems = [],
  schoolStatus,
  onLogout,
  title = 'Kitchen Dashboard',
  subtitle,
  actions,
  className,
}: SidebarLayoutProps) {
  // Ensure user is kitchen staff
  if (user.role !== 'kitchen_staff') {
    throw new Error('KitchenDashboardLayout can only be used with kitchen staff users');
  }

  return (
    <SidebarLayout
      user={user}
      notifications={notifications}
      cartItems={cartItems}
      schoolStatus={schoolStatus}
      onLogout={onLogout}
      title={title}
      subtitle={subtitle || 'Manage orders, menu, and kitchen operations'}
      actions={actions}
      className={className}
      initialCollapsed={false}
    >
      {children}
    </SidebarLayout>
  );
}
