/**
 * Logger Mock for Jest Testing
 * Manual mock for the logger utility
 */

export const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};