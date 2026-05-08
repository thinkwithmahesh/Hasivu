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

type MockFn = ((...args: any[]) => any) & {
  mockResolvedValue: (value: any) => MockFn;
  mockImplementation: (impl: (...args: any[]) => any) => MockFn;
};

/**
 * Lightweight test double helper so production builds do not depend on Jest runtime.
 */
function createMockFn(impl?: (...args: any[]) => any): MockFn {
  const fn = ((...args: any[]) => (fn.__impl ? fn.__impl(...args) : undefined)) as MockFn & {
    __impl?: (...args: any[]) => any;
  };
  fn.__impl = impl;
  fn.mockResolvedValue = (value: any) => {
    fn.__impl = async () => value;
    return fn;
  };
  fn.mockImplementation = (nextImpl: (...args: any[]) => any) => {
    fn.__impl = nextImpl;
    return fn;
  };
  return fn;
}

const mock = { fn: createMockFn };

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

function createMockOrderItemRepository(): IOrderItemRepository {
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

function createMockMenuItemRepository(): IMenuItemRepository {
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

function createMockUserRepository(): IUserRepository {
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

function createMockPaymentOrderRepository(): IPaymentOrderRepository {
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

function createMockDatabaseService(): IDatabaseService {
  return {
    connect: mock.fn().mockResolvedValue(undefined),
    disconnect: mock.fn().mockResolvedValue(undefined),
    getHealth: mock.fn().mockResolvedValue({
      status: 'healthy' as const,
      responseTime: 50,
      connections: {},
      performance: {},
      tables: [],
      errors: [],
      timestamp: new Date(),
    }),
    transaction: mock.fn().mockImplementation(callback => callback({})),
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

function createMockNotificationService(): INotificationService {
  return {
    sendOrderConfirmation: mock.fn().mockResolvedValue(undefined),
    sendOrderStatusUpdate: mock.fn().mockResolvedValue(undefined),
  };
}

function createMockPaymentService(): IPaymentService {
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

function createMockRedisService(): IRedisService {
  return {
    get: mock.fn().mockResolvedValue(null),
    set: mock.fn().mockResolvedValue('OK'),
    del: mock.fn().mockResolvedValue(1),
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
