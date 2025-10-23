'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  UtensilsCrossed,
  Calendar,
  User,
  Settings,
  ShoppingCart,
  Users,
  ChefHat,
  BarChart3,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User as UserType, MobileNavItem } from '@/types/navigation';

interface BottomTabNavProps {
  user: UserType;
  cartItemCount?: number;
  className?: string;
}

// Define mobile bottom navigation items based on user role
const getMobileNavItems = (userRole: UserType['role']): MobileNavItem[] => {
  const roleSpecificItems: Partial<Record<UserType['role'], MobileNavItem[]>> = {
    student: [
      {
        id: 'home',
        label: 'Home',
        href: '/dashboard',
        icon: Home,
      },
      {
        id: 'meals',
        label: 'Meals',
        href: '/meals',
        icon: UtensilsCrossed,
      },
      {
        id: 'schedule',
        label: 'Schedule',
        href: '/schedule',
        icon: Calendar,
      },
      {
        id: 'cart',
        label: 'Cart',
        href: '/cart',
        icon: ShoppingCart,
      },
      {
        id: 'profile',
        label: 'Profile',
        href: '/profile',
        icon: User,
      },
    ],
    parent: [
      {
        id: 'home',
        label: 'Home',
        href: '/dashboard',
        icon: Home,
      },
      {
        id: 'children',
        label: 'Children',
        href: '/children',
        icon: Users,
      },
      {
        id: 'cart',
        label: 'Cart',
        href: '/cart',
        icon: ShoppingCart,
      },
      {
        id: 'payments',
        label: 'Payments',
        href: '/payments',
        icon: Calendar, // Using Calendar as payment schedule icon
      },
      {
        id: 'profile',
        label: 'Profile',
        href: '/profile',
        icon: User,
      },
    ],
    admin: [
      {
        id: 'home',
        label: 'Home',
        href: '/dashboard',
        icon: Home,
      },
      {
        id: 'users',
        label: 'Users',
        href: '/admin/users',
        icon: Users,
      },
      {
        id: 'meals',
        label: 'Meals',
        href: '/admin/meals',
        icon: UtensilsCrossed,
      },
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/admin/settings',
        icon: Settings,
      },
    ],
    kitchen_staff: [
      {
        id: 'home',
        label: 'Home',
        href: '/dashboard',
        icon: Home,
      },
      {
        id: 'orders',
        label: 'Orders',
        href: '/kitchen/orders',
        icon: UtensilsCrossed,
      },
      {
        id: 'menu',
        label: 'Menu',
        href: '/kitchen/menu',
        icon: ChefHat,
      },
      {
        id: 'inventory',
        label: 'Inventory',
        href: '/kitchen/inventory',
        icon: BarChart3,
      },
      {
        id: 'profile',
        label: 'Profile',
        href: '/profile',
        icon: User,
      },
    ],
    teacher: [
      {
        id: 'home',
        label: 'Home',
        href: '/dashboard',
        icon: Home,
      },
      {
        id: 'students',
        label: 'Students',
        href: '/teacher/students',
        icon: Users,
      },
      {
        id: 'schedule',
        label: 'Schedule',
        href: '/teacher/schedule',
        icon: Clock,
      },
      {
        id: 'reports',
        label: 'Reports',
        href: '/teacher/reports',
        icon: BarChart3,
      },
      {
        id: 'profile',
        label: 'Profile',
        href: '/profile',
        icon: User,
      },
    ],
  };

  return roleSpecificItems[userRole] || [];
};

export function BottomTabNav({ user, cartItemCount = 0, className }: BottomTabNavProps) {
  const pathname = usePathname();
  const navItems = getMobileNavItems(user.role);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Don't show bottom nav on certain pages
  const hiddenPaths = ['/auth', '/login', '/register', '/onboarding'];
  const shouldHide = pathname && hiddenPaths.some(path => pathname.startsWith(path));

  if (shouldHide) {
    return null;
  }

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t md:hidden',
        'safe-area-pb', // Use safe area padding for devices with home indicator
        className
      )}
    >
      <div className="grid grid-cols-5 h-16">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const showBadge = item.id === 'cart' && cartItemCount > 0;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 transition-colors touch-manipulation',
                'min-h-touch-target', // Ensure minimum touch target size
                active
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700 active:text-primary-600'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', active && 'text-primary-600')} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent-500 text-white text-xs font-medium flex items-center justify-center">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </div>
              <span
                className={cn('text-xs font-medium', active ? 'text-primary-600' : 'text-gray-500')}
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

// Hook to get bottom nav height for layout calculations
export function useBottomNavHeight() {
  return {
    height: 64, // 16 * 4 = 64px (h-16)
    safeHeight: 'calc(4rem + env(safe-area-inset-bottom))',
    className: 'pb-16 safe-area-pb',
  };
}
