/**
 * Redis Service
 * Centralized Redis operations for caching and session management
 */

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
  private cache: Map<string, { value: string; expiry?: number }> = new Map();

  private constructor() {
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
    // In-memory implementation for now (replace with actual Redis client)
    this.connected = true;
  }

  /**
   * Disconnect from Redis server
   */
  public async disconnect(): Promise<void> {
    this.connected = false;
    this.cache.clear();
  }

  /**
   * Set a key-value pair with optional TTL
   */
  public async set(key: string, value: string, ttl?: number): Promise<void> {
    const expiry = ttl ? Date.now() + ttl * 1000 : undefined;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Get value by key
   */
  public async get(key: string): Promise<string | null> {
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
    this.cache.delete(key);
  }

  /**
   * Check if key exists
   */
  public async exists(key: string): Promise<boolean> {
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
      await this.set('health_check', 'ok', 1);
      await this.get('health_check');
      const latency = Date.now() - startTime;
      return { healthy: true, latency };
    } catch (error) {
      return { healthy: false };
    }
  }

  /**
   * Flush all keys in current database
   */
  public async flushdb(): Promise<void> {
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
  public static async del(key: string): Promise<number> {
    await RedisService.getInstance().del(key);
    return 1; // Redis DEL returns number of keys deleted
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
    if (!instance['connected']) {
      await instance.connect();
    }
  }
}

// Export singleton instance
export const redisService = RedisService.getInstance();

// Export for direct access
export default RedisService;
