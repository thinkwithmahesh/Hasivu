// Production-level Menu Service for HASIVU Platform
// Maps all 10 menu management backend API endpoints to TypeScript service methods
// Complete admin menu creation workflow + parent menu browsing experience
// Integrates with nutrition.service.ts for nutritional data aggregation
// Critical for food service delivery, parent ordering, and nutrition compliance

import apiClient from './api';
import type { AllergenType, Allergen, NutritionalInfo, DietaryInfo } from './nutrition.service';

// ============================================================================
// Type Definitions & Interfaces
// ============================================================================

/**
 * Generic API response wrapper
 */
interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Menu lifecycle status
 * Represents complete approval and publishing workflow
 */
export type MenuStatus =
  | 'draft' // Being created by admin, not visible to anyone
  | 'review' // Submitted for admin review/approval
  | 'approved' // Approved by admin, ready to publish
  | 'published' // Published and visible to parents
  | 'active' // Currently active (serving today)
  | 'archived' // Past menu, no longer active
  | 'rejected'; // Rejected during review process

/**
 * Meal types for menu categorization
 */
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

/**
 * Menu item category classification
 */
export type MenuItemCategory =
  | 'main-course'
  | 'side-dish'
  | 'beverage'
  | 'dessert'
  | 'appetizer'
  | 'salad'
  | 'soup';

/**
 * Menu pricing structure with role-based pricing
 */
export interface MenuPricing {
  basePrice: number; // Base price for menu
  studentPrice: number; // Price for students
  staffPrice?: number; // Optional price for staff
  guestPrice?: number; // Optional price for guests
  currency: 'INR'; // Currency (Indian Rupees)
  taxIncluded: boolean; // Whether tax is included in price
  taxRate?: number; // Tax rate percentage (e.g., 5 for 5%)
}

/**
 * Aggregated nutrition summary for entire menu
 */
export interface NutritionSummary {
  totalCalories: number;
  totalProtein: number; // grams
  totalCarbs: number; // grams
  totalFat: number; // grams
  totalFiber: number; // grams
  totalSugar: number; // grams
  totalSodium: number; // mg
  totalCholesterol: number; // mg
  averageCaloriesPerItem: number;
  meetsGuidelines: boolean; // Whether menu meets nutritional guidelines
  guidelineNotes?: string[]; // Any nutritional concerns or recommendations
}

/**
 * Menu item with complete nutritional information
 */
export interface MenuItem {
  id: string;
  menuId: string; // Parent menu ID
  name: string;
  description: string;
  category: MenuItemCategory;
  price: number; // Price per item in INR
  available: boolean; // Whether item is currently available
  maxQuantity?: number; // Maximum quantity per order
  imageUrl?: string; // Item image URL
  ingredients: string[]; // List of ingredients
  nutritionalInfo: NutritionalInfo;
  allergens: Allergen[];
  dietaryInfo: DietaryInfo;
  preparationTime?: number; // Preparation time in minutes
  servingSize: string; // e.g., "1 serving (250g)"
  calories: number; // Calories per serving
  displayOrder: number; // Order for display in menu (lower = first)
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Menu item creation request
 */
export interface CreateMenuItemRequest {
  name: string;
  description: string;
  category: MenuItemCategory;
  price: number;
  available?: boolean;
  maxQuantity?: number;
  imageUrl?: string;
  ingredients: string[];
  nutritionalInfo?: Partial<NutritionalInfo>; // Optional, can be calculated
  allergens?: AllergenType[];
  dietaryInfo?: Partial<DietaryInfo>;
  preparationTime?: number;
  servingSize: string;
  calories: number;
  displayOrder?: number;
}

/**
 * Menu item update request
 */
export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  category?: MenuItemCategory;
  price?: number;
  available?: boolean;
  maxQuantity?: number;
  imageUrl?: string;
  ingredients?: string[];
  allergens?: AllergenType[];
  dietaryInfo?: Partial<DietaryInfo>;
  preparationTime?: number;
  displayOrder?: number;
}

/**
 * Complete menu structure with items
 */
export interface Menu {
  id: string;
  schoolId: string;
  schoolName?: string;
  name: string;
  description?: string;
  date: string; // Service date (ISO date string)
  mealType: MealType;
  category: string; // e.g., 'vegetarian', 'non-vegetarian', 'special-diet'
  status: MenuStatus;
  items: MenuItem[];
  totalItems: number; // Count of items in menu
  pricing: MenuPricing;
  nutritionSummary: NutritionSummary;
  allergenWarnings: string[]; // Aggregated allergen warnings from all items

  // Publishing metadata
  publishedAt?: string; // ISO timestamp
  publishedBy?: string; // Admin user ID who published

  // Approval metadata
  approvedAt?: string; // ISO timestamp
  approvedBy?: string; // Admin user ID who approved
  approvalNotes?: string; // Notes from approval process
  rejectionReason?: string; // Reason for rejection (if rejected)

  // Creation metadata
  createdBy: string; // Admin user ID who created
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Menu summary for list views (without items)
 */
export interface MenuSummary {
  id: string;
  schoolId: string;
  schoolName?: string;
  name: string;
  description?: string;
  date: string;
  mealType: MealType;
  category: string;
  status: MenuStatus;
  totalItems: number;
  pricing: MenuPricing;
  allergenWarnings: string[];
  publishedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Menu creation request
 */
export interface CreateMenuRequest {
  schoolId: string;
  name: string;
  description?: string;
  date: string; // Service date (ISO date string)
  mealType: MealType;
  category: string;
  pricing: MenuPricing;
  items?: CreateMenuItemRequest[]; // Optional initial items
  notes?: string; // Admin notes
}

/**
 * Menu update request
 */
export interface UpdateMenuRequest {
  name?: string;
  description?: string;
  date?: string;
  mealType?: MealType;
  category?: string;
  pricing?: Partial<MenuPricing>;
  notes?: string;
}

/**
 * Menu publish request
 */
export interface PublishMenuRequest {
  publishNow?: boolean; // Publish immediately or schedule
  scheduledPublishDate?: string; // ISO timestamp for scheduled publishing
  notifyParents?: boolean; // Send notification to parents
  notes?: string; // Publishing notes
}

/**
 * Menu approval request
 */
export interface ApproveMenuRequest {
  approved: boolean; // true = approve, false = reject
  notes?: string; // Approval/rejection notes
  requiredChanges?: string[]; // List of required changes (if rejected)
}

/**
 * Menu filters for browsing and searching
 */
export interface MenuFilters {
  date?: string; // Filter by specific date (ISO date string)
  dateFrom?: string; // Filter by date range start
  dateTo?: string; // Filter by date range end
  mealType?: MealType; // Filter by meal type
  category?: string; // Filter by category (vegetarian, etc.)
  status?: MenuStatus | MenuStatus[]; // Filter by status
  schoolId?: string; // Filter by school
  active?: boolean; // Filter for currently active menus
  published?: boolean; // Filter for published menus only
  search?: string; // Search in name, description, items
  allergenFree?: AllergenType[]; // Filter menus without specific allergens
  dietaryCompliant?: keyof DietaryInfo; // Filter by dietary compliance
  page?: number; // Pagination
  limit?: number; // Items per page
  sortBy?: 'date' | 'createdAt' | 'name' | 'status';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Menu statistics and analytics
 */
export interface MenuStats {
  totalMenus: number;
  menusByStatus: Record<MenuStatus, number>;
  menusByMealType: Record<MealType, number>;
  averageItemsPerMenu: number;
  mostPopularItems: {
    menuItemId: string;
    menuItemName: string;
    appearanceCount: number;
    orderCount: number;
  }[];
  allergenDistribution: {
    allergenType: AllergenType;
    menuCount: number;
    percentage: number;
  }[];
  nutritionTrends: {
    averageCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFat: number;
    complianceRate: number; // % of menus meeting guidelines
  };
  upcomingMenus: MenuSummary[]; // Next 7 days of menus
}

/**
 * Menu approval workflow metadata
 */
export interface MenuApprovalWorkflow {
  menuId: string;
  currentStatus: MenuStatus;
  submittedAt?: string;
  submittedBy: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  publishedAt?: string;
  publishedBy?: string;
  history: {
    timestamp: string;
    status: MenuStatus;
    changedBy: string;
    notes?: string;
  }[];
}

// ============================================================================
// Menu Service Class
// ============================================================================

/**
 * Menu Service
 * Handles all menu management operations including:
 * - Menu CRUD operations (create, read, update, delete)
 * - Menu item management (add, update, remove items)
 * - Menu approval workflow (draft → review → approved → published)
 * - Menu publishing and activation
 * - Parent menu browsing with filters
 * - Nutrition and allergen aggregation
 * - Menu statistics and analytics
 *
 * Integration points:
 * - Nutrition service: Allergen and nutrition data aggregation
 * - Order service: Parent ordering from published menus
 * - School service: School-specific menu management
 */
class MenuService {
  // ==========================================================================
  // Menu CRUD Operations
  // ==========================================================================

  /**
   * Endpoint: POST /menus
   * Create new menu
   * Creates a draft menu with optional initial items
   * Status: 'draft', not visible to parents until published
   *
   * @param request - Menu creation request
   * @returns Created menu with draft status
   *
   * @example
   * ```typescript
   * const menu = await menuService.createMenu({
   *   schoolId: 'school123',
   *   name: 'Healthy Lunch Menu',
   *   description: 'Nutritious lunch options for students',
   *   date: '2024-10-25',
   *   mealType: 'lunch',
   *   category: 'vegetarian',
   *   pricing: {
   *     basePrice: 100,
   *     studentPrice: 80,
   *     currency: 'INR',
   *     taxIncluded: true
   *   },
   *   items: [
   *     {
   *       name: 'Vegetable Biryani',
   *       description: 'Aromatic rice with mixed vegetables',
   *       category: 'main-course',
   *       price: 50,
   *       ingredients: ['rice', 'vegetables', 'spices'],
   *       servingSize: '1 plate (300g)',
   *       calories: 350,
   *       displayOrder: 1
   *     }
   *   ]
   * });
   * console.log(`Menu created: ${menu.id} - Status: ${menu.status}`);
   * ```
   */
  async createMenu(request: CreateMenuRequest): Promise<Menu> {
    try {
      const response = await apiClient.post<ApiResponse<Menu>>('/menus', request);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create menu:', error);
      throw new Error('Unable to create menu. Please try again.');
    }
  }

  /**
   * Endpoint: GET /menus
   * List menus with filters
   * Supports pagination, filtering by date, status, school, meal type
   * Returns menu summaries without full item details
   *
   * @param filters - Menu list filters
   * @returns Paginated list of menu summaries
   *
   * @example
   * ```typescript
   * // Get published menus for today
   * const todayMenus = await menuService.listMenus({
   *   date: '2024-10-25',
   *   status: 'published',
   *   mealType: 'lunch'
   * });
   *
   * // Get all menus for a school
   * const schoolMenus = await menuService.listMenus({
   *   schoolId: 'school123',
   *   sortBy: 'date',
   *   sortOrder: 'desc',
   *   page: 1,
   *   limit: 20
   * });
   *
   * // Get menus without specific allergens
   * const allergenFreeMenus = await menuService.listMenus({
   *   allergenFree: ['peanuts', 'tree_nuts'],
   *   published: true
   * });
   * ```
   */
  async listMenus(filters?: MenuFilters): Promise<{
    menus: MenuSummary[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          menus: MenuSummary[];
          meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }>
      >('/menus', { params: filters });
      return response.data.data;
    } catch (error) {
      console.error('Failed to list menus:', error);
      throw new Error('Unable to fetch menus. Please try again.');
    }
  }

  /**
   * Endpoint: GET /menus/:id
   * Get single menu with all items and details
   * Returns complete menu information including all items with nutrition data
   *
   * @param menuId - Menu ID
   * @returns Complete menu details with all items
   *
   * @example
   * ```typescript
   * const menu = await menuService.getMenu('menu123');
   * console.log(`Menu: ${menu.name}`);
   * console.log(`Items: ${menu.items.length}`);
   * console.log(`Total calories: ${menu.nutritionSummary.totalCalories}`);
   * console.log(`Allergen warnings: ${menu.allergenWarnings.join(', ')}`);
   * console.log(`Status: ${menu.status}`);
   * ```
   */
  async getMenu(menuId: string): Promise<Menu> {
    try {
      const response = await apiClient.get<ApiResponse<Menu>>(`/menus/${menuId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to get menu:', error);
      throw new Error('Unable to fetch menu details. Please try again.');
    }
  }

  /**
   * Endpoint: PUT /menus/:id
   * Update menu (name, date, category, pricing)
   * Can only update menus in 'draft' or 'review' status
   * Cannot update published or active menus
   *
   * @param menuId - Menu ID
   * @param updates - Fields to update
   * @returns Updated menu
   *
   * @example
   * ```typescript
   * // Update menu name and date
   * const updated = await menuService.updateMenu('menu123', {
   *   name: 'Updated Lunch Menu',
   *   date: '2024-10-26',
   *   description: 'New description with more details'
   * });
   *
   * // Update pricing
   * const updated = await menuService.updateMenu('menu123', {
   *   pricing: {
   *     studentPrice: 75,
   *     staffPrice: 90
   *   }
   * });
   * ```
   */
  async updateMenu(menuId: string, updates: UpdateMenuRequest): Promise<Menu> {
    try {
      const response = await apiClient.put<ApiResponse<Menu>>(`/menus/${menuId}`, updates);
      return response.data.data;
    } catch (error) {
      console.error('Failed to update menu:', error);
      throw new Error('Unable to update menu. Please try again.');
    }
  }

  /**
   * Endpoint: DELETE /menus/:id
   * Delete menu (only draft status)
   * Can only delete menus that are in 'draft' status
   * Cannot delete menus that have been reviewed, approved, or published
   *
   * @param menuId - Menu ID
   * @returns Deletion confirmation
   *
   * @example
   * ```typescript
   * await menuService.deleteMenu('menu123');
   * console.log('Menu deleted successfully');
   * ```
   */
  async deleteMenu(menuId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await apiClient.delete<
        ApiResponse<{
          success: boolean;
          message: string;
        }>
      >(`/menus/${menuId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to delete menu:', error);
      throw new Error('Unable to delete menu. Please try again.');
    }
  }

  // ==========================================================================
  // Menu Item Management
  // ==========================================================================

  /**
   * Endpoint: POST /menus/:id/items
   * Add menu item to menu
   * Adds a new item to the menu and recalculates nutrition summary
   * Can add items to menus in 'draft' or 'review' status
   *
   * @param menuId - Menu ID
   * @param item - Menu item creation request
   * @returns Created menu item
   *
   * @example
   * ```typescript
   * const menuItem = await menuService.addMenuItem('menu123', {
   *   name: 'Paneer Tikka',
   *   description: 'Grilled cottage cheese with spices',
   *   category: 'main-course',
   *   price: 60,
   *   ingredients: ['paneer', 'yogurt', 'spices', 'bell peppers'],
   *   servingSize: '4 pieces (150g)',
   *   calories: 280,
   *   allergens: ['milk'],
   *   dietaryInfo: {
   *     vegetarian: true,
   *     glutenFree: true
   *   },
   *   displayOrder: 2
   * });
   * console.log(`Item added: ${menuItem.id}`);
   * ```
   */
  async addMenuItem(menuId: string, item: CreateMenuItemRequest): Promise<MenuItem> {
    try {
      const response = await apiClient.post<ApiResponse<MenuItem>>(`/menus/${menuId}/items`, item);
      return response.data.data;
    } catch (error) {
      console.error('Failed to add menu item:', error);
      throw new Error('Unable to add menu item. Please try again.');
    }
  }

  /**
   * Endpoint: PUT /menus/:id/items/:itemId
   * Update menu item
   * Updates existing menu item and recalculates nutrition summary
   * Can update items in menus with 'draft' or 'review' status
   *
   * @param menuId - Menu ID
   * @param itemId - Menu item ID
   * @param updates - Fields to update
   * @returns Updated menu item
   *
   * @example
   * ```typescript
   * // Update item price and availability
   * const updated = await menuService.updateMenuItem('menu123', 'item456', {
   *   price: 65,
   *   available: true,
   *   description: 'Updated description with more details'
   * });
   *
   * // Update dietary information
   * const updated = await menuService.updateMenuItem('menu123', 'item456', {
   *   dietaryInfo: {
   *     vegan: true,
   *     organic: true
   *   }
   * });
   * ```
   */
  async updateMenuItem(
    menuId: string,
    itemId: string,
    updates: UpdateMenuItemRequest
  ): Promise<MenuItem> {
    try {
      const response = await apiClient.put<ApiResponse<MenuItem>>(
        `/menus/${menuId}/items/${itemId}`,
        updates
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to update menu item:', error);
      throw new Error('Unable to update menu item. Please try again.');
    }
  }

  /**
   * Endpoint: DELETE /menus/:id/items/:itemId
   * Remove menu item from menu
   * Removes item from menu and recalculates nutrition summary
   * Can remove items from menus in 'draft' or 'review' status
   *
   * @param menuId - Menu ID
   * @param itemId - Menu item ID
   * @returns Deletion confirmation
   *
   * @example
   * ```typescript
   * await menuService.removeMenuItem('menu123', 'item456');
   * console.log('Menu item removed successfully');
   * ```
   */
  async removeMenuItem(
    menuId: string,
    itemId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await apiClient.delete<
        ApiResponse<{
          success: boolean;
          message: string;
        }>
      >(`/menus/${menuId}/items/${itemId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to remove menu item:', error);
      throw new Error('Unable to remove menu item. Please try again.');
    }
  }

  // ==========================================================================
  // Menu Approval Workflow
  // ==========================================================================

  /**
   * Endpoint: POST /menus/:id/approve
   * Approve or reject menu (admin approval workflow)
   * Moves menu from 'review' to 'approved' or 'rejected' status
   * Only admins can approve/reject menus
   *
   * @param menuId - Menu ID
   * @param approval - Approval/rejection details
   * @returns Updated menu with approval status
   *
   * @example
   * ```typescript
   * // Approve menu
   * const approved = await menuService.approveMenu('menu123', {
   *   approved: true,
   *   notes: 'Menu meets all nutritional guidelines. Approved for publishing.'
   * });
   * console.log(`Menu approved: ${approved.approvedAt}`);
   *
   * // Reject menu with required changes
   * const rejected = await menuService.approveMenu('menu123', {
   *   approved: false,
   *   notes: 'Menu needs adjustments',
   *   requiredChanges: [
   *     'Reduce sodium content in main course',
   *     'Add more vegetable options',
   *     'Include allergen information for all items'
   *   ]
   * });
   * console.log(`Menu rejected: ${rejected.rejectionReason}`);
   * ```
   */
  async approveMenu(menuId: string, approval: ApproveMenuRequest): Promise<Menu> {
    try {
      const response = await apiClient.post<ApiResponse<Menu>>(
        `/menus/${menuId}/approve`,
        approval
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to approve/reject menu:', error);
      throw new Error('Unable to process menu approval. Please try again.');
    }
  }

  /**
   * Submit menu for review
   * Helper method to move menu from 'draft' to 'review' status
   * Must be called before menu can be approved
   *
   * @param menuId - Menu ID
   * @param notes - Optional submission notes
   * @returns Updated menu in review status
   *
   * @example
   * ```typescript
   * const submitted = await menuService.submitForReview('menu123', {
   *   notes: 'Menu ready for approval. All items have nutritional data.'
   * });
   * console.log(`Menu submitted for review: ${submitted.status}`);
   * ```
   */
  async submitForReview(menuId: string, notes?: string): Promise<Menu> {
    try {
      const response = await apiClient.post<ApiResponse<Menu>>(`/menus/${menuId}/submit`, {
        notes,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to submit menu for review:', error);
      throw new Error('Unable to submit menu for review. Please try again.');
    }
  }

  // ==========================================================================
  // Menu Publishing
  // ==========================================================================

  /**
   * Endpoint: POST /menus/:id/publish
   * Publish menu (make visible to parents)
   * Moves menu from 'approved' to 'published' status
   * Makes menu visible to parents for ordering
   * Can schedule publishing for future date
   *
   * @param menuId - Menu ID
   * @param options - Publishing options
   * @returns Published menu
   *
   * @example
   * ```typescript
   * // Publish menu immediately
   * const published = await menuService.publishMenu('menu123', {
   *   publishNow: true,
   *   notifyParents: true,
   *   notes: 'New lunch menu for next week'
   * });
   * console.log(`Menu published: ${published.publishedAt}`);
   *
   * // Schedule publishing for future date
   * const scheduled = await menuService.publishMenu('menu123', {
   *   publishNow: false,
   *   scheduledPublishDate: '2024-10-24T00:00:00Z',
   *   notifyParents: true
   * });
   * console.log(`Menu scheduled for publishing: ${scheduled.publishedAt}`);
   * ```
   */
  async publishMenu(menuId: string, options?: PublishMenuRequest): Promise<Menu> {
    try {
      const response = await apiClient.post<ApiResponse<Menu>>(
        `/menus/${menuId}/publish`,
        options || { publishNow: true }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to publish menu:', error);
      throw new Error('Unable to publish menu. Please try again.');
    }
  }

  /**
   * Unpublish menu
   * Helper method to unpublish a menu (move from 'published' back to 'approved')
   * Used to temporarily hide menu from parents
   *
   * @param menuId - Menu ID
   * @param reason - Reason for unpublishing
   * @returns Updated menu
   *
   * @example
   * ```typescript
   * const unpublished = await menuService.unpublishMenu('menu123',
   *   'Temporarily unavailable due to ingredient shortage'
   * );
   * console.log(`Menu unpublished: ${unpublished.status}`);
   * ```
   */
  async unpublishMenu(menuId: string, reason?: string): Promise<Menu> {
    try {
      const response = await apiClient.post<ApiResponse<Menu>>(`/menus/${menuId}/unpublish`, {
        reason,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to unpublish menu:', error);
      throw new Error('Unable to unpublish menu. Please try again.');
    }
  }

  // ==========================================================================
  // Menu Analytics and Statistics
  // ==========================================================================

  /**
   * Get menu statistics and analytics
   * Provides aggregated data for dashboards and reporting
   *
   * @param filters - Optional filters for statistics
   * @returns Menu statistics
   *
   * @example
   * ```typescript
   * const stats = await menuService.getMenuStats({
   *   schoolId: 'school123',
   *   dateFrom: '2024-10-01',
   *   dateTo: '2024-10-31'
   * });
   * console.log(`Total menus: ${stats.totalMenus}`);
   * console.log(`Average items per menu: ${stats.averageItemsPerMenu}`);
   * console.log(`Most popular item: ${stats.mostPopularItems[0]?.menuItemName}`);
   * ```
   */
  async getMenuStats(filters?: Partial<MenuFilters>): Promise<MenuStats> {
    try {
      const response = await apiClient.get<ApiResponse<MenuStats>>('/menus/stats', {
        params: filters,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to get menu statistics:', error);
      throw new Error('Unable to fetch menu statistics. Please try again.');
    }
  }

  /**
   * Get menu approval workflow history
   * Provides complete approval workflow history for a menu
   *
   * @param menuId - Menu ID
   * @returns Workflow history
   *
   * @example
   * ```typescript
   * const workflow = await menuService.getApprovalWorkflow('menu123');
   * console.log(`Current status: ${workflow.currentStatus}`);
   * console.log(`Submitted at: ${workflow.submittedAt}`);
   * console.log(`Approved at: ${workflow.approvedAt}`);
   * console.log(`History entries: ${workflow.history.length}`);
   * ```
   */
  async getApprovalWorkflow(menuId: string): Promise<MenuApprovalWorkflow> {
    try {
      const response = await apiClient.get<ApiResponse<MenuApprovalWorkflow>>(
        `/menus/${menuId}/workflow`
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to get approval workflow:', error);
      throw new Error('Unable to fetch approval workflow. Please try again.');
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Check if menu can be modified
   * Menus can only be modified in 'draft' or 'review' status
   *
   * @param menu - Menu to check
   * @returns Whether menu can be modified
   */
  canModifyMenu(menu: Menu | MenuSummary): boolean {
    const modifiableStatuses: MenuStatus[] = ['draft', 'review'];
    return modifiableStatuses.includes(menu.status);
  }

  /**
   * Check if menu can be deleted
   * Menus can only be deleted in 'draft' status
   *
   * @param menu - Menu to check
   * @returns Whether menu can be deleted
   */
  canDeleteMenu(menu: Menu | MenuSummary): boolean {
    return menu.status === 'draft';
  }

  /**
   * Check if menu can be published
   * Menus can only be published if they are 'approved'
   *
   * @param menu - Menu to check
   * @returns Whether menu can be published
   */
  canPublishMenu(menu: Menu | MenuSummary): boolean {
    return menu.status === 'approved';
  }

  /**
   * Check if menu is visible to parents
   * Menus are visible to parents when 'published' or 'active'
   *
   * @param menu - Menu to check
   * @returns Whether menu is visible to parents
   */
  isVisibleToParents(menu: Menu | MenuSummary): boolean {
    const visibleStatuses: MenuStatus[] = ['published', 'active'];
    return visibleStatuses.includes(menu.status);
  }

  /**
   * Get human-readable status label
   * Converts status enum to user-friendly text
   *
   * @param status - Menu status
   * @returns Human-readable status text
   */
  getStatusLabel(status: MenuStatus): string {
    const labels: Record<MenuStatus, string> = {
      draft: 'Draft',
      review: 'Under Review',
      approved: 'Approved',
      published: 'Published',
      active: 'Active',
      archived: 'Archived',
      rejected: 'Rejected',
    };
    return labels[status] || status;
  }

  /**
   * Get status color for UI
   * Returns color code for status badges
   *
   * @param status - Menu status
   * @returns Color code (success, warning, error, info)
   */
  getStatusColor(status: MenuStatus): 'success' | 'warning' | 'error' | 'info' {
    const colors: Record<MenuStatus, 'success' | 'warning' | 'error' | 'info'> = {
      draft: 'info',
      review: 'warning',
      approved: 'success',
      published: 'success',
      active: 'success',
      archived: 'info',
      rejected: 'error',
    };
    return colors[status] || 'info';
  }

  /**
   * Format menu date for display
   * Converts ISO date string to human-readable format
   *
   * @param dateString - ISO date string
   * @param locale - Locale for formatting (default: 'en-IN')
   * @returns Formatted date string
   */
  formatMenuDate(dateString: string, locale: string = 'en-IN'): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  /**
   * Get allergen summary for menu
   * Returns formatted allergen warning string
   *
   * @param menu - Menu object
   * @returns Formatted allergen summary
   */
  getAllergenSummary(menu: Menu | MenuSummary): string {
    if (!menu.allergenWarnings || menu.allergenWarnings.length === 0) {
      return 'No major allergens';
    }
    return `Contains: ${menu.allergenWarnings.join(', ')}`;
  }

  /**
   * Calculate total menu calories
   * Sums calories from all menu items
   *
   * @param menu - Menu object with items
   * @returns Total calories
   */
  getTotalCalories(menu: Menu): number {
    return menu.nutritionSummary?.totalCalories || 0;
  }

  /**
   * Check if menu meets nutritional guidelines
   * Returns whether menu meets nutritional guidelines
   *
   * @param menu - Menu object
   * @returns Whether menu meets guidelines
   */
  meetsNutritionalGuidelines(menu: Menu): boolean {
    return menu.nutritionSummary?.meetsGuidelines || false;
  }

  /**
   * Get next lifecycle status for menu
   * Returns the next valid status in the workflow
   *
   * @param currentStatus - Current menu status
   * @returns Next status in workflow
   */
  getNextStatus(currentStatus: MenuStatus): MenuStatus | null {
    const workflow: Record<MenuStatus, MenuStatus | null> = {
      draft: 'review',
      review: 'approved',
      approved: 'published',
      published: 'active',
      active: 'archived',
      archived: null,
      rejected: 'draft',
    };
    return workflow[currentStatus] || null;
  }

  /**
   * Format currency for display
   *
   * @param amount - Amount to format
   * @returns Formatted currency string
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Filter menus by dietary requirements
   * Client-side filtering of menus based on dietary restrictions
   *
   * @param menus - Array of menus to filter
   * @param dietaryRequirements - Dietary requirements
   * @returns Filtered menus
   */
  filterByDietaryRequirements(
    menus: (Menu | MenuSummary)[],
    dietaryRequirements: Partial<DietaryInfo>
  ): (Menu | MenuSummary)[] {
    return menus.filter(menu => {
      // For menu summaries, we can only filter by allergen warnings
      // For full menus, we can check all items
      if ('items' in menu && menu.items) {
        return menu.items.every(item => {
          const { dietaryInfo } = item;
          for (const [key, required] of Object.entries(dietaryRequirements)) {
            if (required && !dietaryInfo[key as keyof DietaryInfo]) {
              return false;
            }
          }
          return true;
        });
      }
      return true; // Can't filter summaries without full item data
    });
  }

  /**
   * Get menus for specific date range
   * Helper to get menus between two dates
   *
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @param filters - Additional filters
   * @returns Promise of filtered menus
   */
  async getMenusForDateRange(
    startDate: string,
    endDate: string,
    filters?: Partial<MenuFilters>
  ): Promise<MenuSummary[]> {
    const result = await this.listMenus({
      ...filters,
      dateFrom: startDate,
      dateTo: endDate,
    });
    return result.menus;
  }

  /**
   * Get active menus for today
   * Helper to get today's active menus
   *
   * @param schoolId - Optional school ID filter
   * @returns Promise of today's active menus
   */
  async getTodayMenus(schoolId?: string): Promise<MenuSummary[]> {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.listMenus({
      date: today,
      active: true,
      schoolId,
      status: ['published', 'active'],
    });
    return result.menus;
  }

  /**
   * Get upcoming menus for next N days
   * Helper to get upcoming menus
   *
   * @param days - Number of days to look ahead (default: 7)
   * @param schoolId - Optional school ID filter
   * @returns Promise of upcoming menus
   */
  async getUpcomingMenus(days: number = 7, schoolId?: string): Promise<MenuSummary[]> {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const result = await this.listMenus({
      dateFrom: today.toISOString().split('T')[0],
      dateTo: endDate.toISOString().split('T')[0],
      schoolId,
      status: ['published', 'active'],
      sortBy: 'date',
      sortOrder: 'asc',
    });
    return result.menus;
  }
}

// ============================================================================
// Export Service Instance
// ============================================================================

/**
 * Singleton instance of MenuService
 * Use this for all menu management operations
 */
export const menuService = new MenuService();

/**
 * Export service class for testing and extension
 */
export default MenuService;

// ============================================================================
// Export All Types
// ============================================================================

// Remove duplicate exports - these are already exported above
// export type {
//   Menu,
//   MenuSummary,
//   MenuItem,
//   MenuStatus,
//   MealType,
//   MenuItemCategory,
//   MenuPricing,
//   NutritionSummary,
//   CreateMenuRequest,
//   UpdateMenuRequest,
//   CreateMenuItemRequest,
//   UpdateMenuItemRequest,
//   PublishMenuRequest,
//   ApproveMenuRequest,
//   MenuFilters,
//   MenuStats,
//   MenuApprovalWorkflow,
//   ApiResponse,
// };
