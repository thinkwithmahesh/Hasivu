"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const menuItem_service_1 = require("@/services/menuItem.service");
const menuPlan_service_1 = require("@/services/menuPlan.service");
const dailyMenu_service_1 = require("@/services/dailyMenu.service");
const validation_service_1 = require("@/services/validation.service");
const database_service_1 = require("@/services/database.service");
const payment_service_1 = require("@/services/payment.service");
const rfid_service_1 = require("@/services/rfid.service");
const notification_service_1 = require("@/services/notification.service");
const analytics_service_1 = require("@/services/analytics.service");
const test_helpers_1 = require("../utils/test-helpers");
describe('Menu Ecosystem Integration Tests', () => {
    let menuService;
    let menuPlanService;
    let dailyMenuService;
    let validationService;
    let databaseService;
    let paymentService;
    let rfidService;
    let notificationService;
    let analyticsService;
    beforeAll(async () => {
        await test_helpers_1.DatabaseTestHelper.setupTestDatabase();
        process.env.TEST_MODE = 'integration';
        process.env.MENU_CACHE_TTL = '0';
        process.env.NOTIFICATION_PROVIDER = 'test';
        await test_helpers_1.DatabaseTestHelper.seedBaseTestData();
    });
    beforeEach(async () => {
        menuService = new menuItem_service_1.MenuItemService();
        menuPlanService = new menuPlan_service_1.MenuPlanService();
        dailyMenuService = new dailyMenu_service_1.DailyMenuService();
        validationService = new validation_service_1.ValidationService();
        databaseService = new database_service_1.DatabaseService();
        paymentService = new payment_service_1.PaymentService();
        rfidService = new rfid_service_1.RFIDService();
        notificationService = new notification_service_1.NotificationService();
        analyticsService = new analytics_service_1.AnalyticsService();
        await test_helpers_1.DatabaseTestHelper.clearAllTables();
        await test_helpers_1.DatabaseTestHelper.seedTestData();
        await menuService.clearCache();
        await notificationService.clearQueue();
    });
    afterEach(async () => {
        await test_helpers_1.DatabaseTestHelper.clearTestData();
        await menuService.disconnect();
        await notificationService.disconnect();
    });
    afterAll(async () => {
        await test_helpers_1.DatabaseTestHelper.teardownTestDatabase();
        delete process.env.TEST_MODE;
        delete process.env.MENU_CACHE_TTL;
        delete process.env.NOTIFICATION_PROVIDER;
    });
    describe('Menu Item Lifecycle Management', () => {
        it('should handle complete menu item creation workflow with validation', async () => {
            const menuItemData = {
                ...test_helpers_1.TestDataFactory.menuItem(),
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
            const createdItem = await menuService.createMenuItem(menuItemData);
            expect(createdItem).toBeDefined();
            expect(createdItem.id).toBeDefined();
            expect(createdItem.name).toBe(menuItemData.name);
            expect(createdItem.isActive).toBe(true);
            expect(createdItem.schoolId).toBe(menuItemData.schoolId);
            expect(createdItem.createdAt).toBeInstanceOf(Date);
            expect(createdItem.updatedAt).toBeInstanceOf(Date);
            expect(createdItem.nutritionalInfo.calories).toBe(420);
            expect(createdItem.nutritionalInfo.protein).toBe(15);
            expect(createdItem.ingredients).toEqual(menuItemData.ingredients);
            const dbItem = await menuService.getMenuItemById(createdItem.id);
            expect(dbItem).toBeTruthy();
            expect(dbItem.nutritionalInfo.calories).toBe(420);
            expect(dbItem.ingredients).toEqual(menuItemData.ingredients);
            expect(dbItem.tags).toEqual(['healthy', 'organic', 'superfood']);
            const searchResults = await menuService.searchMenuItems({
                query: 'quinoa',
                schoolId: menuItemData.schoolId,
                filters: {
                    category: 'main-course'
                }
            });
            expect(searchResults.items).toHaveLength(1);
            expect(searchResults.items[0].id).toBe(createdItem.id);
            expect(searchResults.totalCount).toBe(1);
            expect(createdItem.isVegan).toBe(true);
            expect(createdItem.isVegetarian).toBe(true);
            expect(createdItem.isGlutenFree).toBe(true);
        });
        it('should maintain referential integrity during menu item updates', async () => {
            const menuItem = await menuService.createMenuItem(test_helpers_1.TestDataFactory.menuItem({
                name: 'Original Item',
                price: 75.00,
                category: 'main-course'
            }));
            const menuPlan = await menuPlanService.createMenuPlan({
                ...test_helpers_1.TestDataFactory.menuPlan(),
                items: [menuItem.id],
                planDate: new Date('2024-01-15'),
                mealType: 'lunch'
            });
            expect(menuPlan.items).toContain(menuItem.id);
            const updatedItem = await menuService.updateMenuItem(menuItem.id, {
                name: 'Updated Item Name',
                price: 95.00,
                description: 'Updated description with more details'
            });
            expect(updatedItem.name).toBe('Updated Item Name');
            expect(updatedItem.price).toBe(95.00);
            const retrievedPlan = await menuPlanService.getMenuPlanById(menuPlan.id);
            expect(retrievedPlan).toBeTruthy();
            expect(retrievedPlan.items).toContain(menuItem.id);
            const retrievedItem = await menuService.getMenuItemById(menuItem.id);
            expect(retrievedItem).toBeTruthy();
            expect(retrievedItem.name).toBe('Updated Item Name');
            expect(retrievedItem.price).toBe(95.00);
            expect(retrievedItem.updatedAt).not.toBe(retrievedItem.createdAt);
            const searchResults = await menuService.searchMenuItems({
                query: 'Updated Item Name',
                schoolId: menuItem.schoolId || undefined
            });
            expect(searchResults.items).toHaveLength(1);
        });
        it('should prevent deletion of menu items in active plans', async () => {
            const menuItem = await menuService.createMenuItem(test_helpers_1.TestDataFactory.menuItem({ name: 'Protected Item' }));
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const activePlan = await menuPlanService.createMenuPlan({
                ...test_helpers_1.TestDataFactory.menuPlan(),
                items: [menuItem.id],
                planDate: tomorrow,
                isActive: true,
                status: 'published'
            });
            expect(activePlan.isActive).toBe(true);
            expect(activePlan.items).toContain(menuItem.id);
            const deleteResult = await menuService.deleteMenuItem(menuItem.id);
            expect(deleteResult.success).toBe(false);
            expect(deleteResult.error).toMatch(/active.*plan|referenced|cannot.*delete/i);
            expect(deleteResult.referencingPlans).toContain(activePlan.id);
            const item = await menuService.getMenuItemById(menuItem.id);
            expect(item).toBeTruthy();
            expect(item.isActive).toBe(true);
            const softDeleteResult = await menuService.deactivateMenuItem(menuItem.id, {
                reason: 'temporary_unavailable',
                effectiveDate: new Date()
            });
            expect(softDeleteResult.success).toBe(true);
            const deactivatedItem = await menuService.getMenuItemById(menuItem.id);
            expect(deactivatedItem.isActive).toBe(false);
            expect(deactivatedItem.deactivationReason).toBe('temporary_unavailable');
        });
        it('should handle menu item versioning and history tracking', async () => {
            const originalItem = await menuService.createMenuItem(test_helpers_1.TestDataFactory.menuItem({
                name: 'Original Recipe',
                price: 80.00,
                ingredients: ['rice', 'vegetables']
            }));
            const update1 = await menuService.updateMenuItem(originalItem.id, {
                name: 'Improved Recipe',
                price: 85.00
            });
            const update2 = await menuService.updateMenuItem(originalItem.id, {
                ingredients: ['rice', 'vegetables', 'herbs', 'spices'],
                nutritionalInfo: { calories: 450, protein: 12, carbs: 70, fat: 8 }
            });
            const itemHistory = await menuService.getMenuItemHistory(originalItem.id);
            expect(itemHistory).toHaveLength(3);
            expect(itemHistory[0].name).toBe('Original Recipe');
            expect(itemHistory[1].name).toBe('Improved Recipe');
            expect(itemHistory[2].ingredients).toEqual(['rice', 'vegetables', 'herbs', 'spices']);
            const currentItem = await menuService.getMenuItemById(originalItem.id);
            expect(currentItem.name).toBe('Improved Recipe');
            expect(currentItem.price).toBe(85.00);
            expect(currentItem.ingredients).toEqual(['rice', 'vegetables', 'herbs', 'spices']);
            const rollbackResult = await menuService.rollbackMenuItem(originalItem.id, itemHistory[0].version);
            expect(rollbackResult.success).toBe(true);
            const rolledBackItem = await menuService.getMenuItemById(originalItem.id);
            expect(rolledBackItem.name).toBe('Original Recipe');
            expect(rolledBackItem.price).toBe(80.00);
        });
    });
    describe('Menu Planning Workflows', () => {
        it('should create comprehensive weekly menu plans with validation', async () => {
            const mainCourse1 = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                category: 'main-course',
                name: 'Nutritious Rice Bowl',
                nutritionalInfo: { calories: 400, protein: 18, carbs: 65, fat: 10 }
            });
            const mainCourse2 = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                category: 'main-course',
                name: 'Vegetable Pasta',
                nutritionalInfo: { calories: 380, protein: 15, carbs: 70, fat: 8 }
            });
            const beverage = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                category: 'beverage',
                name: 'Fresh Fruit Juice',
                nutritionalInfo: { calories: 120, protein: 2, carbs: 30, fat: 0 }
            });
            const dessert = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                category: 'dessert',
                name: 'Seasonal Fruit Salad',
                nutritionalInfo: { calories: 80, protein: 1, carbs: 20, fat: 0 }
            });
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
            const weeklyPlan = await menuPlanService.createWeeklyPlan(weeklyPlanData);
            expect(weeklyPlan.success).toBe(true);
            expect(weeklyPlan.plans).toHaveLength(3);
            expect(weeklyPlan.validationResults.overallCompliance).toBeGreaterThan(0.8);
            for (const plan of weeklyPlan.plans) {
                expect(plan.id).toBeDefined();
                expect(plan.planDate).toBeInstanceOf(Date);
                expect(plan.isActive).toBe(true);
                const nutritionalSummary = await menuPlanService.calculateNutritionalSummary(plan.id);
                expect(nutritionalSummary.totalCalories).toBeGreaterThan(0);
                expect(nutritionalSummary.proteinPercentage).toBeGreaterThan(10);
                expect(nutritionalSummary.carbsPercentage).toBeGreaterThan(40);
                expect(nutritionalSummary.balanceScore).toBeGreaterThan(0.7);
            }
            const weeklyStats = await menuPlanService.getWeeklyNutritionalStats(weeklyPlan.plans.map((p) => p.id));
            expect(weeklyStats.averageCaloriesPerDay).toBeGreaterThan(900);
            expect(weeklyStats.varietyScore).toBeGreaterThan(0.6);
        });
        it('should validate dietary restrictions and suggest alternatives', async () => {
            const glutenItem = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                name: 'Wheat Bread Sandwich',
                allergens: ['gluten'],
                isGlutenFree: false,
                ingredients: ['wheat bread', 'vegetables', 'sauce']
            });
            const nutItem = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                name: 'Peanut Butter Cookie',
                allergens: ['nuts', 'peanuts'],
                isVegan: false,
                ingredients: ['flour', 'peanut butter', 'sugar', 'butter']
            });
            const safeItem = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                name: 'Quinoa Vegetable Salad',
                isVegan: true,
                isGlutenFree: true,
                allergens: [],
                ingredients: ['quinoa', 'vegetables', 'olive oil', 'herbs']
            });
            const dairyItem = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                name: 'Cheese Pizza',
                allergens: ['dairy'],
                isVegan: false,
                ingredients: ['dough', 'tomato sauce', 'mozzarella cheese']
            });
            const planResult = await menuPlanService.createMenuPlan({
                ...test_helpers_1.TestDataFactory.menuPlan(),
                items: [glutenItem.id, nutItem.id, safeItem.id, dairyItem.id],
                planDate: new Date('2024-01-16')
            });
            expect(planResult.id).toBeDefined();
            const strictValidation = await validationService.validateMenuPlanDietary(planResult.id, {
                dietaryRestrictions: ['gluten-free', 'nut-free', 'vegan'],
                allergens: ['nuts', 'gluten', 'dairy'],
                strictMode: true
            });
            expect(strictValidation.hasConflicts).toBe(true);
            expect(strictValidation.conflicts).toHaveLength(3);
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
            const flexibleValidation = await validationService.validateMenuPlanDietary(planResult.id, {
                dietaryRestrictions: ['gluten-free'],
                strictMode: false,
                allowPartialCompliance: true
            });
            expect(flexibleValidation.complianceScore).toBe(0.75);
            const alternatives = await menuPlanService.suggestAlternatives(planResult.id, {
                dietaryRestrictions: ['gluten-free', 'nut-free', 'vegan'],
                maxAlternatives: 2
            });
            expect(alternatives.suggestions).toBeDefined();
            expect(alternatives.suggestions.length).toBeGreaterThan(0);
            for (const suggestion of alternatives.suggestions) {
                expect(suggestion.originalItemId).toBeDefined();
                expect(suggestion.alternativeItems).toBeDefined();
                expect(suggestion.complianceImprovement).toBeGreaterThan(0);
            }
        });
        it('should handle seasonal menu transitions and availability', async () => {
            const summerItems = await Promise.all([
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: 'Cold Gazpacho Soup',
                    seasonality: ['summer'],
                    isAvailable: true,
                    availabilityStart: new Date('2024-06-01'),
                    availabilityEnd: new Date('2024-08-31')
                }),
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: 'Iced Fruit Lemonade',
                    seasonality: ['summer'],
                    isAvailable: true,
                    availabilityStart: new Date('2024-06-01'),
                    availabilityEnd: new Date('2024-08-31')
                })
            ]);
            const winterItems = await Promise.all([
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: 'Hearty Vegetable Soup',
                    seasonality: ['winter'],
                    isAvailable: false,
                    availabilityStart: new Date('2024-12-01'),
                    availabilityEnd: new Date('2025-02-28')
                }),
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: 'Hot Spiced Cider',
                    seasonality: ['winter'],
                    isAvailable: false,
                    availabilityStart: new Date('2024-12-01'),
                    availabilityEnd: new Date('2025-02-28')
                })
            ]);
            const yearRoundItem = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                name: 'Classic Rice Bowl',
                seasonality: ['spring', 'summer', 'fall', 'winter'],
                isAvailable: true
            });
            const summerPlan = await menuPlanService.createMenuPlan({
                ...test_helpers_1.TestDataFactory.menuPlan(),
                items: [...summerItems.map(item => item.id), yearRoundItem.id],
                season: 'summer',
                planDate: new Date('2024-07-15')
            });
            expect(summerPlan.id).toBeDefined();
            expect(summerPlan.validationWarnings).toHaveLength(0);
            const winterPlanAttempt = await menuPlanService.createMenuPlan({
                ...test_helpers_1.TestDataFactory.menuPlan(),
                items: winterItems.map(item => item.id),
                season: 'summer',
                planDate: new Date('2024-07-15')
            });
            expect(winterPlanAttempt.id).toBeDefined();
            expect(winterPlanAttempt.validationWarnings).toEqual(expect.arrayContaining([
                expect.stringMatching(/seasonal.*availability|out.*season/i)
            ]));
            const transitionResult = await menuService.updateSeasonalAvailability('winter');
            expect(transitionResult.success).toBe(true);
            expect(transitionResult.itemsActivated).toBe(2);
            expect(transitionResult.itemsDeactivated).toBe(2);
            const updatedWinterItems = await Promise.all(winterItems.map(item => menuService.getMenuItemById(item.id)));
            const updatedSummerItems = await Promise.all(summerItems.map(item => menuService.getMenuItemById(item.id)));
            updatedWinterItems.forEach(item => {
                expect(item.isAvailable).toBe(true);
            });
            updatedSummerItems.forEach(item => {
                expect(item.isAvailable).toBe(false);
            });
            const updatedYearRound = await menuService.getMenuItemById(yearRoundItem.id);
            expect(updatedYearRound.isAvailable).toBe(true);
        });
        it('should optimize menu plans for nutritional balance and cost', async () => {
            const items = await Promise.all([
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: 'High Protein Bowl',
                    price: 95.00,
                    costPerServing: 65.00,
                    nutritionalInfo: { calories: 450, protein: 25, carbs: 40, fat: 18 }
                }),
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: 'Balanced Rice Dish',
                    price: 75.00,
                    costPerServing: 45.00,
                    nutritionalInfo: { calories: 380, protein: 15, carbs: 65, fat: 8 }
                }),
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: 'Light Vegetable Salad',
                    price: 60.00,
                    costPerServing: 35.00,
                    nutritionalInfo: { calories: 220, protein: 8, carbs: 25, fat: 12 }
                })
            ]);
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
            const optimizedPlan = await menuPlanService.createOptimizedPlan(optimizationRequest);
            expect(optimizedPlan.success).toBe(true);
            expect(optimizedPlan.plan.items.length).toBeLessThanOrEqual(2);
            const costAnalysis = await menuPlanService.calculateCostAnalysis(optimizedPlan.plan.id);
            expect(costAnalysis.averageCostPerServing).toBeLessThanOrEqual(55.00);
            const nutritionAnalysis = await menuPlanService.calculateNutritionalSummary(optimizedPlan.plan.id);
            expect(nutritionAnalysis.totalProtein).toBeGreaterThanOrEqual(12);
            expect(nutritionAnalysis.totalCalories).toBeGreaterThanOrEqual(350);
            expect(optimizedPlan.optimizationScore).toBeGreaterThan(0.7);
            expect(optimizedPlan.optimizationBreakdown.costScore).toBeDefined();
            expect(optimizedPlan.optimizationBreakdown.nutritionScore).toBeDefined();
        });
    });
    describe('Daily Menu Operations', () => {
        it('should generate daily menus from weekly plans with inventory tracking', async () => {
            const items = await Promise.all([
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
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
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    category: 'beverage',
                    name: 'Fresh Orange Juice',
                    ingredients: ['oranges', 'water'],
                    inventoryRequirements: [
                        { ingredient: 'oranges', quantityPerServing: 2, unit: 'pieces' }
                    ]
                }),
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
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
            const weeklyPlan = await menuPlanService.createMenuPlan({
                ...test_helpers_1.TestDataFactory.menuPlan(),
                items: items.map(item => item.id),
                planDate: new Date('2024-01-15'),
                mealType: 'lunch',
                expectedServings: 150
            });
            const dailyMenuData = {
                schoolId: 'test-school-1',
                date: new Date('2024-01-15'),
                basedOnPlan: weeklyPlan.id,
                expectedServings: 150,
                mealType: 'lunch'
            };
            const dailyMenu = await dailyMenuService.generateDailyMenu(dailyMenuData);
            expect(dailyMenu.success).toBe(true);
            expect(dailyMenu.menu.id).toBeDefined();
            expect(dailyMenu.menu.items).toHaveLength(3);
            expect(dailyMenu.menu.totalEstimatedCost).toBeGreaterThan(0);
            expect(dailyMenu.menu.estimatedPreparationTime).toBeGreaterThan(0);
            expect(dailyMenu.menu.inventoryRequirements).toBeDefined();
            expect(dailyMenu.menu.inventoryRequirements.length).toBeGreaterThan(0);
            const riceRequirement = dailyMenu.menu.inventoryRequirements.find((req) => req.ingredient === 'rice');
            expect(riceRequirement).toBeDefined();
            expect(riceRequirement.totalQuantityNeeded).toBe(15000);
            const costBreakdown = dailyMenu.menu.costBreakdown;
            expect(costBreakdown.ingredientCosts).toBeDefined();
            expect(costBreakdown.laborCosts).toBeDefined();
            expect(costBreakdown.totalCost).toBeGreaterThan(0);
            expect(dailyMenu.menu.preparationSchedule).toBeDefined();
            expect(dailyMenu.menu.preparationSchedule.length).toBeGreaterThan(0);
        });
        it('should handle real-time menu adjustments and alternative suggestions', async () => {
            const items = await Promise.all([
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: 'Available Main Course',
                    category: 'main-course'
                }),
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: 'Potentially Unavailable Side',
                    category: 'side-dish'
                }),
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: 'Alternative Side Dish',
                    category: 'side-dish'
                })
            ]);
            const dailyMenu = await dailyMenuService.createDailyMenu({
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
            const adjustmentResult = await dailyMenuService.adjustAvailability(dailyMenu.id, items[1].id, {
                isAvailable: false,
                reason: 'ingredient_shortage',
                affectedQuantity: 30,
                timestamp: new Date()
            });
            expect(adjustmentResult.success).toBe(true);
            expect(adjustmentResult.notificationsSent).toBe(true);
            const updatedMenu = await dailyMenuService.getDailyMenuById(dailyMenu.id);
            const unavailableItem = updatedMenu.items.find((item) => item.itemId === items[1].id);
            expect(unavailableItem.isAvailable).toBe(false);
            expect(unavailableItem.unavailabilityReason).toBe('ingredient_shortage');
            expect(unavailableItem.availableQuantity).toBe(20);
            expect(adjustmentResult.suggestedAlternatives).toBeDefined();
            expect(adjustmentResult.suggestedAlternatives.length).toBeGreaterThan(0);
            const alternative = adjustmentResult.suggestedAlternatives[0];
            expect(alternative.itemId).toBe(items[2].id);
            expect(alternative.category).toBe('side-dish');
            expect(alternative.availabilityScore).toBeGreaterThan(0.7);
            const substitutionResult = await dailyMenuService.applyAutomaticSubstitution(dailyMenu.id, items[1].id, items[2].id, {
                reason: 'ingredient_shortage_replacement',
                quantity: 20,
                notifyUsers: true
            });
            expect(substitutionResult.success).toBe(true);
            expect(substitutionResult.substitutionApplied).toBe(true);
            const finalMenu = await dailyMenuService.getDailyMenuById(dailyMenu.id);
            const substitutedItem = finalMenu.items.find((item) => item.itemId === items[2].id);
            expect(substitutedItem).toBeDefined();
            expect(substitutedItem.substitutionReason).toBe('ingredient_shortage_replacement');
        });
        it('should track comprehensive menu performance metrics and analytics', async () => {
            const items = await Promise.all([
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: 'Popular Healthy Bowl',
                    category: 'main-course',
                    targetDemographics: ['health-conscious', 'athletes']
                }),
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: 'Standard Comfort Food',
                    category: 'main-course',
                    targetDemographics: ['general']
                }),
                menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: 'Specialty Dessert',
                    category: 'dessert',
                    targetDemographics: ['treat-lovers']
                })
            ]);
            const dailyMenu = await dailyMenuService.createDailyMenu({
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
            const orderingActivity = [
                { itemId: items[0].id, quantity: 85, orderTime: '11:30' },
                { itemId: items[1].id, quantity: 60, orderTime: '11:45' },
                { itemId: items[2].id, quantity: 25, orderTime: '12:00' },
                { itemId: items[0].id, quantity: 15, orderTime: '12:15' },
                { itemId: items[1].id, quantity: 20, orderTime: '12:30' }
            ];
            for (const activity of orderingActivity) {
                await dailyMenuService.recordOrder(dailyMenu.id, {
                    itemId: activity.itemId,
                    quantity: activity.quantity,
                    orderTime: activity.orderTime,
                    userDemographics: items.find(i => i.id === activity.itemId).targetDemographics[0]
                });
            }
            const performance = await dailyMenuService.getMenuPerformance(dailyMenu.id);
            expect(performance.totalOrdered).toBe(205);
            expect(performance.items).toHaveLength(3);
            const popularItem = performance.items.find((item) => item.itemId === items[0].id);
            const moderateItem = performance.items.find((item) => item.itemId === items[1].id);
            const specialtyItem = performance.items.find((item) => item.itemId === items[2].id);
            expect(popularItem.orderRate).toBe(1.0);
            expect(popularItem.totalOrdered).toBe(100);
            expect(popularItem.performanceRating).toBe('excellent');
            expect(moderateItem.orderRate).toBe(0.8);
            expect(moderateItem.performanceRating).toBe('good');
            expect(specialtyItem.orderRate).toBe(0.25);
            expect(specialtyItem.performanceRating).toBe('poor');
            expect(performance.peakOrderingTime).toBe('12:00-12:15');
            expect(performance.orderingDistribution).toBeDefined();
            expect(performance.recommendations).toEqual(expect.arrayContaining([
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
            ]));
            const demographicAnalysis = await analyticsService.analyzeDemographicPreferences(dailyMenu.id);
            expect(demographicAnalysis['health-conscious'].preferenceScore).toBeGreaterThan(0.8);
            expect(demographicAnalysis['treat-lovers'].preferenceScore).toBeLessThan(0.3);
        });
    });
    describe('Cross-Epic Integration', () => {
        it('should integrate with payment system for dynamic pricing and discounts', async () => {
            const premiumItem = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                name: 'Premium Gourmet Meal',
                price: 150.00,
                pricingTier: 'premium',
                category: 'main-course'
            });
            const standardItem = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                name: 'Standard Nutritious Meal',
                price: 85.00,
                pricingTier: 'standard',
                category: 'main-course'
            });
            const economyItem = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                name: 'Budget-Friendly Option',
                price: 60.00,
                pricingTier: 'economy',
                category: 'main-course'
            });
            const menuPlan = await menuPlanService.createMenuPlan({
                ...test_helpers_1.TestDataFactory.menuPlan(),
                items: [premiumItem.id, standardItem.id, economyItem.id]
            });
            const studentPricing = await menuPlanService.calculatePricing(menuPlan.id, {
                userType: 'student',
                subscriptionTier: 'basic',
                userId: 'test-student-1'
            });
            const parentPremiumPricing = await menuPlanService.calculatePricing(menuPlan.id, {
                userType: 'parent',
                subscriptionTier: 'premium',
                userId: 'test-parent-1'
            });
            const teacherPricing = await menuPlanService.calculatePricing(menuPlan.id, {
                userType: 'teacher',
                subscriptionTier: 'standard',
                userId: 'test-teacher-1'
            });
            expect(studentPricing.totalPrice).toBeLessThan(parentPremiumPricing.totalPrice);
            expect(studentPricing.discountApplied).toBeGreaterThan(0);
            expect(studentPricing.discountPercentage).toBeGreaterThan(10);
            expect(parentPremiumPricing.taxAmount).toBeGreaterThan(0);
            expect(parentPremiumPricing.premiumFeatures.unlimitedSelections).toBe(true);
            expect(teacherPricing.staffDiscount).toBeGreaterThan(0);
            const demandPricing = await menuPlanService.calculateDemandBasedPricing(menuPlan.id, {
                currentDemand: 0.85,
                timeOfDay: '12:00',
                dayOfWeek: 'monday'
            });
            expect(demandPricing.dynamicPriceAdjustment).toBeGreaterThan(0);
            expect(demandPricing.adjustedTotalPrice).toBeGreaterThan(studentPricing.totalPrice);
            const bulkPricing = await menuPlanService.calculateBulkPricing(menuPlan.id, {
                quantity: 50,
                orderType: 'catering',
                advanceOrderDays: 3
            });
            expect(bulkPricing.bulkDiscountPercentage).toBeGreaterThan(5);
            expect(bulkPricing.pricePerUnit).toBeLessThan(studentPricing.totalPrice);
        });
        it('should integrate with RFID system for seamless delivery and order tracking', async () => {
            const menuItem = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                name: 'RFID Trackable Meal',
                requiresVerification: true
            });
            const dailyMenu = await dailyMenuService.createDailyMenu({
                schoolId: 'test-school-1',
                date: new Date(),
                items: [{
                        itemId: menuItem.id,
                        quantity: 50,
                        isAvailable: true,
                        requiresRFIDVerification: true
                    }]
            });
            const order = await dailyMenuService.createOrder({
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
            const preparationUpdate = await dailyMenuService.updateOrderStatus(order.id, {
                status: 'preparing',
                estimatedCompletionTime: new Date(Date.now() + 15 * 60 * 1000)
            });
            expect(preparationUpdate.success).toBe(true);
            const completionUpdate = await dailyMenuService.updateOrderStatus(order.id, {
                status: 'ready_for_pickup',
                preparationCompletedAt: new Date()
            });
            expect(completionUpdate.success).toBe(true);
            const rfidVerification = await dailyMenuService.verifyRFIDDelivery({
                orderId: order.id,
                rfidCardId: 'test-rfid-123',
                verificationLocation: 'cafeteria-station-1',
                timestamp: new Date(),
                verificationStaff: 'staff-001'
            });
            expect(rfidVerification.success).toBe(true);
            expect(rfidVerification.deliveryConfirmed).toBe(true);
            expect(rfidVerification.matchedUser).toBe('test-student-1');
            const updatedOrder = await dailyMenuService.getOrderById(order.id);
            expect(updatedOrder.status).toBe('delivered');
            expect(updatedOrder.deliveryTimestamp).toBeDefined();
            expect(updatedOrder.rfidVerified).toBe(true);
            expect(updatedOrder.deliveryLocation).toBe('cafeteria-station-1');
            const fraudAttempt = await dailyMenuService.verifyRFIDDelivery({
                orderId: order.id,
                rfidCardId: 'different-rfid-456',
                verificationLocation: 'cafeteria-station-1',
                timestamp: new Date()
            });
            expect(fraudAttempt.success).toBe(false);
            expect(fraudAttempt.error).toMatch(/mismatch|unauthorized/i);
            const deliveryAnalytics = await analyticsService.getDeliveryAnalytics({
                schoolId: 'test-school-1',
                dateRange: { start: new Date(), end: new Date() }
            });
            expect(deliveryAnalytics.totalDeliveries).toBe(1);
            expect(deliveryAnalytics.rfidVerificationRate).toBe(1.0);
            expect(deliveryAnalytics.averagePickupTime).toBeDefined();
        });
        it('should integrate with notification system for comprehensive menu updates', async () => {
            const specialDietItem = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                name: 'Gluten-Free Vegan Special',
                isVegan: true,
                isGlutenFree: true,
                tags: ['special-diet', 'allergen-friendly']
            });
            const popularItem = await menuService.createMenuItem({
                ...test_helpers_1.TestDataFactory.menuItem(),
                name: 'Student Favorite Pizza',
                tags: ['popular', 'comfort-food']
            });
            const subscriptionSetup = await notificationService.setupMenuNotifications([
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
            const dailyMenu = await dailyMenuService.createDailyMenu({
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
            const changeResult = await dailyMenuService.adjustAvailability(dailyMenu.id, specialDietItem.id, {
                isAvailable: false,
                reason: 'ingredient_allergy_concern',
                severity: 'high',
                affectedQuantity: 30
            });
            expect(changeResult.success).toBe(true);
            expect(changeResult.notificationsSent).toBe(true);
            expect(changeResult.notifiedUsers).toContain('test-student-vegan');
            expect(changeResult.notifiedUsers).toContain('test-parent-premium');
            expect(changeResult.notifiedUsers).not.toContain('test-student-general');
            expect(changeResult.notificationContent).toEqual(expect.objectContaining({
                type: 'menu_item_unavailable',
                severity: 'high',
                itemName: 'Gluten-Free Vegan Special',
                reason: 'ingredient_allergy_concern',
                alternatives: expect.any(Array),
                affectedDiets: ['vegan', 'gluten-free']
            }));
            const priceChangeResult = await menuService.updateMenuItem(popularItem.id, {
                price: popularItem.price * 0.9,
                priceChangeReason: 'promotional_discount'
            });
            const priceNotifications = await notificationService.getRecentNotifications({
                type: 'price_change',
                timeframe: '5_minutes'
            });
            expect(priceNotifications.length).toBeGreaterThan(0);
            expect(priceNotifications[0].recipients).toContain('test-student-general');
            expect(priceNotifications[0].content.priceChange).toBe(-10);
            const weeklyMenuUpdate = await menuPlanService.publishWeeklyMenu({
                schoolId: 'test-school-1',
                startDate: new Date(),
                notifySubscribers: true
            });
            expect(weeklyMenuUpdate.notificationsSent).toBeGreaterThan(0);
            expect(weeklyMenuUpdate.notificationBreakdown.emailsSent).toBeGreaterThan(0);
            expect(weeklyMenuUpdate.notificationBreakdown.pushNotificationsSent).toBeGreaterThan(0);
            const notificationStats = await notificationService.getNotificationAnalytics({
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
            const operationPromises = Array.from({ length: concurrentOperations }, async (_, index) => {
                const itemCreation = menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: `Concurrent Item ${index}`,
                    category: index % 3 === 0 ? 'main-course' : index % 3 === 1 ? 'side-dish' : 'beverage',
                    price: 50 + (index * 5)
                });
                const menuItem = await itemCreation;
                const planCreation = menuPlanService.createMenuPlan({
                    ...test_helpers_1.TestDataFactory.menuPlan(),
                    items: [menuItem.id],
                    planDate: new Date(Date.now() + index * 24 * 60 * 60 * 1000)
                });
                const menuPlan = await planCreation;
                const itemRetrieval = menuService.getMenuItemById(menuItem.id);
                const planRetrieval = menuPlanService.getMenuPlanById(menuPlan.id);
                const [retrievedItem, retrievedPlan] = await Promise.all([itemRetrieval, planRetrieval]);
                return { menuItem, menuPlan, retrievedItem, retrievedPlan, index };
            });
            const results = await Promise.all(operationPromises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            expect(results).toHaveLength(concurrentOperations);
            results.forEach((result, index) => {
                expect(result.menuItem.id).toBeDefined();
                expect(result.menuPlan.id).toBeDefined();
                expect(result.retrievedItem).toBeTruthy();
                expect(result.retrievedPlan).toBeTruthy();
                expect(result.index).toBe(index);
            });
            expect(totalTime).toBeLessThan(10000);
            const averageTimePerOperation = totalTime / concurrentOperations;
            expect(averageTimePerOperation).toBeLessThan(500);
            const allMenuItems = await menuService.getMenuItems({
                schoolId: 'test-school-1',
                limit: 100
            });
            const concurrentItems = allMenuItems.items.filter(item => item.name.startsWith('Concurrent Item'));
            expect(concurrentItems).toHaveLength(concurrentOperations);
            const names = concurrentItems.map(item => item.name);
            const uniqueNames = [...new Set(names)];
            expect(uniqueNames).toHaveLength(concurrentOperations);
            const dbConsistencyCheck = await databaseService.checkDataConsistency([
                'menu_items', 'menu_plans', 'daily_menus'
            ]);
            expect(dbConsistencyCheck.consistencyScore).toBeGreaterThan(0.95);
        });
        it('should efficiently handle large menu datasets with optimized queries', async () => {
            const largeDatasetSize = 200;
            const menuItems = await Promise.all(Array.from({ length: largeDatasetSize }, (_, index) => {
                return menuService.createMenuItem({
                    ...test_helpers_1.TestDataFactory.menuItem(),
                    name: `Menu Item ${index.toString().padStart(3, '0')}`,
                    category: ['main-course', 'side-dish', 'beverage', 'dessert', 'snack'][index % 5],
                    price: 50 + (index % 50),
                    tags: [`tag-${index % 10}`, `category-${index % 5}`],
                    isVegan: index % 4 === 0,
                    isGlutenFree: index % 6 === 0,
                    isAvailable: index % 20 !== 19
                });
            }));
            expect(menuItems).toHaveLength(largeDatasetSize);
            const searchStartTime = Date.now();
            const complexSearchResult = await menuService.searchMenuItems({
                schoolId: 'test-school-1',
                query: 'Menu Item',
                filters: {
                    category: ['main-course', 'side-dish'],
                    tags: ['tag-1', 'tag-2']
                },
                sort: { field: 'price', direction: 'asc' },
                pagination: { page: 1, limit: 50 }
            });
            const searchEndTime = Date.now();
            expect(complexSearchResult.items.length).toBeLessThanOrEqual(50);
            expect(complexSearchResult.totalCount).toBeGreaterThan(0);
            expect(searchEndTime - searchStartTime).toBeLessThan(2000);
            complexSearchResult.items.forEach((item) => {
                expect(['main-course', 'side-dish']).toContain(item.category);
                expect(item.isVegan).toBe(true);
                expect(item.price).toBeGreaterThanOrEqual(50);
                expect(item.price).toBeLessThanOrEqual(80);
            });
            const aggregationStartTime = Date.now();
            const stats = await menuService.getMenuStatistics('test-school-1');
            const aggregationEndTime = Date.now();
            expect(stats.totalItems).toBe(largeDatasetSize);
            expect(stats.categoryCounts['main-course']).toBe(40);
            expect(stats.categoryCounts['side-dish']).toBe(40);
            expect(stats.veganPercentage).toBeCloseTo(25);
            expect(stats.glutenFreePercentage).toBeCloseTo(16.67);
            expect(aggregationEndTime - aggregationStartTime).toBeLessThan(1000);
            const paginationStartTime = Date.now();
            const paginatedResults = await Promise.all([
                menuService.searchMenuItems({ query: '', schoolId: 'test-school-1', pagination: { page: 1, limit: 20 } }),
                menuService.searchMenuItems({ query: '', schoolId: 'test-school-1', pagination: { page: 2, limit: 20 } }),
                menuService.searchMenuItems({ query: '', schoolId: 'test-school-1', pagination: { page: 5, limit: 20 } })
            ]);
            const paginationEndTime = Date.now();
            paginatedResults.forEach(result => {
                expect(result.items).toHaveLength(20);
                expect(result.hasNextPage).toBe(true);
            });
            expect(paginationEndTime - paginationStartTime).toBeLessThan(1500);
            const bulkUpdateStartTime = Date.now();
            const firstTwentyIds = menuItems.slice(0, 20).map(item => item.id);
            const bulkUpdateResult = await menuService.bulkUpdateMenuItems(firstTwentyIds, {
                tags: ['bulk-updated', 'performance-test'],
                isAvailable: true
            });
            const bulkUpdateEndTime = Date.now();
            expect(bulkUpdateResult.success).toBe(true);
            expect(bulkUpdateResult.updatedCount).toBe(20);
            expect(bulkUpdateEndTime - bulkUpdateStartTime).toBeLessThan(2000);
            const updatedItems = await Promise.all(firstTwentyIds.map(id => menuService.getMenuItemById(id)));
            updatedItems.forEach(item => {
                expect(item.tags).toContain('bulk-updated');
                expect(item.tags).toContain('performance-test');
            });
        });
        it('should maintain performance under memory pressure and resource constraints', async () => {
            const originalMemoryLimit = process.env.NODE_OPTIONS;
            process.env.NODE_OPTIONS = '--max-old-space-size=512';
            try {
                const memoryTestSize = 100;
                const performanceMetrics = {
                    creationTimes: [],
                    retrievalTimes: [],
                    memoryUsages: []
                };
                for (let i = 0; i < memoryTestSize; i++) {
                    const creationStart = Date.now();
                    const menuItem = await menuService.createMenuItem({
                        ...test_helpers_1.TestDataFactory.menuItem(),
                        name: `Memory Test ${i}`,
                        description: `Description ${i}`,
                        category: 'main-course'
                    });
                    const creationEnd = Date.now();
                    performanceMetrics.creationTimes.push(creationEnd - creationStart);
                    const retrievalStart = Date.now();
                    await menuService.getMenuItemById(menuItem.id);
                    const retrievalEnd = Date.now();
                    performanceMetrics.retrievalTimes.push(retrievalEnd - retrievalStart);
                    if (i % 10 === 0) {
                        const memoryUsage = process.memoryUsage();
                        const iteration = i;
                        performanceMetrics.memoryUsages.push({
                            iteration: i,
                            heapUsed: memoryUsage.heapUsed,
                            heapTotal: memoryUsage.heapTotal,
                            rss: memoryUsage.rss
                        });
                    }
                    if (i % 20 === 0 && global.gc) {
                        global.gc();
                    }
                }
                const avgCreationTime = performanceMetrics.creationTimes.reduce((a, b) => a + b, 0) / memoryTestSize;
                const avgRetrievalTime = performanceMetrics.retrievalTimes.reduce((a, b) => a + b, 0) / memoryTestSize;
                expect(avgCreationTime).toBeLessThan(200);
                expect(avgRetrievalTime).toBeLessThan(50);
                const memoryGrowth = performanceMetrics.memoryUsages;
                const initialMemory = memoryGrowth[0]?.heapUsed || 0;
                const finalMemory = memoryGrowth[memoryGrowth.length - 1]?.heapUsed || 0;
                const memoryGrowthRatio = finalMemory / initialMemory;
                expect(memoryGrowthRatio).toBeLessThan(3.0);
                const cacheTest = await menuService.testCacheEfficiency({
                    iterations: 50,
                    cacheHitRateTarget: 0.8
                });
                expect(cacheTest.cacheHitRate).toBeGreaterThan(0.7);
                expect(cacheTest.averageResponseTime).toBeLessThan(100);
            }
            finally {
                if (originalMemoryLimit) {
                    process.env.NODE_OPTIONS = originalMemoryLimit;
                }
                else {
                    delete process.env.NODE_OPTIONS;
                }
            }
        });
        it('should demonstrate horizontal scaling capabilities', async () => {
            const serviceInstances = Array.from({ length: 3 }, () => ({
                menuService: new menuItem_service_1.MenuItemService(),
                menuPlanService: new menuPlan_service_1.MenuPlanService()
            }));
            const scalingTestSize = 60;
            const operationsPerInstance = scalingTestSize / serviceInstances.length;
            const scalingStartTime = Date.now();
            const instancePromises = serviceInstances.map(async (instance, instanceIndex) => {
                const instanceOperations = Array.from({ length: operationsPerInstance }, async (_, opIndex) => {
                    const globalIndex = instanceIndex * operationsPerInstance + opIndex;
                    const menuItem = await instance.menuService.createMenuItem({
                        ...test_helpers_1.TestDataFactory.menuItem(),
                        name: `Scaling Test ${globalIndex}`,
                        description: `Created by instance ${instanceIndex}`
                    });
                    const menuPlan = await instance.menuPlanService.createMenuPlan({
                        ...test_helpers_1.TestDataFactory.menuPlan(),
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
            const allResults = instanceResults.flat();
            expect(allResults).toHaveLength(scalingTestSize);
            const resultsByInstance = allResults.reduce((acc, result) => {
                acc[result.instanceIndex] = (acc[result.instanceIndex] || 0) + 1;
                return acc;
            }, {});
            expect(Object.keys(resultsByInstance)).toHaveLength(3);
            Object.values(resultsByInstance).forEach(count => {
                expect(count).toBe(operationsPerInstance);
            });
            const scalingEfficiency = scalingTestSize / (totalScalingTime / 1000);
            expect(scalingEfficiency).toBeGreaterThan(10);
            const consistencyCheck = await Promise.all([
                serviceInstances[0].menuService.getMenuItems({ schoolId: 'test-school-1', limit: 100 }),
                serviceInstances[1].menuService.getMenuItems({ schoolId: 'test-school-1', limit: 100 }),
                serviceInstances[2].menuService.getMenuItems({ schoolId: 'test-school-1', limit: 100 })
            ]);
            const itemCounts = consistencyCheck.map(result => result.totalCount);
            expect(new Set(itemCounts).size).toBe(1);
            await Promise.all(serviceInstances.map(instance => Promise.all([
                instance.menuService.disconnect(),
                instance.menuPlanService.disconnect()
            ])));
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle database connection failures gracefully', async () => {
            const originalConnection = databaseService.connection;
            try {
                databaseService.connection = null;
                const result = await menuService.createMenuItem(test_helpers_1.TestDataFactory.menuItem({ name: 'Connection Test Item' }));
                expect(result.success).toBe(false);
                expect(result.error).toMatch(/database.*connection|unavailable/i);
                expect(result.retryable).toBe(true);
                databaseService.connection = originalConnection;
                const retryResult = await menuService.retryLastOperation();
                expect(retryResult.success).toBe(true);
            }
            finally {
                databaseService.connection = originalConnection;
            }
        });
        it('should validate menu item data integrity and constraints', async () => {
            const invalidNutritionItem = test_helpers_1.TestDataFactory.menuItem({
                nutritionalInfo: {
                    calories: -100,
                    protein: 150,
                    carbs: -50,
                    fat: 200
                }
            });
            const nutritionValidation = await menuService.validateMenuItem(invalidNutritionItem);
            expect(nutritionValidation.isValid).toBe(false);
            expect(nutritionValidation.errors).toEqual(expect.arrayContaining([
                expect.stringMatching(/calories.*negative/i),
                expect.stringMatching(/protein.*unrealistic/i),
                expect.stringMatching(/carbs.*negative/i)
            ]));
            const invalidPriceItem = test_helpers_1.TestDataFactory.menuItem({
                price: -10.00,
                costPerServing: 50.00
            });
            const priceValidation = await menuService.validateMenuItem(invalidPriceItem);
            expect(priceValidation.isValid).toBe(false);
            expect(priceValidation.errors).toEqual(expect.arrayContaining([
                expect.stringMatching(/price.*negative/i)
            ]));
        });
    });
});
//# sourceMappingURL=menu-ecosystem.test.js.map