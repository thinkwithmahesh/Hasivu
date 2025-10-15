'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  UtensilsCrossed,
  Calendar,
  FileText,
  Users,
  Settings,
  ChefHat,
  CreditCard,
  BookOpen,
  BarChart3,
  Clock,
  ChevronRight,
  ChevronDown,
  Wifi,
  WifiOff,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator as _Separator } from '@/components/ui/separator';
import { cn, getInitials } from '@/lib/utils';
import { User, NavigationItem, SchoolStatus } from '@/types/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MobileMenuProps {
  user: User;
  schoolStatus: SchoolStatus;
  onItemClick?: () => void;
  className?: string;
}

// Same navigation items as desktop but optimized for mobile
const getNavigationItems = (userRole: User['role']): NavigationItem[] => {
  const baseItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      href: '/dashboard',
      icon: Home,
      roles: ['student', 'parent', 'admin', 'kitchen', 'teacher'],
    },
  ];

  const roleSpecificItems: Record<User['role'], NavigationItem[]> = {
    student: [
      {
        id: 'meals',
        label: 'Meals',
        href: '/meals',
        icon: UtensilsCrossed,
        roles: ['student'],
        children: [
          {
            id: 'menu',
            label: "Today's Menu",
            href: '/meals/menu',
            roles: ['student'],
          },
          {
            id: 'order',
            label: 'Order Food',
            href: '/meals/order',
            roles: ['student'],
          },
          {
            id: 'history',
            label: 'Order History',
            href: '/meals/history',
            roles: ['student'],
          },
        ],
      },
      {
        id: 'schedule',
        label: 'Schedule',
        href: '/schedule',
        icon: Calendar,
        roles: ['student'],
      },
      {
        id: 'reports',
        label: 'Reports',
        href: '/reports',
        icon: FileText,
        roles: ['student'],
      },
    ],
    parent: [
      {
        id: 'children',
        label: 'My Children',
        href: '/children',
        icon: Users,
        roles: ['parent'],
        children: [
          {
            id: 'meals',
            label: 'Meal Orders',
            href: '/children/meals',
            roles: ['parent'],
          },
          {
            id: 'schedule',
            label: 'Schedule',
            href: '/children/schedule',
            roles: ['parent'],
          },
          {
            id: 'reports',
            label: 'Reports',
            href: '/children/reports',
            roles: ['parent'],
          },
        ],
      },
      {
        id: 'payments',
        label: 'Payments',
        href: '/payments',
        icon: CreditCard,
        roles: ['parent'],
      },
    ],
    admin: [
      {
        id: 'users',
        label: 'Users',
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
          },
          {
            id: 'inventory',
            label: 'Inventory',
            href: '/admin/meals/inventory',
            roles: ['admin'],
          },
        ],
      },
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
        roles: ['admin'],
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        roles: ['admin'],
      },
    ],
    kitchen: [
      {
        id: 'orders',
        label: 'Orders',
        href: '/kitchen/orders',
        icon: UtensilsCrossed,
        roles: ['kitchen'],
        children: [
          {
            id: 'pending',
            label: 'Pending Orders',
            href: '/kitchen/orders/pending',
            roles: ['kitchen'],
          },
          {
            id: 'preparing',
            label: 'Preparing',
            href: '/kitchen/orders/preparing',
            roles: ['kitchen'],
          },
          {
            id: 'ready',
            label: 'Ready for Pickup',
            href: '/kitchen/orders/ready',
            roles: ['kitchen'],
          },
        ],
      },
      {
        id: 'menu',
        label: 'Menu',
        href: '/kitchen/menu',
        icon: ChefHat,
        roles: ['kitchen'],
      },
      {
        id: 'inventory',
        label: 'Inventory',
        href: '/kitchen/inventory',
        icon: BookOpen,
        roles: ['kitchen'],
      },
    ],
    teacher: [
      {
        id: 'students',
        label: 'Students',
        href: '/teacher/students',
        icon: Users,
        roles: ['teacher'],
      },
      {
        id: 'schedule',
        label: 'Lunch Schedule',
        href: '/teacher/schedule',
        icon: Clock,
        roles: ['teacher'],
      },
      {
        id: 'reports',
        label: 'Reports',
        href: '/teacher/reports',
        icon: FileText,
        roles: ['teacher'],
      },
    ],
  };

  return [...baseItems, ...roleSpecificItems[userRole]];
};

export function MobileMenu({ user, schoolStatus, onItemClick, className }: MobileMenuProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const navigationItems = getNavigationItems(user.role);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleItemClick = () => {
    onItemClick?.();
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header with user info */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary-100 text-primary-700">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium text-sm">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  {
                    'bg-blue-100 text-blue-700': user.role === 'student',
                    'bg-green-100 text-green-700': user.role === 'parent',
                    'bg-purple-100 text-purple-700': user.role === 'admin',
                    'bg-orange-100 text-orange-700': user.role === 'kitchen',
                    'bg-gray-100 text-gray-700': user.role === 'teacher',
                  }
                )}
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
              {user.grade && <span className="text-xs text-gray-500">Grade {user.grade}</span>}
            </div>
          </div>
        </div>

        {/* Emergency banner for mobile */}
        {schoolStatus.emergencyMode && (
          <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-error-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-error-800 text-sm">Emergency Alert</div>
                <div className="text-error-700 text-xs mt-1">
                  {schoolStatus.emergencyMessage || 'Emergency notification active'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status indicators */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">RFID System</span>
            <div className="flex items-center gap-1">
              {schoolStatus.rfidSystemStatus === 'online' ? (
                <>
                  <Wifi className="h-3 w-3 text-success-500" />
                  <span className="text-success-600">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-error-500" />
                  <span className="text-error-600">Offline</span>
                </>
              )}
            </div>
          </div>

          {['student', 'parent'].includes(user.role) && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Meal Service</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full font-medium',
                  schoolStatus.mealServiceActive
                    ? 'bg-success-100 text-success-700'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                {schoolStatus.mealServiceActive ? 'Open' : 'Closed'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-4 space-y-1">
          {navigationItems.map(item => {
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
                        'w-full justify-start h-auto p-3',
                        active && 'bg-accent text-accent-foreground'
                      )}
                      onClick={() => toggleExpanded(item.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {Icon && <Icon className="h-5 w-5" />}
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {expanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {expanded && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children?.map(child => (
                          <Link
                            key={child.id}
                            href={child.href}
                            onClick={handleItemClick}
                            className={cn(
                              'block px-3 py-2 text-sm rounded-md transition-colors',
                              isActive(child.href)
                                ? 'bg-accent text-accent-foreground font-medium'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={handleItemClick}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-md transition-colors',
                      active
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    {Icon && <Icon className="h-5 w-5" />}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer with quick actions */}
      <div className="p-4 border-t space-y-2">
        <Link
          href="/profile"
          onClick={handleItemClick}
          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Profile Settings</span>
        </Link>

        <Link
          href="/help"
          onClick={handleItemClick}
          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
        >
          <FileText className="h-4 w-4" />
          <span>Help & Support</span>
        </Link>
      </div>
    </div>
  );
}
