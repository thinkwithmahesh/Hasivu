// Navigation-related types - re-exports and definitions for layout components

import React from 'react';

export type { User } from './auth';
export type { CartItem } from './cart';

// Notification item for header
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  urgent?: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
}

// Navigation menu item
export interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ComponentType<any> | string;
  href?: string;
  onClick?: () => void;
  badge?: number;
  disabled?: boolean;
  children?: NavigationItem[];
  roles?: string[];
}

// Mobile bottom navigation item (simplified version)
export interface MobileNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

// School status for header display
export interface SchoolStatus {
  isOpen: boolean;
  nextMealTime?: string;
  currentPeriod?: string;
  announcement?: string;
  emergencyMode?: boolean;
  emergencyMessage?: string;
  rfidSystemStatus?: 'online' | 'offline' | 'degraded';
  mealServiceActive?: boolean;
}
