const enforceCoverageThreshold = process.env.ENFORCE_COVERAGE_THRESHOLD === 'true';

/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
    'tests/**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      isolatedModules: true,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        strict: false,
        target: 'es2020',
        module: 'commonjs',
        moduleResolution: 'node',
        experimentalDecorators: true,
        emitDecoratorMetadata: true
      }
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.ts.bak',
    '!src/types/**/*',
    '!src/functions/**/*',
    '!src/scripts/**/*',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/index.ts',
    '!src/simple-server.ts',
    '!src/server.ts',
    '!src/testing/**/*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  setupFiles: ['<rootDir>/tests/redis-mock.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@functions/(.*)$': '<rootDir>/src/functions/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/mobile/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/web/',
    '<rootDir>/src/functions/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/smoke/',
    '<rootDir>/tests/load/',
    '<rootDir>/tests/performance/',
    '<rootDir>/tests/chaos-engineering/',
    '<rootDir>/tests/cicd/',
    '<rootDir>/tests/integration/',
    '<rootDir>/tests/security/comprehensive-security\\.test\\.ts$',
    '<rootDir>/tests/security/redos-vulnerability-tests\\.test\\.ts$',
    '<rootDir>/tests/phase-4-3-testing-summary\\.test\\.ts$',
    '<rootDir>/tests/coverage-boost\\.test\\.ts$',
    '<rootDir>/tests/comprehensive-coverage-boost\\.test\\.ts$'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/mobile/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/web/',
    '<rootDir>/src/functions/'
  ],
  testTimeout: 120000, // Increased from 30s to 2 minutes for long-running tests
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  maxWorkers: '50%', // Use 50% of available cores for parallel execution
  forceExit: true,
  detectOpenHandles: true,
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|fetch-blob|data-uri-to-buffer|formdata-polyfill).*)'
  ],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: false
    }
  },
};

if (enforceCoverageThreshold) {
  config.coverageThreshold = {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  };
}

module.exports = config;
