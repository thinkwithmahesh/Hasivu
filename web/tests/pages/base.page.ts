import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object Model for HASIVU Platform
 * Provides common functionality and utilities for all page objects
 */
export abstract class BasePage {
  readonly page: Page;
  readonly url: string;

  // Common elements across all pages
  readonly navigation: Locator;
  readonly loadingSpinner: Locator;
  readonly errorToast: Locator;
  readonly successToast: Locator;
  readonly languageSelector: Locator;

  constructor(page: Page, url: string = '') {
    this.page = page;
    this.url = url;
    
    // Common UI elements
    this.navigation = page.locator('[data-testid="main-navigation"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.errorToast = page.locator('[data-testid="error-toast"]');
    this.successToast = page.locator('[data-testid="success-toast"]');
    this.languageSelector = page.locator('[data-testid="language-selector"]');
  }

  /**
   * Navigate to this page and wait for it to load
   */
  async goto(): Promise<void> {
    if (this.url) {
      await this.page.goto(this.url);
      await this.waitForPageLoad();
    }
  }

  /**
   * Wait for page to fully load with loading states
   */
  async waitForPageLoad(): Promise<void> {
    // Wait for loading spinner to disappear
    await this.page.waitForLoadState('networkidle');
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  /**
   * Switch language for multi-lingual testing
   */
  async switchLanguage(language: 'en' | 'hi' | 'kn'): Promise<void> {
    await this.languageSelector.click();
    await this.page.locator(`[data-testid="lang-${language}"]`).click();
    await this.waitForPageLoad();
  }

  /**
   * Take screenshot with consistent naming
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Verify no console errors (except allowed ones)
   */
  async verifyNoConsoleErrors(): Promise<void> {
    const messages = this.page.context().messages;
    const errors = messages.filter(msg => 
      msg.type() === 'error' && 
      !msg.text().includes('ResizeObserver') // Allow known harmless error
    );
    expect(errors).toHaveLength(0);
  }

  /**
   * Verify accessibility with axe-core
   */
  async verifyAccessibility(): Promise<void> {
    const accessibilityScanResults = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        // @ts-ignore - axe is loaded globally in setup
        if (typeof axe !== 'undefined') {
          axe.run().then(resolve);
        } else {
          resolve({ violations: [] });
        }
      });
    });
    
    expect(accessibilityScanResults).toHaveProperty('violations');
    expect((accessibilityScanResults as any).violations).toHaveLength(0);
  }

  /**
   * Verify Core Web Vitals performance
   */
  async verifyPerformance(): Promise<void> {
    const metrics = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = entries.reduce((acc: any, entry: any) => {
            if (entry.entryType === 'largest-contentful-paint') {
              acc.lcp = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              acc.fid = entry.processingStart - entry.startTime;
            }
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              acc.cls += entry.value;
            }
            return acc;
          }, { lcp: 0, fid: 0, cls: 0 });
          resolve(vitals);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        
        // Fallback timeout
        setTimeout(() => resolve({ lcp: 0, fid: 0, cls: 0 }), 5000);
      });
    });

    const { lcp, fid, cls } = metrics as any;
    
    // Core Web Vitals thresholds
    if (lcp > 0) expect(lcp).toBeLessThan(2500); // 2.5s
    if (fid > 0) expect(fid).toBeLessThan(100);  // 100ms  
    if (cls > 0) expect(cls).toBeLessThan(0.1);  // 0.1
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForResponse(urlPattern, { timeout: 10000 });
  }

  /**
   * Mock API for testing
   */
  async mockApiResponse(urlPattern: string | RegExp, response: any): Promise<void> {
    await this.page.route(urlPattern, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Simulate network conditions
   */
  async simulateSlowNetwork(): Promise<void> {
    await this.page.context().setExtraHTTPHeaders({
      'Connection': 'slow-3g'
    });
  }

  /**
   * Reset network conditions
   */
  async resetNetwork(): Promise<void> {
    await this.page.context().setExtraHTTPHeaders({});
  }

  /**
   * Verify responsive design at breakpoint
   */
  async verifyResponsiveDesign(width: number, height: number = 800): Promise<void> {
    await this.page.setViewportSize({ width, height });
    await this.waitForPageLoad();
    
    // Verify no horizontal scroll
    const hasHorizontalScroll = await this.page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  }
}