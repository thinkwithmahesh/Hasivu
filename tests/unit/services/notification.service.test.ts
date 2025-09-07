/**
 * NotificationService Unit Tests
 * Comprehensive testing for notification service including multi-channel delivery,
 * preferences management, analytics, and real-time notifications
 * Epic 6: Notifications - Test Coverage Implementation
 * Archon Task: 34c2b828-473a-48f9-ae13-6432b1d95d73
 */

// ESM Manual Mock Setup for DatabaseService
// Jest will automatically use the manual mock from src/shared/__mocks__/database.service.ts
jest.mock('@shared/database.service');

// Import mock functions from the manual mock for direct access
import {
  mockNotificationCreate,
  mockNotificationFindFirst,
  mockNotificationFindMany,
  mockNotificationUpdate,
  mockNotificationCount,
  mockUserFindUnique,
  mockUserUpdate
} from '../../../src/shared/__mocks__/database.service';

// Redis service mocks
const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisSetex = jest.fn();
const mockRedisDel = jest.fn();

// Cache mocks
const mockCacheGet = jest.fn();
const mockCacheSetex = jest.fn();
const mockCacheDel = jest.fn();

// Mock Prisma enums
const NotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  EXPIRED: 'expired'
} as const;

const NotificationPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

jest.mock('@services/redis.service', () => ({
  RedisService: {
    get: mockRedisGet,
    set: mockRedisSet,
    setex: mockRedisSetex,
    del: mockRedisDel
  }
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('@/utils/cache', () => ({
  cache: {
    get: mockCacheGet,
    setex: mockCacheSetex,
    del: mockCacheDel
  }
}));

import { 
  NotificationService,
  NotificationRequest,
  BulkNotificationRequest,
  OrderConfirmationData,
  OrderStatusUpdateData,
  NotificationPreferences,
  NotificationChannel,
  NotificationPriority as NPriority,
  NotificationStatus as NStatus
} from '../../../src/services/notification.service';
import { DatabaseService } from '@shared/database.service';
import { RedisService } from '@services/redis.service';
import { logger } from '@/utils/logger';
import { cache } from '@/utils/cache';

// Access mocked functions directly from imported modules
const MockedDatabaseService = DatabaseService as any;
const MockedRedisService = RedisService as any;
const MockedCache = cache as any;

describe('NotificationService', () => {
  let notificationService: NotificationService;

  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    schoolId: 'school-123',
    role: 'parent',
    status: 'active',
    metadata: '{}',
    cognitoUserId: 'cognito-123',
    deviceTokens: '[]',
    preferences: '{}',
    avatar: null,
    bio: null,
    dateOfBirth: null,
    address: null,
    emergencyContact: null,
    parentalConsent: true,
    termsAcceptedAt: new Date(),
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    notificationPreferences: null
  };

  const mockTemplate = {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    type: 'transactional',
    channels: ['push', 'email', 'whatsapp'] as NotificationChannel[],
    content: {
      push: {
        body: 'Order {{orderId}} confirmed! Total: ₹{{totalAmount}}. Delivery on {{deliveryDate}}.'
      },
      email: {
        subject: 'Order Confirmation - {{orderId}}',
        body: 'Hi {{recipient.firstName}}, your order {{orderId}} has been confirmed. Total amount: ₹{{totalAmount}}. Expected delivery: {{deliveryDate}}.'
      },
      whatsapp: {
        body: 'Hi {{recipient.firstName}}! 🎉 Your order {{orderId}} is confirmed. Total: ₹{{totalAmount}}. Delivery: {{deliveryDate}}'
      },
      sms: { body: '' },
      in_app: { body: '' },
      socket: { body: '' }
    },
    variables: ['orderId', 'totalAmount', 'deliveryDate', 'studentName'],
    isActive: true,
    createdAt: '2025-08-17T05:28:48.997Z',
    updatedAt: '2025-08-17T05:28:48.997Z'
  };

  const mockNotification = {
    id: 'notification-123',
    message: 'Order ORD-123 confirmed! Total: ₹150.00. Delivery on 2024-01-15.',
    userId: 'user-123',
    type: 'order_confirmation',
    status: 'pending',
    data: JSON.stringify({ orderId: 'ORD-123', totalAmount: '150.00' }),
    imageUrl: null,
    body: 'Hi John, your order ORD-123 has been confirmed.',
    deliveredAt: null,
    readAt: null,
    sentAt: null,
    scheduledFor: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    templateId: 'order_confirmation',
    recipientId: 'user-123',
    recipientType: 'parent',
    channels: JSON.stringify(['push', 'email']),
    content: JSON.stringify({
      push: { body: 'Order ORD-123 confirmed! Total: ₹150.00. Delivery on 2024-01-15.' },
      email: { subject: 'Order Confirmation - ORD-123', body: 'Hi John, your order ORD-123 has been confirmed.' }
    }),
    variables: JSON.stringify({ orderId: 'ORD-123', totalAmount: '150.00' }),
    priority: 'normal',
    scheduledAt: new Date(),
    metadata: JSON.stringify({}),
    deliveryStatus: JSON.stringify({
      push: { status: 'pending', sentAt: null, deliveredAt: null, readAt: null, error: null },
      email: { status: 'pending', sentAt: null, deliveredAt: null, readAt: null, error: null }
    }),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockPreferences: NotificationPreferences = {
    channels: {
      push: true,
      email: true,
      sms: false,
      whatsapp: true,
      in_app: true,
      socket: true
    },
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'Asia/Kolkata'
    },
    frequency: {
      email: 'immediate',
      push: 'immediate',
      sms: 'urgent_only',
      whatsapp: 'immediate'
    },
    topics: {
      orderUpdates: true,
      paymentUpdates: true,
      systemAnnouncements: true,
      promotions: false
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService = new NotificationService();

    // Setup default mocks using direct references
    mockUserFindUnique.mockResolvedValue(mockUser as any);
    mockCacheGet.mockResolvedValue(null);
    mockCacheSetex.mockResolvedValue(undefined);
  });

  describe('Notification Sending', () => {
    describe('sendNotification', () => {
      const validRequest: NotificationRequest = {
        templateId: 'order_confirmation',
        recipientId: 'user-123',
        recipientType: 'parent',
        channels: ['push', 'email'],
        variables: { orderId: 'ORD-123', totalAmount: '150.00', deliveryDate: '2024-01-15' },
        priority: 'normal'
      };

      beforeEach(() => {
        // Mock template retrieval
        mockCacheGet.mockImplementation((key: string) => {
          if (key.includes('notification_template:')) {
            return Promise.resolve(JSON.stringify(mockTemplate));
          }
          if (key.includes('notification_preferences:')) {
            return Promise.resolve(JSON.stringify(mockPreferences));
          }
          return Promise.resolve(null);
        });

        mockNotificationCreate.mockResolvedValue(mockNotification as any);
        mockNotificationUpdate.mockResolvedValue({
          ...mockNotification,
          status: 'sent',
          sentAt: new Date()
        } as any);
        mockNotificationCount.mockResolvedValue(5);
      });

      it('should send notification successfully', async () => {
        const result = await NotificationService.sendNotification(validRequest);

        expect(result).toEqual(expect.objectContaining({
          success: true
        }));
        expect(result.data).toBeDefined();
        expect(result.data?.templateData).toEqual(mockTemplate);
        expect(mockNotificationCreate).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith('Notification sent successfully', expect.any(Object));
      });

      it('should reject notification for non-existent template', async () => {
        mockCacheGet.mockResolvedValue(null);

        const result = await NotificationService.sendNotification({
          ...validRequest,
          templateId: 'non_existent'
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('TEMPLATE_NOT_FOUND');
      });

      it('should reject notification for inactive template', async () => {
        const inactiveTemplate = { ...mockTemplate, isActive: false };
        mockCacheGet.mockResolvedValue(JSON.stringify(inactiveTemplate));

        const result = await NotificationService.sendNotification(validRequest);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('TEMPLATE_NOT_FOUND');
      });

      it('should reject notification for non-existent recipient', async () => {
        mockUserFindUnique.mockResolvedValue(null);

        const result = await NotificationService.sendNotification(validRequest);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('RECIPIENT_NOT_FOUND');
      });

      it('should reject notification when no channels are available', async () => {
        const noChannelPreferences = {
          ...mockPreferences,
          channels: {
            push: false,
            email: false,
            sms: false,
            whatsapp: false,
            in_app: false,
            socket: false
          }
        };
        mockCacheGet.mockImplementation((key: string) => {
          if (key.includes('notification_template:')) {
            return Promise.resolve(JSON.stringify(mockTemplate));
          }
          if (key.includes('notification_preferences:')) {
            return Promise.resolve(JSON.stringify(noChannelPreferences));
          }
          return Promise.resolve(null);
        });

        const result = await NotificationService.sendNotification(validRequest);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('NO_CHANNELS_AVAILABLE');
      });

      it('should handle urgent notifications during quiet hours', async () => {
        // Mock current time to be during quiet hours (23:00)
        jest.useFakeTimers();
        const quietTime = new Date();
        quietTime.setHours(23, 0, 0, 0);
        jest.setSystemTime(quietTime);

        const urgentRequest = { ...validRequest, priority: 'urgent' as NPriority };
        const result = await NotificationService.sendNotification(urgentRequest);

        expect(result.success).toBe(true);
        expect(mockNotificationCreate).toHaveBeenCalled();

        jest.useRealTimers();
      });

      it('should schedule non-urgent notifications during quiet hours', async () => {
        // Mock current time to be during quiet hours (23:00)
        jest.useFakeTimers();
        const quietTime = new Date();
        quietTime.setHours(23, 0, 0, 0);
        jest.setSystemTime(quietTime);

        const result = await NotificationService.sendNotification(validRequest);

        expect(result.success).toBe(true);
        expect(logger.info).toHaveBeenCalledWith(
          'Scheduling notification after quiet hours',
          expect.any(Object)
        );

        jest.useRealTimers();
      });

      it('should process template variables correctly', async () => {
        const result = await NotificationService.sendNotification(validRequest);

        expect(result.success).toBe(true);
        expect(mockNotificationCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            variables: JSON.stringify(validRequest.variables)
          })
        });
      });

      it('should handle database errors gracefully', async () => {
        mockNotificationCreate.mockRejectedValue(new Error('Database error'));

        const result = await NotificationService.sendNotification(validRequest);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('NOTIFICATION_SEND_FAILED');
        expect(logger.error).toHaveBeenCalledWith('Failed to send notification', expect.any(Error), expect.any(Object));
      });

      it('should set correct expiry time for notifications', async () => {
        const customExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
        const requestWithExpiry = { ...validRequest, expiresAt: customExpiry };

        await NotificationService.sendNotification(requestWithExpiry);

        expect(mockNotificationCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            expiresAt: customExpiry
          })
        });
      });

      it('should respect user channel preferences', async () => {
        const limitedPreferences = {
          ...mockPreferences,
          channels: {
            push: true,
            email: false, // Disabled
            sms: false,
            whatsapp: true,
            in_app: true,
            socket: false
          }
        };

        mockCacheGet.mockImplementation((key: string) => {
          if (key.includes('notification_template:')) {
            return Promise.resolve(JSON.stringify(mockTemplate));
          }
          if (key.includes('notification_preferences:')) {
            return Promise.resolve(JSON.stringify(limitedPreferences));
          }
          return Promise.resolve(null);
        });

        // Don't specify channels in request, let it determine from preferences
        const request = {
          templateId: 'order_confirmation',
          recipientId: 'user-123',
          recipientType: 'parent' as const,
          variables: { orderId: 'ORD-123', totalAmount: '150.00', deliveryDate: '2024-01-15' },
          priority: 'normal' as const
        };

        const result = await NotificationService.sendNotification(request);

        expect(result.success).toBe(true);
        // Should only use push and whatsapp (both enabled in preferences and available in template)
        const createdNotification = mockNotificationCreate.mock.calls[0][0];
        const channels = JSON.parse(createdNotification.data.channels);
        expect(channels).toEqual(['push', 'whatsapp']);
      });
    });

    describe('sendBulkNotifications', () => {
      const bulkRequest: BulkNotificationRequest = {
        templateId: 'order_confirmation',
        recipients: [
          { recipientId: 'user-1', recipientType: 'parent', variables: { orderId: 'ORD-1' } },
          { recipientId: 'user-2', recipientType: 'parent', variables: { orderId: 'ORD-2' } },
          { recipientId: 'user-3', recipientType: 'parent', variables: { orderId: 'ORD-3' } }
        ],
        channels: ['push', 'email'],
        priority: 'normal'
      };

      beforeEach(() => {
        mockCacheGet.mockImplementation((key: string) => {
          if (key.includes('notification_template:')) {
            return Promise.resolve(JSON.stringify(mockTemplate));
          }
          if (key.includes('notification_preferences:')) {
            return Promise.resolve(JSON.stringify(mockPreferences));
          }
          return Promise.resolve(null);
        });

        mockNotificationCreate.mockResolvedValue(mockNotification as any);
        mockNotificationUpdate.mockResolvedValue({
          ...mockNotification,
          status: 'sent'
        } as any);
        mockNotificationCount.mockResolvedValue(5);
      });

      it('should send bulk notifications successfully', async () => {
        const result = await NotificationService.sendBulkNotifications(bulkRequest);

        expect(result.success).toBe(true);
        expect(result.data?.successful).toBe(3);
        expect(result.data?.failed).toBe(0);
        expect(mockNotificationCreate).toHaveBeenCalledTimes(3);
      });

      it('should handle partial failures in bulk sending', async () => {
        // Make one user not found
        mockUserFindUnique.mockImplementation((query) => {
          if (query.where.id === 'user-2') {
            return null as any;
          }
          return mockUser as any;
        });

        const result = await NotificationService.sendBulkNotifications(bulkRequest);

        expect(result.success).toBe(true);
        expect(result.data?.successful).toBe(2);
        expect(result.data?.failed).toBe(1);
        expect(result.data?.details.failed).toHaveLength(1);
        expect(result.data?.details.failed[0].recipientId).toBe('user-2');
      });

      it('should process recipients in batches', async () => {
        // Create a large batch to test batching logic
        const largeBulkRequest = {
          ...bulkRequest,
          recipients: Array.from({ length: 250 }, (_, i) => ({
            recipientId: `user-${i}`,
            recipientType: 'parent' as const,
            variables: { orderId: `ORD-${i}` }
          }))
        };

        const result = await NotificationService.sendBulkNotifications(largeBulkRequest);

        expect(result.success).toBe(true);
        expect(result.data?.successful).toBe(250);
        expect(mockNotificationCreate).toHaveBeenCalledTimes(250);
      });

      it('should handle bulk sending errors gracefully', async () => {
        // Mock database to throw an error during bulk processing
        mockNotificationCreate.mockRejectedValue(new Error('Database connection failed'));

        const result = await NotificationService.sendBulkNotifications(bulkRequest);

        expect(result.success).toBe(true); // Bulk operation itself succeeds, but individual notifications fail
        expect(result.data?.failed).toBe(3); // All 3 recipients should fail
        expect(result.data?.successful).toBe(0);
        
        // Restore mock for other tests
        mockNotificationCreate.mockResolvedValue(mockNotification as any);
      });
    });
  });

  describe('Order Notifications', () => {
    beforeEach(() => {
      mockCacheGet.mockImplementation((key: string) => {
        if (key.includes('notification_template:')) {
          return Promise.resolve(JSON.stringify(mockTemplate));
        }
        if (key.includes('notification_preferences:')) {
          return Promise.resolve(JSON.stringify(mockPreferences));
        }
        return Promise.resolve(null);
      });

      mockNotificationCreate.mockResolvedValue(mockNotification as any);
      mockNotificationUpdate.mockResolvedValue({
        ...mockNotification,
        status: 'sent'
      } as any);
      mockNotificationCount.mockResolvedValue(5);
    });

    describe('sendOrderConfirmation', () => {
      const orderData: OrderConfirmationData = {
        orderId: 'ORD-123',
        studentId: 'student-123',
        parentId: 'parent-123',
        totalAmount: 150.00, // 150.00 rupees
        deliveryDate: new Date('2024-01-15')
      };

      it('should send order confirmation notification', async () => {
        const result = await NotificationService.sendOrderConfirmation(orderData);

        expect(result.success).toBe(true);
        expect(mockNotificationCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            templateId: 'order_confirmation',
            recipientId: 'parent-123',
            recipientType: 'parent',
            priority: 'normal'
          })
        });
      });

      it('should format variables correctly for order confirmation', async () => {
        await NotificationService.sendOrderConfirmation(orderData);

        const createCall = mockNotificationCreate.mock.calls[0][0];
        const variables = JSON.parse((createCall.data as any).variables);
        
        expect(variables.orderId).toBe('ORD-123');
        expect(variables.totalAmount).toBe('150.00');
        expect(variables.deliveryDate).toBe('15/1/2024'); // UK format
      });
    });

    describe('sendOrderStatusUpdate', () => {
      const statusData: OrderStatusUpdateData = {
        orderId: 'ORD-123',
        studentId: 'student-123',
        parentId: 'parent-123',
        newStatus: 'DELIVERED',
        message: 'Your order has been delivered successfully!'
      };

      it('should send order status update notification', async () => {
        const result = await NotificationService.sendOrderStatusUpdate(statusData);

        expect(result.success).toBe(true);
        expect(mockNotificationCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            templateId: 'order_status_update',
            recipientId: 'parent-123',
            recipientType: 'parent'
          })
        });
      });

      it('should set high priority for delivered orders', async () => {
        await NotificationService.sendOrderStatusUpdate(statusData);

        const createCall = mockNotificationCreate.mock.calls[0][0];
        expect(createCall.data.priority).toBe('high');
      });

      it('should set normal priority for non-delivered status', async () => {
        const normalStatusData = { ...statusData, newStatus: 'PREPARING' };
        await NotificationService.sendOrderStatusUpdate(normalStatusData);

        const createCall = mockNotificationCreate.mock.calls[0][0];
        expect(createCall.data.priority).toBe('normal');
      });
    });
  });

  describe('Notification Management', () => {
    describe('markAsRead', () => {
      it('should mark notification as read successfully', async () => {
        mockNotificationFindFirst.mockResolvedValue(mockNotification as any);
        mockNotificationUpdate.mockResolvedValue({
          ...mockNotification,
          status: 'read',
          readAt: new Date()
        } as any);
        mockNotificationCount.mockResolvedValue(4); // One less unread

        const result = await NotificationService.markAsRead('notification-123', 'user-123');

        expect(result.success).toBe(true);
        expect(result.data?.status).toBe('read');
        expect(mockNotificationUpdate).toHaveBeenCalledWith({
          where: { id: 'notification-123' },
          data: expect.objectContaining({
            status: 'read',
            readAt: expect.any(Date)
          })
        });
      });

      it('should reject marking non-existent notification as read', async () => {
        mockNotificationFindFirst.mockResolvedValue(null);

        const result = await NotificationService.markAsRead('non-existent', 'user-123');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('NOTIFICATION_NOT_FOUND');
      });

      it('should handle database errors when marking as read', async () => {
        mockNotificationFindFirst.mockResolvedValue(mockNotification as any);
        mockNotificationUpdate.mockRejectedValue(new Error('Database error'));

        const result = await NotificationService.markAsRead('notification-123', 'user-123');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('MARK_READ_FAILED');
        expect(logger.error).toHaveBeenCalledWith('Failed to mark notification as read', expect.any(Error), expect.any(Object));
      });
    });

    describe('getUserNotifications', () => {
      const mockNotifications = [
        { ...mockNotification, id: 'notif-1', createdAt: new Date('2024-01-15') },
        { ...mockNotification, id: 'notif-2', createdAt: new Date('2024-01-14') },
        { ...mockNotification, id: 'notif-3', createdAt: new Date('2024-01-13') }
      ];

      beforeEach(() => {
        mockNotificationFindMany.mockResolvedValue(mockNotifications as any);
        mockNotificationCount.mockResolvedValue(3);
      });

      it('should get user notifications with default pagination', async () => {
        const result = await NotificationService.getUserNotifications('user-123');

        expect(result.success).toBe(true);
        expect(result.data?.notifications).toHaveLength(3);
        expect(result.data?.pagination.page).toBe(1);
        expect(result.data?.pagination.limit).toBe(20);
        expect(result.data?.pagination.total).toBe(3);
      });

      it('should apply pagination correctly', async () => {
        await NotificationService.getUserNotifications('user-123', { page: 2, limit: 10 });

        expect(mockNotificationFindMany).toHaveBeenCalledWith({
          where: { recipientId: 'user-123' },
          orderBy: { createdAt: 'desc' },
          skip: 10,
          take: 10
        });
      });

      it('should filter by status when provided', async () => {
        await NotificationService.getUserNotifications('user-123', { status: 'read' as NStatus });

        expect(mockNotificationFindMany).toHaveBeenCalledWith({
          where: { recipientId: 'user-123', status: 'read' },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20
        });
      });

      it('should filter unread notifications only', async () => {
        await NotificationService.getUserNotifications('user-123', { unreadOnly: true });

        expect(mockNotificationFindMany).toHaveBeenCalledWith({
          where: { 
            recipientId: 'user-123',
            status: { in: ['pending', 'sent', 'delivered'] }
          },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20
        });
      });

      it('should filter by priority when provided', async () => {
        await NotificationService.getUserNotifications('user-123', { priority: 'high' as NPriority });

        expect(mockNotificationFindMany).toHaveBeenCalledWith({
          where: { recipientId: 'user-123', priority: 'high' },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20
        });
      });

      it('should limit maximum page size', async () => {
        await NotificationService.getUserNotifications('user-123', { limit: 200 });

        expect(mockNotificationFindMany).toHaveBeenCalledWith({
          where: { recipientId: 'user-123' },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 100 // Capped at 100
        });
      });

      it('should handle database errors gracefully', async () => {
        mockNotificationFindMany.mockRejectedValue(new Error('Database error'));

        const result = await NotificationService.getUserNotifications('user-123');

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('GET_NOTIFICATIONS_FAILED');
        expect(logger.error).toHaveBeenCalledWith('Failed to get user notifications', expect.any(Error), expect.any(Object));
      });
    });
  });

  describe('Notification Preferences', () => {
    describe('updateNotificationPreferences', () => {
      const updatedPreferences: Partial<NotificationPreferences> = {
        channels: {
          push: true,
          email: false,
          sms: true,
          whatsapp: false,
          in_app: true,
          socket: false
        }
      };

      beforeEach(() => {
        mockCacheGet.mockResolvedValue(JSON.stringify(mockPreferences));
        mockUserUpdate.mockResolvedValue({
          ...mockUser,
          notificationPreferences: JSON.stringify({ ...mockPreferences, ...updatedPreferences })
        } as any);
      });

      it('should update notification preferences successfully', async () => {
        const result = await NotificationService.updateNotificationPreferences('user-123', updatedPreferences);

        expect(result.success).toBe(true);
        expect(result.data?.channels.email).toBe(false);
        expect(result.data?.channels.sms).toBe(true);
        expect(mockUserUpdate).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: {
            notificationPreferences: JSON.stringify({ ...mockPreferences, ...updatedPreferences })
          }
        });
      });

      it('should update cache after saving preferences', async () => {
        await NotificationService.updateNotificationPreferences('user-123', updatedPreferences);

        expect(mockCacheSetex).toHaveBeenCalledWith(
          'notification_preferences:user-123',
          3600,
          JSON.stringify({ ...mockPreferences, ...updatedPreferences })
        );
      });

      it('should handle database errors when updating preferences', async () => {
        mockUserUpdate.mockRejectedValue(new Error('Database error'));

        const result = await NotificationService.updateNotificationPreferences('user-123', updatedPreferences);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('PREFERENCES_UPDATE_FAILED');
        expect(logger.error).toHaveBeenCalledWith('Failed to update notification preferences', expect.any(Error), expect.any(Object));
      });
    });
  });

  describe('Notification Analytics', () => {
    describe('getNotificationAnalytics', () => {
      const mockAnalyticsNotifications = [
        {
          id: 'notif-1',
          templateId: 'order_confirmation',
          status: 'read',
          channels: JSON.stringify(['push', 'email']),
          deliveryStatus: JSON.stringify({
            push: { status: 'delivered' },
            email: { status: 'read' }
          }),
          createdAt: new Date('2024-01-15'),
          readAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: 'notif-2',
          templateId: 'order_status_update',
          status: 'sent',
          channels: JSON.stringify(['push']),
          deliveryStatus: JSON.stringify({
            push: { status: 'sent' }
          }),
          createdAt: new Date('2024-01-14'),
          readAt: null
        },
        {
          id: 'notif-3',
          templateId: 'order_confirmation',
          status: 'failed',
          channels: JSON.stringify(['email']),
          deliveryStatus: JSON.stringify({
            email: { status: 'failed' }
          }),
          createdAt: new Date('2024-01-13'),
          readAt: null
        }
      ];

      beforeEach(() => {
        mockNotificationFindMany.mockResolvedValue(mockAnalyticsNotifications as any);
      });

      it('should get notification analytics successfully', async () => {
        const filters = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        };

        const result = await NotificationService.getNotificationAnalytics(filters);

        expect(result.success).toBe(true);
        expect(result.data?.totalSent).toBe(3);
        expect(result.data?.totalDelivered).toBe(2); // 'read' and 'sent' count as delivered
        expect(result.data?.totalRead).toBe(1);
        expect(result.data?.deliveryRate).toBeCloseTo(66.67, 2);
        expect(result.data?.readRate).toBe(50);
      });

      it('should apply date filters correctly', async () => {
        const filters = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          templateId: 'order_confirmation',
          userId: 'user-123'
        };

        await NotificationService.getNotificationAnalytics(filters);

        expect(mockNotificationFindMany).toHaveBeenCalledWith({
          where: {
            createdAt: {
              gte: filters.startDate,
              lte: filters.endDate
            },
            templateId: 'order_confirmation',
            recipientId: 'user-123'
          },
          select: expect.any(Object)
        });
      });

      it('should calculate channel statistics correctly', async () => {
        const filters = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        };

        const result = await NotificationService.getNotificationAnalytics(filters);

        expect(result.success).toBe(true);
        expect(result.data?.channelStats.push.sent).toBe(2);
        expect(result.data?.channelStats.push.delivered).toBe(2);
        expect(result.data?.channelStats.email.sent).toBe(2);
        expect(result.data?.channelStats.email.delivered).toBe(1);
        expect(result.data?.channelStats.email.failed).toBe(1);
      });

      it('should handle database errors in analytics', async () => {
        mockNotificationFindMany.mockRejectedValue(new Error('Database error'));

        const filters = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        };

        const result = await NotificationService.getNotificationAnalytics(filters);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('ANALYTICS_FAILED');
        expect(logger.error).toHaveBeenCalledWith('Failed to get notification analytics', expect.any(Error), expect.any(Object));
      });
    });
  });

  describe('Template and Channel Management', () => {
    beforeEach(() => {
      // Setup mocks for these tests
      mockNotificationCreate.mockResolvedValue(mockNotification as any);
      mockNotificationUpdate.mockResolvedValue({
        ...mockNotification,
        status: 'sent',
        sentAt: new Date()
      } as any);
      mockNotificationCount.mockResolvedValue(5);
    });

    describe('Template Processing', () => {
      it('should process template variables correctly', async () => {
        // Test template processing indirectly through sendNotification
        mockCacheGet.mockImplementation((key: string) => {
          if (key.includes('notification_template:')) {
            return Promise.resolve(JSON.stringify(mockTemplate));
          }
          if (key.includes('notification_preferences:')) {
            return Promise.resolve(JSON.stringify(mockPreferences));
          }
          return Promise.resolve(null);
        });

        const request: NotificationRequest = {
          templateId: 'order_confirmation',
          recipientId: 'user-123',
          recipientType: 'parent',
          variables: { orderId: 'ORD-123', totalAmount: '150.00', deliveryDate: '2024-01-15' }
        };

        const result = await NotificationService.sendNotification(request);

        expect(result.success).toBe(true);
        expect(mockNotificationCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            variables: JSON.stringify(request.variables)
          })
        });
      });
    });

    describe('Channel Determination', () => {
      beforeEach(() => {
        // Clear mocks to avoid interference between tests
        jest.clearAllMocks();
        mockUserFindUnique.mockResolvedValue(mockUser as any);
        mockNotificationCreate.mockResolvedValue(mockNotification as any);
        mockNotificationUpdate.mockResolvedValue({
          ...mockNotification,
          status: 'sent',
          sentAt: new Date()
        } as any);
        mockNotificationCount.mockResolvedValue(5);
      });

      it('should determine available channels based on template and preferences', async () => {
        // Test channel determination through sendNotification behavior
        const limitedPreferences = {
          ...mockPreferences,
          channels: {
            push: true,
            email: false, // Disabled
            sms: true,
            whatsapp: true,
            in_app: false,
            socket: false
          }
        };

        mockCacheGet.mockImplementation((key: string) => {
          if (key.includes('notification_template:')) {
            return Promise.resolve(JSON.stringify(mockTemplate));
          }
          if (key.includes('notification_preferences:')) {
            return Promise.resolve(JSON.stringify(limitedPreferences));
          }
          return Promise.resolve(null);
        });

        const request: NotificationRequest = {
          templateId: 'order_confirmation',
          recipientId: 'user-123',
          recipientType: 'parent'
        };

        const result = await NotificationService.sendNotification(request);

        expect(result.success).toBe(true);
        // Should only use push and whatsapp (both enabled in preferences and available in template)
        const createdNotification = mockNotificationCreate.mock.calls[0][0];
        const channels = JSON.parse(createdNotification.data.channels);
        expect(channels).toEqual(['push', 'whatsapp']);
      });

      it('should respect requested channels when provided', async () => {
        mockCacheGet.mockImplementation((key: string) => {
          if (key.includes('notification_template:')) {
            return Promise.resolve(JSON.stringify(mockTemplate));
          }
          if (key.includes('notification_preferences:')) {
            return Promise.resolve(JSON.stringify(mockPreferences));
          }
          return Promise.resolve(null);
        });

        const request: NotificationRequest = {
          templateId: 'order_confirmation',
          recipientId: 'user-123',
          recipientType: 'parent',
          channels: ['push', 'email'] // Explicitly requested channels
        };

        const result = await NotificationService.sendNotification(request);

        expect(result.success).toBe(true);
        const createdNotification = mockNotificationCreate.mock.calls[0][0];
        const channels = JSON.parse(createdNotification.data.channels);
        expect(channels).toEqual(['push', 'email']);
      });
    });

    describe('Quiet Hours Management', () => {
      it('should detect quiet hours correctly', async () => {
        // Test quiet hours functionality through sendNotification behavior
        const quietHoursPreferences = {
          ...mockPreferences,
          quietHours: {
            enabled: true,
            startTime: '22:00',
            endTime: '08:00',
            timezone: 'Asia/Kolkata'
          }
        };

        // Test during quiet hours (23:30)
        jest.useFakeTimers();
        const quietTime = new Date();
        quietTime.setHours(23, 30, 0, 0);
        jest.setSystemTime(quietTime);

        mockCacheGet.mockImplementation((key: string) => {
          if (key.includes('notification_template:')) {
            return Promise.resolve(JSON.stringify(mockTemplate));
          }
          if (key.includes('notification_preferences:')) {
            return Promise.resolve(JSON.stringify(quietHoursPreferences));
          }
          return Promise.resolve(null);
        });

        const request: NotificationRequest = {
          templateId: 'order_confirmation',
          recipientId: 'user-123',
          recipientType: 'parent',
          priority: 'normal' // Non-urgent during quiet hours should be scheduled
        };

        const result = await NotificationService.sendNotification(request);

        expect(result.success).toBe(true);
        expect(logger.info).toHaveBeenCalledWith(
          'Scheduling notification after quiet hours',
          expect.any(Object)
        );

        jest.useRealTimers();
      });

      it('should calculate post-quiet hours time correctly', async () => {
        // Test that quiet hours scheduling works correctly
        const quietHoursPreferences = {
          ...mockPreferences,
          quietHours: {
            enabled: true,
            startTime: '22:00',
            endTime: '08:00',
            timezone: 'Asia/Kolkata'
          }
        };

        jest.useFakeTimers();
        const quietTime = new Date();
        quietTime.setHours(23, 30, 0, 0);
        jest.setSystemTime(quietTime);

        mockCacheGet.mockImplementation((key: string) => {
          if (key.includes('notification_template:')) {
            return Promise.resolve(JSON.stringify(mockTemplate));
          }
          if (key.includes('notification_preferences:')) {
            return Promise.resolve(JSON.stringify(quietHoursPreferences));
          }
          return Promise.resolve(null);
        });

        const request: NotificationRequest = {
          templateId: 'order_confirmation',
          recipientId: 'user-123',
          recipientType: 'parent',
          priority: 'normal'
        };

        const result = await NotificationService.sendNotification(request);

        // Should successfully schedule for later
        expect(result.success).toBe(true);
        expect(logger.info).toHaveBeenCalledWith(
          'Scheduling notification after quiet hours',
          expect.objectContaining({
            newSchedule: expect.any(Date)
          })
        );

        jest.useRealTimers();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle cache failures gracefully', async () => {
      // Mock template cache to return null so it uses getMockTemplate
      mockCacheGet.mockImplementation((key: string) => {
        if (key.includes('notification_template:')) {
          return Promise.resolve(null); // Force fallback to getMockTemplate
        }
        if (key.includes('notification_preferences:')) {
          return Promise.resolve(null); // Force fallback to database
        }
        return Promise.resolve(null);
      });
      
      mockUserFindUnique.mockResolvedValue({
        ...mockUser,
        notificationPreferences: JSON.stringify(mockPreferences)
      } as any);

      // Should fall back to database and default preferences
      const request: NotificationRequest = {
        templateId: 'order_confirmation',
        recipientId: 'user-123',
        recipientType: 'parent'
      };

      // This will internally call getUserPreferences which should handle cache failure
      mockNotificationCreate.mockResolvedValue(mockNotification as any);
      mockNotificationUpdate.mockResolvedValue({
        ...mockNotification,
        status: 'sent'
      } as any);
      mockNotificationCount.mockResolvedValue(5);

      const result = await NotificationService.sendNotification(request);

      // Should still succeed despite cache failure
      expect(result.success).toBe(true);
    });

    it('should handle missing user preferences gracefully', async () => {
      mockCacheGet.mockResolvedValue(null);
      mockUserFindUnique.mockResolvedValue({
        ...mockUser,
        notificationPreferences: null // No preferences set
      } as any);

      // Should use default preferences
      const request: NotificationRequest = {
        templateId: 'order_confirmation',
        recipientId: 'user-123',
        recipientType: 'parent'
      };

      mockNotificationCreate.mockResolvedValue(mockNotification as any);
      mockNotificationUpdate.mockResolvedValue({
        ...mockNotification,
        status: 'sent'
      } as any);
      mockNotificationCount.mockResolvedValue(5);

      const result = await NotificationService.sendNotification(request);
      expect(result.success).toBe(true);
    });

    it('should handle empty analytics data gracefully', async () => {
      mockNotificationFindMany.mockResolvedValue([]);

      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      const result = await NotificationService.getNotificationAnalytics(filters);

      expect(result.success).toBe(true);
      expect(result.data?.totalSent).toBe(0);
      expect(result.data?.deliveryRate).toBe(0);
      expect(result.data?.readRate).toBe(0);
    });

    it('should handle concurrent notification sending', async () => {
      // Reset call count first
      jest.clearAllMocks();
      
      mockCacheGet.mockImplementation((key: string) => {
        if (key.includes('notification_template:')) {
          return Promise.resolve(JSON.stringify(mockTemplate));
        }
        if (key.includes('notification_preferences:')) {
          return Promise.resolve(JSON.stringify(mockPreferences));
        }
        return Promise.resolve(null);
      });

      mockNotificationCreate.mockResolvedValue(mockNotification as any);
      mockNotificationUpdate.mockResolvedValue({
        ...mockNotification,
        status: 'sent'
      } as any);
      mockNotificationCount.mockResolvedValue(5);

      const request: NotificationRequest = {
        templateId: 'order_confirmation',
        recipientId: 'user-123',
        recipientType: 'parent'
      };

      // Send multiple notifications concurrently
      const promises = Array.from({ length: 5 }, () => 
        NotificationService.sendNotification(request)
      );

      const results = await Promise.all(promises);

      expect(results.every(r => r.success)).toBe(true);
      expect(mockNotificationCreate).toHaveBeenCalledTimes(5);
    });
  });
});