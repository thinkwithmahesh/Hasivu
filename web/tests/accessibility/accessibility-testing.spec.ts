/**
 * HASIVU Platform - Comprehensive Accessibility Testing Suite
 * 
 * This test suite provides complete WCAG 2.1 AA compliance validation
 * Features:
 * - Automated axe-core accessibility testing
 * - Keyboard navigation testing
 * - Screen reader compatibility testing
 * - Color contrast validation
 * - Focus management testing
 * - ARIA attributes validation
 * - Responsive accessibility testing
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Test configuration
const _ACCESSIBILITY_STANDARDS =  {
  wcag2a: ['wcag2a'],
  wcag2aa: ['wcag2aa', 'wcag2a'],
  wcag21aa: ['wcag21aa', 'wcag2aa', 'wcag2a'],
  bestPractice: ['best-practice'],
};

const _CRITICAL_PAGES =  [
  { path: '/', name: 'Homepage' },
  { path: '/auth/login', name: 'Login Page' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/menu', name: 'Menu Page' },
  { path: '/profile', name: 'Profile Page' },
  { path: '/settings', name: 'Settings Page' },
];

const _VIEWPORT_SIZES =  [
  { width: 375, height: 667, name: 'Mobile' },
  { width: 768, height: 1024, name: 'Tablet' },
  { width: 1200, height: 800, name: 'Desktop' },
  { width: 1920, height: 1080, name: 'Large Desktop' },
];

// Helper functions
async function waitForPageLoad(page: any) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Allow dynamic content to load
}

async function performAccessibilityCheck(
  page: any, standards: string[] = ACCESSIBILITY_STANDARDS.wcag21aa, context?: string) {
  const _accessibilityScanResults =  await new AxeBuilder({ page })
    .withTags(standards)
    .exclude('#__next-dev-overlay-error-dialog') // Exclude dev overlays
    .exclude('[data-testid
  const _violations =  accessibilityScanResults.violations;
  
  if (violations.length > 0) {
    console.log(`\n🚨 Accessibility violations found ${context ? `in ${context}` : ''}:`);
    violations.forEach(_(violation, _index) => {
      console.log(`\n${index + 1}. ${violation.id} - ${violation.impact}`);
      console.log(`   Description: ${violation.description}`);
      console.log(`   Help: ${violation.helpUrl}`);
      violation.nodes.forEach(_(node, _nodeIndex) => {
        console.log(`   Element ${nodeIndex + 1}: ${node.target.join(', ')}`);
      });
    });
  }

  return accessibilityScanResults;
}

// Core accessibility test suite
test.describe(_'HASIVU Platform - WCAG 2.1 AA Compliance', _() => {
  test.beforeEach(_async ({ page }) => {
    // Set up accessibility testing environment
    await page.goto('/');
    await waitForPageLoad(page);
  });

  // Test 1: Comprehensive page-by-page accessibility validation
  for (const pageConfig of CRITICAL_PAGES) {
    test(_`WCAG 2.1 AA compliance - ${pageConfig.name}`, _async ({ page }) => {
      await page.goto(pageConfig.path);
      await waitForPageLoad(page);

      // Perform comprehensive accessibility check
      const _results =  await performAccessibilityCheck(
        page, 
        ACCESSIBILITY_STANDARDS.wcag21aa,
        pageConfig.name
      );

      // Strict compliance - no violations allowed
      expect(results.violations).toHaveLength(0);

      // Log success metrics
      console.log(`✅ ${pageConfig.name}: ${results.passes.length} accessibility tests passed`);
    });
  }

  // Test 2: Responsive accessibility testing
  for (const viewport of VIEWPORT_SIZES) {
    test(`Responsive accessibility - ${viewport.name} (${viewport.width}x${viewport.height})`, async (_{ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await waitForPageLoad(page);

      // Test multiple pages at this viewport
      for (const pageConfig of CRITICAL_PAGES.slice(0, 3)) { // Test first 3 pages
        await page.goto(pageConfig.path);
        await waitForPageLoad(page);

        const _results =  await performAccessibilityCheck(
          page,
          ACCESSIBILITY_STANDARDS.wcag21aa,
          `${pageConfig.name} at ${viewport.name}`
        );

        expect(results.violations).toHaveLength(0);
      }
    });
  }

  // Test 3: Keyboard navigation testing
  test(_'Comprehensive keyboard navigation', _async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Test Tab navigation
    await page.keyboard.press('Tab');
    let _focusedElement =  await page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();

    // Test skip links
    await page.keyboard.press('Tab');
    const _skipLink =  await page.locator('text
    if (await skipLink.isVisible()) {
      await skipLink.click();
      await page.waitForTimeout(500);
      
      const _mainContent =  await page.locator('#main-content').first();
      await expect(mainContent).toBeFocused();
    }

    // Test keyboard shortcuts
    await page.keyboard.press('Alt+KeyM'); // Skip to main content
    await page.waitForTimeout(500);
    
    await page.keyboard.press('Alt+KeyN'); // Skip to navigation
    await page.waitForTimeout(500);

    // Verify focus visibility
    await page.keyboard.press('Tab');
    _focusedElement =  await page.locator(':focus').first();
    
    // Check if focus indicator is visible
    const _focusStyles =  await focusedElement.evaluate((el) 
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        border: styles.border,
      };
    });

    // At least one focus indicator should be present
    const _hasFocusIndicator =  
      focusStyles.outline !
    expect(hasFocusIndicator).toBeTruthy();
  });

  // Test 4: Screen reader compatibility
  test(_'Screen reader compatibility and ARIA attributes', _async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check for proper heading hierarchy
    const _headings =  await page.locator('h1, h2, h3, h4, h5, h6').all();
    let _previousLevel =  0;
    
    for (const heading of headings) {
      const _tagName =  await heading.evaluate(el 
      const _currentLevel =  parseInt(tagName.charAt(1));
      
      // Heading levels should not skip (e.g., h1 -> h3 is not allowed)
      if (previousLevel > 0) {
        expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1);
      }
      
      _previousLevel =  currentLevel;
    }

    // Verify all images have alt attributes
    const _images =  await page.locator('img').all();
    for (const img of images) {
      const _alt =  await img.getAttribute('alt');
      const _ariaLabel =  await img.getAttribute('aria-label');
      const _ariaHidden =  await img.getAttribute('aria-hidden');
      
      // Images should have alt text, aria-label, or be aria-hidden
      expect(alt !== null || ariaLabel !== null || _ariaHidden = 
    }

    // Check form labels
    const _inputs =  await page.locator('input, select, textarea').all();
    for (const input of inputs) {
      const _id =  await input.getAttribute('id');
      const _ariaLabel =  await input.getAttribute('aria-label');
      const _ariaLabelledby =  await input.getAttribute('aria-labelledby');
      
      if (id) {
        const _label =  await page.locator(`label[for
        const _hasLabel =  await label.count() > 0;
        
        // Inputs should have labels, aria-label, or aria-labelledby
        expect(hasLabel || ariaLabel !== null || ariaLabelledby !== null).toBeTruthy();
      }
    }

    // Verify live regions
    const _liveRegions =  await page.locator('[aria-live]').all();
    for (const region of liveRegions) {
      const _ariaLive =  await region.getAttribute('aria-live');
      expect(['polite', 'assertive', 'off']).toContain(ariaLive);
    }
  });

  // Test 5: Color contrast validation
  test(_'Color contrast compliance', _async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Use axe-core to specifically test color contrast
    const _results =  await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('[role
    // Filter for color contrast violations
    const _colorContrastViolations =  results.violations.filter(
      violation 
    expect(colorContrastViolations).toHaveLength(0);

    // Additional manual color contrast checks for critical elements
    const _criticalElements =  await page.locator('button, a, .text-primary, .bg-primary').all();
    
    for (const element of criticalElements.slice(0, 10)) { // Test first 10
      const _isVisible =  await element.isVisible();
      if (isVisible) {
        const _styles =  await element.evaluate((el) 
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
          };
        });
        
        // Log for manual review if needed
        console.log('Element styles:', styles);
      }
    }
  });

  // Test 6: Focus management and keyboard traps
  test(_'Focus management and keyboard trap prevention', _async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Test modal focus trap (if modals exist)
    const _modalTrigger =  await page.locator('[data-testid
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      await page.waitForTimeout(500);

      // Test that focus is trapped in modal
      const _modal =  await page.locator('[role
      if (await modal.count() > 0) {
        // Tab through modal and ensure focus stays within
        const _initialFocused =  await page.locator(':focus').first();
        
        // Press Tab multiple times and verify focus stays in modal
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
          
          const _currentFocused =  await page.locator(':focus').first();
          const _isInModal =  await currentFocused.evaluate((el, modalEl) 
          }, await modal.elementHandle());
          
          if (!isInModal) {
            console.log(`Focus escaped modal on Tab press ${i + 1}`);
          }
        }

        // Test Escape key closes modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        const _modalStillVisible =  await modal.isVisible().catch(() 
        expect(modalStillVisible).toBeFalsy();
      }
    }

    // Test that there are no keyboard traps on the main page
    await page.goto('/');
    await waitForPageLoad(page);

    const _initialUrl =  page.url();
    
    // Press Tab many times and ensure we can still navigate
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
    }

    // We should still be on the same page and able to interact
    expect(page.url()).toBe(initialUrl);
    
    // Test Shift+Tab reverse navigation
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(50);
    }
  });

  // Test 7: Dynamic content accessibility
  test(_'Dynamic content accessibility', _async ({ page }) => {
    await page.goto('/dashboard'); // Assuming dashboard has dynamic content
    await waitForPageLoad(page);

    // Test loading states
    const _loadingElements =  await page.locator('[aria-live], [role
    for (const element of loadingElements) {
      const _ariaLive =  await element.getAttribute('aria-live');
      const _role =  await element.getAttribute('role');
      
      // Loading elements should have appropriate ARIA attributes
      expect(_ariaLive = 
    }

    // Test form validation messages
    const _forms =  await page.locator('form').all();
    
    for (const form of forms) {
      const _inputs =  await form.locator('input[required], select[required], textarea[required]').all();
      
      for (const input of inputs.slice(0, 3)) { // Test first 3 required inputs
        // Clear input to trigger validation
        await input.fill('');
        await input.blur();
        await page.waitForTimeout(500);

        // Look for validation messages
        const _validationMessage =  await form.locator('.error, [role
        if (await validationMessage.count() > 0) {
          const _ariaLive =  await validationMessage.getAttribute('aria-live');
          const _role =  await validationMessage.getAttribute('role');
          
          // Validation messages should be announced to screen readers
          expect(_ariaLive = 
        }
      }
    }
  });

  // Test 8: Performance impact of accessibility features
  test(_'Accessibility features performance impact', _async ({ page }) => {
    // Start performance monitoring
    await page.goto('/', { waitUntil: 'networkidle' });

    // Measure page load with accessibility features
    const _performanceTimings =  await page.evaluate(() 
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });

    // Accessibility features should not significantly impact performance
    expect(performanceTimings.domContentLoaded).toBeLessThan(3000); // 3 second limit
    expect(performanceTimings.loadComplete).toBeLessThan(5000); // 5 second limit

    console.log('Performance metrics with accessibility features:', performanceTimings);

    // Test accessibility provider initialization
    const _accessibilityContext =  await page.evaluate(() 
      const _skipLinks =  document.querySelectorAll('a[href^
      return {
        hasLiveRegion: !!liveRegion,
        skipLinksCount: skipLinks.length,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      };
    });

    expect(accessibilityContext.hasLiveRegion).toBeTruthy();
    expect(accessibilityContext.skipLinksCount).toBeGreaterThan(0);
  });
});

// Test specific components for accessibility
test.describe(_'Component-Specific Accessibility Tests', _() => {
  test(_'Form components accessibility', _async ({ page }) => {
    await page.goto('/auth/login');
    await waitForPageLoad(page);

    // Test form accessibility
    const _results =  await performAccessibilityCheck(page, ACCESSIBILITY_STANDARDS.wcag21aa, 'Login Form');
    expect(results.violations).toHaveLength(0);

    // Test specific form requirements
    const _form =  await page.locator('form').first();
    
    // All form inputs should have labels
    const _inputs =  await form.locator('input, select, textarea').all();
    for (const input of inputs) {
      const _type =  await input.getAttribute('type');
      
      if (type !== 'hidden') {
        const _id =  await input.getAttribute('id');
        const _ariaLabel =  await input.getAttribute('aria-label');
        const _ariaLabelledby =  await input.getAttribute('aria-labelledby');
        
        let _hasLabel =  false;
        
        if (id) {
          const _label =  await page.locator(`label[for
          _hasLabel =  await label.count() > 0;
        }
        
        expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
  });

  test(_'Navigation components accessibility', _async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Test navigation accessibility
    const _nav =  await page.locator('nav, [role
    if (await nav.count() > 0) {
      const _results =  await performAccessibilityCheck(page, ACCESSIBILITY_STANDARDS.wcag21aa, 'Navigation');
      expect(results.violations).toHaveLength(0);

      // Navigation should have proper roles and labels
      const _role =  await nav.getAttribute('role');
      const _ariaLabel =  await nav.getAttribute('aria-label');
      const _ariaLabelledby =  await nav.getAttribute('aria-labelledby');
      
      expect(_role = 
      // Navigation links should be keyboard accessible
      const _links =  await nav.locator('a, button').all();
      for (const link of links.slice(0, 5)) { // Test first 5 links
        await link.focus();
        await expect(link).toBeFocused();
        
        // Links should have visible focus indicators
        const _focusStyles =  await link.evaluate((el) 
          return {
            outline: styles.outline,
            boxShadow: styles.boxShadow,
          };
        });
        
        const _hasFocusIndicator =  
          focusStyles.outline !
        expect(hasFocusIndicator).toBeTruthy();
      }
    }
  });
});

// Generate accessibility report
test.describe(_'Accessibility Reporting', _() => {
  test(_'Generate comprehensive accessibility report', _async ({ page }) => {
    const _report =  {
      timestamp: new Date().toISOString(),
      pages: [] as any[],
      summary: {
        totalPages: CRITICAL_PAGES.length,
        totalViolations: 0,
        totalPasses: 0,
        compliance: 'WCAG 2.1 AA',
      },
    };

    for (const pageConfig of CRITICAL_PAGES) {
      await page.goto(pageConfig.path);
      await waitForPageLoad(page);

      const _results =  await performAccessibilityCheck(page, ACCESSIBILITY_STANDARDS.wcag21aa);
      
      const _pageReport =  {
        name: pageConfig.name,
        path: pageConfig.path,
        violations: results.violations.length,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length,
        violationDetails: results.violations.map(v 
      report.pages.push(pageReport);
      report.summary.totalViolations += results.violations.length;
      report.summary.totalPasses += results.passes.length;
    }

    // Calculate compliance percentage
    const _totalTests =  report.summary.totalViolations + report.summary.totalPasses;
    const _compliancePercentage =  totalTests > 0 ? (report.summary.totalPasses / totalTests) * 100 : 0;

    console.log('\n📊 HASIVU Platform Accessibility Report');
    console.log('==========================================');
    console.log(`Compliance Standard: ${report.summary.compliance}`);
    console.log(`Total Pages Tested: ${report.summary.totalPages}`);
    console.log(`Total Violations: ${report.summary.totalViolations}`);
    console.log(`Total Passes: ${report.summary.totalPasses}`);
    console.log(`Compliance Rate: ${compliancePercentage.toFixed(2)}%`);
    console.log('\nPage-by-Page Results:');
    
    report.pages.forEach(_page = > {
      const pageCompliance 
      console.log(`  ${page.name}: ${pageCompliance.toFixed(2)}% (${page.violations} violations, ${page.passes} passes)`);
    });

    // Strict compliance requirement
    expect(report.summary.totalViolations).toBe(0);
  });
});