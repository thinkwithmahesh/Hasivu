import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';
import { MenuCardPage } from '../components/menu-card.page';
import { OrderStatusTrackerPage } from '../components/order-status-tracker.page';

/**
 * Page Object Model for Student Dashboard
 * 
 * Comprehensive interface for student dashboard functionality including
 * balance management, order history, meal planning, and notifications
 */
export class StudentDashboardPage extends BasePage {
  // Main dashboard container
  private readonly dashboard: Locator;
  
  // Header and navigation
  private readonly welcomeMessage: Locator;
  private readonly studentName: Locator;
  private readonly studentClass: Locator;
  private readonly profilePicture: Locator;
  private readonly navigationMenu: Locator;
  
  // Balance and wallet section
  private readonly balanceSection: Locator;
  private readonly mealBalance: Locator;
  private readonly walletBalance: Locator;
  private readonly topUpButton: Locator;
  private readonly balanceHistory: Locator;
  private readonly lowBalanceAlert: Locator;
  
  // Quick actions
  private readonly quickActionsSection: Locator;
  private readonly orderMealButton: Locator;
  private readonly viewMenuButton: Locator;
  private readonly trackOrderButton: Locator;
  private readonly viewHistoryButton: Locator;
  
  // Today's menu preview
  private readonly todayMenuSection: Locator;
  private readonly menuPreviewCards: Locator;
  private readonly menuCarousel: Locator;
  private readonly nextMenuButton: Locator;
  private readonly prevMenuButton: Locator;
  
  // Active orders section
  private readonly activeOrdersSection: Locator;
  private readonly activeOrdersList: Locator;
  private readonly noActiveOrdersMessage: Locator;
  
  // Notifications section
  private readonly notificationsSection: Locator;
  private readonly notificationsList: Locator;
  private readonly unreadNotificationsCount: Locator;
  private readonly markAllReadButton: Locator;
  private readonly clearAllButton: Locator;
  
  // Recent activity
  private readonly recentActivitySection: Locator;
  private readonly activityTimeline: Locator;
  private readonly activityItems: Locator;
  
  // Meal preferences
  private readonly preferencesSection: Locator;
  private readonly dietaryPreferences: Locator;
  private readonly allergenInfo: Locator;
  private readonly preferencesButton: Locator;
  
  // Statistics and insights
  private readonly statsSection: Locator;
  private readonly monthlySpending: Locator;
  private readonly favoriteMeals: Locator;
  private readonly orderFrequency: Locator;
  
  // RFID card management
  private readonly rfidSection: Locator;
  private readonly rfidCardNumber: Locator;
  private readonly rfidStatus: Locator;
  private readonly reportCardButton: Locator;
  
  // Parent communication
  private readonly parentSection: Locator;
  private readonly parentMessages: Locator;
  private readonly parentNotifications: Locator;
  
  constructor(page: Page) {
    super(page);
    
    this.dashboard = this.page.locator('[data-testid="student-dashboard"]');
    
    // Header and navigation
    this.welcomeMessage = this.dashboard.locator('[data-testid="welcome-message"]');
    this.studentName = this.dashboard.locator('[data-testid="student-name"]');
    this.studentClass = this.dashboard.locator('[data-testid="student-class"]');
    this.profilePicture = this.dashboard.locator('[data-testid="profile-picture"]');
    this.navigationMenu = this.dashboard.locator('[data-testid="navigation-menu"]');
    
    // Balance section
    this.balanceSection = this.dashboard.locator('[data-testid="balance-section"]');
    this.mealBalance = this.balanceSection.locator('[data-testid="meal-balance"]');
    this.walletBalance = this.balanceSection.locator('[data-testid="wallet-balance"]');
    this.topUpButton = this.balanceSection.locator('[data-testid="top-up-button"]');
    this.balanceHistory = this.balanceSection.locator('[data-testid="balance-history"]');
    this.lowBalanceAlert = this.balanceSection.locator('[data-testid="low-balance-alert"]');
    
    // Quick actions
    this.quickActionsSection = this.dashboard.locator('[data-testid="quick-actions"]');
    this.orderMealButton = this.quickActionsSection.locator('[data-testid="order-meal-button"]');
    this.viewMenuButton = this.quickActionsSection.locator('[data-testid="view-menu-button"]');
    this.trackOrderButton = this.quickActionsSection.locator('[data-testid="track-order-button"]');
    this.viewHistoryButton = this.quickActionsSection.locator('[data-testid="view-history-button"]');
    
    // Today's menu
    this.todayMenuSection = this.dashboard.locator('[data-testid="today-menu-section"]');
    this.menuPreviewCards = this.todayMenuSection.locator('[data-testid="menu-preview-card"]');
    this.menuCarousel = this.todayMenuSection.locator('[data-testid="menu-carousel"]');
    this.nextMenuButton = this.menuCarousel.locator('[data-testid="next-menu-button"]');
    this.prevMenuButton = this.menuCarousel.locator('[data-testid="prev-menu-button"]');
    
    // Active orders
    this.activeOrdersSection = this.dashboard.locator('[data-testid="active-orders-section"]');
    this.activeOrdersList = this.activeOrdersSection.locator('[data-testid="active-orders-list"]');
    this.noActiveOrdersMessage = this.activeOrdersSection.locator('[data-testid="no-active-orders"]');
    
    // Notifications
    this.notificationsSection = this.dashboard.locator('[data-testid="notifications-section"]');
    this.notificationsList = this.notificationsSection.locator('[data-testid="notifications-list"]');
    this.unreadNotificationsCount = this.notificationsSection.locator('[data-testid="unread-count"]');
    this.markAllReadButton = this.notificationsSection.locator('[data-testid="mark-all-read"]');
    this.clearAllButton = this.notificationsSection.locator('[data-testid="clear-all"]');
    
    // Recent activity
    this.recentActivitySection = this.dashboard.locator('[data-testid="recent-activity-section"]');
    this.activityTimeline = this.recentActivitySection.locator('[data-testid="activity-timeline"]');
    this.activityItems = this.activityTimeline.locator('[data-testid="activity-item"]');
    
    // Preferences
    this.preferencesSection = this.dashboard.locator('[data-testid="preferences-section"]');
    this.dietaryPreferences = this.preferencesSection.locator('[data-testid="dietary-preferences"]');
    this.allergenInfo = this.preferencesSection.locator('[data-testid="allergen-info"]');
    this.preferencesButton = this.preferencesSection.locator('[data-testid="edit-preferences-button"]');
    
    // Statistics
    this.statsSection = this.dashboard.locator('[data-testid="stats-section"]');
    this.monthlySpending = this.statsSection.locator('[data-testid="monthly-spending"]');
    this.favoriteMeals = this.statsSection.locator('[data-testid="favorite-meals"]');
    this.orderFrequency = this.statsSection.locator('[data-testid="order-frequency"]');
    
    // RFID card
    this.rfidSection = this.dashboard.locator('[data-testid="rfid-section"]');
    this.rfidCardNumber = this.rfidSection.locator('[data-testid="rfid-card-number"]');
    this.rfidStatus = this.rfidSection.locator('[data-testid="rfid-status"]');
    this.reportCardButton = this.rfidSection.locator('[data-testid="report-card-button"]');
    
    // Parent communication
    this.parentSection = this.dashboard.locator('[data-testid="parent-section"]');
    this.parentMessages = this.parentSection.locator('[data-testid="parent-messages"]');
    this.parentNotifications = this.parentSection.locator('[data-testid="parent-notifications"]');
  }

  /**
   * Dashboard Navigation Methods
   */
  
  async waitForDashboardToLoad(): Promise<void> {
    await this.dashboard.waitFor({ state: 'visible' });
    await this.waitForLoadingToComplete();
    // Wait for balance to load
    await this.mealBalance.waitFor({ state: 'visible' });
  }
  
  async isDashboardVisible(): Promise<boolean> {
    return await this.dashboard.isVisible();
  }
  
  /**
   * Student Information Methods
   */
  
  async getStudentName(): Promise<string> {
    return await this.studentName.textContent() || '';
  }
  
  async getStudentClass(): Promise<string> {
    return await this.studentClass.textContent() || '';
  }
  
  async getWelcomeMessage(): Promise<string> {
    return await this.welcomeMessage.textContent() || '';
  }
  
  async isProfilePictureVisible(): Promise<boolean> {
    return await this.profilePicture.isVisible();
  }
  
  /**
   * Balance Management Methods
   */
  
  async getMealBalance(): Promise<number> {
    const balanceText = await this.mealBalance.textContent() || '₹0';
    return parseFloat(balanceText.replace('₹', ''));
  }
  
  async getWalletBalance(): Promise<number> {
    const balanceText = await this.walletBalance.textContent() || '₹0';
    return parseFloat(balanceText.replace('₹', ''));
  }
  
  async hasLowBalanceAlert(): Promise<boolean> {
    return await this.lowBalanceAlert.isVisible();
  }
  
  async getLowBalanceAlertMessage(): Promise<string> {
    return await this.lowBalanceAlert.textContent() || '';
  }
  
  async clickTopUpButton(): Promise<void> {
    await this.topUpButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async isTopUpButtonVisible(): Promise<boolean> {
    return await this.topUpButton.isVisible();
  }
  
  async viewBalanceHistory(): Promise<void> {
    await this.balanceHistory.click();
    await this.waitForLoadingToComplete();
  }
  
  /**
   * Quick Actions Methods
   */
  
  async orderMeal(): Promise<void> {
    await this.orderMealButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async viewTodayMenu(): Promise<void> {
    await this.viewMenuButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async trackActiveOrder(): Promise<void> {
    await this.trackOrderButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async viewOrderHistory(): Promise<void> {
    await this.viewHistoryButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async areQuickActionsVisible(): Promise<boolean> {
    return await this.quickActionsSection.isVisible();
  }
  
  async isTrackOrderButtonEnabled(): Promise<boolean> {
    return await this.trackOrderButton.isEnabled();
  }
  
  /**
   * Menu Preview Methods
   */
  
  async getMenuPreviewCount(): Promise<number> {
    const previewCards = await this.menuPreviewCards.all();
    return previewCards.length;
  }
  
  async getMenuPreviewItem(index: number): MenuCardPage {
    const menuCard = await this.menuPreviewCards.nth(index);
    const menuId = await menuCard.getAttribute('data-menu-id') || '';
    return new MenuCardPage(this.page, menuId);
  }
  
  async navigateMenuCarousel(direction: 'next' | 'prev'): Promise<void> {
    const button = direction === 'next' ? this.nextMenuButton : this.prevMenuButton;
    await button.click();
    await this.page.waitForTimeout(500); // Wait for carousel animation
  }
  
  async isMenuCarouselVisible(): Promise<boolean> {
    return await this.menuCarousel.isVisible();
  }
  
  async canNavigateMenuCarousel(direction: 'next' | 'prev'): Promise<boolean> {
    const button = direction === 'next' ? this.nextMenuButton : this.prevMenuButton;
    return await button.isEnabled();
  }
  
  /**
   * Active Orders Methods
   */
  
  async hasActiveOrders(): Promise<boolean> {
    return await this.activeOrdersList.isVisible() && 
           !await this.noActiveOrdersMessage.isVisible();
  }
  
  async getActiveOrdersCount(): Promise<number> {
    if (!await this.hasActiveOrders()) return 0;
    
    const orderItems = await this.activeOrdersList.locator('[data-testid="active-order-item"]').all();
    return orderItems.length;
  }
  
  async getActiveOrderTracker(orderId: string): OrderStatusTrackerPage {
    return new OrderStatusTrackerPage(this.page, orderId);
  }
  
  async clickActiveOrder(orderId: string): Promise<void> {
    const orderItem = this.activeOrdersList.locator(`[data-testid="active-order-${orderId}"]`);
    await orderItem.click();
    await this.waitForLoadingToComplete();
  }
  
  async getNoActiveOrdersMessage(): Promise<string> {
    return await this.noActiveOrdersMessage.textContent() || '';
  }
  
  /**
   * Notifications Methods
   */
  
  async getUnreadNotificationsCount(): Promise<number> {
    const countText = await this.unreadNotificationsCount.textContent() || '0';
    return parseInt(countText);
  }
  
  async hasUnreadNotifications(): Promise<boolean> {
    return await this.getUnreadNotificationsCount() > 0;
  }
  
  async getNotificationsCount(): Promise<number> {
    const notifications = await this.notificationsList.locator('[data-testid="notification-item"]').all();
    return notifications.length;
  }
  
  async getNotification(index: number): Promise<{
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }> {
    const notification = this.notificationsList.locator('[data-testid="notification-item"]').nth(index);
    
    const title = await notification.locator('[data-testid="notification-title"]').textContent() || '';
    const message = await notification.locator('[data-testid="notification-message"]').textContent() || '';
    const timestamp = await notification.locator('[data-testid="notification-timestamp"]').textContent() || '';
    const isRead = !(await notification.locator('[data-testid="unread-indicator"]').isVisible());
    
    return { title, message, timestamp, read: isRead };
  }
  
  async markAllNotificationsRead(): Promise<void> {
    await this.markAllReadButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async clearAllNotifications(): Promise<void> {
    await this.clearAllButton.click();
    // Wait for confirmation dialog
    await this.page.waitForSelector('[data-testid="clear-notifications-confirmation"]', { state: 'visible' });
  }
  
  async clickNotification(index: number): Promise<void> {
    const notification = this.notificationsList.locator('[data-testid="notification-item"]').nth(index);
    await notification.click();
    await this.waitForLoadingToComplete();
  }
  
  /**
   * Recent Activity Methods
   */
  
  async getRecentActivityCount(): Promise<number> {
    const activities = await this.activityItems.all();
    return activities.length;
  }
  
  async getRecentActivity(index: number): Promise<{
    type: string;
    description: string;
    timestamp: string;
    amount?: number;
  }> {
    const activity = this.activityItems.nth(index);
    
    const type = await activity.getAttribute('data-activity-type') || '';
    const description = await activity.locator('[data-testid="activity-description"]').textContent() || '';
    const timestamp = await activity.locator('[data-testid="activity-timestamp"]').textContent() || '';
    
    const amountElement = activity.locator('[data-testid="activity-amount"]');
    let amount: number | undefined;
    
    if (await amountElement.isVisible()) {
      const amountText = await amountElement.textContent() || '₹0';
      amount = parseFloat(amountText.replace('₹', ''));
    }
    
    return { type, description, timestamp, amount };
  }
  
  async isRecentActivityVisible(): Promise<boolean> {
    return await this.recentActivitySection.isVisible();
  }
  
  /**
   * Preferences Methods
   */
  
  async getDietaryPreferences(): Promise<string[]> {
    const preferences = [];
    const preferenceElements = await this.dietaryPreferences.locator('[data-testid="preference-tag"]').all();
    
    for (const element of preferenceElements) {
      const preference = await element.textContent();
      if (preference) {
        preferences.push(preference.trim());
      }
    }
    
    return preferences;
  }
  
  async getAllergenInfo(): Promise<string[]> {
    const allergens = [];
    const allergenElements = await this.allergenInfo.locator('[data-testid="allergen-tag"]').all();
    
    for (const element of allergenElements) {
      const allergen = await element.textContent();
      if (allergen) {
        allergens.push(allergen.trim());
      }
    }
    
    return allergens;
  }
  
  async editPreferences(): Promise<void> {
    await this.preferencesButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async arePreferencesVisible(): Promise<boolean> {
    return await this.preferencesSection.isVisible();
  }
  
  /**
   * Statistics Methods
   */
  
  async getMonthlySpending(): Promise<number> {
    const spendingText = await this.monthlySpending.textContent() || '₹0';
    return parseFloat(spendingText.replace('₹', ''));
  }
  
  async getFavoriteMeals(): Promise<string[]> {
    const meals = [];
    const mealElements = await this.favoriteMeals.locator('[data-testid="favorite-meal"]').all();
    
    for (const element of mealElements) {
      const meal = await element.textContent();
      if (meal) {
        meals.push(meal.trim());
      }
    }
    
    return meals;
  }
  
  async getOrderFrequency(): Promise<string> {
    return await this.orderFrequency.textContent() || '';
  }
  
  async areStatsVisible(): Promise<boolean> {
    return await this.statsSection.isVisible();
  }
  
  /**
   * RFID Card Methods
   */
  
  async getRFIDCardNumber(): Promise<string> {
    return await this.rfidCardNumber.textContent() || '';
  }
  
  async getRFIDStatus(): Promise<string> {
    return await this.rfidStatus.textContent() || '';
  }
  
  async isRFIDCardActive(): Promise<boolean> {
    const status = await this.getRFIDStatus();
    return status.toLowerCase() === 'active';
  }
  
  async reportLostCard(): Promise<void> {
    await this.reportCardButton.click();
    await this.page.waitForSelector('[data-testid="report-card-dialog"]', { state: 'visible' });
  }
  
  async isRFIDSectionVisible(): Promise<boolean> {
    return await this.rfidSection.isVisible();
  }
  
  /**
   * Parent Communication Methods
   */
  
  async hasParentMessages(): Promise<boolean> {
    return await this.parentMessages.isVisible();
  }
  
  async getParentMessagesCount(): Promise<number> {
    if (!await this.hasParentMessages()) return 0;
    
    const messages = await this.parentMessages.locator('[data-testid="parent-message"]').all();
    return messages.length;
  }
  
  async hasParentNotifications(): Promise<boolean> {
    return await this.parentNotifications.isVisible();
  }
  
  async isParentSectionVisible(): Promise<boolean> {
    return await this.parentSection.isVisible();
  }
  
  /**
   * Dashboard State Methods
   */
  
  async getDashboardState(): Promise<{
    studentName: string;
    mealBalance: number;
    hasActiveOrders: boolean;
    unreadNotifications: number;
    lowBalanceAlert: boolean;
    rfidActive: boolean;
  }> {
    return {
      studentName: await this.getStudentName(),
      mealBalance: await this.getMealBalance(),
      hasActiveOrders: await this.hasActiveOrders(),
      unreadNotifications: await this.getUnreadNotificationsCount(),
      lowBalanceAlert: await this.hasLowBalanceAlert(),
      rfidActive: await this.isRFIDCardActive()
    };
  }
  
  async refreshDashboard(): Promise<void> {
    await this.page.reload();
    await this.waitForDashboardToLoad();
  }
  
  /**
   * Mobile Responsive Methods
   */
  
  async isMobileLayout(): Promise<boolean> {
    const classList = await this.dashboard.getAttribute('class') || '';
    return classList.includes('mobile-layout') || classList.includes('responsive-mobile');
  }
  
  async openMobileMenu(): Promise<void> {
    const mobileMenuButton = this.dashboard.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
    }
  }
  
  /**
   * Error Handling Methods
   */
  
  async hasLoadingError(): Promise<boolean> {
    return await this.dashboard.locator('[data-testid="dashboard-error"]').isVisible();
  }
  
  async getLoadingErrorMessage(): Promise<string> {
    return await this.dashboard.locator('[data-testid="error-message"]').textContent() || '';
  }
  
  async retryLoading(): Promise<void> {
    const retryButton = this.dashboard.locator('[data-testid="retry-button"]');
    if (await retryButton.isVisible()) {
      await retryButton.click();
      await this.waitForDashboardToLoad();
    }
  }
  
  /**
   * Utility Methods for Testing
   */
  
  async takeScreenshot(options: { path?: string; fullPage?: boolean } = {}): Promise<Buffer> {
    return await this.dashboard.screenshot(options);
  }
  
  async scrollToSection(section: 'balance' | 'menu' | 'orders' | 'notifications' | 'activity' | 'stats'): Promise<void> {
    let targetSection: Locator;
    
    switch (section) {
      case 'balance':
        targetSection = this.balanceSection;
        break;
      case 'menu':
        targetSection = this.todayMenuSection;
        break;
      case 'orders':
        targetSection = this.activeOrdersSection;
        break;
      case 'notifications':
        targetSection = this.notificationsSection;
        break;
      case 'activity':
        targetSection = this.recentActivitySection;
        break;
      case 'stats':
        targetSection = this.statsSection;
        break;
      default:
        return;
    }
    
    await targetSection.scrollIntoViewIfNeeded();
  }
}