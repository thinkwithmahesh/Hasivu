export interface DatabaseTestUtils {
    setupTestDatabase: () => Promise<void>;
    teardownTestDatabase: () => Promise<void>;
    clearTables: (tables: string[]) => Promise<void>;
    seedTestData: (data: any) => Promise<void>;
    getTestConnection: () => any;
}
export declare function createDatabaseTestUtils(): DatabaseTestUtils;
export declare function cleanupDatabase(): Promise<void>;
//# sourceMappingURL=database-utils.d.ts.map