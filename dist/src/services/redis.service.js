"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const logger_1 = require("../utils/logger");
class RedisService {
    static instance;
    cache;
    connected;
    constructor() {
        this.cache = new Map();
        this.connected = false;
    }
    static getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
    static async connect() {
        return RedisService.getInstance().connect();
    }
    async connect() {
        try {
            this.connected = true;
            logger_1.logger.info('Redis service initialized (mock)');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Redis service', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            this.connected = false;
            this.cache.clear();
            logger_1.logger.info('Redis service disconnected');
        }
        catch (error) {
            logger_1.logger.error('Failed to disconnect Redis service', error);
            throw error;
        }
    }
    async get(key) {
        try {
            const item = this.cache.get(key);
            if (!item) {
                return null;
            }
            if (item.expiry && Date.now() > item.expiry) {
                this.cache.delete(key);
                return null;
            }
            return item.value;
        }
        catch (error) {
            logger_1.logger.error('Redis GET operation failed', error, { key });
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
            this.cache.set(key, { value, expiry });
            logger_1.logger.debug('Redis SET operation completed', { key, ttl: ttlSeconds });
            return 'OK';
        }
        catch (error) {
            logger_1.logger.error('Redis SET operation failed', error, { key });
            throw error;
        }
    }
    async setex(key, seconds, value) {
        return this.set(key, value, seconds);
    }
    async del(key) {
        try {
            const existed = this.cache.has(key);
            this.cache.delete(key);
            logger_1.logger.debug('Redis DEL operation completed', { key, existed });
            return existed ? 1 : 0;
        }
        catch (error) {
            logger_1.logger.error('Redis DEL operation failed', error, { key });
            return 0;
        }
    }
    async exists(key) {
        try {
            const item = this.cache.get(key);
            if (!item) {
                return 0;
            }
            if (item.expiry && Date.now() > item.expiry) {
                this.cache.delete(key);
                return 0;
            }
            return 1;
        }
        catch (error) {
            logger_1.logger.error('Redis EXISTS operation failed', error, { key });
            return 0;
        }
    }
    async expire(key, seconds) {
        try {
            const item = this.cache.get(key);
            if (!item) {
                return 0;
            }
            const expiry = Date.now() + (seconds * 1000);
            this.cache.set(key, { ...item, expiry });
            logger_1.logger.debug('Redis EXPIRE operation completed', { key, seconds });
            return 1;
        }
        catch (error) {
            logger_1.logger.error('Redis EXPIRE operation failed', error, { key });
            return 0;
        }
    }
    async ttl(key) {
        try {
            const item = this.cache.get(key);
            if (!item) {
                return -2;
            }
            if (!item.expiry) {
                return -1;
            }
            const remaining = Math.ceil((item.expiry - Date.now()) / 1000);
            return remaining > 0 ? remaining : -2;
        }
        catch (error) {
            logger_1.logger.error('Redis TTL operation failed', error, { key });
            return -2;
        }
    }
    async incr(key) {
        try {
            const current = await this.get(key);
            const value = current ? parseInt(current) + 1 : 1;
            await this.set(key, value.toString());
            logger_1.logger.debug('Redis INCR operation completed', { key, value });
            return value;
        }
        catch (error) {
            logger_1.logger.error('Redis INCR operation failed', error, { key });
            throw error;
        }
    }
    async decr(key) {
        try {
            const current = await this.get(key);
            const value = current ? parseInt(current) - 1 : -1;
            await this.set(key, value.toString());
            logger_1.logger.debug('Redis DECR operation completed', { key, value });
            return value;
        }
        catch (error) {
            logger_1.logger.error('Redis DECR operation failed', error, { key });
            throw error;
        }
    }
    async sadd(key, ...members) {
        try {
            const current = await this.get(key);
            const set = current ? new Set(JSON.parse(current)) : new Set();
            let added = 0;
            members.forEach(member => {
                if (!set.has(member)) {
                    set.add(member);
                    added++;
                }
            });
            await this.set(key, JSON.stringify([...set]));
            logger_1.logger.debug('Redis SADD operation completed', { key, added });
            return added;
        }
        catch (error) {
            logger_1.logger.error('Redis SADD operation failed', error, { key });
            throw error;
        }
    }
    async smembers(key) {
        try {
            const current = await this.get(key);
            return current ? JSON.parse(current) : [];
        }
        catch (error) {
            logger_1.logger.error('Redis SMEMBERS operation failed', error, { key });
            return [];
        }
    }
    async sismember(key, member) {
        try {
            const members = await this.smembers(key);
            return members.includes(member) ? 1 : 0;
        }
        catch (error) {
            logger_1.logger.error('Redis SISMEMBER operation failed', error, { key });
            return 0;
        }
    }
    getStats() {
        return {
            size: this.cache.size,
            connected: this.connected
        };
    }
    async flushall() {
        try {
            this.cache.clear();
            logger_1.logger.info('Redis cache cleared');
            return 'OK';
        }
        catch (error) {
            logger_1.logger.error('Redis FLUSHALL operation failed', error);
            throw error;
        }
    }
    async ping() {
        return 'PONG';
    }
    async getHealth() {
        const startTime = Date.now();
        try {
            await this.ping();
            const responseTime = Date.now() - startTime;
            return {
                status: 'healthy',
                responseTime,
                connected: this.connected,
                errors: []
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                status: 'unhealthy',
                responseTime,
                connected: false,
                errors: [errorMessage]
            };
        }
    }
    cleanupExpired() {
        const now = Date.now();
        const expiredKeys = [];
        this.cache.forEach((item, key) => {
            if (item.expiry && now > item.expiry) {
                expiredKeys.push(key);
            }
        });
        expiredKeys.forEach(key => {
            this.cache.delete(key);
        });
        if (expiredKeys.length > 0) {
            logger_1.logger.debug('Cleaned up expired cache keys', { count: expiredKeys.length });
        }
    }
}
const redisService = new RedisService();
exports.RedisService = redisService;
setInterval(() => {
    redisService.cleanupExpired();
}, 60000);
exports.default = redisService;
//# sourceMappingURL=redis.service.js.map