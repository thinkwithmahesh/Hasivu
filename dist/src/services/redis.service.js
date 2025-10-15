"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = exports.RedisService = void 0;
class RedisService {
    static instance;
    connected = false;
    config;
    cache = new Map();
    constructor() {
        this.config = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
        };
    }
    static getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
    async connect() {
        this.connected = true;
    }
    async disconnect() {
        this.connected = false;
        this.cache.clear();
    }
    async set(key, value, ttl) {
        const expiry = ttl ? Date.now() + ttl * 1000 : undefined;
        this.cache.set(key, { value, expiry });
    }
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (entry.expiry && Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
    async del(key) {
        this.cache.delete(key);
    }
    async exists(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (entry.expiry && Date.now() > entry.expiry) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    async expire(key, ttl) {
        const entry = this.cache.get(key);
        if (entry) {
            entry.expiry = Date.now() + ttl * 1000;
            this.cache.set(key, entry);
        }
    }
    async incr(key) {
        const current = await this.get(key);
        const value = current ? parseInt(current) + 1 : 1;
        await this.set(key, value.toString());
        return value;
    }
    async healthCheck() {
        if (!this.connected) {
            return { healthy: false };
        }
        try {
            const startTime = Date.now();
            await this.set('health_check', 'ok', 1);
            await this.get('health_check');
            const latency = Date.now() - startTime;
            return { healthy: true, latency };
        }
        catch (error) {
            return { healthy: false };
        }
    }
    async flushdb() {
        this.cache.clear();
    }
    static async get(key) {
        return await RedisService.getInstance().get(key);
    }
    static async set(key, value, ttl) {
        await RedisService.getInstance().set(key, value, ttl);
        return 'OK';
    }
    static async setex(key, ttl, value) {
        return await RedisService.getInstance().set(key, value, ttl);
    }
    static async del(key) {
        await RedisService.getInstance().del(key);
        return 1;
    }
    static async exists(key) {
        const exists = await RedisService.getInstance().exists(key);
        return exists ? 1 : 0;
    }
    static async ping() {
        const instance = RedisService.getInstance();
        if (!instance['connected']) {
            await instance.connect();
        }
    }
}
exports.RedisService = RedisService;
exports.redisService = RedisService.getInstance();
exports.default = RedisService;
//# sourceMappingURL=redis.service.js.map