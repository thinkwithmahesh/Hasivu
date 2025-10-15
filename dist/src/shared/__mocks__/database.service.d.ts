/// <reference types="jest" />
declare const mockNotificationCreate: jest.Mock<any, any, any>;
declare const mockNotificationFindFirst: jest.Mock<any, any, any>;
declare const mockNotificationFindMany: jest.Mock<any, any, any>;
declare const mockNotificationUpdate: jest.Mock<any, any, any>;
declare const mockNotificationCount: jest.Mock<any, any, any>;
declare const mockUserFindUnique: jest.Mock<any, any, any>;
declare const mockUserUpdate: jest.Mock<any, any, any>;
declare const mockPrismaClient: {
    notification: {
        create: jest.Mock<any, any, any>;
        findFirst: jest.Mock<any, any, any>;
        findMany: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
        count: jest.Mock<any, any, any>;
    };
    user: {
        findUnique: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
    };
    $connect: jest.Mock<any, any, any>;
    $disconnect: jest.Mock<any, any, any>;
    $queryRaw: jest.Mock<any, any, any>;
};
declare const mockDatabaseInstance: {
    client: {
        notification: {
            create: jest.Mock<any, any, any>;
            findFirst: jest.Mock<any, any, any>;
            findMany: jest.Mock<any, any, any>;
            update: jest.Mock<any, any, any>;
            count: jest.Mock<any, any, any>;
        };
        user: {
            findUnique: jest.Mock<any, any, any>;
            update: jest.Mock<any, any, any>;
        };
        $connect: jest.Mock<any, any, any>;
        $disconnect: jest.Mock<any, any, any>;
        $queryRaw: jest.Mock<any, any, any>;
    };
    connect: jest.Mock<any, any, any>;
    disconnect: jest.Mock<any, any, any>;
    isHealthy: jest.Mock<any, any, any>;
    getHealth: jest.Mock<any, any, any>;
    executeOperation: jest.Mock<any, any, any>;
};
declare class MockDatabaseService {
    static getInstance(): {
        client: {
            notification: {
                create: jest.Mock<any, any, any>;
                findFirst: jest.Mock<any, any, any>;
                findMany: jest.Mock<any, any, any>;
                update: jest.Mock<any, any, any>;
                count: jest.Mock<any, any, any>;
            };
            user: {
                findUnique: jest.Mock<any, any, any>;
                update: jest.Mock<any, any, any>;
            };
            $connect: jest.Mock<any, any, any>;
            $disconnect: jest.Mock<any, any, any>;
            $queryRaw: jest.Mock<any, any, any>;
        };
        connect: jest.Mock<any, any, any>;
        disconnect: jest.Mock<any, any, any>;
        isHealthy: jest.Mock<any, any, any>;
        getHealth: jest.Mock<any, any, any>;
        executeOperation: jest.Mock<any, any, any>;
    };
    static get client(): {
        notification: {
            create: jest.Mock<any, any, any>;
            findFirst: jest.Mock<any, any, any>;
            findMany: jest.Mock<any, any, any>;
            update: jest.Mock<any, any, any>;
            count: jest.Mock<any, any, any>;
        };
        user: {
            findUnique: jest.Mock<any, any, any>;
            update: jest.Mock<any, any, any>;
        };
        $connect: jest.Mock<any, any, any>;
        $disconnect: jest.Mock<any, any, any>;
        $queryRaw: jest.Mock<any, any, any>;
    };
}
export declare const DatabaseService: typeof MockDatabaseService;
export { mockNotificationCreate, mockNotificationFindFirst, mockNotificationFindMany, mockNotificationUpdate, mockNotificationCount, mockUserFindUnique, mockUserUpdate, mockPrismaClient, mockDatabaseInstance };
//# sourceMappingURL=database.service.d.ts.map