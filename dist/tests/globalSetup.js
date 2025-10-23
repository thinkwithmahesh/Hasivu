"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function globalSetup() {
    console.log('🔧 Setting up global test environment...');
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'error';
    process.env.DISABLE_TELEMETRY = 'true';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'sqlite://./test.db';
    process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/15';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long!';
    process.env.PERFORMANCE_TEST_TIMEOUT = '60000';
    process.env.MEMORY_LIMIT_MB = '512';
    process.env.MOCK_EXTERNAL_APIS = 'true';
    process.env.SKIP_EXTERNAL_VALIDATIONS = 'true';
    console.log('✅ Global test environment setup complete');
}
exports.default = globalSetup;
//# sourceMappingURL=globalSetup.js.map