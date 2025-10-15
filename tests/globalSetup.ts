// Global setup for HASIVU Platform tests
// Priority 5: Advanced Testing & Quality Assurance

import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('🔧 Setting up global test environment...');

  // Environment setup
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  process.env.DISABLE_TELEMETRY = 'true';
  
  // Database setup for testing
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'sqlite://./test.db';
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/15';
  
  // Security test configuration
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long!';
  
  // Performance test configuration
  process.env.PERFORMANCE_TEST_TIMEOUT = '60000'; // 60 seconds
  process.env.MEMORY_LIMIT_MB = '512';
  
  // Mock external services during testing
  process.env.MOCK_EXTERNAL_APIS = 'true';
  process.env.SKIP_EXTERNAL_VALIDATIONS = 'true';

  console.log('✅ Global test environment setup complete');
}