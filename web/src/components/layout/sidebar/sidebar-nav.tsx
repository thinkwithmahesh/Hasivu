'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Users,
  UtensilsCrossed,
  BarChart3,
  Settings,
  ChefHat,
  BookOpen,
  Clock,
  FileText,
  ShoppingBag,
  AlertTriangle as _AlertTriangle,
  Shield,
  CreditCard,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { User, NavigationItem } from '@/types/navigation';

interface SidebarNavProps {
  user: User;
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  className?: string;
}

// Enhanced navigation items with descriptions and badges
const getAdminNavItems = (): NavigationItem[] => [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin',
    icon: Home,
    roles: ['admin'],
  },
  {
    id: 'users',
    label: 'User Management',
    href: '/admin/users',
    icon: Users,
    roles: ['admin'],
    children: [
      {
        id: 'students',
        label: 'Students',
        href: '/admin/users/students',
        roles: ['admin'],
      },
      {
        id: 'parents',
        label: 'Parents',
        href: '/admin/users/parents',
        roles: ['admin'],
      },
      {
        id: 'staff',
        label: 'Staff',
        href: '/admin/users/staff',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'meals',
    label: 'Meal Management',
    href: '/admin/meals',
    icon: UtensilsCrossed,
    roles: ['admin'],
    children: [
      {
        id: 'menu',
        label: 'Menu Planning',
        href: '/admin/meals/menu',
        roles: ['admin'],
      },
      {
        id: 'orders',
        label: 'Orders',
        href: '/admin/meals/orders',
        roles: ['admin'],
        badge: 5, // Example: pending orders
      },
      {
        id: 'inventory',
        label: 'Inventory',
        href: '/admin/meals/inventory',
        roles: ['admin'],
      },
      {
        id: 'nutrition',
        label: 'Nutrition Info',
        href: '/admin/meals/nutrition',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
    roles: ['admin'],
    children: [
      {
        id: 'transactions',
        label: 'Transactions',
        href: '/admin/payments/transactions',
        roles: ['admin'],
      },
      {
        id: 'billing',
        label: 'Billing',
        href: '/admin/payments/billing',
        roles: ['admin'],
      },
      {
        id: 'refunds',
        label: 'Refunds',
        href: '/admin/payments/refunds',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'schedule',
    label: 'Staff Scheduling',
    href: '/admin/schedule',
    icon: Clock,
    roles: ['admin'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    roles: ['admin'],
    children: [
      {
        id: 'overview',
        label: 'Overview',
        href: '/admin/analytics/overview',
        roles: ['admin'],
      },
      {
        id: 'meals',
        label: 'Meal Analytics',
        href: '/admin/analytics/meals',
        roles: ['admin'],
      },
      {
        id: 'financial',
        label: 'Financial',
        href: '/admin/analytics/financial',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/admin/reports',
    icon: FileText,
    roles: ['admin'],
  },
  {
    id: 'security',
    label: 'Security',
    href: '/admin/security',
    icon: Shield,
    roles: ['admin'],
    children: [
      {
        id: 'logs',
        label: 'Access Logs',
        href: '/admin/security/logs',
        roles: ['admin'],
      },
      {
        id: 'permissions',
        label: 'Permissions',
        href: '/admin/security/permissions',
        roles: ['admin'],
      },
    ],
  },
  {
    id: 'rfid-verification',
    label: 'RFID Verification',
    href: '/rfid-verification',
    icon: Zap,
    roles: ['admin'],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['admin'],
  },
];

const getKitchenNavItems = (): NavigationItem[] => [
  {
    id: 'dashboard',
    label: 'Kitchen Dashboard',
    href: '/kitchen',
    icon: Home,
    roles: ['kitchen'],
  },
  {
    id: 'orders',
    label: 'Orders',
    href: '/kitchen/orders',
    icon: ShoppingBag,
    roles: ['kitchen'],
    badge: 12, // Example: pending orders
    children: [
      {
        id: 'pending',
        label: 'Pending',
        href: '/kitchen/orders/pending',
        roles: ['kitchen'],
        badge: 8,
      },
      {
        id: 'preparing',
        label: 'Preparing',
        href: '/kitchen/orders/preparing',
        roles: ['kitchen'],
        badge: 4,
      },
      {
        id: 'ready',
        label: 'Ready',
        href: '/kitchen/orders/ready',
        roles: ['kitchen'],
      },
      {
        id: 'completed',
        label: 'Completed',
        href: '/kitchen/orders/completed',
        roles: ['kitchen'],
      },
    ],
  },
  {
    id: 'menu',
    label: 'Menu Management',
    href: '/kitchen/menu',
    icon: ChefHat,
    roles: ['kitchen'],
    children: [
      {
        id: 'current',
        label: 'Current Menu',
        href: '/kitchen/menu/current',
        roles: ['kitchen'],
      },
      {
        id: 'upcoming',
        label: 'Upcoming',
        href: '/kitchen/menu/upcoming',
        roles: ['kitchen'],
      },
      {
        id: 'recipes',
        label: 'Recipes',
        href: '/kitchen/menu/recipes',
        roles: ['kitchen'],
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    href: '/kitchen/inventory',
    icon: BookOpen,
    roles: ['kitchen'],
    children: [
      {
        id: 'current',
        label: 'Current Stock',
        href: '/kitchen/inventory/current',
        roles: ['kitchen'],
      },
      {
        id: 'low-stock',
        label: 'Low Stock',
        href: '/kitchen/inventory/low-stock',
        roles: ['kitchen'],
        badge: 3, // Items running low
      },
      {
        id: 'orders',
        label: 'Purchase Orders',
        href: '/kitchen/inventory/orders',
        roles: ['kitchen'],
      },
    ],
  },
  {
    id: 'schedule',
    label: 'Schedule',
    href: '/kitchen/schedule',
    icon: Clock,
    roles: ['kitchen'],
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/kitchen/reports',
    icon: FileText,
    roles: ['kitchen'],
  },
  {
    id: 'rfid-verification',
    label: 'RFID Verification',
    href: '/rfid-verification',
    icon: Zap,
    roles: ['kitchen'],
  },
];

export function SidebarNav({ user, collapsed = false, onToggle, className }: SidebarNavProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const navItems = user.role === 'admin' ? getAdminNavItems() : getKitchenNavItems();

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/kitchen') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const toggleExpanded = (itemId: string) => {
    if (collapsed) {
      onToggle?.(false); // Auto-expand sidebar when clicking on item with children
    }
    setExpandedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Sidebar Header */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b',
          collapsed && 'justify-center'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <div>
              <div className="font-semibold text-primary-600">
                {user.role === 'admin' ? 'Admin' : 'Kitchen'}
              </div>
              <div className="text-xs text-gray-500">Control Panel</div>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggle?.(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {navItems.map(item => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const active = isActive(item.href);
            const expanded = expandedItems.includes(item.id);

            return (
              <div key={item.id}>
                {hasChildren ? (
                  <>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start h-auto p-2 text-left font-normal',
                        active && 'bg-primary-50 text-primary-700',
                        collapsed && 'justify-center'
                      )}
                      onClick={() => toggleExpanded(item.id)}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-3 w-full',
                          collapsed && 'justify-center'
                        )}
                      >
                        <div className="relative">
                          {Icon && <Icon className="h-5 w-5" />}
                          {item.badge && item.badge > 0 && !collapsed && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-error-500 text-white text-xs font-medium flex items-center justify-center">
                              {item.badge > 9 ? '9+' : item.badge}
                            </span>
                          )}
                        </div>
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            <ChevronRight
                              className={cn(
                                'h-4 w-4 transition-transform',
                                expanded && 'rotate-90'
                              )}
                            />
                          </>
                        )}
                      </div>
                    </Button>

                    {expanded && !collapsed && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children?.map(child => (
                          <Link
                            key={child.id}
                            href={child.href}
                            className={cn(
                              'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                              isActive(child.href)
                                ? 'bg-primary-100 text-primary-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            )}
                          >
                            <span>{child.label}</span>
                            {child.badge && child.badge > 0 && (
                              <span className="h-5 w-5 rounded-full bg-error-500 text-white text-xs font-medium flex items-center justify-center">
                                {child.badge > 9 ? '9+' : child.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-2 py-2 rounded-md transition-colors',
                      active
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                      collapsed && 'justify-center'
                    )}
                  >
                    <div className="relative">
                      {Icon && <Icon className="h-5 w-5" />}
                      {item.badge && item.badge > 0 && !collapsed && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-error-500 text-white text-xs font-medium flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer with user role indicator */}
      {!collapsed && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
                user.role === 'admin' ? 'bg-purple-500' : 'bg-orange-500'
              )}
            >
              {user.role === 'admin' ? 'A' : 'K'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-gray-500 capitalize">{user.role} Panel</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
