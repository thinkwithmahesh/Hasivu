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
    this.menuTab = page.locator('[data-testid="nav-menu"]');
    this.ordersTab = page.locator('[data-testid="nav-orders"]');
    this.profileTab = page.locator('[data-testid="nav-profile"]');
    this.settingsTab = page.locator('[data-testid="nav-settings"]');
    this.analyticsTab = page.locator('[data-testid="nav-analytics"]');
    this.inventoryTab = page.locator('[data-testid="nav-inventory"]');

    // Dashboard widgets
    this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
    this.quickStats = page.locator('[data-testid="quick-stats"]');
    this.recentOrders = page.locator('[data-testid="recent-orders"]');
    this.menuHighlights = page.locator('[data-testid="menu-highlights"]');
    this.notifications = page.locator('[data-testid="notifications"]');
    this.rfidStatus = page.locator('[data-testid="rfid-status"]');

    // Action buttons
    this.orderNowButton = page.locator('[data-testid="order-now-button"]');
    this.viewMenuButton = page.locator('[data-testid="view-menu-button"]');
    this.trackOrderButton = page.locator('[data-testid="track-order-button"]');
    this.manageInventoryButton = page.locator('[data-testid="manage-inventory-button"]');

    // Student-specific elements
    this.studentElements = {
      mealBalance: page.locator('[data-testid="meal-balance"]'),
      todaysMeal: page.locator('[data-testid="todays-meal"]'),
      nutritionTracker: page.locator('[data-testid="nutrition-tracker"]')
    };

    // Parent-specific elements
    this.parentElements = {
      childSelector: page.locator('[data-testid="child-selector"]'),
      paymentHistory: page.locator('[data-testid="payment-history"]'),
      nutritionReport: page.locator('[data-testid="nutrition-report"]')
    };

    // Admin-specific elements
    this.adminElements = {
      systemStats: page.locator('[data-testid="system-stats"]'),
      userManagement: page.locator('[data-testid="user-management"]'),
      reportsSection: page.locator('[data-testid="reports-section"]')
    };

    // Kitchen-specific elements
    this.kitchenElements = {
      activeOrders: page.locator('[data-testid="active-orders"]'),
      preparationQueue: page.locator('[data-testid="preparation-queue"]'),
      inventoryAlerts: page.locator('[data-testid="inventory-alerts"]')
    };

    // Vendor-specific elements
    this.vendorElements = {
      salesDashboard: page.locator('[data-testid="sales-dashboard"]'),
      productCatalog: page.locator('[data-testid="product-catalog"]'),
      orderRequests: page.locator('[data-testid="order-requests"]')
    };
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
    const welcomeText = await this.welcomeMessage.textContent();
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
    const notificationItem = this.page.locator('[data-testid="notification-item"]').first();
    await expect(notificationItem).toBeVisible();
    await expect(notificationItem).toContainText('ORD-123');
  }

  /**
   * Verify quick stats widgets
   */
  async verifyQuickStats(role: 'student' | 'parent' | 'admin' | 'kitchen' | 'vendor'): Promise<void> {
    await expect(this.quickStats).toBeVisible();
    
    const statItems = this.page.locator('[data-testid="stat-item"]');
    await expect(statItems).toHaveCountGreaterThan(0);
    
    // Role-specific stats verification
    switch (role) {
      case 'student':
        await expect(this.page.locator('[data-testid="stat-orders-this-month"]')).toBeVisible();
        await expect(this.page.locator('[data-testid="stat-favorite-meal"]')).toBeVisible();
        break;
        
      case 'admin':
        await expect(this.page.locator('[data-testid="stat-total-users"]')).toBeVisible();
        await expect(this.page.locator('[data-testid="stat-daily-orders"]')).toBeVisible();
        break;
        
      case 'kitchen':
        await expect(this.page.locator('[data-testid="stat-pending-orders"]')).toBeVisible();
        await expect(this.page.locator('[data-testid="stat-completion-rate"]')).toBeVisible();
        break;
    }
  }

  /**
   * Test dashboard responsiveness
   */
  async testResponsiveDashboard(): Promise<void> {
    const breakpoints = [
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
        const mobileMenu = this.page.locator('[data-testid="mobile-menu-toggle"]');
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
    await expect(this.page.locator('[data-testid="rfid-indicator"]')).toHaveClass(/connected|online/);
  }

  /**
   * Test dashboard data refresh
   */
  async testDataRefresh(): Promise<void> {
    // Initial load
    await this.waitForPageLoad();
    const initialOrderCount = await this.page.locator('[data-testid="order-count"]').textContent();
    
    // Mock updated data
    await this.mockApiResponse(/\/dashboard\/data/, {
      orders_count: parseInt(initialOrderCount || '0') + 1,
      updated_at: new Date().toISOString()
    });
    
    // Trigger manual refresh if available
    const refreshButton = this.page.locator('[data-testid="refresh-button"]');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await this.waitForApiResponse(/\/dashboard\/data/);
      
      // Verify data updated
      const newOrderCount = await this.page.locator('[data-testid="order-count"]').textContent();
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
    const startTime = Date.now();
    
    await this.goto();
    await this.waitForPageLoad();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    
    // Verify Core Web Vitals
    await this.verifyPerformance();
    
    // Test lazy loading of widgets if implemented
    const widgets = await this.page.locator('[data-testid^="widget-"]').count();
    if (widgets > 0) {
      // Scroll to trigger lazy loading
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await this.page.waitForTimeout(1000);
      
      // Verify widgets loaded
      const loadedWidgets = await this.page.locator('[data-testid^="widget-"].loaded').count();
      expect(loadedWidgets).toBeGreaterThan(0);
    }
  }
}