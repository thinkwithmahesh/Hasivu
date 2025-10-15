export declare class ProductionService {
    constructor();
    scheduleProduction(items: any[] | undefined | undefined): Promise<void>;
    getProductionStatus(): Promise<any>;
    updateProductionStatus(itemId: string, status: string): Promise<void>;
    getTodaySchedule(_schoolId: string): Promise<any>;
    validateResources(_planData: any): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    createPlan(planData: any): Promise<any>;
}
declare const productionServiceInstance: ProductionService;
export declare const productionService: ProductionService;
export declare const _productionService: ProductionService;
export default productionServiceInstance;
//# sourceMappingURL=production.service.d.ts.map