/**
 * Redis Service
 * Centralized Redis operations for caching and session management
 */
import Redis from 'ioredis';
import { logger } from '../utils/logger';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export class RedisService {
  private static instance: RedisService;
  private connected: boolean = false;
  private config: RedisConfig;
  private client: Redis | null = null;
  private readonly useInMemoryFallback: boolean;
  private cache: Map<string, { value: string; expiry?: number }> = new Map();

  private constructor() {
    this.useInMemoryFallback = process.env.NODE_ENV === 'test';
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    };
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Connect to Redis server
   */
  public async connect(): Promise<void> {
    if (this.connected) return;

    if (this.useInMemoryFallback) {
      this.connected = true;
      return;
    }

    const redisUrl = process.env.REDIS_URL;
    this.client = redisUrl
      ? new Redis(redisUrl)
      : new Redis({
          host: this.config.host,
          port: this.config.port,
          password: this.config.password,
          db: this.config.db || 0,
        });

    this.client.on('error', error => {
      this.connected = false;
      logger.error('Redis connection error', error);
    });

    await this.client.ping();
    this.connected = true;
  }

  /**
   * Disconnect from Redis server
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
    this.connected = false;
    this.cache.clear();
  }

  /**
   * Set a key-value pair with optional TTL
   */
  public async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.connected) await this.connect();

    if (this.client) {
      if (ttl) {
        await this.client.set(key, value, 'EX', ttl);
      } else {
        await this.client.set(key, value);
      }
      return;
    }

    const expiry = ttl ? Date.now() + ttl * 1000 : undefined;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Get value by key
   */
  public async get(key: string): Promise<string | null> {
    if (!this.connected) await this.connect();

    if (this.client) {
      return await this.client.get(key);
    }

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Delete a key
   */
  public async del(key: string): Promise<void> {
    if (!this.connected) await this.connect();
    if (this.client) {
      await this.client.del(key);
      return;
    }
    this.cache.delete(key);
  }

  /**
   * Check if key exists
   */
  public async exists(key: string): Promise<boolean> {
    if (!this.connected) await this.connect();

    if (this.client) {
      return (await this.client.exists(key)) === 1;
    }

    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Set expiration time for a key
   */
  public async expire(key: string, ttl: number): Promise<void> {
    if (!this.connected) await this.connect();

    if (this.client) {
      await this.client.expire(key, ttl);
      return;
    }

    const entry = this.cache.get(key);
    if (entry) {
      entry.expiry = Date.now() + ttl * 1000;
      this.cache.set(key, entry);
    }
  }

  /**
   * Increment a numeric value
   */
  public async incr(key: string): Promise<number> {
    if (!this.connected) await this.connect();

    if (this.client) {
      return await this.client.incr(key);
    }

    const current = await this.get(key);
    const value = current ? parseInt(current) + 1 : 1;
    await this.set(key, value.toString());
    return value;
  }

  /**
   * Health check for Redis connection
   */
  public async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    if (!this.connected) {
      return { healthy: false };
    }

    try {
      const startTime = Date.now();
      if (this.client) {
        await this.client.ping();
      } else {
        await this.set('health_check', 'ok', 1);
        await this.get('health_check');
      }
      const latency = Date.now() - startTime;
      return { healthy: true, latency };
    } catch (_error) {
      return { healthy: false };
    }
  }

  /**
   * Flush all keys in current database
   */
  public async flushdb(): Promise<void> {
    if (!this.connected) await this.connect();

    if (this.client) {
      await this.client.flushdb();
      return;
    }

    this.cache.clear();
  }

  /**
   * Static method: Get value by key
   */
  public static async get(key: string): Promise<string | null> {
    return await RedisService.getInstance().get(key);
  }

  /**
   * Static method: Set a key-value pair with optional TTL
   */
  public static async set(key: string, value: string, ttl?: number): Promise<string> {
    await RedisService.getInstance().set(key, value, ttl);
    return 'OK';
  }

  /**
   * Static method: Set a key-value pair with TTL
   */
  public static async setex(key: string, ttl: number, value: string): Promise<void> {
    return await RedisService.getInstance().set(key, value, ttl);
  }

  /**
   * Static method: Delete a key
   */
  public static async del(key: string | string[]): Promise<number> {
    if (Array.isArray(key)) {
      let deleted = 0;
      for (const k of key) {
        await RedisService.getInstance().del(k);
        deleted++;
      }
      return deleted;
    } else {
      await RedisService.getInstance().del(key);
      return 1; // Redis DEL returns number of keys deleted
    }
  }

  /**
   * Static method: Check if key exists
   */
  public static async exists(key: string): Promise<number> {
    const exists = await RedisService.getInstance().exists(key);
    return exists ? 1 : 0; // Redis EXISTS returns number of keys that exist
  }

  /**
   * Static method: Health check ping
   */
  public static async ping(): Promise<void> {
    const instance = RedisService.getInstance();
    if (!instance.connected) {
      await instance.connect();
    }
    if (instance.client) {
      await instance.client.ping();
    }
  }

  /**
   * Static method: Get keys matching pattern
   */
  public static async keys(pattern: string): Promise<string[]> {
    const instance = RedisService.getInstance();
    if (!instance.connected) await instance.connect();

    if (instance.client) {
      return await instance.client.keys(pattern);
    }

    const keys: string[] = [];
    for (const [key] of instance.cache.entries()) {
      if (key.includes(pattern.replace('*', ''))) {
        keys.push(key);
      }
    }
    return keys;
  }
}

// Export singleton instance
export const redisService = RedisService.getInstance();

// Export for direct access
export default RedisService;
