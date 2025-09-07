/**
 * Manual mock for DatabaseService
 * This ensures proper ESM mocking for static getters
 */

export const mockNotificationCreate = jest.fn();
export const mockNotificationFindFirst = jest.fn();
export const mockNotificationFindMany = jest.fn();
export const mockNotificationUpdate = jest.fn();
export const mockNotificationCount = jest.fn();
export const mockUserFindUnique = jest.fn();
export const mockUserUpdate = jest.fn();

const mockClient = {
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
  }
};

export const DatabaseService = {
  client: mockClient,
  getInstance: () => ({ client: mockClient })
};

// Ensure static getter works
Object.defineProperty(DatabaseService, 'client', {
  get: () => mockClient,
  enumerable: true,
  configurable: true
});