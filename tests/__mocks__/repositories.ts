/**
 * Global Repository Mocks
 * Auto-mocked repositories for testing
 */

import { jest } from '@jest/globals';
import { createMockDailyMenuRepository, createMockMenuItemRepository } from '../mocks/repository.mock';

// Create mock instances
export const DailyMenuRepository = createMockDailyMenuRepository();
export const MenuItemRepository = createMockMenuItemRepository();

// Mock the actual module paths
jest.mock('@/repositories/dailyMenu.repository', () => ({
  DailyMenuRepository: createMockDailyMenuRepository()
}));

jest.mock('@/repositories/menuItem.repository', () => ({
  MenuItemRepository: createMockMenuItemRepository()
}));

// Mock cache
export const cache = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  clear: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
};

jest.mock('@/utils/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    clear: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
  }
}));

// Mock logger
export const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  }
}));
