"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NODE_ENV = 'test';
process.env.SKIP_DATABASE_TESTS = 'true';
process.env.SKIP_REDIS_TESTS = 'true';
jest.mock('@shared/database.service', () => ({
    DatabaseService: {
        getInstance: jest.fn(() => ({
            connect: jest.fn(),
            disconnect: jest.fn(),
            isHealthy: jest.fn().mockResolvedValue(true)
        }))
    }
}));
jest.mock('@services/redis.service');
jest.mock('@/utils/logger');
jest.mock('@/utils/cache');
const notification_service_1 = require("../../../src/services/notification.service");
const database_service_1 = require("@shared/database.service");
const logger_1 = require("@/utils/logger");
const cache_1 = require("@/utils/cache");
const mockDatabaseService = database_service_1.DatabaseService;
const mockLogger = logger_1.logger;
const mockCache = cache_1.cache;
describe('NotificationService - Clean ESM Test', () => {
    let mockDatabaseInstance;
    beforeEach(() => {
        jest.clearAllMocks();
        mockDatabaseInstance = mockDatabaseService.getInstance();
        mockCache.get.mockResolvedValue(null);
        mockCache.setex.mockResolvedValue(undefined);
        mockDatabaseInstance.connect.mockResolvedValue(undefined);
        mockDatabaseInstance.disconnect.mockResolvedValue(undefined);
        mockDatabaseInstance.isHealthy.mockResolvedValue(true);
    });
    test('should verify mock setup is working correctly', async () => {
        const dbInstance = database_service_1.DatabaseService.getInstance();
        expect(dbInstance).toBeDefined();
        expect(dbInstance.connect).toBeDefined();
        expect(typeof dbInstance.connect).toBe('function');
    });
    test('should send notification with mocked database', async () => {
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
        mockCache.get.mockImplementation((key) => {
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
        const request = {
            templateId: 'order_confirmation',
            recipientId: 'user-123',
            recipientType: 'parent',
            channels: ['push', 'email'],
            variables: { orderId: 'ORD-123' },
            priority: 'normal'
        };
        const result = await notification_service_1.NotificationService.sendNotification(request);
        expect(result).toEqual(expect.objectContaining({
            success: true
        }));
        expect(mockDatabaseInstance.connect).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('Notification sent successfully', expect.any(Object));
    });
    test('should handle errors gracefully', async () => {
        mockCache.get.mockImplementation((key) => {
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
        mockDatabaseInstance.connect.mockRejectedValue(new Error('Mock database error'));
        const request = {
            templateId: 'test_template',
            recipientId: 'user-123',
            recipientType: 'parent'
        };
        const result = await notification_service_1.NotificationService.sendNotification(request);
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('NOTIFICATION_SEND_FAILED');
        expect(mockLogger.error).toHaveBeenCalledWith('Failed to send notification', expect.any(Error), expect.any(Object));
    });
});
//# sourceMappingURL=notification.service.clean.test.js.map