/**
 * Redis Client Configuration
 * High-performance caching layer for Hasivu Platform
 */

import Redis from 'ioredis';
import { recordMetric } from '../monitoring/cloudwatch-metrics';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),

  // Connection pool settings
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,

  // Retry strategy with exponential backoff
  retryStrategy: (times: number) => {
    if (times > 10) {
      // Stop retrying after 10 attempts
      console.error('Redis max retry attempts reached');
      return null;
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },

  // Connection timeout
  connectTimeout: 10000,

  // Keep-alive settings
  keepAlive: 30000,
};

// Create Redis client
const redis = new Redis(redisConfig);

// Connection event handlers
redis.on('connect', () => {
  console.log('Redis client connected successfully');
  recordMetric('RedisConnectionStatus', 1, 'Count').catch(console.error);
});

redis.on('ready', () => {
  console.log('Redis client ready to accept commands');
});

redis.on('error', error => {
  console.error('Redis connection error:', error);
  recordMetric('RedisConnectionErrors', 1, 'Count').catch(console.error);
});

redis.on('close', () => {
  console.log('Redis connection closed');
  recordMetric('RedisConnectionStatus', 0, 'Count').catch(console.error);
});

redis.on('reconnecting', () => {
  console.log('Redis client reconnecting...');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing Redis connection...');
  await redis.quit();
});

process.on('SIGINT', async () => {
  console.log('Closing Redis connection...');
  await redis.quit();
});

export default redis;
