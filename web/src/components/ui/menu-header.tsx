'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Plus, Search, Filter, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuHeaderProps {
  cartCount: number;
  totalPrice: number;
  onCartOpen: () => void;
  className?: string;
}

export function MenuHeader({ cartCount, totalPrice, onCartOpen, className }: MenuHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 border-b border-white/20',
        'shadow-sm shadow-black/5',
        className
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Navigation and Brand */}
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="group transition-all duration-200 hover:bg-white/60"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Button>
            </Link>

            <div className="flex items-center gap-4">
              {/* Brand Logo */}
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                  <span className="text-white font-bold text-xl drop-shadow-sm">H</span>
                </div>
                {/* Notification Dot */}
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>

              {/* Brand Info */}
              <div className="hidden sm:block">
                <h1 className="font-display font-bold text-2xl bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  Bangalore School Menu
                </h1>
                <p className="text-sm text-gray-600 -mt-1">
                  Diverse Indian cuisine • 50,000+ students served
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex h-10 w-10 p-0 hover:bg-white/60"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Filter Button */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex h-10 w-10 p-0 hover:bg-white/60"
            >
              <Filter className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative h-10 w-10 p-0 hover:bg-white/60">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-red-500 hover:bg-red-500 text-white text-xs border-2 border-white">
                2
              </Badge>
            </Button>

            {/* Cart Button */}
            <Button
              onClick={onCartOpen}
              data-testid="cart-icon"
              className={cn(
                'relative gap-2 shadow-lg transition-all duration-300',
                cartCount > 0
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-primary-500/25'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              )}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">
                {cartCount > 0 ? `Cart (${cartCount})` : 'Cart'}
              </span>
              {totalPrice > 0 && (
                <span className="hidden md:inline text-sm opacity-90">• ₹{totalPrice}</span>
              )}

              {/* Animated Cart Count Badge */}
              {cartCount > 0 && (
                <Badge
                  className={cn(
                    'absolute -top-2 -right-2 h-6 w-6 p-0 text-xs border-2 border-white',
                    'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-500 hover:to-green-600',
                    'animate-in zoom-in-50 duration-200'
                  )}
                  data-testid="cart-count"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>

            {/* Add Menu Item Button */}
            <Button
              variant="outline"
              className="hidden lg:flex gap-2 bg-white hover:bg-gray-50 border-gray-200"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>

            {/* User Profile */}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full hover:bg-white/60"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar - Shows on small screens */}
        <div className="mt-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              className="w-full pl-10 pr-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* Gradient Border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
    </header>
  );
}
