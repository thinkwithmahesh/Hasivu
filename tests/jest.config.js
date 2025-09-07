
/**
 * Jest Configuration for HASIVU Platform Integration Tests
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../src/$1'
  },
  testTimeout: 30000,
  verbose: true,
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      useESM: false,
      isolatedModules: true
    }
  },
  clearMocks: true,
  restoreMocks: true
}