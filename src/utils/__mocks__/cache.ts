/**
 * Cache Mock for Jest Testing
 * Manual mock for the cache utility
 */

export const cache = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  clear: jest.fn(),
  size: jest.fn()
};