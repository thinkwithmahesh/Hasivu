/**
 * NotificationService Final Test - Complete Isolation
 * Epic 6: Notifications - Test Coverage Implementation
 * Archon Task: 34c2b828-473a-48f9-ae13-6432b1d95d73
 */

// Set test environment immediately - before any imports
process.env.NODE_ENV = 'test';
process.env.SKIP_DATABASE_TESTS = 'true';
process.env.SKIP_REDIS_TESTS = 'true';

// Import Jest directly to ensure it's available
import { jest, describe, test, beforeEach, beforeAll, expect } from '@jest/globals';

// Mock modules with complete implementation before any imports
const mockNotificationCreate = jest.fn<() => Promise<any>>();
const mockNotificationUpdate = jest.fn<() => Promise<any>>();
const mockUserFindUnique = jest.fn<() => Promise<any>>();

const mockExecuteOperation = jest.fn<(operation: Function) => Promise<any>>();
const mockGetInstance = jest.fn<() => any>(() => ({
  executeOperation: mockExecuteOperation,
  connect: jest.fn<() => Promise<void>>(),
  disconnect: jest.fn<() => Promise<void>>(),
  isHealthy: jest.fn<() => Promise<boolean>>().mockResolvedValue(true)
}));

// Mock the DatabaseService using the alias
jest.unstable_mockModule('@shared/database.service', () => ({
  DatabaseService: {
    getInstance: mockGetInstance
  }
}));

const mockCacheGet = jest.fn<(key: string) => Promise<any>>();
const mockCacheSetex = jest.fn<() => Promise<void>>();
const mockCacheDel = jest.fn<() => Promise<void>>();

jest.unstable_mockModule('@/utils/cache', () => ({
  cache: {
    get: mockCacheGet,
    set: jest.fn<() => Promise<void>>(),
    setex: mockCacheSetex,
    del: mockCacheDel,
    exists: jest.fn<() => Promise<boolean>>(),
    clear: jest.fn<() => Promise<void>>(),
    size: jest.fn<() => Promise<number>>()
  }
}));

const mockLoggerInfo = jest.fn<() => void>();
const mockLoggerError = jest.fn<() => void>();

jest.unstable_mockModule('@/utils/logger', () => ({
  logger: {
    info: mockLoggerInfo,
    error: mockLoggerError,
    warn: jest.fn<() => void>(),
    debug: jest.fn<() => void>()
  }
}));

jest.unstable_mockModule('@services/redis.service', () => ({
  RedisService: {
    get: jest.fn<() => Promise<any>>(),
    set: jest.fn<() => Promise<void>>(),
    setex: jest.fn<() => Promise<void>>(),
    del: jest.fn<() => Promise<void>>()
  }
}));

// Import using dynamic import pattern for ESM compatibility
let NotificationService: any;
beforeAll(async () => {
  const notificationModule = await import('../../../src/services/notification.service');
  NotificationService = notificationModule.NotificationService;
});

describe('NotificationService - Final Isolated Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock behaviors
    mockCacheGet.mockResolvedValue(null);
    mockCacheSetex.mockResolvedValue(undefined);
    mockUserFindUnique.mockResolvedValue({
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      notificationPreferences: null
    });

    // Setup executeOperation to handle database operations
    mockExecuteOperation.mockImplementation(async (operation: Function) => {
      const mockClient = {
        notification: {
          create: mockNotificationCreate,
          update: mockNotificationUpdate,
          findFirst: jest.fn(),
          findMany: jest.fn(),
          count: jest.fn()
        },
        user: {
          findUnique: mockUserFindUnique,
          update: jest.fn()
        }
      };
      return operation(mockClient);
    });
  });

  test('should successfully mock database operations', async () => {
    // Verify mocks are working
    expect(mockExecuteOperation).toBeDefined();
    expect(typeof mockExecuteOperation).toBe('function');

    // Test executeOperation mock
    const result = await mockExecuteOperation(
      async (client: any) => client.user.findUnique({ where: { id: 'test' } })
    );

    expect(result).toEqual({
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      notificationPreferences: null
    });

    expect(mockExecuteOperation).toHaveBeenCalledTimes(1);
    expect(mockUserFindUnique).toHaveBeenCalledWith({ where: { id: 'test' } });
  });

  test('should send notification with complete mocking', async () => {
    // Setup template cache
    const mockTemplate = {
      id: 'test_notification',
      name: 'Test Notification',
      type: 'transactional',
      channels: ['push'],
      content: {
        push: { body: 'Test message' }
      },
      variables: [],
      isActive: true,
      createdAt: '2025-08-17T05:28:48.997Z',
      updatedAt: '2025-08-17T05:28:48.997Z'
    };

    mockCacheGet.mockImplementation((key: string) => {
      if (key.includes('notification_template:')) {
        return Promise.resolve(JSON.stringify(mockTemplate));
      }
      if (key.includes('notification_preferences:')) {
        return Promise.resolve(JSON.stringify({
          channels: { push: true, email: false, sms: false },
          quietHours: { enabled: false },
          frequency: {},
          topics: {}
        }));
      }
      return Promise.resolve(null);
    });

    mockNotificationCreate.mockResolvedValue({
      id: 'notification-123',
      message: 'Test message',
      userId: 'user-123',
      type: 'test_notification',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    mockNotificationUpdate.mockResolvedValue({
      id: 'notification-123',
      status: 'sent',
      sentAt: new Date()
    });

    const request = {
      templateId: 'test_notification',
      recipientId: 'user-123',
      recipientType: 'parent' as const
    };

    let result;
    try {
      result = await NotificationService.sendNotification(request);
      console.log('Notification result:', result);
    } catch (error) {
      console.log('Direct error caught:', error);
      result = { success: false, error: { code: 'DIRECT_ERROR', message: (error as Error).message } };
    }

    // Verify the result
    expect(result).toEqual(expect.objectContaining({
      success: true
    }));

    // Verify mocks were called
    expect(mockExecuteOperation).toHaveBeenCalled();
    expect(mockNotificationCreate).toHaveBeenCalled();
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      'Notification sent successfully',
      expect.any(Object)
    );
  });

  test('should handle notification errors properly', async () => {
    // Setup template that will cause an error
    mockCacheGet.mockImplementation((key: string) => {
      if (key.includes('notification_template:')) {
        return Promise.resolve(JSON.stringify({
          id: 'test_template',
          isActive: true,
          channels: ['push'],
          content: { push: { body: 'Test' } }
        }));
      }
      return Promise.resolve(null);
    });

    // Mock database operation to throw error
    mockExecuteOperation.mockRejectedValue(new Error('Mock database error'));

    const request = {
      templateId: 'test_template',
      recipientId: 'user-123',
      recipientType: 'parent' as const
    };

    const result = await NotificationService.sendNotification(request);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOTIFICATION_SEND_FAILED');
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to send notification',
      expect.any(Error),
      expect.any(Object)
    );
  });
});