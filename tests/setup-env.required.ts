process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  'required-gate-jwt-secret-minimum-length-64-characters-for-security-check';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'required-gate-refresh-secret-minimum-length-64-characters-for-security-check';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://hasivu:test-password@localhost:5432/hasivu_test?schema=public';
process.env.DIRECT_DATABASE_URL =
  process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/1';
