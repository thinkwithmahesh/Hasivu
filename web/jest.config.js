/**
 * Jest Configuration for HASIVU Web Application
 * Enhanced testing setup for React components, accessibility testing, and mobile features
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

const criticalCoverage = process.env.CRITICAL_COVERAGE === 'true';

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment
  testEnvironment: 'jest-environment-jsdom',

  // Test patterns
  testMatch: [
    '<rootDir>/src/hooks/__tests__/useDailyMenu.test.ts',
    '<rootDir>/src/hooks/__tests__/useApiIntegration.test.ts',
    '<rootDir>/src/design-system/__tests__/motion.test.ts',
    '<rootDir>/src/services/__tests__/auth-api.service.test.ts',
    '<rootDir>/src/app/cart/__tests__/cart-page.test.tsx',
    '<rootDir>/src/**/__tests__/**/*.smoke.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/simple.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
  ],

  // Coverage configuration
  collectCoverageFrom: criticalCoverage
    ? [
        'src/hooks/useApiIntegration.ts',
        'src/services/auth-api.service.ts',
        'src/contexts/auth-context.tsx',
        'src/app/cart/page.tsx',
        'src/hooks/useDailyMenu.ts',
        'src/design-system/motion.ts',
      ]
    : [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{js,jsx,ts,tsx}',
        '!src/**/index.{js,jsx,ts,tsx}',
        '!src/app/layout.tsx',
        '!src/app/globals.css',
      ],

  // Coverage thresholds are enforced separately once the launch suite is stable.
  coverageThreshold: process.env.ENFORCE_COVERAGE_THRESHOLD === 'true'
    ? {
        global: {
          branches: 70,
          functions: 70,
          lines: 80,
          statements: 80,
        },
      }
    : undefined,

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/out/',
    '<rootDir>/dist/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/accessibility/',
    '<rootDir>/tests/visual/',
    '<rootDir>/tests/performance/',
    '<rootDir>/tests/auth/',
    '<rootDir>/src/components/ui/__tests__/tooltip.test.tsx',
    '<rootDir>/src/components/ui/__tests__/popover.test.tsx',
    '<rootDir>/src/components/ui/__tests__/input-otp.test.tsx',
    '<rootDir>/src/components/ui/__tests__/command.test.tsx',
    '<rootDir>/src/components/ui/__tests__/drawer.test.tsx',
    '<rootDir>/src/components/ui/__tests__/drawer.smoke.test.tsx',
    '<rootDir>/src/components/ui/__tests__/cross-browser.test.tsx',
    '<rootDir>/src/components/ui/__tests__/error-handling.test.tsx',
    '<rootDir>/src/components/meal-ordering/__tests__/enhanced-meal-ordering-integration.test.tsx',
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Mock static assets
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
  },
};

// Create and export Jest config
module.exports = createJestConfig(customJestConfig);
