"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._nutritionService = exports.nutritionService = exports.NutritionService = void 0;
const logger_1 = require("../utils/logger");
class NutritionService {
    constructor() {
        logger_1.logger.info('NutritionService initialized (stub)');
    }
    async getNutritionInfo(itemId) {
        return {
            itemId,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            timestamp: new Date(),
        };
    }
    async calculateMealNutrition(items) {
        return {
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
            items: items?.length || 0,
        };
    }
    async getDietaryRestrictions(_userId) {
        return [];
    }
    async validateDietaryCompliance(_itemId, _userId) {
        return true;
    }
}
exports.NutritionService = NutritionService;
const nutritionServiceInstance = new NutritionService();
exports.nutritionService = nutritionServiceInstance;
exports._nutritionService = nutritionServiceInstance;
exports.default = nutritionServiceInstance;
//# sourceMappingURL=nutrition.service.js.map