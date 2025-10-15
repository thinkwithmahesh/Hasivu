"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NODE_ENV = 'test';
process.env.SKIP_DATABASE_TESTS = 'true';
process.env.SKIP_REDIS_TESTS = 'true';
const globals_1 = require("@jest/globals");
const mockNotificationCreate = globals_1.jest.fn();
const mockNotificationUpdate = globals_1.jest.fn();
const mockUserFindUnique = globals_1.jest.fn();
const mockExecuteOperation = globals_1.jest.fn();
const mockGetInstance = globals_1.jest.fn(() => ({
    executeOperation: mockExecuteOperation,
    connect: globals_1.jest.fn(),
    disconnect: globals_1.jest.fn(),
    isHealthy: globals_1.jest.fn().mockResolvedValue(true)
}));
globals_1.jest.unstable_mockModule('@shared/database.service', () => ({
    DatabaseService: {
        getInstance: mockGetInstance
    }
}));
const mockCacheGet = globals_1.jest.fn();
const mockCacheSetex = globals_1.jest.fn();
const mockCacheDel = globals_1.jest.fn();
globals_1.jest.unstable_mockModule('@/utils/cache', () => ({
    cache: {
        get: mockCacheGet,
        set: globals_1.jest.fn(),
        setex: mockCacheSetex,
        del: mockCacheDel,
        exists: globals_1.jest.fn(),
        clear: globals_1.jest.fn(),
        size: globals_1.jest.fn()
    }
}));
const mockLoggerInfo = globals_1.jest.fn();
const mockLoggerError = globals_1.jest.fn();
globals_1.jest.unstable_mockModule('@/utils/logger', () => ({
    logger: {
        info: mockLoggerInfo,
        error: mockLoggerError,
        warn: globals_1.jest.fn(),
        debug: globals_1.jest.fn()
    }
}));
globals_1.jest.unstable_mockModule('@services/redis.service', () => ({
    RedisService: {
        get: globals_1.jest.fn(),
        set: globals_1.jest.fn(),
        setex: globals_1.jest.fn(),
        del: globals_1.jest.fn()
    }
}));
let NotificationService;
(0, globals_1.beforeAll)(async () => {
    const notificationModule = await Promise.resolve().then(() => __importStar(require('../../../src/services/notification.service')));
    NotificationService = notificationModule.NotificationService;
});
(0, globals_1.describe)('NotificationService - Final Isolated Test', () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        mockCacheGet.mockResolvedValue(null);
        mockCacheSetex.mockResolvedValue(undefined);
        mockUserFindUnique.mockResolvedValue({
            id: 'user-123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            notificationPreferences: null
        });
        mockExecuteOperation.mockImplementation(async (operation) => {
            const mockClient = {
                notification: {
                    create: mockNotificationCreate,
                    update: mockNotificationUpdate,
                    findFirst: globals_1.jest.fn(),
                    findMany: globals_1.jest.fn(),
                    count: globals_1.jest.fn()
                },
                user: {
                    findUnique: mockUserFindUnique,
                    update: globals_1.jest.fn()
                }
            };
            return operation(mockClient);
        });
    });
    (0, globals_1.test)('should successfully mock database operations', async () => {
        (0, globals_1.expect)(mockExecuteOperation).toBeDefined();
        (0, globals_1.expect)(typeof mockExecuteOperation).toBe('function');
        const result = await mockExecuteOperation(async (client) => client.user.findUnique({ where: { id: 'test' } }));
        (0, globals_1.expect)(result).toEqual({
            id: 'user-123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            notificationPreferences: null
        });
        (0, globals_1.expect)(mockExecuteOperation).toHaveBeenCalledTimes(1);
        (0, globals_1.expect)(mockUserFindUnique).toHaveBeenCalledWith({ where: { id: 'test' } });
    });
    (0, globals_1.test)('should send notification with complete mocking', async () => {
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
        mockCacheGet.mockImplementation((key) => {
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
            recipientType: 'parent'
        };
        let result;
        try {
            result = await NotificationService.sendNotification(request);
            console.log('Notification result:', result);
        }
        catch (error) {
            console.log('Direct error caught:', error);
            result = { success: false, error: { code: 'DIRECT_ERROR', message: error.message } };
        }
        (0, globals_1.expect)(result).toEqual(globals_1.expect.objectContaining({
            success: true
        }));
        (0, globals_1.expect)(mockExecuteOperation).toHaveBeenCalled();
        (0, globals_1.expect)(mockNotificationCreate).toHaveBeenCalled();
        (0, globals_1.expect)(mockLoggerInfo).toHaveBeenCalledWith('Notification sent successfully', globals_1.expect.any(Object));
    });
    (0, globals_1.test)('should handle notification errors properly', async () => {
        mockCacheGet.mockImplementation((key) => {
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
        mockExecuteOperation.mockRejectedValue(new Error('Mock database error'));
        const request = {
            templateId: 'test_template',
            recipientId: 'user-123',
            recipientType: 'parent'
        };
        const result = await NotificationService.sendNotification(request);
        (0, globals_1.expect)(result.success).toBe(false);
        (0, globals_1.expect)(result.error?.code).toBe('NOTIFICATION_SEND_FAILED');
        (0, globals_1.expect)(mockLoggerError).toHaveBeenCalledWith('Failed to send notification', globals_1.expect.any(Error), globals_1.expect.any(Object));
    });
});
//# sourceMappingURL=notification.service.final.test.js.map