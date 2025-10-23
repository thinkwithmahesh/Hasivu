export declare class NutritionService {
    constructor();
    getNutritionInfo(itemId: string): Promise<any>;
    calculateMealNutrition(items: any[] | undefined | undefined): Promise<any>;
    getDietaryRestrictions(_userId: string): Promise<any[]>;
    validateDietaryCompliance(_itemId: string, _userId: string): Promise<boolean>;
}
declare const nutritionServiceInstance: NutritionService;
export declare const nutritionService: NutritionService;
export declare const _nutritionService: NutritionService;
export default nutritionServiceInstance;
//# sourceMappingURL=nutrition.service.d.ts.map