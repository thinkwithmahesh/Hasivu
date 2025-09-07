/**
 * HASIVU Platform - Production Performance Monitoring System
 * Comprehensive Core Web Vitals tracking, performance metrics, and optimization
 * Implements real-time performance monitoring with analytics integration
 */

import { getCLS, getFCP, getFID, getLCP, getTTFB, onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals';

// Performance thresholds (based on Core Web Vitals recommendations)
export const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LCP: { good: 2500, needs_improvement: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, needs_improvement: 300 },   // First Input Delay (ms) 
  CLS: { good: 0.1, needs_improvement: 0.25 },  // Cumulative Layout Shift
  
  // Additional metrics
  FCP: { good: 1800, needs_improvement: 3000 }, // First Contentful Paint (ms)
  TTFB: { good: 800, needs_improvement: 1800 }, // Time to First Byte (ms)
  
  // Custom metrics
  TTI: { good: 3800, needs_improvement: 7300 }, // Time to Interactive (ms)
  TBT: { good: 200, needs_improvement: 600 },   // Total Blocking Time (ms)
} as const;

// Performance metric types
export interface PerformanceMetric {
  name: string;
  value: number;
  delta?: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  id?: string;
  navigationType?: string;
  connectionType?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  userId?: string;
  sessionId?: string;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  pageInfo: {
    url: string;
    title: string;
    referrer: string;
    timestamp: number;
  };
  deviceInfo: {
    userAgent: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    connection?: NetworkInformation;
    memory?: DeviceMemoryInfo;
  };
  vitals: {
    lcp?: PerformanceMetric;
    fid?: PerformanceMetric;
    cls?: PerformanceMetric;
    fcp?: PerformanceMetric;
    ttfb?: PerformanceMetric;
  };
  customMetrics: Record<string, PerformanceMetric>;
  score: number; // Overall performance score (0-100)
}

// Device type detection
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const userAgent = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

// Performance rating calculation
function getPerformanceRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needs_improvement) return 'needs-improvement';
  return 'poor';
}

// Generate session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Performance reporter class
class PerformanceReporter {
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private userId?: string;
  private reportingEndpoint: string;
  private batchSize: number = 10;
  private reportingInterval: number = 30000; // 30 seconds
  private reportingTimer?: NodeJS.Timeout;

  constructor(config?: {
    endpoint?: string;
    batchSize?: number;
    interval?: number;
    userId?: string;
  }) {
    this.sessionId = generateSessionId();
    this.userId = config?.userId;
    this.reportingEndpoint = config?.endpoint || '/api/v1/performance';
    this.batchSize = config?.batchSize || 10;
    this.reportingInterval = config?.interval || 30000;
    
    this.setupReporting();
    this.setupBeforeUnloadReporting();
  }

  // Add metric to collection
  addMetric(metric: Omit<PerformanceMetric, 'timestamp' | 'url' | 'deviceType' | 'sessionId'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
      url: window.location.href,
      deviceType: getDeviceType(),
      sessionId: this.sessionId,
      userId: this.userId,
    };
    
    this.metrics.push(fullMetric);
    
    // Report immediately for critical metrics
    if (metric.rating === 'poor') {
      this.reportMetrics([fullMetric]);
    }
    
    // Batch reporting
    if (this.metrics.length >= this.batchSize) {
      this.reportBatch();
    }
  }

  // Setup periodic reporting
  private setupReporting() {
    this.reportingTimer = setInterval(() => {
      if (this.metrics.length > 0) {
        this.reportBatch();
      }
    }, this.reportingInterval);
  }

  // Setup before unload reporting
  private setupBeforeUnloadReporting() {
    window.addEventListener('beforeunload', () => {
      if (this.metrics.length > 0) {
        this.reportBatch(true); // Use sendBeacon for reliability
      }
    });
    
    // Use Page Visibility API for better reliability
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.metrics.length > 0) {
        this.reportBatch(true);
      }
    });
  }

  // Report metrics batch
  private reportBatch(useBeacon: boolean = false) {
    const metricsToReport = [...this.metrics];
    this.metrics = [];
    
    this.reportMetrics(metricsToReport, useBeacon);
  }

  // Send metrics to analytics endpoint
  private async reportMetrics(metrics: PerformanceMetric[], useBeacon: boolean = false) {
    try {
      const report: Partial<PerformanceReport> = {
        metrics,
        pageInfo: {
          url: window.location.href,
          title: document.title,
          referrer: document.referrer,
          timestamp: Date.now(),
        },
        deviceInfo: {
          userAgent: navigator.userAgent,
          deviceType: getDeviceType(),
          connection: (navigator as any).connection,
          memory: (performance as any).memory,
        },
      };

      const payload = JSON.stringify(report);
      
      if (useBeacon && navigator.sendBeacon) {
        // Use sendBeacon for reliability during page unload
        navigator.sendBeacon(this.reportingEndpoint, payload);
      } else {
        // Standard fetch for regular reporting
        fetch(this.reportingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payload,
          keepalive: true,
        }).catch(error => {
          console.warn('[Performance] Failed to report metrics:', error);
          // Store in localStorage for retry
          this.storeForRetry(metrics);
        });
      }
    } catch (error) {
      console.warn('[Performance] Failed to prepare metrics report:', error);
    }
  }

  // Store failed metrics for retry
  private storeForRetry(metrics: PerformanceMetric[]) {
    try {
      const stored = localStorage.getItem('hasivu_performance_retry') || '[]';
      const retryMetrics = JSON.parse(stored);
      retryMetrics.push(...metrics);
      
      // Limit stored metrics to prevent storage bloat
      const limited = retryMetrics.slice(-100);
      localStorage.setItem('hasivu_performance_retry', JSON.stringify(limited));
    } catch (error) {
      console.warn('[Performance] Failed to store metrics for retry:', error);
    }
  }

  // Retry failed metrics
  retryFailedMetrics() {
    try {
      const stored = localStorage.getItem('hasivu_performance_retry');
      if (stored) {
        const retryMetrics = JSON.parse(stored);
        if (retryMetrics.length > 0) {
          this.reportMetrics(retryMetrics);
          localStorage.removeItem('hasivu_performance_retry');
        }
      }
    } catch (error) {
      console.warn('[Performance] Failed to retry metrics:', error);
    }
  }

  // Cleanup
  destroy() {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }
    
    // Report any remaining metrics
    if (this.metrics.length > 0) {
      this.reportBatch(true);
    }
  }
}

// Global performance reporter instance
let performanceReporter: PerformanceReporter;

// Initialize performance monitoring
export function initPerformanceMonitoring(config?: {
  endpoint?: string;
  batchSize?: number;
  interval?: number;
  userId?: string;
  enableCustomMetrics?: boolean;
}) {
  if (typeof window === 'undefined') return;
  
  // Initialize reporter
  performanceReporter = new PerformanceReporter({
    endpoint: config?.endpoint,
    batchSize: config?.batchSize,
    interval: config?.interval,
    userId: config?.userId,
  });

  // Core Web Vitals monitoring
  onCLS((metric) => {
    performanceReporter.addMetric({
      name: 'CLS',
      value: metric.value,
      delta: metric.delta,
      rating: getPerformanceRating('CLS', metric.value),
      id: metric.id,
      navigationType: metric.navigationType,
    });
  });

  onFID((metric) => {
    performanceReporter.addMetric({
      name: 'FID',
      value: metric.value,
      delta: metric.delta,
      rating: getPerformanceRating('FID', metric.value),
      id: metric.id,
      navigationType: metric.navigationType,
    });
  });

  onLCP((metric) => {
    performanceReporter.addMetric({
      name: 'LCP',
      value: metric.value,
      delta: metric.delta,
      rating: getPerformanceRating('LCP', metric.value),
      id: metric.id,
      navigationType: metric.navigationType,
    });
  });

  onFCP((metric) => {
    performanceReporter.addMetric({
      name: 'FCP',
      value: metric.value,
      delta: metric.delta,
      rating: getPerformanceRating('FCP', metric.value),
      id: metric.id,
      navigationType: metric.navigationType,
    });
  });

  onTTFB((metric) => {
    performanceReporter.addMetric({
      name: 'TTFB',
      value: metric.value,
      delta: metric.delta,
      rating: getPerformanceRating('TTFB', metric.value),
      id: metric.id,
      navigationType: metric.navigationType,
    });
  });

  // Custom metrics if enabled
  if (config?.enableCustomMetrics) {
    initCustomMetrics();
  }

  // Retry any failed metrics from previous sessions
  setTimeout(() => {
    performanceReporter.retryFailedMetrics();
  }, 1000);

  console.log('[Performance] Monitoring initialized');
}

// Custom performance metrics
function initCustomMetrics() {
  // Time to Interactive (TTI) approximation
  let ttiObserver: PerformanceObserver;
  
  if ('PerformanceObserver' in window) {
    ttiObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry && lastEntry.entryType === 'navigation') {
        const tti = (lastEntry as PerformanceNavigationTiming).loadEventEnd;
        if (tti > 0) {
          performanceReporter.addMetric({
            name: 'TTI',
            value: tti,
            rating: getPerformanceRating('TTI', tti),
          });
        }
      }
    });
    
    try {
      ttiObserver.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.warn('[Performance] TTI observer failed:', error);
    }
  }

  // Custom business metrics
  trackCustomBusinessMetrics();
}

// Track business-specific performance metrics
function trackCustomBusinessMetrics() {
  // Menu load time
  const trackMenuLoadTime = () => {
    const startTime = performance.now();
    
    // This would be called when menu data is loaded
    window.addEventListener('hasivu:menu-loaded', () => {
      const loadTime = performance.now() - startTime;
      performanceReporter.addMetric({
        name: 'MENU_LOAD_TIME',
        value: loadTime,
        rating: loadTime < 1000 ? 'good' : loadTime < 2000 ? 'needs-improvement' : 'poor',
      });
    });
  };

  // Order completion time
  const trackOrderCompletion = () => {
    window.addEventListener('hasivu:order-started', () => {
      const startTime = performance.now();
      
      const completionHandler = () => {
        const completionTime = performance.now() - startTime;
        performanceReporter.addMetric({
          name: 'ORDER_COMPLETION_TIME',
          value: completionTime,
          rating: completionTime < 30000 ? 'good' : completionTime < 60000 ? 'needs-improvement' : 'poor',
        });
        window.removeEventListener('hasivu:order-completed', completionHandler);
      };
      
      window.addEventListener('hasivu:order-completed', completionHandler);
    });
  };

  trackMenuLoadTime();
  trackOrderCompletion();
}

// Manual metric tracking
export function trackCustomMetric(name: string, value: number, thresholds?: { good: number; needs_improvement: number }) {
  if (!performanceReporter) {
    console.warn('[Performance] Reporter not initialized');
    return;
  }

  let rating: 'good' | 'needs-improvement' | 'poor' = 'good';
  if (thresholds) {
    if (value <= thresholds.good) rating = 'good';
    else if (value <= thresholds.needs_improvement) rating = 'needs-improvement';
    else rating = 'poor';
  }

  performanceReporter.addMetric({
    name: name.toUpperCase(),
    value,
    rating,
  });
}

// Performance utilities
export const PerformanceUtils = {
  // Mark performance timing
  mark: (name: string) => {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  },

  // Measure performance between marks
  measure: (name: string, startMark: string, endMark?: string) => {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        return measure ? measure.duration : 0;
      } catch (error) {
        console.warn('[Performance] Measure failed:', error);
        return 0;
      }
    }
    return 0;
  },

  // Get current performance metrics
  getCurrentMetrics: () => {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        firstByte: navigation.responseStart - navigation.fetchStart,
        domProcessing: navigation.domComplete - navigation.domLoading,
        resourcesLoading: navigation.loadEventEnd - navigation.domContentLoadedEventEnd,
      };
    }
    return null;
  },

  // Performance budget check
  checkPerformanceBudget: (budgets: Record<string, number>) => {
    const currentMetrics = PerformanceUtils.getCurrentMetrics();
    if (!currentMetrics) return {};

    const violations: Record<string, { actual: number; budget: number; violation: number }> = {};
    
    Object.entries(budgets).forEach(([metric, budget]) => {
      const actual = currentMetrics[metric as keyof typeof currentMetrics];
      if (actual && actual > budget) {
        violations[metric] = {
          actual,
          budget,
          violation: actual - budget,
        };
      }
    });

    return violations;
  },
};

// Resource loading performance
export function trackResourcePerformance() {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          
          // Track slow resources
          if (resource.duration > 1000) {
            performanceReporter?.addMetric({
              name: 'SLOW_RESOURCE',
              value: resource.duration,
              rating: 'poor',
            });
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('[Performance] Resource observer failed:', error);
    }
  }
}

// Cleanup performance monitoring
export function cleanupPerformanceMonitoring() {
  if (performanceReporter) {
    performanceReporter.destroy();
  }
}

// Performance debugging (development only)
export function debugPerformance() {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group('🚀 Performance Debug Info');
  
  // Core Web Vitals
  getCLS(console.log.bind(console, 'CLS:'));
  getFCP(console.log.bind(console, 'FCP:'));
  getFID(console.log.bind(console, 'FID:'));
  getLCP(console.log.bind(console, 'LCP:'));
  getTTFB(console.log.bind(console, 'TTFB:'));
  
  // Current metrics
  const currentMetrics = PerformanceUtils.getCurrentMetrics();
  if (currentMetrics) {
    console.table(currentMetrics);
  }
  
  // Resource performance
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const slowResources = resources.filter(r => r.duration > 500);
  if (slowResources.length > 0) {
    console.warn('Slow resources (>500ms):', slowResources);
  }
  
  console.groupEnd();
}