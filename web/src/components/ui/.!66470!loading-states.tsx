import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// Base Skeleton Component
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'shimmer' | 'pulse'
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'shimmer', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md bg-slate-200 dark:bg-slate-800",
        variant === 'shimmer' && "animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%]",
        variant === 'pulse' && "animate-pulse",
        className
      )}
      {...props}
    />
  )
)
Skeleton.displayName = "Skeleton"

// Meal Card Skeleton
const MealCardSkeleton = () => (
  <div className="w-full rounded-lg border border-slate-200 p-4 shadow-sm dark:border-slate-800">
    {/* Image skeleton */}
    <Skeleton className="aspect-video w-full mb-4" />
    
    {/* Title and rating */}
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-5 w-12 ml-4" />
    </div>
    
    {/* Description */}
    <div className="space-y-2 mb-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
    
    {/* Tags */}
    <div className="flex space-x-2 mb-4">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-12" />
    </div>
    
    {/* Price and button */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-9 w-24" />
    </div>
  </div>
)

// Dashboard Skeleton with Priority Loading
const DashboardSkeleton = ({ role = 'student' }: { role?: 'student' | 'parent' | 'admin' }) => (
  <div className="space-y-6">
    {/* Header - loads first */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between"
    >
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-10 w-32" />
    </motion.div>

    {/* Quick Stats - loads second */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      ))}
    </motion.div>

    {/* Main Content - loads third */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {/* Recent Activity */}
      <div className="rounded-lg border border-slate-200 p-6 dark:border-slate-800">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart/Additional Content */}
      <div className="rounded-lg border border-slate-200 p-6 dark:border-slate-800">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    </motion.div>

    {/* Role-specific content */}
    {role === 'parent' && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </motion.div>
    )}
  </div>
)

// Order Status Loading with Steps
interface OrderStatusLoadingProps {
  currentStep: 'received' | 'preparing' | 'ready' | 'delivering'
  estimatedTime?: number
  className?: string
}

const OrderStatusLoading = ({ 
  currentStep, 
  estimatedTime,
  className 
}: OrderStatusLoadingProps) => {
  const steps = [
