/**
 * Performance Monitor Component
 *
 * Tracks Core Web Vitals and sends to analytics
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 *
 * Usage:
 * Add to root layout (app/layout.tsx):
 * import { PerformanceMonitor } from '@/components/PerformanceMonitor';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {process.env.NODE_ENV === 'production' && <PerformanceMonitor />}
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 */

'use client';

import { useEffect } from 'react';
import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

// Performance thresholds (Google's Core Web Vitals)
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // ms
  FID: { good: 100, needsImprovement: 300 }, // ms
  CLS: { good: 0.1, needsImprovement: 0.25 }, // score
  FCP: { good: 1800, needsImprovement: 3000 }, // ms
  TTFB: { good: 800, needsImprovement: 1800 }, // ms
};

/**
 * Get rating for a metric
 */
function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[metricName as keyof typeof PERFORMANCE_THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric to analytics service
 */
function sendToAnalytics(metric: Metric) {
  const rating = getRating(metric.name, metric.value);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${emoji} [Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating,
      id: metric.id,
      delta: metric.delta,
    });
  }

  // Send to Google Analytics (if available)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: rating,
      non_interaction: true,
    });
  }

  // Send to Vercel Analytics (if available)
  if (typeof window !== 'undefined' && (window as any).va) {
    (window as any).va('event', {
      name: 'web-vitals',
      data: {
        metric: metric.name,
        value: metric.value,
        rating,
        id: metric.id,
      },
    });
  }

  // Send to custom analytics endpoint (optional)
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICSENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'web-vitals',
        metric: metric.name,
        value: metric.value,
        rating,
        id: metric.id,
        delta: metric.delta,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
      // Use keepalive to ensure the request completes even if the page is closed
      keepalive: true,
    }).catch(error => {
      console.error('Failed to send analytics:', error);
    });
  }

  // Console warnings for poor performance
  if (rating === 'poor') {
    console.warn(`⚠️ Poor ${metric.name} detected:`, {
      value: metric.value,
      threshold:
        PERFORMANCE_THRESHOLDS[metric.name as keyof typeof PERFORMANCE_THRESHOLDS]
          ?.needsImprovement,
      improvement: 'Check Performance Audit Report for optimization recommendations',
    });
  }
}

/**
 * Performance Monitor Component
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Monitor all Core Web Vitals
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);

    // Log initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance monitoring initialized');
    }
  }, []);

  // This component doesn't render anything
  return null;
}

/**
 * Hook for manual performance tracking
 *
 * Usage:
 * const { trackEvent } = usePerformanceTracking();
 * trackEvent('custom-metric', duration);
 */
export function usePerformanceTracking() {
  const trackEvent = (name: string, value: number, metadata?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [Custom Metric] ${name}:`, value, metadata);
    }

    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'custom_metric', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value),
        ...metadata,
      });
    }
  };

  const measureAsync = async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      trackEvent(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      trackEvent(`${name}_error`, duration);
      throw error;
    }
  };

  return {
    trackEvent,
    measureAsync,
  };
}

/**
 * Performance timing markers
 *
 * Usage:
 * PerformanceMark.start('api-call');
 * // ... async operation
 * PerformanceMark.end('api-call');
 */
export const PerformanceMark = {
  start: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-start`);
    }
  },

  end: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (measure) {
          console.log(`⏱️ [Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
        }
      } catch (error) {
        console.error('Performance measurement failed:', error);
      }
    }
  },

  clear: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
    }
  },
};
