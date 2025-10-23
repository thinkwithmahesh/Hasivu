"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetAllMocks = exports.MockedLogger = exports.MockedCacheService = exports.MockedPaymentRepository = exports.MockedOrderRepository = exports.MockedUserRepository = exports.MockedMenuItemRepository = exports.MockedDailyMenuRepository = exports.createMockLogger = exports.createMockCacheService = exports.createMockPaymentRepository = exports.createMockOrderRepository = exports.createMockUserRepository = exports.createMockMenuItemRepository = exports.createMockDailyMenuRepository = exports.createMockRepository = void 0;
const globals_1 = require("@jest/globals");
function createMockRepository() {
    return {
        findById: globals_1.jest.fn(),
        findByIdOrThrow: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
        findAll: globals_1.jest.fn(),
        findOne: globals_1.jest.fn(),
        findByDateRange: globals_1.jest.fn(),
        findBySchoolId: globals_1.jest.fn(),
        findByUserId: globals_1.jest.fn(),
        findByEmail: globals_1.jest.fn(),
        create: globals_1.jest.fn(),
        createMany: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        updateMany: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        deleteMany: globals_1.jest.fn(),
        softDelete: globals_1.jest.fn(),
        count: globals_1.jest.fn(),
        exists: globals_1.jest.fn(),
        transaction: globals_1.jest.fn((callback) => callback()),
        reset() {
            Object.keys(this).forEach(key => {
                if (typeof this[key] === 'function' && this[key].mockReset) {
                    this[key].mockReset();
                }
            });
        }
    };
}
exports.createMockRepository = createMockRepository;
function createMockDailyMenuRepository() {
    return {
        ...createMockRepository(),
        findByDate: globals_1.jest.fn(),
        findBySchoolAndDate: globals_1.jest.fn(),
        findByDateRange: globals_1.jest.fn(),
        findByIdWithItems: globals_1.jest.fn(),
        cloneMenu: globals_1.jest.fn(),
        getWeeklyPlan: globals_1.jest.fn(),
    };
}
exports.createMockDailyMenuRepository = createMockDailyMenuRepository;
function createMockMenuItemRepository() {
    return {
        ...createMockRepository(),
        findAvailable: globals_1.jest.fn(),
        findByCategory: globals_1.jest.fn(),
        updateAvailability: globals_1.jest.fn(),
        bulkUpdatePrices: globals_1.jest.fn(),
    };
}
exports.createMockMenuItemRepository = createMockMenuItemRepository;
function createMockUserRepository() {
    return {
        ...createMockRepository(),
        findByEmail: globals_1.jest.fn(),
        findByPhone: globals_1.jest.fn(),
        findByRole: globals_1.jest.fn(),
        updatePassword: globals_1.jest.fn(),
        verifyEmail: globals_1.jest.fn(),
    };
}
exports.createMockUserRepository = createMockUserRepository;
function createMockOrderRepository() {
    return {
        ...createMockRepository(),
        findByUserId: globals_1.jest.fn(),
        findByStatus: globals_1.jest.fn(),
        findByDateRange: globals_1.jest.fn(),
        updateStatus: globals_1.jest.fn(),
        cancelOrder: globals_1.jest.fn(),
    };
}
exports.createMockOrderRepository = createMockOrderRepository;
function createMockPaymentRepository() {
    return {
        ...createMockRepository(),
        findByOrderId: globals_1.jest.fn(),
        findByStatus: globals_1.jest.fn(),
        findByGateway: globals_1.jest.fn(),
        updateStatus: globals_1.jest.fn(),
        recordRefund: globals_1.jest.fn(),
    };
}
exports.createMockPaymentRepository = createMockPaymentRepository;
function createMockCacheService() {
    return {
        get: globals_1.jest.fn(),
        set: globals_1.jest.fn(),
        del: globals_1.jest.fn(),
        clear: globals_1.jest.fn(),
        exists: globals_1.jest.fn(),
        expire: globals_1.jest.fn(),
        ttl: globals_1.jest.fn(),
        keys: globals_1.jest.fn(),
        mget: globals_1.jest.fn(),
        mset: globals_1.jest.fn(),
        incr: globals_1.jest.fn(),
        decr: globals_1.jest.fn(),
    };
}
exports.createMockCacheService = createMockCacheService;
function createMockLogger() {
    return {
        info: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        debug: globals_1.jest.fn(),
        child: globals_1.jest.fn().mockReturnThis(),
    };
}
exports.createMockLogger = createMockLogger;
exports.MockedDailyMenuRepository = createMockDailyMenuRepository();
exports.MockedMenuItemRepository = createMockMenuItemRepository();
exports.MockedUserRepository = createMockUserRepository();
exports.MockedOrderRepository = createMockOrderRepository();
exports.MockedPaymentRepository = createMockPaymentRepository();
exports.MockedCacheService = createMockCacheService();
exports.MockedLogger = createMockLogger();
function resetAllMocks() {
    exports.MockedDailyMenuRepository.reset?.();
    exports.MockedMenuItemRepository.reset?.();
    exports.MockedUserRepository.reset?.();
    exports.MockedOrderRepository.reset?.();
    exports.MockedPaymentRepository.reset?.();
    Object.values(exports.MockedCacheService).forEach(mock => {
        if (typeof mock === 'function' && mock.mockReset) {
            mock.mockReset();
        }
    });
    Object.values(exports.MockedLogger).forEach(mock => {
        if (typeof mock === 'function' && mock.mockReset) {
            mock.mockReset();
        }
    });
}
exports.resetAllMocks = resetAllMocks;
//# sourceMappingURL=repository.mock.js.map