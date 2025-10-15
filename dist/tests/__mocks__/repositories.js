"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.cache = exports.MenuItemRepository = exports.DailyMenuRepository = void 0;
const globals_1 = require("@jest/globals");
const repository_mock_1 = require("../mocks/repository.mock");
exports.DailyMenuRepository = (0, repository_mock_1.createMockDailyMenuRepository)();
exports.MenuItemRepository = (0, repository_mock_1.createMockMenuItemRepository)();
globals_1.jest.mock('@/repositories/dailyMenu.repository', () => ({
    DailyMenuRepository: (0, repository_mock_1.createMockDailyMenuRepository)()
}));
globals_1.jest.mock('@/repositories/menuItem.repository', () => ({
    MenuItemRepository: (0, repository_mock_1.createMockMenuItemRepository)()
}));
exports.cache = {
    get: globals_1.jest.fn(),
    set: globals_1.jest.fn(),
    setex: globals_1.jest.fn(),
    del: globals_1.jest.fn(),
    clear: globals_1.jest.fn(),
    exists: globals_1.jest.fn(),
    expire: globals_1.jest.fn(),
    ttl: globals_1.jest.fn(),
};
globals_1.jest.mock('@/utils/cache', () => ({
    cache: {
        get: globals_1.jest.fn(),
        set: globals_1.jest.fn(),
        setex: globals_1.jest.fn(),
        del: globals_1.jest.fn(),
        clear: globals_1.jest.fn(),
        exists: globals_1.jest.fn(),
        expire: globals_1.jest.fn(),
        ttl: globals_1.jest.fn(),
    }
}));
exports.logger = {
    info: globals_1.jest.fn(),
    warn: globals_1.jest.fn(),
    error: globals_1.jest.fn(),
    debug: globals_1.jest.fn(),
    child: globals_1.jest.fn().mockReturnThis(),
};
globals_1.jest.mock('@/utils/logger', () => ({
    logger: {
        info: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        debug: globals_1.jest.fn(),
        child: globals_1.jest.fn().mockReturnThis(),
    }
}));
//# sourceMappingURL=repositories.js.map