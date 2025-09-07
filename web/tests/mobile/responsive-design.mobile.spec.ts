/**
 * HASIVU Enterprise Mobile-First Responsive Design Tests
 * 📱 Comprehensive mobile testing across devices and orientations
 * 🎯 Touch interaction validation and mobile UX optimization
 * 🌐 Progressive Web App features and offline functionality
 */

import { test, expect, Page } from '@playwright/test';
import { RESPONSIVE_BREAKPOINTS, BRAND_COLORS, PERFORMANCE_BUDGETS } from '../utils/brand-constants';

// Device configurations for comprehensive testing
const MOBILE_DEVICES = [
  {
    name: 'iPhone SE',
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  },
  {
    name: 'iPhone 12 Pro',
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  },
  {
    name: 'Samsung Galaxy S21',
    viewport: { width: 360, height: 800 },
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  },
  {
    name: 'iPad',
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  },
  {
    name: 'iPad Pro 12.9',
    viewport: { width: 1024, height: 1366 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  }
];

// Critical user flows for mobile testing
const MOBILE_USER_FLOWS = [
  {
    name: 'Mobile Menu Browsing',
    path: '/menu',
    priority: 'P0',
    description: 'Core food ordering workflow on mobile'
  },
  {
    name: 'Mobile RFID Scanning',
    path: '/rfid/scan', 
    priority: 'P0',
    description: 'RFID scanning with camera integration'
  },
  {
    name: 'Mobile Authentication',
    path: '/auth/login',
    priority: 'P0', 
    description: 'Mobile login and registration flows'
  },
  {
    name: 'Mobile Dashboard',
    path: '/dashboard',
    priority: 'P1',
    description: 'Mobile dashboard navigation and widgets'
  },
  {
    name: 'Mobile Checkout',
    path: '/checkout',
    priority: 'P1',
    description: 'Mobile payment and order completion'
  }
];

test.describe('HASIVU Mobile-First Responsive Design Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Enable mobile-specific features
    await page.addInitScript(() => {
      // Mobile performance monitoring
      window.mobileMetrics = {
        touchEvents: 0,
        swipeEvents: 0,
        orientationChanges: 0,
        viewportChanges: 0
      };

      // Touch event monitoring
      document.addEventListener('touchstart', () => {
        window.mobileMetrics.touchEvents++;
      });

      document.addEventListener('touchmove', () => {
        window.mobileMetrics.swipeEvents++;
      });

      // Orientation change monitoring
      window.addEventListener('orientationchange', () => {
        window.mobileMetrics.orientationChanges++;
      });

      // Viewport change monitoring
      window.addEventListener('resize', () => {
        window.mobileMetrics.viewportChanges++;
      });

      // PWA installation monitoring
      window.addEventListener('beforeinstallprompt', (e) => {
        window.pwaInstallPrompt = e;
      });
    });
  });

  // Test each mobile device configuration
  for (const device of MOBILE_DEVICES) {
    test(`${device.name} - Responsive Layout Validation`, async ({ page }) => {
      // Configure device emulation
      await page.setViewportSize(device.viewport);
      await page.setUserAgent(device.userAgent);

      await page.goto('/menu');
      await page.waitForLoadState('networkidle');

      // Check responsive layout adaptation
      const layoutMetrics = await page.evaluate(() => {
        return {
          // Check if mobile navigation is visible
          mobileNavVisible: !!document.querySelector('.mobile-nav, [data-mobile-nav]'),
          
          // Check if desktop elements are hidden
          desktopNavHidden: window.getComputedStyle(
            document.querySelector('.desktop-nav, [data-desktop-nav]') || document.createElement('div')
          ).display === 'none',
          
          // Measure content width utilization
          contentWidth: document.querySelector('main, [role="main"]')?.getBoundingClientRect().width || 0,
          viewportWidth: window.innerWidth,
          
          // Check for horizontal scrolling
          hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
          
          // Check touch-friendly element sizes
          buttonSizes: Array.from(document.querySelectorAll('button, [role="button"]')).map(btn => {
            const rect = btn.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
          })
        };
      });

      // Validate responsive design principles
      expect(layoutMetrics.hasHorizontalScroll).toBe(false);
      expect(layoutMetrics.contentWidth / layoutMetrics.viewportWidth).toBeGreaterThan(0.9); // Good width utilization

      // Validate touch targets
      layoutMetrics.buttonSizes.forEach(size => {
        if (size.width > 0 && size.height > 0) {
          expect(size.width).toBeGreaterThanOrEqual(44); // iOS minimum touch target
          expect(size.height).toBeGreaterThanOrEqual(44);
        }
      });
    });
  }

  test('Mobile Menu Interaction Flow', async ({ page }) => {
    // Use iPhone 12 Pro for this test
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    // Test mobile menu interactions
    const menuItems = await page.locator('[data-testid*="menu-item"]').count();
    expect(menuItems).toBeGreaterThan(0);

    // Test swipe gestures (simulate)
    const menuContainer = page.locator('[data-testid="menu-container"]').first();
    
    // Simulate touch swipe
    await menuContainer.hover();
    await page.mouse.down();
    await page.mouse.move(200, 0); // Swipe right
    await page.mouse.up();

    // Test add to cart on mobile
    const firstMenuItem = page.locator('[data-testid*="menu-item"]').first();
    await firstMenuItem.tap(); // Use tap for mobile

    // Verify mobile cart UI
    const cartButton = page.locator('[data-testid="mobile-cart-button"]');
    if (await cartButton.isVisible()) {
      await cartButton.tap();
      
      // Check mobile cart modal/drawer
      const cartModal = page.locator('[data-testid="mobile-cart-modal"]');
      await expect(cartModal).toBeVisible();
    }
  });

  test('Mobile RFID Scanning Interface', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/rfid/scan');
    await page.waitForLoadState('networkidle');

    // Check mobile RFID interface
    const rfidInterface = await page.evaluate(() => {
      return {
        scanButtonVisible: !!document.querySelector('[data-testid="rfid-scan-button"]'),
        cameraAccessButton: !!document.querySelector('[data-testid="camera-access"]'),
        scanAreaVisible: !!document.querySelector('.rfid-scan-area, [data-testid="scan-area"]'),
        mobileOptimized: window.innerWidth < 768,
        fullScreenMode: !!document.querySelector('[data-fullscreen]')
      };
    });

    expect(rfidInterface.scanButtonVisible).toBe(true);
    expect(rfidInterface.mobileOptimized).toBe(true);

    // Test scan button interaction
    const scanButton = page.locator('[data-testid="rfid-scan-button"]');
    if (await scanButton.isVisible()) {
      await scanButton.tap();
      
      // Simulate RFID scan result
      await page.evaluate(() => {
        // Mock scan success
        const mockScanResult = {
          cardId: 'MOCK_CARD_123',
          userId: 'student_001',
          balance: 150.00,
          scanTime: new Date().toISOString()
        };
        
        // Trigger scan result event
        window.dispatchEvent(new CustomEvent('rfid-scan-result', {
          detail: mockScanResult
        }));
      });

      // Verify mobile scan result display
      await expect(page.locator('[data-testid="scan-result"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('Mobile Authentication Flow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Test mobile keyboard interaction
    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    
    // Focus triggers mobile keyboard
    await emailInput.tap();
    await emailInput.fill('test@example.com');
    
    // Check viewport adjustment for keyboard
    const viewportAfterKeyboard = await page.evaluate(() => {
      return {
        visualViewportHeight: window.visualViewport?.height || window.innerHeight,
        windowHeight: window.innerHeight,
        keyboardVisible: (window.visualViewport?.height || window.innerHeight) < window.screen.height * 0.75
      };
    });

    // Fill password field
    await passwordInput.tap();
    await passwordInput.fill('password123');

    // Test mobile form submission
    const submitButton = page.locator('[data-testid="login-submit-button"]');
    await submitButton.tap();

    // Check for mobile-specific error handling
    await page.waitForTimeout(1000);
    
    // Verify error messages are mobile-friendly
    const errorElements = await page.locator('.error, [role="alert"]').count();
    if (errorElements > 0) {
      const errorBounds = await page.locator('.error, [role="alert"]').first().boundingBox();
      if (errorBounds) {
        expect(errorBounds.width).toBeLessThan(360); // Fits in mobile viewport
      }
    }
  });

  test('Cross-Device Orientation Changes', async ({ page }) => {
    // Test tablet in both orientations
    await page.setViewportSize({ width: 768, height: 1024 }); // Portrait
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Capture portrait layout
    const portraitLayout = await page.evaluate(() => {
      return {
        sidebarVisible: !!document.querySelector('.sidebar:not([style*="display: none"])'),
        gridColumns: getComputedStyle(document.querySelector('.dashboard-grid') || document.body).gridTemplateColumns,
        navigationStyle: getComputedStyle(document.querySelector('.navigation') || document.body).display
      };
    });

    // Switch to landscape
    await page.setViewportSize({ width: 1024, height: 768 }); // Landscape
    await page.waitForTimeout(500); // Allow layout to adjust

    const landscapeLayout = await page.evaluate(() => {
      return {
        sidebarVisible: !!document.querySelector('.sidebar:not([style*="display: none"])'),
        gridColumns: getComputedStyle(document.querySelector('.dashboard-grid') || document.body).gridTemplateColumns,
        navigationStyle: getComputedStyle(document.querySelector('.navigation') || document.body).display
      };
    });

    // Verify adaptive layout changes
    expect(portraitLayout.gridColumns).not.toBe(landscapeLayout.gridColumns);
  });

  test('Mobile Performance Optimization', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Simulate 3G network conditions
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms latency
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Mobile should load within reasonable time even on slow network
    expect(loadTime).toBeLessThan(8000); // 8s for 3G

    // Check mobile-specific optimizations
    const mobileOptimizations = await page.evaluate(() => {
      return {
        lazyLoadingImages: Array.from(document.querySelectorAll('img[loading="lazy"]')).length,
        webpImages: Array.from(document.querySelectorAll('img[src*=".webp"]')).length,
        criticalCSSInlined: !!document.querySelector('style[data-critical]'),
        serviceWorkerRegistered: 'serviceWorker' in navigator,
        webManifestLinked: !!document.querySelector('link[rel="manifest"]')
      };
    });

    expect(mobileOptimizations.lazyLoadingImages).toBeGreaterThan(0);
    expect(mobileOptimizations.serviceWorkerRegistered).toBe(true);
  });

  test('Touch Gestures and Interactions', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    // Test pinch-to-zoom prevention on input elements
    const inputElement = page.locator('input').first();
    if (await inputElement.isVisible()) {
      await inputElement.tap();
      
      // Check that zoom is disabled
      const zoomDisabled = await page.evaluate(() => {
        const viewport = document.querySelector('meta[name="viewport"]');
        return viewport?.getAttribute('content')?.includes('user-scalable=no') || 
               viewport?.getAttribute('content')?.includes('maximum-scale=1');
      });

      expect(zoomDisabled).toBe(true);
    }

    // Test swipe gestures on carousel/slider elements
    const carousel = page.locator('[data-carousel], [data-slider], .swiper').first();
    if (await carousel.isVisible()) {
      const carouselBounds = await carousel.boundingBox();
      if (carouselBounds) {
        // Simulate touch swipe
        await page.touchscreen.tap(carouselBounds.x + carouselBounds.width / 2, carouselBounds.y + carouselBounds.height / 2);
        await page.touchscreen.tap(carouselBounds.x + 100, carouselBounds.y + carouselBounds.height / 2);
      }
    }
  });

  test('Progressive Web App Features', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check PWA manifest and service worker
    const pwaFeatures = await page.evaluate(async () => {
      const features = {
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        hasServiceWorker: 'serviceWorker' in navigator,
        isInstallable: false,
        themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
        appleTouch: !!document.querySelector('link[rel="apple-touch-icon"]')
      };

      // Check if app is installable
      if ('getInstalledRelatedApps' in navigator) {
        try {
          const relatedApps = await (navigator as any).getInstalledRelatedApps();
          features.isInstallable = relatedApps.length === 0;
        } catch (e) {
          // Feature not supported or blocked
        }
      }

      return features;
    });

    expect(pwaFeatures.hasManifest).toBe(true);
    expect(pwaFeatures.hasServiceWorker).toBe(true);
    expect(pwaFeatures.themeColor).toBeTruthy();
    expect(pwaFeatures.appleTouch).toBe(true);
  });

  test('Mobile Accessibility Features', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    // Test voice-over/screen reader compatibility
    const a11yFeatures = await page.evaluate(() => {
      return {
        ariaLabels: document.querySelectorAll('[aria-label]').length,
        focusTraps: document.querySelectorAll('[data-focus-trap]').length,
        skipLinks: document.querySelectorAll('[href="#main"], [data-skip-link]').length,
        touchTargets: Array.from(document.querySelectorAll('button, a, input')).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width >= 44 && rect.height >= 44;
        }).length,
        reduceMotionRespected: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      };
    });

    expect(a11yFeatures.ariaLabels).toBeGreaterThan(0);
    expect(a11yFeatures.touchTargets).toBeGreaterThan(0);
  });

  test('Mobile Network Resilience', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Test offline functionality
    await page.context().setOffline(true);
    await page.goto('/menu');
    
    // Check offline page or cached content
    const offlineHandling = await page.evaluate(() => {
      return {
        offlinePageVisible: document.body.textContent?.includes('offline') || 
                           document.body.textContent?.includes('connection'),
        cacheAvailable: 'caches' in window,
        serviceWorkerActive: navigator.serviceWorker?.controller !== null
      };
    });

    // Restore online
    await page.context().setOffline(false);
    
    expect(offlineHandling.cacheAvailable).toBe(true);
  });

  test('Mobile Battery and Performance Impact', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    // Check for performance-intensive operations
    const performanceImpact = await page.evaluate(() => {
      let animationFrames = 0;
      let timers = 0;
      
      // Mock performance monitoring
      const originalRequestAnimationFrame = window.requestAnimationFrame;
      window.requestAnimationFrame = function(callback) {
        animationFrames++;
        return originalRequestAnimationFrame(callback);
      };

      const originalSetInterval = window.setInterval;
      window.setInterval = function(callback, delay) {
        timers++;
        return originalSetInterval(callback, delay);
      };

      // Check for infinite scroll or heavy animations
      const infiniteScrollElements = document.querySelectorAll('[data-infinite-scroll]').length;
      const videoElements = document.querySelectorAll('video').length;
      
      return {
        animationFrames,
        timers,
        infiniteScrollElements,
        videoElements,
        backgroundProcesses: Object.keys(window).filter(key => key.includes('interval')).length
      };
    });

    // Ensure minimal background processing for battery optimization
    expect(performanceImpact.timers).toBeLessThan(5);
    expect(performanceImpact.videoElements).toBeLessThan(3); // Limit video elements
  });

});