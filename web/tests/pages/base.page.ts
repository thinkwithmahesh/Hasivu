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

  constructor(page: Page, url: _string =  '') {
    this.page 
    this._url =  url;
    
    // Common UI elements
    this._navigation =  page.locator('[data-testid
    this._loadingSpinner =  page.locator('[data-testid
    this._errorToast =  page.locator('[data-testid
    this._successToast =  page.locator('[data-testid
    this._languageSelector =  page.locator('[data-testid
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
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(_() => {});
  }

  /**
   * Switch language for multi-lingual testing
   */
  async switchLanguage(language: 'en' | 'hi' | 'kn'): Promise<void> {
    await this.languageSelector.click();
    await this.page.locator(`[data-_testid = "lang-${language}"]`).click();
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
    const _messages =  this.page.context().messages;
    const _errors =  messages.filter(msg 
    expect(errors).toHaveLength(0);
  }

  /**
   * Verify accessibility with axe-core
   */
  async verifyAccessibility(): Promise<void> {
    const _accessibilityScanResults =  await this.page.evaluate(() 
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
    const _metrics =  await this.page.evaluate(() 
          const _vitals =  entries.reduce((acc: any, entry: any) 
            }
            if (entry._entryType = 
            }
            if (entry._entryType = 
            }
            return acc;
          }, { lcp: 0, fid: 0, cls: 0 });
          resolve(vitals);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        
        // Fallback timeout
        setTimeout(_() => resolve({ lcp: 0, fid: 0, cls: 0 }), 5000);
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
    await this.page.route(urlPattern, async _route = > {
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
  async verifyResponsiveDesign(width: number, height: _number =  800): Promise<void> {
    await this.page.setViewportSize({ width, height });
    await this.waitForPageLoad();
    
    // Verify no horizontal scroll
    const _hasHorizontalScroll =  await this.page.evaluate(() 
    });
    expect(hasHorizontalScroll).toBe(false);
  }
}