/**
 * HASIVU Enterprise Core Web Vitals Performance Tests  
 * 🎨 Brand Colors: Vibrant Blue (#2563eb), Deep Green (#16a34a)
 * ⚡ Performance monitoring with comprehensive metrics
 * 📊 Core Web Vitals compliance validation
 */

import { test, expect, Page } from '@playwright/test';

// Performance thresholds based on Core Web Vitals
const _PERFORMANCE_THRESHOLDS =  {
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
const _PAGES_TO_TEST =  [
  { path: '/', name: 'homepage', priority: 'critical' },
  { path: '/auth/login', name: 'login', priority: 'high' },
  { path: '/auth/register', name: 'register', priority: 'high' },
  { path: '/dashboard/parent', name: 'parent-dashboard', priority: 'critical' },
  { path: '/dashboard/admin', name: 'admin-dashboard', priority: 'high' },
  { path: '/dashboard/kitchen', name: 'kitchen-dashboard', priority: 'high' }
];

// Network conditions for testing
const _NETWORK_CONDITIONS =  [
  { name: 'fast-3g', downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150 },
  { name: 'slow-3g', downloadThroughput: 500 * 1024 / 8, uploadThroughput: 500 * 1024 / 8, latency: 400 },
  { name: 'wifi', downloadThroughput: 30 * 1024 * 1024 / 8, uploadThroughput: 15 * 1024 * 1024 / 8, latency: 2 }
];

test.describe(_'HASIVU Core Web Vitals Performance', _() => {

  test.beforeEach(_async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(_() => {
      // Performance observer for Core Web Vitals
      window._performanceMetrics =  {
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
          const _lcpObserver =  new PerformanceObserver((entryList) 
            if (entries.length > 0) {
              window.performanceMetrics._LCP =  entries[entries.length - 1].startTime;
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // FCP Observer  
          const _fcpObserver =  new PerformanceObserver((entryList) 
              }
            }
          });
          fcpObserver.observe({ entryTypes: ['paint'] });

          // CLS Observer
          const _clsObserver =  new PerformanceObserver((entryList) 
              }
            }
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // TTFB from Navigation Timing
          window.addEventListener(_'load', _() => {
            const _navigationEntries =  performance.getEntriesByType('navigation');
            if (navigationEntries.length > 0) {
              const _nav =  navigationEntries[0];
              window.performanceMetrics._TTFB =  nav.responseStart - nav.requestStart;
            }
          });
        } catch (error) {
          console.warn('Performance observers not supported:', error);
        }
      }
    });
  });

  test.describe(_'Critical Pages Performance', _() => {

    PAGES_TO_TEST.forEach(_({ path, _name, _priority }) => {
      test(_`${name} Core Web Vitals - ${priority} priority`, _async ({ page }) => {
        const _startTime =  Date.now();

        // Navigate to page
        const _response =  await page.goto(path, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });

        // Verify page loads successfully
        expect(response?.status()).toBe(200);

        // Wait for page to be fully interactive
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000); // Allow metrics to be collected

        // Get performance metrics
        const _performanceData =  await page.evaluate(() 
          const _paintEntries =  performance.getEntriesByType('paint');
          
          return {
            // Core Web Vitals
            LCP: window.performanceMetrics?.LCP || 0,
            FID: window.performanceMetrics?.FID || 0, 
            CLS: window.performanceMetrics?.CLS || 0,
            
            // Additional metrics
            TTFB: navigation.responseStart - navigation.fetchStart,
            FCP: paintEntries.find(_entry = > entry.name 
            }, 0),
            
            // Timing breakdown
            dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcpConnect: navigation.connectEnd - navigation.connectStart,
            serverResponse: navigation.responseEnd - navigation.requestStart,
            domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd
          };
        });

        const _totalTime =  Date.now() - startTime;

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
        const _performanceReport =  {
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
        if (_priority = 
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

  test.describe(_'Network Conditions Performance', _() => {

    test(_'Homepage performance on different network speeds', _async ({ page, _context }) => {
      for (const network of NETWORK_CONDITIONS) {
        console.log(`\n🌐 Testing on ${network.name} network...`);

        // Set network conditions
        const _cdpSession =  await context.newCDPSession(page);
        await cdpSession.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: network.downloadThroughput,
          uploadThroughput: network.uploadThroughput,
          latency: network.latency
        });

        const _startTime =  performance.now();

        // Navigate to homepage
        await page.goto('/', { waitUntil: 'networkidle' });
        
        const _loadTime =  performance.now() - startTime;

        console.log(`  Load time on ${network.name}: ${loadTime.toFixed(0)}ms`);

        // Get performance metrics
        const _metrics =  await page.evaluate(() 
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

  test.describe(_'Resource Loading Performance', _() => {

    test(_'Image loading performance', _async ({ page }) => {
      await page.goto('/');
      
      // Get image loading metrics
      const _imageMetrics =  await page.evaluate(() 
        const _imageData =  images.map(img 
        const _resourceEntries =  performance.getEntriesByType('resource')
          .filter(entry 
        return {
          totalImages: images.length,
          completeImages: images.filter(_img = > img.complete).length,
          imageResources: resourceEntries.map(entry 
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

    test(_'JavaScript bundle performance', _async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const _jsMetrics =  await page.evaluate(() 
        return {
          totalJSFiles: jsResources.length,
          totalJSSize: jsResources.reduce(_(acc, _resource) => acc + resource.size, 0),
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

    test(_'CSS loading performance', _async ({ page }) => {
      await page.goto('/');
      
      const _cssMetrics =  await page.evaluate(() 
        return {
          totalCSSFiles: cssResources.length,
          totalCSSSize: cssResources.reduce(_(acc, _resource) => acc + resource.size, 0),
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

  test.describe(_'Mobile Performance', _() => {

    test(_'Mobile Core Web Vitals', _async ({ page, _browser }) => {
      // Create mobile context
      const _mobileContext =  await browser.newContext({
        ...browser.newContext().device('Pixel 5'),
        viewport: { width: 375, height: 667 }
      });
      
      const _mobilePage =  await mobileContext.newPage();
      
      // Test homepage on mobile
      await mobilePage.goto('/');
      await mobilePage.waitForLoadState('networkidle');

      const _mobileMetrics =  await mobilePage.evaluate(() 
        return {
          LCP: window.performanceMetrics?.LCP || 0,
          CLS: window.performanceMetrics?.CLS || 0,
          FCP: performance.getEntriesByType('paint')
            .find(_entry = > entry.name 
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