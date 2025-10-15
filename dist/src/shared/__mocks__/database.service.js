"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockDatabaseInstance = exports.mockPrismaClient = exports.mockUserUpdate = exports.mockUserFindUnique = exports.mockNotificationCount = exports.mockNotificationUpdate = exports.mockNotificationFindMany = exports.mockNotificationFindFirst = exports.mockNotificationCreate = exports.DatabaseService = void 0;
const mockNotificationCreate = jest.fn();
exports.mockNotificationCreate = mockNotificationCreate;
const mockNotificationFindFirst = jest.fn();
exports.mockNotificationFindFirst = mockNotificationFindFirst;
const mockNotificationFindMany = jest.fn();
exports.mockNotificationFindMany = mockNotificationFindMany;
const mockNotificationUpdate = jest.fn();
exports.mockNotificationUpdate = mockNotificationUpdate;
const mockNotificationCount = jest.fn();
exports.mockNotificationCount = mockNotificationCount;
const mockUserFindUnique = jest.fn();
exports.mockUserFindUnique = mockUserFindUnique;
const mockUserUpdate = jest.fn();
exports.mockUserUpdate = mockUserUpdate;
const mockPrismaClient = {
    notification: {
        create: mockNotificationCreate,
        findFirst: mockNotificationFindFirst,
        findMany: mockNotificationFindMany,
        update: mockNotificationUpdate,
        count: mockNotificationCount
    },
    user: {
        findUnique: mockUserFindUnique,
        update: mockUserUpdate
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn()
};
exports.mockPrismaClient = mockPrismaClient;
const mockDatabaseInstance = {
    client: mockPrismaClient,
    connect: jest.fn(),
    disconnect: jest.fn(),
    isHealthy: jest.fn().mockResolvedValue(true),
    getHealth: jest.fn().mockResolvedValue({
        status: 'healthy',
        latency: 50,
        connections: { active: 1, idle: 0, total: 1, max: 10 },
        performance: { averageQueryTime: 25, slowQueries: 0, totalQueries: 100 },
        lastCheck: new Date(),
        errors: [],
        uptime: 3600000
    }),
    executeOperation: jest.fn()
};
exports.mockDatabaseInstance = mockDatabaseInstance;
class MockDatabaseService {
    static getInstance() {
        return mockDatabaseInstance;
    }
    static get client() {
        return mockPrismaClient;
    }
}
exports.DatabaseService = MockDatabaseService;
Object.defineProperty(MockDatabaseService, 'client', {
    get: () => mockPrismaClient,
    enumerable: true,
    configurable: true
});
//# sourceMappingURL=database.service.js.map