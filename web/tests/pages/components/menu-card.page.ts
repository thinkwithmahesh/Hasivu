import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Page Object Model for Menu Card Component
 * 
 * Encapsulates all interactions with individual menu item cards
 * Used across menu pages, order flows, and admin management interfaces
 */
export class MenuCardPage extends BasePage {
  // Menu card container
  private readonly menuCard: Locator;
  
  // Menu item information elements
  private readonly menuImage: Locator;
  private readonly menuName: Locator;
  private readonly menuDescription: Locator;
  private readonly menuPrice: Locator;
  private readonly preparationTime: Locator;
  private readonly availabilityStatus: Locator;
  
  // Nutrition information
  private readonly nutritionInfo: Locator;
  private readonly caloriesDisplay: Locator;
  private readonly proteinDisplay: Locator;
  private readonly carbsDisplay: Locator;
  private readonly fatDisplay: Locator;
  
  // Allergen information
  private readonly allergenTags: Locator;
  private readonly allergenList: Locator;
  
  // Action buttons
  private readonly addToCartButton: Locator;
  private readonly removeFromCartButton: Locator;
  private readonly viewDetailsButton: Locator;
  private readonly customizeButton: Locator;
  private readonly quantitySelector: Locator;
  private readonly increaseQuantityButton: Locator;
  private readonly decreaseQuantityButton: Locator;
  
  // Availability and status indicators
  private readonly availabilityBadge: Locator;
  private readonly popularBadge: Locator;
  private readonly newItemBadge: Locator;
  private readonly soldOutOverlay: Locator;
  
  // Rating and reviews
  private readonly ratingStars: Locator;
  private readonly averageRating: Locator;
  private readonly reviewCount: Locator;
  
  constructor(page: Page, menuId: string) {
    super(page);
    const cardSelector = `[data-testid="menu-card-${menuId}"]`;
    this.menuCard = this.page.locator(cardSelector);
    
    // Menu item information
    this.menuImage = this.menuCard.locator('[data-testid="menu-image"]');
    this.menuName = this.menuCard.locator('[data-testid="menu-name"]');
    this.menuDescription = this.menuCard.locator('[data-testid="menu-description"]');
    this.menuPrice = this.menuCard.locator('[data-testid="menu-price"]');
    this.preparationTime = this.menuCard.locator('[data-testid="preparation-time"]');
    this.availabilityStatus = this.menuCard.locator('[data-testid="availability-status"]');
    
    // Nutrition information
    this.nutritionInfo = this.menuCard.locator('[data-testid="nutrition-info"]');
    this.caloriesDisplay = this.nutritionInfo.locator('[data-testid="calories"]');
    this.proteinDisplay = this.nutritionInfo.locator('[data-testid="protein"]');
    this.carbsDisplay = this.nutritionInfo.locator('[data-testid="carbs"]');
    this.fatDisplay = this.nutritionInfo.locator('[data-testid="fat"]');
    
    // Allergen information
    this.allergenTags = this.menuCard.locator('[data-testid="allergen-tags"]');
    this.allergenList = this.allergenTags.locator('[data-testid="allergen-tag"]');
    
    // Action buttons
    this.addToCartButton = this.menuCard.locator('[data-testid="add-to-cart-button"]');
    this.removeFromCartButton = this.menuCard.locator('[data-testid="remove-from-cart-button"]');
    this.viewDetailsButton = this.menuCard.locator('[data-testid="view-details-button"]');
    this.customizeButton = this.menuCard.locator('[data-testid="customize-button"]');
    this.quantitySelector = this.menuCard.locator('[data-testid="quantity-selector"]');
    this.increaseQuantityButton = this.quantitySelector.locator('[data-testid="increase-quantity"]');
    this.decreaseQuantityButton = this.quantitySelector.locator('[data-testid="decrease-quantity"]');
    
    // Status badges
    this.availabilityBadge = this.menuCard.locator('[data-testid="availability-badge"]');
    this.popularBadge = this.menuCard.locator('[data-testid="popular-badge"]');
    this.newItemBadge = this.menuCard.locator('[data-testid="new-item-badge"]');
    this.soldOutOverlay = this.menuCard.locator('[data-testid="sold-out-overlay"]');
    
    // Rating and reviews
    this.ratingStars = this.menuCard.locator('[data-testid="rating-stars"]');
    this.averageRating = this.menuCard.locator('[data-testid="average-rating"]');
    this.reviewCount = this.menuCard.locator('[data-testid="review-count"]');
  }

  /**
   * Basic Information Methods
   */
  
  async getMenuName(): Promise<string> {
    return await this.menuName.textContent() || '';
  }
  
  async getMenuDescription(): Promise<string> {
    return await this.menuDescription.textContent() || '';
  }
  
  async getMenuPrice(): Promise<number> {
    const priceText = await this.menuPrice.textContent() || '₹0';
    return parseFloat(priceText.replace('₹', ''));
  }
  
  async getPreparationTime(): Promise<number> {
    const timeText = await this.preparationTime.textContent() || '0 mins';
    return parseInt(timeText.replace(' mins', ''));
  }
  
  async isAvailable(): Promise<boolean> {
    const status = await this.availabilityStatus.textContent();
    return status?.toLowerCase() === 'available';
  }
  
  async isSoldOut(): Promise<boolean> {
    return await this.soldOutOverlay.isVisible();
  }
  
  /**
   * Nutrition Information Methods
   */
  
  async getNutritionInfo(): Promise<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }> {
    const calories = parseInt(await this.caloriesDisplay.textContent() || '0');
    const protein = parseInt(await this.proteinDisplay.textContent() || '0');
    const carbs = parseInt(await this.carbsDisplay.textContent() || '0');
    const fat = parseInt(await this.fatDisplay.textContent() || '0');
    
    return { calories, protein, carbs, fat };
  }
  
  async hasNutritionInfo(): Promise<boolean> {
    return await this.nutritionInfo.isVisible();
  }
  
  /**
   * Allergen Information Methods
   */
  
  async getAllergens(): Promise<string[]> {
    const allergenElements = await this.allergenList.all();
    const allergens = [];
    
    for (const element of allergenElements) {
      const allergen = await element.textContent();
      if (allergen) {
        allergens.push(allergen.trim());
      }
    }
    
    return allergens;
  }
  
  async hasAllergen(allergen: string): Promise<boolean> {
    const allergens = await this.getAllergens();
    return allergens.includes(allergen.toLowerCase());
  }
  
  async hasAllergens(): Promise<boolean> {
    return await this.allergenTags.isVisible();
  }
  
  /**
   * Rating and Review Methods
   */
  
  async getAverageRating(): Promise<number> {
    const ratingText = await this.averageRating.textContent() || '0';
    return parseFloat(ratingText);
  }
  
  async getReviewCount(): Promise<number> {
    const reviewText = await this.reviewCount.textContent() || '0 reviews';
    return parseInt(reviewText.replace(' reviews', ''));
  }
  
  async hasRatings(): Promise<boolean> {
    return await this.ratingStars.isVisible();
  }
  
  /**
   * Status Badge Methods
   */
  
  async isPopular(): Promise<boolean> {
    return await this.popularBadge.isVisible();
  }
  
  async isNewItem(): Promise<boolean> {
    return await this.newItemBadge.isVisible();
  }
  
  async getAvailabilityBadge(): Promise<string> {
    return await this.availabilityBadge.textContent() || '';
  }
  
  /**
   * Cart Interaction Methods
   */
  
  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async removeFromCart(): Promise<void> {
    await this.removeFromCartButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async isAddToCartEnabled(): Promise<boolean> {
    return await this.addToCartButton.isEnabled();
  }
  
  async isRemoveFromCartVisible(): Promise<boolean> {
    return await this.removeFromCartButton.isVisible();
  }
  
  /**
   * Quantity Management Methods
   */
  
  async getCurrentQuantity(): Promise<number> {
    const quantityText = await this.quantitySelector.locator('[data-testid="quantity-display"]').textContent() || '0';
    return parseInt(quantityText);
  }
  
  async increaseQuantity(): Promise<void> {
    await this.increaseQuantityButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async decreaseQuantity(): Promise<void> {
    await this.decreaseQuantityButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async setQuantity(quantity: number): Promise<void> {
    const currentQuantity = await this.getCurrentQuantity();
    
    if (quantity > currentQuantity) {
      for (let i = currentQuantity; i < quantity; i++) {
        await this.increaseQuantity();
      }
    } else if (quantity < currentQuantity) {
      for (let i = currentQuantity; i > quantity; i--) {
        await this.decreaseQuantity();
      }
    }
  }
  
  async isQuantitySelectorVisible(): Promise<boolean> {
    return await this.quantitySelector.isVisible();
  }
  
  /**
   * Customization Methods
   */
  
  async openCustomization(): Promise<void> {
    await this.customizeButton.click();
    await this.page.waitForSelector('[data-testid="customization-modal"]', { state: 'visible' });
  }
  
  async isCustomizable(): Promise<boolean> {
    return await this.customizeButton.isVisible();
  }
  
  /**
   * Details and Navigation Methods
   */
  
  async viewDetails(): Promise<void> {
    await this.viewDetailsButton.click();
    await this.waitForLoadingToComplete();
  }
  
  async openMenuItemDetails(): Promise<void> {
    await this.menuCard.click();
    await this.waitForLoadingToComplete();
  }
  
  /**
   * Visual State Methods
   */
  
  async isCardVisible(): Promise<boolean> {
    return await this.menuCard.isVisible();
  }
  
  async isImageLoaded(): Promise<boolean> {
    const imageElement = await this.menuImage.elementHandle();
    if (!imageElement) return false;
    
    const naturalWidth = await imageElement.evaluate((img: HTMLImageElement) => img.naturalWidth);
    return naturalWidth > 0;
  }
  
  async waitForImageToLoad(): Promise<void> {
    await this.page.waitForFunction(
      (selector) => {
        const img = document.querySelector(selector) as HTMLImageElement;
        return img && img.complete && img.naturalWidth > 0;
      },
      await this.menuImage.getAttribute('data-testid')
    );
  }
  
  /**
   * Hover and Focus Methods
   */
  
  async hoverOverCard(): Promise<void> {
    await this.menuCard.hover();
  }
  
  async focusCard(): Promise<void> {
    await this.menuCard.focus();
  }
  
  /**
   * Accessibility Methods
   */
  
  async getAriaLabel(): Promise<string> {
    return await this.menuCard.getAttribute('aria-label') || '';
  }
  
  async getAriaDescribedBy(): Promise<string> {
    return await this.menuCard.getAttribute('aria-describedby') || '';
  }
  
  async isKeyboardAccessible(): Promise<boolean> {
    const tabIndex = await this.menuCard.getAttribute('tabindex');
    return tabIndex !== null && tabIndex !== '-1';
  }
  
  /**
   * Animation and Loading States
   */
  
  async waitForLoadingState(): Promise<void> {
    await this.menuCard.locator('[data-testid="loading-spinner"]').waitFor({ state: 'hidden' });
  }
  
  async isLoading(): Promise<boolean> {
    return await this.menuCard.locator('[data-testid="loading-spinner"]').isVisible();
  }
  
  /**
   * Error State Methods
   */
  
  async hasError(): Promise<boolean> {
    return await this.menuCard.locator('[data-testid="error-message"]').isVisible();
  }
  
  async getErrorMessage(): Promise<string> {
    return await this.menuCard.locator('[data-testid="error-message"]').textContent() || '';
  }
  
  /**
   * Utility Methods for Testing
   */
  
  async getCardBounds(): Promise<{ x: number; y: number; width: number; height: number }> {
    const boundingBox = await this.menuCard.boundingBox();
    return boundingBox || { x: 0, y: 0, width: 0, height: 0 };
  }
  
  async takeScreenshot(options: { path?: string; fullPage?: boolean } = {}): Promise<Buffer> {
    return await this.menuCard.screenshot(options);
  }
  
  /**
   * Complex Interaction Workflows
   */
  
  async addToCartWithCustomization(customizations: Record<string, any>): Promise<void> {
    if (await this.isCustomizable()) {
      await this.openCustomization();
      
      // Apply customizations (this would be expanded based on actual customization options)
      for (const [key, value] of Object.entries(customizations)) {
        const customizationElement = this.page.locator(`[data-testid="customization-${key}"]`);
        
        if (typeof value === 'string') {
          await customizationElement.fill(value);
        } else if (typeof value === 'boolean' && value) {
          await customizationElement.check();
        } else if (typeof value === 'number') {
          await customizationElement.fill(value.toString());
        }
      }
      
      // Confirm customization
      await this.page.locator('[data-testid="confirm-customization"]').click();
    } else {
      await this.addToCart();
    }
  }
  
  async quickAddMultiple(quantity: number): Promise<void> {
    for (let i = 0; i < quantity; i++) {
      await this.addToCart();
      // Small delay to prevent rapid clicks from being ignored
      await this.page.waitForTimeout(100);
    }
  }
  
  /**
   * Validation Methods for Test Assertions
   */
  
  async validateMenuItemData(expectedData: {
    name?: string;
    description?: string;
    price?: number;
    preparationTime?: number;
    allergens?: string[];
    available?: boolean;
  }): Promise<boolean> {
    try {
      if (expectedData.name && await this.getMenuName() !== expectedData.name) {
        return false;
      }
      
      if (expectedData.description && await this.getMenuDescription() !== expectedData.description) {
        return false;
      }
      
      if (expectedData.price && await this.getMenuPrice() !== expectedData.price) {
        return false;
      }
      
      if (expectedData.preparationTime && await this.getPreparationTime() !== expectedData.preparationTime) {
        return false;
      }
      
      if (expectedData.allergens) {
        const actualAllergens = await this.getAllergens();
        const allergensMatch = expectedData.allergens.every(allergen => 
          actualAllergens.includes(allergen.toLowerCase())
        );
        if (!allergensMatch) return false;
      }
      
      if (expectedData.available !== undefined && await this.isAvailable() !== expectedData.available) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating menu item data:', error);
      return false;
    }
  }
}