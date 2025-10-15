"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nutritional_compliance_service_1 = require("../nutritional-compliance.service");
describe('NutritionalComplianceService - Unit Tests', () => {
    let service;
    beforeEach(() => {
        service = new nutritional_compliance_service_1.NutritionalComplianceService();
    });
    describe('Nutritional Analysis', () => {
        it('should calculate correct nutritional values for menu items', async () => {
            const menuItem = {
                id: 'item_001',
                name: 'Vegetable Biryani',
                ingredients: [
                    { name: 'Basmati Rice', quantity: '150g', nutritionalValue: { calories: 191, protein: 4.3, carbohydrates: 39, fat: 0.4 } },
                    { name: 'Mixed Vegetables', quantity: '100g', nutritionalValue: { calories: 65, protein: 2.5, carbohydrates: 13, fat: 0.3 } },
                    { name: 'Cooking Oil', quantity: '10ml', nutritionalValue: { calories: 90, protein: 0, carbohydrates: 0, fat: 10 } },
                ],
            };
            const analysis = await service.analyzeNutritionalContent(menuItem);
            expect(analysis.totalCalories).toBe(346);
            expect(analysis.totalProtein).toBe(6.8);
            expect(analysis.totalCarbohydrates).toBe(52);
            expect(analysis.totalFat).toBe(10.7);
            expect(analysis.nutritionalDensity).toBeGreaterThan(0);
        });
        it('should identify macro and micronutrient distribution', async () => {
            const menuItem = {
                id: 'item_002',
                name: 'Dal Rice Combo',
                ingredients: [
                    {
                        name: 'Toor Dal',
                        quantity: '100g',
                        nutritionalValue: {
                            calories: 343, protein: 22.3, carbs: 57.6, fat: 1.5,
                            vitamins: { B1: 0.4, B6: 0.3, folate: 45 },
                            minerals: { iron: 2.7, magnesium: 115 }
                        }
                    },
                    {
                        name: 'Rice',
                        quantity: '100g',
                        nutritionalValue: {
                            calories: 130, protein: 2.7, carbs: 28, fat: 0.3,
                            vitamins: { B1: 0.02, B3: 1.6 },
                            minerals: { iron: 0.8, magnesium: 25 }
                        }
                    },
                ],
            };
            const analysis = await service.analyzeNutritionalContent(menuItem);
            expect(analysis.macroDistribution.proteinPercentage).toBeCloseTo(19, 1);
            expect(analysis.macroDistribution.carbsPercentage).toBeCloseTo(72, 1);
            expect(analysis.macroDistribution.fatPercentage).toBeCloseTo(3, 1);
            expect(analysis.micronutrients.vitamins.B1).toBe(0.42);
            expect(analysis.micronutrients.minerals.iron).toBe(3.5);
            expect(analysis.micronutrients.minerals.magnesium).toBe(140);
        });
        it('should calculate nutritional density score', async () => {
            const highDensityItem = {
                id: 'item_003',
                name: 'Spinach Dal',
                ingredients: [
                    {
                        name: 'Spinach',
                        quantity: '100g',
                        nutritionalValue: {
                            calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4,
                            vitamins: { A: 469, C: 28, K: 483, folate: 194 },
                            minerals: { iron: 2.7, calcium: 99 }
                        }
                    },
                ],
            };
            const lowDensityItem = {
                id: 'item_004',
                name: 'White Bread',
                ingredients: [
                    {
                        name: 'Refined Flour',
                        quantity: '100g',
                        nutritionalValue: {
                            calories: 265, protein: 9, carbs: 49, fat: 4,
                            vitamins: { B1: 0.1, B3: 1.5 },
                            minerals: { iron: 1.2 }
                        }
                    },
                ],
            };
            const highDensityAnalysis = await service.analyzeNutritionalContent(highDensityItem);
            const lowDensityAnalysis = await service.analyzeNutritionalContent(lowDensityItem);
            expect(highDensityAnalysis.nutritionalDensity).toBeGreaterThan(lowDensityAnalysis.nutritionalDensity);
            expect(highDensityAnalysis.healthScore).toBeGreaterThan(lowDensityAnalysis.healthScore);
        });
    });
    describe('Allergen Detection and Safety', () => {
        it('should detect all allergens in menu items', async () => {
            const menuItem = {
                id: 'item_005',
                name: 'Paneer Butter Masala',
                ingredients: [
                    { name: 'Paneer', allergens: ['DAIRY'] },
                    { name: 'Cashew Paste', allergens: ['TREE_NUTS'] },
                    { name: 'Wheat Flour', allergens: ['GLUTEN'] },
                    { name: 'Butter', allergens: ['DAIRY'] },
                ],
            };
            const allergenInfo = await service.detectAllergens(menuItem);
            expect(allergenInfo.allergens).toContain('DAIRY');
            expect(allergenInfo.allergens).toContain('TREE_NUTS');
            expect(allergenInfo.allergens).toContain('GLUTEN');
            expect(allergenInfo.allergens).toHaveLength(3);
            expect(allergenInfo.crossContaminationRisk).toBeGreaterThan(0);
        });
        it('should assess cross-contamination risks', async () => {
            const highRiskItem = {
                id: 'item_006',
                name: 'Mixed Nut Preparation',
                ingredients: [
                    { name: 'Peanuts', allergens: ['PEANUTS'] },
                    { name: 'Almonds', allergens: ['TREE_NUTS'] },
                    { name: 'Cashews', allergens: ['TREE_NUTS'] },
                ],
                preparationMethod: 'SHARED_FACILITY',
                kitchenEquipment: 'SHARED_GRINDER',
            };
            const lowRiskItem = {
                id: 'item_007',
                name: 'Plain Rice',
                ingredients: [
                    { name: 'Rice', allergens: [] },
                ],
                preparationMethod: 'DEDICATED_FACILITY',
                kitchenEquipment: 'DEDICATED_EQUIPMENT',
            };
            const highRiskAllergens = await service.detectAllergens(highRiskItem);
            const lowRiskAllergens = await service.detectAllergens(lowRiskItem);
            expect(highRiskAllergens.crossContaminationRisk).toBeGreaterThan(lowRiskAllergens.crossContaminationRisk);
            expect(highRiskAllergens.riskLevel).toBe('HIGH');
            expect(lowRiskAllergens.riskLevel).toBe('LOW');
        });
        it('should provide allergen safety recommendations', async () => {
            const studentProfile = {
                id: 'student_001',
                allergens: ['DAIRY', 'GLUTEN'],
                severity: { DAIRY: 'SEVERE', GLUTEN: 'MODERATE' },
                emergencyContact: '+91-9876543210',
                medicalNotes: 'Carries EpiPen for dairy allergy',
            };
            const menuItem = {
                id: 'item_008',
                name: 'Cheese Sandwich',
                ingredients: [
                    { name: 'Bread', allergens: ['GLUTEN'] },
                    { name: 'Cheese', allergens: ['DAIRY'] },
                ],
            };
            const safetyAssessment = await service.assessAllergenSafety(menuItem, studentProfile);
            expect(safetyAssessment.safe).toBe(false);
            expect(safetyAssessment.warnings).toHaveLength(2);
            expect(safetyAssessment.warnings.find((w) => w.allergen === 'DAIRY')).toBeDefined();
            expect(safetyAssessment.warnings.find((w) => w.allergen === 'GLUTEN')).toBeDefined();
            expect(safetyAssessment.severity).toBe('SEVERE');
            expect(safetyAssessment.alternativeItems).toHaveLength(0);
        });
    });
    describe('Dietary Restriction Compliance', () => {
        it('should validate vegetarian compliance', async () => {
            const vegetarianItem = {
                id: 'item_009',
                name: 'Vegetable Curry',
                ingredients: [
                    { name: 'Mixed Vegetables', category: 'VEGETABLE' },
                    { name: 'Vegetable Oil', category: 'PLANT_BASED' },
                ],
                dietaryTags: ['VEGETARIAN'],
            };
            const nonVegetarianItem = {
                id: 'item_010',
                name: 'Chicken Curry',
                ingredients: [
                    { name: 'Chicken', category: 'MEAT' },
                    { name: 'Vegetable Oil', category: 'PLANT_BASED' },
                ],
                dietaryTags: [],
            };
            const vegCompliance = await service.validateDietaryRestrictions(vegetarianItem, ['VEGETARIAN']);
            const nonVegCompliance = await service.validateDietaryRestrictions(nonVegetarianItem, ['VEGETARIAN']);
            expect(vegCompliance.compliant).toBe(true);
            expect(vegCompliance.violations).toHaveLength(0);
            expect(nonVegCompliance.compliant).toBe(false);
            expect(nonVegCompliance.violations).toContain('CONTAINS_MEAT');
        });
        it('should validate vegan compliance', async () => {
            const veganItem = {
                id: 'item_011',
                name: 'Quinoa Bowl',
                ingredients: [
                    { name: 'Quinoa', category: 'GRAIN' },
                    { name: 'Mixed Vegetables', category: 'VEGETABLE' },
                    { name: 'Olive Oil', category: 'PLANT_BASED' },
                ],
                dietaryTags: ['VEGAN', 'VEGETARIAN'],
            };
            const nonVeganItem = {
                id: 'item_012',
                name: 'Paneer Curry',
                ingredients: [
                    { name: 'Paneer', category: 'DAIRY' },
                    { name: 'Vegetables', category: 'VEGETABLE' },
                ],
                dietaryTags: ['VEGETARIAN'],
            };
            const veganCompliance = await service.validateDietaryRestrictions(veganItem, ['VEGAN']);
            const nonVeganCompliance = await service.validateDietaryRestrictions(nonVeganItem, ['VEGAN']);
            expect(veganCompliance.compliant).toBe(true);
            expect(nonVeganCompliance.compliant).toBe(false);
            expect(nonVeganCompliance.violations).toContain('CONTAINS_DAIRY');
        });
        it('should validate Jain dietary restrictions', async () => {
            const jainCompliantItem = {
                id: 'item_013',
                name: 'Jain Curry',
                ingredients: [
                    { name: 'Potatoes', category: 'VEGETABLE', subCategory: 'ABOVE_GROUND' },
                    { name: 'Tomatoes', category: 'VEGETABLE', subCategory: 'ABOVE_GROUND' },
                    { name: 'Cumin', category: 'SPICE' },
                ],
                dietaryTags: ['JAIN', 'VEGETARIAN', 'VEGAN'],
            };
            const jainNonCompliantItem = {
                id: 'item_014',
                name: 'Aloo Gobi with Onion',
                ingredients: [
                    { name: 'Potatoes', category: 'VEGETABLE', subCategory: 'BELOW_GROUND' },
                    { name: 'Onion', category: 'VEGETABLE', subCategory: 'BELOW_GROUND' },
                    { name: 'Cauliflower', category: 'VEGETABLE', subCategory: 'ABOVE_GROUND' },
                ],
                dietaryTags: ['VEGETARIAN'],
            };
            const jainCompliance = await service.validateDietaryRestrictions(jainCompliantItem, ['JAIN']);
            const nonJainCompliance = await service.validateDietaryRestrictions(jainNonCompliantItem, ['JAIN']);
            expect(jainCompliance.compliant).toBe(true);
            expect(nonJainCompliance.compliant).toBe(false);
            expect(nonJainCompliance.violations).toContain('CONTAINS_ROOT_VEGETABLES');
        });
    });
    describe('Government Compliance Rules', () => {
        it('should validate Indian government school meal guidelines', async () => {
            const compliantMeal = {
                id: 'meal_001',
                name: 'Government Compliant Lunch',
                nutritionalInfo: {
                    calories: 450,
                    protein: 18,
                    fat: 12,
                    carbohydrates: 65,
                    fiber: 8,
                    sodium: 800,
                    sugar: 5,
                },
                mealType: 'LUNCH',
                ageGroup: '10-14',
            };
            const nonCompliantMeal = {
                id: 'meal_002',
                name: 'High Sodium Meal',
                nutritionalInfo: {
                    calories: 350,
                    protein: 12,
                    fat: 18,
                    carbohydrates: 65,
                    fiber: 3,
                    sodium: 1200,
                    sugar: 15,
                },
                mealType: 'LUNCH',
                ageGroup: '10-14',
            };
            const compliantResult = await service.validateGovernmentCompliance(compliantMeal, 'INDIAN_GOVERNMENT');
            const nonCompliantResult = await service.validateGovernmentCompliance(nonCompliantMeal, 'INDIAN_GOVERNMENT');
            expect(compliantResult.compliant).toBe(true);
            expect(compliantResult.score).toBeGreaterThan(90);
            expect(nonCompliantResult.compliant).toBe(false);
            expect(nonCompliantResult.violations).toContain('INSUFFICIENT_CALORIES');
            expect(nonCompliantResult.violations).toContain('INSUFFICIENT_PROTEIN');
            expect(nonCompliantResult.violations).toContain('EXCESSIVE_SODIUM');
            expect(nonCompliantResult.score).toBeLessThan(60);
        });
        it('should apply different rules for different age groups', async () => {
            const meal = {
                id: 'meal_003',
                name: 'Age-Specific Meal',
                nutritionalInfo: {
                    calories: 300,
                    protein: 12,
                    fat: 10,
                    carbohydrates: 45,
                },
            };
            const primaryCompliance = await service.validateGovernmentCompliance({ ...meal, ageGroup: '6-10' }, 'INDIAN_GOVERNMENT');
            const secondaryCompliance = await service.validateGovernmentCompliance({ ...meal, ageGroup: '14-18' }, 'INDIAN_GOVERNMENT');
            expect(primaryCompliance.compliant).toBe(true);
            expect(secondaryCompliance.compliant).toBe(false);
            expect(secondaryCompliance.violations).toContain('INSUFFICIENT_CALORIES');
        });
        it('should validate WHO nutritional recommendations', async () => {
            const whoCompliantMeal = {
                id: 'meal_004',
                name: 'WHO Compliant Meal',
                nutritionalInfo: {
                    calories: 500,
                    protein: 20,
                    fat: 17,
                    carbohydrates: 65,
                    saturatedFat: 6,
                    transFat: 0,
                    fiber: 12,
                    sodium: 600,
                },
            };
            const whoResult = await service.validateGovernmentCompliance(whoCompliantMeal, 'WHO_RECOMMENDATIONS');
            expect(whoResult.compliant).toBe(true);
            expect(whoResult.score).toBeGreaterThan(85);
            expect(whoResult.recommendations).toContain('Excellent nutritional balance');
        });
    });
    describe('Nutritional Scoring and Recommendations', () => {
        it('should calculate comprehensive nutrition score', async () => {
            const excellentMeal = {
                id: 'meal_005',
                name: 'Nutritionally Excellent Meal',
                nutritionalInfo: {
                    calories: 450,
                    protein: 20,
                    fat: 15,
                    carbohydrates: 60,
                    fiber: 12,
                    vitamins: { A: 100, C: 90, D: 15, B12: 2.4 },
                    minerals: { iron: 18, calcium: 1000, zinc: 11 },
                    omega3: 1.6,
                    antioxidants: 'HIGH',
                },
                ingredients: [
                    { name: 'Quinoa', category: 'WHOLE_GRAIN' },
                    { name: 'Spinach', category: 'LEAFY_GREEN' },
                    { name: 'Salmon', category: 'LEAN_PROTEIN' },
                    { name: 'Avocado', category: 'HEALTHY_FAT' },
                ],
            };
            const poorMeal = {
                id: 'meal_006',
                name: 'Nutritionally Poor Meal',
                nutritionalInfo: {
                    calories: 600,
                    protein: 8,
                    fat: 30,
                    carbohydrates: 80,
                    fiber: 2,
                    sugar: 25,
                    sodium: 1500,
                    transFat: 2,
                    saturatedFat: 15,
                },
                ingredients: [
                    { name: 'Refined Flour', category: 'REFINED_GRAIN' },
                    { name: 'Fried Oil', category: 'SATURATED_FAT' },
                    { name: 'Sugar', category: 'ADDED_SUGAR' },
                ],
            };
            const excellentScore = await service.calculateNutritionScore(excellentMeal);
            const poorScore = await service.calculateNutritionScore(poorMeal);
            expect(excellentScore.overall).toBeGreaterThan(80);
            expect(excellentScore.categories.protein).toBeGreaterThan(8);
            expect(excellentScore.categories.micronutrients).toBeGreaterThan(8);
            expect(poorScore.overall).toBeLessThan(40);
            expect(poorScore.categories.addedSugar).toBeLessThan(3);
            expect(poorScore.categories.processedIngredients).toBeLessThan(3);
        });
        it('should provide personalized nutritional recommendations', async () => {
            const studentProfile = {
                id: 'student_002',
                age: 14,
                gender: 'FEMALE',
                height: 155,
                weight: 45,
                activityLevel: 'MODERATE',
                healthGoals: ['WEIGHT_GAIN', 'IMPROVE_CONCENTRATION'],
                deficiencies: ['IRON', 'VITAMIN_D'],
                medicalConditions: ['ANEMIA'],
            };
            const currentMeal = {
                id: 'meal_007',
                name: 'Current Meal Choice',
                nutritionalInfo: {
                    calories: 350,
                    protein: 12,
                    fat: 10,
                    iron: 5,
                    vitaminD: 2,
                },
            };
            const recommendations = await service.getPersonalizedRecommendations(currentMeal, studentProfile);
            expect(recommendations.changes).toContain('INCREASE_IRON_RICH_FOODS');
            expect(recommendations.changes).toContain('ADD_VITAMIN_D_SOURCES');
            expect(recommendations.changes).toContain('INCREASE_CALORIES');
            expect(recommendations.suggestedItems).toHaveLength(3);
            expect(recommendations.priority).toBe('HIGH');
            expect(recommendations.rationale).toContain('anemia');
        });
        it('should suggest menu improvements for nutritional balance', async () => {
            const unbalancedMenu = [
                {
                    id: 'item_015',
                    name: 'Fried Rice',
                    nutritionalInfo: { calories: 400, protein: 6, fat: 18, carbs: 58, fiber: 2 },
                    category: 'MAIN_COURSE',
                },
                {
                    id: 'item_016',
                    name: 'Sugary Drink',
                    nutritionalInfo: { calories: 150, protein: 0, fat: 0, carbs: 38, sugar: 35 },
                    category: 'BEVERAGE',
                },
            ];
            const improvements = await service.suggestMenuImprovements(unbalancedMenu);
            expect(improvements.issues).toContain('LOW_PROTEIN');
            expect(improvements.issues).toContain('HIGH_SUGAR');
            expect(improvements.issues).toContain('LOW_FIBER');
            expect(improvements.suggestions).toHaveLength(3);
            expect(improvements.suggestions.find((s) => s.type === 'ADD_PROTEIN_SOURCE')).toBeDefined();
            expect(improvements.suggestions.find((s) => s.type === 'REPLACE_SUGARY_DRINK')).toBeDefined();
            expect(improvements.suggestions.find((s) => s.type === 'ADD_VEGETABLES')).toBeDefined();
            expect(improvements.priorityScore).toBeGreaterThan(7);
        });
    });
    describe('Student-Specific Safety Assessments', () => {
        it('should provide comprehensive safety assessment for students with multiple conditions', async () => {
            const complexStudentProfile = {
                id: 'student_003',
                allergens: ['DAIRY', 'NUTS'],
                allergySeverity: { DAIRY: 'SEVERE', NUTS: 'MODERATE' },
                dietaryRestrictions: ['VEGETARIAN', 'LOW_SODIUM'],
                medicalConditions: ['DIABETES', 'HYPERTENSION'],
                medications: ['INSULIN'],
                emergencyContacts: [
                    { name: 'Mother', phone: '+91-9876543210', relation: 'parent' },
                    { name: 'Family Doctor', phone: '+91-9876543211', relation: 'doctor' },
                ],
                specialInstructions: 'Requires low glycemic index foods',
            };
            const menuItem = {
                id: 'item_017',
                name: 'Mixed Vegetable Curry',
                ingredients: [
                    { name: 'Mixed Vegetables', allergens: [] },
                    { name: 'Coconut Milk', allergens: [] },
                    { name: 'Whole Wheat', allergens: ['GLUTEN'] },
                ],
                nutritionalInfo: {
                    calories: 280,
                    carbohydrates: 35,
                    glycemicIndex: 45,
                    sodium: 400,
                    sugar: 8,
                },
            };
            const safetyAssessment = await service.comprehensiveStudentSafetyCheck(menuItem, complexStudentProfile);
            expect(safetyAssessment.overallSafety).toBe('SAFE');
            expect(safetyAssessment.allergenSafety.safe).toBe(true);
            expect(safetyAssessment.dietarySafety.compliant).toBe(true);
            expect(safetyAssessment.medicalSafety.diabeticSafe).toBe(true);
            expect(safetyAssessment.medicalSafety.hypertensionSafe).toBe(true);
            expect(safetyAssessment.recommendations).toHaveLength(0);
        });
        it('should identify and flag dangerous combinations for students', async () => {
            const riskyStudentProfile = {
                id: 'student_004',
                allergens: ['SHELLFISH'],
                allergySeverity: { SHELLFISH: 'LIFE_THREATENING' },
                medicalConditions: ['SEVERE_ASTHMA'],
                medications: ['EPINEPHRINE_AUTO_INJECTOR'],
            };
            const riskyMenuItem = {
                id: 'item_018',
                name: 'Mixed Seafood Curry',
                ingredients: [
                    { name: 'Shrimp', allergens: ['SHELLFISH'] },
                    { name: 'Fish', allergens: ['FISH'] },
                ],
                preparationNotes: 'Prepared in shared kitchen with shellfish',
                crossContaminationRisk: 'HIGH',
            };
            const safetyAssessment = await service.comprehensiveStudentSafetyCheck(riskyMenuItem, riskyStudentProfile);
            expect(safetyAssessment.overallSafety).toBe('DANGEROUS');
            expect(safetyAssessment.allergenSafety.safe).toBe(false);
            expect(safetyAssessment.allergenSafety.riskLevel).toBe('LIFE_THREATENING');
            expect(safetyAssessment.emergencyProtocol).toBeDefined();
            expect(safetyAssessment.emergencyProtocol.requiresEpiPen).toBe(true);
            expect(safetyAssessment.emergencyProtocol.immediateActions).toContain('CALL_EMERGENCY');
            expect(safetyAssessment.alternativeItems).toHaveLength(3);
        });
    });
    describe('Performance and Edge Cases', () => {
        it('should handle large menu analysis efficiently', async () => {
            const largeMenu = Array.from({ length: 1000 }, (_, i) => ({
                id: `item_${i}`,
                name: `Menu Item ${i}`,
                nutritionalInfo: {
                    calories: 200 + (i % 300),
                    protein: 10 + (i % 15),
                    fat: 8 + (i % 12),
                    carbohydrates: 30 + (i % 40),
                },
                ingredients: [
                    { name: 'Base Ingredient', allergens: i % 5 === 0 ? ['GLUTEN'] : [] },
                ],
            }));
            const startTime = Date.now();
            const batchAnalysis = await service.batchNutritionalAnalysis(largeMenu);
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(5000);
            expect(batchAnalysis.results).toHaveLength(1000);
            expect(batchAnalysis.summary.averageScore).toBeGreaterThan(0);
            expect(batchAnalysis.summary.complianceRate).toBeGreaterThan(0);
        });
        it('should handle missing nutritional data gracefully', async () => {
            const incompleteMenuItem = {
                id: 'item_019',
                name: 'Incomplete Data Item',
                nutritionalInfo: {
                    calories: 300,
                },
                ingredients: [
                    { name: 'Unknown Ingredient' },
                ],
            };
            const analysis = await service.analyzeNutritionalContent(incompleteMenuItem);
            expect(analysis).toBeDefined();
            expect(analysis.dataCompleteness).toBeLessThan(50);
            expect(analysis.warnings).toContain('INCOMPLETE_NUTRITIONAL_DATA');
            expect(analysis.estimatedValues).toBeDefined();
            expect(analysis.confidence).toBeLessThan(0.7);
        });
        it('should handle invalid input data without crashing', async () => {
            const invalidInputs = [
                null,
                undefined,
                {},
                { id: null },
                { nutritionalInfo: { calories: -100 } },
                { ingredients: null },
                { allergens: 'not-an-array' },
            ];
            for (const invalidInput of invalidInputs) {
                try {
                    const result = await service.analyzeNutritionalContent(invalidInput);
                    expect(result.error).toBeDefined();
                    expect(result.valid).toBe(false);
                }
                catch (error) {
                    expect(error).toBeInstanceOf(Error);
                    expect((error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))).toContain('Invalid input');
                }
            }
        });
        it('should maintain accuracy with concurrent processing', async () => {
            const testItems = Array.from({ length: 100 }, (_, i) => ({
                id: `concurrent_item_${i}`,
                name: `Concurrent Test Item ${i}`,
                nutritionalInfo: {
                    calories: 250,
                    protein: 15,
                    fat: 10,
                    carbohydrates: 35,
                },
            }));
            const concurrentPromises = testItems.map((item) => service.analyzeNutritionalContent(item));
            const results = await Promise.all(concurrentPromises);
            results.forEach((result, index) => {
                expect(result.totalCalories).toBe(250);
                expect(result.totalProtein).toBe(15);
                expect(result.id).toBe(`concurrent_item_${index}`);
            });
            const uniqueIds = new Set(results.map(r => r.id));
            expect(uniqueIds.size).toBe(100);
        });
    });
});
//# sourceMappingURL=nutritional-compliance.service.unit.test.js.map