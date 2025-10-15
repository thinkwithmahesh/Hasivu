import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Menu Page Object Model for HASIVU Platform
 * Handles menu browsing, cart functionality, and RFID interactions
 */
export class MenuPage extends BasePage {
  // Filter and search elements
  readonly searchInput: Locator;
  readonly categoryFilters: Locator;
  readonly dietaryFilters: Locator;
  readonly priceFilter: Locator;
  readonly sortOptions: Locator;

  // Menu display elements
  readonly menuGrid: Locator;
  readonly menuList: Locator;
  readonly viewToggle: Locator;
  readonly menuItems: Locator;

  // Item interaction elements
  readonly addToCartButtons: Locator;
  readonly quantityControls: Locator;
  readonly itemDetailsButtons: Locator;
  readonly favoriteButtons: Locator;

  // Cart elements
  readonly cartSidebar: Locator;
  readonly cartIcon: Locator;
  readonly cartItemCount: Locator;
  readonly cartItems: Locator;
  readonly cartTotal: Locator;
  readonly checkoutButton: Locator;
  readonly clearCartButton: Locator;

  // RFID elements
  readonly rfidScanIndicator: Locator;
  readonly rfidQuickOrderButton: Locator;
  readonly rfidStatusBanner: Locator;

  // Nutritional information
  readonly nutritionButton: Locator;
  readonly nutritionModal: Locator;
  readonly allergenInfo: Locator;
  readonly calorieInfo: Locator;

  // Special features
  readonly recommendedSection: Locator;
  readonly todaysSpecial: Locator;
  readonly quickOrderPresets: Locator;

  constructor(page: Page) {
    super(page, '/menu');
    
    // Filters and search
    this._searchInput =  page.locator('[data-testid
    this._categoryFilters =  page.locator('[data-testid
    this._dietaryFilters =  page.locator('[data-testid
    this._priceFilter =  page.locator('[data-testid
    this._sortOptions =  page.locator('[data-testid
    // Menu display
    this._menuGrid =  page.locator('[data-testid
    this._menuList =  page.locator('[data-testid
    this._viewToggle =  page.locator('[data-testid
    this._menuItems =  page.locator('[data-testid
    // Item interactions
    this._addToCartButtons =  page.locator('[data-testid
    this._quantityControls =  page.locator('[data-testid
    this._itemDetailsButtons =  page.locator('[data-testid
    this._favoriteButtons =  page.locator('[data-testid
    // Cart
    this._cartSidebar =  page.locator('[data-testid
    this._cartIcon =  page.locator('[data-testid
    this._cartItemCount =  page.locator('[data-testid
    this._cartItems =  page.locator('[data-testid
    this._cartTotal =  page.locator('[data-testid
    this._checkoutButton =  page.locator('[data-testid
    this._clearCartButton =  page.locator('[data-testid
    // RFID
    this._rfidScanIndicator =  page.locator('[data-testid
    this._rfidQuickOrderButton =  page.locator('[data-testid
    this._rfidStatusBanner =  page.locator('[data-testid
    // Nutrition
    this._nutritionButton =  page.locator('[data-testid
    this._nutritionModal =  page.locator('[data-testid
    this._allergenInfo =  page.locator('[data-testid
    this._calorieInfo =  page.locator('[data-testid
    // Special features
    this._recommendedSection =  page.locator('[data-testid
    this._todaysSpecial =  page.locator('[data-testid
    this._quickOrderPresets =  page.locator('[data-testid
  }

  /**
   * Search for menu items
   */
  async searchMenu(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForPageLoad();
  }

  /**
   * Filter menu by category
   */
  async filterByCategory(category: string): Promise<void> {
    const _categoryButton =  this.page.locator(`[data-testid
    await categoryButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Filter menu by dietary preferences
   */
  async filterByDietary(dietary: 'vegetarian' | 'vegan' | 'gluten-free' | 'halal'): Promise<void> {
    const _dietaryButton =  this.page.locator(`[data-testid
    await dietaryButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Add item to cart
   */
  async addItemToCart(itemName: string, quantity: _number =  1): Promise<void> {
    const item 
    await expect(item).toBeVisible();
    
    // Set quantity if needed
    if (quantity > 1) {
      const _quantityInput =  item.locator('[data-testid
      await quantityInput.fill(quantity.toString());
    }
    
    // Add to cart
    const _addButton =  item.locator('[data-testid
    await addButton.click();
    
    // Wait for cart update animation
    await this.page.waitForTimeout(500);
    
    // Verify cart count updated
    await expect(this.cartItemCount).toContainText((quantity).toString());
  }

  /**
   * Remove item from cart
   */
  async removeItemFromCart(itemName: string): Promise<void> {
    await this.openCart();
    
    const _cartItem =  this.page.locator(`[data-testid
    const _removeButton =  cartItem.locator('[data-testid
    await removeButton.click();
    
    await this.page.waitForTimeout(500);
  }

  /**
   * Open cart sidebar
   */
  async openCart(): Promise<void> {
    await this.cartIcon.click();
    await expect(this.cartSidebar).toBeVisible();
  }

  /**
   * Close cart sidebar
   */
  async closeCart(): Promise<void> {
    const _closeButton =  this.cartSidebar.locator('[data-testid
    await closeButton.click();
    await expect(this.cartSidebar).toBeHidden();
  }

  /**
   * Proceed to checkout
   */
  async proceedToCheckout(): Promise<void> {
    await this.openCart();
    await expect(this.checkoutButton).toBeEnabled();
    await this.checkoutButton.click();
    await this.page.waitForURL('**/orders**');
  }

  /**
   * View item details
   */
  async viewItemDetails(itemName: string): Promise<void> {
    const _item =  this.page.locator(`[data-testid
    const _detailsButton =  item.locator('[data-testid
    await detailsButton.click();
    
    const _modal =  this.page.locator('[data-testid
    await expect(modal).toBeVisible();
  }

  /**
   * View nutritional information
   */
  async viewNutritionInfo(itemName: string): Promise<void> {
    const _item =  this.page.locator(`[data-testid
    const _nutritionButton =  item.locator('[data-testid
    await nutritionButton.click();
    
    await expect(this.nutritionModal).toBeVisible();
    await expect(this.calorieInfo).toBeVisible();
    await expect(this.allergenInfo).toBeVisible();
  }

  /**
   * Add item to favorites
   */
  async addToFavorites(itemName: string): Promise<void> {
    const _item =  this.page.locator(`[data-testid
    const _favoriteButton =  item.locator('[data-testid
    await favoriteButton.click();
    
    // Verify favorite status
    await expect(favoriteButton).toHaveClass(/favorited|active/);
  }

  /**
   * Test RFID quick order functionality
   */
  async testRFIDQuickOrder(): Promise<void> {
    // Mock RFID scan event
    await this.mockApiResponse(/\/rfid\/scan/, {
      success: true,
      student_id: 'STU-12345',
      preset_order: {
        items: [
          { name: 'Dal Rice', quantity: 1 },
          { name: 'Sambar', quantity: 1 }
        ],
        total: 45.00
      }
    });
    
    // Simulate RFID scan
    await this.page.evaluate(_() => {
      window.dispatchEvent(new CustomEvent('rfid-scan', {
        detail: { student_id: 'STU-12345' }
      }));
    });
    
    // Verify RFID indicator shows
    await expect(this.rfidScanIndicator).toBeVisible();
    
    // Click quick order button
    await this.rfidQuickOrderButton.click();
    
    // Verify items added to cart
    await this.openCart();
    await expect(this.cartItems).toHaveCount(2);
    await expect(this.cartTotal).toContainText('45.00');
  }

  /**
   * Test menu responsive design
   */
  async testResponsiveMenu(): Promise<void> {
    const _breakpoints =  [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 }
    ];

    for (const breakpoint of breakpoints) {
      await this.verifyResponsiveDesign(breakpoint.width, breakpoint.height);
      
      // Verify menu items are visible and properly laid out
      await expect(this.menuItems).toHaveCountGreaterThan(0);
      
      // On mobile, filters might be collapsed
      if (breakpoint.width < 768) {
        const _filterToggle =  this.page.locator('[data-testid
        if (await filterToggle.isVisible()) {
          await filterToggle.click();
          await expect(this.categoryFilters).toBeVisible();
          await filterToggle.click(); // Close filters
        }
      }
      
      await this.takeScreenshot(`menu-${breakpoint.name}`);
    }
  }

  /**
   * Test search functionality
   */
  async testSearchFunctionality(): Promise<void> {
    await this.goto();
    
    // Test empty search
    await this.searchMenu('');
    const _allItemsCount =  await this.menuItems.count();
    expect(allItemsCount).toBeGreaterThan(0);
    
    // Test specific search
    await this.searchMenu('rice');
    await this.page.waitForTimeout(1000);
    const _searchResults =  await this.menuItems.count();
    expect(searchResults).toBeGreaterThan(0);
    expect(searchResults).toBeLessThanOrEqual(allItemsCount);
    
    // Test no results
    await this.searchMenu('nonexistentitem123');
    await this.page.waitForTimeout(1000);
    const _noResultsMessage =  this.page.locator('[data-testid
    await expect(noResultsMessage).toBeVisible();
  }

  /**
   * Test cart persistence across navigation
   */
  async testCartPersistence(): Promise<void> {
    await this.goto();
    
    // Add items to cart
    await this.addItemToCart('Dal Rice', 2);
    await this.addItemToCart('Sambar', 1);
    
    // Navigate away
    await this.page.goto('/dashboard');
    await this.waitForPageLoad();
    
    // Navigate back to menu
    await this.page.goto('/menu');
    await this.waitForPageLoad();
    
    // Verify cart persisted
    await this.openCart();
    await expect(this.cartItems).toHaveCount(2);
    
    const _cartTotal =  await this.cartTotal.textContent();
    expect(cartTotal).toBeTruthy();
    expect(parseFloat(cartTotal?.replace(/[^\d.]/g, '') || '0')).toBeGreaterThan(0);
  }

  /**
   * Test performance with large menu
   */
  async testMenuPerformance(): Promise<void> {
    const _startTime =  Date.now();
    
    await this.goto();
    await this.waitForPageLoad();
    
    const _loadTime =  Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
    
    // Test scrolling performance with virtual scrolling if implemented
    const _itemsBeforeScroll =  await this.menuItems.count();
    
    // Scroll down
    await this.page.evaluate(_() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(1000);
    
    // Verify more items loaded or same count if all items were visible
    const _itemsAfterScroll =  await this.menuItems.count();
    expect(itemsAfterScroll).toBeGreaterThanOrEqual(itemsBeforeScroll);
  }

  /**
   * Test accessibility compliance
   */
  async testMenuAccessibility(): Promise<void> {
    await this.goto();
    await this.waitForPageLoad();
    
    // Verify keyboard navigation
    await this.page.keyboard.press('Tab');
    const _focusedElement =  await this.page.evaluate(() 
    expect(focusedElement).toBeTruthy();
    
    // Test add to cart with keyboard
    await this.page.keyboard.press('Tab'); // Navigate to first item
    await this.page.keyboard.press('Enter'); // Add to cart
    
    // Verify screen reader labels
    const _firstItem =  this.menuItems.first();
    const _ariaLabel =  await firstItem.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('price'); // Should include price information
    
    // Run full accessibility audit
    await this.verifyAccessibility();
  }

  /**
   * Test multi-language menu
   */
  async testMultiLanguageMenu(): Promise<void> {
    const languages: Array<'en' | 'hi' | 'kn'> = ['en', 'hi', 'kn'];
    
    for (const lang of languages) {
      await this.goto();
      await this.switchLanguage(lang);
      
      // Verify menu items have translated content
      const _firstItemName =  await this.menuItems.first().locator('[data-testid
      expect(firstItemName).toBeTruthy();
      
      // Verify categories are translated
      const _categoryButtons =  await this.categoryFilters.locator('button').count();
      expect(categoryButtons).toBeGreaterThan(0);
      
      await this.takeScreenshot(`menu-${lang}`);
    }
  }

  /**
   * Verify menu item data integrity
   */
  async verifyMenuItemData(): Promise<void> {
    await this.goto();
    await this.waitForPageLoad();
    
    const _items =  this.menuItems;
    const _itemCount =  await items.count();
    
    for (let i = 0; i < Math.min(itemCount, 5); i++) { // Check first 5 items
      const _item =  items.nth(i);
      
      // Verify required elements exist
      await expect(item.locator('[data-_testid = "item-name"]')).toBeVisible();
      await expect(item.locator('[data-_testid = "item-price"]')).toBeVisible();
      await expect(item.locator('[data-_testid = "item-image"]')).toBeVisible();
      await expect(item.locator('[data-_testid = "add-to-cart"]')).toBeVisible();
      
      // Verify price format
      const _priceText =  await item.locator('[data-testid
      expect(priceText).toMatch(/₹?\s*\d+(\.\d{2})?/); // Indian Rupee format
    }
  }
}