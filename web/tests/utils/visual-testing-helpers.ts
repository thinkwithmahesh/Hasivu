import { Page, expect, Locator } from '@playwright/test';
import { BRAND_COLORS, ACCESSIBILITY_STANDARDS, RESPONSIVE_BREAKPOINTS } from './brand-constants';

/**
 * Visual Testing Helpers for HASIVU Enterprise Framework
 * 
 * Features:
 * - Brand color validation
 * - Responsive design testing
 * - Accessibility compliance checking
 * - Percy integration utilities
 * - Component state testing
 */

export class VisualTestingHelpers {
  constructor(private page: Page) {}

  /**
   * Validate brand colors are applied correctly
   */
  async validateBrandColors(element: Locator, expectedColors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  }) {
    const computedStyle = await element.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderColor: style.borderColor,
      };
    });

    if (expectedColors?.primary) {
      expect(computedStyle.backgroundColor).toContain(expectedColors.primary);
    }
    if (expectedColors?.text) {
      expect(computedStyle.color).toContain(expectedColors.text);
    }
  }

  /**
   * Test component across different viewport sizes
   */
  async testResponsiveDesign(component: Locator, testName: string) {
    const viewports = [
      { name: 'mobile', ...RESPONSIVE_BREAKPOINTS.mobile },
      { name: 'tablet', ...RESPONSIVE_BREAKPOINTS.tablet },
      { name: 'desktop', ...RESPONSIVE_BREAKPOINTS.desktop },
      { name: 'desktop-large', ...RESPONSIVE_BREAKPOINTS.desktopLarge },
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      
      // Wait for responsive changes to take effect
      await this.page.waitForTimeout(300);
      
      // Take screenshot for visual regression
      await expect(component).toHaveScreenshot(
        `${testName}-${viewport.name}.png`,
        {
          threshold: 0.2,
          animations: 'disabled',
        }
      );
    }
  }

  /**
   * Validate accessibility compliance
   */
  async validateAccessibility(element: Locator) {
    // Check contrast ratios
    const contrastRatio = await element.evaluate((el) => {
      const style = window.getComputedStyle(el);
      // This is a simplified contrast check - in real tests use axe-core
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
      };
    });

    // Check focus indicators
    await element.focus();
    await expect(element).toHaveCSS('outline-width', ACCESSIBILITY_STANDARDS.focusIndicators.outlineWidth);
    
    // Check minimum touch targets (for interactive elements)
    const boundingBox = await element.boundingBox();
    if (boundingBox) {
      expect(boundingBox.width).toBeGreaterThanOrEqual(44); // 44px minimum
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
    }
  }

  /**
   * Test component states (hover, focus, active, disabled)
   */
  async testComponentStates(element: Locator, testName: string, states: string[] = ['default', 'hover', 'focus', 'disabled']) {
    for (const state of states) {
      switch (state) {
        case 'hover':
          await element.hover();
          break;
        case 'focus':
          await element.focus();
          break;
        case 'active':
          await element.click({ position: { x: 0, y: 0 } });
          break;
        case 'disabled':
          await element.evaluate((el: any) => {
            el.disabled = true;
          });
          break;
      }
      
      await expect(element).toHaveScreenshot(`${testName}-${state}.png`, {
        threshold: 0.2,
        animations: 'disabled',
      });
    }
  }

  /**
   * Validate RFID component visual states
   */
  async testRfidStates(rfidComponent: Locator, testName: string) {
    const states = [
      { class: 'idle', color: BRAND_COLORS.secondary.slate400 },
      { class: 'scanning', color: BRAND_COLORS.primary.vibrantBlue },
      { class: 'success', color: BRAND_COLORS.primary.deepGreen },
      { class: 'error', color: BRAND_COLORS.semantic.error },
      { class: 'pending', color: BRAND_COLORS.semantic.warning },
    ];

    for (const state of states) {
      await rfidComponent.evaluate((el: any, stateClass) => {
        el.className = `rfid-scanner rfid-${stateClass}`;
      }, state.class);
      
      await expect(rfidComponent).toHaveScreenshot(`${testName}-rfid-${state.class}.png`);
      
      // Validate state color
      await this.validateBrandColors(rfidComponent, {
        primary: state.color,
      });
    }
  }

  /**
   * Test role-based UI variations
   */
  async testRoleBasedUI(container: Locator, role: string, testName: string) {
    const roleColor = BRAND_COLORS.roles[role as keyof typeof BRAND_COLORS.roles];
    
    // Apply role-specific styling
    await container.evaluate((el: any, roleClass) => {
      el.classList.add(`role-${roleClass}`);
    }, role);
    
    await expect(container).toHaveScreenshot(`${testName}-role-${role}.png`);
    
    // Validate role color is applied
    const roleIndicator = container.locator('[data-role-indicator]');
    if (await roleIndicator.count() > 0) {
      await this.validateBrandColors(roleIndicator, {
        primary: roleColor,
      });
    }
  }

  /**
   * Comprehensive page screenshot with brand validation
   */
  async takeFullPageScreenshot(pageName: string, options?: {
    excludeSelectors?: string[];
    mask?: string[];
    threshold?: number;
  }) {
    const { excludeSelectors = [], mask = [], threshold = 0.2 } = options || {};
    
    // Hide dynamic content
    for (const selector of excludeSelectors) {
      await this.page.locator(selector).evaluateAll((elements) => {
        elements.forEach((el: any) => {
          el.style.display = 'none';
        });
      });
    }
    
    // Mask sensitive content
    const maskLocators = mask.map(selector => this.page.locator(selector));
    
    await expect(this.page).toHaveScreenshot(`${pageName}-full-page.png`, {
      fullPage: true,
      threshold,
      mask: maskLocators,
      animations: 'disabled',
    });
  }

  /**
   * Validate loading states and animations
   */
  async testLoadingStates(component: Locator, testName: string) {
    // Test skeleton loading state
    await component.evaluate((el: any) => {
      el.classList.add('loading', 'skeleton');
    });
    await expect(component).toHaveScreenshot(`${testName}-loading-skeleton.png`);
    
    // Test spinner loading state
    await component.evaluate((el: any) => {
      el.classList.remove('skeleton');
      el.classList.add('spinner');
    });
    await expect(component).toHaveScreenshot(`${testName}-loading-spinner.png`);
    
    // Test loaded state
    await component.evaluate((el: any) => {
      el.classList.remove('loading', 'spinner');
      el.classList.add('loaded');
    });
    await expect(component).toHaveScreenshot(`${testName}-loaded.png`);
  }

  /**
   * Test theme variations (light/dark mode)
   */
  async testThemeVariations(container: Locator, testName: string) {
    const themes = ['light', 'dark'];
    
    for (const theme of themes) {
      await this.page.evaluate((themeValue) => {
        document.documentElement.setAttribute('data-theme', themeValue);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(themeValue);
      }, theme);
      
      await this.page.waitForTimeout(500); // Allow theme transition
      
      await expect(container).toHaveScreenshot(`${testName}-theme-${theme}.png`, {
        threshold: 0.3, // Higher threshold for theme variations
      });
    }
  }

  /**
   * Validate component spacing and layout
   */
  async validateComponentSpacing(component: Locator, expectedSpacing: {
    padding?: string;
    margin?: string;
    gap?: string;
  }) {
    const computedStyle = await component.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        paddingTop: style.paddingTop,
        paddingRight: style.paddingRight,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
        marginTop: style.marginTop,
        marginRight: style.marginRight,
        marginBottom: style.marginBottom,
        marginLeft: style.marginLeft,
        gap: style.gap,
      };
    });

    if (expectedSpacing.padding) {
      const expectedPx = expectedSpacing.padding;
      expect(computedStyle.paddingTop).toBe(expectedPx);
      expect(computedStyle.paddingRight).toBe(expectedPx);
      expect(computedStyle.paddingBottom).toBe(expectedPx);
      expect(computedStyle.paddingLeft).toBe(expectedPx);
    }

    if (expectedSpacing.gap) {
      expect(computedStyle.gap).toBe(expectedSpacing.gap);
    }
  }

  /**
   * Test animation performance and smoothness
   */
  async testAnimationPerformance(animatedElement: Locator, animationTrigger: () => Promise<void>) {
    // Start performance monitoring
    await this.page.evaluate(() => {
      (window as any).animationMetrics = [];
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (window as any).animationMetrics.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }
      });
      observer.observe({ entryTypes: ['measure'] });
    });

    // Trigger animation
    await animationTrigger();
    
    // Wait for animation to complete
    await this.page.waitForTimeout(1000);
    
    // Get performance metrics
    const metrics = await this.page.evaluate(() => (window as any).animationMetrics);
    
    // Validate animation performance
    expect(metrics).toBeDefined();
    if (metrics.length > 0) {
      const avgDuration = metrics.reduce((sum: number, metric: any) => sum + metric.duration, 0) / metrics.length;
      expect(avgDuration).toBeLessThan(16.67); // 60fps = 16.67ms per frame
    }
  }

  /**
   * Comprehensive visual regression test suite
   */
  async runVisualRegressionSuite(component: Locator, testName: string, options?: {
    testStates?: boolean;
    testResponsive?: boolean;
    testThemes?: boolean;
    testRoles?: string[];
  }) {
    const {
      testStates = true,
      testResponsive = true,
      testThemes = false,
      testRoles = [],
    } = options || {};

    // Base screenshot
    await expect(component).toHaveScreenshot(`${testName}-base.png`);

    // Test component states
    if (testStates) {
      await this.testComponentStates(component, testName);
    }

    // Test responsive design
    if (testResponsive) {
      await this.testResponsiveDesign(component, testName);
    }

    // Test theme variations
    if (testThemes) {
      await this.testThemeVariations(component, testName);
    }

    // Test role-based variations
    for (const role of testRoles) {
      await this.testRoleBasedUI(component, role, testName);
    }

    // Reset to original state
    await this.page.setViewportSize(RESPONSIVE_BREAKPOINTS.desktop);
    await this.page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.className = 'light';
    });
  }
}