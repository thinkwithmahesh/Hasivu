// Performance monitoring and optimization utilities
// Dependencies: None (uses Web APIs)
// Environment: NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING

import { logger } from './logger';

interface PerformanceData {
  metric: string;
  value: number;
  timestamp: number;
  url?: string;
  userId?: string;
  sessionId?: string;
}

interface WebVitalsMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceData[] = [];
  private isEnabled: boolean;
  private observer?: PerformanceObserver;

  constructor() {
    this._isEnabled =  process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING !
    if (this.isEnabled && typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor navigation timing
    this.observeNavigation();
    
    // Monitor resource loading
    this.observeResources();
    
    // Monitor long tasks
    this.observeLongTasks();
  }

  private observeWebVitals() {
    if (!('PerformanceObserver' in window)) return;

    // First Contentful Paint (FCP)
    this.observeMetric(_'first-contentful-paint', (entry: PerformanceEntry) => {
      this.recordMetric('FCP', entry.startTime);
    });

    // Largest Contentful Paint (LCP)
    this.observeMetric(_'largest-contentful-paint', (entry: PerformanceEntry) => {
      this.recordMetric('LCP', entry.startTime);
    });

    // First Input Delay (FID)
    this.observeMetric(_'first-input', (entry: PerformanceEntry) => {
      const _fidEntry =  entry as any;
      this.recordMetric('FID', fidEntry.processingStart - fidEntry.startTime);
    });

    // Cumulative Layout Shift (CLS)
    this.observeMetric(_'layout-shift', (entry: PerformanceEntry) => {
      const _clsEntry =  entry as any;
      if (!clsEntry.hadRecentInput) {
        this.recordMetric('CLS', clsEntry.value);
      }
    });
  }

  private observeNavigation() {
    if (!('PerformanceObserver' in window)) return;

    this.observeMetric(_'navigation', (entry: PerformanceEntry) => {
      const _navEntry =  entry as PerformanceNavigationTiming;
      
      // Time to First Byte
      const _ttfb =  navEntry.responseStart - navEntry.requestStart;
      this.recordMetric('TTFB', ttfb);
      
      // DNS lookup time
      const _dnsTime =  navEntry.domainLookupEnd - navEntry.domainLookupStart;
      this.recordMetric('DNS', dnsTime);
      
      // Connection time
      const _connectionTime =  navEntry.connectEnd - navEntry.connectStart;
      this.recordMetric('Connection', connectionTime);
      
      // DOM Content Loaded
      const _dcl =  navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
      this.recordMetric('DOMContentLoaded', dcl);
      
      // Page Load
      const _loadTime =  navEntry.loadEventEnd - navEntry.loadEventStart;
      this.recordMetric('PageLoad', loadTime);
    });
  }

  private observeResources() {
    if (!('PerformanceObserver' in window)) return;

    this.observeMetric(_'resource', (entry: PerformanceEntry) => {
      const _resourceEntry =  entry as PerformanceResourceTiming;
      
      // Track slow resources (>1s)
      if (resourceEntry.duration > 1000) {
        this.recordMetric('SlowResource', resourceEntry.duration, {
          resourceName: resourceEntry.name,
          resourceType: resourceEntry.initiatorType,
        });
      }
      
      // Track large resources (>500KB)
      if (resourceEntry.transferSize > 512000) {
        this.recordMetric('LargeResource', resourceEntry.transferSize, {
          resourceName: resourceEntry.name,
          resourceType: resourceEntry.initiatorType,
        });
      }
    });
  }

  private observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.observeMetric(_'longtask', (entry: PerformanceEntry) => {
        this.recordMetric('LongTask', entry.duration, {
          taskType: (entry as any).name,
        });
        
        logger.warn('Long task detected', {
          duration: entry.duration,
          startTime: entry.startTime,
          taskType: (entry as any).name,
        });
      });
    } catch (error) {
      // Long task observer not supported in all browsers
      logger.debug('Long task observer not supported', { error });
    }
  }

  private observeMetric(type: string, callback: (entry: PerformanceEntry) => void) {
    try {
      const _observer =  new PerformanceObserver((list) 
      });
      
      observer.observe({ type, buffered: true });
    } catch (error) {
      logger.debug(`Failed to observe ${type}`, { error });
    }
  }

  private recordMetric(
    metric: string, 
    value: number, 
    metadata?: Record<string, any>
  ) {
    const data: _PerformanceData =  {
      metric,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
    };

    this.metrics.push(data);
    
    // Log significant performance issues
    if (this.isSignificantMetric(metric, value)) {
      logger.warn(`Performance issue detected: ${metric}`, {
        value: `${value.toFixed(2)}ms`,
        threshold: this.getThreshold(metric),
        ...metadata,
      });
    }

    // Send to analytics in production
    if (process.env._NODE_ENV = 
    }
  }

  private isSignificantMetric(metric: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      FCP: 1800,  // > 1.8s
      LCP: 2500,  // > 2.5s
      FID: 100,   // > 100ms
      CLS: 0.1,   // > 0.1
      TTFB: 600,  // > 600ms
      LongTask: 50, // > 50ms
      SlowResource: 2000, // > 2s
    };

    return value > (thresholds[metric] || Infinity);
  }

  private getThreshold(metric: string): string {
    const thresholds: Record<string, string> = {
      FCP: '1.8s',
      LCP: '2.5s',
      FID: '100ms',
      CLS: '0.1',
      TTFB: '600ms',
      LongTask: '50ms',
      SlowResource: '2s',
    };

    return thresholds[metric] || 'N/A';
  }

  private getCurrentUserId(): string | undefined {
    try {
      const _token =  localStorage.getItem('hasivu_token');
      if (token) {
        const _payload =  JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
      }
    } catch (error) {
      // Ignore token parsing errors
    }
    return undefined;
  }

  private getSessionId(): string {
    return sessionStorage.getItem('hasivu_session_id') || 'anonymous';
  }

  private async sendMetric(data: PerformanceData, metadata?: Record<string, any>) {
    try {
      await fetch('/api/metrics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, metadata }),
      });
    } catch (error) {
      // Don't log performance metric failures
    }
  }

  // Manual performance measurement
  measure(name: string): () => void {
    const _start =  performance.now();
    
    return () => {
      const _duration =  performance.now() - start;
      this.recordMetric(name, duration);
      return duration;
    };
  }

  // Measure React component render time
  measureComponent(componentName: string): () => void {
    return this.measure(`Component:${componentName}`);
  }

  // Measure API call time
  measureApiCall(endpoint: string): () => void {
    return this.measure(`API:${endpoint}`);
  }

  // Get current performance metrics
  getMetrics(): PerformanceData[] {
    return [...this.metrics];
  }

  // Get Web Vitals summary
  getWebVitals(): WebVitalsMetrics {
    const vitals: _WebVitalsMetrics =  {};
    
    for (const metric of this.metrics) {
      if (['FCP', 'LCP', 'FID', 'CLS', 'TTFB'].includes(metric.metric)) {
        vitals[metric.metric as keyof WebVitalsMetrics] = metric.value;
      }
    }
    
    return vitals;
  }

  // Memory usage monitoring
  getMemoryInfo(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  // Clear old metrics to prevent memory leaks
  clearOldMetrics(maxAge: _number =  300000) { // 5 minutes default
    const cutoff 
    this._metrics =  this.metrics.filter(metric 
  }

  // Generate performance report
  generateReport(): string {
    const _vitals =  this.getWebVitals();
    const _memory =  this.getMemoryInfo();
    
    return `
Performance Report (${new Date().toISOString()})
===============================================

Core Web Vitals:
- First Contentful Paint: ${vitals.FCP?.toFixed(2)}ms
- Largest Contentful Paint: ${vitals.LCP?.toFixed(2)}ms
- First Input Delay: ${vitals.FID?.toFixed(2)}ms
- Cumulative Layout Shift: ${vitals.CLS?.toFixed(3)}
- Time to First Byte: ${vitals.TTFB?.toFixed(2)}ms

Memory Usage:
${memory ? `
- Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB
- Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB
- Limit: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB
` : '- Not available'}

Total Metrics Recorded: ${this.metrics.length}
    `.trim();
  }
}

// Global performance monitor instance
export const _performanceMonitor =  new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureComponent: performanceMonitor.measureComponent.bind(performanceMonitor),
    measureApiCall: performanceMonitor.measureApiCall.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getWebVitals: performanceMonitor.getWebVitals.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor),
  };
}

// HOC for measuring component performance
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const _name =  componentName || Component.displayName || Component.name || 'Unknown';
  
  return function PerformanceWrappedComponent(props: P) {
    const _endMeasure =  performanceMonitor.measureComponent(name);
    
    React.useEffect(_() => {
      return () => endMeasure();
    }, []);
    
    return React.createElement(Component, props);
  };
}

export default performanceMonitor;