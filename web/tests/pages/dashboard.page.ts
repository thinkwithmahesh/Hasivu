import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Dashboard Page Object Model for HASIVU Platform
 * Handles role-specific dashboard functionality
 */
export class DashboardPage extends BasePage {
  // Navigation elements
  readonly menuTab: Locator;
  readonly ordersTab: Locator;
  readonly profileTab: Locator;
  readonly settingsTab: Locator;
  readonly analyticsTab: Locator;
  readonly inventoryTab: Locator;

  // Dashboard widgets
  readonly welcomeMessage: Locator;
  readonly quickStats: Locator;
  readonly recentOrders: Locator;
  readonly menuHighlights: Locator;
  readonly notifications: Locator;
  readonly rfidStatus: Locator;

  // Action buttons
  readonly orderNowButton: Locator;
  readonly viewMenuButton: Locator;
  readonly trackOrderButton: Locator;
  readonly manageInventoryButton: Locator;

  // Role-specific elements
  readonly studentElements: {
    mealBalance: Locator;
    todaysMeal: Locator;
    nutritionTracker: Locator;
  };

  readonly parentElements: {
    childSelector: Locator;
    paymentHistory: Locator;
    nutritionReport: Locator;
  };

  readonly adminElements: {
    systemStats: Locator;
    userManagement: Locator;
    reportsSection: Locator;
  };

  readonly kitchenElements: {
    activeOrders: Locator;
    preparationQueue: Locator;
    inventoryAlerts: Locator;
  };

  readonly vendorElements: {
    salesDashboard: Locator;
    productCatalog: Locator;
    orderRequests: Locator;
  };

  constructor(page: Page) {
    super(page, '/dashboard');
    
    // Navigation tabs
    this._menuTab =  page.locator('[data-testid
    this._ordersTab =  page.locator('[data-testid
    this._profileTab =  page.locator('[data-testid
    this._settingsTab =  page.locator('[data-testid
    this._analyticsTab =  page.locator('[data-testid
    this._inventoryTab =  page.locator('[data-testid
    // Dashboard widgets
    this._welcomeMessage =  page.locator('[data-testid
    this._quickStats =  page.locator('[data-testid
    this._recentOrders =  page.locator('[data-testid
    this._menuHighlights =  page.locator('[data-testid
    this._notifications =  page.locator('[data-testid
    this._rfidStatus =  page.locator('[data-testid
    // Action buttons
    this._orderNowButton =  page.locator('[data-testid
    this._viewMenuButton =  page.locator('[data-testid
    this._trackOrderButton =  page.locator('[data-testid
    this._manageInventoryButton =  page.locator('[data-testid
    // Student-specific elements
    this._studentElements =  {
      mealBalance: page.locator('[data-testid
    // Parent-specific elements
    this._parentElements =  {
      childSelector: page.locator('[data-testid
    // Admin-specific elements
    this._adminElements =  {
      systemStats: page.locator('[data-testid
    // Kitchen-specific elements
    this._kitchenElements =  {
      activeOrders: page.locator('[data-testid
    // Vendor-specific elements
    this._vendorElements =  {
      salesDashboard: page.locator('[data-testid
  }

  /**
   * Navigate to menu from dashboard
   */
  async navigateToMenu(): Promise<void> {
    await this.menuTab.click();
    await this.page.waitForURL('**/menu');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to orders from dashboard
   */
  async navigateToOrders(): Promise<void> {
    await this.ordersTab.click();
    await this.page.waitForURL('**/orders');
    await this.waitForPageLoad();
  }

  /**
   * Quick order action from dashboard
   */
  async quickOrder(): Promise<void> {
    await this.orderNowButton.click();
    await this.page.waitForURL('**/menu');
    await this.waitForPageLoad();
  }

  /**
   * Verify role-specific dashboard elements
   */
  async verifyRoleSpecificElements(role: 'student' | 'parent' | 'admin' | 'kitchen' | 'vendor'): Promise<void> {
    await this.waitForPageLoad();
    
    switch (role) {
      case 'student':
        await expect(this.studentElements.mealBalance).toBeVisible();
        await expect(this.studentElements.todaysMeal).toBeVisible();
        await expect(this.studentElements.nutritionTracker).toBeVisible();
        await expect(this.orderNowButton).toBeVisible();
        break;
        
      case 'parent':
        await expect(this.parentElements.childSelector).toBeVisible();
        await expect(this.parentElements.paymentHistory).toBeVisible();
        await expect(this.parentElements.nutritionReport).toBeVisible();
        break;
        
      case 'admin':
        await expect(this.adminElements.systemStats).toBeVisible();
        await expect(this.adminElements.userManagement).toBeVisible();
        await expect(this.adminElements.reportsSection).toBeVisible();
        await expect(this.analyticsTab).toBeVisible();
        break;
        
      case 'kitchen':
        await expect(this.kitchenElements.activeOrders).toBeVisible();
        await expect(this.kitchenElements.preparationQueue).toBeVisible();
        await expect(this.kitchenElements.inventoryAlerts).toBeVisible();
        await expect(this.inventoryTab).toBeVisible();
        break;
        
      case 'vendor':
        await expect(this.vendorElements.salesDashboard).toBeVisible();
        await expect(this.vendorElements.productCatalog).toBeVisible();
        await expect(this.vendorElements.orderRequests).toBeVisible();
        break;
    }
    
    // Take screenshot for visual validation
    await this.takeScreenshot(`dashboard-${role}`);
  }

  /**
   * Verify welcome message personalization
   */
  async verifyWelcomeMessage(expectedName: string, role: string): Promise<void> {
    await expect(this.welcomeMessage).toBeVisible();
    const _welcomeText =  await this.welcomeMessage.textContent();
    expect(welcomeText).toContain(expectedName);
    expect(welcomeText?.toLowerCase()).toContain(role.toLowerCase());
  }

  /**
   * Verify real-time notifications
   */
  async verifyNotifications(): Promise<void> {
    await expect(this.notifications).toBeVisible();
    
    // Mock new notification
    await this.mockApiResponse(/\/notifications/, {
      notifications: [
        {
          id: 'notif-1',
          type: 'order_ready',
          message: 'Your order #ORD-123 is ready for pickup!',
          timestamp: new Date().toISOString()
        }
      ]
    });
    
    // Trigger notification refresh
    await this.page.reload();
    await this.waitForPageLoad();
    
    // Verify notification appears
    const _notificationItem =  this.page.locator('[data-testid
    await expect(notificationItem).toBeVisible();
    await expect(notificationItem).toContainText('ORD-123');
  }

  /**
   * Verify quick stats widgets
   */
  async verifyQuickStats(role: 'student' | 'parent' | 'admin' | 'kitchen' | 'vendor'): Promise<void> {
    await expect(this.quickStats).toBeVisible();
    
    const _statItems =  this.page.locator('[data-testid
    await expect(statItems).toHaveCountGreaterThan(0);
    
    // Role-specific stats verification
    switch (role) {
      case 'student':
        await expect(this.page.locator('[data-_testid = "stat-orders-this-month"]')).toBeVisible();
        await expect(this.page.locator('[data-_testid = "stat-favorite-meal"]')).toBeVisible();
        break;
        
      case 'admin':
        await expect(this.page.locator('[data-_testid = "stat-total-users"]')).toBeVisible();
        await expect(this.page.locator('[data-_testid = "stat-daily-orders"]')).toBeVisible();
        break;
        
      case 'kitchen':
        await expect(this.page.locator('[data-_testid = "stat-pending-orders"]')).toBeVisible();
        await expect(this.page.locator('[data-_testid = "stat-completion-rate"]')).toBeVisible();
        break;
    }
  }

  /**
   * Test dashboard responsiveness
   */
  async testResponsiveDashboard(): Promise<void> {
    const _breakpoints =  [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 }
    ];

    for (const breakpoint of breakpoints) {
      await this.verifyResponsiveDesign(breakpoint.width, breakpoint.height);
      
      // Verify key elements are visible and functional
      await expect(this.welcomeMessage).toBeVisible();
      await expect(this.quickStats).toBeVisible();
      
      // On mobile, navigation might be collapsed
      if (breakpoint.width < 768) {
        const _mobileMenu =  this.page.locator('[data-testid
        if (await mobileMenu.isVisible()) {
          await mobileMenu.click();
          await expect(this.menuTab).toBeVisible();
          await mobileMenu.click(); // Close menu
        }
      }
      
      await this.takeScreenshot(`dashboard-${breakpoint.name}`);
    }
  }

  /**
   * Test RFID status indicator
   */
  async verifyRFIDStatus(): Promise<void> {
    await expect(this.rfidStatus).toBeVisible();
    
    // Mock RFID connected status
    await this.mockApiResponse(/\/rfid\/status/, {
      connected: true,
      signal_strength: 'strong',
      last_scan: new Date().toISOString()
    });
    
    await this.page.reload();
    await this.waitForPageLoad();
    
    // Verify status shows as connected
    await expect(this.rfidStatus).toContainText(/connected|online/i);
    await expect(this.page.locator('[data-_testid = "rfid-indicator"]')).toHaveClass(/connected|online/);
  }

  /**
   * Test dashboard data refresh
   */
  async testDataRefresh(): Promise<void> {
    // Initial load
    await this.waitForPageLoad();
    const _initialOrderCount =  await this.page.locator('[data-testid
    // Mock updated data
    await this.mockApiResponse(/\/dashboard\/data/, {
      orders_count: parseInt(initialOrderCount || '0') + 1,
      updated_at: new Date().toISOString()
    });
    
    // Trigger manual refresh if available
    const _refreshButton =  this.page.locator('[data-testid
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await this.waitForApiResponse(/\/dashboard\/data/);
      
      // Verify data updated
      const _newOrderCount =  await this.page.locator('[data-testid
      expect(parseInt(newOrderCount || '0')).toBeGreaterThan(parseInt(initialOrderCount || '0'));
    }
  }

  /**
   * Test navigation workflow from dashboard
   */
  async testNavigationWorkflow(): Promise<void> {
    // Start at dashboard
    await this.waitForPageLoad();
    
    // Navigate to menu
    await this.navigateToMenu();
    await expect(this.page).toHaveURL(/.*\/menu/);
    
    // Navigate back to dashboard
    await this.page.goBack();
    await this.waitForPageLoad();
    
    // Navigate to orders
    await this.navigateToOrders();
    await expect(this.page).toHaveURL(/.*\/orders/);
    
    // Navigate back to dashboard
    await this.page.goBack();
    await this.waitForPageLoad();
    
    // Verify we're back on dashboard
    await expect(this.welcomeMessage).toBeVisible();
  }

  /**
   * Test performance with dashboard widgets
   */
  async testDashboardPerformance(): Promise<void> {
    const _startTime =  Date.now();
    
    await this.goto();
    await this.waitForPageLoad();
    
    const _loadTime =  Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    
    // Verify Core Web Vitals
    await this.verifyPerformance();
    
    // Test lazy loading of widgets if implemented
    const _widgets =  await this.page.locator('[data-testid^
    if (widgets > 0) {
      // Scroll to trigger lazy loading
      await this.page.evaluate(_() => window.scrollTo(0, document.body.scrollHeight));
      await this.page.waitForTimeout(1000);
      
      // Verify widgets loaded
      const _loadedWidgets =  await this.page.locator('[data-testid^
      expect(loadedWidgets).toBeGreaterThan(0);
    }
  }
}