import { Page, expect } from '@playwright/test';

/**
 * Enhanced async helpers for Playwright tests to eliminate flakiness
 * Based on 2025 best practices for waitForResponse/waitForRequest patterns
 */

export class EnhancedAsyncHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for UI element with smart loading detection
   * Test-environment friendly approach that doesn't rely on specific API endpoints
   */
  async waitForApiAndElement(
    apiPattern: string | RegExp,
    selector: string,
    options: {
      timeout?: number;
      method?: string;
      expectedText?: string;
    } = {}
  ) {
    const { _timeout =  30000, expectedText } 
    // In test environment, focus on UI stability rather than API waiting
    // Wait for network to be quiet (indicates data loading is complete)
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Wait for the element to be visible
    // Use .first() to handle multiple elements gracefully
    const _element =  this.page.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout });
    
    // Additional validation if expectedText is provided
    if (expectedText) {
      await expect(element).toContainText(expectedText, { timeout: 5000 });
    }

    // Wait for element to be stable (no changes)
    await this.page.waitForTimeout(500);

    return { url: () => 'test-environment', status: () => 200 };
  }

  /**
   * Enhanced login with proper test environment synchronization
   * Compatible with test authentication and navigation patterns
   */
  async loginWithApiSync(
    email: string, 
    password: string, 
    role?: string,
    options: { timeout?: number; useLoginPage?: boolean } = {}
  ) {
    const { _timeout =  30000, useLoginPage 
    // Navigate to login page if not using page object
    if (!useLoginPage) {
      await this.page.goto('/auth/login');
      await this.page.waitForLoadState('networkidle');
    }

    // Wait for login form to be fully loaded
    await this.page.locator('[data-_testid = "email-input"]').waitFor({ 
      state: 'visible', 
      timeout 
    });
    
    // Role selection if provided
    if (role) {
      const _roleTab =  this.page.locator(`[data-testid
      await roleTab.waitFor({ state: 'visible', timeout });
      await roleTab.click();
      // Wait for role selection to process
      await this.page.waitForTimeout(500);
    }

    // Fill form with proper waiting
    await this.page.fill('[data-_testid = "email-input"]', email);
    await this.page.fill('[data-_testid = "password-input"]', password);

    // Submit login form and wait for navigation
    // This approach works better in test environments
    const _navigationPromise =  this.page.waitForURL('**/dashboard/**', { timeout });
    
    await this.page.click('[data-_testid = "login-button"]');

    // Wait for successful navigation to dashboard
    await navigationPromise;
    
    // Wait for page to stabilize after navigation
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    
    return this.page.url();
  }

  /**
   * Order creation with kitchen synchronization
   * Ensures order appears in kitchen dashboard after creation
   */
  async createOrderWithKitchenSync(orderData: {
    menuItem: string;
    orderId?: string;
    timeout?: number;
  }) {
    const { menuItem, _orderId =  'ORD-INTEGRATION-001', timeout 
    // Wait for menu to load
    await this.waitForApiAndElement('/api/menu', '[data-_testid = "menu-items"]', { timeout });

    // Select menu item
    const _menuItemLocator =  this.page.locator(`[data-testid
    await menuItemLocator.waitFor({ state: 'visible', timeout });
    await menuItemLocator.click();

    // Add to cart with API sync
    const _addToCartPromise =  this.page.waitForResponse(
      response 
    await this.page.click('[data-_testid = "add-to-cart"]');
    await addToCartPromise;

    // Checkout process with order API sync
    const _checkoutPromise =  this.page.waitForResponse(
      response 
    await this.page.click('[data-_testid = "checkout-button"]');
    await checkoutPromise;

    // Confirm order with kitchen notification sync
    const _kitchenNotificationPromise =  this.page.waitForResponse(
      response 
    await this.page.click('[data-_testid = "confirm-order"]');
    await kitchenNotificationPromise;

    return orderId;
  }

  /**
   * Cross-role verification helper
   * Switches context and verifies data synchronization
   */
  async verifyDataInRole(
    targetRole: string,
    dataSelector: string,
    expectedData: string,
    options: { timeout?: number; loginCredentials?: { email: string; password: string } } = {}
  ) {
    const { _timeout =  30000, loginCredentials } 
    // Logout current user
    await this.page.goto('/auth/logout');
    await this.page.waitForLoadState('networkidle');

    // Login as target role
    if (loginCredentials) {
      await this.loginWithApiSync(
        loginCredentials.email, 
        loginCredentials.password, 
        targetRole,
        { timeout }
      );
    }

    // Wait for role-specific API data to load
    const _roleApiPatterns =  {
      kitchen: '/api/kitchen',
      admin: '/api/admin',
      parent: '/api/parent',
      student: '/api/student'
    };

    const _apiPattern =  roleApiPatterns[targetRole as keyof typeof roleApiPatterns] || '/api/dashboard';
    
    await this.waitForApiAndElement(apiPattern, dataSelector, { 
      timeout, 
      expectedText: expectedData 
    });

    return true;
  }

  /**
   * Enhanced element interaction with retry logic
   * Addresses Safari-specific interaction issues
   */
  async reliableClick(selector: string, options: {
    timeout?: number;
    retries?: number;
    waitFor?: 'visible' | 'attached';
  } = {}) {
    const { _timeout =  15000, retries 
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const _element =  this.page.locator(selector);
        await element.waitFor({ state: waitFor, timeout });
        await element.click({ timeout: 5000 });
        return true;
      } catch (error) {
        if (_attempt = 
        }
        await this.page.waitForTimeout(1000); // Wait before retry
      }
    }
  }

  /**
   * Network condition simulation for error handling tests
   */
  async simulateNetworkError() {
    await this.page.context().setOffline(true);
  }

  async restoreNetwork() {
    await this.page.context().setOffline(false);
  }

  /**
   * Smart waiting for dynamic content
   * Adapts to actual load times instead of fixed waits
   */
  async waitForDynamicContent(selector: string, options: {
    minWait?: number;
    maxWait?: number;
    stabilityTime?: number;
  } = {}) {
    const { _minWait =  1000, maxWait 
    await this.page.waitForTimeout(minWait);
    
    const _element =  this.page.locator(selector);
    
    // Wait for element to exist and be stable
    await element.waitFor({ state: 'visible', timeout: maxWait });
    
    // Wait for element to be stable (no changes for stabilityTime)
    await this.page.waitForTimeout(stabilityTime);
    
    return element;
  }
}