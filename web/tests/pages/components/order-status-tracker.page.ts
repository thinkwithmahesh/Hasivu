import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Page Object Model for Order Status Tracker Component
 * 
 * Encapsulates all interactions with the order status tracking component
 * Used in order confirmation pages, dashboard views, and real-time tracking
 */
export class OrderStatusTrackerPage extends BasePage {
  // Main tracker container
  private readonly statusTracker: Locator;
  
  // Order information elements
  private readonly orderNumber: Locator;
  private readonly orderTotal: Locator;
  private readonly orderDate: Locator;
  private readonly customerInfo: Locator;
  
  // Status progression elements
  private readonly statusSteps: Locator;
  private readonly currentStatus: Locator;
  private readonly statusProgress: Locator;
  private readonly progressBar: Locator;
  
  // Individual status stages
  private readonly orderPlacedStage: Locator;
  private readonly paymentConfirmedStage: Locator;
  private readonly kitchenAcceptedStage: Locator;
  private readonly preparingStage: Locator;
  private readonly readyForPickupStage: Locator;
  private readonly deliveredStage: Locator;
  
  // Time estimates and actual times
  private readonly estimatedDelivery: Locator;
  private readonly actualDelivery: Locator;
  private readonly preparationTime: Locator;
  private readonly timeRemaining: Locator;
  
  // Status indicators
  private readonly completedSteps: Locator;
  private readonly activeStep: Locator;
  private readonly pendingSteps: Locator;
  private readonly statusIcon: Locator;
  
  // Real-time updates
  private readonly lastUpdated: Locator;
  private readonly autoRefreshIndicator: Locator;
  private readonly connectionStatus: Locator;
  
  // Action buttons
  private readonly trackOrderButton: Locator;
  private readonly cancelOrderButton: Locator;
  private readonly contactSupportButton: Locator;
  private readonly viewReceiptButton: Locator;
  private readonly reorderButton: Locator;
  
  // Notifications and alerts
  private readonly statusChangeNotification: Locator;
  private readonly delayNotification: Locator;
  private readonly readyNotification: Locator;
  
  constructor(page: Page, orderId?: string) {
    super(page);
    
    const trackerSelector = orderId 
      ? `[data-testid="order-tracker-${orderId}"]`
      : '[data-testid="order-status-tracker"]';
      
    this.statusTracker = this.page.locator(trackerSelector);
    
    // Order information
    this.orderNumber = this.statusTracker.locator('[data-testid="order-number"]');
    this.orderTotal = this.statusTracker.locator('[data-testid="order-total"]');
    this.orderDate = this.statusTracker.locator('[data-testid="order-date"]');
    this.customerInfo = this.statusTracker.locator('[data-testid="customer-info"]');
    
    // Status progression
    this.statusSteps = this.statusTracker.locator('[data-testid="status-steps"]');
    this.currentStatus = this.statusTracker.locator('[data-testid="current-status"]');
    this.statusProgress = this.statusTracker.locator('[data-testid="status-progress"]');
    this.progressBar = this.statusTracker.locator('[data-testid="progress-bar"]');
    
    // Individual stages
    this.orderPlacedStage = this.statusTracker.locator('[data-testid="stage-order_placed"]');
    this.paymentConfirmedStage = this.statusTracker.locator('[data-testid="stage-payment_confirmed"]');
    this.kitchenAcceptedStage = this.statusTracker.locator('[data-testid="stage-kitchen_accepted"]');
    this.preparingStage = this.statusTracker.locator('[data-testid="stage-preparing"]');
    this.readyForPickupStage = this.statusTracker.locator('[data-testid="stage-ready_for_pickup"]');
    this.deliveredStage = this.statusTracker.locator('[data-testid="stage-delivered"]');
    
    // Time information
    this.estimatedDelivery = this.statusTracker.locator('[data-testid="estimated-delivery"]');
    this.actualDelivery = this.statusTracker.locator('[data-testid="actual-delivery"]');
    this.preparationTime = this.statusTracker.locator('[data-testid="preparation-time"]');
    this.timeRemaining = this.statusTracker.locator('[data-testid="time-remaining"]');
    
    // Status indicators
    this.completedSteps = this.statusTracker.locator('[data-testid="completed-step"]');
    this.activeStep = this.statusTracker.locator('[data-testid="active-step"]');
    this.pendingSteps = this.statusTracker.locator('[data-testid="pending-step"]');
    this.statusIcon = this.statusTracker.locator('[data-testid="status-icon"]');
    
    // Real-time updates
    this.lastUpdated = this.statusTracker.locator('[data-testid="last-updated"]');
    this.autoRefreshIndicator = this.statusTracker.locator('[data-testid="auto-refresh-indicator"]');
    this.connectionStatus = this.statusTracker.locator('[data-testid="connection-status"]');
    
    // Action buttons
    this.trackOrderButton = this.statusTracker.locator('[data-testid="track-order-button"]');
    this.cancelOrderButton = this.statusTracker.locator('[data-testid="cancel-order-button"]');
    this.contactSupportButton = this.statusTracker.locator('[data-testid="contact-support-button"]');
    this.viewReceiptButton = this.statusTracker.locator('[data-testid="view-receipt-button"]');
    this.reorderButton = this.statusTracker.locator('[data-testid="reorder-button"]');
    
    // Notifications
    this.statusChangeNotification = this.statusTracker.locator('[data-testid="status-change-notification"]');
    this.delayNotification = this.statusTracker.locator('[data-testid="delay-notification"]');
    this.readyNotification = this.statusTracker.locator('[data-testid="ready-notification"]');
  }

  /**
   * Order Information Methods
   */
  
  async getOrderNumber(): Promise<string> {
    return await this.orderNumber.textContent() || '';
  }
  
  async getOrderTotal(): Promise<number> {
    const totalText = await this.orderTotal.textContent() || '₹0';
    return parseFloat(totalText.replace('₹', ''));
  }
  
  async getOrderDate(): Promise<string> {
    return await this.orderDate.textContent() || '';
  }
  
  async getCustomerInfo(): Promise<string> {
    return await this.customerInfo.textContent() || '';
  }
  
  /**
   * Status Information Methods
   */
  
  async getCurrentStatus(): Promise<string> {
    return await this.currentStatus.textContent() || '';
  }
  
  async getStatusProgress(): Promise<number> {
    const progressElement = await this.progressBar.getAttribute('aria-valuenow');
    return progressElement ? parseInt(progressElement) : 0;
  }
  
  async getCompletedStepsCount(): Promise<number> {
    const completedElements = await this.completedSteps.all();
    return completedElements.length;
  }
  
  async getPendingStepsCount(): Promise<number> {
    const pendingElements = await this.pendingSteps.all();
    return pendingElements.length;
  }
  
  /**
   * Stage Status Methods
   */
  
  async isOrderPlaced(): Promise<boolean> {
    return await this.orderPlacedStage.getAttribute('data-status') === 'completed';
  }
  
  async isPaymentConfirmed(): Promise<boolean> {
    return await this.paymentConfirmedStage.getAttribute('data-status') === 'completed';
  }
  
  async isKitchenAccepted(): Promise<boolean> {
    return await this.kitchenAcceptedStage.getAttribute('data-status') === 'completed';
  }
  
  async isPreparing(): Promise<boolean> {
    const status = await this.preparingStage.getAttribute('data-status');
    return status === 'completed' || status === 'active';
  }
  
  async isReadyForPickup(): Promise<boolean> {
    return await this.readyForPickupStage.getAttribute('data-status') === 'completed';
  }
  
  async isDelivered(): Promise<boolean> {
    return await this.deliveredStage.getAttribute('data-status') === 'completed';
  }
  
  async getActiveStage(): Promise<string> {
    const activeElement = await this.activeStep.first();
    return await activeElement.getAttribute('data-stage') || '';
  }
  
  /**
   * Time Information Methods
   */
  
  async getEstimatedDeliveryTime(): Promise<string> {
    return await this.estimatedDelivery.textContent() || '';
  }
  
  async getActualDeliveryTime(): Promise<string> {
    return await this.actualDelivery.textContent() || '';
  }
  
  async getPreparationTime(): Promise<string> {
    return await this.preparationTime.textContent() || '';
  }
  
  async getTimeRemaining(): Promise<string> {
    return await this.timeRemaining.textContent() || '';
  }
  
  async isTimeRemainingVisible(): Promise<boolean> {
    return await this.timeRemaining.isVisible();
  }
  
  /**
   * Real-time Update Methods
   */
  
  async getLastUpdatedTime(): Promise<string> {
    return await this.lastUpdated.textContent() || '';
  }
  
  async isAutoRefreshActive(): Promise<boolean> {
    return await this.autoRefreshIndicator.isVisible();
  }
  
  async getConnectionStatus(): Promise<string> {
    const statusClass = await this.connectionStatus.getAttribute('class') || '';
    
    if (statusClass.includes('connected')) return 'connected';
    if (statusClass.includes('disconnected')) return 'disconnected';
    if (statusClass.includes('reconnecting')) return 'reconnecting';
    
    return 'unknown';
  }
  
  async waitForStatusUpdate(expectedStatus: string, timeoutMs: number = 30000): Promise<void> {
    await this.page.waitForFunction(
      ([selector, status]) => {
        const element = document.querySelector(selector);
        return element?.textContent?.toLowerCase().includes(status.toLowerCase());
      },
      [await this.currentStatus.getAttribute('data-testid'), expectedStatus],
      { timeout: timeoutMs }
    );
  }
  
  /**
   * Action Methods
   */
  
  async clickTrackOrder(): Promise<void> {
    await this.trackOrderButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async cancelOrder(): Promise<void> {
    await this.cancelOrderButton.click();
    // Wait for confirmation dialog
    await this.page.waitForSelector('[data-testid="cancel-confirmation-dialog"]', { state: 'visible' });
  }
  
  async contactSupport(): Promise<void> {
    await this.contactSupportButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async viewReceipt(): Promise<void> {
    await this.viewReceiptButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async reorder(): Promise<void> {
    await this.reorderButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async isActionButtonVisible(action: 'track' | 'cancel' | 'support' | 'receipt' | 'reorder'): Promise<boolean> {
    switch (action) {
      case 'track':
        return await this.trackOrderButton.isVisible();
      case 'cancel':
        return await this.cancelOrderButton.isVisible();
      case 'support':
        return await this.contactSupportButton.isVisible();
      case 'receipt':
        return await this.viewReceiptButton.isVisible();
      case 'reorder':
        return await this.reorderButton.isVisible();
      default:
        return false;
    }
  }
  
  async isActionButtonEnabled(action: 'track' | 'cancel' | 'support' | 'receipt' | 'reorder'): Promise<boolean> {
    switch (action) {
      case 'track':
        return await this.trackOrderButton.isEnabled();
      case 'cancel':
        return await this.cancelOrderButton.isEnabled();
      case 'support':
        return await this.contactSupportButton.isEnabled();
      case 'receipt':
        return await this.viewReceiptButton.isEnabled();
      case 'reorder':
        return await this.reorderButton.isEnabled();
      default:
        return false;
    }
  }
  
  /**
   * Notification Methods
   */
  
  async hasStatusChangeNotification(): Promise<boolean> {
    return await this.statusChangeNotification.isVisible();
  }
  
  async getStatusChangeNotificationMessage(): Promise<string> {
    return await this.statusChangeNotification.textContent() || '';
  }
  
  async hasDelayNotification(): Promise<boolean> {
    return await this.delayNotification.isVisible();
  }
  
  async getDelayNotificationMessage(): Promise<string> {
    return await this.delayNotification.textContent() || '';
  }
  
  async hasReadyNotification(): Promise<boolean> {
    return await this.readyNotification.isVisible();
  }
  
  async dismissNotification(type: 'status' | 'delay' | 'ready'): Promise<void> {
    let notification: Locator;
    
    switch (type) {
      case 'status':
        notification = this.statusChangeNotification;
        break;
      case 'delay':
        notification = this.delayNotification;
        break;
      case 'ready':
        notification = this.readyNotification;
        break;
      default:
        return;
    }
    
    const dismissButton = notification.locator('[data-testid="dismiss-button"]');
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
    }
  }
  
  /**
   * Visual State Methods
   */
  
  async isTrackerVisible(): Promise<boolean> {
    return await this.statusTracker.isVisible();
  }
  
  async getStatusIcon(): Promise<string> {
    return await this.statusIcon.getAttribute('data-icon') || '';
  }
  
  async getTrackerTheme(): Promise<string> {
    const classList = await this.statusTracker.getAttribute('class') || '';
    
    if (classList.includes('theme-success')) return 'success';
    if (classList.includes('theme-warning')) return 'warning';
    if (classList.includes('theme-error')) return 'error';
    if (classList.includes('theme-info')) return 'info';
    
    return 'default';
  }
  
  /**
   * Animation and Transition Methods
   */
  
  async waitForStageTransition(): Promise<void> {
    // Wait for any stage transition animations to complete
    await this.page.waitForTimeout(1000);
    await this.statusTracker.locator('[data-testid="transition-overlay"]').waitFor({ state: 'hidden' });
  }
  
  async isAnimationInProgress(): Promise<boolean> {
    return await this.statusTracker.locator('[data-testid="transition-overlay"]').isVisible();
  }
  
  /**
   * Accessibility Methods
   */
  
  async getAriaLiveRegion(): Promise<string> {
    return await this.statusTracker.getAttribute('aria-live') || '';
  }
  
  async getProgressBarAriaLabel(): Promise<string> {
    return await this.progressBar.getAttribute('aria-label') || '';
  }
  
  async isKeyboardNavigable(): Promise<boolean> {
    const tabIndex = await this.statusTracker.getAttribute('tabindex');
    return tabIndex !== null && tabIndex !== '-1';
  }
  
  /**
   * Mobile Responsive Methods
   */
  
  async isMobileLayout(): Promise<boolean> {
    const classList = await this.statusTracker.getAttribute('class') || '';
    return classList.includes('mobile-layout') || classList.includes('responsive-mobile');
  }
  
  async isCompactMode(): Promise<boolean> {
    const classList = await this.statusTracker.getAttribute('class') || '';
    return classList.includes('compact-mode');
  }
  
  /**
   * Error State Methods
   */
  
  async hasError(): Promise<boolean> {
    return await this.statusTracker.locator('[data-testid="error-state"]').isVisible();
  }
  
  async getErrorMessage(): Promise<string> {
    return await this.statusTracker.locator('[data-testid="error-message"]').textContent() || '';
  }
  
  async retryAfterError(): Promise<void> {
    const retryButton = this.statusTracker.locator('[data-testid="retry-button"]');
    if (await retryButton.isVisible()) {
      await retryButton.click();
      await this.waitForLoadingToComplete();
    }
  }
  
  /**
   * Stage Timeline Methods
   */
  
  async getStageTimestamp(stage: string): Promise<string> {
    const stageElement = this.statusTracker.locator(`[data-testid="stage-${stage}"]`);
    const timestamp = stageElement.locator('[data-testid="stage-timestamp"]');
    return await timestamp.textContent() || '';
  }
  
  async getStageEstimate(stage: string): Promise<string> {
    const stageElement = this.statusTracker.locator(`[data-testid="stage-${stage}"]`);
    const estimate = stageElement.locator('[data-testid="stage-estimate"]');
    return await estimate.textContent() || '';
  }
  
  async getAllStageTimeline(): Promise<Array<{
    stage: string;
    status: string;
    timestamp?: string;
    estimate?: string;
  }>> {
    const stages = [
      'order_placed',
      'payment_confirmed', 
      'kitchen_accepted',
      'preparing',
      'ready_for_pickup',
      'delivered'
    ];
    
    const timeline = [];
    
    for (const stage of stages) {
      const stageElement = this.statusTracker.locator(`[data-testid="stage-${stage}"]`);
      
      if (await stageElement.isVisible()) {
        const status = await stageElement.getAttribute('data-status') || 'pending';
        const timestamp = await this.getStageTimestamp(stage);
        const estimate = await this.getStageEstimate(stage);
        
        timeline.push({
          stage,
          status,
          timestamp: timestamp || undefined,
          estimate: estimate || undefined
        });
      }
    }
    
    return timeline;
  }
  
  /**
   * Integration Methods for Complex Workflows
   */
  
  async waitForOrderCompletion(timeoutMs: number = 300000): Promise<void> {
    await this.page.waitForFunction(
      (selector) => {
        const deliveredStage = document.querySelector(`${selector} [data-testid="stage-delivered"]`);
        return deliveredStage?.getAttribute('data-status') === 'completed';
      },
      await this.statusTracker.getAttribute('data-testid'),
      { timeout: timeoutMs }
    );
  }
  
  async monitorStatusChanges(callback: (status: string) => void, durationMs: number = 60000): Promise<void> {
    const startTime = Date.now();
    let lastStatus = await this.getCurrentStatus();
    
    while (Date.now() - startTime < durationMs) {
      const currentStatus = await this.getCurrentStatus();
      
      if (currentStatus !== lastStatus) {
        callback(currentStatus);
        lastStatus = currentStatus;
      }
      
      await this.page.waitForTimeout(1000); // Check every second
    }
  }
  
  /**
   * Utility Methods for Testing
   */
  
  async takeScreenshot(options: { path?: string; fullPage?: boolean } = {}): Promise<Buffer> {
    return await this.statusTracker.screenshot(options);
  }
  
  async getTrackerBounds(): Promise<{ x: number; y: number; width: number; height: number }> {
    const boundingBox = await this.statusTracker.boundingBox();
    return boundingBox || { x: 0, y: 0, width: 0, height: 0 };
  }
  
  /**
   * Validation Methods for Test Assertions
   */
  
  async validateOrderTracking(expectedData: {
    orderNumber?: string;
    currentStatus?: string;
    completedStages?: string[];
    activeStage?: string;
    estimatedDelivery?: string;
  }): Promise<boolean> {
    try {
      if (expectedData.orderNumber && await this.getOrderNumber() !== expectedData.orderNumber) {
        return false;
      }
      
      if (expectedData.currentStatus && await this.getCurrentStatus() !== expectedData.currentStatus) {
        return false;
      }
      
      if (expectedData.activeStage && await this.getActiveStage() !== expectedData.activeStage) {
        return false;
      }
      
      if (expectedData.completedStages) {
        const timeline = await this.getAllStageTimeline();
        const completedStages = timeline
          .filter(stage => stage.status === 'completed')
          .map(stage => stage.stage);
        
        const allExpectedCompleted = expectedData.completedStages.every(stage =>
          completedStages.includes(stage)
        );
        
        if (!allExpectedCompleted) return false;
      }
      
      if (expectedData.estimatedDelivery) {
        const actualEstimate = await this.getEstimatedDeliveryTime();
        if (!actualEstimate.includes(expectedData.estimatedDelivery)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validating order tracking:', error);
      return false;
    }
  }
}