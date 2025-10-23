import express from 'express';
export interface TestApp {
    app: express.Application;
    server: any;
    close: () => Promise<void>;
}
export declare function createTestApp(): TestApp;
export declare function createTestAppWithDatabase(): Promise<TestApp>;
//# sourceMappingURL=test-app-factory.d.ts.map