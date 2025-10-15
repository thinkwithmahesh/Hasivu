/// <reference types="jest" />
export declare const mockNotificationCreate: jest.Mock<any, any, any>;
export declare const mockNotificationFindFirst: jest.Mock<any, any, any>;
export declare const mockNotificationFindMany: jest.Mock<any, any, any>;
export declare const mockNotificationUpdate: jest.Mock<any, any, any>;
export declare const mockNotificationCount: jest.Mock<any, any, any>;
export declare const mockUserFindUnique: jest.Mock<any, any, any>;
export declare const mockUserUpdate: jest.Mock<any, any, any>;
export declare const DatabaseService: {
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
    };
    getInstance: () => {
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
        };
    };
};
//# sourceMappingURL=database.service.d.ts.map