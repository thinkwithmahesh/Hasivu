/**
 * Centralized Repository Mock Factory
 * Provides consistent mock implementations for all repository patterns
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock repository with all standard CRUD methods
 */
export function createMockRepository() {
  return {
    // Standard CRUD operations
    findById: jest.fn(),
    findByIdOrThrow: jest.fn(),
    findMany: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByDateRange: jest.fn(),
    findBySchoolId: jest.fn(),
    findByUserId: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
    exists: jest.fn(),

    // Transaction support
    transaction: jest.fn((callback: any) => callback()),

    // Reset all mocks
    reset() {
      Object.keys(this).forEach(key => {
        if (typeof this[key] === 'function' && this[key].mockReset) {
          this[key].mockReset();
        }
      });
    }
  };
}

/**
 * Creates a mock for DailyMenuRepository
 */
export function createMockDailyMenuRepository() {
  return {
    ...createMockRepository(),
    findByDate: jest.fn(),
    findBySchoolAndDate: jest.fn(),
    findByDateRange: jest.fn(),
    findByIdWithItems: jest.fn(),
    cloneMenu: jest.fn(),
    getWeeklyPlan: jest.fn(),
  };
}

/**
 * Creates a mock for MenuItemRepository
 */
export function createMockMenuItemRepository() {
  return {
    ...createMockRepository(),
    findAvailable: jest.fn(),
    findByCategory: jest.fn(),
    updateAvailability: jest.fn(),
    bulkUpdatePrices: jest.fn(),
  };
}

/**
 * Creates a mock for UserRepository
 */
export function createMockUserRepository() {
  return {
    ...createMockRepository(),
    findByEmail: jest.fn(),
    findByPhone: jest.fn(),
    findByRole: jest.fn(),
    updatePassword: jest.fn(),
    verifyEmail: jest.fn(),
  };
}

/**
 * Creates a mock for OrderRepository
 */
export function createMockOrderRepository() {
  return {
    ...createMockRepository(),
    findByUserId: jest.fn(),
    findByStatus: jest.fn(),
    findByDateRange: jest.fn(),
    updateStatus: jest.fn(),
    cancelOrder: jest.fn(),
  };
}

/**
 * Creates a mock for PaymentRepository
 */
export function createMockPaymentRepository() {
  return {
    ...createMockRepository(),
    findByOrderId: jest.fn(),
    findByStatus: jest.fn(),
    findByGateway: jest.fn(),
    updateStatus: jest.fn(),
    recordRefund: jest.fn(),
  };
}

/**
 * Creates a mock for cache service
 */
export function createMockCacheService() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    clear: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(),
    mget: jest.fn(),
    mset: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
  };
}

/**
 * Creates a mock logger
 */
export function createMockLogger() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

// Export instances ready to use
export const MockedDailyMenuRepository = createMockDailyMenuRepository();
export const MockedMenuItemRepository = createMockMenuItemRepository();
export const MockedUserRepository = createMockUserRepository();
export const MockedOrderRepository = createMockOrderRepository();
export const MockedPaymentRepository = createMockPaymentRepository();
export const MockedCacheService = createMockCacheService();
export const MockedLogger = createMockLogger();

// Reset all mocks utility
export function resetAllMocks() {
  MockedDailyMenuRepository.reset?.();
  MockedMenuItemRepository.reset?.();
  MockedUserRepository.reset?.();
  MockedOrderRepository.reset?.();
  MockedPaymentRepository.reset?.();

  // Reset cache service
  Object.values(MockedCacheService).forEach(mock => {
    if (typeof mock === 'function' && mock.mockReset) {
      mock.mockReset();
    }
  });

  // Reset logger
  Object.values(MockedLogger).forEach(mock => {
    if (typeof mock === 'function' && mock.mockReset) {
      mock.mockReset();
    }
  });
}
