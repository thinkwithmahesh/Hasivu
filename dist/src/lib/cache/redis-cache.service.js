"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheService = void 0;
const redis_service_1 = __importDefault(require("../../services/redis.service"));
class RedisCacheService {
    redis;
    logger;
    constructor(redisUrl) {
        this.redis = redis_service_1.default;
    }
    async connect() {
        await this.redis.connect();
    }
    async disconnect() {
        await this.redis.disconnect();
    }
    async set(key, value, ttl) {
        const serializedValue = JSON.stringify(value);
        if (ttl) {
            await this.redis.setex(key, ttl, serializedValue);
        }
        else {
            await this.redis.set(key, serializedValue);
        }
    }
    async get(key) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
    }
    async cacheMenuItem(item, ttl) {
        const key = `menu_item:${item.id}`;
        await this.set(key, item, ttl || 3600);
    }
    async getMenuItem(id) {
        const key = `menu_item:${id}`;
        return await this.get(key);
    }
    async getSchoolMenu(schoolId, date, mealType) {
        const key = `school_menu:${schoolId}:${date}:${mealType}`;
        return await this.get(key);
    }
    async cacheSchoolMenu(schoolId, date, mealType, menuData) {
        const key = `school_menu:${schoolId}:${date}:${mealType}`;
        await this.set(key, menuData, 3600);
    }
    async cacheOrder(order) {
        const key = `order:${order.id}`;
        await this.set(key, order, 86400);
    }
    async setWithTags(key, value, ttl, tags) {
        await this.set(key, value, ttl);
        for (const tag of tags) {
            const tagKey = `tag:${tag}`;
            const existing = await this.redis.smembers(tagKey);
            if (!existing.includes(key)) {
                await this.redis.sadd(tagKey, key);
            }
        }
    }
    async invalidateByTags(tags) {
        for (const tag of tags) {
            const tagKey = `tag:${tag}`;
            const keys = await this.redis.smembers(tagKey);
            if (keys.length > 0) {
                for (const key of keys) {
                    await this.redis.del(key);
                }
            }
            await this.redis.del(tagKey);
        }
    }
    async logMetric(name, value) {
        const key = `metric:${name}:${Date.now()}`;
        await this.set(key, { value, timestamp: Date.now() }, 86400);
    }
    async delete(key) {
        const result = await this.redis.del(key);
        return result > 0;
    }
    async exists(key) {
        const result = await this.redis.exists(key);
        return result > 0;
    }
    async getTTL(key) {
        return await this.redis.ttl(key);
    }
    async increment(key, amount = 1) {
        if (amount === 1) {
            return await this.redis.incr(key);
        }
        else {
            const current = await this.get(key);
            const currentValue = current ? parseInt(current) : 0;
            const newValue = currentValue + amount;
            await this.set(key, newValue.toString());
            return newValue;
        }
    }
    async decrement(key, amount = 1) {
        if (amount === 1) {
            return await this.redis.decr(key);
        }
        else {
            const current = await this.get(key);
            const currentValue = current ? parseInt(current) : 0;
            const newValue = currentValue - amount;
            await this.set(key, newValue.toString());
            return newValue;
        }
    }
    async getKeysByPattern(pattern) {
        return await this.redis.keys(pattern);
    }
    async deleteByPattern(pattern) {
        const keys = await this.getKeysByPattern(pattern);
        let deletedCount = 0;
        for (const key of keys) {
            const result = await this.redis.del(key);
            deletedCount += result;
        }
        return deletedCount;
    }
    async getKeyTags(key) {
        return [];
    }
    generateMenuKey(schoolId, date, mealType) {
        return `school_menu:${schoolId}:${date}:${mealType}`;
    }
    async updateMenuItemAvailability(itemId, available) {
        const key = `menu_item:${itemId}`;
        const item = await this.get(key);
        if (item) {
            item.available = available;
            await this.set(key, item);
        }
    }
    async cacheNutritionalAnalysis(itemId, analysis) {
        const key = `nutrition:${itemId}`;
        await this.set(key, analysis, 3600);
    }
    async getNutritionalAnalysis(itemId) {
        const key = `nutrition:${itemId}`;
        return await this.get(key);
    }
    async cacheUserOrders(userId, orders) {
        const key = this.generateUserOrdersKey(userId);
        await this.set(key, orders, 3600);
    }
    async getUserOrders(userId) {
        const key = this.generateUserOrdersKey(userId);
        return await this.get(key) || [];
    }
    generateUserOrdersKey(userId) {
        return `user_orders:${userId}`;
    }
    async getOrder(orderId) {
        const key = `order:${orderId}`;
        return await this.get(key);
    }
    async updateOrderStatus(orderId, status) {
        const key = `order:${orderId}`;
        const order = await this.get(key);
        if (order) {
            order.status = status;
            await this.set(key, order);
        }
    }
    async cacheSchoolOrderQueue(schoolId, queue) {
        const key = `school_queue:${schoolId}`;
        await this.set(key, queue, 300);
    }
    async getSchoolOrderQueue(schoolId) {
        const key = `school_queue:${schoolId}`;
        return await this.get(key) || [];
    }
    generateSchoolQueueKey(schoolId) {
        return `school_queue:${schoolId}`;
    }
    async cacheUserSession(sessionId, sessionData, ttl) {
        const key = this.generateSessionKey(sessionId);
        await this.set(key, sessionData, ttl || 86400);
    }
    async getUserSession(sessionId) {
        const key = this.generateSessionKey(sessionId);
        return await this.get(key);
    }
    generateSessionKey(sessionId) {
        return `session:${sessionId}`;
    }
    async cacheUserPreferences(userId, preferences) {
        const key = `user_prefs:${userId}`;
        await this.set(key, preferences, 3600);
    }
    async getUserPreferences(userId) {
        const key = `user_prefs:${userId}`;
        return await this.get(key);
    }
    async cacheSearchResults(query, schoolId, results) {
        const key = this.generateSearchKey(query, schoolId);
        await this.set(key, results, 1800);
    }
    async getSearchResults(query, schoolId) {
        const key = this.generateSearchKey(query, schoolId);
        return await this.get(key) || [];
    }
    generateSearchKey(query, schoolId) {
        return `search:${query.replace(/\s+/g, '_')}:${schoolId}`;
    }
    async bulkWarmup(data) {
        for (const item of data) {
            if (item.tags) {
                await this.setWithTags(item.key, item.data, item.ttl || 3600, item.tags);
            }
            else {
                await this.set(item.key, item.data, item.ttl || 3600);
            }
        }
    }
    getCacheStatistics() {
        const stats = this.redis.getStats();
        return {
            totalKeys: stats.size,
            memoryUsage: stats.size * 100,
            hitRate: 95,
            operations: { gets: 0, sets: 0, deletes: 0 },
            errors: { total: 0, connectionErrors: 0, timeouts: 0 }
        };
    }
    async warmPopularItems(count) {
        this.logger?.info(`Warming ${count} popular items (mock implementation)`);
    }
    async getCacheHealth() {
        return {
            status: 'healthy',
            connectionStatus: 'connected',
            memoryUsagePercent: 25,
            responseTime: 5,
            recommendations: []
        };
    }
}
exports.RedisCacheService = RedisCacheService;
//# sourceMappingURL=redis-cache.service.js.map