'use client';

import React from 'react';
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
} from 'lucide-react';
import {
  NavigationMenu as NavigationMenuRoot,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { User, NavigationItem } from '@/types/navigation';

interface NavigationMenuProps {
  user: User;
  className?: string;
}

// Define navigation items based on user roles
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

export function NavigationMenu({ user, className }: NavigationMenuProps) {
  const pathname = usePathname();
  const navigationItems = getNavigationItems(user.role);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <NavigationMenuRoot className={className}>
      <NavigationMenuList>
        {navigationItems.map(item => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const active = isActive(item.href);

          return (
            <NavigationMenuItem key={item.id}>
              {hasChildren ? (
                <>
                  <NavigationMenuTrigger
                    className={cn(
                      navigationMenuTriggerStyle(),
                      active && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{item.label}</span>
                    </div>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {item.children?.map(child => (
                        <NavigationMenuLink key={child.id} asChild>
                          <Link
                            href={child.href}
                            className={cn(
                              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                              isActive(child.href) && 'bg-accent text-accent-foreground'
                            )}
                          >
                            <div className="text-sm font-medium leading-none">{child.label}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {getItemDescription(child.id)}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </>
              ) : (
                <NavigationMenuLink asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      active && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{item.label}</span>
                    </div>
                  </Link>
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenuRoot>
  );
}

// Helper function to get descriptions for navigation items
function getItemDescription(itemId: string): string {
  const descriptions: Record<string, string> = {
    menu: "View today's available meals and nutritional information",
    order: 'Place orders for lunch and snacks',
    history: 'Review past meal orders and payments',
    meals: "Manage your child's meal orders and preferences",
    schedule: 'View meal timing and lunch break schedules',
    reports: 'Access detailed reports and analytics',
    students: 'Manage student accounts and information',
    parents: 'Manage parent accounts and family links',
    staff: 'Manage staff accounts and permissions',
    pending: 'View and process pending meal orders',
    preparing: 'Track orders currently being prepared',
    ready: 'Manage orders ready for pickup',
    inventory: 'Track ingredients and stock levels',
    orders: 'View and manage all meal orders',
    analytics: 'System analytics and performance metrics',
  };

  return descriptions[itemId] || '';
}
