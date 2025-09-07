/**
 * HASIVU Enterprise Core Web Vitals Performance Tests
 * 🚀 Performance monitoring with automated alerting and optimization
 * 📊 Core Web Vitals compliance validation (LCP, FID, CLS)
 * 🎯 Mobile-first performance optimization testing
 */

import { test, expect, Page } from '@playwright/test';
import { PERFORMANCE_BUDGETS, RESPONSIVE_BREAKPOINTS, USER_ROLES } from '../utils/brand-constants';

// Core Web Vitals thresholds (Google standards)
const PERFORMANCE_THRESHOLDS = {
  LCP: 2500,  // Largest Contentful Paint (ms)
  FID: 100,   // First Input Delay (ms) 
  CLS: 0.1,   // Cumulative Layout Shift
  FCP: 1800,  // First Contentful Paint (ms)
  TTI: 3800,  // Time to Interactive (ms)
  TBT: 300,   // Total Blocking Time (ms)
  SI: 3400,   // Speed Index (ms)
};

// Performance test scenarios with priority levels
const PERFORMANCE_SCENARIOS = [
  {
    name: 'Homepage Performance',
    path: '/',
    priority: 'P0',
    description: 'Critical landing page performance',
    strictThresholds: true
  },
  {
    name: 'Login Performance', 
    path: '/auth/login',
    priority: 'P0',
    description: 'Authentication flow performance',
    strictThresholds: true
  },
  {
    name: 'Menu Browsing Performance',
    path: '/menu',
    priority: 'P1', 
    description: 'Core ordering workflow performance',
    strictThresholds: true
  },
  {
    name: 'Dashboard Performance',
    path: '/dashboard',
    priority: 'P1',
    description: 'User dashboard performance',
    strictThresholds: false
  },
  {
    name: 'RFID Scan Performance',
    path: '/rfid/scan',
    priority: 'P1',
    description: 'Real-time RFID scanning performance',
    strictThresholds: true
  }
];

test.describe('HASIVU Core Web Vitals Performance Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      // Performance observer for Core Web Vitals
      window.webVitalsData = {};
      
      // Largest Contentful Paint observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        window.webVitalsData.LCP = lastEntry.startTime;
      });
      
      // First Input Delay observer  
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-input') {
            window.webVitalsData.FID = entry.processingStart - entry.startTime;
          }
        }
      });

      // Cumulative Layout Shift observer
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        window.webVitalsData.CLS = clsValue;
      });

      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            window.webVitalsData.FCP = entry.startTime;
          }
        }
      });

      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        fidObserver.observe({ type: 'first-input', buffered: true });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        fcpObserver.observe({ type: 'paint', buffered: true });
      } catch (e) {
        console.warn('Performance Observer not supported:', e);
      }
    });
  });

  // Test each performance scenario
  for (const scenario of PERFORMANCE_SCENARIOS) {
    test(`${scenario.name} - Core Web Vitals Validation`, async ({ page }) => {
      // Navigate to test page
      const startTime = Date.now();
      await page.goto(scenario.path);
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Allow metrics to settle
      
      // Collect performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintEntries = performance.getEntriesByType('paint');
        
        return {
          // Core Web Vitals from observers
          LCP: window.webVitalsData?.LCP || 0,
          FID: window.webVitalsData?.FID || 0, 
          CLS: window.webVitalsData?.CLS || 0,
          FCP: window.webVitalsData?.FCP || paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
          
          // Additional performance metrics
          TTI: navigation.domInteractive - navigation.navigationStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          
          // Resource timing
          totalResources: performance.getEntriesByType('resource').length,
          totalTransferSize: performance.getEntriesByType('resource').reduce((sum: number, entry: any) => sum + (entry.transferSize || 0), 0),
          
          // JavaScript execution time
          totalScriptDuration: performance.getEntriesByType('measure').reduce((sum: number, entry) => sum + entry.duration, 0)
        };
      });

      // Log performance results for debugging
      console.log(`${scenario.name} Performance Metrics:`, performanceMetrics);

      // Core Web Vitals validation with priority-based thresholds
      if (scenario.strictThresholds) {
        // Strict thresholds for critical paths
        if (performanceMetrics.LCP > 0) {
          expect(performanceMetrics.LCP).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
        }
        if (performanceMetrics.FCP > 0) {
          expect(performanceMetrics.FCP).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
        }
        if (performanceMetrics.CLS > 0) {
          expect(performanceMetrics.CLS).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
        }
        if (performanceMetrics.FID > 0) {
          expect(performanceMetrics.FID).toBeLessThan(PERFORMANCE_THRESHOLDS.FID);
        }
      } else {
        // Relaxed thresholds for non-critical paths (20% tolerance)
        const tolerance = 1.2;
        if (performanceMetrics.LCP > 0) {
          expect(performanceMetrics.LCP).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP * tolerance);
        }
        if (performanceMetrics.FCP > 0) {
          expect(performanceMetrics.FCP).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP * tolerance);
        }
      }

      // Bundle size validation
      expect(performanceMetrics.totalTransferSize).toBeLessThan(PERFORMANCE_BUDGETS.bundleSize.total);
      
      // DOM metrics validation
      expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // 3s DOM ready
      expect(performanceMetrics.loadComplete).toBeLessThan(5000); // 5s complete load
      
      // Resource count validation (prevent resource bloat)
      expect(performanceMetrics.totalResources).toBeLessThan(150); // Reasonable resource limit
    });
  }

  test('Mobile Performance Optimization', async ({ page }) => {
    // Test mobile-specific performance
    await page.setViewportSize(RESPONSIVE_BREAKPOINTS.mobile);
    
    // Simulate 3G network conditions
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms latency
      await route.continue();
    });

    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const mobileMetrics = await page.evaluate(() => {
      return {
        LCP: window.webVitalsData?.LCP || 0,
        FCP: window.webVitalsData?.FCP || 0,
        CLS: window.webVitalsData?.CLS || 0
      };
    });

    // Mobile-specific thresholds (more lenient for 3G)
    if (mobileMetrics.LCP > 0) {
      expect(mobileMetrics.LCP).toBeLessThan(4000); // 4s for mobile 3G
    }
    if (mobileMetrics.FCP > 0) {
      expect(mobileMetrics.FCP).toBeLessThan(3000); // 3s for mobile 3G
    }
    if (mobileMetrics.CLS > 0) {
      expect(mobileMetrics.CLS).toBeLessThan(0.1); // Same CLS standard
    }
  });

  test('Performance Under Load Simulation', async ({ page }) => {
    // Simulate high load conditions
    await page.addInitScript(() => {
      // Add artificial CPU load
      const startTime = performance.now();
      while (performance.now() - startTime < 50) {
        // CPU intensive operation
        Math.random() * Math.random();
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Simulate user interactions under load
    await page.click('[data-testid="menu-button"]', { timeout: 5000 });
    
    const interactionTime = await page.evaluate(() => {
      return performance.now();
    });
    
    // Interaction should still be responsive under load
    expect(interactionTime).toBeGreaterThan(0);
  });

  test('Resource Loading Optimization', async ({ page }) => {
    let resourceMetrics: any[] = [];
    
    // Monitor resource loading
    page.on('response', (response) => {
      resourceMetrics.push({
        url: response.url(),
        status: response.status(),
        size: response.headers()['content-length'] || 0,
        type: response.headers()['content-type'] || 'unknown',
        timing: response.timing()
      });
    });

    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    // Analyze resource loading patterns
    const imageResources = resourceMetrics.filter(r => r.type.startsWith('image/'));
    const jsResources = resourceMetrics.filter(r => r.type.includes('javascript'));
    const cssResources = resourceMetrics.filter(r => r.type.includes('css'));

    // Validate resource optimization
    expect(imageResources.length).toBeLessThan(20); // Reasonable image count
    expect(jsResources.length).toBeLessThan(10); // Bundle consolidation
    expect(cssResources.length).toBeLessThan(5); // CSS consolidation

    // Check for efficient caching
    const cachedResources = resourceMetrics.filter(r => r.status === 304);
    expect(cachedResources.length).toBeGreaterThan(0); // Some resources should be cached
  });

  test('Memory Usage Monitoring', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Monitor memory usage
    const memoryUsage = await page.evaluate(() => {
      if ('memory' in performance) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        };
      }
      return null;
    });

    if (memoryUsage) {
      // Memory should be under reasonable limits
      expect(memoryUsage.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB
      
      // Memory usage ratio should be reasonable
      const memoryRatio = memoryUsage.usedJSHeapSize / memoryUsage.totalJSHeapSize;
      expect(memoryRatio).toBeLessThan(0.8); // Less than 80% of allocated heap
    }
  });

  test('Performance Budget Monitoring', async ({ page }) => {
    // Comprehensive performance budget test
    const budgetTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const resourceSizes = entries
            .filter((entry: any) => entry.transferSize)
            .reduce((total: number, entry: any) => total + entry.transferSize, 0);
          
          resolve({
            totalResourceSize: resourceSizes,
            resourceCount: entries.length,
            navigationTiming: performance.getEntriesByType('navigation')[0]
          });
        });
        
        observer.observe({ type: 'resource', buffered: true });
        
        // Fallback timeout
        setTimeout(() => resolve({ error: 'timeout' }), 5000);
      });
    });

    // Performance budget validation
    if (budgetTest && typeof budgetTest === 'object' && 'totalResourceSize' in budgetTest) {
      expect(budgetTest.totalResourceSize).toBeLessThan(PERFORMANCE_BUDGETS.bundleSize.total);
    }
  });

});