"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  children?: React.ReactNode
}

// Base skeleton component
export const Skeleton: React.FC<SkeletonProps> = ({ className, children }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/70",
        className
      )}
    >
      {children}
    </div>
  )
}

// Card skeleton for meal cards
export const MealCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("space-y-3 p-4 border rounded-lg bg-white", className)}>
      {/* Image skeleton */}
      <Skeleton className="w-full aspect-video rounded-md" />
      
      {/* Content skeleton */}
      <div className="space-y-2">
        {/* Title and rating */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        
        {/* Price */}
        <Skeleton className="h-6 w-20" />
        
        {/* Tags */}
        <div className="flex space-x-2">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        
        {/* Button */}
        <Skeleton className="h-10 w-full mt-4 rounded-md" />
      </div>
    </div>
  )
}

// List item skeleton
export const ListItemSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("flex items-center space-x-3 p-3", className)}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  )
}

// Dashboard skeleton
export const DashboardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      
      {/* Content grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// Table skeleton
export const TableSkeleton: React.FC<{ 
  rows?: number
  columns?: number
  className?: string
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex space-x-3 p-3 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-3 p-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Form skeleton
export const FormSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Form fields */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      
      {/* Buttons */}
      <div className="flex space-x-3 pt-4">
        <Skeleton className="h-10 w-20 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  )
}

// Navigation skeleton
export const NavigationSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

// Chart skeleton
export const ChartSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
      <div className="flex justify-center space-x-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Mobile optimized meal grid skeleton
export const MealGridSkeleton: React.FC<{ 
  count?: number
  className?: string
}> = ({ count = 6, className }) => {
  return (
    <div className={cn(
      "grid gap-4",
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <MealCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Progressive loading skeleton that starts with fewer items
export const ProgressiveLoadingSkeleton: React.FC<{
  initialCount?: number
  maxCount?: number
  loadingDelay?: number
  renderItem: (index: number) => React.ReactNode
  className?: string
}> = ({ 
  initialCount = 3, 
  maxCount = 12, 
  loadingDelay = 500,
  renderItem,
  className 
}) => {
  const [visibleCount, setVisibleCount] = React.useState(initialCount)

  React.useEffect(() => {
    if (visibleCount < maxCount) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 2, maxCount))
      }, loadingDelay)

      return () => clearTimeout(timer)
    }
  }, [visibleCount, maxCount, loadingDelay])

  return (
    <div className={className}>
      {Array.from({ length: visibleCount }).map((_, i) => (
        <React.Fragment key={i}>
          {renderItem(i)}
        </React.Fragment>
      ))}
    </div>
  )
}

// Loading skeleton with shimmer effect
export const ShimmerSkeleton: React.FC<SkeletonProps> = ({ className, children }) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/50",
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
    >
      {children}
    </div>
  )
}

// Add shimmer animation to CSS
const shimmerStyles = `
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
`

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('shimmer-styles')) {
  const styleSheet = document.createElement('style')
  styleSheet.id = 'shimmer-styles'
  styleSheet.textContent = shimmerStyles
  document.head.appendChild(styleSheet)
}

export default Skeleton