"use client"

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  UtensilsCrossed,
  Wallet,
  QrCode,
  User,
  ShoppingCart,
  Bell,
  Clock
} from 'lucide-react'

interface NavigationItem {
  label: string
  icon: React.ElementType
  href: string
  badge?: number
  activePattern?: string[]
}

interface BottomNavigationProps {
  userRole?: 'student' | 'parent' | 'admin'
  className?: string
}

const navigationItems = {
  student: [
    {
      label: 'Home',
      icon: Home,
      href: '/student',
      activePattern: ['/student', '/student/dashboard']
    },
    {
      label: 'Order',
      icon: UtensilsCrossed,
      href: '/student/order',
      activePattern: ['/student/order', '/student/menu']
    },
    {
      label: 'Cart',
      icon: ShoppingCart,
      href: '/student/cart',
      badge: 0 // Will be populated from state
    },
    {
      label: 'Wallet',
      icon: Wallet,
      href: '/student/wallet'
    },
    {
      label: 'Scan',
      icon: QrCode,
      href: '/student/scan'
    }
  ] as NavigationItem[],
  parent: [
    {
      label: 'Home',
      icon: Home,
      href: '/parent',
      activePattern: ['/parent', '/parent/dashboard']
    },
    {
      label: 'Orders',
      icon: UtensilsCrossed,
      href: '/parent/orders'
    },
    {
      label: 'Wallet',
      icon: Wallet,
      href: '/parent/wallet'
    },
    {
      label: 'History',
      icon: Clock,
      href: '/parent/history'
    },
    {
      label: 'Profile',
      icon: User,
      href: '/parent/profile'
    }
  ] as NavigationItem[],
  admin: [
    {
      label: 'Dashboard',
      icon: Home,
      href: '/admin',
      activePattern: ['/admin', '/admin/dashboard']
    },
    {
      label: 'Orders',
      icon: UtensilsCrossed,
      href: '/admin/orders',
      badge: 0 // Will be populated from state
    },
    {
      label: 'Menu',
      icon: UtensilsCrossed,
      href: '/admin/menu'
    },
    {
      label: 'Reports',
      icon: Clock,
      href: '/admin/reports'
    },
    {
      label: 'Settings',
      icon: User,
      href: '/admin/settings'
    }
  ] as NavigationItem[]
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  userRole = 'student',
  className
}) => {
  const router = useRouter()
  const pathname = usePathname()
  
  const items = navigationItems[userRole]
  
  const isActive = (item: NavigationItem) => {
    if (!pathname) return false;
    if (item.activePattern) {
      return item.activePattern.some(pattern => pathname.startsWith(pattern))
    }
    return pathname === item.href
  }
  
  const handleNavigation = (href: string) => {
    // Add haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    router.push(href)
  }
  
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border",
      "safe-area-pb md:hidden", // Hide on desktop
      className
    )}>
      <nav className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          
          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "relative flex flex-col items-center justify-center min-h-[48px] px-3 py-1.5 rounded-lg transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                "active:scale-95 active:bg-primary/10", // Touch feedback
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  active && "scale-110"
                )} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium mt-0.5 transition-colors duration-200",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default BottomNavigation