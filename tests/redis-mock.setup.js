/**
 * Runs before any test file imports (see jest setupFiles).
 * SessionService constructs Redis at module load — doMock in setupFilesAfterEnv is too late.
 */
jest.mock(
  'ioredis',
  () =>
    function MockRedis() {
      return {
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(undefined),
        quit: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        exists: jest.fn().mockResolvedValue(0),
        expire: jest.fn().mockResolvedValue(1),
        incr: jest.fn().mockResolvedValue(1),
        decr: jest.fn().mockResolvedValue(0),
        hget: jest.fn().mockResolvedValue(null),
        hset: jest.fn().mockResolvedValue(1),
        hdel: jest.fn().mockResolvedValue(1),
        keys: jest.fn().mockResolvedValue([]),
        scan: jest.fn().mockResolvedValue(['0', []]),
      };
    }
);
