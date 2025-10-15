/**
 * Cache Utility Functions
 * High-level caching abstractions with performance monitoring
 */

import redis from './redis-client';
import { recordMetric } from '../monitoring/cloudwatch-metrics';

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  USER_PROFILE: 3600, // 1 hour
  ORDER_LIST: 300, // 5 minutes
  MENU_ITEMS: 1800, // 30 minutes
  DAILY_MENU: 7200, // 2 hours
  PAYMENT_METHODS: 1800, // 30 minutes
  ANALYTICS: 3600, // 1 hour
  SCHOOL_CONFIG: 7200, // 2 hours
  SUBSCRIPTION_PLAN: 3600, // 1 hour
  SHORT_LIVED: 60, // 1 minute
  MEDIUM_LIVED: 600, // 10 minutes
  LONG_LIVED: 86400, // 24 hours
} as const;

/**
 * Get data from cache or fetch if not available
 * Implements cache-aside pattern with automatic population
 *
 * @param key - Cache key
 * @param ttl - Time to live in seconds
 * @param fetcher - Function to fetch data if not in cache
 * @returns Cached or fetched data
 */
export async function getCached<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    // Try to get from cache
    const cached = await redis.get(key);

    if (cached) {
      // Cache hit
      const duration = Date.now() - startTime;
      await recordMetric('CacheHitDuration', duration, 'Milliseconds');
      await recordMetric('CacheHitRate', 100, 'Percent');

      return JSON.parse(cached) as T;
    }

    // Cache miss - fetch fresh data
    const data = await fetcher();
    const fetchDuration = Date.now() - startTime;

    // Store in cache (fire and forget, don't wait)
    redis.setex(key, ttl, JSON.stringify(data)).catch(error => {
      console.error('Failed to cache data:', error);
    });

    // Record cache miss metrics
    await recordMetric('CacheMissDuration', fetchDuration, 'Milliseconds');
    await recordMetric('CacheHitRate', 0, 'Percent');

    return data;
  } catch (error) {
    console.error('Cache operation error, falling back to fetcher:', error);

    // Record cache error
    await recordMetric('CacheErrors', 1, 'Count');

    // Fallback to fetcher on cache errors
    return fetcher();
  }
}

/**
 * Set data in cache
 *
 * @param key - Cache key
 * @param value - Data to cache
 * @param ttl - Time to live in seconds
 */
export async function setCached<T>(key: string, value: T, ttl: number): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to set cache:', error);
    await recordMetric('CacheErrors', 1, 'Count');
  }
}

/**
 * Get data from cache without fetching
 *
 * @param key - Cache key
 * @returns Cached data or null
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    return cached ? (JSON.parse(cached) as T) : null;
  } catch (error) {
    console.error('Failed to get from cache:', error);
    await recordMetric('CacheErrors', 1, 'Count');
    return null;
  }
}

/**
 * Delete specific cache key
 *
 * @param key - Cache key to delete
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Failed to delete cache key:', error);
    await recordMetric('CacheErrors', 1, 'Count');
  }
}

/**
 * Invalidate cache keys matching a pattern
 * Uses SCAN for safe iteration in production
 *
 * @param pattern - Redis key pattern (e.g., "orders:user:*")
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const stream = redis.scanStream({
      match: pattern,
      count: 100,
    });

    const keys: string[] = [];

    stream.on('data', (resultKeys: string[]) => {
      keys.push(...resultKeys);
    });

    await new Promise<void>((resolve, reject) => {
      stream.on('end', () => resolve());
      stream.on('error', err => reject(err));
    });

    if (keys.length > 0) {
      await redis.del(...keys);
      await recordMetric('CacheKeysInvalidated', keys.length, 'Count');
    }
  } catch (error) {
    console.error('Failed to invalidate cache pattern:', error);
    await recordMetric('CacheErrors', 1, 'Count');
  }
}

/**
 * Invalidate multiple cache patterns at once
 * Useful for complex invalidation scenarios
 *
 * @param patterns - Array of cache key patterns
 */
export async function invalidateMultiplePatterns(patterns: string[]): Promise<void> {
  await Promise.all(patterns.map(pattern => invalidateCache(pattern)));
}

/**
 * Check if cache key exists
 *
 * @param key - Cache key
 * @returns True if key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('Failed to check cache existence:', error);
    return false;
  }
}

/**
 * Get remaining TTL for a cache key
 *
 * @param key - Cache key
 * @returns Remaining TTL in seconds, -1 if key doesn't exist, -2 if no TTL set
 */
export async function getCacheTTL(key: string): Promise<number> {
  try {
    return await redis.ttl(key);
  } catch (error) {
    console.error('Failed to get cache TTL:', error);
    return -1;
  }
}

/**
 * Extend TTL for existing cache key
 *
 * @param key - Cache key
 * @param ttl - New TTL in seconds
 */
export async function extendCacheTTL(key: string, ttl: number): Promise<void> {
  try {
    await redis.expire(key, ttl);
  } catch (error) {
    console.error('Failed to extend cache TTL:', error);
    await recordMetric('CacheErrors', 1, 'Count');
  }
}

/**
 * Get cache statistics
 * Useful for monitoring and debugging
 */
export async function getCacheStats(): Promise<{
  keys: number;
  memory: string;
  hitRate: number;
}> {
  try {
    const info = await redis.info('stats');
    const memory = await redis.info('memory');

    // Parse info output
    const statsMatch = info.match(/keyspace_hits:(\d+)\nkeyspace_misses:(\d+)/);
    const hits = parseInt(statsMatch?.[1] || '0');
    const misses = parseInt(statsMatch?.[2] || '0');
    const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;

    const keysMatch = info.match(/db0:keys=(\d+)/);
    const keys = parseInt(keysMatch?.[1] || '0');

    const memoryMatch = memory.match(/used_memory_human:([^\n]+)/);
    const usedMemory = memoryMatch?.[1] || 'Unknown';

    return {
      keys,
      memory: usedMemory,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return {
      keys: 0,
      memory: 'Unknown',
      hitRate: 0,
    };
  }
}

/**
 * Warm up cache with frequently accessed data
 * Run this on deployment or during off-peak hours
 */
export async function warmUpCache(
  dataLoaders: Array<{
    key: string;
    ttl: number;
    loader: () => Promise<any>;
  }>
): Promise<void> {
  console.log('Starting cache warm-up...');

  const results = await Promise.allSettled(
    dataLoaders.map(async ({ key, ttl, loader }) => {
      const data = await loader();
      await setCached(key, data, ttl);
      return key;
    })
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`Cache warm-up completed: ${successful} successful, ${failed} failed`);
  await recordMetric('CacheWarmUpKeys', successful, 'Count');
}

/**
 * Clear all cache (use with caution!)
 * Should only be used in development or during maintenance
 */
export async function clearAllCache(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Cannot clear all cache in production environment');
    return;
  }

  try {
    await redis.flushdb();
    console.log('All cache cleared');
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}
