module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
    'tests/**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      isolatedModules: false,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        strict: false,
        target: 'es2020',
        module: 'esnext',
        moduleResolution: 'node',
        experimentalDecorators: true,
        emitDecoratorMetadata: true
      }
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/index.ts',
    '!src/simple-server.ts',
    '!src/server.ts',
    '!src/testing/**/*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@functions/(.*)$': '<rootDir>/src/functions/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1'
  },
  resolver: '<rootDir>/jest.resolver.js',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/mobile/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/web/'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/mobile/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/web/'
  ],
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  maxWorkers: 2,
  forceExit: true,
  detectOpenHandles: true,
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|fetch-blob|data-uri-to-buffer|formdata-polyfill).*)'
  ],
  extensionsToTreatAsEsm: ['.ts'],
};