'use client';

/**
 * HASIVU Platform - Production Loading States & Skeleton Screens
 * Comprehensive loading components for improved perceived performance
 * Implements loading patterns with accessibility and smooth transitions
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Utensils, Clock, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Base skeleton component with animation
interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export const LoadingSkeleton: React.FC<SkeletonProps> = ({ className, children }) => (
  <div
    className={cn('animate-pulse rounded-md bg-gray-200', className)}
    role="status"
    aria-label="Loading content"
  >
    {children}
  </div>
);

// Shimmer effect for enhanced visual feedback
export const StandardShimmer: React.FC<SkeletonProps> = ({ className, children }) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-md bg-gray-200',
      'before:absolute before:inset-0',
      'before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent',
      'before:animate-shimmer before:transform before:translate-x-[-100%]',
      className
    )}
    role="status"
    aria-label="Loading content"
  >
    {children}
  </div>
);

// Loading spinner with different sizes and variants
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary';
  className?: string;
  text?: string;
}

export const StandardLoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  text,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const variantClasses = {
    default: 'text-gray-600',
    primary: 'text-primary',
    secondary: 'text-secondary',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      <Loader2
        className={cn('animate-spin', sizeClasses[size], variantClasses[variant])}
        aria-hidden="true"
      />
      {text && (
        <span className="text-sm text-gray-600" aria-live="polite">
          {text}
        </span>
      )}
    </div>
  );
};

// Page-level loading screen
export const StandardPageLoader: React.FC<{ text?: string }> = ({ text = 'Loading HASIVU...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
    <div className="text-center space-y-6">
      {/* HASIVU Logo Placeholder */}
      <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
        <Utensils className="w-10 h-10 text-white" />
      </div>

      {/* Loading animation */}
      <div className="space-y-4">
        <StandardLoadingSpinner size="lg" variant="primary" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">{text}</h2>
          <p className="text-gray-600">Preparing your school meal experience</p>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex justify-center space-x-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full',
              'animate-bounce bg-blue-500',
              i === 1 && 'animation-delay-75',
              i === 2 && 'animation-delay-150'
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

// Card skeleton for dashboard components
export const StandardCardSkeleton: React.FC = () => (
  <Card className="w-full">
    <CardHeader className="space-y-2">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-4 w-1/3" />
        <LoadingSkeleton className="h-4 w-4 rounded-full" />
      </div>
      <LoadingSkeleton className="h-6 w-1/4" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-4/5" />
        <LoadingSkeleton className="h-4 w-3/5" />
      </div>
    </CardContent>
  </Card>
);

// Dashboard stats skeleton
export const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {[
      { icon: DollarSign, label: 'Revenue' },
      { icon: Users, label: 'Students' },
      { icon: TrendingUp, label: 'Orders' },
      { icon: Clock, label: 'Avg Time' },
    ].map((stat, index) => (
      <Card key={index}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <stat.icon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="space-y-2 flex-1">
              <LoadingSkeleton className="h-4 w-16" />
              <LoadingSkeleton className="h-6 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Table skeleton
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4 }) => (
  <div className="w-full overflow-hidden">
    {/* Table header */}
    <div className="border-b border-gray-200 pb-3 mb-3">
      <div className="flex space-x-4">
        {[...Array(columns)].map((_, i) => (
          <LoadingSkeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
    </div>

    {/* Table rows */}
    <div className="space-y-3">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {[...Array(columns)].map((_, colIndex) => (
            <LoadingSkeleton
              key={colIndex}
              className={cn(
                'h-4 flex-1',
                colIndex === 0 && 'w-8 h-8 rounded-full' // Avatar column
              )}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Navigation skeleton
export const NavigationSkeleton: React.FC = () => (
  <nav className="space-y-2 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-2">
        <LoadingSkeleton className="h-5 w-5 rounded" />
        <LoadingSkeleton className="h-4 w-24" />
      </div>
    ))}
  </nav>
);

// Form skeleton
export const FormSkeleton: React.FC = () => (
  <div className="space-y-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="space-y-2">
        <LoadingSkeleton className="h-4 w-20" />
        <LoadingSkeleton className="h-10 w-full rounded-md" />
      </div>
    ))}
    <LoadingSkeleton className="h-10 w-32 rounded-md" />
  </div>
);

// Order history skeleton for HASIVU
export const OrderHistorySkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="w-full">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-3">
              <LoadingSkeleton className="w-12 h-12 rounded-lg" />
              <div className="space-y-2">
                <LoadingSkeleton className="h-4 w-32" />
                <LoadingSkeleton className="h-3 w-20" />
              </div>
            </div>
            <LoadingSkeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <LoadingSkeleton className="h-3 w-24" />
              <LoadingSkeleton className="h-3 w-16" />
            </div>
            <div className="flex justify-between">
              <LoadingSkeleton className="h-3 w-20" />
              <LoadingSkeleton className="h-3 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Menu items skeleton for HASIVU
export const MenuItemsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(8)].map((_, i) => (
      <Card key={i} className="w-full overflow-hidden">
        <LoadingSkeleton className="h-48 w-full" />
        <CardContent className="p-4 space-y-3">
          <LoadingSkeleton className="h-5 w-3/4" />
          <LoadingSkeleton className="h-4 w-full" />
          <LoadingSkeleton className="h-4 w-2/3" />
          <div className="flex justify-between items-center pt-2">
            <LoadingSkeleton className="h-6 w-16" />
            <LoadingSkeleton className="h-9 w-20 rounded-md" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Generic list skeleton
interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
  lines?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  items = 5,
  showAvatar = false,
  lines = 2,
}) => (
  <div className="space-y-3">
    {[...Array(items)].map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3">
        {showAvatar && <LoadingSkeleton className="w-10 h-10 rounded-full" />}
        <div className="flex-1 space-y-2">
          {[...Array(lines)].map((_, lineIndex) => (
            <LoadingSkeleton
              key={lineIndex}
              className={cn('h-4', lineIndex === 0 ? 'w-3/4' : 'w-1/2')}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Loading overlay for forms and interactions
interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  text = 'Loading...',
  children,
}) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <StandardLoadingSpinner text={text} />
        </div>
      </div>
    )}
  </div>
);

// Export all components with backward compatible names
export {
  StandardCardSkeleton as CardSkeleton,
  StandardPageLoader as PageLoader,
  StandardLoadingSpinner as LoadingSpinner,
  LoadingSkeleton as Skeleton,
  StandardShimmer as ShimmerSkeleton,
};

// Already exported above with export const:
// StatsSkeleton, TableSkeleton, NavigationSkeleton, FormSkeleton,
// OrderHistorySkeleton, MenuItemsSkeleton, ListSkeleton, LoadingOverlay
