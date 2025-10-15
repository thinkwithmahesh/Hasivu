/**
 * HASIVU Platform - Service Container
 * Service Layer Architecture Enhancement - Phase 2
 * Implements dependency injection container for service layer
 */

import {
  IOrderRepository,
  IOrderItemRepository,
  IMenuItemRepository,
  IUserRepository,
  IPaymentOrderRepository,
  IDatabaseService,
  INotificationService,
  IPaymentService,
  IRedisService,
} from '../interfaces/repository.interfaces';
import { OrderRepository } from '../repositories/order.repository';
import { OrderItemRepository } from '../repositories/orderItem.repository';
import { MenuItemRepository } from '../repositories/menuItem.repository';
import { UserRepository } from '../repositories/user.repository';
import { PaymentOrderRepository } from '../repositories/paymentOrder.repository';
import { DatabaseService } from '../services/database.service';
import { NotificationService } from '../services/notification.service';
import { PaymentService } from '../services/payment.service';
import { RedisService } from '../services/redis.service';

// Container interface for type safety
export interface IServiceContainer {
  // Repository dependencies
  orderRepository: IOrderRepository;
  orderItemRepository: IOrderItemRepository;
  menuItemRepository: IMenuItemRepository;
  userRepository: IUserRepository;
  paymentOrderRepository: IPaymentOrderRepository;

  // Service dependencies
  databaseService: IDatabaseService;
  notificationService: INotificationService;
  paymentService: IPaymentService;
  redisService: IRedisService;
}

/**
 * Service Container implementation using constructor injection pattern
 */
export class ServiceContainer implements IServiceContainer {
  public readonly orderRepository: IOrderRepository;
  public readonly orderItemRepository: IOrderItemRepository;
  public readonly menuItemRepository: IMenuItemRepository;
  public readonly userRepository: IUserRepository;
  public readonly paymentOrderRepository: IPaymentOrderRepository;

  public readonly databaseService: IDatabaseService;
  public readonly notificationService: INotificationService;
  public readonly paymentService: IPaymentService;
  public readonly redisService: IRedisService;

  constructor(dependencies: IServiceContainer) {
    // Repository injection
    this.orderRepository = dependencies.orderRepository;
    this.orderItemRepository = dependencies.orderItemRepository;
    this.menuItemRepository = dependencies.menuItemRepository;
    this.userRepository = dependencies.userRepository;
    this.paymentOrderRepository = dependencies.paymentOrderRepository;

    // Service injection
    this.databaseService = dependencies.databaseService;
    this.notificationService = dependencies.notificationService;
    this.paymentService = dependencies.paymentService;
    this.redisService = dependencies.redisService;
  }

  /**
   * Create service container with production dependencies
   */
  public static createProductionContainer(): ServiceContainer {
    return new ServiceContainer({
      orderRepository: OrderRepository as any,
      orderItemRepository: OrderItemRepository as any,
      menuItemRepository: MenuItemRepository as any,
      userRepository: UserRepository as any,
      paymentOrderRepository: PaymentOrderRepository as any,

      databaseService: DatabaseService.getInstance(),
      notificationService: NotificationService,
      paymentService: PaymentService,
      redisService: RedisService,
    });
  }

  /**
   * Create service container with test dependencies
   */
  public static createTestContainer(overrides: Partial<IServiceContainer> = {}): ServiceContainer {
    const mockDependencies: IServiceContainer = {
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

// Mock factory functions for testing
function createMockOrderRepository(): IOrderRepository {
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

function createMockOrderItemRepository(): IOrderItemRepository {
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

function createMockMenuItemRepository(): IMenuItemRepository {
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

function createMockUserRepository(): IUserRepository {
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

function createMockPaymentOrderRepository(): IPaymentOrderRepository {
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

function createMockDatabaseService(): IDatabaseService {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    getHealth: jest.fn().mockResolvedValue({
      status: 'healthy' as const,
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

function createMockNotificationService(): INotificationService {
  return {
    sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
    sendOrderStatusUpdate: jest.fn().mockResolvedValue(undefined),
  };
}

function createMockPaymentService(): IPaymentService {
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

function createMockRedisService(): IRedisService {
  return {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  };
}

// Global container instances
let productionContainer: ServiceContainer | null = null;
let testContainer: ServiceContainer | null = null;

/**
 * Get production container (singleton)
 */
export function getProductionContainer(): ServiceContainer {
  if (!productionContainer) {
    productionContainer = ServiceContainer.createProductionContainer();
  }
  return productionContainer;
}

/**
 * Get test container (singleton, replaceable for each test)
 */
export function getTestContainer(overrides?: Partial<IServiceContainer>): ServiceContainer {
  testContainer = ServiceContainer.createTestContainer(overrides);
  return testContainer;
}

/**
 * Reset containers (useful for testing)
 */
export function resetContainers(): void {
  productionContainer = null;
  testContainer = null;
}
