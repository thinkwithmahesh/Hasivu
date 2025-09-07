/**
 * HASIVU Enterprise Core Web Vitals Performance Tests  
 * 🎨 Brand Colors: Vibrant Blue (#2563eb), Deep Green (#16a34a)
 * ⚡ Performance monitoring with comprehensive metrics
 * 📊 Core Web Vitals compliance validation
 */

import { test, expect, Page } from '@playwright/test';

// Performance thresholds based on Core Web Vitals
const PERFORMANCE_THRESHOLDS = {
  LCP: 2500,    // Largest Contentful Paint (ms) - Good: <2.5s
  FID: 100,     // First Input Delay (ms) - Good: <100ms  
  CLS: 0.1,     // Cumulative Layout Shift - Good: <0.1
  TTFB: 600,    // Time to First Byte (ms) - Good: <600ms
  FCP: 1800,    // First Contentful Paint (ms) - Good: <1.8s
  TTI: 3800,    // Time to Interactive (ms) - Good: <3.8s
  TBT: 200,     // Total Blocking Time (ms) - Good: <200ms
  SI: 3000      // Speed Index (ms) - Good: <3.0s
};

// Pages to test for performance
const PAGES_TO_TEST = [
  { path: '/', name: 'homepage', priority: 'critical' },
  { path: '/auth/login', name: 'login', priority: 'high' },
  { path: '/auth/register', name: 'register', priority: 'high' },
  { path: '/dashboard/parent', name: 'parent-dashboard', priority: 'critical' },
  { path: '/dashboard/admin', name: 'admin-dashboard', priority: 'high' },
  { path: '/dashboard/kitchen', name: 'kitchen-dashboard', priority: 'high' }
];

// Network conditions for testing
const NETWORK_CONDITIONS = [
  { name: 'fast-3g', downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150 },
  { name: 'slow-3g', downloadThroughput: 500 * 1024 / 8, uploadThroughput: 500 * 1024 / 8, latency: 400 },
  { name: 'wifi', downloadThroughput: 30 * 1024 * 1024 / 8, uploadThroughput: 15 * 1024 * 1024 / 8, latency: 2 }
];

test.describe('HASIVU Core Web Vitals Performance', () => {

  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      // Performance observer for Core Web Vitals
      window.performanceMetrics = {
        LCP: 0,
        FID: 0,
        CLS: 0,
        TTFB: 0,
        FCP: 0,
        measurements: []
      };

      // LCP Observer
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
              window.performanceMetrics.LCP = entries[entries.length - 1].startTime;
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // FCP Observer  
          const fcpObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                window.performanceMetrics.FCP = entry.startTime;
              }
            }
          });
          fcpObserver.observe({ entryTypes: ['paint'] });

          // CLS Observer
          const clsObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (!entry.hadRecentInput) {
                window.performanceMetrics.CLS += entry.value;
              }
            }
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // TTFB from Navigation Timing
          window.addEventListener('load', () => {
            const navigationEntries = performance.getEntriesByType('navigation');
            if (navigationEntries.length > 0) {
              const nav = navigationEntries[0];
              window.performanceMetrics.TTFB = nav.responseStart - nav.requestStart;
            }
          });
        } catch (error) {
          console.warn('Performance observers not supported:', error);
        }
      }
    });
  });

  test.describe('Critical Pages Performance', () => {

    PAGES_TO_TEST.forEach(({ path, name, priority }) => {
      test(`${name} Core Web Vitals - ${priority} priority`, async ({ page }) => {
        const startTime = Date.now();

        // Navigate to page
        const response = await page.goto(path, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });

        // Verify page loads successfully
        expect(response?.status()).toBe(200);

        // Wait for page to be fully interactive
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000); // Allow metrics to be collected

        // Get performance metrics
        const performanceData = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const paintEntries = performance.getEntriesByType('paint');
          
          return {
            // Core Web Vitals
            LCP: window.performanceMetrics?.LCP || 0,
            FID: window.performanceMetrics?.FID || 0, 
            CLS: window.performanceMetrics?.CLS || 0,
            
            // Additional metrics
            TTFB: navigation.responseStart - navigation.fetchStart,
            FCP: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
            loadComplete: navigation.loadEventEnd - navigation.fetchStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            
            // Resource metrics
            totalResources: performance.getEntriesByType('resource').length,
            totalResourceSize: performance.getEntriesByType('resource').reduce((acc, resource) => {
              return acc + (resource.transferSize || 0);
            }, 0),
            
            // Timing breakdown
            dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcpConnect: navigation.connectEnd - navigation.connectStart,
            serverResponse: navigation.responseEnd - navigation.requestStart,
            domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd
          };
        });

        const totalTime = Date.now() - startTime;

        // Log performance metrics
        console.log(`\n📊 Performance Metrics for ${name}:`);
        console.log(`  LCP: ${performanceData.LCP.toFixed(0)}ms (threshold: ${PERFORMANCE_THRESHOLDS.LCP}ms)`);
        console.log(`  FID: ${performanceData.FID.toFixed(0)}ms (threshold: ${PERFORMANCE_THRESHOLDS.FID}ms)`);
        console.log(`  CLS: ${performanceData.CLS.toFixed(3)} (threshold: ${PERFORMANCE_THRESHOLDS.CLS})`);
        console.log(`  TTFB: ${performanceData.TTFB.toFixed(0)}ms (threshold: ${PERFORMANCE_THRESHOLDS.TTFB}ms)`);
        console.log(`  FCP: ${performanceData.FCP.toFixed(0)}ms (threshold: ${PERFORMANCE_THRESHOLDS.FCP}ms)`);
        console.log(`  Load Complete: ${performanceData.loadComplete.toFixed(0)}ms`);
        console.log(`  Resources: ${performanceData.totalResources}`);
        console.log(`  Total Size: ${(performanceData.totalResourceSize / 1024).toFixed(0)}KB`);

        // Store metrics for reporting
        const performanceReport = {
          page: name,
          path,
          priority,
          timestamp: new Date().toISOString(),
          metrics: performanceData,
          thresholds: PERFORMANCE_THRESHOLDS,
          brandColors: {
            primary: '#2563eb',
            secondary: '#16a34a'
          }
        };

        // Save detailed performance report
        await page.context().storageState({
          path: `test-results/performance/performance-${name}-${Date.now()}.json`
        });

        // Performance assertions for critical pages
        if (priority === 'critical') {
          // LCP should be under 2.5s for critical pages
          expect(performanceData.LCP).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP);
          
          // TTFB should be under 600ms
          expect(performanceData.TTFB).toBeLessThan(PERFORMANCE_THRESHOLDS.TTFB);
          
          // CLS should be under 0.1
          expect(performanceData.CLS).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
        }

        // FCP should be reasonable for all pages
        if (performanceData.FCP > 0) {
          expect(performanceData.FCP).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP);
        }

        // Page should load completely within reasonable time
        expect(performanceData.loadComplete).toBeLessThan(5000);

        // Resource count should be reasonable (not too many requests)
        expect(performanceData.totalResources).toBeLessThan(100);

        // Total resource size should be reasonable (under 2MB)
        expect(performanceData.totalResourceSize).toBeLessThan(2 * 1024 * 1024);
      });
    });

  });

  test.describe('Network Conditions Performance', () => {

    test('Homepage performance on different network speeds', async ({ page, context }) => {
      for (const network of NETWORK_CONDITIONS) {
        console.log(`\n🌐 Testing on ${network.name} network...`);

        // Set network conditions
        const cdpSession = await context.newCDPSession(page);
        await cdpSession.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: network.downloadThroughput,
          uploadThroughput: network.uploadThroughput,
          latency: network.latency
        });

        const startTime = performance.now();

        // Navigate to homepage
        await page.goto('/', { waitUntil: 'networkidle' });
        
        const loadTime = performance.now() - startTime;

        console.log(`  Load time on ${network.name}: ${loadTime.toFixed(0)}ms`);

        // Get performance metrics
        const metrics = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          return {
            loadComplete: navigation.loadEventEnd - navigation.fetchStart,
            TTFB: navigation.responseStart - navigation.fetchStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart
          };
        });

        // Network-specific performance expectations
        if (network.name === 'wifi') {
          expect(metrics.loadComplete).toBeLessThan(3000); // 3s on wifi
        } else if (network.name === 'fast-3g') {
          expect(metrics.loadComplete).toBeLessThan(5000); // 5s on fast 3G
        } else if (network.name === 'slow-3g') {
          expect(metrics.loadComplete).toBeLessThan(10000); // 10s on slow 3G
        }

        // TTFB should be reasonable even on slow networks
        expect(metrics.TTFB).toBeLessThan(network.latency * 3);
      }
    });

  });

  test.describe('Resource Loading Performance', () => {

    test('Image loading performance', async ({ page }) => {
      await page.goto('/');
      
      // Get image loading metrics
      const imageMetrics = await page.evaluate(() => {
        const images = Array.from(document.images);
        const imageData = images.map(img => ({
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          loading: img.loading
        }));

        const resourceEntries = performance.getEntriesByType('resource')
          .filter(entry => entry.name.match(/\.(jpg|jpeg|png|webp|svg|gif)$/i));

        return {
          totalImages: images.length,
          completeImages: images.filter(img => img.complete).length,
          imageResources: resourceEntries.map(entry => ({
            url: entry.name,
            size: entry.transferSize,
            loadTime: entry.responseEnd - entry.startTime
          }))
        };
      });

      console.log(`\n🖼️ Image Performance:`);
      console.log(`  Total images: ${imageMetrics.totalImages}`);
      console.log(`  Complete images: ${imageMetrics.completeImages}`);
      console.log(`  Image resources: ${imageMetrics.imageResources.length}`);

      // All images should eventually load
      expect(imageMetrics.completeImages).toBe(imageMetrics.totalImages);

      // Image resources should load in reasonable time
      imageMetrics.imageResources.forEach(resource => {
        expect(resource.loadTime).toBeLessThan(3000); // 3s max per image
        expect(resource.size).toBeLessThan(500 * 1024); // 500KB max per image
      });
    });

    test('JavaScript bundle performance', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const jsMetrics = await page.evaluate(() => {
        const jsResources = performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('.js'))
          .map(entry => ({
            url: entry.name.split('/').pop(),
            size: entry.transferSize,
            loadTime: entry.responseEnd - entry.startTime,
            cached: entry.transferSize === 0
          }));

        return {
          totalJSFiles: jsResources.length,
          totalJSSize: jsResources.reduce((acc, resource) => acc + resource.size, 0),
          jsResources: jsResources
        };
      });

      console.log(`\n📦 JavaScript Performance:`);
      console.log(`  Total JS files: ${jsMetrics.totalJSFiles}`);
      console.log(`  Total JS size: ${(jsMetrics.totalJSSize / 1024).toFixed(0)}KB`);

      // JavaScript bundle size should be reasonable
      expect(jsMetrics.totalJSSize).toBeLessThan(1024 * 1024); // Under 1MB total

      // Individual JS files shouldn't be too large
      jsMetrics.jsResources.forEach(resource => {
        if (resource.size > 0) { // Skip cached resources
          expect(resource.size).toBeLessThan(300 * 1024); // 300KB max per file
          expect(resource.loadTime).toBeLessThan(2000); // 2s max load time
        }
      });
    });

    test('CSS loading performance', async ({ page }) => {
      await page.goto('/');
      
      const cssMetrics = await page.evaluate(() => {
        const cssResources = performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('.css') || 
                          entry.initiatorType === 'css' ||
                          entry.name.includes('fonts.googleapis.com'))
          .map(entry => ({
            url: entry.name.split('/').pop(),
            size: entry.transferSize,
            loadTime: entry.responseEnd - entry.startTime
          }));

        return {
          totalCSSFiles: cssResources.length,
          totalCSSSize: cssResources.reduce((acc, resource) => acc + resource.size, 0),
          cssResources: cssResources
        };
      });

      console.log(`\n🎨 CSS Performance:`);
      console.log(`  Total CSS files: ${cssMetrics.totalCSSFiles}`);
      console.log(`  Total CSS size: ${(cssMetrics.totalCSSSize / 1024).toFixed(0)}KB`);

      // CSS should be reasonably sized
      expect(cssMetrics.totalCSSSize).toBeLessThan(200 * 1024); // Under 200KB total

      // CSS files should load quickly
      cssMetrics.cssResources.forEach(resource => {
        expect(resource.loadTime).toBeLessThan(1000); // 1s max load time
      });
    });

  });

  test.describe('Mobile Performance', () => {

    test('Mobile Core Web Vitals', async ({ page, browser }) => {
      // Create mobile context
      const mobileContext = await browser.newContext({
        ...browser.newContext().device('Pixel 5'),
        viewport: { width: 375, height: 667 }
      });
      
      const mobilePage = await mobileContext.newPage();
      
      // Test homepage on mobile
      await mobilePage.goto('/');
      await mobilePage.waitForLoadState('networkidle');

      const mobileMetrics = await mobilePage.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          LCP: window.performanceMetrics?.LCP || 0,
          CLS: window.performanceMetrics?.CLS || 0,
          FCP: performance.getEntriesByType('paint')
            .find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
          loadComplete: navigation.loadEventEnd - navigation.fetchStart,
          TTFB: navigation.responseStart - navigation.fetchStart
        };
      });

      console.log(`\n📱 Mobile Performance:`);
      console.log(`  Mobile LCP: ${mobileMetrics.LCP.toFixed(0)}ms`);
      console.log(`  Mobile CLS: ${mobileMetrics.CLS.toFixed(3)}`);
      console.log(`  Mobile FCP: ${mobileMetrics.FCP.toFixed(0)}ms`);

      // Mobile-specific performance expectations (slightly more lenient)
      expect(mobileMetrics.LCP).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP * 1.2); // 20% more lenient
      expect(mobileMetrics.CLS).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS);
      expect(mobileMetrics.FCP).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP * 1.2);
      expect(mobileMetrics.TTFB).toBeLessThan(PERFORMANCE_THRESHOLDS.TTFB);

      await mobileContext.close();
    });

  });

});