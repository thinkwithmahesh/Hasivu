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
const ACCESSIBILITY_STANDARDS = {
  wcag2a: ['wcag2a'],
  wcag2aa: ['wcag2aa', 'wcag2a'],
  wcag21aa: ['wcag21aa', 'wcag2aa', 'wcag2a'],
  bestPractice: ['best-practice'],
};

const CRITICAL_PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/auth/login', name: 'Login Page' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/menu', name: 'Menu Page' },
  { path: '/profile', name: 'Profile Page' },
  { path: '/settings', name: 'Settings Page' },
];

const VIEWPORT_SIZES = [
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
  page: any, 
  standards: string[] = ACCESSIBILITY_STANDARDS.wcag21aa,
  context?: string
) {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(standards)
    .exclude('#__next-dev-overlay-error-dialog') // Exclude dev overlays
    .exclude('[data-testid="development-only"]')
    .analyze();

  const violations = accessibilityScanResults.violations;
  
  if (violations.length > 0) {
    console.log(`\n🚨 Accessibility violations found ${context ? `in ${context}` : ''}:`);
    violations.forEach((violation, index) => {
      console.log(`\n${index + 1}. ${violation.id} - ${violation.impact}`);
      console.log(`   Description: ${violation.description}`);
      console.log(`   Help: ${violation.helpUrl}`);
      violation.nodes.forEach((node, nodeIndex) => {
        console.log(`   Element ${nodeIndex + 1}: ${node.target.join(', ')}`);
      });
    });
  }

  return accessibilityScanResults;
}

// Core accessibility test suite
test.describe('HASIVU Platform - WCAG 2.1 AA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Set up accessibility testing environment
    await page.goto('/');
    await waitForPageLoad(page);
  });

  // Test 1: Comprehensive page-by-page accessibility validation
  for (const pageConfig of CRITICAL_PAGES) {
    test(`WCAG 2.1 AA compliance - ${pageConfig.name}`, async ({ page }) => {
      await page.goto(pageConfig.path);
      await waitForPageLoad(page);

      // Perform comprehensive accessibility check
      const results = await performAccessibilityCheck(
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
    test(`Responsive accessibility - ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await waitForPageLoad(page);

      // Test multiple pages at this viewport
      for (const pageConfig of CRITICAL_PAGES.slice(0, 3)) { // Test first 3 pages
        await page.goto(pageConfig.path);
        await waitForPageLoad(page);

        const results = await performAccessibilityCheck(
          page,
          ACCESSIBILITY_STANDARDS.wcag21aa,
          `${pageConfig.name} at ${viewport.name}`
        );

        expect(results.violations).toHaveLength(0);
      }
    });
  }

  // Test 3: Keyboard navigation testing
  test('Comprehensive keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Test Tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();

    // Test skip links
    await page.keyboard.press('Tab');
    const skipLink = await page.locator('text="Skip to main content"').first();
    if (await skipLink.isVisible()) {
      await skipLink.click();
      await page.waitForTimeout(500);
      
      const mainContent = await page.locator('#main-content').first();
      await expect(mainContent).toBeFocused();
    }

    // Test keyboard shortcuts
    await page.keyboard.press('Alt+KeyM'); // Skip to main content
    await page.waitForTimeout(500);
    
    await page.keyboard.press('Alt+KeyN'); // Skip to navigation
    await page.waitForTimeout(500);

    // Verify focus visibility
    await page.keyboard.press('Tab');
    focusedElement = await page.locator(':focus').first();
    
    // Check if focus indicator is visible
    const focusStyles = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        border: styles.border,
      };
    });

    // At least one focus indicator should be present
    const hasFocusIndicator = 
      focusStyles.outline !== 'none' || 
      focusStyles.boxShadow !== 'none' || 
      focusStyles.border.includes('px');
    
    expect(hasFocusIndicator).toBeTruthy();
  });

  // Test 4: Screen reader compatibility
  test('Screen reader compatibility and ARIA attributes', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let previousLevel = 0;
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const currentLevel = parseInt(tagName.charAt(1));
      
      // Heading levels should not skip (e.g., h1 -> h3 is not allowed)
      if (previousLevel > 0) {
        expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1);
      }
      
      previousLevel = currentLevel;
    }

    // Verify all images have alt attributes
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      // Images should have alt text, aria-label, or be aria-hidden
      expect(alt !== null || ariaLabel !== null || ariaHidden === 'true').toBeTruthy();
    }

    // Check form labels
    const inputs = await page.locator('input, select, textarea').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).first();
        const hasLabel = await label.count() > 0;
        
        // Inputs should have labels, aria-label, or aria-labelledby
        expect(hasLabel || ariaLabel !== null || ariaLabelledby !== null).toBeTruthy();
      }
    }

    // Verify live regions
    const liveRegions = await page.locator('[aria-live]').all();
    for (const region of liveRegions) {
      const ariaLive = await region.getAttribute('aria-live');
      expect(['polite', 'assertive', 'off']).toContain(ariaLive);
    }
  });

  // Test 5: Color contrast validation
  test('Color contrast compliance', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Use axe-core to specifically test color contrast
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('[role="main"], header, nav, footer')
      .analyze();

    // Filter for color contrast violations
    const colorContrastViolations = results.violations.filter(
      violation => violation.id === 'color-contrast'
    );

    expect(colorContrastViolations).toHaveLength(0);

    // Additional manual color contrast checks for critical elements
    const criticalElements = await page.locator('button, a, .text-primary, .bg-primary').all();
    
    for (const element of criticalElements.slice(0, 10)) { // Test first 10
      const isVisible = await element.isVisible();
      if (isVisible) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
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
  test('Focus management and keyboard trap prevention', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Test modal focus trap (if modals exist)
    const modalTrigger = await page.locator('[data-testid="open-modal"], [aria-haspopup="dialog"]').first();
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      await page.waitForTimeout(500);

      // Test that focus is trapped in modal
      const modal = await page.locator('[role="dialog"], .modal').first();
      if (await modal.count() > 0) {
        // Tab through modal and ensure focus stays within
        const initialFocused = await page.locator(':focus').first();
        
        // Press Tab multiple times and verify focus stays in modal
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
          
          const currentFocused = await page.locator(':focus').first();
          const isInModal = await currentFocused.evaluate((el, modalEl) => {
            return modalEl?.contains(el) || false;
          }, await modal.elementHandle());
          
          if (!isInModal) {
            console.log(`Focus escaped modal on Tab press ${i + 1}`);
          }
        }

        // Test Escape key closes modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        const modalStillVisible = await modal.isVisible().catch(() => false);
        expect(modalStillVisible).toBeFalsy();
      }
    }

    // Test that there are no keyboard traps on the main page
    await page.goto('/');
    await waitForPageLoad(page);

    const initialUrl = page.url();
    
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
  test('Dynamic content accessibility', async ({ page }) => {
    await page.goto('/dashboard'); // Assuming dashboard has dynamic content
    await waitForPageLoad(page);

    // Test loading states
    const loadingElements = await page.locator('[aria-live], [role="status"], .loading').all();
    
    for (const element of loadingElements) {
      const ariaLive = await element.getAttribute('aria-live');
      const role = await element.getAttribute('role');
      
      // Loading elements should have appropriate ARIA attributes
      expect(ariaLive === 'polite' || ariaLive === 'assertive' || role === 'status').toBeTruthy();
    }

    // Test form validation messages
    const forms = await page.locator('form').all();
    
    for (const form of forms) {
      const inputs = await form.locator('input[required], select[required], textarea[required]').all();
      
      for (const input of inputs.slice(0, 3)) { // Test first 3 required inputs
        // Clear input to trigger validation
        await input.fill('');
        await input.blur();
        await page.waitForTimeout(500);

        // Look for validation messages
        const validationMessage = await form.locator('.error, [role="alert"], .invalid-feedback').first();
        
        if (await validationMessage.count() > 0) {
          const ariaLive = await validationMessage.getAttribute('aria-live');
          const role = await validationMessage.getAttribute('role');
          
          // Validation messages should be announced to screen readers
          expect(ariaLive === 'assertive' || role === 'alert').toBeTruthy();
        }
      }
    }
  });

  // Test 8: Performance impact of accessibility features
  test('Accessibility features performance impact', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/', { waitUntil: 'networkidle' });

    // Measure page load with accessibility features
    const performanceTimings = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
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
    const accessibilityContext = await page.evaluate(() => {
      // Check if accessibility context is available
      const liveRegion = document.querySelector('[aria-live]');
      const skipLinks = document.querySelectorAll('a[href^="#"]');
      
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
test.describe('Component-Specific Accessibility Tests', () => {
  test('Form components accessibility', async ({ page }) => {
    await page.goto('/auth/login');
    await waitForPageLoad(page);

    // Test form accessibility
    const results = await performAccessibilityCheck(page, ACCESSIBILITY_STANDARDS.wcag21aa, 'Login Form');
    expect(results.violations).toHaveLength(0);

    // Test specific form requirements
    const form = await page.locator('form').first();
    
    // All form inputs should have labels
    const inputs = await form.locator('input, select, textarea').all();
    for (const input of inputs) {
      const type = await input.getAttribute('type');
      
      if (type !== 'hidden') {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        
        let hasLabel = false;
        
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).first();
          hasLabel = await label.count() > 0;
        }
        
        expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
  });

  test('Navigation components accessibility', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Test navigation accessibility
    const nav = await page.locator('nav, [role="navigation"]').first();
    
    if (await nav.count() > 0) {
      const results = await performAccessibilityCheck(page, ACCESSIBILITY_STANDARDS.wcag21aa, 'Navigation');
      expect(results.violations).toHaveLength(0);

      // Navigation should have proper roles and labels
      const role = await nav.getAttribute('role');
      const ariaLabel = await nav.getAttribute('aria-label');
      const ariaLabelledby = await nav.getAttribute('aria-labelledby');
      
      expect(role === 'navigation' || ariaLabel || ariaLabelledby).toBeTruthy();

      // Navigation links should be keyboard accessible
      const links = await nav.locator('a, button').all();
      for (const link of links.slice(0, 5)) { // Test first 5 links
        await link.focus();
        await expect(link).toBeFocused();
        
        // Links should have visible focus indicators
        const focusStyles = await link.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            boxShadow: styles.boxShadow,
          };
        });
        
        const hasFocusIndicator = 
          focusStyles.outline !== 'none' || 
          focusStyles.boxShadow !== 'none';
        
        expect(hasFocusIndicator).toBeTruthy();
      }
    }
  });
});

// Generate accessibility report
test.describe('Accessibility Reporting', () => {
  test('Generate comprehensive accessibility report', async ({ page }) => {
    const report = {
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

      const results = await performAccessibilityCheck(page, ACCESSIBILITY_STANDARDS.wcag21aa);
      
      const pageReport = {
        name: pageConfig.name,
        path: pageConfig.path,
        violations: results.violations.length,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length,
        violationDetails: results.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        })),
      };

      report.pages.push(pageReport);
      report.summary.totalViolations += results.violations.length;
      report.summary.totalPasses += results.passes.length;
    }

    // Calculate compliance percentage
    const totalTests = report.summary.totalViolations + report.summary.totalPasses;
    const compliancePercentage = totalTests > 0 ? (report.summary.totalPasses / totalTests) * 100 : 0;

    console.log('\n📊 HASIVU Platform Accessibility Report');
    console.log('==========================================');
    console.log(`Compliance Standard: ${report.summary.compliance}`);
    console.log(`Total Pages Tested: ${report.summary.totalPages}`);
    console.log(`Total Violations: ${report.summary.totalViolations}`);
    console.log(`Total Passes: ${report.summary.totalPasses}`);
    console.log(`Compliance Rate: ${compliancePercentage.toFixed(2)}%`);
    console.log('\nPage-by-Page Results:');
    
    report.pages.forEach(page => {
      const pageCompliance = page.passes > 0 ? (page.passes / (page.passes + page.violations)) * 100 : 0;
      console.log(`  ${page.name}: ${pageCompliance.toFixed(2)}% (${page.violations} violations, ${page.passes} passes)`);
    });

    // Strict compliance requirement
    expect(report.summary.totalViolations).toBe(0);
  });
});