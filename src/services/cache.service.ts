/**
 * Cache Service
 * High-performance Redis caching layer with comprehensive features
 */

import redis from '../config/redis';
import { logger } from '../shared/logger.service';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean;
  invalidationTags?: string[];
  priority?: 'low' | 'medium' | 'high';
  warmup?: boolean;
  serialize?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
  memoryUsage: number;
  keyCount: number;
  avgGetTime: number;
  avgSetTime: number;
}

export interface CacheHealth {
  status: 'healthy' | 'warning' | 'error';
  redisStatus: 'connected' | 'disconnected' | 'error';
  memoryStatus: 'healthy' | 'warning' | 'critical';
  performanceStatus: 'optimal' | 'degraded' | 'poor';
  stats: CacheStats;
  errors: Array<{
    type: string;
    message: string;
    timestamp: Date;
  }>;
}

class CacheService {
  private readonly defaultTTL = 300; // 5 minutes default
  private readonly defaultPrefix = 'hasivu:';
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    hitRate: 0,
    memoryUsage: 0,
    keyCount: 0,
    avgGetTime: 0,
    avgSetTime: 0,
  };

  /**
   * Get value from cache
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const startTime = Date.now();
    try {
      const fullKey = this.buildKey(key);
      const value = await redis.get(fullKey);

      if (!value) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      this.updateAvgTime('get', Date.now() - startTime);
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    const startTime = Date.now();
    try {
      const fullKey = this.buildKey(key);
      const ttl = options.ttl || this.defaultTTL;
      const serialized = JSON.stringify(value);

      await redis.setex(fullKey, ttl, serialized);
      this.stats.sets++;
      this.updateAvgTime('set', Date.now() - startTime);
      return true;
    } catch (error) {
      logger.error('Cache set error', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      await redis.del(fullKey);
      this.stats.deletes++;
      return true;
    } catch (error) {
      logger.error('Cache delete error', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Invalidate keys matching pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern);
      const keys = await redis.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      await redis.del(...keys);
      this.stats.deletes += keys.length;
      return keys.length;
    } catch (error) {
      logger.error(
        'Cache invalidate pattern error',
        error instanceof Error ? error : new Error(String(error))
      );
      return 0;
    }
  }

  /**
   * Invalidate by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    return await this.invalidatePattern(`*:tag:${tag}:*`);
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Get multiple keys at once
   */
  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    try {
      const fullKeys = keys.map(key => this.buildKey(key));
      const values = await redis.mget(...fullKeys);

      const result = new Map<string, T>();
      keys.forEach((key, index) => {
        const value = values[index];
        if (value) {
          try {
            result.set(key, JSON.parse(value) as T);
            this.stats.hits++;
          } catch {
            this.stats.misses++;
          }
        } else {
          this.stats.misses++;
        }
      });

      return result;
    } catch (error) {
      logger.error('Cache mget error', error instanceof Error ? error : new Error(String(error)));
      return new Map();
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset(entries: Map<string, any>, options: CacheOptions = {}): Promise<boolean> {
    try {
      const pipeline = redis.pipeline();
      const ttl = options.ttl || this.defaultTTL;

      entries.forEach((value, key) => {
        const fullKey = this.buildKey(key);
        const serialized = JSON.stringify(value);
        pipeline.setex(fullKey, ttl, serialized);
      });

      await pipeline.exec();
      this.stats.sets += entries.size;
      return true;
    } catch (error) {
      logger.error('Cache mset error', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Get cache health
   */
  async getHealth(): Promise<CacheHealth> {
    try {
      const info = await redis.info('stats');
      const memory = await redis.info('memory');
      const keyspace = await redis.info('keyspace');

      const statsInfo = this.parseRedisInfo(info);
      const memoryInfo = this.parseRedisInfo(memory);
      const keyspaceInfo = this.parseRedisInfo(keyspace);

      const hits = parseInt(statsInfo.keyspace_hits || '0', 10);
      const misses = parseInt(statsInfo.keyspace_misses || '0', 10);
      const total = hits + misses;
      const hitRate = total > 0 ? (hits / total) * 100 : 0;

      const memoryUsed = parseInt(memoryInfo.used_memory || '0', 10);
      const memoryMax = parseInt(memoryInfo.maxmemory || '0', 10);
      const memoryPercent = memoryMax > 0 ? (memoryUsed / memoryMax) * 100 : 0;

      return {
        status: this.determineHealthStatus(hitRate, memoryPercent),
        redisStatus: 'connected',
        memoryStatus: this.determineMemoryStatus(memoryPercent),
        performanceStatus: this.determinePerformanceStatus(hitRate),
        stats: {
          ...this.stats,
          hitRate,
          memoryUsage: memoryUsed,
          keyCount: Object.keys(keyspaceInfo).length,
        },
        errors: [],
      };
    } catch (error) {
      logger.error(
        'Cache health check error',
        error instanceof Error ? error : new Error(String(error))
      );
      return {
        status: 'error',
        redisStatus: 'error',
        memoryStatus: 'critical',
        performanceStatus: 'poor',
        stats: this.stats,
        errors: [
          {
            type: 'CONNECTION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          },
        ],
      };
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    try {
      await redis.flushdb();
      this.stats.deletes++;
      return true;
    } catch (error) {
      logger.error('Cache clear error', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Cleanup expired keys
   */
  async cleanup(): Promise<void> {
    // Redis handles expired key cleanup automatically
    logger.info('Cache cleanup triggered (handled by Redis)');
  }

  /**
   * Build full cache key with prefix
   */
  private buildKey(key: string): string {
    return `${this.defaultPrefix}${key}`;
  }

  /**
   * Parse Redis INFO response
   */
  private parseRedisInfo(info: string): Record<string, string> {
    const lines = info.split('\r\n');
    const result: Record<string, string> = {};

    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    });

    return result;
  }

  /**
   * Update average time metrics
   */
  private updateAvgTime(operation: 'get' | 'set', time: number): void {
    if (operation === 'get') {
      const totalGets = this.stats.hits + this.stats.misses;
      this.stats.avgGetTime = (this.stats.avgGetTime * (totalGets - 1) + time) / totalGets;
    } else {
      this.stats.avgSetTime =
        (this.stats.avgSetTime * (this.stats.sets - 1) + time) / this.stats.sets;
    }
  }

  /**
   * Determine overall health status
   */
  private determineHealthStatus(
    hitRate: number,
    memoryPercent: number
  ): 'healthy' | 'warning' | 'error' {
    if (memoryPercent > 90 || hitRate < 30) return 'error';
    if (memoryPercent > 80 || hitRate < 50) return 'warning';
    return 'healthy';
  }

  /**
   * Determine memory status
   */
  private determineMemoryStatus(memoryPercent: number): 'healthy' | 'warning' | 'critical' {
    if (memoryPercent > 90) return 'critical';
    if (memoryPercent > 80) return 'warning';
    return 'healthy';
  }

  /**
   * Determine performance status
   */
  private determinePerformanceStatus(hitRate: number): 'optimal' | 'degraded' | 'poor' {
    if (hitRate < 30) return 'poor';
    if (hitRate < 50) return 'degraded';
    return 'optimal';
  }
}

const cacheServiceInstance = new CacheService();
export const cacheService = cacheServiceInstance;
export const _cacheService = cacheServiceInstance;
export { CacheService };
export default cacheServiceInstance;
