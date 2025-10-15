'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, ShoppingCart, Menu, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn, getInitials } from '@/lib/utils';
import { User, NotificationItem, CartItem, SchoolStatus } from '@/types/navigation';
import { NavigationMenu } from './navigation-menu';
import { MobileMenu } from './mobile-menu';

interface MainHeaderProps {
  user: User;
  notifications: NotificationItem[];
  cartItems?: CartItem[];
  schoolStatus: SchoolStatus;
  onMenuClick?: () => void;
  onLogout?: () => void;
  className?: string;
}

export function MainHeader({
  user,
  notifications,
  cartItems = [],
  schoolStatus,
  onMenuClick: _onMenuClick,
  onLogout,
  className,
}: MainHeaderProps) {
  const unreadNotifications = notifications.filter(n => !n.read).length;
  const urgentNotifications = notifications.filter(n => n.urgent && !n.read).length;
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const showCart = ['student', 'parent'].includes(user.role);
  const showEmergencyBanner = schoolStatus.emergencyMode;

  return (
    <>
      {/* Emergency Banner */}
      {showEmergencyBanner && (
        <div className="bg-error-500 text-white px-4 py-2 text-center font-medium">
          <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              {schoolStatus.emergencyMessage || 'Emergency notification active'}
            </span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header
        className={cn(
          'sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          className
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Left Section - Logo & Navigation */}
            <div className="flex items-center gap-6">
              {/* Mobile Menu Trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <MobileMenu user={user} schoolStatus={schoolStatus} onItemClick={() => {}} />
                </SheetContent>
              </Sheet>

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-primary-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <div className="hidden sm:block">
                  <span className="font-display font-bold text-xl text-primary-600">HASIVU</span>
                  <div className="text-xs text-gray-500 -mt-1">School Platform</div>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:block">
                <NavigationMenu user={user} />
              </div>
            </div>

            {/* Right Section - Status, Notifications, Cart, Profile */}
            <div className="flex items-center gap-3">
              {/* RFID Status Indicator */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600">
                {schoolStatus.rfidSystemStatus === 'online' ? (
                  <>
                    <Wifi className="h-4 w-4 text-success-500" />
                    <span>RFID Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-error-500" />
                    <span>RFID Offline</span>
                  </>
                )}
              </div>

              {/* Meal Service Status */}
              {showCart && (
                <div className="hidden sm:block">
                  <div
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      schoolStatus.mealServiceActive
                        ? 'bg-success-100 text-success-700'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {schoolStatus.mealServiceActive ? 'Ordering Open' : 'Ordering Closed'}
                  </div>
                </div>
              )}

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <span
                        className={cn(
                          'absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-medium flex items-center justify-center',
                          urgentNotifications > 0
                            ? 'bg-error-500 text-white animate-pulse'
                            : 'bg-primary-500 text-white'
                        )}
                      >
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                    <span className="sr-only">Notifications</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Notifications
                    {unreadNotifications > 0 && (
                      <span className="text-xs text-gray-500">{unreadNotifications} unread</span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                    ) : (
                      notifications.slice(0, 5).map(notification => (
                        <DropdownMenuItem
                          key={notification.id}
                          className="flex-col items-start p-3"
                        >
                          <div className="flex items-start gap-2 w-full">
                            <div
                              className={cn('h-2 w-2 rounded-full mt-2 flex-shrink-0', {
                                'bg-info-500': notification.type === 'info',
                                'bg-warning-500': notification.type === 'warning',
                                'bg-error-500': notification.type === 'error',
                                'bg-success-500': notification.type === 'success',
                              })}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{notification.title}</div>
                              <div className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {notification.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                  {notifications.length > 5 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/notifications" className="text-center w-full">
                          View all notifications
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Shopping Cart (for students/parents) */}
              {showCart && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      {cartItemCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent-500 text-white text-xs font-medium flex items-center justify-center">
                          {cartItemCount > 9 ? '9+' : cartItemCount}
                        </span>
                      )}
                      <span className="sr-only">Shopping cart</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Meal Cart</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-96 overflow-y-auto">
                      {cartItems.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Your cart is empty
                        </div>
                      ) : (
                        cartItems.map(item => (
                          <DropdownMenuItem key={item.id} className="flex-col items-start p-3">
                            <div className="flex items-center gap-3 w-full">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-sm">{item.name}</div>
                                <div className="text-xs text-gray-600">
                                  ₹{item.price} × {item.quantity}
                                </div>
                              </div>
                              <div className="font-medium text-sm">
                                ₹{item.price * item.quantity}
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))
                      )}
                    </div>
                    {cartItems.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/cart" className="text-center w-full font-medium">
                            View Cart & Checkout
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* User Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary-100 text-primary-700">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
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
                        {user.grade && (
                          <span className="text-xs text-gray-500">Grade {user.grade}</span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/preferences">Preferences</Link>
                  </DropdownMenuItem>
                  {['student', 'parent'].includes(user.role) && (
                    <DropdownMenuItem asChild>
                      <Link href="/meal-preferences">Meal Preferences</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/help">Help & Support</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="text-error-600 focus:text-error-600"
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
