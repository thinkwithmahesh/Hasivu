"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NotificationStatus = {
    PENDING: 'pending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    FAILED: 'failed',
    EXPIRED: 'expired'
};
const NotificationPriority = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent'
};
jest.mock('../../../src/services/database.service', () => ({
    DatabaseService: {
        client: {
            notification: {
                create: jest.fn(),
                findFirst: jest.fn(),
                findMany: jest.fn(),
                update: jest.fn(),
                count: jest.fn()
            },
            user: {
                findUnique: jest.fn(),
                update: jest.fn()
            }
        }
    }
}));
jest.mock('../../../src/services/redis.service', () => ({
    RedisService: {
        get: jest.fn(),
        set: jest.fn(),
        setex: jest.fn(),
        del: jest.fn()
    }
}));
jest.mock('../../../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));
jest.mock('../../../src/utils/cache', () => ({
    cache: {
        get: jest.fn(),
        setex: jest.fn(),
        del: jest.fn()
    }
}));
const notification_service_1 = require("../../../src/services/notification.service");
const database_service_1 = require("../../../src/services/database.service");
const redis_service_1 = require("../../../src/services/redis.service");
const logger_1 = require("../../../src/utils/logger");
const cache_1 = require("../../../src/utils/cache");
const MockedDatabaseService = jest.mocked(database_service_1.DatabaseService);
const MockedRedisService = jest.mocked(redis_service_1.RedisService);
const MockedCache = jest.mocked(cache_1.cache);
describe('NotificationService', () => {
    let notificationService;
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
        channels: ['push', 'email', 'whatsapp'],
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
    const mockPreferences = {
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
        notificationService = new notification_service_1.NotificationService();
        MockedDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
        MockedCache.get.mockResolvedValue(null);
        MockedCache.setex.mockResolvedValue(undefined);
    });
    describe('Notification Sending', () => {
        describe('sendNotification', () => {
            const validRequest = {
                templateId: 'order_confirmation',
                recipientId: 'user-123',
                recipientType: 'parent',
                channels: ['push', 'email'],
                variables: { orderId: 'ORD-123', totalAmount: '150.00', deliveryDate: '2024-01-15' },
                priority: 'normal'
            };
            beforeEach(() => {
                MockedCache.get.mockImplementation((key) => {
                    if (key.includes('notification_template:')) {
                        return Promise.resolve(JSON.stringify(mockTemplate));
                    }
                    if (key.includes('notification_preferences:')) {
                        return Promise.resolve(JSON.stringify(mockPreferences));
                    }
                    return Promise.resolve(null);
                });
                MockedDatabaseService.client.notification.create.mockResolvedValue(mockNotification);
                MockedDatabaseService.client.notification.update.mockResolvedValue({
                    ...mockNotification,
                    status: 'sent',
                    sentAt: new Date()
                });
                MockedDatabaseService.client.notification.count.mockResolvedValue(5);
            });
            it('should send notification successfully', async () => {
                const result = await notification_service_1.NotificationService.sendNotification(validRequest);
                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
                expect(result.data?.templateData).toEqual(mockTemplate);
                expect(MockedDatabaseService.client.notification.create).toHaveBeenCalled();
                expect(logger_1.logger.info).toHaveBeenCalledWith('Notification sent successfully', expect.any(Object));
            });
            it('should reject notification for non-existent template', async () => {
                MockedCache.get.mockResolvedValue(null);
                const result = await notification_service_1.NotificationService.sendNotification({
                    ...validRequest,
                    templateId: 'non_existent'
                });
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('TEMPLATE_NOT_FOUND');
            });
            it('should reject notification for inactive template', async () => {
                const inactiveTemplate = { ...mockTemplate, isActive: false };
                MockedCache.get.mockResolvedValue(JSON.stringify(inactiveTemplate));
                const result = await notification_service_1.NotificationService.sendNotification(validRequest);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('TEMPLATE_NOT_FOUND');
            });
            it('should reject notification for non-existent recipient', async () => {
                MockedDatabaseService.client.user.findUnique.mockResolvedValue(null);
                const result = await notification_service_1.NotificationService.sendNotification(validRequest);
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
                MockedCache.get.mockImplementation((key) => {
                    if (key.includes('notification_template:')) {
                        return Promise.resolve(JSON.stringify(mockTemplate));
                    }
                    if (key.includes('notification_preferences:')) {
                        return Promise.resolve(JSON.stringify(noChannelPreferences));
                    }
                    return Promise.resolve(null);
                });
                const result = await notification_service_1.NotificationService.sendNotification(validRequest);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('NO_CHANNELS_AVAILABLE');
            });
            it('should handle urgent notifications during quiet hours', async () => {
                jest.useFakeTimers();
                const quietTime = new Date();
                quietTime.setHours(23, 0, 0, 0);
                jest.setSystemTime(quietTime);
                const urgentRequest = { ...validRequest, priority: 'urgent' };
                const result = await notification_service_1.NotificationService.sendNotification(urgentRequest);
                expect(result.success).toBe(true);
                expect(MockedDatabaseService.client.notification.create).toHaveBeenCalled();
                jest.useRealTimers();
            });
            it('should schedule non-urgent notifications during quiet hours', async () => {
                jest.useFakeTimers();
                const quietTime = new Date();
                quietTime.setHours(23, 0, 0, 0);
                jest.setSystemTime(quietTime);
                const result = await notification_service_1.NotificationService.sendNotification(validRequest);
                expect(result.success).toBe(true);
                expect(logger_1.logger.info).toHaveBeenCalledWith('Scheduling notification after quiet hours', expect.any(Object));
                jest.useRealTimers();
            });
            it('should process template variables correctly', async () => {
                const result = await notification_service_1.NotificationService.sendNotification(validRequest);
                expect(result.success).toBe(true);
                expect(MockedDatabaseService.client.notification.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({
                        variables: JSON.stringify(validRequest.variables)
                    })
                });
            });
            it('should handle database errors gracefully', async () => {
                MockedDatabaseService.client.notification.create.mockRejectedValue(new Error('Database error'));
                const result = await notification_service_1.NotificationService.sendNotification(validRequest);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('NOTIFICATION_SEND_FAILED');
                expect(logger_1.logger.error).toHaveBeenCalledWith('Failed to send notification', expect.any(Error), expect.any(Object));
            });
            it('should set correct expiry time for notifications', async () => {
                const customExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
                const requestWithExpiry = { ...validRequest, expiresAt: customExpiry };
                await notification_service_1.NotificationService.sendNotification(requestWithExpiry);
                expect(MockedDatabaseService.client.notification.create).toHaveBeenCalledWith({
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
                        email: false,
                        sms: false,
                        whatsapp: true,
                        in_app: true,
                        socket: false
                    }
                };
                MockedCache.get.mockImplementation((key) => {
                    if (key.includes('notification_template:')) {
                        return Promise.resolve(JSON.stringify(mockTemplate));
                    }
                    if (key.includes('notification_preferences:')) {
                        return Promise.resolve(JSON.stringify(limitedPreferences));
                    }
                    return Promise.resolve(null);
                });
                const request = {
                    templateId: 'order_confirmation',
                    recipientId: 'user-123',
                    recipientType: 'parent',
                    variables: { orderId: 'ORD-123', totalAmount: '150.00', deliveryDate: '2024-01-15' },
                    priority: 'normal'
                };
                const result = await notification_service_1.NotificationService.sendNotification(request);
                expect(result.success).toBe(true);
                const createdNotification = MockedDatabaseService.client.notification.create.mock.calls[0][0];
                const channels = JSON.parse(createdNotification.data.channels);
                expect(channels).toEqual(['push', 'whatsapp']);
            });
        });
        describe('sendBulkNotifications', () => {
            const bulkRequest = {
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
                MockedCache.get.mockImplementation((key) => {
                    if (key.includes('notification_template:')) {
                        return Promise.resolve(JSON.stringify(mockTemplate));
                    }
                    if (key.includes('notification_preferences:')) {
                        return Promise.resolve(JSON.stringify(mockPreferences));
                    }
                    return Promise.resolve(null);
                });
                MockedDatabaseService.client.notification.create.mockResolvedValue(mockNotification);
                MockedDatabaseService.client.notification.update.mockResolvedValue({
                    ...mockNotification,
                    status: 'sent'
                });
                MockedDatabaseService.client.notification.count.mockResolvedValue(5);
            });
            it('should send bulk notifications successfully', async () => {
                const result = await notification_service_1.NotificationService.sendBulkNotifications(bulkRequest);
                expect(result.success).toBe(true);
                expect(result.data?.successful).toBe(3);
                expect(result.data?.failed).toBe(0);
                expect(MockedDatabaseService.client.notification.create).toHaveBeenCalledTimes(3);
            });
            it('should handle partial failures in bulk sending', async () => {
                MockedDatabaseService.client.user.findUnique.mockImplementation((query) => {
                    if (query.where.id === 'user-2') {
                        return null;
                    }
                    return mockUser;
                });
                const result = await notification_service_1.NotificationService.sendBulkNotifications(bulkRequest);
                expect(result.success).toBe(true);
                expect(result.data?.successful).toBe(2);
                expect(result.data?.failed).toBe(1);
                expect(result.data?.details.failed).toHaveLength(1);
                expect(result.data?.details.failed[0].recipientId).toBe('user-2');
            });
            it('should process recipients in batches', async () => {
                const largeBulkRequest = {
                    ...bulkRequest,
                    recipients: Array.from({ length: 250 }, (_, i) => ({
                        recipientId: `user-${i}`,
                        recipientType: 'parent',
                        variables: { orderId: `ORD-${i}` }
                    }))
                };
                const result = await notification_service_1.NotificationService.sendBulkNotifications(largeBulkRequest);
                expect(result.success).toBe(true);
                expect(result.data?.successful).toBe(250);
                expect(MockedDatabaseService.client.notification.create).toHaveBeenCalledTimes(250);
            });
            it('should handle bulk sending errors gracefully', async () => {
                MockedDatabaseService.client.notification.create.mockRejectedValue(new Error('Database connection failed'));
                const result = await notification_service_1.NotificationService.sendBulkNotifications(bulkRequest);
                expect(result.success).toBe(true);
                expect(result.data?.failed).toBe(3);
                expect(result.data?.successful).toBe(0);
                MockedDatabaseService.client.notification.create.mockResolvedValue(mockNotification);
            });
        });
    });
    describe('Order Notifications', () => {
        beforeEach(() => {
            MockedCache.get.mockImplementation((key) => {
                if (key.includes('notification_template:')) {
                    return Promise.resolve(JSON.stringify(mockTemplate));
                }
                if (key.includes('notification_preferences:')) {
                    return Promise.resolve(JSON.stringify(mockPreferences));
                }
                return Promise.resolve(null);
            });
            MockedDatabaseService.client.notification.create.mockResolvedValue(mockNotification);
            MockedDatabaseService.client.notification.update.mockResolvedValue({
                ...mockNotification,
                status: 'sent'
            });
            MockedDatabaseService.client.notification.count.mockResolvedValue(5);
        });
        describe('sendOrderConfirmation', () => {
            const orderData = {
                orderId: 'ORD-123',
                studentId: 'student-123',
                parentId: 'parent-123',
                totalAmount: 150.00,
                deliveryDate: new Date('2024-01-15')
            };
            it('should send order confirmation notification', async () => {
                const result = await notification_service_1.NotificationService.sendOrderConfirmation(orderData);
                expect(result.success).toBe(true);
                expect(MockedDatabaseService.client.notification.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({
                        templateId: 'order_confirmation',
                        recipientId: 'parent-123',
                        recipientType: 'parent',
                        priority: 'normal'
                    })
                });
            });
            it('should format variables correctly for order confirmation', async () => {
                await notification_service_1.NotificationService.sendOrderConfirmation(orderData);
                const createCall = MockedDatabaseService.client.notification.create.mock.calls[0][0];
                const variables = JSON.parse(createCall.data.variables);
                expect(variables.orderId).toBe('ORD-123');
                expect(variables.totalAmount).toBe('150.00');
                expect(variables.deliveryDate).toBe('15/1/2024');
            });
        });
        describe('sendOrderStatusUpdate', () => {
            const statusData = {
                orderId: 'ORD-123',
                studentId: 'student-123',
                parentId: 'parent-123',
                newStatus: 'DELIVERED',
                message: 'Your order has been delivered successfully!'
            };
            it('should send order status update notification', async () => {
                const result = await notification_service_1.NotificationService.sendOrderStatusUpdate(statusData);
                expect(result.success).toBe(true);
                expect(MockedDatabaseService.client.notification.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({
                        templateId: 'order_status_update',
                        recipientId: 'parent-123',
                        recipientType: 'parent'
                    })
                });
            });
            it('should set high priority for delivered orders', async () => {
                await notification_service_1.NotificationService.sendOrderStatusUpdate(statusData);
                const createCall = MockedDatabaseService.client.notification.create.mock.calls[0][0];
                expect(createCall.data.priority).toBe('high');
            });
            it('should set normal priority for non-delivered status', async () => {
                const normalStatusData = { ...statusData, newStatus: 'PREPARING' };
                await notification_service_1.NotificationService.sendOrderStatusUpdate(normalStatusData);
                const createCall = MockedDatabaseService.client.notification.create.mock.calls[0][0];
                expect(createCall.data.priority).toBe('normal');
            });
        });
    });
    describe('Notification Management', () => {
        describe('markAsRead', () => {
            it('should mark notification as read successfully', async () => {
                MockedDatabaseService.client.notification.findFirst.mockResolvedValue(mockNotification);
                MockedDatabaseService.client.notification.update.mockResolvedValue({
                    ...mockNotification,
                    status: 'read',
                    readAt: new Date()
                });
                MockedDatabaseService.client.notification.count.mockResolvedValue(4);
                const result = await notification_service_1.NotificationService.markAsRead('notification-123', 'user-123');
                expect(result.success).toBe(true);
                expect(result.data?.status).toBe('read');
                expect(MockedDatabaseService.client.notification.update).toHaveBeenCalledWith({
                    where: { id: 'notification-123' },
                    data: expect.objectContaining({
                        status: 'read',
                        readAt: expect.any(Date)
                    })
                });
            });
            it('should reject marking non-existent notification as read', async () => {
                MockedDatabaseService.client.notification.findFirst.mockResolvedValue(null);
                const result = await notification_service_1.NotificationService.markAsRead('non-existent', 'user-123');
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('NOTIFICATION_NOT_FOUND');
            });
            it('should handle database errors when marking as read', async () => {
                MockedDatabaseService.client.notification.findFirst.mockResolvedValue(mockNotification);
                MockedDatabaseService.client.notification.update.mockRejectedValue(new Error('Database error'));
                const result = await notification_service_1.NotificationService.markAsRead('notification-123', 'user-123');
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('MARK_READ_FAILED');
                expect(logger_1.logger.error).toHaveBeenCalledWith('Failed to mark notification as read', expect.any(Error), expect.any(Object));
            });
        });
        describe('getUserNotifications', () => {
            const mockNotifications = [
                { ...mockNotification, id: 'notif-1', createdAt: new Date('2024-01-15') },
                { ...mockNotification, id: 'notif-2', createdAt: new Date('2024-01-14') },
                { ...mockNotification, id: 'notif-3', createdAt: new Date('2024-01-13') }
            ];
            beforeEach(() => {
                MockedDatabaseService.client.notification.findMany.mockResolvedValue(mockNotifications);
                MockedDatabaseService.client.notification.count.mockResolvedValue(3);
            });
            it('should get user notifications with default pagination', async () => {
                const result = await notification_service_1.NotificationService.getUserNotifications('user-123');
                expect(result.success).toBe(true);
                expect(result.data?.notifications).toHaveLength(3);
                expect(result.data?.pagination.page).toBe(1);
                expect(result.data?.pagination.limit).toBe(20);
                expect(result.data?.pagination.total).toBe(3);
            });
            it('should apply pagination correctly', async () => {
                await notification_service_1.NotificationService.getUserNotifications('user-123', { page: 2, limit: 10 });
                expect(MockedDatabaseService.client.notification.findMany).toHaveBeenCalledWith({
                    where: { recipientId: 'user-123' },
                    orderBy: { createdAt: 'desc' },
                    skip: 10,
                    take: 10
                });
            });
            it('should filter by status when provided', async () => {
                await notification_service_1.NotificationService.getUserNotifications('user-123', { status: 'read' });
                expect(MockedDatabaseService.client.notification.findMany).toHaveBeenCalledWith({
                    where: { recipientId: 'user-123', status: 'read' },
                    orderBy: { createdAt: 'desc' },
                    skip: 0,
                    take: 20
                });
            });
            it('should filter unread notifications only', async () => {
                await notification_service_1.NotificationService.getUserNotifications('user-123', { unreadOnly: true });
                expect(MockedDatabaseService.client.notification.findMany).toHaveBeenCalledWith({
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
                await notification_service_1.NotificationService.getUserNotifications('user-123', { priority: 'high' });
                expect(MockedDatabaseService.client.notification.findMany).toHaveBeenCalledWith({
                    where: { recipientId: 'user-123', priority: 'high' },
                    orderBy: { createdAt: 'desc' },
                    skip: 0,
                    take: 20
                });
            });
            it('should limit maximum page size', async () => {
                await notification_service_1.NotificationService.getUserNotifications('user-123', { limit: 200 });
                expect(MockedDatabaseService.client.notification.findMany).toHaveBeenCalledWith({
                    where: { recipientId: 'user-123' },
                    orderBy: { createdAt: 'desc' },
                    skip: 0,
                    take: 100
                });
            });
            it('should handle database errors gracefully', async () => {
                MockedDatabaseService.client.notification.findMany.mockRejectedValue(new Error('Database error'));
                const result = await notification_service_1.NotificationService.getUserNotifications('user-123');
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('GET_NOTIFICATIONS_FAILED');
                expect(logger_1.logger.error).toHaveBeenCalledWith('Failed to get user notifications', expect.any(Error), expect.any(Object));
            });
        });
    });
    describe('Notification Preferences', () => {
        describe('updateNotificationPreferences', () => {
            const updatedPreferences = {
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
                MockedCache.get.mockResolvedValue(JSON.stringify(mockPreferences));
                MockedDatabaseService.client.user.update.mockResolvedValue({
                    ...mockUser,
                    notificationPreferences: JSON.stringify({ ...mockPreferences, ...updatedPreferences })
                });
            });
            it('should update notification preferences successfully', async () => {
                const result = await notification_service_1.NotificationService.updateNotificationPreferences('user-123', updatedPreferences);
                expect(result.success).toBe(true);
                expect(result.data?.channels.email).toBe(false);
                expect(result.data?.channels.sms).toBe(true);
                expect(MockedDatabaseService.client.user.update).toHaveBeenCalledWith({
                    where: { id: 'user-123' },
                    data: {
                        notificationPreferences: JSON.stringify({ ...mockPreferences, ...updatedPreferences })
                    }
                });
            });
            it('should update cache after saving preferences', async () => {
                await notification_service_1.NotificationService.updateNotificationPreferences('user-123', updatedPreferences);
                expect(MockedCache.setex).toHaveBeenCalledWith('notification_preferences:user-123', 3600, JSON.stringify({ ...mockPreferences, ...updatedPreferences }));
            });
            it('should handle database errors when updating preferences', async () => {
                MockedDatabaseService.client.user.update.mockRejectedValue(new Error('Database error'));
                const result = await notification_service_1.NotificationService.updateNotificationPreferences('user-123', updatedPreferences);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('PREFERENCES_UPDATE_FAILED');
                expect(logger_1.logger.error).toHaveBeenCalledWith('Failed to update notification preferences', expect.any(Error), expect.any(Object));
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
                MockedDatabaseService.client.notification.findMany.mockResolvedValue(mockAnalyticsNotifications);
            });
            it('should get notification analytics successfully', async () => {
                const filters = {
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2024-01-31')
                };
                const result = await notification_service_1.NotificationService.getNotificationAnalytics(filters);
                expect(result.success).toBe(true);
                expect(result.data?.totalSent).toBe(3);
                expect(result.data?.totalDelivered).toBe(2);
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
                await notification_service_1.NotificationService.getNotificationAnalytics(filters);
                expect(MockedDatabaseService.client.notification.findMany).toHaveBeenCalledWith({
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
                const result = await notification_service_1.NotificationService.getNotificationAnalytics(filters);
                expect(result.success).toBe(true);
                expect(result.data?.channelStats.push.sent).toBe(2);
                expect(result.data?.channelStats.push.delivered).toBe(2);
                expect(result.data?.channelStats.email.sent).toBe(2);
                expect(result.data?.channelStats.email.delivered).toBe(1);
                expect(result.data?.channelStats.email.failed).toBe(1);
            });
            it('should handle database errors in analytics', async () => {
                MockedDatabaseService.client.notification.findMany.mockRejectedValue(new Error('Database error'));
                const filters = {
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2024-01-31')
                };
                const result = await notification_service_1.NotificationService.getNotificationAnalytics(filters);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('ANALYTICS_FAILED');
                expect(logger_1.logger.error).toHaveBeenCalledWith('Failed to get notification analytics', expect.any(Error), expect.any(Object));
            });
        });
    });
    describe('Template and Channel Management', () => {
        beforeEach(() => {
            MockedDatabaseService.client.notification.create.mockResolvedValue(mockNotification);
            MockedDatabaseService.client.notification.update.mockResolvedValue({
                ...mockNotification,
                status: 'sent',
                sentAt: new Date()
            });
            MockedDatabaseService.client.notification.count.mockResolvedValue(5);
        });
        describe('Template Processing', () => {
            it('should process template variables correctly', async () => {
                MockedCache.get.mockImplementation((key) => {
                    if (key.includes('notification_template:')) {
                        return Promise.resolve(JSON.stringify(mockTemplate));
                    }
                    if (key.includes('notification_preferences:')) {
                        return Promise.resolve(JSON.stringify(mockPreferences));
                    }
                    return Promise.resolve(null);
                });
                const request = {
                    templateId: 'order_confirmation',
                    recipientId: 'user-123',
                    recipientType: 'parent',
                    variables: { orderId: 'ORD-123', totalAmount: '150.00', deliveryDate: '2024-01-15' }
                };
                const result = await notification_service_1.NotificationService.sendNotification(request);
                expect(result.success).toBe(true);
                expect(MockedDatabaseService.client.notification.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({
                        variables: JSON.stringify(request.variables)
                    })
                });
            });
        });
        describe('Channel Determination', () => {
            beforeEach(() => {
                jest.clearAllMocks();
                MockedDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
                MockedDatabaseService.client.notification.create.mockResolvedValue(mockNotification);
                MockedDatabaseService.client.notification.update.mockResolvedValue({
                    ...mockNotification,
                    status: 'sent',
                    sentAt: new Date()
                });
                MockedDatabaseService.client.notification.count.mockResolvedValue(5);
            });
            it('should determine available channels based on template and preferences', async () => {
                const limitedPreferences = {
                    ...mockPreferences,
                    channels: {
                        push: true,
                        email: false,
                        sms: true,
                        whatsapp: true,
                        in_app: false,
                        socket: false
                    }
                };
                MockedCache.get.mockImplementation((key) => {
                    if (key.includes('notification_template:')) {
                        return Promise.resolve(JSON.stringify(mockTemplate));
                    }
                    if (key.includes('notification_preferences:')) {
                        return Promise.resolve(JSON.stringify(limitedPreferences));
                    }
                    return Promise.resolve(null);
                });
                const request = {
                    templateId: 'order_confirmation',
                    recipientId: 'user-123',
                    recipientType: 'parent'
                };
                const result = await notification_service_1.NotificationService.sendNotification(request);
                expect(result.success).toBe(true);
                const createdNotification = MockedDatabaseService.client.notification.create.mock.calls[0][0];
                const channels = JSON.parse(createdNotification.data.channels);
                expect(channels).toEqual(['push', 'whatsapp']);
            });
            it('should respect requested channels when provided', async () => {
                MockedCache.get.mockImplementation((key) => {
                    if (key.includes('notification_template:')) {
                        return Promise.resolve(JSON.stringify(mockTemplate));
                    }
                    if (key.includes('notification_preferences:')) {
                        return Promise.resolve(JSON.stringify(mockPreferences));
                    }
                    return Promise.resolve(null);
                });
                const request = {
                    templateId: 'order_confirmation',
                    recipientId: 'user-123',
                    recipientType: 'parent',
                    channels: ['push', 'email']
                };
                const result = await notification_service_1.NotificationService.sendNotification(request);
                expect(result.success).toBe(true);
                const createdNotification = MockedDatabaseService.client.notification.create.mock.calls[0][0];
                const channels = JSON.parse(createdNotification.data.channels);
                expect(channels).toEqual(['push', 'email']);
            });
        });
        describe('Quiet Hours Management', () => {
            it('should detect quiet hours correctly', async () => {
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
                MockedCache.get.mockImplementation((key) => {
                    if (key.includes('notification_template:')) {
                        return Promise.resolve(JSON.stringify(mockTemplate));
                    }
                    if (key.includes('notification_preferences:')) {
                        return Promise.resolve(JSON.stringify(quietHoursPreferences));
                    }
                    return Promise.resolve(null);
                });
                const request = {
                    templateId: 'order_confirmation',
                    recipientId: 'user-123',
                    recipientType: 'parent',
                    priority: 'normal'
                };
                const result = await notification_service_1.NotificationService.sendNotification(request);
                expect(result.success).toBe(true);
                expect(logger_1.logger.info).toHaveBeenCalledWith('Scheduling notification after quiet hours', expect.any(Object));
                jest.useRealTimers();
            });
            it('should calculate post-quiet hours time correctly', async () => {
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
                MockedCache.get.mockImplementation((key) => {
                    if (key.includes('notification_template:')) {
                        return Promise.resolve(JSON.stringify(mockTemplate));
                    }
                    if (key.includes('notification_preferences:')) {
                        return Promise.resolve(JSON.stringify(quietHoursPreferences));
                    }
                    return Promise.resolve(null);
                });
                const request = {
                    templateId: 'order_confirmation',
                    recipientId: 'user-123',
                    recipientType: 'parent',
                    priority: 'normal'
                };
                const result = await notification_service_1.NotificationService.sendNotification(request);
                expect(result.success).toBe(true);
                expect(logger_1.logger.info).toHaveBeenCalledWith('Scheduling notification after quiet hours', expect.objectContaining({
                    newSchedule: expect.any(Date)
                }));
                jest.useRealTimers();
            });
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle cache failures gracefully', async () => {
            MockedCache.get.mockImplementation((key) => {
                if (key.includes('notification_template:')) {
                    return Promise.resolve(null);
                }
                if (key.includes('notification_preferences:')) {
                    return Promise.resolve(null);
                }
                return Promise.resolve(null);
            });
            MockedDatabaseService.client.user.findUnique.mockResolvedValue({
                ...mockUser,
                notificationPreferences: JSON.stringify(mockPreferences)
            });
            const request = {
                templateId: 'order_confirmation',
                recipientId: 'user-123',
                recipientType: 'parent'
            };
            MockedDatabaseService.client.notification.create.mockResolvedValue(mockNotification);
            MockedDatabaseService.client.notification.update.mockResolvedValue({
                ...mockNotification,
                status: 'sent'
            });
            MockedDatabaseService.client.notification.count.mockResolvedValue(5);
            const result = await notification_service_1.NotificationService.sendNotification(request);
            expect(result.success).toBe(true);
        });
        it('should handle missing user preferences gracefully', async () => {
            MockedCache.get.mockResolvedValue(null);
            MockedDatabaseService.client.user.findUnique.mockResolvedValue({
                ...mockUser,
                notificationPreferences: null
            });
            const request = {
                templateId: 'order_confirmation',
                recipientId: 'user-123',
                recipientType: 'parent'
            };
            MockedDatabaseService.client.notification.create.mockResolvedValue(mockNotification);
            MockedDatabaseService.client.notification.update.mockResolvedValue({
                ...mockNotification,
                status: 'sent'
            });
            MockedDatabaseService.client.notification.count.mockResolvedValue(5);
            const result = await notification_service_1.NotificationService.sendNotification(request);
            expect(result.success).toBe(true);
        });
        it('should handle empty analytics data gracefully', async () => {
            MockedDatabaseService.client.notification.findMany.mockResolvedValue([]);
            const filters = {
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            };
            const result = await notification_service_1.NotificationService.getNotificationAnalytics(filters);
            expect(result.success).toBe(true);
            expect(result.data?.totalSent).toBe(0);
            expect(result.data?.deliveryRate).toBe(0);
            expect(result.data?.readRate).toBe(0);
        });
        it('should handle concurrent notification sending', async () => {
            jest.clearAllMocks();
            MockedCache.get.mockImplementation((key) => {
                if (key.includes('notification_template:')) {
                    return Promise.resolve(JSON.stringify(mockTemplate));
                }
                if (key.includes('notification_preferences:')) {
                    return Promise.resolve(JSON.stringify(mockPreferences));
                }
                return Promise.resolve(null);
            });
            MockedDatabaseService.client.notification.create.mockResolvedValue(mockNotification);
            MockedDatabaseService.client.notification.update.mockResolvedValue({
                ...mockNotification,
                status: 'sent'
            });
            MockedDatabaseService.client.notification.count.mockResolvedValue(5);
            const request = {
                templateId: 'order_confirmation',
                recipientId: 'user-123',
                recipientType: 'parent'
            };
            const promises = Array.from({ length: 5 }, () => notification_service_1.NotificationService.sendNotification(request));
            const results = await Promise.all(promises);
            expect(results.every(r => r.success)).toBe(true);
            expect(MockedDatabaseService.client.notification.create).toHaveBeenCalledTimes(5);
        });
    });
});
//# sourceMappingURL=notification.service.test.js.map