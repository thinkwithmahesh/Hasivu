'use client';

/**
 * MobileNavigation - Bottom Tab Navigation
 * Mobile-optimized navigation with touch-friendly targets and haptic feedback
 */

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  UtensilsCrossed,
  ShoppingCart,
  Smartphone,
  Wallet,
  User,
  Bell,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  disabled?: boolean;
}

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartItemCount?: number;
  notificationCount?: number;
  className?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onTabChange,
  cartItemCount = 0,
  notificationCount = 0,
  className,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '/',
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: UtensilsCrossed,
      href: '/menu',
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingCart,
      href: '/cart',
      badge: cartItemCount > 0 ? cartItemCount : undefined,
    },
    {
      id: 'scan',
      label: 'Scan',
      icon: Smartphone,
      href: '/scan',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      href: '/profile',
      badge: notificationCount > 0 ? notificationCount : undefined,
    },
  ];

  const handleTabPress = (item: NavigationItem) => {
    if (item.disabled) return;

    // Haptic feedback for supported devices
    if ('vibrate' in navigator && navigator.vibrate) {
      navigator.vibrate(10); // Short haptic feedback
    }

    onTabChange(item.id);

    // Navigate if href is different from current route
    if (pathname !== item.href) {
      router.push(item.href);
    }
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white border-t border-gray-200',
        'safe-area-inset-bottom',
        'md:hidden', // Hide on desktop
        className
      )}
    >
      {/* Navigation Background with blur effect */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-md" />

      <div className="relative px-2 py-1">
        <div className="flex items-center justify-around">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabPress(item)}
                disabled={item.disabled}
                className={cn(
                  'flex flex-col items-center justify-center',
                  'min-h-[48px] min-w-[48px] p-2',
                  'rounded-lg transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'active:scale-95', // Touch feedback
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
                aria-label={item.label}
                role="tab"
                aria-selected={isActive}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-all duration-200',
                      isActive ? 'scale-110' : ''
                    )}
                  />

                  {/* Badge */}
                  {item.badge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1"
                    >
                      <Badge
                        variant="destructive"
                        className={cn(
                          'h-4 w-4 p-0 text-xs flex items-center justify-center',
                          'min-w-[16px] rounded-full',
                          item.badge > 99 ? 'px-1' : ''
                        )}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    </motion.div>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-xs font-medium mt-1 transition-all duration-200',
                    isActive ? 'text-primary font-semibold' : 'text-gray-600'
                  )}
                >
                  {item.label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-0.5 left-1/2 transform -translate-x-1/2"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <div className="w-8 h-1 bg-primary rounded-full" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileNavigation;
