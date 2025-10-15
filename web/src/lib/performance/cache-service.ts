 * HASIVU Platform - Enhanced Multi-Layer Caching Service
 * Implements L1 (in-memory), L2 (Redis), L3 (CDN) caching strategy
 * with intelligent cache warming and invalidation patterns;
import { RedisService } from '../services/redis.service';
import { logger } from '../utils/logger';
interface CacheEntry<T> {}
    hits: { l1: 0, l2: 0, total: 0 },
    misses: 0,
    sets: 0,
    invalidations: 0
  private
  static getInstance(): CacheService {}
    return CacheService.instance;
   * Get value from cache with fallback execution;
  async get<T>(key: string, fallback?: () => Promise<T>,
    options: _CacheOptions =  {}
  ): Promise<T | null> {}
    const { ttl 
    try {}
        logger.debug('Cache hit L1', { key, ttl: localEntry.expires - Date.now() });
        return localEntry.data;
      // L2: Check Redis cache
      const _redisData =  await this.redis.get(key);
      if (redisData) {}
            this.stats.hits.l2++;
            this.stats.hits.total++;
            logger.debug('Cache hit L2', { key, version: entry.version });
            return entry.data;
          logger.warn('Failed to parse Redis cache entry', { key, error: parseError.message });
      // Cache miss - execute fallback
      this.stats.misses++;
      if (fallback) {}
        await this.set(key, result, { ttl, tags, version, compress });
        // Trigger warmup if enabled
        if (warmup) {}
        return result;
      return null;
      logger.error('Cache get operation failed', { key, error: error.message });
      // Execute fallback on cache failure
      if (fallback) {}
          logger.error('Fallback execution failed', { key, error: fallbackError.message });
          throw fallbackError;
      return null;
   * Set value in cache;
  async set<T>(
    key: string,
    value: T,
    options: _CacheOptions =  {}
  ): Promise<void> {}
    const { ttl 
    try {}
      // Set in L1 cache
      this.localCache.set(key, entry);
      // Set in L2 cache (Redis)
      const _serialized =  compress ? this.compress(entry) : JSON.stringify(entry);
      await this.redis.setex(key, ttl, serialized);
      // Store tags for invalidation
      if (tags.length > 0) {}
      this.stats.sets++;
      logger.debug('Cache set successful', { key, ttl, tags, compressed: compress });
      logger.error('Cache set operation failed', { key, error: error.message });
      throw error;
   * Delete specific key from cache;
  async delete(key: string): Promise<void> {}
      logger.debug('Cache key deleted', { key });
      logger.error('Cache delete operation failed', { key, error: error.message });
   * Invalidate cache by pattern;
  async invalidatePattern(pattern: string): Promise<void> {}
      keysToDelete.forEach(_key = > this.localCache.delete(key));
      // Invalidate L2 cache
      const _redisKeys =  await this.redis.client.keys(pattern);
      if (redisKeys.length > 0) {}
      this.stats.invalidations += keysToDelete.length + redisKeys.length;
      logger.info('Cache pattern invalidated', {}
      logger.error('Cache pattern invalidation failed', { pattern, error: error.message });
   * Invalidate cache by tags;
  async invalidateByTags(tags: string[]): Promise<void> {}
        const tagKeys = await this.redis.smembers(`cache:tag:${tag}``
          this.redis.del(`cache:tag:${tag}``
        return `gzip:${compressed.toString('base64')}``
          this.redis.sadd(`cache:tag:${tag}``