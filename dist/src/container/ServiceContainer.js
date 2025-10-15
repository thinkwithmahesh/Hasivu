"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetContainers = exports.getTestContainer = exports.getProductionContainer = exports.ServiceContainer = void 0;
const order_repository_1 = require("../repositories/order.repository");
const orderItem_repository_1 = require("../repositories/orderItem.repository");
const menuItem_repository_1 = require("../repositories/menuItem.repository");
const user_repository_1 = require("../repositories/user.repository");
const paymentOrder_repository_1 = require("../repositories/paymentOrder.repository");
const database_service_1 = require("../services/database.service");
const notification_service_1 = require("../services/notification.service");
const payment_service_1 = require("../services/payment.service");
const redis_service_1 = require("../services/redis.service");
class ServiceContainer {
    orderRepository;
    orderItemRepository;
    menuItemRepository;
    userRepository;
    paymentOrderRepository;
    databaseService;
    notificationService;
    paymentService;
    redisService;
    constructor(dependencies) {
        this.orderRepository = dependencies.orderRepository;
        this.orderItemRepository = dependencies.orderItemRepository;
        this.menuItemRepository = dependencies.menuItemRepository;
        this.userRepository = dependencies.userRepository;
        this.paymentOrderRepository = dependencies.paymentOrderRepository;
        this.databaseService = dependencies.databaseService;
        this.notificationService = dependencies.notificationService;
        this.paymentService = dependencies.paymentService;
        this.redisService = dependencies.redisService;
    }
    static createProductionContainer() {
        return new ServiceContainer({
            orderRepository: order_repository_1.OrderRepository,
            orderItemRepository: orderItem_repository_1.OrderItemRepository,
            menuItemRepository: menuItem_repository_1.MenuItemRepository,
            userRepository: user_repository_1.UserRepository,
            paymentOrderRepository: paymentOrder_repository_1.PaymentOrderRepository,
            databaseService: database_service_1.DatabaseService.getInstance(),
            notificationService: notification_service_1.NotificationService,
            paymentService: payment_service_1.PaymentService,
            redisService: redis_service_1.RedisService,
        });
    }
    static createTestContainer(overrides = {}) {
        const mockDependencies = {
            orderRepository: createMockOrderRepository(),
            orderItemRepository: createMockOrderItemRepository(),
            menuItemRepository: createMockMenuItemRepository(),
            userRepository: createMockUserRepository(),
            paymentOrderRepository: createMockPaymentOrderRepository(),
            databaseService: createMockDatabaseService(),
            notificationService: createMockNotificationService(),
            paymentService: createMockPaymentService(),
            redisService: createMockRedisService(),
            ...overrides,
        };
        return new ServiceContainer(mockDependencies);
    }
}
exports.ServiceContainer = ServiceContainer;
function createMockOrderRepository() {
    return {
        create: jest.fn().mockResolvedValue({ id: 'order-1', status: 'pending' }),
        findById: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
        update: jest.fn().mockResolvedValue({ id: 'order-1' }),
        delete: jest.fn().mockResolvedValue({ id: 'order-1' }),
        count: jest.fn().mockResolvedValue(0),
        findByIdWithIncludes: jest.fn().mockResolvedValue(null),
        findByStudentId: jest.fn().mockResolvedValue({ items: [], total: 0 }),
        findBySchoolId: jest.fn().mockResolvedValue({ items: [], total: 0 }),
        findActiveOrders: jest.fn().mockResolvedValue({ items: [], total: 0 }),
        findByDeliveryDate: jest.fn().mockResolvedValue({ items: [], total: 0 }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        getAnalytics: jest.fn().mockResolvedValue({
            totalOrders: 0,
            totalRevenue: 0,
            deliveredOrders: 0,
            cancelledOrders: 0,
            ordersByStatus: {},
            revenueByDay: [],
        }),
        getDashboardStats: jest.fn().mockResolvedValue({
            todayOrders: 0,
            pendingOrders: 0,
            completedOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
        }),
    };
}
function createMockOrderItemRepository() {
    return {
        create: jest.fn().mockResolvedValue({ id: 'item-1' }),
        findById: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
        update: jest.fn().mockResolvedValue({ id: 'item-1' }),
        delete: jest.fn().mockResolvedValue({ id: 'item-1' }),
        count: jest.fn().mockResolvedValue(0),
        findByOrderId: jest.fn().mockResolvedValue([]),
        getPopularItems: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
    };
}
function createMockMenuItemRepository() {
    return {
        create: jest.fn().mockResolvedValue({ id: 'menu-1', name: 'Test Item' }),
        findById: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
        update: jest.fn().mockResolvedValue({ id: 'menu-1' }),
        delete: jest.fn().mockResolvedValue({ id: 'menu-1' }),
        count: jest.fn().mockResolvedValue(0),
        nameExists: jest.fn().mockResolvedValue(false),
        findBySchoolId: jest.fn().mockResolvedValue({ items: [], total: 0 }),
        findAvailable: jest.fn().mockResolvedValue([]),
        search: jest.fn().mockResolvedValue([]),
        updateAvailability: jest.fn().mockResolvedValue({ id: 'menu-1', available: true }),
    };
}
function createMockUserRepository() {
    return {
        create: jest.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com' }),
        findById: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
        update: jest.fn().mockResolvedValue({ id: 'user-1' }),
        delete: jest.fn().mockResolvedValue({ id: 'user-1' }),
        count: jest.fn().mockResolvedValue(0),
        findByEmail: jest.fn().mockResolvedValue(null),
        findByPhone: jest.fn().mockResolvedValue(null),
        emailExists: jest.fn().mockResolvedValue(false),
        phoneExists: jest.fn().mockResolvedValue(false),
        findStudentsByParentId: jest.fn().mockResolvedValue([]),
        findByRole: jest.fn().mockResolvedValue([]),
        updateLastLogin: jest.fn().mockResolvedValue({ id: 'user-1' }),
        deactivateUser: jest.fn().mockResolvedValue({ id: 'user-1' }),
    };
}
function createMockPaymentOrderRepository() {
    return {
        create: jest.fn().mockResolvedValue({ id: 'payment-1', status: 'pending' }),
        findById: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
        update: jest.fn().mockResolvedValue({ id: 'payment-1' }),
        delete: jest.fn().mockResolvedValue({ id: 'payment-1' }),
        count: jest.fn().mockResolvedValue(0),
        findByOrderId: jest.fn().mockResolvedValue(null),
        findByRazorpayOrderId: jest.fn().mockResolvedValue(null),
        findByUserId: jest.fn().mockResolvedValue({ items: [], total: 0 }),
        findExpiredOrders: jest.fn().mockResolvedValue([]),
        updateStatus: jest.fn().mockResolvedValue({ id: 'payment-1', status: 'captured' }),
    };
}
function createMockDatabaseService() {
    return {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getHealth: jest.fn().mockResolvedValue({
            status: 'healthy',
            responseTime: 50,
            connections: {},
            performance: {},
            tables: [],
            errors: [],
            timestamp: new Date(),
        }),
        transaction: jest.fn().mockImplementation(callback => callback({})),
        executeRaw: jest.fn().mockResolvedValue({}),
        sanitizeQuery: jest.fn().mockImplementation(query => query),
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        order: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        menuItem: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        orderItem: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        paymentOrder: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        rfidCard: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        rfidReader: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        deliveryVerification: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        notification: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        whatsAppMessage: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };
}
function createMockNotificationService() {
    return {
        sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
        sendOrderStatusUpdate: jest.fn().mockResolvedValue(undefined),
    };
}
function createMockPaymentService() {
    return {
        processPayment: jest.fn().mockResolvedValue({
            success: true,
            data: {
                paymentId: 'payment-123',
                status: 'captured',
            },
        }),
    };
}
function createMockRedisService() {
    return {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
    };
}
let productionContainer = null;
let testContainer = null;
function getProductionContainer() {
    if (!productionContainer) {
        productionContainer = ServiceContainer.createProductionContainer();
    }
    return productionContainer;
}
exports.getProductionContainer = getProductionContainer;
function getTestContainer(overrides) {
    testContainer = ServiceContainer.createTestContainer(overrides);
    return testContainer;
}
exports.getTestContainer = getTestContainer;
function resetContainers() {
    productionContainer = null;
    testContainer = null;
}
exports.resetContainers = resetContainers;
//# sourceMappingURL=ServiceContainer.js.map