/**
 * DatabaseService Mock for Jest ESM Testing
 * Comprehensive mock that replaces both instance and static methods
 */

// Create mock functions for all Prisma client methods
const mockNotificationCreate = jest.fn();
const mockNotificationFindFirst = jest.fn();
const mockNotificationFindMany = jest.fn();
const mockNotificationUpdate = jest.fn();
const mockNotificationCount = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUserUpdate = jest.fn();

// Mock Prisma client with all required methods
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

// Mock instance with all required methods
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

// Create a proper class mock that matches the original DatabaseService structure
class MockDatabaseService {
  static getInstance() {
    return mockDatabaseInstance;
  }
  
  static get client() {
    return mockPrismaClient;
  }
}

// Export the class as DatabaseService
export const DatabaseService = MockDatabaseService;

// Ensure the static getter is properly defined for ESM compatibility
Object.defineProperty(MockDatabaseService, 'client', {
  get: () => mockPrismaClient,
  enumerable: true,
  configurable: true
});

// Export individual mock functions for direct access in tests
export {
  mockNotificationCreate,
  mockNotificationFindFirst,
  mockNotificationFindMany,
  mockNotificationUpdate,
  mockNotificationCount,
  mockUserFindUnique,
  mockUserUpdate,
  mockPrismaClient,
  mockDatabaseInstance
};