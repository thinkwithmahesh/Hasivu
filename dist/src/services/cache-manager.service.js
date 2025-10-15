"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheManager = exports.CacheManager = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
const redis_service_1 = require("./redis.service");
class CacheManager extends events_1.EventEmitter {
    cache = new Map();
    accessOrder = new Map();
    stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalMemoryUsage: 0
    };
    accessCounter = 0;
    cleanupTimer;
    config;
    constructor(config = {}) {
        super();
        this.config = {
            maxEntries: config.maxEntries || 10000,
            maxMemoryMB: config.maxMemoryMB || 512,
            defaultTTL: config.defaultTTL || 3600,
            enableCompression: config.enableCompression ?? true,
            compressionThreshold: config.compressionThreshold || 1024,
            cleanupInterval: config.cleanupInterval || 300000,
            enableRedisBackup: config.enableRedisBackup ?? true
        };
        this.startCleanupProcess();
        logger_1.logger.info('CacheManager initialized', this.config);
    }
    async get(key) {
        try {
            const entry = this.cache.get(key);
            if (!entry) {
                this.stats.misses++;
                if (this.config.enableRedisBackup) {
                    const redisValue = await redis_service_1.RedisService.get(key);
                    if (redisValue) {
                        const parsedValue = this.deserializeValue(redisValue);
                        await this.set(key, parsedValue, this.config.defaultTTL);
                        this.stats.hits++;
                        return parsedValue;
                    }
                }
                logger_1.logger.debug('Cache miss', { key });
                return null;
            }
            if (this.isExpired(entry)) {
                this.cache.delete(key);
                this.accessOrder.delete(key);
                this.stats.totalMemoryUsage -= entry.size;
                this.stats.misses++;
                logger_1.logger.debug('Cache entry expired', { key, expiresAt: entry.expiresAt });
                return null;
            }
            entry.accessCount++;
            entry.lastAccessedAt = new Date();
            this.accessOrder.set(key, ++this.accessCounter);
            this.stats.hits++;
            logger_1.logger.debug('Cache hit', { key, accessCount: entry.accessCount });
            const value = entry.compressed ? this.decompress(entry.value) : entry.value;
            return value;
        }
        catch (error) {
            logger_1.logger.error('Cache get error', { error, key });
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            const ttl = ttlSeconds || this.config.defaultTTL;
            const expiresAt = ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined;
            const existingEntry = this.cache.get(key);
            if (existingEntry) {
                this.stats.totalMemoryUsage -= existingEntry.size;
            }
            let processedValue = value;
            let compressed = false;
            const serializedValue = this.serializeValue(value);
            const size = this.calculateSize(serializedValue);
            if (this.config.enableCompression && size >= this.config.compressionThreshold) {
                processedValue = this.compress(serializedValue);
                compressed = true;
            }
            else {
                processedValue = serializedValue;
            }
            const entry = {
                key,
                value: processedValue,
                ttl,
                expiresAt,
                createdAt: new Date(),
                accessCount: 0,
                lastAccessedAt: new Date(),
                size: compressed ? this.calculateSize(processedValue) : size,
                compressed
            };
            await this.ensureMemoryLimits(entry.size);
            this.cache.set(key, entry);
            this.accessOrder.set(key, ++this.accessCounter);
            this.stats.totalMemoryUsage += entry.size;
            if (this.config.enableRedisBackup) {
                if (ttl > 0) {
                    await redis_service_1.RedisService.setex(key, ttl, serializedValue);
                }
                else {
                    await redis_service_1.RedisService.set(key, serializedValue);
                }
            }
            logger_1.logger.debug('Cache set', { key, size: entry.size, ttl, compressed });
            this.emit('cache:set', { key, size: entry.size });
        }
        catch (error) {
            logger_1.logger.error('Cache set error', { error, key });
            throw error;
        }
    }
    async setex(key, ttlSeconds, value) {
        return this.set(key, value, ttlSeconds);
    }
    async del(key) {
        try {
            const entry = this.cache.get(key);
            const existed = !!entry;
            if (entry) {
                this.cache.delete(key);
                this.accessOrder.delete(key);
                this.stats.totalMemoryUsage -= entry.size;
                if (this.config.enableRedisBackup) {
                    await redis_service_1.RedisService.del(key);
                }
                logger_1.logger.debug('Cache entry deleted', { key });
                this.emit('cache:delete', { key });
            }
            return existed;
        }
        catch (error) {
            logger_1.logger.error('Cache delete error', { error, key });
            return false;
        }
    }
    async has(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (this.isExpired(entry)) {
            await this.del(key);
            return false;
        }
        return true;
    }
    async mget(keys) {
        const results = [];
        for (const key of keys) {
            results.push(await this.get(key));
        }
        return results;
    }
    async mset(entries) {
        for (const entry of entries) {
            await this.set(entry.key, entry.value, entry.ttl);
        }
    }
    keys(pattern) {
        const allKeys = Array.from(this.cache.keys());
        if (!pattern)
            return allKeys;
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return allKeys.filter(key => regex.test(key));
    }
    async clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.accessOrder.clear();
        this.stats.totalMemoryUsage = 0;
        if (this.config.enableRedisBackup) {
        }
        logger_1.logger.info('Cache cleared', { clearedEntries: size });
        this.emit('cache:cleared', { clearedEntries: size });
    }
    getStats() {
        const entries = Array.from(this.cache.values());
        const totalRequests = this.stats.hits + this.stats.misses;
        return {
            totalEntries: this.cache.size,
            totalMemoryUsage: this.stats.totalMemoryUsage,
            hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
            missRate: totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0,
            totalHits: this.stats.hits,
            totalMisses: this.stats.misses,
            totalEvictions: this.stats.evictions,
            averageEntrySize: entries.length > 0 ? this.stats.totalMemoryUsage / entries.length : 0,
            oldestEntry: entries.length > 0 ? new Date(Math.min(...entries.map(e => e.createdAt.getTime()))) : undefined,
            newestEntry: entries.length > 0 ? new Date(Math.max(...entries.map(e => e.createdAt.getTime()))) : undefined
        };
    }
    getHealthStatus() {
        const memoryUsageMB = this.stats.totalMemoryUsage / (1024 * 1024);
        const memoryUsagePercent = (memoryUsageMB / this.config.maxMemoryMB) * 100;
        return {
            healthy: memoryUsagePercent < 90 && this.cache.size < this.config.maxEntries * 0.9,
            memoryUsagePercent,
            entryCount: this.cache.size
        };
    }
    shutdown() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        logger_1.logger.info('CacheManager shut down', {
            totalEntries: this.cache.size,
            totalMemoryUsage: this.stats.totalMemoryUsage
        });
        this.emit('shutdown');
    }
    isExpired(entry) {
        return entry.expiresAt ? new Date() > entry.expiresAt : false;
    }
    serializeValue(value) {
        if (typeof value === 'string')
            return value;
        return JSON.stringify(value);
    }
    deserializeValue(value) {
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    calculateSize(value) {
        const str = typeof value === 'string' ? value : JSON.stringify(value);
        return Buffer.byteLength(str, 'utf8');
    }
    compress(value) {
        return value;
    }
    decompress(value) {
        return value;
    }
    async ensureMemoryLimits(newEntrySize) {
        const maxMemoryBytes = this.config.maxMemoryMB * 1024 * 1024;
        while (this.cache.size >= this.config.maxEntries ||
            this.stats.totalMemoryUsage + newEntrySize > maxMemoryBytes) {
            await this.evictLRU();
        }
    }
    async evictLRU() {
        if (this.cache.size === 0)
            return;
        let lruKey = null;
        let lruAccessOrder = Infinity;
        for (const [key, accessOrder] of this.accessOrder.entries()) {
            if (accessOrder < lruAccessOrder) {
                lruAccessOrder = accessOrder;
                lruKey = key;
            }
        }
        if (lruKey) {
            const entry = this.cache.get(lruKey);
            await this.del(lruKey);
            this.stats.evictions++;
            logger_1.logger.debug('Cache entry evicted (LRU)', {
                key: lruKey,
                size: entry?.size,
                accessCount: entry?.accessCount
            });
            this.emit('cache:evicted', { key: lruKey, reason: 'lru' });
        }
    }
    startCleanupProcess() {
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpiredEntries();
        }, this.config.cleanupInterval);
    }
    async cleanupExpiredEntries() {
        let cleanupCount = 0;
        const expiredKeys = [];
        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                expiredKeys.push(key);
            }
        }
        for (const key of expiredKeys) {
            await this.del(key);
            cleanupCount++;
        }
        if (cleanupCount > 0) {
            logger_1.logger.debug('Cache cleanup completed', { expiredEntries: cleanupCount });
            this.emit('cache:cleanup', { expiredEntries: cleanupCount });
        }
    }
}
exports.CacheManager = CacheManager;
exports.cacheManager = new CacheManager();
exports.default = exports.cacheManager;
//# sourceMappingURL=cache-manager.service.js.map