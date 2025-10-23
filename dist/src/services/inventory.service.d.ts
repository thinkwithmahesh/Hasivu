export declare class InventoryService {
    constructor();
    getInventory(): Promise<any[]>;
    updateStock(itemId: string, quantity: number): Promise<void>;
    checkLowStock(): Promise<any[]>;
    getCriticalAlerts(_schoolId: string): Promise<any>;
    checkIngredientAvailability(_items: any[] | undefined | undefined): Promise<{
        allAvailable: boolean;
    }>;
    reserveIngredients(orderId: string): Promise<void>;
    getKitchenInventory(_schoolId: string, _options?: any): Promise<any>;
    updateInventory(_data: any): Promise<any>;
    checkAvailability(_items: any[] | undefined | undefined, _schoolId: string, _deliveryDate: string): Promise<any>;
    reserveItems(_items: any[] | undefined | undefined, options: any): Promise<void>;
    confirmReservation(orderId: string): Promise<void>;
    releaseReservation(orderId: string): Promise<void>;
    updateReservation(orderId: string, _items: any[] | undefined | undefined): Promise<void>;
}
declare const inventoryServiceInstance: InventoryService;
export declare const inventoryService: InventoryService;
export declare const _inventoryService: InventoryService;
export default inventoryServiceInstance;
//# sourceMappingURL=inventory.service.d.ts.map