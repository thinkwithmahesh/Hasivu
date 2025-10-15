"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nutritional_compliance_service_1 = require("../services/nutritional-compliance.service");
describe('NutritionalComplianceService - Basic Tests', () => {
    let service;
    beforeEach(() => {
        service = new nutritional_compliance_service_1.NutritionalComplianceService();
    });
    describe('Basic Nutritional Analysis', () => {
        it('should analyze a simple menu item correctly', async () => {
            const menuItem = {
                id: 'test-item-1',
                name: 'Simple Rice Bowl',
                ingredients: [
                    {
                        name: 'Rice',
                        quantity: '100g',
                        nutritionalValue: {
                            calories: 130,
                            protein: 3,
                            carbohydrates: 28,
                            fat: 0.3
                        }
                    }
                ]
            };
            const analysis = await service.analyzeNutritionalContent(menuItem);
            expect(analysis).toBeDefined();
            expect(analysis.menuItemId).toBe('test-item-1');
            expect(analysis.totalCalories).toBe(130);
            expect(analysis.macronutrients.protein).toBe(3);
            expect(analysis.macronutrients.carbohydrates).toBe(28);
            expect(analysis.macronutrients.fat).toBe(0.3);
            expect(analysis.nutritionScore).toBeGreaterThan(0);
            expect(analysis.healthRating).toMatch(/^(EXCELLENT|GOOD|AVERAGE|POOR)$/);
            expect(analysis.analysisTimestamp).toBeInstanceOf(Date);
        });
        it('should handle multiple ingredients correctly', async () => {
            const menuItem = {
                id: 'test-item-2',
                name: 'Rice and Dal',
                ingredients: [
                    {
                        name: 'Rice',
                        nutritionalValue: {
                            calories: 130,
                            protein: 3,
                            carbohydrates: 28,
                            fat: 0.3
                        }
                    },
                    {
                        name: 'Dal',
                        nutritionalValue: {
                            calories: 116,
                            protein: 9,
                            carbohydrates: 20,
                            fat: 0.4
                        }
                    }
                ]
            };
            const analysis = await service.analyzeNutritionalContent(menuItem);
            expect(analysis.totalCalories).toBe(246);
            expect(analysis.macronutrients.protein).toBe(12);
            expect(analysis.macronutrients.carbohydrates).toBe(48);
            expect(analysis.macronutrients.fat).toBe(0.7);
        });
        it('should detect allergens in ingredients', async () => {
            const menuItem = {
                id: 'test-item-3',
                name: 'Wheat Bread with Milk',
                ingredients: [
                    {
                        name: 'wheat flour',
                        nutritionalValue: {
                            calories: 100,
                            protein: 4,
                            carbohydrates: 20,
                            fat: 1
                        }
                    },
                    {
                        name: 'milk',
                        nutritionalValue: {
                            calories: 60,
                            protein: 3,
                            carbohydrates: 5,
                            fat: 3
                        }
                    }
                ]
            };
            const analysis = await service.analyzeNutritionalContent(menuItem);
            expect(analysis.allergens.allergens).toContain('WHEAT');
            expect(analysis.allergens.allergens).toContain('MILK');
            expect(analysis.allergens.crossContaminationRisk).toMatch(/^(LOW|MEDIUM|HIGH)$/);
        });
        it('should check dietary compliance correctly', async () => {
            const vegetarianItem = {
                id: 'veg-item',
                name: 'Vegetarian Curry',
                ingredients: [
                    {
                        name: 'vegetables',
                        nutritionalValue: {
                            calories: 80,
                            protein: 2,
                            carbohydrates: 15,
                            fat: 1
                        }
                    },
                    {
                        name: 'paneer',
                        nutritionalValue: {
                            calories: 100,
                            protein: 8,
                            carbohydrates: 3,
                            fat: 8
                        }
                    }
                ]
            };
            const analysis = await service.analyzeNutritionalContent(vegetarianItem);
            expect(analysis.dietaryCompliance.vegetarian).toBe(true);
            expect(analysis.dietaryCompliance.vegan).toBe(false);
        });
        it('should check government compliance', async () => {
            const menuItem = {
                id: 'compliance-test',
                name: 'Balanced Meal',
                ingredients: [
                    {
                        name: 'rice',
                        nutritionalValue: {
                            calories: 200,
                            protein: 5,
                            carbohydrates: 40,
                            fat: 1,
                            sodium: 300,
                            sugar: 2
                        }
                    }
                ]
            };
            const analysis = await service.analyzeNutritionalContent(menuItem);
            expect(analysis.governmentCompliance.indianStandards).toBeDefined();
            expect(analysis.governmentCompliance.whoGuidelines).toBeDefined();
            expect(typeof analysis.governmentCompliance.indianStandards.compliant).toBe('boolean');
            expect(typeof analysis.governmentCompliance.whoGuidelines.compliant).toBe('boolean');
        });
    });
    describe('Batch Processing', () => {
        it('should process multiple menu items in batch', async () => {
            const menuItems = [
                {
                    id: 'batch-item-1',
                    name: 'Rice',
                    ingredients: [{
                            name: 'rice',
                            nutritionalValue: { calories: 130, protein: 3, carbohydrates: 28, fat: 0.3 }
                        }]
                },
                {
                    id: 'batch-item-2',
                    name: 'Dal',
                    ingredients: [{
                            name: 'lentils',
                            nutritionalValue: { calories: 116, protein: 9, carbohydrates: 20, fat: 0.4 }
                        }]
                }
            ];
            const result = await service.batchNutritionalAnalysis(menuItems);
            expect(result.results).toHaveLength(2);
            expect(result.totalProcessed).toBe(2);
            expect(result.errors).toHaveLength(0);
            expect(result.processingTime).toBeGreaterThan(0);
            expect(result.results[0].menuItemId).toBe('batch-item-1');
            expect(result.results[1].menuItemId).toBe('batch-item-2');
        });
    });
    describe('Student Safety Assessment', () => {
        it('should assess student safety correctly', async () => {
            const menuItem = {
                id: 'safety-test',
                name: 'Peanut Butter Toast',
                ingredients: [{
                        name: 'peanut butter',
                        nutritionalValue: { calories: 200, protein: 8, carbohydrates: 6, fat: 16 }
                    }]
            };
            const studentProfile = {
                studentId: 'student-123',
                age: 10,
                allergens: ['PEANUTS'],
                dietaryRestrictions: [],
                healthConditions: [],
                nutritionalNeeds: {
                    dailyCalories: 1800,
                    protein: 60,
                    carbohydrates: 250,
                    fat: 60
                }
            };
            const safety = await service.analyzeStudentSafety(menuItem, studentProfile);
            expect(safety.safe).toBe(false);
            expect(safety.risks).toHaveLength(1);
            expect(safety.risks[0]).toContain('PEANUTS');
            expect(safety.alternatives).toHaveLength(1);
        });
    });
    describe('Personalized Recommendations', () => {
        it('should provide personalized menu recommendations', async () => {
            const studentProfile = {
                studentId: 'student-456',
                age: 12,
                allergens: ['MILK'],
                dietaryRestrictions: ['vegetarian'],
                healthConditions: [],
                nutritionalNeeds: {
                    dailyCalories: 2000,
                    protein: 70,
                    carbohydrates: 300,
                    fat: 70
                }
            };
            const availableMenu = [
                {
                    id: 'safe-item',
                    name: 'Rice and Vegetables',
                    ingredients: [{
                            name: 'rice and vegetables',
                            nutritionalValue: { calories: 150, protein: 4, carbohydrates: 30, fat: 1 }
                        }]
                },
                {
                    id: 'unsafe-item',
                    name: 'Milk-based Curry',
                    ingredients: [{
                            name: 'milk curry',
                            nutritionalValue: { calories: 180, protein: 6, carbohydrates: 20, fat: 8 }
                        }]
                }
            ];
            const recommendations = await service.getPersonalizedRecommendations(studentProfile, availableMenu);
            expect(recommendations.recommended).toContain('safe-item');
            expect(recommendations.avoid).toContain('unsafe-item');
            expect(Array.isArray(recommendations.recommended)).toBe(true);
            expect(Array.isArray(recommendations.avoid)).toBe(true);
        });
    });
    describe('Edge Cases', () => {
        it('should handle missing nutritional data gracefully', async () => {
            const menuItem = {
                id: 'incomplete-item',
                name: 'Incomplete Item',
                ingredients: [{
                        name: 'unknown ingredient',
                        nutritionalValue: {
                            calories: 100,
                            protein: 5,
                            carbohydrates: 15,
                            fat: 2
                        }
                    }]
            };
            const analysis = await service.analyzeNutritionalContent(menuItem);
            expect(analysis).toBeDefined();
            expect(analysis.totalCalories).toBe(100);
            expect(analysis.nutritionScore).toBeGreaterThan(0);
        });
        it('should handle empty ingredients array', async () => {
            const menuItem = {
                id: 'empty-item',
                name: 'Empty Item',
                ingredients: []
            };
            const analysis = await service.analyzeNutritionalContent(menuItem);
            expect(analysis.totalCalories).toBe(0);
            expect(analysis.macronutrients.protein).toBe(0);
            expect(analysis.allergens.allergens).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=nutritional-compliance.simple.test.js.map