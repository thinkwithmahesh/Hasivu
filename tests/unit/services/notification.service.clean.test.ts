/**
 * NotificationService Clean Test - ESM Compatible
 * Epic 6: Notifications - Test Coverage Implementation
 * Archon Task: 34c2b828-473a-48f9-ae13-6432b1d95d73
 */

// Set test environment immediately
process.env.NODE_ENV = 'test';
process.env.SKIP_DATABASE_TESTS = 'true';
process.env.SKIP_REDIS_TESTS = 'true';

// Mock DatabaseService completely before importing
jest.mock('@shared/database.service', () => ({
  DatabaseService: {
    getInstance: jest.fn(() => ({
      executeOperation: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      isHealthy: jest.fn().mockResolvedValue(true)
    }))
  }
}));

// Use manual mocks
jest.mock('@services/redis.service');
jest.mock('@/utils/logger');
jest.mock('@/utils/cache');

import { 
  NotificationService,
  NotificationRequest
} from '../../../src/services/notification.service';
import { DatabaseService } from '@shared/database.service';
import { logger } from '@/utils/logger';
import { cache } from '@/utils/cache';

// Get references to the mocked functions  
const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;
const mockLogger = logger as jest.Mocked<typeof logger>;
const mockCache = cache as jest.Mocked<typeof cache>;

describe('NotificationService - Clean ESM Test', () => {
  // Get the actual mock instance
  let mockDatabaseInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mock instance that getInstance returns
    mockDatabaseInstance = mockDatabaseService.getInstance();
    
    // Setup basic cache mocks
    mockCache.get.mockResolvedValue(null);
    mockCache.setex.mockResolvedValue(undefined);
    
    // Setup basic database operation mocks
    mockDatabaseInstance.executeOperation.mockImplementation(async (operation: Function) => {
      // Create mock client for the operation
      const mockClient = {
        notification: {
          create: jest.fn(),
          findFirst: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
          count: jest.fn()
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'user-123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            notificationPreferences: null
          }),
          update: jest.fn()
        }
      };
      
      return operation(mockClient);
    });
  });

  test('should verify mock setup is working correctly', async () => {
    // Verify that DatabaseService.getInstance returns our mock
    const dbInstance = DatabaseService.getInstance();
    expect(dbInstance).toBeDefined();
    expect(dbInstance.executeOperation).toBeDefined();
    expect(typeof dbInstance.executeOperation).toBe('function');
    
    // Test that executeOperation works
    const result = await dbInstance.executeOperation(
      async (client: any) => client.user.findUnique({ where: { id: 'test' } }),
      'testOperation'
    );
    
    expect(result).toEqual({
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe', 
      email: 'john.doe@example.com',
      notificationPreferences: null
    });
    
    expect(mockDatabaseInstance.executeOperation).toHaveBeenCalled();
  });

  test('should send notification with mocked database', async () => {
    // Setup template cache mock
    const mockTemplate = {
      id: 'order_confirmation',
      name: 'Order Confirmation',
      type: 'transactional',
      channels: ['push', 'email'],
      content: {
        push: { body: 'Order {{orderId}} confirmed!' },
        email: { subject: 'Order Confirmation', body: 'Your order is confirmed.' }
      },
      variables: ['orderId'],
      isActive: true,
      createdAt: '2025-08-17T05:28:48.997Z',
      updatedAt: '2025-08-17T05:28:48.997Z'
    };

    mockCache.get.mockImplementation((key: string) => {
      if (key.includes('notification_template:')) {
        return Promise.resolve(JSON.stringify(mockTemplate));
      }
      if (key.includes('notification_preferences:')) {
        return Promise.resolve(JSON.stringify({
          channels: {
            push: true,
            email: true,
            sms: false,
            whatsapp: false,
            in_app: true,
            socket: false
          },
          quietHours: { enabled: false },
          frequency: {},
          topics: {}
        }));
      }
      return Promise.resolve(null);
    });

    // Mock the database operation to return success
    mockDatabaseInstance.executeOperation.mockImplementation(async (operation: Function) => {
      const mockClient = {
        notification: {
          create: jest.fn().mockResolvedValue({
            id: 'notification-123',
            message: 'Order confirmed!',
            userId: 'user-123',
            type: 'order_confirmation',
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
          }),
          update: jest.fn().mockResolvedValue({
            id: 'notification-123',
            status: 'sent',
            sentAt: new Date()
          })
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'user-123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            notificationPreferences: null
          })
        }
      };
      
      return operation(mockClient);
    });

    const request: NotificationRequest = {
      templateId: 'order_confirmation',
      recipientId: 'user-123',
      recipientType: 'parent',
      channels: ['push', 'email'],
      variables: { orderId: 'ORD-123' },
      priority: 'normal'
    };

    const result = await NotificationService.sendNotification(request);

    expect(result).toEqual(expect.objectContaining({
      success: true
    }));
    expect(mockDatabaseInstance.executeOperation).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('Notification sent successfully', expect.any(Object));
  });

  test('should handle errors gracefully', async () => {
    // Mock template lookup
    mockCache.get.mockImplementation((key: string) => {
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
    mockDatabaseInstance.executeOperation.mockRejectedValue(new Error('Mock database error'));

    const request: NotificationRequest = {
      templateId: 'test_template',
      recipientId: 'user-123',
      recipientType: 'parent'
    };

    const result = await NotificationService.sendNotification(request);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOTIFICATION_SEND_FAILED');
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to send notification', expect.any(Error), expect.any(Object));
  });
});