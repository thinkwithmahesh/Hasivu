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
function createMockFn(impl) {
    const fn = ((...args) => (fn.__impl ? fn.__impl(...args) : undefined));
    fn.__impl = impl;
    fn.mockResolvedValue = (value) => {
        fn.__impl = async () => value;
        return fn;
    };
    fn.mockImplementation = (nextImpl) => {
        fn.__impl = nextImpl;
        return fn;
    };
    return fn;
}
const mock = { fn: createMockFn };
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
        create: mock.fn().mockResolvedValue({ id: 'order-1', status: 'pending' }),
        findById: mock.fn().mockResolvedValue(null),
        findMany: mock.fn().mockResolvedValue({ items: [], total: 0 }),
        update: mock.fn().mockResolvedValue({ id: 'order-1' }),
        delete: mock.fn().mockResolvedValue({ id: 'order-1' }),
        count: mock.fn().mockResolvedValue(0),
        findByIdWithIncludes: mock.fn().mockResolvedValue(null),
        findByStudentId: mock.fn().mockResolvedValue({ items: [], total: 0 }),
        findBySchoolId: mock.fn().mockResolvedValue({ items: [], total: 0 }),
        findActiveOrders: mock.fn().mockResolvedValue({ items: [], total: 0 }),
        findByDeliveryDate: mock.fn().mockResolvedValue({ items: [], total: 0 }),
        updateMany: mock.fn().mockResolvedValue({ count: 0 }),
        getAnalytics: mock.fn().mockResolvedValue({
            totalOrders: 0,
            totalRevenue: 0,
            deliveredOrders: 0,
            cancelledOrders: 0,
            ordersByStatus: {},
            revenueByDay: [],
        }),
        getDashboardStats: mock.fn().mockResolvedValue({
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
        create: mock.fn().mockResolvedValue({ id: 'item-1' }),
        findById: mock.fn().mockResolvedValue(null),
        findMany: mock.fn().mockResolvedValue({ items: [], total: 0 }),
        update: mock.fn().mockResolvedValue({ id: 'item-1' }),
        delete: mock.fn().mockResolvedValue({ id: 'item-1' }),
        count: mock.fn().mockResolvedValue(0),
        findByOrderId: mock.fn().mockResolvedValue([]),
        getPopularItems: mock.fn().mockResolvedValue([]),
        createMany: mock.fn().mockResolvedValue({ count: 0 }),
    };
}
function createMockMenuItemRepository() {
    return {
        create: mock.fn().mockResolvedValue({ id: 'menu-1', name: 'Test Item' }),
        findById: mock.fn().mockResolvedValue(null),
        findMany: mock.fn().mockResolvedValue({ items: [], total: 0 }),
        update: mock.fn().mockResolvedValue({ id: 'menu-1' }),
        delete: mock.fn().mockResolvedValue({ id: 'menu-1' }),
        count: mock.fn().mockResolvedValue(0),
        nameExists: mock.fn().mockResolvedValue(false),
        findBySchoolId: mock.fn().mockResolvedValue({ items: [], total: 0 }),
        findAvailable: mock.fn().mockResolvedValue([]),
        search: mock.fn().mockResolvedValue([]),
        updateAvailability: mock.fn().mockResolvedValue({ id: 'menu-1', available: true }),
    };
}
function createMockUserRepository() {
    return {
        create: mock.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com' }),
        findById: mock.fn().mockResolvedValue(null),
        findMany: mock.fn().mockResolvedValue({ items: [], total: 0 }),
        update: mock.fn().mockResolvedValue({ id: 'user-1' }),
        delete: mock.fn().mockResolvedValue({ id: 'user-1' }),
        count: mock.fn().mockResolvedValue(0),
        findByEmail: mock.fn().mockResolvedValue(null),
        findByPhone: mock.fn().mockResolvedValue(null),
        emailExists: mock.fn().mockResolvedValue(false),
        phoneExists: mock.fn().mockResolvedValue(false),
        findStudentsByParentId: mock.fn().mockResolvedValue([]),
        findByRole: mock.fn().mockResolvedValue([]),
        updateLastLogin: mock.fn().mockResolvedValue({ id: 'user-1' }),
        deactivateUser: mock.fn().mockResolvedValue({ id: 'user-1' }),
    };
}
function createMockPaymentOrderRepository() {
    return {
        create: mock.fn().mockResolvedValue({ id: 'payment-1', status: 'pending' }),
        findById: mock.fn().mockResolvedValue(null),
        findMany: mock.fn().mockResolvedValue({ items: [], total: 0 }),
        update: mock.fn().mockResolvedValue({ id: 'payment-1' }),
        delete: mock.fn().mockResolvedValue({ id: 'payment-1' }),
        count: mock.fn().mockResolvedValue(0),
        findByOrderId: mock.fn().mockResolvedValue(null),
        findByRazorpayOrderId: mock.fn().mockResolvedValue(null),
        findByUserId: mock.fn().mockResolvedValue({ items: [], total: 0 }),
        findExpiredOrders: mock.fn().mockResolvedValue([]),
        updateStatus: mock.fn().mockResolvedValue({ id: 'payment-1', status: 'captured' }),
    };
}
function createMockDatabaseService() {
    return {
        connect: mock.fn().mockResolvedValue(undefined),
        disconnect: mock.fn().mockResolvedValue(undefined),
        getHealth: mock.fn().mockResolvedValue({
            status: 'healthy',
            responseTime: 50,
            connections: {},
            performance: {},
            tables: [],
            errors: [],
            timestamp: new Date(),
        }),
        transaction: mock.fn().mockImplementation(callback => callback({})),
        executeRaw: mock.fn().mockResolvedValue({}),
        sanitizeQuery: mock.fn().mockImplementation(query => query),
        user: {
            findUnique: mock.fn(),
            findMany: mock.fn(),
            create: mock.fn(),
            update: mock.fn(),
            delete: mock.fn(),
        },
        order: {
            findUnique: mock.fn(),
            findMany: mock.fn(),
            create: mock.fn(),
            update: mock.fn(),
            delete: mock.fn(),
        },
        menuItem: {
            findUnique: mock.fn(),
            findMany: mock.fn(),
            create: mock.fn(),
            update: mock.fn(),
            delete: mock.fn(),
        },
        orderItem: {
            findUnique: mock.fn(),
            findMany: mock.fn(),
            create: mock.fn(),
            update: mock.fn(),
            delete: mock.fn(),
        },
        paymentOrder: {
            findUnique: mock.fn(),
            findMany: mock.fn(),
            create: mock.fn(),
            update: mock.fn(),
            delete: mock.fn(),
        },
        rfidCard: {
            findUnique: mock.fn(),
            findMany: mock.fn(),
            create: mock.fn(),
            update: mock.fn(),
            delete: mock.fn(),
        },
        rfidReader: {
            findUnique: mock.fn(),
            findMany: mock.fn(),
            create: mock.fn(),
            update: mock.fn(),
            delete: mock.fn(),
        },
        deliveryVerification: {
            findUnique: mock.fn(),
            findMany: mock.fn(),
            create: mock.fn(),
            update: mock.fn(),
            delete: mock.fn(),
        },
        notification: {
            findUnique: mock.fn(),
            findMany: mock.fn(),
            create: mock.fn(),
            update: mock.fn(),
            delete: mock.fn(),
        },
        whatsAppMessage: {
            findUnique: mock.fn(),
            findMany: mock.fn(),
            create: mock.fn(),
            update: mock.fn(),
            delete: mock.fn(),
        },
    };
}
function createMockNotificationService() {
    return {
        sendOrderConfirmation: mock.fn().mockResolvedValue(undefined),
        sendOrderStatusUpdate: mock.fn().mockResolvedValue(undefined),
    };
}
function createMockPaymentService() {
    return {
        processPayment: mock.fn().mockResolvedValue({
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
        get: mock.fn().mockResolvedValue(null),
        set: mock.fn().mockResolvedValue('OK'),
        del: mock.fn().mockResolvedValue(1),
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