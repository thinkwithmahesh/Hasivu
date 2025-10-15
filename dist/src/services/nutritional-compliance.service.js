"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NutritionalComplianceService = void 0;
class NutritionalComplianceService {
    indianNutritionalStandards;
    whoGuidelines;
    allergenDatabase;
    constructor() {
        this.indianNutritionalStandards = new Map([
            ['maxSodium', 2000],
            ['maxSugar', 50],
            ['minProtein', 0.8],
            ['maxSaturatedFat', 20],
        ]);
        this.whoGuidelines = new Map([
            ['maxSodium', 2000],
            ['maxFreeSugar', 50],
            ['minFruit', 400],
            ['maxProcessedMeat', 50],
        ]);
        this.allergenDatabase = new Map([
            ['wheat', ['gluten', 'wheat', 'flour', 'wheat protein']],
            ['milk', ['lactose', 'casein', 'whey', 'milk', 'dairy']],
            ['eggs', ['albumin', 'lecithin', 'egg']],
            ['peanuts', ['arachis oil', 'groundnut', 'peanut']],
            ['tree nuts', ['almond', 'cashew', 'walnut', 'pistachio']],
            ['soy', ['soybean', 'lecithin', 'tofu']],
            ['fish', ['anchovy', 'salmon', 'tuna']],
            ['shellfish', ['shrimp', 'crab', 'lobster']],
        ]);
    }
    async analyzeNutritionalContent(menuItem) {
        const totalNutrition = this.calculateTotalNutrition(menuItem);
        const allergenInfo = await this.analyzeAllergens(menuItem);
        const dietaryCompliance = this.checkDietaryCompliance(menuItem);
        const governmentCompliance = await this.checkGovernmentCompliance(totalNutrition);
        const nutritionScore = this.calculateNutritionScore(totalNutrition);
        const { recommendations, warnings } = this.generateRecommendationsAndWarnings(totalNutrition, allergenInfo, governmentCompliance);
        return {
            menuItemId: menuItem.id,
            totalCalories: totalNutrition.calories,
            macronutrients: {
                protein: totalNutrition.protein,
                carbohydrates: totalNutrition.carbohydrates,
                fat: totalNutrition.fat,
            },
            micronutrients: {
                vitamins: totalNutrition.vitamins || {},
                minerals: totalNutrition.minerals || {},
            },
            allergens: allergenInfo,
            dietaryCompliance,
            governmentCompliance,
            nutritionScore,
            healthRating: this.getHealthRating(nutritionScore),
            recommendations,
            warnings,
            analysisTimestamp: new Date(),
        };
    }
    async batchNutritionalAnalysis(menuItems) {
        const startTime = Date.now();
        const results = [];
        const errors = [];
        for (const item of menuItems) {
            try {
                const analysis = await this.analyzeNutritionalContent(item);
                results.push(analysis);
            }
            catch (error) {
                errors.push({
                    menuItemId: item.id,
                    error: error instanceof Error ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : 'Unknown error',
                });
            }
        }
        const endTime = Date.now();
        const processingTime = Math.max(1, endTime - startTime);
        return {
            results,
            totalProcessed: menuItems.length,
            errors,
            processingTime,
        };
    }
    async analyzeStudentSafety(menuItem, studentProfile) {
        const analysis = await this.analyzeNutritionalContent(menuItem);
        const risks = [];
        const alternatives = [];
        const modifications = [];
        for (const allergen of analysis.allergens.allergens) {
            if (studentProfile.allergens.includes(allergen)) {
                risks.push(`Contains ${allergen} - student is allergic`);
                alternatives.push(`Suggest ${allergen}-free alternative`);
            }
        }
        if (studentProfile.dietaryRestrictions.includes('vegetarian') && !analysis.dietaryCompliance.vegetarian) {
            risks.push('Contains non-vegetarian ingredients');
            modifications.push('Remove non-vegetarian ingredients');
        }
        if (studentProfile.dietaryRestrictions.includes('vegan') && !analysis.dietaryCompliance.vegan) {
            risks.push('Contains non-vegan ingredients');
            modifications.push('Replace with vegan alternatives');
        }
        for (const condition of studentProfile.healthConditions) {
            if (condition === 'diabetes' && analysis.totalCalories > studentProfile.nutritionalNeeds.dailyCalories * 0.4) {
                risks.push('High caloric content may not be suitable for diabetic students');
                modifications.push('Reduce portion size or suggest lower-calorie alternative');
            }
        }
        return {
            safe: risks.length === 0,
            risks,
            alternatives,
            modifications,
        };
    }
    async getPersonalizedRecommendations(studentProfile, availableMenu) {
        const recommended = [];
        const avoid = [];
        const modifications = new Map();
        for (const item of availableMenu) {
            const safety = await this.analyzeStudentSafety(item, studentProfile);
            if (safety.safe) {
                recommended.push(item.id);
            }
            else {
                avoid.push(item.id);
                if (safety.modifications.length > 0) {
                    modifications.set(item.id, safety.modifications);
                }
            }
        }
        return { recommended, avoid, modifications };
    }
    async detectAllergens(menuItem) {
        return this.analyzeAllergens(menuItem);
    }
    async validateDietaryRestrictions(menuItem, restrictions) {
        const compliance = this.checkDietaryCompliance(menuItem);
        const violations = [];
        const recommendations = [];
        for (const restriction of restrictions) {
            const restrictionKey = restriction.toLowerCase();
            if (restrictionKey === 'vegetarian' && !compliance.vegetarian) {
                violations.push('Contains non-vegetarian ingredients');
                recommendations.push('Replace with vegetarian alternatives');
            }
            if (restrictionKey === 'vegan' && !compliance.vegan) {
                violations.push('Contains non-vegan ingredients');
                recommendations.push('Replace with plant-based alternatives');
            }
            if (restrictionKey === 'jain' && !compliance.jain) {
                violations.push('Contains ingredients not suitable for Jain diet');
                recommendations.push('Use Jain-approved ingredients only');
            }
            if (restrictionKey === 'gluten-free' && !compliance.glutenFree) {
                violations.push('Contains gluten');
                recommendations.push('Use gluten-free alternatives');
            }
            if (restrictionKey === 'dairy-free' && !compliance.dairyFree) {
                violations.push('Contains dairy products');
                recommendations.push('Use dairy-free alternatives');
            }
            if (restrictionKey === 'nut-free' && !compliance.nutFree) {
                violations.push('Contains nuts');
                recommendations.push('Use nut-free alternatives');
            }
        }
        return {
            compliant: violations.length === 0,
            violations,
            recommendations,
        };
    }
    async assessAllergenSafety(menuItem, studentProfile) {
        const allergenInfo = await this.analyzeAllergens(menuItem);
        const warnings = [];
        const recommendations = [];
        for (const allergen of allergenInfo.allergens) {
            if (studentProfile.allergens.includes(allergen.toLowerCase())) {
                warnings.push(`Contains ${allergen} - student is allergic`);
                recommendations.push(`Avoid this item or use ${allergen}-free alternative`);
            }
        }
        if (allergenInfo.crossContaminationRisk === 'HIGH') {
            warnings.push('High risk of cross-contamination');
            recommendations.push('Prepare in dedicated allergen-free area');
        }
        return {
            safe: warnings.length === 0,
            warnings,
            recommendations,
        };
    }
    async validateGovernmentCompliance(menuItem, standard) {
        const nutrition = this.calculateTotalNutrition(menuItem);
        const compliance = await this.checkGovernmentCompliance(nutrition);
        if (standard.toUpperCase() === 'INDIAN_GOVERNMENT') {
            return {
                compliant: compliance.indianStandards.compliant,
                violations: compliance.indianStandards.violations,
                recommendations: compliance.indianStandards.recommendations,
            };
        }
        else if (standard.toUpperCase() === 'WHO_RECOMMENDATIONS') {
            return {
                compliant: compliance.whoGuidelines.compliant,
                violations: compliance.whoGuidelines.violations,
                recommendations: compliance.whoGuidelines.recommendations,
            };
        }
        return {
            compliant: false,
            violations: ['Unknown government standard'],
            recommendations: ['Specify valid government standard'],
        };
    }
    async suggestMenuImprovements(menu) {
        const issues = [];
        const suggestions = [];
        let priority = 'LOW';
        for (const item of menu) {
            const analysis = await this.analyzeNutritionalContent(item);
            if (analysis.nutritionScore < 50) {
                issues.push(`LOW_NUTRITION_SCORE: ${item.name} has poor nutritional value`);
                suggestions.push(`Improve nutritional content of ${item.name} by adding more vegetables or proteins`);
                priority = 'HIGH';
            }
            if (analysis.totalCalories > 800) {
                issues.push(`HIGH_CALORIES: ${item.name} is too high in calories`);
                suggestions.push(`Reduce portion size or use lower-calorie ingredients for ${item.name}`);
                if (priority !== 'HIGH')
                    priority = 'MEDIUM';
            }
            if (analysis.macronutrients.protein < 5) {
                issues.push(`LOW_PROTEIN: ${item.name} lacks sufficient protein`);
                suggestions.push(`Add protein-rich ingredients like lentils, paneer, or eggs to ${item.name}`);
                if (priority !== 'HIGH')
                    priority = 'MEDIUM';
            }
            if ((analysis.micronutrients.minerals?.iron || 0) < 2) {
                issues.push(`LOW_IRON: ${item.name} may not provide adequate iron`);
                suggestions.push(`Add iron-rich ingredients like spinach or fortified cereals to ${item.name}`);
            }
            if (analysis.allergens.allergens.length > 2) {
                issues.push(`MULTIPLE_ALLERGENS: ${item.name} contains multiple allergens`);
                suggestions.push(`Consider allergen-free alternatives for ${item.name}`);
            }
        }
        const totalItems = menu.length;
        const vegetarianCount = menu.filter(item => this.checkDietaryCompliance(item).vegetarian).length;
        if (vegetarianCount / totalItems < 0.3) {
            issues.push('INSUFFICIENT_VEGETARIAN_OPTIONS');
            suggestions.push('Add more vegetarian menu items for dietary diversity');
        }
        return { issues, suggestions, priority };
    }
    async comprehensiveStudentSafetyCheck(menuItem, studentProfile) {
        const allergenSafety = await this.assessAllergenSafety(menuItem, studentProfile);
        const dietaryCompliance = await this.validateDietaryRestrictions(menuItem, studentProfile.dietaryRestrictions);
        const analysis = await this.analyzeNutritionalContent(menuItem);
        const dietarySafety = {
            safe: dietaryCompliance.compliant,
            risks: dietaryCompliance.violations,
        };
        const nutritionalSafety = {
            safe: true,
            concerns: [],
        };
        if (analysis.totalCalories > studentProfile.nutritionalNeeds.dailyCalories * 0.5) {
            nutritionalSafety.safe = false;
            nutritionalSafety.concerns.push('Excessive calories for student\'s needs');
        }
        if (analysis.macronutrients.protein < studentProfile.nutritionalNeeds.protein * 0.3) {
            nutritionalSafety.concerns.push('Insufficient protein content');
        }
        let overallSafety = 'SAFE';
        if (!allergenSafety.safe || !dietarySafety.safe) {
            overallSafety = 'DANGEROUS';
        }
        else if (nutritionalSafety.concerns.length > 0) {
            overallSafety = 'CAUTION';
        }
        const recommendations = [
            ...allergenSafety.recommendations,
            ...dietaryCompliance.recommendations,
        ];
        if (nutritionalSafety.concerns.length > 0) {
            recommendations.push('Consult with nutritionist for portion adjustments');
        }
        return {
            overallSafety,
            allergenSafety: {
                safe: allergenSafety.safe,
                risks: allergenSafety.warnings,
            },
            dietarySafety,
            nutritionalSafety,
            recommendations,
        };
    }
    calculateTotalNutrition(menuItem) {
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalFiber = 0;
        let totalSodium = 0;
        let totalSugar = 0;
        const vitamins = {};
        const minerals = {};
        for (const ingredient of menuItem.ingredients) {
            totalCalories += ingredient.nutritionalValue.calories || 0;
            totalProtein += ingredient.nutritionalValue.protein || 0;
            totalCarbs += ingredient.nutritionalValue.carbohydrates || 0;
            totalFat += ingredient.nutritionalValue.fat || 0;
            totalFiber += ingredient.nutritionalValue.fiber || 0;
            totalSodium += ingredient.nutritionalValue.sodium || 0;
            totalSugar += ingredient.nutritionalValue.sugar || 0;
            if (ingredient.nutritionalValue.vitamins) {
                for (const [vitamin, amount] of Object.entries(ingredient.nutritionalValue.vitamins)) {
                    vitamins[vitamin] = (vitamins[vitamin] || 0) + amount;
                }
            }
            if (ingredient.nutritionalValue.minerals) {
                for (const [mineral, amount] of Object.entries(ingredient.nutritionalValue.minerals)) {
                    minerals[mineral] = (minerals[mineral] || 0) + amount;
                }
            }
        }
        return {
            calories: totalCalories,
            protein: totalProtein,
            carbohydrates: totalCarbs,
            fat: totalFat,
            fiber: totalFiber,
            sodium: totalSodium,
            sugar: totalSugar,
            vitamins,
            minerals,
        };
    }
    async analyzeAllergens(menuItem) {
        const allergens = new Set();
        let riskLevel = 'LOW';
        const safetyNotes = [];
        for (const ingredient of menuItem.ingredients) {
            const ingredientName = ingredient.name.toLowerCase();
            for (const [allergen, triggers] of this.allergenDatabase.entries()) {
                if (triggers.some(trigger => ingredientName.includes(trigger))) {
                    allergens.add(allergen.toUpperCase());
                }
            }
        }
        if (allergens.size > 3) {
            riskLevel = 'HIGH';
            safetyNotes.push('Multiple allergens present - high risk for sensitive individuals');
        }
        else if (allergens.size > 1) {
            riskLevel = 'MEDIUM';
            safetyNotes.push('Multiple allergens present - moderate risk');
        }
        else if (allergens.size === 1) {
            safetyNotes.push('Single allergen present - low risk with proper precautions');
        }
        return {
            allergens: Array.from(allergens),
            crossContaminationRisk: riskLevel,
            safetyNotes,
        };
    }
    checkDietaryCompliance(menuItem) {
        const nonVegIngredients = ['chicken', 'mutton', 'fish', 'egg', 'meat'];
        const nonVeganIngredients = [...nonVegIngredients, 'milk', 'cheese', 'butter', 'ghee', 'honey', 'paneer'];
        const glutenIngredients = ['wheat', 'barley', 'rye', 'oats'];
        const dairyIngredients = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'paneer'];
        const nutIngredients = ['peanut', 'almond', 'cashew', 'walnut'];
        const ingredients = menuItem.ingredients.map(i => i.name.toLowerCase());
        return {
            vegetarian: !ingredients.some(ing => nonVegIngredients.some(nv => ing.includes(nv))),
            vegan: !ingredients.some(ing => nonVeganIngredients.some(nv => ing.includes(nv))),
            jain: !ingredients.some(ing => [...nonVeganIngredients, 'onion', 'garlic', 'potato', 'carrot', 'radish'].some(j => ing.includes(j))),
            glutenFree: !ingredients.some(ing => glutenIngredients.some(g => ing.includes(g))),
            dairyFree: !ingredients.some(ing => dairyIngredients.some(d => ing.includes(d))),
            nutFree: !ingredients.some(ing => nutIngredients.some(n => ing.includes(n))),
        };
    }
    async checkGovernmentCompliance(nutrition) {
        const indianViolations = [];
        const indianRecommendations = [];
        const whoViolations = [];
        const whoRecommendations = [];
        if ((nutrition.sodium || 0) > (this.indianNutritionalStandards.get('maxSodium') / 3)) {
            indianViolations.push('Sodium content exceeds recommended daily limit per meal');
            indianRecommendations.push('Reduce salt and processed ingredients');
        }
        if ((nutrition.sugar || 0) > (this.indianNutritionalStandards.get('maxSugar') / 3)) {
            indianViolations.push('Sugar content is too high per meal');
            indianRecommendations.push('Reduce added sugars and sweet components');
        }
        if ((nutrition.sodium || 0) > (this.whoGuidelines.get('maxSodium') / 3)) {
            whoViolations.push('Sodium exceeds WHO recommended daily intake per meal');
            whoRecommendations.push('Use herbs and spices instead of salt for flavoring');
        }
        return {
            indianStandards: {
                compliant: indianViolations.length === 0,
                violations: indianViolations,
                recommendations: indianRecommendations,
            },
            whoGuidelines: {
                compliant: whoViolations.length === 0,
                violations: whoViolations,
                recommendations: whoRecommendations,
            },
        };
    }
    calculateNutritionScore(nutrition) {
        let score = 50;
        if (nutrition.protein >= 20)
            score += 15;
        else if (nutrition.protein >= 10)
            score += 10;
        else if (nutrition.protein >= 5)
            score += 5;
        if ((nutrition.fiber || 0) >= 5)
            score += 10;
        else if ((nutrition.fiber || 0) >= 3)
            score += 5;
        const vitaminCount = Object.keys(nutrition.vitamins || {}).length;
        const mineralCount = Object.keys(nutrition.minerals || {}).length;
        score += Math.min(vitaminCount * 2, 10);
        score += Math.min(mineralCount * 2, 10);
        if ((nutrition.sodium || 0) > 800)
            score -= 15;
        if ((nutrition.sugar || 0) > 20)
            score -= 10;
        if (nutrition.fat > 30)
            score -= 10;
        return Math.max(0, Math.min(100, score));
    }
    getHealthRating(score) {
        if (score >= 80)
            return 'EXCELLENT';
        if (score >= 65)
            return 'GOOD';
        if (score >= 50)
            return 'AVERAGE';
        return 'POOR';
    }
    generateRecommendationsAndWarnings(nutrition, allergens, compliance) {
        const recommendations = [];
        const warnings = [];
        if (nutrition.protein < 10) {
            recommendations.push('Consider adding protein-rich ingredients like lentils or paneer');
        }
        if ((nutrition.fiber || 0) < 3) {
            recommendations.push('Add more fiber through vegetables and whole grains');
        }
        if (allergens.crossContaminationRisk === 'HIGH') {
            warnings.push('High risk of cross-contamination - use dedicated preparation areas');
        }
        if (allergens.allergens.length > 0) {
            warnings.push(`Contains allergens: ${allergens.allergens.join(', ')}`);
        }
        if (!compliance.indianStandards.compliant) {
            warnings.push('Does not meet Indian nutritional standards');
            recommendations.push(...compliance.indianStandards.recommendations);
        }
        if (!compliance.whoGuidelines.compliant) {
            warnings.push('Does not meet WHO dietary guidelines');
            recommendations.push(...compliance.whoGuidelines.recommendations);
        }
        return { recommendations, warnings };
    }
}
exports.NutritionalComplianceService = NutritionalComplianceService;
//# sourceMappingURL=nutritional-compliance.service.js.map