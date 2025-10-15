"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAllCache = exports.warmUpCache = exports.getCacheStats = exports.extendCacheTTL = exports.getCacheTTL = exports.cacheExists = exports.invalidateMultiplePatterns = exports.invalidateCache = exports.deleteCache = exports.getFromCache = exports.setCached = exports.getCached = exports.CacheTTL = void 0;
const redis_client_1 = __importDefault(require("./redis-client"));
const cloudwatch_metrics_1 = require("../monitoring/cloudwatch-metrics");
exports.CacheTTL = {
    USER_PROFILE: 3600,
    ORDER_LIST: 300,
    MENU_ITEMS: 1800,
    DAILY_MENU: 7200,
    PAYMENT_METHODS: 1800,
    ANALYTICS: 3600,
    SCHOOL_CONFIG: 7200,
    SUBSCRIPTION_PLAN: 3600,
    SHORT_LIVED: 60,
    MEDIUM_LIVED: 600,
    LONG_LIVED: 86400,
};
async function getCached(key, ttl, fetcher) {
    const startTime = Date.now();
    try {
        const cached = await redis_client_1.default.get(key);
        if (cached) {
            const duration = Date.now() - startTime;
            await (0, cloudwatch_metrics_1.recordMetric)('CacheHitDuration', duration, 'Milliseconds');
            await (0, cloudwatch_metrics_1.recordMetric)('CacheHitRate', 100, 'Percent');
            return JSON.parse(cached);
        }
        const data = await fetcher();
        const fetchDuration = Date.now() - startTime;
        redis_client_1.default.setex(key, ttl, JSON.stringify(data)).catch(error => {
            console.error('Failed to cache data:', error);
        });
        await (0, cloudwatch_metrics_1.recordMetric)('CacheMissDuration', fetchDuration, 'Milliseconds');
        await (0, cloudwatch_metrics_1.recordMetric)('CacheHitRate', 0, 'Percent');
        return data;
    }
    catch (error) {
        console.error('Cache operation error, falling back to fetcher:', error);
        await (0, cloudwatch_metrics_1.recordMetric)('CacheErrors', 1, 'Count');
        return fetcher();
    }
}
exports.getCached = getCached;
async function setCached(key, value, ttl) {
    try {
        await redis_client_1.default.setex(key, ttl, JSON.stringify(value));
    }
    catch (error) {
        console.error('Failed to set cache:', error);
        await (0, cloudwatch_metrics_1.recordMetric)('CacheErrors', 1, 'Count');
    }
}
exports.setCached = setCached;
async function getFromCache(key) {
    try {
        const cached = await redis_client_1.default.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    catch (error) {
        console.error('Failed to get from cache:', error);
        await (0, cloudwatch_metrics_1.recordMetric)('CacheErrors', 1, 'Count');
        return null;
    }
}
exports.getFromCache = getFromCache;
async function deleteCache(key) {
    try {
        await redis_client_1.default.del(key);
    }
    catch (error) {
        console.error('Failed to delete cache key:', error);
        await (0, cloudwatch_metrics_1.recordMetric)('CacheErrors', 1, 'Count');
    }
}
exports.deleteCache = deleteCache;
async function invalidateCache(pattern) {
    try {
        const stream = redis_client_1.default.scanStream({
            match: pattern,
            count: 100,
        });
        const keys = [];
        stream.on('data', (resultKeys) => {
            keys.push(...resultKeys);
        });
        await new Promise((resolve, reject) => {
            stream.on('end', () => resolve());
            stream.on('error', err => reject(err));
        });
        if (keys.length > 0) {
            await redis_client_1.default.del(...keys);
            await (0, cloudwatch_metrics_1.recordMetric)('CacheKeysInvalidated', keys.length, 'Count');
        }
    }
    catch (error) {
        console.error('Failed to invalidate cache pattern:', error);
        await (0, cloudwatch_metrics_1.recordMetric)('CacheErrors', 1, 'Count');
    }
}
exports.invalidateCache = invalidateCache;
async function invalidateMultiplePatterns(patterns) {
    await Promise.all(patterns.map(pattern => invalidateCache(pattern)));
}
exports.invalidateMultiplePatterns = invalidateMultiplePatterns;
async function cacheExists(key) {
    try {
        const exists = await redis_client_1.default.exists(key);
        return exists === 1;
    }
    catch (error) {
        console.error('Failed to check cache existence:', error);
        return false;
    }
}
exports.cacheExists = cacheExists;
async function getCacheTTL(key) {
    try {
        return await redis_client_1.default.ttl(key);
    }
    catch (error) {
        console.error('Failed to get cache TTL:', error);
        return -1;
    }
}
exports.getCacheTTL = getCacheTTL;
async function extendCacheTTL(key, ttl) {
    try {
        await redis_client_1.default.expire(key, ttl);
    }
    catch (error) {
        console.error('Failed to extend cache TTL:', error);
        await (0, cloudwatch_metrics_1.recordMetric)('CacheErrors', 1, 'Count');
    }
}
exports.extendCacheTTL = extendCacheTTL;
async function getCacheStats() {
    try {
        const info = await redis_client_1.default.info('stats');
        const memory = await redis_client_1.default.info('memory');
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
    }
    catch (error) {
        console.error('Failed to get cache stats:', error);
        return {
            keys: 0,
            memory: 'Unknown',
            hitRate: 0,
        };
    }
}
exports.getCacheStats = getCacheStats;
async function warmUpCache(dataLoaders) {
    console.log('Starting cache warm-up...');
    const results = await Promise.allSettled(dataLoaders.map(async ({ key, ttl, loader }) => {
        const data = await loader();
        await setCached(key, data, ttl);
        return key;
    }));
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`Cache warm-up completed: ${successful} successful, ${failed} failed`);
    await (0, cloudwatch_metrics_1.recordMetric)('CacheWarmUpKeys', successful, 'Count');
}
exports.warmUpCache = warmUpCache;
async function clearAllCache() {
    if (process.env.NODE_ENV === 'production') {
        console.warn('Cannot clear all cache in production environment');
        return;
    }
    try {
        await redis_client_1.default.flushdb();
        console.log('All cache cleared');
    }
    catch (error) {
        console.error('Failed to clear cache:', error);
    }
}
exports.clearAllCache = clearAllCache;
//# sourceMappingURL=cache-utils.js.map