"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { User, NotificationItem, CartItem, SchoolStatus } from '@/types/navigation';
import { MainHeader } from './header/main-header';
import { BottomTabNav, useBottomNavHeight } from './navigation/bottom-tab-nav';

interface AppLayoutProps {
  children: React.ReactNode;
  user: User;
  notifications?: NotificationItem[];
  cartItems?: CartItem[];
  schoolStatus: SchoolStatus;
  onLogout?: () => void;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showBottomNav?: boolean;
}

export function AppLayout({
  children,
  user,
  notifications = [],
  cartItems = [],
  schoolStatus,
  onLogout,
  className,
  headerClassName,
  contentClassName,
  showBottomNav = true,
}: AppLayoutProps) {
  const { className: bottomNavPadding } = useBottomNavHeight();
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Header */}
      <MainHeader
        user={user}
        notifications={notifications}
        cartItems={cartItems}
        schoolStatus={schoolStatus}
        onLogout={onLogout}
        className={headerClassName}
      />

      {/* Main content area */}
      <main className={cn(
        "flex-1",
        showBottomNav && bottomNavPadding,
        contentClassName
      )}>
        {children}
      </main>

      {/* Bottom navigation for mobile */}
      {showBottomNav && (
        <BottomTabNav
          user={user}
          cartItemCount={cartItemCount}
        />
      )}
    </div>
  );
}

// Specialized layout for dashboard pages
export function DashboardLayout({
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
}: AppLayoutProps & {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <AppLayout
      user={user}
      notifications={notifications}
      cartItems={cartItems}
      schoolStatus={schoolStatus}
      onLogout={onLogout}
      className={className}
    >
      <div className="container mx-auto px-4 py-6">
        {/* Page header */}
        {(title || subtitle || actions) && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                {title && (
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-600">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex-shrink-0">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Dashboard content */}
        {children}
      </div>
    </AppLayout>
  );
}

// Layout for meal ordering with cart sidebar
export function MealOrderLayout({
  children,
  user,
  notifications = [],
  cartItems = [],
  schoolStatus,
  onLogout,
  cartSidebar,
  className,
}: AppLayoutProps & {
  cartSidebar?: React.ReactNode;
}) {
  return (
    <AppLayout
      user={user}
      notifications={notifications}
      cartItems={cartItems}
      schoolStatus={schoolStatus}
      onLogout={onLogout}
      className={className}
      showBottomNav={false} // Custom layout for meal ordering
    >
      <div className="flex h-screen-safe">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        
        {/* Cart sidebar (desktop only) */}
        {cartSidebar && (
          <div className="hidden lg:block w-80 border-l bg-gray-50">
            {cartSidebar}
          </div>
        )}
      </div>
      
      {/* Mobile bottom nav for meal ordering */}
      <BottomTabNav
        user={user}
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
      />
    </AppLayout>
  );
}

// Authentication layout (no header/nav)
export function AuthLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4",
      className
    )}>
      <div className="w-full max-w-md">
        {/* HASIVU Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary-500 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
            <div>
              <div className="font-display font-bold text-3xl text-primary-600">HASIVU</div>
              <div className="text-sm text-gray-600 -mt-1">School Platform</div>
            </div>
          </div>
        </div>
        
        {children}
      </div>
    </div>
  );
}