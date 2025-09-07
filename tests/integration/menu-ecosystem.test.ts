/**
 * HASIVU Platform - Menu Ecosystem Integration Tests
 * 
 * Comprehensive integration testing for the complete menu management ecosystem
 * covering menu items, planning, daily operations, cross-system integrations,
 * and performance validation across the restaurant management platform.
 * 
 * This test suite validates:
 * - Menu item lifecycle management and data consistency
 * - Menu planning workflows with dietary restrictions
 * - Daily menu operations and real-time adjustments
 * - Cross-epic integrations (payment, RFID, notifications)
 * - Performance and scalability under load
 * - Seasonal menu transitions and availability management
 * - Order tracking and delivery verification
 * - Analytics and reporting for menu performance
 */

import { MenuItemService as MenuService } from '@/services/menuItem.service';
import { MenuPlanService } from '@/services/menuPlan.service';
import { DailyMenuService } from '@/services/dailyMenu.service';
import { ValidationService } from '@/services/validation.service';
import { DatabaseService } from '@/services/database.service';
import { PaymentService } from '@/services/payment.service';
import { RFIDService } from '@/services/rfid.service';
import { NotificationService } from '@/services/notification.service';
import { AnalyticsService } from '@/services/analytics.service';
import { TestDataFactory, DatabaseTestHelper } from '../utils/test-helpers';
import { MenuItemData, MenuPlanData, DailyMenuData } from '@/types/menu.types';

describe('Menu Ecosystem Integration Tests', () => {
  let menuService: MenuService;
  let menuPlanService: MenuPlanService;
  let dailyMenuService: DailyMenuService;
  let validationService: ValidationService;
  let databaseService: DatabaseService;
  let paymentService: PaymentService;
  let rfidService: RFIDService;
  let notificationService: NotificationService;
  let analyticsService: AnalyticsService;

  beforeAll(async () => {
    // Initialize test database and services
    await DatabaseTestHelper.setupTestDatabase();
    
    // Setup test configuration
    process.env.TEST_MODE = 'integration';
    process.env.MENU_CACHE_TTL = '0'; // Disable caching for tests
    process.env.NOTIFICATION_PROVIDER = 'test';
    
    // Seed base test data
    await DatabaseTestHelper.seedBaseTestData();
  });

  beforeEach(async () => {
    // Initialize service instances
    menuService = new MenuService();
    menuPlanService = new MenuPlanService();
    dailyMenuService = new DailyMenuService();
    validationService = new ValidationService();
    databaseService = new DatabaseService();
    paymentService = new PaymentService();
    rfidService = new RFIDService();
    notificationService = new NotificationService();
    analyticsService = new AnalyticsService();

    // Clear and reset test data
    await DatabaseTestHelper.clearAllTables();
    await DatabaseTestHelper.seedTestData();
    
    // Reset service states
    await menuService.clearCache();
    await notificationService.clearQueue();
  });

  afterEach(async () => {
    // Cleanup after each test
    await DatabaseTestHelper.clearTestData();
    await menuService.disconnect();
    await notificationService.disconnect();
  });

  afterAll(async () => {
    // Final cleanup
    await DatabaseTestHelper.teardownTestDatabase();
    
    // Reset environment
    delete process.env.TEST_MODE;
    delete process.env.MENU_CACHE_TTL;
    delete process.env.NOTIFICATION_PROVIDER;
  });

  describe('Menu Item Lifecycle Management', () => {
    it('should handle complete menu item creation workflow with validation', async () => {
      // Create comprehensive menu item data
      const menuItemData: MenuItemData = {
        ...TestDataFactory.menuItem(),
        name: 'Healthy Quinoa Bowl',
        description: 'Nutritious quinoa with fresh vegetables and herbs',
        price: 85.00,
        category: 'main-course',
        ingredients: ['quinoa', 'broccoli', 'carrots', 'olive oil', 'herbs'],
        allergens: ['none'],
        nutritionalInfo: {
          calories: 420,
          protein: 15,
          carbs: 65,
          fat: 12,
          fiber: 8,
          sugar: 6,
          sodium: 380
        },
        preparationTime: 20,
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        isAvailable: true,
        seasonality: ['spring', 'summer'],
        tags: ['healthy', 'organic', 'superfood']
      };

      // Create menu item
      const createdItem = await menuService.createMenuItem(menuItemData as any);

      // Validate creation results
      expect(createdItem).toBeDefined();
      expect(createdItem.id).toBeDefined();
      expect(createdItem.name).toBe(menuItemData.name);
      expect(createdItem.isActive).toBe(true);
      expect(createdItem.schoolId).toBe(menuItemData.schoolId);
      expect(createdItem.createdAt).toBeInstanceOf(Date);
      expect(createdItem.updatedAt).toBeInstanceOf(Date);

      // Verify nutritional information storage
      expect(createdItem.nutritionalInfo.calories).toBe(420);
      expect(createdItem.nutritionalInfo.protein).toBe(15);
      expect(createdItem.ingredients).toEqual(menuItemData.ingredients);

      // Verify database consistency
      const dbItem = await menuService.getMenuItemById(createdItem.id);
      expect(dbItem).toBeTruthy();
      expect(dbItem!.nutritionalInfo.calories).toBe(420);
      expect(dbItem!.ingredients).toEqual(menuItemData.ingredients);
      expect(dbItem!.tags).toEqual(['healthy', 'organic', 'superfood']);

      // Test search functionality
      const searchResults = await menuService.searchMenuItems({
        query: 'quinoa',
        schoolId: menuItemData.schoolId!,
        filters: {
          category: 'main-course' as any
        } as any
      });
      
      expect((searchResults as any).items).toHaveLength(1);
      expect((searchResults as any).items[0].id).toBe(createdItem.id);
      expect((searchResults as any).totalCount).toBe(1);

      // Validate dietary classifications
      expect((createdItem as any).isVegan).toBe(true);
      expect((createdItem as any).isVegetarian).toBe(true);
      expect((createdItem as any).isGlutenFree).toBe(true);
    });

    it('should maintain referential integrity during menu item updates', async () => {
      // Create menu item
      const menuItem = await menuService.createMenuItem(
        TestDataFactory.menuItem({ 
          name: 'Original Item',
          price: 75.00,
          category: 'main-course'
        }) as any
      );

      // Create menu plan that references the item
      const menuPlan = await menuPlanService.createMenuPlan({
        ...TestDataFactory.menuPlan(),
        items: [menuItem.id],
        planDate: new Date('2024-01-15'),
        mealType: 'lunch'
      } as any);

      expect((menuPlan as any).items).toContain(menuItem.id);

      // Update menu item
      const updatedItem = await menuService.updateMenuItem(menuItem.id, {
        name: 'Updated Item Name',
        price: 95.00,
        description: 'Updated description with more details'
      });

      expect(updatedItem.name).toBe('Updated Item Name');
      expect(updatedItem.price).toBe(95.00);

      // Verify menu plan still references updated item
      const retrievedPlan = await menuPlanService.getMenuPlanById(menuPlan.id);
      expect(retrievedPlan).toBeTruthy();
      expect((retrievedPlan as any)!.items).toContain(menuItem.id);

      // Verify item details are updated
      const retrievedItem = await menuService.getMenuItemById(menuItem.id);
      expect(retrievedItem).toBeTruthy();
      expect(retrievedItem!.name).toBe('Updated Item Name');
      expect(retrievedItem!.price).toBe(95.00);
      expect(retrievedItem!.updatedAt).not.toBe(retrievedItem!.createdAt);

      // Verify search index is updated
      const searchResults = await menuService.searchMenuItems({
        query: 'Updated Item Name',
        schoolId: menuItem.schoolId
      });
      expect((searchResults as any).items).toHaveLength(1);
    });

    it('should prevent deletion of menu items in active plans', async () => {
      // Create menu item
      const menuItem = await menuService.createMenuItem(
        TestDataFactory.menuItem({ name: 'Protected Item' }) as any
      );

      // Create active menu plan (future date)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const activePlan = await menuPlanService.createMenuPlan({
        ...TestDataFactory.menuPlan(),
        items: [menuItem.id],
        planDate: tomorrow,
        isActive: true,
        status: 'published'
      } as any);

      expect((activePlan as any).isActive).toBe(true);
      expect((activePlan as any).items).toContain(menuItem.id);

      // Attempt to delete menu item should fail
      const deleteResult = await menuService.deleteMenuItem(menuItem.id);
      
      expect((deleteResult as any).success).toBe(false);
      expect((deleteResult as any).error).toMatch(/active.*plan|referenced|cannot.*delete/i);
      expect((deleteResult as any).referencingPlans).toContain(activePlan.id);

      // Verify item still exists
      const item = await menuService.getMenuItemById(menuItem.id);
      expect(item).toBeTruthy();
      expect((item as any)!.isActive).toBe(true);

      // Test soft delete alternative
      const softDeleteResult = await (menuService as any).deactivateMenuItem(menuItem.id, {
        reason: 'temporary_unavailable',
        effectiveDate: new Date()
      });
      
      expect((softDeleteResult as any).success).toBe(true);
      
      const deactivatedItem = await menuService.getMenuItemById(menuItem.id);
      expect((deactivatedItem as any)!.isActive).toBe(false);
      expect((deactivatedItem as any)!.deactivationReason).toBe('temporary_unavailable');
    });

    it('should handle menu item versioning and history tracking', async () => {
      // Create original menu item
      const originalItem = await menuService.createMenuItem(
        TestDataFactory.menuItem({ 
          name: 'Original Recipe',
          price: 80.00,
          ingredients: ['rice', 'vegetables']
        }) as any
      );

      // Update item multiple times
      const update1 = await menuService.updateMenuItem(originalItem.id, {
        name: 'Improved Recipe',
        price: 85.00
      });

      const update2 = await menuService.updateMenuItem(originalItem.id, {
        ingredients: ['rice', 'vegetables', 'herbs', 'spices'],
        nutritionalInfo: { calories: 450, protein: 12, carbs: 70, fat: 8 }
      });

      // Verify version history
      const itemHistory = await (menuService as any).getMenuItemHistory(originalItem.id);
      
      expect(itemHistory).toHaveLength(3); // Original + 2 updates
      expect(itemHistory[0].name).toBe('Original Recipe');
      expect(itemHistory[1].name).toBe('Improved Recipe');
      expect(itemHistory[2].ingredients).toEqual(['rice', 'vegetables', 'herbs', 'spices']);

      // Verify current state
      const currentItem = await menuService.getMenuItemById(originalItem.id);
      expect(currentItem!.name).toBe('Improved Recipe');
      expect(currentItem!.price).toBe(85.00);
      expect(currentItem!.ingredients).toEqual(['rice', 'vegetables', 'herbs', 'spices']);

      // Test rollback functionality
      const rollbackResult = await (menuService as any).rollbackMenuItem(originalItem.id, itemHistory[0].version);
      expect(rollbackResult.success).toBe(true);

      const rolledBackItem = await menuService.getMenuItemById(originalItem.id);
      expect(rolledBackItem!.name).toBe('Original Recipe');
      expect(rolledBackItem!.price).toBe(80.00);
    });
  });

  describe('Menu Planning Workflows', () => {
    it('should create comprehensive weekly menu plans with validation', async () => {
      // Create diverse menu items for different categories
      const mainCourse1 = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        category: 'main-course',
        name: 'Nutritious Rice Bowl',
        nutritionalInfo: { calories: 400, protein: 18, carbs: 65, fat: 10 }
      } as any);

      const mainCourse2 = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        category: 'main-course',
        name: 'Vegetable Pasta',
        nutritionalInfo: { calories: 380, protein: 15, carbs: 70, fat: 8 }
      } as any);

      const beverage = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        category: 'beverage',
        name: 'Fresh Fruit Juice',
        nutritionalInfo: { calories: 120, protein: 2, carbs: 30, fat: 0 }
      } as any);

      const dessert = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        category: 'dessert',
        name: 'Seasonal Fruit Salad',
        nutritionalInfo: { calories: 80, protein: 1, carbs: 20, fat: 0 }
      } as any);

      // Create comprehensive weekly menu plan
      const weeklyPlanData = {
        schoolId: 'test-school-1',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-21'),
        meals: {
          monday: {
            breakfast: [mainCourse1.id, beverage.id],
            lunch: [mainCourse2.id, beverage.id, dessert.id],
            snack: [dessert.id]
          },
          tuesday: {
            breakfast: [mainCourse2.id, beverage.id],
            lunch: [mainCourse1.id, beverage.id, dessert.id],
            snack: [dessert.id]
          },
          wednesday: {
            breakfast: [mainCourse1.id, beverage.id],
            lunch: [mainCourse2.id, beverage.id, dessert.id],
            snack: [dessert.id]
          }
        },
        nutritionalTargets: {
          minCaloriesPerMeal: 300,
          maxCaloriesPerMeal: 800,
          minProteinPercentage: 15,
          maxSodiumPerMeal: 600
        }
      };

      const weeklyPlan = await (menuPlanService as any).createWeeklyPlan(weeklyPlanData);

      expect((weeklyPlan as any).success).toBe(true);
      expect((weeklyPlan as any).plans).toHaveLength(3); // Monday, Tuesday, Wednesday
      expect((weeklyPlan as any).validationResults.overallCompliance).toBeGreaterThan(0.8);

      // Verify individual day plans
      for (const plan of (weeklyPlan as any).plans) {
        expect(plan.id).toBeDefined();
        expect(plan.planDate).toBeInstanceOf(Date);
        expect(plan.isActive).toBe(true);

        // Verify nutritional balance for each plan
        const nutritionalSummary = await menuPlanService.calculateNutritionalSummary(plan.id);
        expect(nutritionalSummary.totalCalories).toBeGreaterThan(0);
        expect(nutritionalSummary.proteinPercentage).toBeGreaterThan(10);
        expect(nutritionalSummary.carbsPercentage).toBeGreaterThan(40);
        expect(nutritionalSummary.balanceScore).toBeGreaterThan(0.7);
      }

      // Verify week-level aggregations
      const weeklyStats = await (menuPlanService as any).getWeeklyNutritionalStats(
        (weeklyPlan as any).plans.map(p => p.id)
      );
      expect(weeklyStats.averageCaloriesPerDay).toBeGreaterThan(900);
      expect(weeklyStats.varietyScore).toBeGreaterThan(0.6);
    });

    it('should validate dietary restrictions and suggest alternatives', async () => {
      // Create menu items with different dietary properties
      const glutenItem = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        name: 'Wheat Bread Sandwich',
        allergens: ['gluten'],
        isGlutenFree: false,
        ingredients: ['wheat bread', 'vegetables', 'sauce']
      });

      const nutItem = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        name: 'Peanut Butter Cookie',
        allergens: ['nuts', 'peanuts'],
        isVegan: false,
        ingredients: ['flour', 'peanut butter', 'sugar', 'butter']
      });

      const safeItem = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        name: 'Quinoa Vegetable Salad',
        isVegan: true,
        isGlutenFree: true,
        allergens: [],
        ingredients: ['quinoa', 'vegetables', 'olive oil', 'herbs']
      } as any);

      const dairyItem = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        name: 'Cheese Pizza',
        allergens: ['dairy'],
        isVegan: false,
        ingredients: ['dough', 'tomato sauce', 'mozzarella cheese']
      } as any);

      // Create menu plan with potential conflicts
      const planResult = await menuPlanService.createMenuPlan({
        ...TestDataFactory.menuPlan(),
        items: [glutenItem.id, nutItem.id, safeItem.id, dairyItem.id],
        planDate: new Date('2024-01-16')
      } as any);

      expect(planResult.id).toBeDefined();

      // Validate dietary compliance for multiple restriction sets
      const strictValidation = await (validationService as any).validateMenuPlanDietary(planResult.id, {
        dietaryRestrictions: ['gluten-free', 'nut-free', 'vegan'],
        allergens: ['nuts', 'gluten', 'dairy'],
        strictMode: true
      });

      expect(strictValidation.hasConflicts).toBe(true);
      expect(strictValidation.conflicts).toHaveLength(3); // All except safeItem
      
      const conflicts = strictValidation.conflicts;
      expect(conflicts).toEqual(expect.arrayContaining([
        expect.objectContaining({ 
          itemId: glutenItem.id, 
          issues: expect.arrayContaining(['contains_gluten'])
        }),
        expect.objectContaining({ 
          itemId: nutItem.id, 
          issues: expect.arrayContaining(['contains_nuts'])
        }),
        expect.objectContaining({
          itemId: dairyItem.id,
          issues: expect.arrayContaining(['contains_dairy'])
        })
      ]));

      // Test flexible validation mode
      const flexibleValidation = await (validationService as any).validateMenuPlanDietary(planResult.id, {
        dietaryRestrictions: ['gluten-free'],
        strictMode: false,
        allowPartialCompliance: true
      });

      expect(flexibleValidation.complianceScore).toBe(0.75); // 3/4 items compliant

      // Request alternative suggestions
      const alternatives = await (menuPlanService as any).suggestAlternatives(planResult.id, {
        dietaryRestrictions: ['gluten-free', 'nut-free', 'vegan'],
        maxAlternatives: 2
      });

      expect(alternatives.suggestions).toBeDefined();
      expect(alternatives.suggestions.length).toBeGreaterThan(0);
      
      // Verify alternatives are compliant
      for (const suggestion of alternatives.suggestions) {
        expect(suggestion.originalItemId).toBeDefined();
        expect(suggestion.alternativeItems).toBeDefined();
        expect(suggestion.complianceImprovement).toBeGreaterThan(0);
      }
    });

    it('should handle seasonal menu transitions and availability', async () => {
      // Create seasonal menu items
      const summerItems = await Promise.all([
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          name: 'Cold Gazpacho Soup',
          seasonality: ['summer'],
          isAvailable: true,
          availabilityStart: new Date('2024-06-01'),
          availabilityEnd: new Date('2024-08-31')
        } as any),
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          name: 'Iced Fruit Lemonade',
          seasonality: ['summer'],
          isAvailable: true,
          availabilityStart: new Date('2024-06-01'),
          availabilityEnd: new Date('2024-08-31')
        } as any)
      ]);

      const winterItems = await Promise.all([
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          name: 'Hearty Vegetable Soup',
          seasonality: ['winter'],
          isAvailable: false, // Currently out of season
          availabilityStart: new Date('2024-12-01'),
          availabilityEnd: new Date('2025-02-28')
        } as any),
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          name: 'Hot Spiced Cider',
          seasonality: ['winter'],
          isAvailable: false,
          availabilityStart: new Date('2024-12-01'),
          availabilityEnd: new Date('2025-02-28')
        } as any)
      ]);

      const yearRoundItem = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        name: 'Classic Rice Bowl',
        seasonality: ['spring', 'summer', 'fall', 'winter'],
        isAvailable: true
      } as any);

      // Create summer menu plan (should work fine)
      const summerPlan = await menuPlanService.createMenuPlan({
        ...TestDataFactory.menuPlan(),
        items: [...summerItems.map(item => item.id), yearRoundItem.id],
        season: 'summer',
        planDate: new Date('2024-07-15')
      } as any);

      expect(summerPlan.id).toBeDefined();
      expect((summerPlan as any).validationWarnings).toHaveLength(0);

      // Attempt to create winter plan in summer (should generate warnings)
      const winterPlanAttempt = await menuPlanService.createMenuPlan({
        ...TestDataFactory.menuPlan(),
        items: winterItems.map(item => item.id),
        season: 'summer',
        planDate: new Date('2024-07-15')
      } as any);

      expect(winterPlanAttempt.id).toBeDefined();
      expect((winterPlanAttempt as any).validationWarnings).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/seasonal.*availability|out.*season/i)
        ])
      );

      // Test seasonal transition
      const transitionResult = await (menuService as any).updateSeasonalAvailability('winter');
      expect(transitionResult.success).toBe(true);
      expect(transitionResult.itemsActivated).toBe(2);
      expect(transitionResult.itemsDeactivated).toBe(2);

      // Verify availability changes
      const updatedWinterItems = await Promise.all(
        winterItems.map(item => menuService.getMenuItemById(item.id))
      );
      const updatedSummerItems = await Promise.all(
        summerItems.map(item => menuService.getMenuItemById(item.id))
      );

      updatedWinterItems.forEach(item => {
        expect((item as any)!.isAvailable).toBe(true);
      });

      updatedSummerItems.forEach(item => {
        expect((item as any)!.isAvailable).toBe(false);
      });

      // Year-round item should remain available
      const updatedYearRound = await menuService.getMenuItemById(yearRoundItem.id);
      expect((updatedYearRound as any)!.isAvailable).toBe(true);
    });

    it('should optimize menu plans for nutritional balance and cost', async () => {
      // Create items with varying nutritional profiles and costs
      const items = await Promise.all([
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          name: 'High Protein Bowl',
          price: 95.00,
          costPerServing: 65.00,
          nutritionalInfo: { calories: 450, protein: 25, carbs: 40, fat: 18 }
        }),
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          name: 'Balanced Rice Dish',
          price: 75.00,
          costPerServing: 45.00,
          nutritionalInfo: { calories: 380, protein: 15, carbs: 65, fat: 8 }
        }),
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          name: 'Light Vegetable Salad',
          price: 60.00,
          costPerServing: 35.00,
          nutritionalInfo: { calories: 220, protein: 8, carbs: 25, fat: 12 }
        })
      ]);

      // Request optimized menu plan
      const optimizationRequest = {
        schoolId: 'test-school-1',
        planDate: new Date('2024-01-20'),
        availableItems: items.map(item => item.id),
        constraints: {
          maxCostPerServing: 55.00,
          minProteinPerMeal: 12,
          targetCalories: 400,
          maxItems: 2
        },
        optimizationGoals: ['cost', 'nutrition', 'variety']
      };

      const optimizedPlan = await (menuPlanService as any).createOptimizedPlan(optimizationRequest);

      expect((optimizedPlan as any).success).toBe(true);
      expect((optimizedPlan as any).plan.items.length).toBeLessThanOrEqual(2);

      // Verify cost constraints
      const costAnalysis = await (menuPlanService as any).calculateCostAnalysis(optimizedPlan.plan.id);
      expect(costAnalysis.averageCostPerServing).toBeLessThanOrEqual(55.00);

      // Verify nutritional targets
      const nutritionAnalysis = await menuPlanService.calculateNutritionalSummary(optimizedPlan.plan.id);
      expect(nutritionAnalysis.totalProtein).toBeGreaterThanOrEqual(12);
      expect(nutritionAnalysis.totalCalories).toBeGreaterThanOrEqual(350); // Allow some tolerance

      // Verify optimization score
      expect(optimizedPlan.optimizationScore).toBeGreaterThan(0.7);
      expect(optimizedPlan.optimizationBreakdown.costScore).toBeDefined();
      expect(optimizedPlan.optimizationBreakdown.nutritionScore).toBeDefined();
    });
  });

  describe('Daily Menu Operations', () => {
    it('should generate daily menus from weekly plans with inventory tracking', async () => {
      // Create base menu items with inventory requirements
      const items = await Promise.all([
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          category: 'main-course',
          name: 'Chicken Rice Bowl',
          ingredients: ['rice', 'chicken', 'vegetables'],
          inventoryRequirements: [
            { ingredient: 'rice', quantityPerServing: 100, unit: 'grams' },
            { ingredient: 'chicken', quantityPerServing: 120, unit: 'grams' },
            { ingredient: 'vegetables', quantityPerServing: 80, unit: 'grams' }
          ]
        }),
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          category: 'beverage',
          name: 'Fresh Orange Juice',
          ingredients: ['oranges', 'water'],
          inventoryRequirements: [
            { ingredient: 'oranges', quantityPerServing: 2, unit: 'pieces' }
          ]
        }),
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          category: 'dessert',
          name: 'Fruit Parfait',
          ingredients: ['yogurt', 'fruits', 'granola'],
          inventoryRequirements: [
            { ingredient: 'yogurt', quantityPerServing: 150, unit: 'grams' },
            { ingredient: 'fruits', quantityPerServing: 100, unit: 'grams' },
            { ingredient: 'granola', quantityPerServing: 30, unit: 'grams' }
          ]
        })
      ]);

      // Create weekly plan
      const weeklyPlan = await menuPlanService.createMenuPlan({
        ...TestDataFactory.menuPlan(),
        items: items.map(item => item.id),
        planDate: new Date('2024-01-15'),
        mealType: 'lunch',
        expectedServings: 150
      });

      // Generate daily menu from plan
      const dailyMenuData = {
        schoolId: 'test-school-1',
        date: new Date('2024-01-15'),
        basedOnPlan: weeklyPlan.id,
        expectedServings: 150,
        mealType: 'lunch'
      };

      const dailyMenu = await (dailyMenuService as any).generateDailyMenu(dailyMenuData);

      expect((dailyMenu as any).success).toBe(true);
      expect((dailyMenu as any).menu.id).toBeDefined();
      expect((dailyMenu as any).menu.items).toHaveLength(3);
      expect((dailyMenu as any).menu.totalEstimatedCost).toBeGreaterThan(0);
      expect((dailyMenu as any).menu.estimatedPreparationTime).toBeGreaterThan(0);

      // Verify inventory requirements calculation
      expect(dailyMenu.menu.inventoryRequirements).toBeDefined();
      expect(dailyMenu.menu.inventoryRequirements.length).toBeGreaterThan(0);

      const riceRequirement = dailyMenu.menu.inventoryRequirements.find(
        req => req.ingredient === 'rice'
      );
      expect(riceRequirement).toBeDefined();
      expect(riceRequirement!.totalQuantityNeeded).toBe(15000); // 100g * 150 servings

      // Verify cost calculations
      const costBreakdown = dailyMenu.menu.costBreakdown;
      expect(costBreakdown.ingredientCosts).toBeDefined();
      expect(costBreakdown.laborCosts).toBeDefined();
      expect(costBreakdown.totalCost).toBeGreaterThan(0);

      // Verify preparation scheduling
      expect(dailyMenu.menu.preparationSchedule).toBeDefined();
      expect(dailyMenu.menu.preparationSchedule.length).toBeGreaterThan(0);
    });

    it('should handle real-time menu adjustments and alternative suggestions', async () => {
      // Create daily menu with multiple items
      const items = await Promise.all([
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          name: 'Available Main Course',
          category: 'main-course'
        }),
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          name: 'Potentially Unavailable Side',
          category: 'side-dish'
        }),
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          name: 'Alternative Side Dish',
          category: 'side-dish'
        })
      ]);

      const dailyMenu = await (dailyMenuService as any).createDailyMenu({
        schoolId: 'test-school-1',
        date: new Date(),
        items: items.slice(0, 2).map(item => ({ 
          itemId: item.id, 
          quantity: 50,
          isAvailable: true,
          unitCost: 45.00
        })),
        mealType: 'lunch'
      });

      expect(dailyMenu.id).toBeDefined();

      // Simulate ingredient shortage during service
      const adjustmentResult = await (dailyMenuService as any).adjustAvailability(
        dailyMenu.id,
        items[1].id, // Side dish becomes unavailable
        { 
          isAvailable: false, 
          reason: 'ingredient_shortage',
          affectedQuantity: 30,
          timestamp: new Date()
        }
      );

      expect(adjustmentResult.success).toBe(true);
      expect(adjustmentResult.notificationsSent).toBe(true);

      // Verify menu updated
      const updatedMenu = await (dailyMenuService as any).getDailyMenuById(dailyMenu.id);
      const unavailableItem = updatedMenu!.items.find(item => item.itemId === items[1].id);
      
      expect(unavailableItem!.isAvailable).toBe(false);
      expect(unavailableItem!.unavailabilityReason).toBe('ingredient_shortage');
      expect(unavailableItem!.availableQuantity).toBe(20); // 50 - 30

      // Verify alternative suggestions
      expect(adjustmentResult.suggestedAlternatives).toBeDefined();
      expect(adjustmentResult.suggestedAlternatives.length).toBeGreaterThan(0);

      const alternative = adjustmentResult.suggestedAlternatives[0];
      expect(alternative.itemId).toBe(items[2].id);
      expect(alternative.category).toBe('side-dish');
      expect(alternative.availabilityScore).toBeGreaterThan(0.7);

      // Test automatic substitution
      const substitutionResult = await (dailyMenuService as any).applyAutomaticSubstitution(
        dailyMenu.id,
        items[1].id,
        items[2].id,
        { 
          reason: 'ingredient_shortage_replacement',
          quantity: 20, // Remaining demand
          notifyUsers: true
        }
      );

      expect(substitutionResult.success).toBe(true);
      expect(substitutionResult.substitutionApplied).toBe(true);

      // Verify substitution in menu
      const finalMenu = await (dailyMenuService as any).getDailyMenuById(dailyMenu.id);
      const substitutedItem = finalMenu!.items.find(item => item.itemId === items[2].id);
      expect(substitutedItem).toBeDefined();
      expect(substitutedItem!.substitutionReason).toBe('ingredient_shortage_replacement');
    });

    it('should track comprehensive menu performance metrics and analytics', async () => {
      // Create daily menu with tracking enabled
      const items = await Promise.all([
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          name: 'Popular Healthy Bowl',
          category: 'main-course',
          targetDemographics: ['health-conscious', 'athletes']
        }),
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          name: 'Standard Comfort Food',
          category: 'main-course',
          targetDemographics: ['general']
        }),
        menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          name: 'Specialty Dessert',
          category: 'dessert',
          targetDemographics: ['treat-lovers']
        })
      ]);

      const dailyMenu = await (dailyMenuService as any).createDailyMenu({
        schoolId: 'test-school-1',
        date: new Date(),
        items: items.map(item => ({ 
          itemId: item.id, 
          quantity: 100,
          isAvailable: true,
          unitCost: 50.00,
          enableTracking: true
        })),
        trackingEnabled: true,
        mealType: 'lunch'
      });

      // Simulate varied ordering activity throughout the day
      const orderingActivity = [
        { itemId: items[0].id, quantity: 85, orderTime: '11:30' }, // Popular item
        { itemId: items[1].id, quantity: 60, orderTime: '11:45' }, // Moderate
        { itemId: items[2].id, quantity: 25, orderTime: '12:00' }, // Lower demand
        { itemId: items[0].id, quantity: 15, orderTime: '12:15' }, // Additional popular item orders
        { itemId: items[1].id, quantity: 20, orderTime: '12:30' }  // Additional moderate orders
      ];

      for (const activity of orderingActivity) {
        await (dailyMenuService as any).recordOrder(dailyMenu.id, {
          itemId: activity.itemId,
          quantity: activity.quantity,
          orderTime: activity.orderTime,
          userDemographics: (items.find(i => i.id === activity.itemId) as any)!.targetDemographics[0]
        });
      }

      // Generate comprehensive performance report
      const performance = await (dailyMenuService as any).getMenuPerformance(dailyMenu.id);

      expect(performance.totalOrdered).toBe(205);
      expect(performance.items).toHaveLength(3);

      // Verify individual item performance
      const popularItem = performance.items.find(item => item.itemId === items[0].id);
      const moderateItem = performance.items.find(item => item.itemId === items[1].id);
      const specialtyItem = performance.items.find(item => item.itemId === items[2].id);

      expect(popularItem!.orderRate).toBe(1.0); // 100/100 (all ordered)
      expect(popularItem!.totalOrdered).toBe(100);
      expect(popularItem!.performanceRating).toBe('excellent');

      expect(moderateItem!.orderRate).toBe(0.8); // 80/100
      expect(moderateItem!.performanceRating).toBe('good');

      expect(specialtyItem!.orderRate).toBe(0.25); // 25/100
      expect(specialtyItem!.performanceRating).toBe('poor');

      // Verify timing analytics
      expect(performance.peakOrderingTime).toBe('12:00-12:15');
      expect(performance.orderingDistribution).toBeDefined();

      // Verify recommendations for future planning
      expect(performance.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'increase_quantity',
            itemId: items[0].id,
            confidence: expect.any(Number)
          }),
          expect.objectContaining({
            type: 'consider_replacement',
            itemId: items[2].id,
            suggestedAlternatives: expect.any(Array)
          })
        ])
      );

      // Test demographic analysis
      const demographicAnalysis = await (analyticsService as any).analyzeDemographicPreferences(dailyMenu.id);
      expect(demographicAnalysis['health-conscious'].preferenceScore).toBeGreaterThan(0.8);
      expect(demographicAnalysis['treat-lovers'].preferenceScore).toBeLessThan(0.3);
    });
  });

  describe('Cross-Epic Integration', () => {
    it('should integrate with payment system for dynamic pricing and discounts', async () => {
      // Create menu items with different pricing tiers
      const premiumItem = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        name: 'Premium Gourmet Meal',
        price: 150.00,
        pricingTier: 'premium',
        category: 'main-course'
      });

      const standardItem = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        name: 'Standard Nutritious Meal',
        price: 85.00,
        pricingTier: 'standard',
        category: 'main-course'
      });

      const economyItem = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        name: 'Budget-Friendly Option',
        price: 60.00,
        pricingTier: 'economy',
        category: 'main-course'
      });

      // Create menu plan
      const menuPlan = await menuPlanService.createMenuPlan({
        ...TestDataFactory.menuPlan(),
        items: [premiumItem.id, standardItem.id, economyItem.id]
      });

      // Test pricing for different user types and subscription tiers
      const studentPricing = await (menuPlanService as any).calculatePricing(menuPlan.id, {
        userType: 'student',
        subscriptionTier: 'basic',
        userId: 'test-student-1'
      });

      const parentPremiumPricing = await (menuPlanService as any).calculatePricing(menuPlan.id, {
        userType: 'parent',
        subscriptionTier: 'premium',
        userId: 'test-parent-1'
      });

      const teacherPricing = await (menuPlanService as any).calculatePricing(menuPlan.id, {
        userType: 'teacher',
        subscriptionTier: 'standard',
        userId: 'test-teacher-1'
      });

      // Verify pricing differences
      expect(studentPricing.totalPrice).toBeLessThan(parentPremiumPricing.totalPrice);
      expect(studentPricing.discountApplied).toBeGreaterThan(0);
      expect(studentPricing.discountPercentage).toBeGreaterThan(10);

      expect(parentPremiumPricing.taxAmount).toBeGreaterThan(0);
      expect(parentPremiumPricing.premiumFeatures.unlimitedSelections).toBe(true);

      expect(teacherPricing.staffDiscount).toBeGreaterThan(0);

      // Test dynamic pricing based on demand
      const demandPricing = await (menuPlanService as any).calculateDemandBasedPricing(menuPlan.id, {
        currentDemand: 0.85, // High demand
        timeOfDay: '12:00',
        dayOfWeek: 'monday'
      });

      expect(demandPricing.dynamicPriceAdjustment).toBeGreaterThan(0);
      expect(demandPricing.adjustedTotalPrice).toBeGreaterThan(studentPricing.totalPrice);

      // Test bulk order discounts
      const bulkPricing = await (menuPlanService as any).calculateBulkPricing(menuPlan.id, {
        quantity: 50,
        orderType: 'catering',
        advanceOrderDays: 3
      });

      expect(bulkPricing.bulkDiscountPercentage).toBeGreaterThan(5);
      expect(bulkPricing.pricePerUnit).toBeLessThan(studentPricing.totalPrice);
    });

    it('should integrate with RFID system for seamless delivery and order tracking', async () => {
      // Create daily menu
      const menuItem = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        name: 'RFID Trackable Meal',
        requiresVerification: true
      });

      const dailyMenu = await (dailyMenuService as any).createDailyMenu({
        schoolId: 'test-school-1',
        date: new Date(),
        items: [{ 
          itemId: menuItem.id, 
          quantity: 50,
          isAvailable: true,
          requiresRFIDVerification: true
        }]
      });

      // Create order with RFID tracking
      const order = await (dailyMenuService as any).createOrder({
        userId: 'test-student-1',
        dailyMenuId: dailyMenu.id,
        items: [{ 
          itemId: menuItem.id, 
          quantity: 1,
          specialRequests: 'No spice'
        }],
        paymentMethod: 'rfid_card',
        rfidCardId: 'test-rfid-123'
      });

      expect(order.id).toBeDefined();
      expect(order.status).toBe('confirmed');
      expect(order.rfidTrackingEnabled).toBe(true);

      // Simulate order preparation
      const preparationUpdate = await (dailyMenuService as any).updateOrderStatus(order.id, {
        status: 'preparing',
        estimatedCompletionTime: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      });

      expect(preparationUpdate.success).toBe(true);

      // Simulate order completion
      const completionUpdate = await (dailyMenuService as any).updateOrderStatus(order.id, {
        status: 'ready_for_pickup',
        preparationCompletedAt: new Date()
      });

      expect(completionUpdate.success).toBe(true);

      // Simulate RFID verification at pickup
      const rfidVerification = await (dailyMenuService as any).verifyRFIDDelivery({
        orderId: order.id,
        rfidCardId: 'test-rfid-123',
        verificationLocation: 'cafeteria-station-1',
        timestamp: new Date(),
        verificationStaff: 'staff-001'
      });

      expect(rfidVerification.success).toBe(true);
      expect(rfidVerification.deliveryConfirmed).toBe(true);
      expect(rfidVerification.matchedUser).toBe('test-student-1');

      // Verify order status updated
      const updatedOrder = await (dailyMenuService as any).getOrderById(order.id);
      expect(updatedOrder!.status).toBe('delivered');
      expect(updatedOrder!.deliveryTimestamp).toBeDefined();
      expect(updatedOrder!.rfidVerified).toBe(true);
      expect(updatedOrder!.deliveryLocation).toBe('cafeteria-station-1');

      // Test RFID anti-fraud verification
      const fraudAttempt = await (dailyMenuService as any).verifyRFIDDelivery({
        orderId: order.id,
        rfidCardId: 'different-rfid-456', // Wrong RFID
        verificationLocation: 'cafeteria-station-1',
        timestamp: new Date()
      });

      expect(fraudAttempt.success).toBe(false);
      expect(fraudAttempt.error).toMatch(/mismatch|unauthorized/i);

      // Test analytics integration
      const deliveryAnalytics = await (analyticsService as any).getDeliveryAnalytics({
        schoolId: 'test-school-1',
        dateRange: { start: new Date(), end: new Date() }
      });

      expect(deliveryAnalytics.totalDeliveries).toBe(1);
      expect(deliveryAnalytics.rfidVerificationRate).toBe(1.0);
      expect(deliveryAnalytics.averagePickupTime).toBeDefined();
    });

    it('should integrate with notification system for comprehensive menu updates', async () => {
      // Create menu items with subscriber tracking
      const specialDietItem = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        name: 'Gluten-Free Vegan Special',
        isVegan: true,
        isGlutenFree: true,
        tags: ['special-diet', 'allergen-friendly']
      });

      const popularItem = await menuService.createMenuItem({
        ...TestDataFactory.menuItem(),
        name: 'Student Favorite Pizza',
        tags: ['popular', 'comfort-food']
      });

      // Set up user notification preferences
      const subscriptionSetup = await (notificationService as any).setupMenuNotifications([
        {
          userId: 'test-student-vegan',
          preferences: ['vegan', 'gluten-free', 'allergen-updates'],
          notificationMethods: ['push', 'email'],
          immediateAlerts: true
        },
        {
          userId: 'test-student-general',
          preferences: ['popular-items', 'price-changes'],
          notificationMethods: ['push'],
          immediateAlerts: false
        },
        {
          userId: 'test-parent-premium',
          preferences: ['all-changes', 'nutritional-updates'],
          notificationMethods: ['email', 'sms'],
          immediateAlerts: true
        }
      ]);

      expect(subscriptionSetup.subscribersAdded).toBe(3);

      // Create daily menu
      const dailyMenu = await (dailyMenuService as any).createDailyMenu({
        schoolId: 'test-school-1',
        date: new Date(),
        items: [
          { 
            itemId: specialDietItem.id, 
            quantity: 30,
            isAvailable: true 
          },
          {
            itemId: popularItem.id,
            quantity: 100,
            isAvailable: true
          }
        ]
      });

      // Simulate special diet item becoming unavailable
      const changeResult = await (dailyMenuService as any).adjustAvailability(
        dailyMenu.id,
        specialDietItem.id,
        { 
          isAvailable: false, 
          reason: 'ingredient_allergy_concern',
          severity: 'high',
          affectedQuantity: 30
        }
      );

      expect(changeResult.success).toBe(true);
      expect(changeResult.notificationsSent).toBe(true);
      expect(changeResult.notifiedUsers).toContain('test-student-vegan');
      expect(changeResult.notifiedUsers).toContain('test-parent-premium');
      expect(changeResult.notifiedUsers).not.toContain('test-student-general'); // Not subscribed to allergen updates

      // Verify notification content
      expect(changeResult.notificationContent).toEqual(
        expect.objectContaining({
          type: 'menu_item_unavailable',
          severity: 'high',
          itemName: 'Gluten-Free Vegan Special',
          reason: 'ingredient_allergy_concern',
          alternatives: expect.any(Array),
          affectedDiets: ['vegan', 'gluten-free']
        })
      );

      // Test price change notifications
      const priceChangeResult = await menuService.updateMenuItem(popularItem.id, {
        price: (popularItem as any).price * 0.9, // 10% discount
        priceChangeReason: 'promotional_discount'
      } as any);

      const priceNotifications = await (notificationService as any).getRecentNotifications({
        type: 'price_change',
        timeframe: '5_minutes'
      });

      expect(priceNotifications.length).toBeGreaterThan(0);
      expect(priceNotifications[0].recipients).toContain('test-student-general');
      expect(priceNotifications[0].content.priceChange).toBe(-10);

      // Test batch notifications for menu updates
      const weeklyMenuUpdate = await (menuPlanService as any).publishWeeklyMenu({
        schoolId: 'test-school-1',
        startDate: new Date(),
        notifySubscribers: true
      });

      expect(weeklyMenuUpdate.notificationsSent).toBeGreaterThan(0);
      expect(weeklyMenuUpdate.notificationBreakdown.emailsSent).toBeGreaterThan(0);
      expect(weeklyMenuUpdate.notificationBreakdown.pushNotificationsSent).toBeGreaterThan(0);

      // Test notification analytics
      const notificationStats = await (notificationService as any).getNotificationAnalytics({
        schoolId: 'test-school-1',
        dateRange: { start: new Date(), end: new Date() }
      });

      expect(notificationStats.totalNotificationsSent).toBeGreaterThan(0);
      expect(notificationStats.deliveryRate).toBeGreaterThan(0.9);
      expect(notificationStats.engagementRate).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent menu operations efficiently under load', async () => {
      const startTime = Date.now();
      const concurrentOperations = 20;
      
      // Simulate high-concurrency menu operations
      const operationPromises = Array.from({ length: concurrentOperations }, async (_, index) => {
        const itemCreation = menuService.createMenuItem({
          ...TestDataFactory.menuItem(),
          name: `Concurrent Item ${index}`,
          category: index % 3 === 0 ? 'main-course' : index % 3 === 1 ? 'side-dish' : 'beverage',
          price: 50 + (index * 5)
        });

        const menuItem = await itemCreation;

        const planCreation = menuPlanService.createMenuPlan({
          ...TestDataFactory.menuPlan(),
          items: [menuItem.id],
          planDate: new Date(Date.now() + index * 24 * 60 * 60 * 1000)
        });

        const menuPlan = await planCreation;

        // Simulate some read operations
        const itemRetrieval = menuService.getMenuItemById(menuItem.id);
        const planRetrieval = menuPlanService.getMenuPlanById(menuPlan.id);

        const [retrievedItem, retrievedPlan] = await Promise.all([itemRetrieval, planRetrieval]);

        return { menuItem, menuPlan, retrievedItem, retrievedPlan, index };
      });

      const results = await Promise.all(operationPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all operations completed successfully
      expect(results).toHaveLength(concurrentOperations);
      results.forEach((result, index) => {
        expect(result.menuItem.id).toBeDefined();
        expect(result.menuPlan.id).toBeDefined();
        expect(result.retrievedItem).toBeTruthy();
        expect(result.retrievedPlan).toBeTruthy();
        expect(result.index).toBe(index);
      });

      // Verify performance (should complete within reasonable time)
      expect(totalTime).toBeLessThan(10000); // 10 seconds for 20 concurrent operations
      const averageTimePerOperation = totalTime / concurrentOperations;
      expect(averageTimePerOperation).toBeLessThan(500); // Less than 500ms per operation

      // Verify data consistency - no race conditions
      const allMenuItems = await menuService.getMenuItems({
        schoolId: 'test-school-1',
        limit: 100
      } as any);
      const concurrentItems = allMenuItems.items.filter(item => 
        item.name.startsWith('Concurrent Item')
      );
      expect(concurrentItems).toHaveLength(concurrentOperations);

      // Verify unique names (no duplicates due to race conditions)
      const names = concurrentItems.map(item => item.name);
      const uniqueNames = [...new Set(names)];
      expect(uniqueNames).toHaveLength(concurrentOperations);

      // Test concurrent database operations integrity
      const dbConsistencyCheck = await (databaseService as any).checkDataConsistency([
        'menu_items', 'menu_plans', 'daily_menus'
      ]);
      expect(dbConsistencyCheck.consistencyScore).toBeGreaterThan(0.95);
    });

    it('should efficiently handle large menu datasets with optimized queries', async () => {
      const largeDatasetSize = 200;
      
      // Create large dataset with varied characteristics
      const menuItems = await Promise.all(
        Array.from({ length: largeDatasetSize }, (_, index) => {
          return menuService.createMenuItem({
            ...TestDataFactory.menuItem(),
            name: `Menu Item ${index.toString().padStart(3, '0')}`,
            category: ['main-course', 'side-dish', 'beverage', 'dessert', 'snack'][index % 5],
            price: 50 + (index % 50),
            tags: [`tag-${index % 10}`, `category-${index % 5}`],
            isVegan: index % 4 === 0,
            isGlutenFree: index % 6 === 0,
            isAvailable: index % 20 !== 19 // 95% available
          });
        })
      );

      expect(menuItems).toHaveLength(largeDatasetSize);

      // Test complex search performance
      const searchStartTime = Date.now();
      const complexSearchResult = await menuService.searchMenuItems({
        schoolId: 'test-school-1',
        query: 'Menu Item',
        filters: {
          category: ['main-course', 'side-dish'] as any,
          tags: ['tag-1', 'tag-2']
        } as any,
        sort: { field: 'price', direction: 'asc' },
        pagination: { page: 1, limit: 50 }
      } as any);
      const searchEndTime = Date.now();

      // Verify search results
      expect((complexSearchResult as any).items.length).toBeLessThanOrEqual(50);
      expect((complexSearchResult as any).totalCount).toBeGreaterThan(0);
      expect(searchEndTime - searchStartTime).toBeLessThan(2000); // Under 2 seconds

      // Verify filtering accuracy
      (complexSearchResult as any).items.forEach(item => {
        expect(['main-course', 'side-dish']).toContain(item.category);
        expect(item.isVegan).toBe(true);
        expect(item.price).toBeGreaterThanOrEqual(50);
        expect(item.price).toBeLessThanOrEqual(80);
      });

      // Test aggregation performance
      const aggregationStartTime = Date.now();
      const stats = await (menuService as any).getMenuStatistics('test-school-1');
      const aggregationEndTime = Date.now();

      expect(stats.totalItems).toBe(largeDatasetSize);
      expect(stats.categoryCounts['main-course']).toBe(40); // 200/5
      expect(stats.categoryCounts['side-dish']).toBe(40);
      expect(stats.veganPercentage).toBeCloseTo(25); // 1/4 are vegan
      expect(stats.glutenFreePercentage).toBeCloseTo(16.67); // 1/6 are gluten-free
      expect(aggregationEndTime - aggregationStartTime).toBeLessThan(1000); // Under 1 second

      // Test pagination performance
      const paginationStartTime = Date.now();
      const paginatedResults = await Promise.all([
        menuService.searchMenuItems({ query: '', schoolId: 'test-school-1', pagination: { page: 1, limit: 20 } } as any),
        menuService.searchMenuItems({ query: '', schoolId: 'test-school-1', pagination: { page: 2, limit: 20 } } as any),
        menuService.searchMenuItems({ query: '', schoolId: 'test-school-1', pagination: { page: 5, limit: 20 } } as any)
      ]);
      const paginationEndTime = Date.now();

      paginatedResults.forEach(result => {
        expect((result as any).items).toHaveLength(20);
        expect((result as any).hasNextPage).toBe(true);
      });
      expect(paginationEndTime - paginationStartTime).toBeLessThan(1500); // Under 1.5 seconds

      // Test bulk operations performance
      const bulkUpdateStartTime = Date.now();
      const firstTwentyIds = menuItems.slice(0, 20).map(item => item.id);
      const bulkUpdateResult = await (menuService as any).bulkUpdateMenuItems(firstTwentyIds, {
        tags: ['bulk-updated', 'performance-test'],
        isAvailable: true
      });
      const bulkUpdateEndTime = Date.now();

      expect(bulkUpdateResult.success).toBe(true);
      expect(bulkUpdateResult.updatedCount).toBe(20);
      expect(bulkUpdateEndTime - bulkUpdateStartTime).toBeLessThan(2000); // Under 2 seconds

      // Verify bulk update results
      const updatedItems = await Promise.all(
        firstTwentyIds.map(id => menuService.getMenuItemById(id))
      );
      updatedItems.forEach(item => {
        expect(item!.tags).toContain('bulk-updated');
        expect(item!.tags).toContain('performance-test');
      });
    });

    it('should maintain performance under memory pressure and resource constraints', async () => {
      // Configure low-memory simulation
      const originalMemoryLimit = process.env.NODE_OPTIONS;
      process.env.NODE_OPTIONS = '--max-old-space-size=512'; // Simulate 512MB limit

      try {
        const memoryTestSize = 100;
        const performanceMetrics = {
          creationTimes: [],
          retrievalTimes: [],
          memoryUsages: []
        };

        // Test memory-efficient operations
        for (let i = 0; i < memoryTestSize; i++) {
          const creationStart = Date.now();
          
          // Create item with minimal memory footprint
          const menuItem = await menuService.createMenuItem({
            ...TestDataFactory.menuItem(),
            name: `Memory Test ${i}`,
            // Minimal data to reduce memory usage
            description: `Description ${i}`,
            category: 'main-course'
          });

          const creationEnd = Date.now();
          performanceMetrics.creationTimes.push(creationEnd - creationStart);

          // Test retrieval performance
          const retrievalStart = Date.now();
          await menuService.getMenuItemById(menuItem.id);
          const retrievalEnd = Date.now();
          performanceMetrics.retrievalTimes.push(retrievalEnd - retrievalStart);

          // Monitor memory usage every 10 operations
          if (i % 10 === 0) {
            const memoryUsage = process.memoryUsage();
            performanceMetrics.memoryUsages.push({
              iteration: i,
              heapUsed: memoryUsage.heapUsed,
              heapTotal: memoryUsage.heapTotal,
              rss: memoryUsage.rss
            });
          }

          // Force garbage collection periodically (if available)
          if (i % 20 === 0 && global.gc) {
            global.gc();
          }
        }

        // Analyze performance metrics
        const avgCreationTime = performanceMetrics.creationTimes.reduce((a, b) => a + b, 0) / memoryTestSize;
        const avgRetrievalTime = performanceMetrics.retrievalTimes.reduce((a, b) => a + b, 0) / memoryTestSize;

        expect(avgCreationTime).toBeLessThan(200); // Under 200ms average
        expect(avgRetrievalTime).toBeLessThan(50);  // Under 50ms average

        // Verify memory usage didn't grow excessively
        const memoryGrowth = performanceMetrics.memoryUsages;
        const initialMemory = memoryGrowth[0]?.heapUsed || 0;
        const finalMemory = memoryGrowth[memoryGrowth.length - 1]?.heapUsed || 0;
        const memoryGrowthRatio = finalMemory / initialMemory;

        expect(memoryGrowthRatio).toBeLessThan(3.0); // Memory shouldn't triple

        // Test cache performance under memory pressure
        const cacheTest = await (menuService as any).testCacheEfficiency({
          iterations: 50,
          cacheHitRateTarget: 0.8
        });

        expect(cacheTest.cacheHitRate).toBeGreaterThan(0.7);
        expect(cacheTest.averageResponseTime).toBeLessThan(100);

      } finally {
        // Restore original memory settings
        if (originalMemoryLimit) {
          process.env.NODE_OPTIONS = originalMemoryLimit;
        } else {
          delete process.env.NODE_OPTIONS;
        }
      }
    });

    it('should demonstrate horizontal scaling capabilities', async () => {
      // Simulate multiple service instances (horizontal scaling)
      const serviceInstances = Array.from({ length: 3 }, () => ({
        menuService: new MenuService(),
        menuPlanService: new MenuPlanService()
      }));

      const scalingTestSize = 60; // 20 operations per instance
      const operationsPerInstance = scalingTestSize / serviceInstances.length;

      const scalingStartTime = Date.now();

      // Distribute operations across service instances
      const instancePromises = serviceInstances.map(async (instance, instanceIndex) => {
        const instanceOperations = Array.from({ length: operationsPerInstance }, async (_, opIndex) => {
          const globalIndex = instanceIndex * operationsPerInstance + opIndex;
          
          // Create menu item
          const menuItem = await instance.menuService.createMenuItem({
            ...TestDataFactory.menuItem(),
            name: `Scaling Test ${globalIndex}`,
            description: `Created by instance ${instanceIndex}`
          });

          // Create menu plan
          const menuPlan = await instance.menuPlanService.createMenuPlan({
            ...TestDataFactory.menuPlan(),
            items: [menuItem.id],
            planDate: new Date(Date.now() + globalIndex * 24 * 60 * 60 * 1000)
          });

          return { menuItem, menuPlan, instanceIndex, globalIndex };
        });

        return Promise.all(instanceOperations);
      });

      const instanceResults = await Promise.all(instancePromises);
      const scalingEndTime = Date.now();
      const totalScalingTime = scalingEndTime - scalingStartTime;

      // Flatten results for analysis
      const allResults = instanceResults.flat();

      // Verify all operations completed successfully
      expect(allResults).toHaveLength(scalingTestSize);
      
      // Verify distribution across instances
      const resultsByInstance = allResults.reduce((acc, result) => {
        acc[result.instanceIndex] = (acc[result.instanceIndex] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      expect(Object.keys(resultsByInstance)).toHaveLength(3); // All 3 instances used
      Object.values(resultsByInstance).forEach(count => {
        expect(count).toBe(operationsPerInstance); // Even distribution
      });

      // Verify scaling performance benefit
      const scalingEfficiency = scalingTestSize / (totalScalingTime / 1000); // Operations per second
      expect(scalingEfficiency).toBeGreaterThan(10); // At least 10 ops/sec

      // Test data consistency across instances
      const consistencyCheck = await Promise.all([
        serviceInstances[0].menuService.getMenuItems({ schoolId: 'test-school-1', limit: 100 } as any),
        serviceInstances[1].menuService.getMenuItems({ schoolId: 'test-school-1', limit: 100 } as any),
        serviceInstances[2].menuService.getMenuItems({ schoolId: 'test-school-1', limit: 100 } as any)
      ]);

      // All instances should see the same data
      const itemCounts = consistencyCheck.map(result => (result as any).totalCount);
      expect(new Set(itemCounts).size).toBe(1); // All counts should be the same

      // Cleanup service instances
      await Promise.all(serviceInstances.map(instance => 
        Promise.all([
          instance.menuService.disconnect(),
          instance.menuPlanService.disconnect()
        ])
      ));
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection failures gracefully', async () => {
      // Simulate database connection failure
      const originalConnection = (databaseService as any).connection;
      
      try {
        // Mock connection failure
        (databaseService as any).connection = null;

        const result = await menuService.createMenuItem(
          TestDataFactory.menuItem({ name: 'Connection Test Item' })
        );

        expect((result as any).success).toBe(false);
        expect((result as any).error).toMatch(/database.*connection|unavailable/i);
        expect((result as any).retryable).toBe(true);

        // Test retry mechanism
        (databaseService as any).connection = originalConnection;
        
        const retryResult = await (menuService as any).retryLastOperation();
        expect((retryResult as any).success).toBe(true);

      } finally {
        (databaseService as any).connection = originalConnection;
      }
    });

    it('should validate menu item data integrity and constraints', async () => {
      // Test invalid nutritional data
      const invalidNutritionItem = TestDataFactory.menuItem({
        nutritionalInfo: {
          calories: -100, // Invalid negative calories
          protein: 150,   // Unrealistic protein amount
          carbs: -50,     // Invalid negative carbs
          fat: 200        // Unrealistic fat amount
        }
      });

      const nutritionValidation = await (menuService as any).validateMenuItem(invalidNutritionItem);
      expect(nutritionValidation.isValid).toBe(false);
      expect(nutritionValidation.errors).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/calories.*negative/i),
          expect.stringMatching(/protein.*unrealistic/i),
          expect.stringMatching(/carbs.*negative/i)
        ])
      );

      // Test price validation
      const invalidPriceItem = TestDataFactory.menuItem({
        price: -10.00, // Negative price
        costPerServing: 50.00 // Cost higher than price
      });

      const priceValidation = await (menuService as any).validateMenuItem(invalidPriceItem);
      expect(priceValidation.isValid).toBe(false);
      expect(priceValidation.errors).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/price.*negative/i)
        ])
      );
    });
  });
});