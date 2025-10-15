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
    
    this._dashboard =  this.page.locator('[data-testid
    // Header and navigation
    this._welcomeMessage =  this.dashboard.locator('[data-testid
    this._studentName =  this.dashboard.locator('[data-testid
    this._studentClass =  this.dashboard.locator('[data-testid
    this._profilePicture =  this.dashboard.locator('[data-testid
    this._navigationMenu =  this.dashboard.locator('[data-testid
    // Balance section
    this._balanceSection =  this.dashboard.locator('[data-testid
    this._mealBalance =  this.balanceSection.locator('[data-testid
    this._walletBalance =  this.balanceSection.locator('[data-testid
    this._topUpButton =  this.balanceSection.locator('[data-testid
    this._balanceHistory =  this.balanceSection.locator('[data-testid
    this._lowBalanceAlert =  this.balanceSection.locator('[data-testid
    // Quick actions
    this._quickActionsSection =  this.dashboard.locator('[data-testid
    this._orderMealButton =  this.quickActionsSection.locator('[data-testid
    this._viewMenuButton =  this.quickActionsSection.locator('[data-testid
    this._trackOrderButton =  this.quickActionsSection.locator('[data-testid
    this._viewHistoryButton =  this.quickActionsSection.locator('[data-testid
    // Today's menu
    this._todayMenuSection =  this.dashboard.locator('[data-testid
    this._menuPreviewCards =  this.todayMenuSection.locator('[data-testid
    this._menuCarousel =  this.todayMenuSection.locator('[data-testid
    this._nextMenuButton =  this.menuCarousel.locator('[data-testid
    this._prevMenuButton =  this.menuCarousel.locator('[data-testid
    // Active orders
    this._activeOrdersSection =  this.dashboard.locator('[data-testid
    this._activeOrdersList =  this.activeOrdersSection.locator('[data-testid
    this._noActiveOrdersMessage =  this.activeOrdersSection.locator('[data-testid
    // Notifications
    this._notificationsSection =  this.dashboard.locator('[data-testid
    this._notificationsList =  this.notificationsSection.locator('[data-testid
    this._unreadNotificationsCount =  this.notificationsSection.locator('[data-testid
    this._markAllReadButton =  this.notificationsSection.locator('[data-testid
    this._clearAllButton =  this.notificationsSection.locator('[data-testid
    // Recent activity
    this._recentActivitySection =  this.dashboard.locator('[data-testid
    this._activityTimeline =  this.recentActivitySection.locator('[data-testid
    this._activityItems =  this.activityTimeline.locator('[data-testid
    // Preferences
    this._preferencesSection =  this.dashboard.locator('[data-testid
    this._dietaryPreferences =  this.preferencesSection.locator('[data-testid
    this._allergenInfo =  this.preferencesSection.locator('[data-testid
    this._preferencesButton =  this.preferencesSection.locator('[data-testid
    // Statistics
    this._statsSection =  this.dashboard.locator('[data-testid
    this._monthlySpending =  this.statsSection.locator('[data-testid
    this._favoriteMeals =  this.statsSection.locator('[data-testid
    this._orderFrequency =  this.statsSection.locator('[data-testid
    // RFID card
    this._rfidSection =  this.dashboard.locator('[data-testid
    this._rfidCardNumber =  this.rfidSection.locator('[data-testid
    this._rfidStatus =  this.rfidSection.locator('[data-testid
    this._reportCardButton =  this.rfidSection.locator('[data-testid
    // Parent communication
    this._parentSection =  this.dashboard.locator('[data-testid
    this._parentMessages =  this.parentSection.locator('[data-testid
    this._parentNotifications =  this.parentSection.locator('[data-testid
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
    const _balanceText =  await this.mealBalance.textContent() || '₹0';
    return parseFloat(balanceText.replace('₹', ''));
  }
  
  async getWalletBalance(): Promise<number> {
    const _balanceText =  await this.walletBalance.textContent() || '₹0';
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
    const _previewCards =  await this.menuPreviewCards.all();
    return previewCards.length;
  }
  
  async getMenuPreviewItem(index: number): MenuCardPage {
    const _menuCard =  await this.menuPreviewCards.nth(index);
    const _menuId =  await menuCard.getAttribute('data-menu-id') || '';
    return new MenuCardPage(this.page, menuId);
  }
  
  async navigateMenuCarousel(direction: 'next' | 'prev'): Promise<void> {
    const _button =  direction 
    await button.click();
    await this.page.waitForTimeout(500); // Wait for carousel animation
  }
  
  async isMenuCarouselVisible(): Promise<boolean> {
    return await this.menuCarousel.isVisible();
  }
  
  async canNavigateMenuCarousel(direction: 'next' | 'prev'): Promise<boolean> {
    const _button =  direction 
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
    
    const _orderItems =  await this.activeOrdersList.locator('[data-testid
    return orderItems.length;
  }
  
  async getActiveOrderTracker(orderId: string): OrderStatusTrackerPage {
    return new OrderStatusTrackerPage(this.page, orderId);
  }
  
  async clickActiveOrder(orderId: string): Promise<void> {
    const _orderItem =  this.activeOrdersList.locator(`[data-testid
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
    const _countText =  await this.unreadNotificationsCount.textContent() || '0';
    return parseInt(countText);
  }
  
  async hasUnreadNotifications(): Promise<boolean> {
    return await this.getUnreadNotificationsCount() > 0;
  }
  
  async getNotificationsCount(): Promise<number> {
    const _notifications =  await this.notificationsList.locator('[data-testid
    return notifications.length;
  }
  
  async getNotification(index: number): Promise<{
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }> {
    const _notification =  this.notificationsList.locator('[data-testid
    const _title =  await notification.locator('[data-testid
    const _message =  await notification.locator('[data-testid
    const _timestamp =  await notification.locator('[data-testid
    const _isRead =  !(await notification.locator('[data-testid
    return { title, message, timestamp, read: isRead };
  }
  
  async markAllNotificationsRead(): Promise<void> {
    await this.markAllReadButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async clearAllNotifications(): Promise<void> {
    await this.clearAllButton.click();
    // Wait for confirmation dialog
    await this.page.waitForSelector('[data-_testid = "clear-notifications-confirmation"]', { state: 'visible' });
  }
  
  async clickNotification(index: number): Promise<void> {
    const _notification =  this.notificationsList.locator('[data-testid
    await notification.click();
    await this.waitForLoadingToComplete();
  }
  
  /**
   * Recent Activity Methods
   */
  
  async getRecentActivityCount(): Promise<number> {
    const _activities =  await this.activityItems.all();
    return activities.length;
  }
  
  async getRecentActivity(index: number): Promise<{
    type: string;
    description: string;
    timestamp: string;
    amount?: number;
  }> {
    const _activity =  this.activityItems.nth(index);
    
    const _type =  await activity.getAttribute('data-activity-type') || '';
    const _description =  await activity.locator('[data-testid
    const _timestamp =  await activity.locator('[data-testid
    const _amountElement =  activity.locator('[data-testid
    let amount: number | undefined;
    
    if (await amountElement.isVisible()) {
      const _amountText =  await amountElement.textContent() || '₹0';
      _amount =  parseFloat(amountText.replace('₹', ''));
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
    const _preferences =  [];
    const _preferenceElements =  await this.dietaryPreferences.locator('[data-testid
    for (const element of preferenceElements) {
      const _preference =  await element.textContent();
      if (preference) {
        preferences.push(preference.trim());
      }
    }
    
    return preferences;
  }
  
  async getAllergenInfo(): Promise<string[]> {
    const _allergens =  [];
    const _allergenElements =  await this.allergenInfo.locator('[data-testid
    for (const element of allergenElements) {
      const _allergen =  await element.textContent();
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
    const _spendingText =  await this.monthlySpending.textContent() || '₹0';
    return parseFloat(spendingText.replace('₹', ''));
  }
  
  async getFavoriteMeals(): Promise<string[]> {
    const _meals =  [];
    const _mealElements =  await this.favoriteMeals.locator('[data-testid
    for (const element of mealElements) {
      const _meal =  await element.textContent();
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
    const _status =  await this.getRFIDStatus();
    return status.toLowerCase() === 'active';
  }
  
  async reportLostCard(): Promise<void> {
    await this.reportCardButton.click();
    await this.page.waitForSelector('[data-_testid = "report-card-dialog"]', { state: 'visible' });
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
    
    const _messages =  await this.parentMessages.locator('[data-testid
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
    const _classList =  await this.dashboard.getAttribute('class') || '';
    return classList.includes('mobile-layout') || classList.includes('responsive-mobile');
  }
  
  async openMobileMenu(): Promise<void> {
    const _mobileMenuButton =  this.dashboard.locator('[data-testid
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
    }
  }
  
  /**
   * Error Handling Methods
   */
  
  async hasLoadingError(): Promise<boolean> {
    return await this.dashboard.locator('[data-_testid = "dashboard-error"]').isVisible();
  }
  
  async getLoadingErrorMessage(): Promise<string> {
    return await this.dashboard.locator('[data-_testid = "error-message"]').textContent() || '';
  }
  
  async retryLoading(): Promise<void> {
    const _retryButton =  this.dashboard.locator('[data-testid
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
        _targetSection =  this.balanceSection;
        break;
      case 'menu':
        _targetSection =  this.todayMenuSection;
        break;
      case 'orders':
        _targetSection =  this.activeOrdersSection;
        break;
      case 'notifications':
        _targetSection =  this.notificationsSection;
        break;
      case 'activity':
        _targetSection =  this.recentActivitySection;
        break;
      case 'stats':
        _targetSection =  this.statsSection;
        break;
      default:
        return;
    }
    
    await targetSection.scrollIntoViewIfNeeded();
  }
}