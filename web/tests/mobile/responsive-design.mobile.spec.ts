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
const _MOBILE_USER_FLOWS =  [
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

test.describe(_'HASIVU Mobile-First Responsive Design Suite', _() => {

  test.beforeEach(_async ({ page }) => {
    // Enable mobile-specific features
    await page.addInitScript(_() => {
      // Mobile performance monitoring
      window._mobileMetrics =  {
        touchEvents: 0,
        swipeEvents: 0,
        orientationChanges: 0,
        viewportChanges: 0
      };

      // Touch event monitoring
      document.addEventListener(_'touchstart', _() => {
        window.mobileMetrics.touchEvents++;
      });

      document.addEventListener(_'touchmove', _() => {
        window.mobileMetrics.swipeEvents++;
      });

      // Orientation change monitoring
      window.addEventListener(_'orientationchange', _() => {
        window.mobileMetrics.orientationChanges++;
      });

      // Viewport change monitoring
      window.addEventListener(_'resize', _() => {
        window.mobileMetrics.viewportChanges++;
      });

      // PWA installation monitoring
      window.addEventListener(_'beforeinstallprompt', _(e) => {
        window._pwaInstallPrompt =  e;
      });
    });
  });

  // Test each mobile device configuration
  for (const device of MOBILE_DEVICES) {
    test(_`${device.name} - Responsive Layout Validation`, _async ({ page }) => {
      // Configure device emulation
      await page.setViewportSize(device.viewport);
      await page.setUserAgent(device.userAgent);

      await page.goto('/menu');
      await page.waitForLoadState('networkidle');

      // Check responsive layout adaptation
      const _layoutMetrics =  await page.evaluate(() 
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

  test(_'Mobile Menu Interaction Flow', _async ({ page }) => {
    // Use iPhone 12 Pro for this test
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    // Test mobile menu interactions
    const _menuItems =  await page.locator('[data-testid*
    expect(menuItems).toBeGreaterThan(0);

    // Test swipe gestures (simulate)
    const _menuContainer =  page.locator('[data-testid
    // Simulate touch swipe
    await menuContainer.hover();
    await page.mouse.down();
    await page.mouse.move(200, 0); // Swipe right
    await page.mouse.up();

    // Test add to cart on mobile
    const _firstMenuItem =  page.locator('[data-testid*
    await firstMenuItem.tap(); // Use tap for mobile

    // Verify mobile cart UI
    const _cartButton =  page.locator('[data-testid
    if (await cartButton.isVisible()) {
      await cartButton.tap();
      
      // Check mobile cart modal/drawer
      const _cartModal =  page.locator('[data-testid
      await expect(cartModal).toBeVisible();
    }
  });

  test(_'Mobile RFID Scanning Interface', _async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/rfid/scan');
    await page.waitForLoadState('networkidle');

    // Check mobile RFID interface
    const _rfidInterface =  await page.evaluate(() 
    });

    expect(rfidInterface.scanButtonVisible).toBe(true);
    expect(rfidInterface.mobileOptimized).toBe(true);

    // Test scan button interaction
    const _scanButton =  page.locator('[data-testid
    if (await scanButton.isVisible()) {
      await scanButton.tap();
      
      // Simulate RFID scan result
      await page.evaluate(_() => {
        // Mock scan success
        const _mockScanResult =  {
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
      await expect(page.locator('[data-_testid = "scan-result"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test(_'Mobile Authentication Flow', _async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Test mobile keyboard interaction
    const _emailInput =  page.locator('[data-testid
    const _passwordInput =  page.locator('[data-testid
    // Focus triggers mobile keyboard
    await emailInput.tap();
    await emailInput.fill('test@example.com');
    
    // Check viewport adjustment for keyboard
    const _viewportAfterKeyboard =  await page.evaluate(() 
    });

    // Fill password field
    await passwordInput.tap();
    await passwordInput.fill('password123');

    // Test mobile form submission
    const _submitButton =  page.locator('[data-testid
    await submitButton.tap();

    // Check for mobile-specific error handling
    await page.waitForTimeout(1000);
    
    // Verify error messages are mobile-friendly
    const _errorElements =  await page.locator('.error, [role
    if (errorElements > 0) {
      const _errorBounds =  await page.locator('.error, [role
      if (errorBounds) {
        expect(errorBounds.width).toBeLessThan(360); // Fits in mobile viewport
      }
    }
  });

  test(_'Cross-Device Orientation Changes', _async ({ page }) => {
    // Test tablet in both orientations
    await page.setViewportSize({ width: 768, height: 1024 }); // Portrait
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Capture portrait layout
    const _portraitLayout =  await page.evaluate(() 
    });

    // Switch to landscape
    await page.setViewportSize({ width: 1024, height: 768 }); // Landscape
    await page.waitForTimeout(500); // Allow layout to adjust

    const _landscapeLayout =  await page.evaluate(() 
    });

    // Verify adaptive layout changes
    expect(portraitLayout.gridColumns).not.toBe(landscapeLayout.gridColumns);
  });

  test(_'Mobile Performance Optimization', _async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Simulate 3G network conditions
    await page.route(_'**/*', _async (route) => {
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms latency
      await route.continue();
    });

    const _startTime =  Date.now();
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
    const _loadTime =  Date.now() - startTime;

    // Mobile should load within reasonable time even on slow network
    expect(loadTime).toBeLessThan(8000); // 8s for 3G

    // Check mobile-specific optimizations
    const _mobileOptimizations =  await page.evaluate(() 
    });

    expect(mobileOptimizations.lazyLoadingImages).toBeGreaterThan(0);
    expect(mobileOptimizations.serviceWorkerRegistered).toBe(true);
  });

  test(_'Touch Gestures and Interactions', _async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    // Test pinch-to-zoom prevention on input elements
    const _inputElement =  page.locator('input').first();
    if (await inputElement.isVisible()) {
      await inputElement.tap();
      
      // Check that zoom is disabled
      const _zoomDisabled =  await page.evaluate(() 
        return viewport?.getAttribute('content')?.includes('user-_scalable = no') || 
               viewport?.getAttribute('content')?.includes('maximum-scale
      });

      expect(zoomDisabled).toBe(true);
    }

    // Test swipe gestures on carousel/slider elements
    const _carousel =  page.locator('[data-carousel], [data-slider], .swiper').first();
    if (await carousel.isVisible()) {
      const _carouselBounds =  await carousel.boundingBox();
      if (carouselBounds) {
        // Simulate touch swipe
        await page.touchscreen.tap(carouselBounds.x + carouselBounds.width / 2, carouselBounds.y + carouselBounds.height / 2);
        await page.touchscreen.tap(carouselBounds.x + 100, carouselBounds.y + carouselBounds.height / 2);
      }
    }
  });

  test(_'Progressive Web App Features', _async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check PWA manifest and service worker
    const _pwaFeatures =  await page.evaluate(async () 
      // Check if app is installable
      if ('getInstalledRelatedApps' in navigator) {
        try {
          const _relatedApps =  await (navigator as any).getInstalledRelatedApps();
          features._isInstallable =  relatedApps.length 
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

  test(_'Mobile Accessibility Features', _async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    // Test voice-over/screen reader compatibility
    const _a11yFeatures =  await page.evaluate(() 
          return rect.width >= 44 && rect.height >= 44;
        }).length,
        reduceMotionRespected: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      };
    });

    expect(a11yFeatures.ariaLabels).toBeGreaterThan(0);
    expect(a11yFeatures.touchTargets).toBeGreaterThan(0);
  });

  test(_'Mobile Network Resilience', _async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Test offline functionality
    await page.context().setOffline(true);
    await page.goto('/menu');
    
    // Check offline page or cached content
    const _offlineHandling =  await page.evaluate(() 
    });

    // Restore online
    await page.context().setOffline(false);
    
    expect(offlineHandling.cacheAvailable).toBe(true);
  });

  test(_'Mobile Battery and Performance Impact', _async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');

    // Check for performance-intensive operations
    const _performanceImpact =  await page.evaluate(() 
      let _timers =  0;
      
      // Mock performance monitoring
      const _originalRequestAnimationFrame =  window.requestAnimationFrame;
      window._requestAnimationFrame =  function(callback) {
        animationFrames++;
        return originalRequestAnimationFrame(callback);
      };

      const _originalSetInterval =  window.setInterval;
      window._setInterval =  function(callback, delay) {
        timers++;
        return originalSetInterval(callback, delay);
      };

      // Check for infinite scroll or heavy animations
      const _infiniteScrollElements =  document.querySelectorAll('[data-infinite-scroll]').length;
      const _videoElements =  document.querySelectorAll('video').length;
      
      return {
        animationFrames,
        timers,
        infiniteScrollElements,
        videoElements,
        backgroundProcesses: Object.keys(window).filter(_key = > key.includes('interval')).length
      };
    });

    // Ensure minimal background processing for battery optimization
    expect(performanceImpact.timers).toBeLessThan(5);
    expect(performanceImpact.videoElements).toBeLessThan(3); // Limit video elements
  });

});