"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = exports._cacheService = exports.cacheService = void 0;
const redis_1 = __importDefault(require("../config/redis"));
const logger_service_1 = require("../shared/logger.service");
class CacheService {
    defaultTTL = 300;
    defaultPrefix = 'hasivu:';
    stats = {
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
    async get(key, options = {}) {
        const startTime = Date.now();
        try {
            const fullKey = this.buildKey(key);
            const value = await redis_1.default.get(fullKey);
            if (!value) {
                this.stats.misses++;
                return null;
            }
            this.stats.hits++;
            this.updateAvgTime('get', Date.now() - startTime);
            return JSON.parse(value);
        }
        catch (error) {
            logger_service_1.logger.error('Cache get error', error instanceof Error ? error : new Error(String(error)));
            return null;
        }
    }
    async set(key, value, options = {}) {
        const startTime = Date.now();
        try {
            const fullKey = this.buildKey(key);
            const ttl = options.ttl || this.defaultTTL;
            const serialized = JSON.stringify(value);
            await redis_1.default.setex(fullKey, ttl, serialized);
            this.stats.sets++;
            this.updateAvgTime('set', Date.now() - startTime);
            return true;
        }
        catch (error) {
            logger_service_1.logger.error('Cache set error', error instanceof Error ? error : new Error(String(error)));
            return false;
        }
    }
    async delete(key) {
        try {
            const fullKey = this.buildKey(key);
            await redis_1.default.del(fullKey);
            this.stats.deletes++;
            return true;
        }
        catch (error) {
            logger_service_1.logger.error('Cache delete error', error instanceof Error ? error : new Error(String(error)));
            return false;
        }
    }
    async invalidatePattern(pattern) {
        try {
            const fullPattern = this.buildKey(pattern);
            const keys = await redis_1.default.keys(fullPattern);
            if (keys.length === 0) {
                return 0;
            }
            await redis_1.default.del(...keys);
            this.stats.deletes += keys.length;
            return keys.length;
        }
        catch (error) {
            logger_service_1.logger.error('Cache invalidate pattern error', error instanceof Error ? error : new Error(String(error)));
            return 0;
        }
    }
    async invalidateByTag(tag) {
        return await this.invalidatePattern(`*:tag:${tag}:*`);
    }
    async getOrSet(key, fetchFn, options = {}) {
        const cached = await this.get(key, options);
        if (cached !== null) {
            return cached;
        }
        const value = await fetchFn();
        await this.set(key, value, options);
        return value;
    }
    async mget(keys) {
        try {
            const fullKeys = keys.map(key => this.buildKey(key));
            const values = await redis_1.default.mget(...fullKeys);
            const result = new Map();
            keys.forEach((key, index) => {
                const value = values[index];
                if (value) {
                    try {
                        result.set(key, JSON.parse(value));
                        this.stats.hits++;
                    }
                    catch {
                        this.stats.misses++;
                    }
                }
                else {
                    this.stats.misses++;
                }
            });
            return result;
        }
        catch (error) {
            logger_service_1.logger.error('Cache mget error', error instanceof Error ? error : new Error(String(error)));
            return new Map();
        }
    }
    async mset(entries, options = {}) {
        try {
            const pipeline = redis_1.default.pipeline();
            const ttl = options.ttl || this.defaultTTL;
            entries.forEach((value, key) => {
                const fullKey = this.buildKey(key);
                const serialized = JSON.stringify(value);
                pipeline.setex(fullKey, ttl, serialized);
            });
            await pipeline.exec();
            this.stats.sets += entries.size;
            return true;
        }
        catch (error) {
            logger_service_1.logger.error('Cache mset error', error instanceof Error ? error : new Error(String(error)));
            return false;
        }
    }
    async getHealth() {
        try {
            const info = await redis_1.default.info('stats');
            const memory = await redis_1.default.info('memory');
            const keyspace = await redis_1.default.info('keyspace');
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
        }
        catch (error) {
            logger_service_1.logger.error('Cache health check error', error instanceof Error ? error : new Error(String(error)));
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
    getStats() {
        return { ...this.stats };
    }
    async clear() {
        try {
            await redis_1.default.flushdb();
            this.stats.deletes++;
            return true;
        }
        catch (error) {
            logger_service_1.logger.error('Cache clear error', error instanceof Error ? error : new Error(String(error)));
            return false;
        }
    }
    async cleanup() {
        logger_service_1.logger.info('Cache cleanup triggered (handled by Redis)');
    }
    buildKey(key) {
        return `${this.defaultPrefix}${key}`;
    }
    parseRedisInfo(info) {
        const lines = info.split('\r\n');
        const result = {};
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
    updateAvgTime(operation, time) {
        if (operation === 'get') {
            const totalGets = this.stats.hits + this.stats.misses;
            this.stats.avgGetTime = (this.stats.avgGetTime * (totalGets - 1) + time) / totalGets;
        }
        else {
            this.stats.avgSetTime =
                (this.stats.avgSetTime * (this.stats.sets - 1) + time) / this.stats.sets;
        }
    }
    determineHealthStatus(hitRate, memoryPercent) {
        if (memoryPercent > 90 || hitRate < 30)
            return 'error';
        if (memoryPercent > 80 || hitRate < 50)
            return 'warning';
        return 'healthy';
    }
    determineMemoryStatus(memoryPercent) {
        if (memoryPercent > 90)
            return 'critical';
        if (memoryPercent > 80)
            return 'warning';
        return 'healthy';
    }
    determinePerformanceStatus(hitRate) {
        if (hitRate < 30)
            return 'poor';
        if (hitRate < 50)
            return 'degraded';
        return 'optimal';
    }
}
exports.CacheService = CacheService;
const cacheServiceInstance = new CacheService();
exports.cacheService = cacheServiceInstance;
exports._cacheService = cacheServiceInstance;
exports.default = cacheServiceInstance;
//# sourceMappingURL=cache.service.js.map