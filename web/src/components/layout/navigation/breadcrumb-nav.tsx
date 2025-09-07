"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

// Auto-generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Add home
  breadcrumbs.push({
    label: 'Home',
    href: '/dashboard',
  });
  
  // Generate breadcrumbs from path segments
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Convert segment to readable label
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      label: formatBreadcrumbLabel(segment, currentPath),
      href: isLast ? undefined : currentPath,
      current: isLast,
    });
  });
  
  return breadcrumbs;
}

// Format breadcrumb labels for better readability
function formatBreadcrumbLabel(segment: string, fullPath: string): string {
  const labelMap: Record<string, string> = {
    'admin': 'Admin',
    'kitchen': 'Kitchen',
    'meals': 'Meals',
    'users': 'Users',
    'students': 'Students',
    'parents': 'Parents',
    'staff': 'Staff',
    'orders': 'Orders',
    'menu': 'Menu',
    'inventory': 'Inventory',
    'analytics': 'Analytics',
    'reports': 'Reports',
    'settings': 'Settings',
    'payments': 'Payments',
    'security': 'Security',
    'dashboard': 'Dashboard',
    'profile': 'Profile',
    'children': 'My Children',
    'schedule': 'Schedule',
    'nutrition': 'Nutrition',
    'transactions': 'Transactions',
    'billing': 'Billing',
    'refunds': 'Refunds',
    'overview': 'Overview',
    'financial': 'Financial',
    'logs': 'Access Logs',
    'permissions': 'Permissions',
    'pending': 'Pending',
    'preparing': 'Preparing',
    'ready': 'Ready',
    'completed': 'Completed',
    'current': 'Current',
    'upcoming': 'Upcoming',
    'recipes': 'Recipes',
    'low-stock': 'Low Stock',
    'cart': 'Cart',
    'history': 'History',
    'preferences': 'Preferences',
    'help': 'Help & Support',
  };
  
  return labelMap[segment] || segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function BreadcrumbNav({ items, showHome = true, className }: BreadcrumbNavProps) {
  const pathname = usePathname();
  
  // Use provided items or auto-generate from pathname
  const breadcrumbItems = items || generateBreadcrumbs(pathname);
  
  // Don't show breadcrumbs on certain pages
  const hiddenPaths = ['/dashboard', '/', '/auth', '/login', '/register'];
  if (hiddenPaths.includes(pathname)) {
    return null;
  }
  
  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-gray-500", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isHome = index === 0 && showHome;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-gray-400 mx-1" aria-hidden="true" />
              )}
              
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                >
                  {isHome && <Home className="h-3 w-3" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span className={cn(
                  "flex items-center gap-1",
                  isLast ? "text-gray-900 font-medium" : "text-gray-500"
                )}>
                  {isHome && <Home className="h-3 w-3" />}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Hook for programmatic breadcrumb management
export function useBreadcrumbs() {
  const pathname = usePathname();
  
  const setBreadcrumbs = (items: BreadcrumbItem[]) => {
    // This could be implemented with a context provider
    // For now, return the auto-generated breadcrumbs
    return generateBreadcrumbs(pathname);
  };
  
  return {
    breadcrumbs: generateBreadcrumbs(pathname),
    setBreadcrumbs,
  };
}

// Specialized breadcrumb component for specific sections
export function AdminBreadcrumbs({ className }: { className?: string }) {
  return (
    <BreadcrumbNav
      className={cn("mb-4", className)}
      showHome={true}
    />
  );
}

export function KitchenBreadcrumbs({ className }: { className?: string }) {
  return (
    <BreadcrumbNav
      className={cn("mb-4", className)}
      showHome={true}
    />
  );
}