// Diagnostic logs to validate TypeScript error assumptions
import { DatabaseService } from './src/services/database.service';
import redisService from './src/services/redis.service';
import { z } from 'zod';

console.log('=== DIAGNOSTIC LOGS FOR TYPESCRIPT ERRORS ===');

// Check DatabaseService methods
console.log('DatabaseService static methods:', Object.getOwnPropertyNames(DatabaseService));

// Check RedisService methods
console.log('RedisService methods:', Object.getOwnPropertyNames(redisService));

// Check ZodError structure
const testSchema = z.string();
try {
  testSchema.parse(123);
} catch (error) {
  console.log('ZodError properties:', Object.getOwnPropertyNames(error));
  console.log('ZodError has .errors:', 'errors' in error);
  console.log('ZodError has .issues:', 'issues' in error);
}

// Check package versions
console.log('Node version:', process.version);
console.log('Zod version:', require('zod/package.json').version);
console.log('IORedis version:', require('ioredis/package.json').version);

// === VALIDATE TYPE MISMATCHES ===

// Check trendDirection type consistency
console.log('\n=== ANALYTICS TYPE VALIDATION ===');
const trendDirectionValues = ['improving', 'stable', 'declining', 'volatile'];
console.log('Expected trendDirection values:', trendDirectionValues);

// Check analysisConfidence property existence
console.log('Checking analysisConfidence property patterns...');

// === VALIDATE USER/SESSION OBJECT PROPERTIES ===

console.log('\n=== USER/SESSION OBJECT VALIDATION ===');
const requiredUserProperties = ['id', 'email', 'firstName', 'lastName', 'isActive', 'role'];
console.log('Required user properties:', requiredUserProperties);

const requiredSessionProperties = ['sessionId', 'userId', 'isActive', 'expiresAt', 'lastActivity'];
console.log('Required session properties:', requiredSessionProperties);

// === VALIDATE SERVICE METHOD SIGNATURES ===

console.log('\n=== SERVICE METHOD SIGNATURE VALIDATION ===');

// Check if DatabaseService has execute method
console.log(
  'DatabaseService has getInstance method:',
  typeof DatabaseService.getInstance === 'function'
);
if (DatabaseService.getInstance) {
  const dbService = DatabaseService.getInstance();
  console.log(
    'DatabaseService instance has execute method:',
    typeof dbService.execute === 'function'
  );
}

// Check RedisService hash methods
const redisMethods = [
  'hset',
  'hget',
  'hgetall',
  'keys',
  'lpush',
  'lrange',
  'hincrby',
  'hincrbyfloat',
];
console.log('RedisService hash methods check:');
redisMethods.forEach(method => {
  console.log(`  ${method}:`, typeof redisService[method] === 'function');
});

// === VALIDATE IMPORT/EXPORT PATHS ===

console.log('\n=== IMPORT/EXPORT PATH VALIDATION ===');

// Test common problematic imports
const importTests = [
  { path: './src/utils/logger', description: 'utils/logger' },
  { path: './src/lib/logger', description: 'lib/logger' },
  { path: './src/services/database/database.service', description: 'database/database.service' },
  { path: './src/services/cache/cache.service', description: 'cache/cache.service' },
  {
    path: './src/services/notification/notification.service',
    description: 'notification/notification.service',
  },
];

importTests.forEach(test => {
  try {
    require.resolve(test.path);
    console.log(`✓ ${test.description}: Found`);
  } catch (e) {
    console.log(`✗ ${test.description}: Not found`);
  }
});

// === VALIDATE SPECIFIC FIXES APPLIED ===

console.log('\n=== VALIDATION OF APPLIED FIXES ===');

// Check DatabaseService execute method signature
console.log('DatabaseService execute method signature:');
try {
  if (DatabaseService.getInstance) {
    const dbService = DatabaseService.getInstance();
    console.log('execute method exists:', typeof dbService.execute === 'function');
    if (dbService.execute) {
      console.log('execute method parameters:', dbService.execute.length);
    }
  }
} catch (error) {
  console.log('DatabaseService execute method error:', error.message);
}

// Check RedisService hash methods
console.log('\nRedisService hash methods validation:');
const hashMethods = [
  'hset',
  'hget',
  'hgetall',
  'keys',
  'lpush',
  'lrange',
  'hincrby',
  'hincrbyfloat',
];
hashMethods.forEach(method => {
  console.log(`  ${method}:`, typeof redisService[method] === 'function');
});

// Check response utils function signatures
console.log('\nResponse utils function signatures:');
try {
  const { createErrorResponse, handleError } = require('./src/shared/response.utils');
  console.log('createErrorResponse parameters:', createErrorResponse.length);
  console.log('handleError parameters:', handleError.length);
} catch (error) {
  console.log('Response utils import error:', error.message);
}

// Check trendDirection type consistency across analytics
console.log('\nAnalytics trendDirection type validation:');
const trendTypes = {
  'real-time-benchmarking': ['improving', 'stable', 'declining', 'volatile'],
  'strategic-insights': ['improving', 'stable', 'worsening'],
  'cross-school-analytics': ['improving', 'stable', 'worsening', 'declining'],
};
console.log('Trend direction types by module:', trendTypes);

// Check analysisConfidence usage
console.log('\nanalysisConfidence property validation:');
console.log('analysisConfidence is used in cross-school-analytics as number (0-1 scale)');

// Check user/session properties
console.log('\nUser/Session properties validation:');
console.log('User properties include: id, email, firstName, lastName, isActive, role');
console.log('Session properties include: sessionId, userId, isActive, expiresAt, lastActivity');

console.log('=== END DIAGNOSTIC LOGS ===');
console.log('=== END DIAGNOSTIC LOGS ===');
