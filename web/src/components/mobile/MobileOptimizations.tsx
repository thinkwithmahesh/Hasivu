'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Wifi,
  WifiOff,
  Battery,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Vibrate,
  Accessibility,
  Eye,
  Contrast,
} from 'lucide-react';

// Performance monitoring hooks
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    fps: 60,
    batteryLevel: null as number | null,
    networkSpeed: 'unknown' as string,
  });

  useEffect(() => {
    const measurePerformance = () => {
      // Measure render time
      const startTime = performance.now();

      requestIdleCallback(() => {
        const renderTime = performance.now() - startTime;

        setMetrics(prev => ({
          ...prev,
          renderTime,
        }));
      });

      // Memory usage (if available)
      // @ts-ignore
      if (performance.memory) {
        // @ts-ignore
        const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memoryUsage * 100,
        }));
      }

      // Network connection info
      // @ts-ignore
      const connection =
        navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        setMetrics(prev => ({
          ...prev,
          networkSpeed: connection.effectiveType || 'unknown',
        }));
      }

      // Battery level
      // @ts-ignore
      if ('getBattery' in navigator) {
        // @ts-ignore
        navigator.getBattery().then(battery => {
          setMetrics(prev => ({
            ...prev,
            batteryLevel: battery.level * 100,
          }));
        });
      }
    };

    measurePerformance();
    const interval = setInterval(measurePerformance, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return metrics;
};

// Battery optimization hook
export const useBatteryOptimization = () => {
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const [batteryInfo, setBatteryInfo] = useState({
    level: null as number | null,
    charging: false,
    chargingTime: null as number | null,
    dischargingTime: null as number | null,
  });

  useEffect(() => {
    const getBatteryInfo = async () => {
      try {
        // @ts-ignore
        if ('getBattery' in navigator) {
          // @ts-ignore
          const battery = await navigator.getBattery();

          const updateBatteryInfo = () => {
            setBatteryInfo({
              level: battery.level * 100,
              charging: battery.charging,
              chargingTime: battery.chargingTime,
              dischargingTime: battery.dischargingTime,
            });

            // Enable low power mode if battery is below 20%
            setIsLowPowerMode(battery.level < 0.2 && !battery.charging);
          };

          updateBatteryInfo();

          battery.addEventListener('levelchange', updateBatteryInfo);
          battery.addEventListener('chargingchange', updateBatteryInfo);

          return () => {
            battery.removeEventListener('levelchange', updateBatteryInfo);
            battery.removeEventListener('chargingchange', updateBatteryInfo);
          };
        }
      } catch (error) {}
    };

    getBatteryInfo();
  }, []);

  const enableLowPowerMode = useCallback(() => {
    setIsLowPowerMode(true);
  }, []);

  const disableLowPowerMode = useCallback(() => {
    setIsLowPowerMode(false);
  }, []);

  return {
    isLowPowerMode,
    batteryInfo,
    enableLowPowerMode,
    disableLowPowerMode,
  };
};

// Data usage optimization hook
export const useDataOptimization = () => {
  const [isDataSaver, setIsDataSaver] = useState(false);
  const [dataUsage, setDataUsage] = useState(0);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    // @ts-ignore
    const connection =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
      const updateConnectionInfo = () => {
        setConnectionType(connection.effectiveType || 'unknown');

        // Enable data saver on slow connections
        const slowConnections = ['slow-2g', '2g'];
        setIsDataSaver(slowConnections.includes(connection.effectiveType));
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);

      return () => {
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }
  }, []);

  const enableDataSaver = useCallback(() => {
    setIsDataSaver(true);
  }, []);

  const disableDataSaver = useCallback(() => {
    setIsDataSaver(false);
  }, []);

  return {
    isDataSaver,
    dataUsage,
    connectionType,
    enableDataSaver,
    disableDataSaver,
  };
};

// Accessibility features hook
export const useAccessibility = () => {
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    voiceOver: false,
  });

  useEffect(() => {
    // Check for user preferences
    const checkPreferences = () => {
      setSettings(prev => ({
        ...prev,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      }));
    };

    checkPreferences();

    // Listen for changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    reducedMotionQuery.addEventListener('change', checkPreferences);
    highContrastQuery.addEventListener('change', checkPreferences);

    return () => {
      reducedMotionQuery.removeEventListener('change', checkPreferences);
      highContrastQuery.removeEventListener('change', checkPreferences);
    };
  }, []);

  const toggleSetting = useCallback((setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  }, []);

  return {
    settings,
    toggleSetting,
  };
};

// Optimized Image Component
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  loading = 'lazy',
  priority = false,
  quality = 75,
  placeholder = 'empty',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const { isDataSaver } = useDataOptimization();
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate optimized src based on device and connection
  const optimizedSrc = useMemo(() => {
    const params = new URLSearchParams();

    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());

    // Reduce quality for data saver mode
    const adjustedQuality = isDataSaver ? Math.min(quality, 50) : quality;
    params.append('q', adjustedQuality.toString());

    // Use WebP format if supported
    if (typeof window !== 'undefined') {
      const canvas = document.createElement('canvas');
      const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      if (webpSupported) {
        params.append('f', 'webp');
      }
    }

    return `${src}?${params.toString()}`;
  }, [src, width, height, quality, isDataSaver]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || priority) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && imgRef.current) {
            imgRef.current.src = optimizedSrc;
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [loading, priority, optimizedSrc]);

  if (error) {
    return (
      <div className={cn('bg-gray-200 flex items-center justify-center', className)}>
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {placeholder === 'blur' && !isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      <img
        ref={imgRef}
        src={loading === 'eager' || priority ? optimizedSrc : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
      />
    </div>
  );
};

// Performance Monitor Component
interface PerformanceMonitorProps {
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ className }) => {
  const metrics = usePerformanceMonitor();
  const { batteryInfo } = useBatteryOptimization();
  const { connectionType } = useDataOptimization();

  return (
    <Card className={cn('p-4', className)}>
      <h3 className="font-semibold mb-3 flex items-center">
        <Monitor className="h-4 w-4 mr-2" />
        Performance Monitor
      </h3>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Render Time:</span>
          <span className="font-mono">{metrics.renderTime.toFixed(1)}ms</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Memory:</span>
          <span className="font-mono">{metrics.memoryUsage.toFixed(1)}%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Network:</span>
          <span className="font-mono uppercase">{connectionType}</span>
        </div>

        {batteryInfo.level && (
          <div className="flex justify-between">
            <span className="text-gray-600">Battery:</span>
            <span className="font-mono">{batteryInfo.level.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </Card>
  );
};

// Battery Optimization Component
interface BatteryOptimizationProps {
  className?: string;
}

export const BatteryOptimization: React.FC<BatteryOptimizationProps> = ({ className }) => {
  const { isLowPowerMode, batteryInfo, enableLowPowerMode, disableLowPowerMode } =
    useBatteryOptimization();

  return (
    <Card className={cn('p-4', className)}>
      <h3 className="font-semibold mb-3 flex items-center">
        <Battery className="h-4 w-4 mr-2" />
        Battery Optimization
      </h3>

      <div className="space-y-3">
        {batteryInfo.level && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Battery Level:</span>
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  'w-16 h-2 bg-gray-200 rounded-full overflow-hidden',
                  batteryInfo.level < 20 && 'bg-red-100'
                )}
              >
                <div
                  className={cn(
                    'h-full transition-all duration-300',
                    batteryInfo.level < 20 ? 'bg-red-500' : 'bg-green-500'
                  )}
                  style={{ width: `${batteryInfo.level}%` }}
                />
              </div>
              <span className="text-sm font-mono">{batteryInfo.level.toFixed(0)}%</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Low Power Mode:</span>
          <Button
            variant={isLowPowerMode ? 'destructive' : 'outline'}
            size="sm"
            onClick={isLowPowerMode ? disableLowPowerMode : enableLowPowerMode}
          >
            {isLowPowerMode ? 'Disable' : 'Enable'}
          </Button>
        </div>

        {isLowPowerMode && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            Low power mode active: Reduced animations, slower background sync
          </div>
        )}
      </div>
    </Card>
  );
};

// Data Saver Component
interface DataSaverProps {
  className?: string;
}

export const DataSaver: React.FC<DataSaverProps> = ({ className }) => {
  const { isDataSaver, connectionType, enableDataSaver, disableDataSaver } = useDataOptimization();

  return (
    <Card className={cn('p-4', className)}>
      <h3 className="font-semibold mb-3 flex items-center">
        <Wifi className="h-4 w-4 mr-2" />
        Data Optimization
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Connection:</span>
          <div className="flex items-center space-x-2">
            {connectionType === 'slow-2g' || connectionType === '2g' ? (
              <WifiOff className="h-4 w-4 text-red-500" />
            ) : (
              <Wifi className="h-4 w-4 text-green-500" />
            )}
            <span className="text-sm font-mono uppercase">{connectionType}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Data Saver:</span>
          <Button
            variant={isDataSaver ? 'default' : 'outline'}
            size="sm"
            onClick={isDataSaver ? disableDataSaver : enableDataSaver}
          >
            {isDataSaver ? 'Enabled' : 'Enable'}
          </Button>
        </div>

        {isDataSaver && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            Data saver active: Compressed images, limited background sync
          </div>
        )}
      </div>
    </Card>
  );
};

// Accessibility Settings Component
interface AccessibilitySettingsProps {
  className?: string;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ className }) => {
  const { settings, toggleSetting } = useAccessibility();

  const accessibilityOptions = [
    {
      key: 'highContrast' as const,
      label: 'High Contrast',
      icon: <Contrast className="h-4 w-4" />,
      description: 'Increase contrast for better visibility',
    },
    {
      key: 'largeText' as const,
      label: 'Large Text',
      icon: <Eye className="h-4 w-4" />,
      description: 'Increase text size for better readability',
    },
    {
      key: 'reducedMotion' as const,
      label: 'Reduced Motion',
      icon: <Smartphone className="h-4 w-4" />,
      description: 'Minimize animations and transitions',
    },
    {
      key: 'voiceOver' as const,
      label: 'Voice Over',
      icon: <Volume2 className="h-4 w-4" />,
      description: 'Enable voice descriptions',
    },
  ];

  return (
    <Card className={cn('p-4', className)}>
      <h3 className="font-semibold mb-3 flex items-center">
        <Accessibility className="h-4 w-4 mr-2" />
        Accessibility
      </h3>

      <div className="space-y-3">
        {accessibilityOptions.map(option => (
          <div key={option.key} className="flex items-center justify-between">
            <div className="flex items-start space-x-3">
              {option.icon}
              <div>
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-xs text-gray-600">{option.description}</div>
              </div>
            </div>

            <Button
              variant={settings[option.key] ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSetting(option.key)}
            >
              {settings[option.key] ? 'On' : 'Off'}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Optimized Loading Skeleton
interface OptimizedSkeletonProps {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
  animate?: boolean;
}

export const OptimizedSkeleton: React.FC<OptimizedSkeletonProps> = ({
  className,
  lines = 3,
  showAvatar = false,
  animate = true,
}) => {
  const { settings } = useAccessibility();

  // Disable animation if reduced motion is preferred
  const shouldAnimate = animate && !settings.reducedMotion;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-start space-x-3">
        {showAvatar && (
          <Skeleton className={cn('h-10 w-10 rounded-full', shouldAnimate && 'animate-pulse')} />
        )}
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                'h-4',
                i === lines - 1 ? 'w-3/4' : 'w-full',
                shouldAnimate && 'animate-pulse'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Mobile Performance Dashboard
interface MobilePerformanceDashboardProps {
  className?: string;
}

export const MobilePerformanceDashboard: React.FC<MobilePerformanceDashboardProps> = ({
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      <PerformanceMonitor />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BatteryOptimization />
        <DataSaver />
      </div>

      <AccessibilitySettings />
    </div>
  );
};
