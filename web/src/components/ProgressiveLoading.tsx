import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

// Loading Skeleton Components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
    <div className="animate-pulse">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
      </div>
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4">
          <div className="animate-pulse flex space-x-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export const SkeletonStats: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="w-8 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    ))}
  </div>
);

// Progressive Loading States
interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  isEmpty?: boolean;
  isRefreshing?: boolean;
  progress?: number;
  connectionStatus?: 'online' | 'offline' | 'reconnecting';
}

interface ProgressiveLoadingProps extends LoadingState {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  emptyState?: React.ReactNode;
  errorState?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
  showProgress?: boolean;
  minimumLoadTime?: number;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  isLoading,
  error,
  isEmpty = false,
  isRefreshing = false,
  progress = 0,
  connectionStatus = 'online',
  children,
  fallback,
  emptyState,
  errorState,
  onRetry,
  className = '',
  showProgress = false,
  minimumLoadTime = 500,
}) => {
  const [showLoading, setShowLoading] = React.useState(isLoading);
  const [minimumTimeMet, setMinimumTimeMet] = React.useState(false);

  // Ensure minimum loading time for better UX
  React.useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
      setMinimumTimeMet(false);

      const timer = setTimeout(() => {
        setMinimumTimeMet(true);
      }, minimumLoadTime);

      return () => clearTimeout(timer);
    } else if (minimumTimeMet) {
      setShowLoading(false);
    }
  }, [isLoading, minimumLoadTime, minimumTimeMet]);

  React.useEffect(() => {
    if (!isLoading && minimumTimeMet) {
      setShowLoading(false);
    }
  }, [isLoading, minimumTimeMet]);

  // Connection Status Indicator
  const ConnectionStatus = () => {
    if (connectionStatus === 'online') return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${
          connectionStatus === 'offline'
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }`}
      >
        {connectionStatus === 'offline' ? (
          <WifiOff className="w-4 h-4" />
        ) : (
          <Wifi className="w-4 h-4 animate-pulse" />
        )}
        <span className="text-sm font-medium">
          {connectionStatus === 'offline' ? 'Offline' : 'Reconnecting...'}
        </span>
      </motion.div>
    );
  };

  // Loading Overlay for Refresh
  const RefreshOverlay = () => {
    if (!isRefreshing) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg"
      >
        <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-sm font-medium text-gray-900">Refreshing...</span>
        </div>
      </motion.div>
    );
  };

  // Progress Bar
  const ProgressBar = () => {
    if (!showProgress || !showLoading) return null;

    return (
      <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
        <motion.div
          className="bg-blue-600 h-1 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    );
  };

  // Error State
  if (error && !showLoading) {
    if (errorState) {
      return <div className={className}>{errorState}</div>;
    }

    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-gray-600 mb-4 max-w-md">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try again</span>
          </button>
        )}
      </div>
    );
  }

  // Empty State
  if (isEmpty && !showLoading && !error) {
    if (emptyState) {
      return <div className={className}>{emptyState}</div>;
    }

    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
        <p className="text-gray-600">There's nothing to show here yet.</p>
      </div>
    );
  }

  // Loading State
  if (showLoading) {
    return (
      <div className={className}>
        <ProgressBar />
        {fallback || (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        )}
      </div>
    );
  }

  // Success State with potential refresh overlay
  return (
    <div className={`relative ${className}`}>
      <ConnectionStatus />
      <RefreshOverlay />
      {children}
    </div>
  );
};

// Specialized Loading Components
export const DashboardLoading: React.FC = () => (
  <div className="p-6 space-y-6">
    <div className="flex items-center justify-between mb-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-96"></div>
      </div>
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    </div>

    <SkeletonStats count={4} />

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonChart />
    </div>

    <SkeletonTable rows={6} cols={5} />
  </div>
);

export const TableLoading: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 10,
  cols = 4,
}) => <SkeletonTable rows={rows} cols={cols} />;

export const CardGridLoading: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

// Lazy Loading Wrapper
interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  onInView?: () => void;
}

export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  fallback = <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>,
  threshold = 0.1,
  rootMargin = '50px',
  onInView,
}) => {
  const [_isInView, setIsInView] = React.useState(false);
  const [hasBeenInView, setHasBeenInView] = React.useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (!hasBeenInView) {
            setHasBeenInView(true);
            onInView?.();
          }
        } else {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, onInView, hasBeenInView]);

  return <div ref={elementRef}>{hasBeenInView ? children : fallback}</div>;
};

// Enhanced Loading Button
interface LoadingButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  progress?: number;
  showProgress?: boolean;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText = 'Loading...',
  children,
  className = '',
  disabled = false,
  onClick,
  progress = 0,
  showProgress = false,
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`relative overflow-hidden transition-all duration-200 ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
      } ${className}`}
    >
      {/* Progress Bar Background */}
      {showProgress && isLoading && (
        <motion.div
          className="absolute inset-0 bg-white/20"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Button Content */}
      <div className="relative flex items-center justify-center space-x-2">
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        <span>{isLoading ? loadingText : children}</span>
      </div>
    </button>
  );
};

// Loading States Hook
export const useLoadingStates = () => {
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});

  const setLoading = React.useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  const isLoading = React.useCallback(
    (key: string): boolean => {
      return loadingStates[key] || false;
    },
    [loadingStates]
  );

  const hasAnyLoading = React.useCallback((): boolean => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  return { setLoading, isLoading, hasAnyLoading, loadingStates };
};

export default ProgressiveLoading;
