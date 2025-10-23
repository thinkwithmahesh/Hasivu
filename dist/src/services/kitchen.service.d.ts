export declare class KitchenService {
    constructor();
    getOrders(): Promise<any[]>;
    updateOrderStatus(orderId: string, status: string): Promise<void>;
    getKitchenStatus(): Promise<any>;
    getOrderQueue(_schoolId: string, _options?: any): Promise<any>;
    getEquipmentStatus(_schoolId: string): Promise<any>;
    getPerformanceMetrics(_schoolId: string): Promise<any>;
    getOrder(orderId: string): Promise<any>;
    canTransitionStatus(_currentStatus: string, _newStatus: string): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    updateOrderStatusDetailed(_orderId: string, updateData: any): Promise<any>;
    startPreparationTimer(orderId: string): Promise<void>;
    markDispatched(orderId: string, userId: string): Promise<void>;
    getPreparationStatus(_orderId: string): Promise<any>;
    estimatePreparationTime(_items: any[] | undefined | undefined, _schoolId: string): Promise<number>;
}
declare const kitchenServiceInstance: KitchenService;
export declare const kitchenService: KitchenService;
export declare const _kitchenService: KitchenService;
export default kitchenServiceInstance;
//# sourceMappingURL=kitchen.service.d.ts.map