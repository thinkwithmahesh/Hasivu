export interface TestDataFactory {
    createUser: (overrides?: any) => any;
    createSchool: (overrides?: any) => any;
    createMenuItem: (overrides?: any) => any;
    createOrder: (overrides?: any) => any;
    createBatch: (count: number, factory: (index: number) => any) => any[];
}
export declare function createTestDataFactory(): TestDataFactory;
export declare function generateTestUsers(count?: number): any[];
export declare function generateTestMenuItems(count?: number): any[];
export declare function generateTestOrders(count?: number): any[];
export declare function createTestData(): {
    users: any[];
    menuItems: any[];
    orders: any[];
};
export declare function cleanupTestData(): void;
//# sourceMappingURL=test-data-factory.d.ts.map