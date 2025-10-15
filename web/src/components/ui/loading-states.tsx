import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Base Skeleton Component
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'shimmer' | 'pulse';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'shimmer', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-md bg-slate-200 dark:bg-slate-800',
        variant === 'shimmer' &&
          'animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%]',
        variant === 'pulse' && 'animate-pulse',
        className
      )}
      {...props}
    />
  )
);
Skeleton.displayName = 'Skeleton';

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
);

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
      {[1, 2, 3].map(i => (
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
          {[1, 2, 3].map(i => (
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
        {[1, 2].map(i => (
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
);

// Order Status Loading with Steps
interface OrderStatusLoadingProps {
  currentStep: 'received' | 'preparing' | 'ready' | 'delivering';
  estimatedTime?: number;
  className?: string;
}

const OrderStatusLoading = ({ currentStep, estimatedTime, className }: OrderStatusLoadingProps) => {
  const steps = [
    { id: 'received', label: 'Order Received', icon: '📋' },
    { id: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
    { id: 'ready', label: 'Ready', icon: '✅' },
    { id: 'delivering', label: 'On the Way', icon: '🚚' },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <motion.div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full border-2 text-lg',
                  index <= currentStepIndex
                    ? 'border-primary-500 bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'
                )}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: index === currentStepIndex ? 1.1 : 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  scale: {
                    repeat: index === currentStepIndex ? Infinity : 0,
                    repeatType: 'reverse',
                    duration: 1.5,
                  },
                }}
              >
                {step.icon}
              </motion.div>
              <span
                className={cn(
                  'mt-2 text-sm font-medium',
                  index <= currentStepIndex
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 -z-10">
          <div className="h-0.5 bg-slate-300 dark:bg-slate-600">
            <motion.div
              className="h-full bg-primary-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>

      {/* Estimated Time */}
      {estimatedTime && currentStepIndex < steps.length - 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="inline-flex items-center space-x-2 rounded-full bg-blue-50 px-4 py-2 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-sm"
            >
              ⏰
            </motion.div>
            <span className="text-sm font-medium">Estimated {estimatedTime} minutes remaining</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// File Upload Progress
interface FileUploadProgressProps {
  progress: number;
  fileName: string;
  fileSize: string;
  speed?: string;
  eta?: string;
  status: 'uploading' | 'success' | 'error' | 'paused';
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

const FileUploadProgress = ({
  progress,
  fileName,
  fileSize,
  speed,
  eta,
  status,
  onPause,
  onResume,
  onCancel,
}: FileUploadProgressProps) => (
  <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-medium text-sm truncate flex-1 mr-2">{fileName}</h3>
      <span className="text-xs text-slate-500">{fileSize}</span>
    </div>

    {/* Progress Bar */}
    <div className="relative mb-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
      <motion.div
        className={cn(
          'h-full rounded-full',
          status === 'uploading' && 'bg-blue-500',
          status === 'success' && 'bg-green-500',
          status === 'error' && 'bg-red-500',
          status === 'paused' && 'bg-orange-500'
        )}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
      {status === 'uploading' && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: [-100, 200] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        />
      )}
    </div>

    {/* Status and Controls */}
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center space-x-2 text-slate-500">
        <span>{progress}%</span>
        {speed && <span>• {speed}</span>}
        {eta && <span>• {eta} remaining</span>}
      </div>

      <div className="flex space-x-1">
        {status === 'uploading' && onPause && (
          <button onClick={onPause} className="text-blue-600 hover:text-blue-700">
            ⏸️
          </button>
        )}
        {status === 'paused' && onResume && (
          <button onClick={onResume} className="text-green-600 hover:text-green-700">
            ▶️
          </button>
        )}
        {status !== 'success' && onCancel && (
          <button onClick={onCancel} className="text-red-600 hover:text-red-700">
            ❌
          </button>
        )}
      </div>
    </div>
  </div>
);

// HASIVU Branded Loading Spinner
interface BrandedSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BrandedSpinner = ({ size = 'md', className }: BrandedSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <motion.div
      className={cn(
        'relative inline-flex items-center justify-center',
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      {/* Outer ring - HASIVU Primary Color */}
      <div
        className={cn(
          'absolute inset-0 rounded-full border-2 border-primary-200',
          'border-t-primary-600 dark:border-primary-800 dark:border-t-primary-400'
        )}
      />

      {/* Inner dot - HASIVU Secondary Color */}
      <motion.div
        className={cn(
          'rounded-full bg-secondary-500',
          size === 'sm' && 'h-1 w-1',
          size === 'md' && 'h-1.5 w-1.5',
          size === 'lg' && 'h-2 w-2'
        )}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
    </motion.div>
  );
};

// Loading Page Component
interface LoadingPageProps {
  message?: string;
  submessage?: string;
  showSpinner?: boolean;
}

const LoadingPage = ({
  message = 'Loading your delicious experience...',
  submessage,
  showSpinner = true,
}: LoadingPageProps) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
    <div className="text-center space-y-4">
      {showSpinner && <BrandedSpinner size="lg" />}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{message}</h2>
        {submessage && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{submessage}</p>
        )}
      </motion.div>
    </div>
  </div>
);

export {
  Skeleton,
  MealCardSkeleton,
  DashboardSkeleton,
  OrderStatusLoading,
  FileUploadProgress,
  BrandedSpinner,
  LoadingPage,
};
