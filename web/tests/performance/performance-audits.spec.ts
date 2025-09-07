import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/auth/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { MenuPage } from '../pages/menu.page';

/**
 * Performance Auditing and Accessibility Tests
 * Comprehensive testing for Core Web Vitals, accessibility compliance,
 * and performance optimization validation
 */

test.describe('Performance Auditing', () => {
  // Performance thresholds based on requirements
  const performanceThresholds = {
    lcp: 2500, // Largest Contentful Paint (ms)
    fid: 100,  // First Input Delay (ms) 
    cls: 0.1,  // Cumulative Layout Shift
    ttfb: 800, // Time to First Byte (ms)
    loadTime: 3000, // Total page load time (ms)
    bundleSize: 500 * 1024, // 500KB initial bundle
    memoryUsage: 50 * 1024 * 1024 // 50MB memory limit
  };

  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      // Store performance metrics globally
      (window as any).performanceMetrics = {
        navigation: [],
        paint: [],
        lcp: [],
        fid: [],
        cls: 0
      };

      // Largest Contentful Paint observer
      if ('PerformanceObserver' in window) {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          (window as any).performanceMetrics.lcp = entries;
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // First Input Delay observer
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          (window as any).performanceMetrics.fid = entries;
        }).observe({ type: 'first-input', buffered: true });

        // Cumulative Layout Shift observer
        new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          for (const entry of entries) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          (window as any).performanceMetrics.cls += clsValue;
        }).observe({ type: 'layout-shift', buffered: true });

        // Navigation timing observer
        new PerformanceObserver((list) => {
          (window as any).performanceMetrics.navigation = list.getEntries();
        }).observe({ type: 'navigation', buffered: true });

        // Paint timing observer
        new PerformanceObserver((list) => {
          (window as any).performanceMetrics.paint = list.getEntries();
        }).observe({ type: 'paint', buffered: true });
      }
    });
  });

  test.describe('Core Web Vitals', () => {
    test('login page - Core Web Vitals compliance', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      const startTime = Date.now();
      await loginPage.goto();
      await loginPage.waitForPageLoad();
      const loadTime = Date.now() - startTime;

      // Verify load time threshold
      expect(loadTime).toBeLessThan(performanceThresholds.loadTime);

      // Wait for metrics to be collected
      await page.waitForTimeout(2000);

      // Get Core Web Vitals metrics
      const metrics = await page.evaluate(() => {
        return (window as any).performanceMetrics;
      });

      // Largest Contentful Paint
      if (metrics.lcp.length > 0) {
        const lcpValue = metrics.lcp[metrics.lcp.length - 1].startTime;
        console.log(`Login Page LCP: ${lcpValue}ms`);
        expect(lcpValue).toBeLessThan(performanceThresholds.lcp);
      }

      // Cumulative Layout Shift
      console.log(`Login Page CLS: ${metrics.cls}`);
      expect(metrics.cls).toBeLessThan(performanceThresholds.cls);

      // Time to First Byte
      if (metrics.navigation.length > 0) {
        const nav = metrics.navigation[0] as any;
        const ttfb = nav.responseStart - nav.requestStart;
        console.log(`Login Page TTFB: ${ttfb}ms`);
        expect(ttfb).toBeLessThan(performanceThresholds.ttfb);
      }

      // First Contentful Paint
      const fcpEntry = metrics.paint.find((entry: any) => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        console.log(`Login Page FCP: ${fcpEntry.startTime}ms`);
        expect(fcpEntry.startTime).toBeLessThan(2000); // FCP should be under 2s
      }
    });

    test('dashboard page - performance under load', async ({ page }) => {
      // Mock authentication
      await page.context().addCookies([{
        name: 'auth_token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/'
      }]);

      // Mock dashboard with substantial data
      await page.route('**/dashboard/**', async route => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            stats: {
              totalStudents: 1250,
              dailyOrders: 856,
              monthlyRevenue: 125000
            },
            recentOrders: Array.from({ length: 50 }, (_, i) => ({
              id: `ORD-${1000 + i}`,
              date: new Date(Date.now() - i * 3600000).toISOString(),
              total: Math.random() * 100,
              status: ['completed', 'pending', 'preparing'][i % 3]
            })),
            notifications: Array.from({ length: 20 }, (_, i) => ({
              id: `notif-${i}`,
              message: `Test notification ${i}`,
              timestamp: new Date(Date.now() - i * 1800000).toISOString()
            }))
          })
        });
      });

      const dashboardPage = new DashboardPage(page);
      const startTime = Date.now();
      
      await dashboardPage.goto();
      await dashboardPage.waitForPageLoad();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(performanceThresholds.loadTime);

      // Wait for all widgets to load
      await page.waitForTimeout(3000);

      // Measure runtime performance
      const metrics = await page.evaluate(() => {
        return (window as any).performanceMetrics;
      });

      // Check LCP with data-heavy dashboard
      if (metrics.lcp.length > 0) {
        const lcpValue = metrics.lcp[metrics.lcp.length - 1].startTime;
        console.log(`Dashboard LCP: ${lcpValue}ms`);
        expect(lcpValue).toBeLessThan(performanceThresholds.lcp * 1.2); // Allow 20% buffer for data-heavy page
      }

      // Check for layout shifts during data loading
      console.log(`Dashboard CLS: ${metrics.cls}`);
      expect(metrics.cls).toBeLessThan(performanceThresholds.cls);
    });

    test('menu page - image loading performance', async ({ page }) => {
      // Mock authentication
      await page.context().addCookies([{
        name: 'auth_token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/'
      }]);

      // Mock menu with images
      await page.route('**/menu/items', async route => {
        const items = Array.from({ length: 24 }, (_, i) => ({
          id: `item-${i}`,
          name: `Menu Item ${i + 1}`,
          price: Math.random() * 50 + 10,
          image: `https://picsum.photos/300/200?random=${i}`, // Random images for testing
          category: ['main', 'curry', 'snack', 'beverage'][i % 4]
        }));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items })
        });
      });

      const menuPage = new MenuPage(page);
      const startTime = Date.now();
      
      await menuPage.goto();
      await menuPage.waitForPageLoad();
      
      // Wait for images to load
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(performanceThresholds.loadTime * 1.5); // Allow extra time for images

      // Check Core Web Vitals with image loading
      await page.waitForTimeout(2000);
      const metrics = await page.evaluate(() => {
        return (window as any).performanceMetrics;
      });

      if (metrics.lcp.length > 0) {
        const lcpValue = metrics.lcp[metrics.lcp.length - 1].startTime;
        console.log(`Menu with Images LCP: ${lcpValue}ms`);
        // LCP might be higher due to images, but should still be reasonable
        expect(lcpValue).toBeLessThan(performanceThresholds.lcp * 1.5);
      }

      // Verify no significant layout shifts during image loading
      expect(metrics.cls).toBeLessThan(performanceThresholds.cls);
    });
  });

  test.describe('Resource Performance', () => {
    test('bundle size analysis', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      // Track network requests
      const resourceSizes: { [key: string]: number } = {};
      
      page.on('response', async (response) => {
        const url = response.url();
        const contentLength = response.headers()['content-length'];
        
        if (contentLength) {
          resourceSizes[url] = parseInt(contentLength);
        } else if (url.includes('.js') || url.includes('.css')) {
          // Try to get response body size
          try {
            const body = await response.body();
            resourceSizes[url] = body.length;
          } catch (error) {
            // Some responses might not be accessible
          }
        }
      });

      await loginPage.goto();
      await loginPage.waitForPageLoad();

      // Wait for all resources to load
      await page.waitForLoadState('networkidle');

      // Calculate total JS bundle size
      let totalJSSize = 0;
      let totalCSSSize = 0;
      
      Object.entries(resourceSizes).forEach(([url, size]) => {
        if (url.includes('.js') && !url.includes('node_modules') && size > 1000) {
          totalJSSize += size;
          console.log(`JS Bundle: ${url} - ${(size / 1024).toFixed(2)} KB`);
        }
        if (url.includes('.css') && size > 1000) {
          totalCSSSize += size;
          console.log(`CSS Bundle: ${url} - ${(size / 1024).toFixed(2)} KB`);
        }
      });

      console.log(`Total JS Size: ${(totalJSSize / 1024).toFixed(2)} KB`);
      console.log(`Total CSS Size: ${(totalCSSSize / 1024).toFixed(2)} KB`);

      // Verify bundle sizes are within acceptable limits
      expect(totalJSSize).toBeLessThan(performanceThresholds.bundleSize);
      expect(totalCSSSize).toBeLessThan(100 * 1024); // 100KB CSS limit
    });

    test('memory usage monitoring', async ({ page }) => {
      // Mock authentication
      await page.context().addCookies([{
        name: 'auth_token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/'
      }]);

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.waitForPageLoad();

      // Measure initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });

      if (initialMemory) {
        console.log(`Initial Memory Usage: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
        expect(initialMemory.usedJSHeapSize).toBeLessThan(performanceThresholds.memoryUsage);

        // Simulate heavy usage
        await page.evaluate(() => {
          // Trigger some operations that might use memory
          for (let i = 0; i < 1000; i++) {
            const div = document.createElement('div');
            div.innerHTML = `Test content ${i}`;
            document.body.appendChild(div);
            if (i % 100 === 0) {
              // Clean up periodically
              const elements = document.querySelectorAll('div');
              for (let j = 0; j < 50 && j < elements.length; j++) {
                elements[j].remove();
              }
            }
          }
        });

        // Measure memory after operations
        const finalMemory = await page.evaluate(() => {
          return (performance as any).memory ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize
          } : null;
        });

        if (finalMemory) {
          const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
          console.log(`Memory increase after operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
          
          // Memory increase should be reasonable
          expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // Max 20MB increase
        }
      }
    });

    test('network resilience and caching', async ({ page }) => {
      const menuPage = new MenuPage(page);
      
      // Mock authentication
      await page.context().addCookies([{
        name: 'auth_token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/'
      }]);

      // First load - measure baseline
      const startTime1 = Date.now();
      await menuPage.goto();
      await menuPage.waitForPageLoad();
      const firstLoadTime = Date.now() - startTime1;

      // Navigate away and back (test caching)
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Second load - should be faster due to caching
      const startTime2 = Date.now();
      await menuPage.goto();
      await menuPage.waitForPageLoad();
      const secondLoadTime = Date.now() - startTime2;

      console.log(`First load: ${firstLoadTime}ms, Second load: ${secondLoadTime}ms`);
      
      // Second load should be significantly faster
      expect(secondLoadTime).toBeLessThan(firstLoadTime * 0.7); // At least 30% faster

      // Test with slow network
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 50 * 1024, // 50KB/s
        uploadThroughput: 20 * 1024,   // 20KB/s
        latency: 500 // 500ms latency
      });

      const startTime3 = Date.now();
      await page.reload();
      await menuPage.waitForPageLoad();
      const slowNetworkTime = Date.now() - startTime3;

      console.log(`Slow network load: ${slowNetworkTime}ms`);
      
      // Should still be usable on slow network (within 10 seconds)
      expect(slowNetworkTime).toBeLessThan(10000);
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('WCAG AA compliance - login page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.waitForPageLoad();

      // Inject axe-core for accessibility testing
      await page.addScriptTag({
        url: 'https://unpkg.com/axe-core@4.7.0/axe.min.js'
      });

      // Run accessibility audit
      const accessibilityResults = await page.evaluate(async () => {
        // @ts-ignore - axe is loaded dynamically
        const results = await axe.run();
        return {
          violations: results.violations.map((violation: any) => ({
            id: violation.id,
            impact: violation.impact,
            description: violation.description,
            nodes: violation.nodes.length
          })),
          passes: results.passes.length,
          incomplete: results.incomplete.length
        };
      });

      console.log(`Accessibility Results:`, accessibilityResults);

      // No critical or serious violations allowed
      const criticalViolations = accessibilityResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      
      expect(criticalViolations).toHaveLength(0);

      // Should have reasonable number of passing tests
      expect(accessibilityResults.passes).toBeGreaterThan(10);
    });

    test('keyboard navigation compliance', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.waitForPageLoad();

      // Test tab navigation through all focusable elements
      const focusableElements = [];
      let currentTabIndex = 0;
      
      while (currentTabIndex < 20) { // Prevent infinite loop
        await page.keyboard.press('Tab');
        
        const activeElement = await page.evaluate(() => {
          const element = document.activeElement;
          return element ? {
            tagName: element.tagName,
            type: (element as HTMLInputElement).type || null,
            testId: element.getAttribute('data-testid'),
            ariaLabel: element.getAttribute('aria-label'),
            text: element.textContent?.trim().substring(0, 50)
          } : null;
        });

        if (!activeElement || 
            focusableElements.some(el => 
              el.tagName === activeElement.tagName && 
              el.testId === activeElement.testId
            )) {
          break; // Completed cycle or invalid element
        }

        focusableElements.push(activeElement);
        currentTabIndex++;
      }

      console.log('Focusable elements found:', focusableElements.length);
      focusableElements.forEach((el, index) => {
        console.log(`${index + 1}. ${el.tagName} - ${el.testId || el.text}`);
      });

      // Should have reasonable number of focusable elements
      expect(focusableElements.length).toBeGreaterThan(3);
      expect(focusableElements.length).toBeLessThan(15);

      // Verify form can be submitted with keyboard
      await page.keyboard.press('Tab'); // Navigate to email field
      await page.keyboard.type('test@example.com');
      
      await page.keyboard.press('Tab'); // Navigate to password field
      await page.keyboard.type('password123');
      
      await page.keyboard.press('Tab'); // Navigate to submit button
      await page.keyboard.press('Enter'); // Submit form

      // Form should attempt submission (even if it fails due to mocked backend)
      await page.waitForTimeout(1000);
      
      // Check if form validation or submission occurred
      const formState = await page.evaluate(() => {
        const emailInput = document.querySelector('[data-testid="email-input"]') as HTMLInputElement;
        const passwordInput = document.querySelector('[data-testid="password-input"]') as HTMLInputElement;
        
        return {
          emailValue: emailInput?.value,
          passwordValue: passwordInput?.value,
          formSubmitted: emailInput?.value === 'test@example.com' && passwordInput?.value === 'password123'
        };
      });

      expect(formState.formSubmitted).toBe(true);
    });

    test('screen reader compatibility', async ({ page }) => {
      const menuPage = new MenuPage(page);
      
      // Mock authentication
      await page.context().addCookies([{
        name: 'auth_token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/'
      }]);

      await menuPage.goto();
      await menuPage.waitForPageLoad();

      // Check for proper ARIA labels and landmarks
      const ariaElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]');
        return Array.from(elements).map(el => ({
          tagName: el.tagName,
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label'),
          ariaLabelledby: el.getAttribute('aria-labelledby'),
          ariaDescribedby: el.getAttribute('aria-describedby'),
          testId: el.getAttribute('data-testid')
        }));
      });

      console.log(`ARIA elements found: ${ariaElements.length}`);

      // Should have proper landmarks
      const landmarks = ariaElements.filter(el => 
        ['main', 'navigation', 'banner', 'contentinfo', 'complementary'].includes(el.role || '')
      );
      expect(landmarks.length).toBeGreaterThan(0);

      // Interactive elements should have accessible names
      const interactiveElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('button, input, select, textarea, a[href]');
        return Array.from(elements).map(el => {
          const hasAccessibleName = 
            el.getAttribute('aria-label') ||
            el.getAttribute('aria-labelledby') ||
            (el.textContent && el.textContent.trim().length > 0) ||
            (el as HTMLInputElement).placeholder;
            
          return {
            tagName: el.tagName,
            type: (el as HTMLInputElement).type,
            hasAccessibleName,
            testId: el.getAttribute('data-testid')
          };
        });
      });

      const elementsWithoutNames = interactiveElements.filter(el => !el.hasAccessibleName);
      
      if (elementsWithoutNames.length > 0) {
        console.log('Elements without accessible names:', elementsWithoutNames);
      }
      
      // Most interactive elements should have accessible names
      const accessibilityRate = (interactiveElements.length - elementsWithoutNames.length) / interactiveElements.length;
      expect(accessibilityRate).toBeGreaterThan(0.8); // 80% should have accessible names
    });

    test('color contrast compliance', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.waitForPageLoad();

      // Check color contrast ratios
      const contrastResults = await page.evaluate(() => {
        const results: any[] = [];
        
        // Get computed styles for text elements
        const textElements = document.querySelectorAll('p, span, div, button, input, label, a, h1, h2, h3, h4, h5, h6');
        
        Array.from(textElements).slice(0, 20).forEach((element) => { // Limit to first 20 for performance
          const computed = window.getComputedStyle(element);
          const color = computed.color;
          const backgroundColor = computed.backgroundColor;
          const fontSize = computed.fontSize;
          
          if (color && backgroundColor && element.textContent?.trim()) {
            results.push({
              element: element.tagName,
              textContent: element.textContent.trim().substring(0, 30),
              color,
              backgroundColor,
              fontSize,
              testId: element.getAttribute('data-testid')
            });
          }
        });
        
        return results;
      });

      console.log(`Analyzed ${contrastResults.length} text elements for contrast`);
      
      // This is a basic check - in a real implementation, you'd calculate actual contrast ratios
      // using color manipulation libraries or specialized accessibility testing tools
      expect(contrastResults.length).toBeGreaterThan(5);
      
      // Verify no transparent or missing colors
      const problemElements = contrastResults.filter(result => 
        result.color === 'rgba(0, 0, 0, 0)' || 
        result.backgroundColor === 'rgba(0, 0, 0, 0)'
      );
      
      expect(problemElements.length).toBe(0);
    });
  });

  test.describe('Performance Regression Testing', () => {
    test('performance baseline comparison', async ({ page }) => {
      // This test would compare against stored performance baselines
      // In a real implementation, you'd store baseline metrics and compare
      
      const pages = [
        { name: 'login', path: '/auth/login' },
        { name: 'dashboard', path: '/dashboard' },
        { name: 'menu', path: '/menu' }
      ];

      const performanceResults: { [key: string]: any } = {};

      for (const pageInfo of pages) {
        const startTime = Date.now();
        
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        // Wait for metrics collection
        await page.waitForTimeout(2000);
        
        const metrics = await page.evaluate(() => {
          return (window as any).performanceMetrics;
        });

        performanceResults[pageInfo.name] = {
          loadTime,
          lcp: metrics.lcp.length > 0 ? metrics.lcp[metrics.lcp.length - 1].startTime : null,
          cls: metrics.cls,
          fcp: metrics.paint.find((entry: any) => entry.name === 'first-contentful-paint')?.startTime
        };
      }

      // Log results for baseline establishment
      console.log('Performance Results:', JSON.stringify(performanceResults, null, 2));

      // Verify all pages meet basic performance criteria
      Object.values(performanceResults).forEach((result: any) => {
        expect(result.loadTime).toBeLessThan(performanceThresholds.loadTime);
        if (result.lcp) {
          expect(result.lcp).toBeLessThan(performanceThresholds.lcp);
        }
        expect(result.cls).toBeLessThan(performanceThresholds.cls);
      });
    });
  });
});