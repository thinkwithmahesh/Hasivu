"use client"

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Menu,
  Home,
  UtensilsCrossed,
  Wallet,
  QrCode,
  User,
  ShoppingCart,
  Bell,
  Clock,
  Settings,
  LogOut,
  ChevronRight,
  Star,
  HelpCircle,
  Shield,
  BarChart3
} from 'lucide-react'

interface NavigationSection {
  title?: string
  items: NavigationItem[]
}

interface NavigationItem {
  label: string
  icon: React.ElementType
  href?: string
  action?: () => void
  badge?: number
  description?: string
  chevron?: boolean
}

interface MobileNavSheetProps {
  userRole?: 'student' | 'parent' | 'admin'
  user?: {
    name: string
    email: string
    avatar?: string
    id: string
  }
  onLogout?: () => void
  className?: string
}

const navigationSections = {
  student: [
    {
      items: [
        {
          label: 'Dashboard',
          icon: Home,
          href: '/student',
          description: 'View your meal summary'
        },
        {
          label: 'Order Food',
          icon: UtensilsCrossed,
          href: '/student/order',
          description: 'Browse and order meals'
        },
        {
          label: 'My Cart',
          icon: ShoppingCart,
          href: '/student/cart',
          badge: 0
        },
        {
          label: 'Wallet',
          icon: Wallet,
          href: '/student/wallet',
          description: 'Check balance and top up'
        },
        {
          label: 'Scan RFID',
          icon: QrCode,
          href: '/student/scan',
          description: 'Scan for meal pickup'
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Order History',
          icon: Clock,
          href: '/student/history',
          chevron: true
        },
        {
          label: 'Notifications',
          icon: Bell,
          href: '/student/notifications',
          badge: 3,
          chevron: true
        },
        {
          label: 'Profile Settings',
          icon: User,
          href: '/student/profile',
          chevron: true
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          label: 'Help & FAQ',
          icon: HelpCircle,
          href: '/help',
          chevron: true
        },
        {
          label: 'Rate App',
          icon: Star,
          action: () => {
            // Handle app rating
            console.log('Rate app')
          },
          chevron: true
        }
      ]
    }
  ] as NavigationSection[],
  parent: [
    {
      items: [
        {
          label: 'Dashboard',
          icon: Home,
          href: '/parent',
          description: 'View children\'s meal activity'
        },
        {
          label: 'Children\'s Orders',
          icon: UtensilsCrossed,
          href: '/parent/orders',
          description: 'Manage meal orders'
        },
        {
          label: 'Family Wallet',
          icon: Wallet,
          href: '/parent/wallet',
          description: 'Manage family balance'
        },
        {
          label: 'Order History',
          icon: Clock,
          href: '/parent/history',
          description: 'View past orders'
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Notifications',
          icon: Bell,
          href: '/parent/notifications',
          badge: 5,
          chevron: true
        },
        {
          label: 'Profile Settings',
          icon: User,
          href: '/parent/profile',
          chevron: true
        },
        {
          label: 'Children Management',
          icon: User,
          href: '/parent/children',
          chevron: true
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          label: 'Help & FAQ',
          icon: HelpCircle,
          href: '/help',
          chevron: true
        },
        {
          label: 'Privacy Policy',
          icon: Shield,
          href: '/privacy',
          chevron: true
        }
      ]
    }
  ] as NavigationSection[],
  admin: [
    {
      items: [
        {
          label: 'Dashboard',
          icon: Home,
          href: '/admin',
          description: 'School overview and analytics'
        },
        {
          label: 'Order Management',
          icon: UtensilsCrossed,
          href: '/admin/orders',
          badge: 12,
          description: 'Manage all orders'
        },
        {
          label: 'Menu Management',
          icon: UtensilsCrossed,
          href: '/admin/menu',
          description: 'Update daily menus'
        },
        {
          label: 'Reports & Analytics',
          icon: BarChart3,
          href: '/admin/reports',
          description: 'View detailed reports'
        }
      ]
    },
    {
      title: 'Management',
      items: [
        {
          label: 'User Management',
          icon: User,
          href: '/admin/users',
          chevron: true
        },
        {
          label: 'Wallet Management',
          icon: Wallet,
          href: '/admin/wallets',
          chevron: true
        },
        {
          label: 'System Settings',
          icon: Settings,
          href: '/admin/settings',
          chevron: true
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          label: 'Support Tickets',
          icon: HelpCircle,
          href: '/admin/support',
          badge: 2,
          chevron: true
        },
        {
          label: 'System Health',
          icon: Shield,
          href: '/admin/health',
          chevron: true
        }
      ]
    }
  ] as NavigationSection[]
}

export const MobileNavSheet: React.FC<MobileNavSheetProps> = ({
  userRole = 'student',
  user,
  onLogout,
  className
}) => {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  const sections = navigationSections[userRole]
  
  const handleNavigation = (href: string) => {
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30)
    }
    router.push(href)
    setOpen(false)
  }
  
  const handleAction = (action: () => void) => {
    action()
    setOpen(false)
  }
  
  const isActive = (href?: string) => {
    if (!href) return false
    return pathname === href || pathname.startsWith(href + '/')
  }
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "p-2 h-auto w-auto md:hidden",
            "focus:ring-2 focus:ring-primary focus:ring-offset-2",
            className
          )}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-[300px] p-0 overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Header with user info */}
          <SheetHeader className="p-6 pb-4 bg-primary/5">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <SheetTitle className="text-base font-semibold">
                  {user?.name || 'User'}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {user?.email || 'user@example.com'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {userRole}
                </p>
              </div>
            </div>
          </SheetHeader>
          
          {/* Navigation sections */}
          <div className="flex-1 px-6 py-4">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-6 last:mb-0">
                {section.title && (
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">
                    {section.title}
                  </h3>
                )}
                
                <nav className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    
                    return (
                      <button
                        key={itemIndex}
                        onClick={() => item.href ? handleNavigation(item.href) : item.action && handleAction(item.action)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200",
                          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                          "active:scale-[0.98] active:bg-primary/20",
                          active
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "hover:bg-muted/50 text-foreground"
                        )}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="relative">
                            <Icon className={cn(
                              "h-5 w-5 transition-colors duration-200",
                              active ? "text-primary" : "text-muted-foreground"
                            )} />
                            {item.badge && item.badge > 0 && (
                              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                                {item.badge > 9 ? '9+' : item.badge}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className={cn(
                              "font-medium text-sm transition-colors duration-200",
                              active ? "text-primary" : "text-foreground"
                            )}>
                              {item.label}
                            </div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {item.chevron && (
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-colors duration-200",
                            active ? "text-primary" : "text-muted-foreground"
                          )} />
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>
            ))}
          </div>
          
          {/* Footer with logout */}
          <div className="p-6 pt-0 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                onLogout?.()
                setOpen(false)
              }}
              className="w-full justify-start p-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="font-medium">Sign Out</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MobileNavSheet