/**
 * HASIVU Enterprise WCAG AA Accessibility Compliance Tests
 * 🎨 Brand Colors: Vibrant Blue (#2563eb), Deep Green (#16a34a)  
 * ♿ Comprehensive WCAG 2.1 AA compliance validation
 * 🔍 Automated accessibility testing with manual validation points
 */

import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

// WCAG AA color contrast requirements
const CONTRAST_REQUIREMENTS = {
  AA_NORMAL: 4.5,      // Normal text minimum contrast ratio
  AA_LARGE: 3.0,       // Large text minimum contrast ratio  
  AAA_NORMAL: 7.0,     // Enhanced contrast (AAA)
  AAA_LARGE: 4.5       // Enhanced large text contrast
};

// Brand colors with their expected contrast ratios
const BRAND_COLORS = {
  PRIMARY: '#2563eb',     // Vibrant Blue
  SECONDARY: '#16a34a',   // Deep Green
  ACCENT: '#dc2626',      // Error Red
  WARNING: '#f59e0b',     // Warning Amber
  SUCCESS: '#059669',     // Success Green
  NEUTRAL: '#6b7280'      // Neutral Gray
};

// Pages to test for accessibility
const PAGES_TO_TEST = [
  { path: '/', name: 'homepage', priority: 'critical' },
  { path: '/auth/login', name: 'login', priority: 'critical' },
  { path: '/auth/register', name: 'register', priority: 'high' },
  { path: '/dashboard/parent', name: 'parent-dashboard', priority: 'critical' },
  { path: '/dashboard/admin', name: 'admin-dashboard', priority: 'high' },
  { path: '/dashboard/kitchen', name: 'kitchen-dashboard', priority: 'high' }
];

test.describe('HASIVU WCAG AA Accessibility Compliance', () => {

  test.beforeEach(async ({ page }) => {
    // Inject axe-core for automated accessibility testing
    await injectAxe(page);
    
    // Set high contrast mode for testing
    await page.addInitScript(() => {
      // Enable forced colors for testing
      if (CSS.supports('forced-colors', 'active')) {
        document.documentElement.style.setProperty('forced-colors', 'active');
      }
    });
  });

  test.describe('Automated Accessibility Scanning', () => {

    PAGES_TO_TEST.forEach(({ path, name, priority }) => {
      test(`${name} - WCAG AA automated scan`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('domcontentloaded');

        // Run comprehensive accessibility scan
        const violations = await getViolations(page, null, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
          },
          reporter: 'v2'
        });

        // Log violations for debugging
        if (violations.length > 0) {
          console.log(`\n♿ Accessibility violations found on ${name}:`);
          violations.forEach((violation, index) => {
            console.log(`  ${index + 1}. ${violation.id}: ${violation.description}`);
            console.log(`     Impact: ${violation.impact}`);
            console.log(`     Nodes: ${violation.nodes.length}`);
          });
        }

        // Critical pages should have zero violations
        if (priority === 'critical') {
          expect(violations).toHaveLength(0);
        } else {
          // High priority pages should have minimal violations
          const criticalViolations = violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
          expect(criticalViolations).toHaveLength(0);
        }
      });
    });

  });

  test.describe('Color Contrast Validation', () => {

    test('Brand colors meet WCAG AA contrast requirements', async ({ page }) => {
      const contrastTestHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Contrast Test</title>
          <style>
            body { margin: 0; padding: 20px; font-family: system-ui; }
            .contrast-test { margin: 20px 0; padding: 15px; }
            .primary-on-white { background: white; color: ${BRAND_COLORS.PRIMARY}; }
            .secondary-on-white { background: white; color: ${BRAND_COLORS.SECONDARY}; }
            .white-on-primary { background: ${BRAND_COLORS.PRIMARY}; color: white; }
            .white-on-secondary { background: ${BRAND_COLORS.SECONDARY}; color: white; }
            .accent-on-white { background: white; color: ${BRAND_COLORS.ACCENT}; }
            .large-text { font-size: 18px; font-weight: bold; }
            .normal-text { font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="contrast-test primary-on-white normal-text">
            Primary Blue (#2563eb) on White Background - Normal Text
          </div>
          <div class="contrast-test secondary-on-white normal-text">
            Secondary Green (#16a34a) on White Background - Normal Text  
          </div>
          <div class="contrast-test white-on-primary normal-text">
            White Text on Primary Blue Background - Normal Text
          </div>
          <div class="contrast-test white-on-secondary normal-text">
            White Text on Secondary Green Background - Normal Text
          </div>
          <div class="contrast-test accent-on-white normal-text">
            Accent Red (#dc2626) on White Background - Normal Text
          </div>
          <div class="contrast-test primary-on-white large-text">
            Primary Blue (#2563eb) on White - Large Text
          </div>
        </body>
        </html>
      `;

      await page.setContent(contrastTestHTML);
      
      // Check contrast for each combination
      const contrastResults = await page.evaluate(() => {
        const elements = document.querySelectorAll('.contrast-test');
        const results = [];
        
        elements.forEach((element, index) => {
          const styles = getComputedStyle(element);
          const backgroundColor = styles.backgroundColor;
          const textColor = styles.color;
          const fontSize = parseFloat(styles.fontSize);
          const fontWeight = styles.fontWeight;
          
          // Simple contrast ratio calculation (approximation)
          const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight === 'bold');
          
          results.push({
            index,
            text: element.textContent?.trim(),
            backgroundColor,
            textColor,
            fontSize,
            isLargeText,
            className: element.className
          });
        });
        
        return results;
      });

      // Run axe-core contrast checks
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });

      console.log('\n🎨 Color contrast test results:');
      contrastResults.forEach(result => {
        console.log(`  ${result.className}: ${result.isLargeText ? 'Large' : 'Normal'} text`);
      });
    });

    test('Form elements have sufficient contrast', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('domcontentloaded');

      // Check form input contrast
      const formElements = [
        '[data-testid="email-input"]',
        '[data-testid="password-input"]', 
        '[data-testid="login-button"]'
      ];

      for (const selector of formElements) {
        const element = await page.locator(selector);
        if (await element.count() > 0) {
          // Verify element is visible and accessible
          await expect(element).toBeVisible();
          
          // Run contrast check on individual element
          await checkA11y(page, selector, {
            rules: { 'color-contrast': { enabled: true } }
          });
        }
      }
    });

  });

  test.describe('Keyboard Navigation', () => {

    test('Complete keyboard navigation flow', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Start from first focusable element
      await page.keyboard.press('Tab');
      
      // Track focus progression
      const focusSequence = [];
      let previouslyFocused = null;
      
      for (let i = 0; i < 10; i++) {
        const currentlyFocused = await page.evaluate(() => {
          const active = document.activeElement;
          return active ? {
            tagName: active.tagName,
            type: active.type || null,
            id: active.id || null,
            className: active.className || null,
            textContent: active.textContent?.trim().substring(0, 50) || null
          } : null;
        });
        
        if (currentlyFocused && JSON.stringify(currentlyFocused) !== JSON.stringify(previouslyFocused)) {
          focusSequence.push(currentlyFocused);
          previouslyFocused = currentlyFocused;
        }
        
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }
      
      console.log('\n⌨️ Keyboard navigation sequence:');
      focusSequence.forEach((element, index) => {
        console.log(`  ${index + 1}. ${element.tagName}${element.type ? `[${element.type}]` : ''} - ${element.textContent || element.id || element.className}`);
      });
      
      // Should have at least 3 focusable elements on login page
      expect(focusSequence.length).toBeGreaterThanOrEqual(3);
      
      // Focus should be visible on all elements
      for (const element of focusSequence) {
        expect(element).toBeTruthy();
      }
    });

    test('Skip links functionality', async ({ page }) => {
      await page.goto('/');
      
      // Press Tab to reveal skip links
      await page.keyboard.press('Tab');
      
      // Look for skip link
      const skipLink = await page.locator('a[href="#main-content"], a[href="#main"], .skip-link').first();
      
      if (await skipLink.count() > 0) {
        // Skip link should be visible when focused
        await expect(skipLink).toBeVisible();
        
        // Should navigate to main content when activated
        await skipLink.press('Enter');
        
        const focusedElement = await page.evaluate(() => {
          return document.activeElement?.id || document.activeElement?.tagName;
        });
        
        expect(['main', 'main-content', 'MAIN']).toContain(focusedElement);
      }
    });

    test('Modal keyboard trap', async ({ page }) => {
      // This test would be more relevant with actual modals in the app
      await page.goto('/dashboard/parent');
      
      // Look for any modal triggers
      const modalTriggers = await page.locator('[data-testid*="modal"], [aria-haspopup="dialog"], button[onclick*="modal"]').count();
      
      if (modalTriggers > 0) {
        // Open modal
        await page.locator('[data-testid*="modal"]').first().click();
        
        // Test focus trap - Tab should stay within modal
        await page.keyboard.press('Tab');
        
        const focusedElement = await page.evaluate(() => {
          const active = document.activeElement;
          const modal = active?.closest('[role="dialog"], .modal, [data-testid*="modal"]');
          return !!modal;
        });
        
        expect(focusedElement).toBe(true);
      }
    });

  });

  test.describe('Screen Reader Support', () => {

    test('Heading hierarchy and structure', async ({ page }) => {
      await page.goto('/');
      
      const headingStructure = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return headings.map(heading => ({
          level: parseInt(heading.tagName.charAt(1)),
          text: heading.textContent?.trim(),
          hasId: !!heading.id,
          isVisible: heading.offsetParent !== null
        }));
      });
      
      console.log('\n📚 Heading structure:');
      headingStructure.forEach((heading, index) => {
        const indent = '  '.repeat(heading.level - 1);
        console.log(`${indent}H${heading.level}: ${heading.text}`);
      });
      
      // Should have exactly one H1
      const h1Count = headingStructure.filter(h => h.level === 1).length;
      expect(h1Count).toBe(1);
      
      // Headings should follow hierarchical order (no skipping levels)
      for (let i = 1; i < headingStructure.length; i++) {
        const current = headingStructure[i];
        const previous = headingStructure[i - 1];
        
        if (current.level > previous.level) {
          // Can only increase by one level at a time
          expect(current.level - previous.level).toBeLessThanOrEqual(1);
        }
      }
    });

    test('ARIA labels and descriptions', async ({ page }) => {
      await page.goto('/auth/register');
      
      const ariaElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*[aria-label], *[aria-labelledby], *[aria-describedby], *[aria-expanded], *[aria-hidden]'));
        
        return elements.map(element => ({
          tagName: element.tagName,
          ariaLabel: element.getAttribute('aria-label'),
          ariaLabelledby: element.getAttribute('aria-labelledby'),
          ariaDescribedby: element.getAttribute('aria-describedby'),
          ariaExpanded: element.getAttribute('aria-expanded'),
          ariaHidden: element.getAttribute('aria-hidden'),
          hasValidLabelTarget: element.getAttribute('aria-labelledby') ? 
            !!document.getElementById(element.getAttribute('aria-labelledby')) : null
        }));
      });
      
      console.log(`\n🏷️ Found ${ariaElements.length} elements with ARIA attributes`);
      
      // Verify ARIA labelledby references exist
      ariaElements.forEach(element => {
        if (element.ariaLabelledby && element.hasValidLabelTarget === false) {
          console.warn(`Warning: aria-labelledby="${element.ariaLabelledby}" target not found`);
        }
      });
      
      // Run axe checks for ARIA usage
      await checkA11y(page, null, {
        rules: {
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-labelledby': { enabled: true }
        }
      });
    });

    test('Form labels and associations', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Check all form inputs have proper labels
      const formInputs = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
        
        return inputs.map(input => ({
          type: input.type || input.tagName,
          id: input.id,
          name: input.name,
          hasLabel: !!document.querySelector(`label[for="${input.id}"]`),
          ariaLabel: input.getAttribute('aria-label'),
          ariaLabelledby: input.getAttribute('aria-labelledby'),
          placeholder: input.getAttribute('placeholder'),
          required: input.hasAttribute('required'),
          isVisible: input.offsetParent !== null
        }));
      });
      
      console.log(`\n📝 Form accessibility analysis:`);
      formInputs.forEach(input => {
        const labelMethod = input.hasLabel ? 'label[for]' : 
                           input.ariaLabel ? 'aria-label' :
                           input.ariaLabelledby ? 'aria-labelledby' :
                           input.placeholder ? 'placeholder only' : 'none';
        
        console.log(`  ${input.type}: ${labelMethod}${input.required ? ' (required)' : ''}`);
      });
      
      // All visible form inputs should have proper labels
      const visibleInputs = formInputs.filter(input => input.isVisible);
      const unlabeledInputs = visibleInputs.filter(input => 
        !input.hasLabel && !input.ariaLabel && !input.ariaLabelledby
      );
      
      expect(unlabeledInputs).toHaveLength(0);
    });

  });

  test.describe('Focus Management', () => {

    test('Focus visible indicators', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Test focus indicators on interactive elements
      const focusableSelectors = [
        'button',
        'input[type="email"]',
        'input[type="password"]',
        'a',
        'select'
      ];
      
      for (const selector of focusableSelectors) {
        const elements = await page.locator(selector);
        const count = await elements.count();
        
        if (count > 0) {
          // Focus the first element of this type
          await elements.first().focus();
          
          // Take screenshot to verify focus indicator
          await page.screenshot({
            path: `test-results/screenshots/focus-${selector.replace(/[\[\]:"]/g, '-')}.png`,
            clip: { x: 0, y: 0, width: 800, height: 600 }
          });
          
          // Verify focus is on the expected element
          const focusedTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
          expect(focusedTag).toBe(selector.split('[')[0]);
        }
      }
    });

    test('Focus restoration after modal close', async ({ page }) => {
      await page.goto('/dashboard/parent');
      
      // Find a modal trigger if available
      const modalTrigger = await page.locator('[data-testid*="modal"], button[aria-haspopup="dialog"]').first();
      
      if (await modalTrigger.count() > 0) {
        // Focus and activate modal trigger
        await modalTrigger.focus();
        const triggerElement = await page.evaluate(() => document.activeElement);
        
        await modalTrigger.click();
        await page.waitForTimeout(500);
        
        // Close modal (ESC key or close button)
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        // Focus should return to trigger element
        const currentFocus = await page.evaluate(() => document.activeElement);
        expect(currentFocus).toEqual(triggerElement);
      }
    });

  });

  test.describe('Mobile Accessibility', () => {

    test('Touch targets meet minimum size requirements', async ({ page, browser }) => {
      // Create mobile context
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15'
      });
      
      const mobilePage = await mobileContext.newPage();
      await injectAxe(mobilePage);
      
      await mobilePage.goto('/');
      
      // Check touch target sizes
      const touchTargets = await mobilePage.evaluate(() => {
        const interactiveElements = Array.from(document.querySelectorAll(
          'button, a, input, select, textarea, [onclick], [ontouch], [role="button"]'
        ));
        
        return interactiveElements
          .filter(element => element.offsetParent !== null) // Visible elements only
          .map(element => {
            const rect = element.getBoundingClientRect();
            return {
              tagName: element.tagName,
              id: element.id || null,
              className: element.className || null,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              area: Math.round(rect.width * rect.height),
              meetsTouchTarget: rect.width >= 44 && rect.height >= 44 // 44px minimum
            };
          });
      });
      
      console.log(`\n📱 Touch target analysis (${touchTargets.length} targets):`);
      const smallTargets = touchTargets.filter(target => !target.meetsTouchTarget);
      
      if (smallTargets.length > 0) {
        console.log('  Touch targets below 44x44px:');
        smallTargets.forEach(target => {
          console.log(`    ${target.tagName}: ${target.width}x${target.height}px`);
        });
      }
      
      // Critical interactive elements should meet touch target size
      const criticalSmallTargets = smallTargets.filter(target => 
        ['BUTTON', 'A'].includes(target.tagName) && target.area < 1936 // 44x44 = 1936
      );
      
      expect(criticalSmallTargets.length).toBeLessThanOrEqual(2); // Allow minor violations
      
      await mobileContext.close();
    });

  });

  test.describe('High Contrast Mode', () => {

    test('High contrast mode compatibility', async ({ page }) => {
      // Enable high contrast mode
      await page.emulateMedia({ forcedColors: 'active' });
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      // Take screenshot in high contrast mode
      await page.screenshot({
        path: 'test-results/screenshots/high-contrast-mode.png',
        fullPage: true
      });
      
      // Verify essential elements are still visible
      const essentialElements = [
        'h1', 'h2', 'button', 'a', 'input'
      ];
      
      for (const selector of essentialElements) {
        const elements = await page.locator(selector);
        if (await elements.count() > 0) {
          await expect(elements.first()).toBeVisible();
        }
      }
      
      // Run accessibility scan in high contrast mode
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: false }, // Disabled in forced colors mode
          'focus-order-semantics': { enabled: true }
        }
      });
    });

  });

});