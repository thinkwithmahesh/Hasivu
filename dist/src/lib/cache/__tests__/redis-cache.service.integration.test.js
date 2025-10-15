"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_cache_service_1 = require("../redis-cache.service");
const ioredis_1 = __importDefault(require("ioredis"));
describe('RedisCacheService - Integration Tests', () => {
    let cacheService;
    let redisClient;
    let testRedisUrl;
    beforeAll(async () => {
        testRedisUrl = process.env.TEST_REDIS_URL || 'redis://localhost:6379/15';
        redisClient = new ioredis_1.default(testRedisUrl);
        await redisClient.connect();
        cacheService = new redis_cache_service_1.RedisCacheService(testRedisUrl);
        await cacheService.connect();
    });
    afterAll(async () => {
        await redisClient.flushdb();
        await cacheService.disconnect();
        await redisClient.disconnect();
    });
    beforeEach(async () => {
        await redisClient.flushdb();
    });
    describe('Basic Cache Operations', () => {
        it('should store and retrieve simple values', async () => {
            const testData = { message: 'Hello, Redis!', timestamp: Date.now() };
            await cacheService.set('test:simple', testData, 3600);
            const retrieved = await cacheService.get('test:simple');
            expect(retrieved).toEqual(testData);
        });
        it('should handle TTL expiration correctly', async () => {
            const testData = { expiring: true };
            await cacheService.set('test:expiring', testData, 1);
            const immediate = await cacheService.get('test:expiring');
            expect(immediate).toEqual(testData);
            await new Promise(resolve => setTimeout(resolve, 1100));
            const expired = await cacheService.get('test:expiring');
            expect(expired).toBeNull();
        });
        it('should delete keys correctly', async () => {
            const testData = { toDelete: true };
            await cacheService.set('test:delete', testData);
            expect(await cacheService.get('test:delete')).toEqual(testData);
            const deleted = await cacheService.delete('test:delete');
            expect(deleted).toBe(true);
            expect(await cacheService.get('test:delete')).toBeNull();
        });
        it('should check key existence correctly', async () => {
            await cacheService.set('test:exists', { data: true });
            expect(await cacheService.exists('test:exists')).toBe(true);
            expect(await cacheService.exists('test:nonexistent')).toBe(false);
        });
        it('should get remaining TTL correctly', async () => {
            await cacheService.set('test:ttl', { data: true }, 3600);
            const ttl = await cacheService.getTTL('test:ttl');
            expect(ttl).toBeGreaterThan(3500);
            expect(ttl).toBeLessThanOrEqual(3600);
        });
    });
    describe('Advanced Cache Operations', () => {
        it('should handle cache tags correctly', async () => {
            await cacheService.setWithTags('test:tagged1', { data: 'A' }, 3600, ['menu', 'school:123']);
            await cacheService.setWithTags('test:tagged2', { data: 'B' }, 3600, ['menu', 'school:456']);
            await cacheService.setWithTags('test:tagged3', { data: 'C' }, 3600, ['orders', 'school:123']);
            expect(await cacheService.get('test:tagged1')).toEqual({ data: 'A' });
            expect(await cacheService.get('test:tagged2')).toEqual({ data: 'B' });
            expect(await cacheService.get('test:tagged3')).toEqual({ data: 'C' });
            await cacheService.invalidateByTags(['menu']);
            expect(await cacheService.get('test:tagged1')).toBeNull();
            expect(await cacheService.get('test:tagged2')).toBeNull();
            expect(await cacheService.get('test:tagged3')).toEqual({ data: 'C' });
        });
        it('should handle multiple tags per key', async () => {
            await cacheService.setWithTags('test:multitag', { data: 'multi' }, 3600, ['tag1', 'tag2', 'tag3']);
            expect(await cacheService.get('test:multitag')).toEqual({ data: 'multi' });
            await cacheService.invalidateByTags(['tag2']);
            expect(await cacheService.get('test:multitag')).toBeNull();
        });
        it('should increment and decrement counters', async () => {
            const initial = await cacheService.increment('test:counter');
            expect(initial).toBe(1);
            const second = await cacheService.increment('test:counter');
            expect(second).toBe(2);
            const incremented = await cacheService.increment('test:counter', 5);
            expect(incremented).toBe(7);
            const decremented = await cacheService.decrement('test:counter', 3);
            expect(decremented).toBe(4);
        });
        it('should handle key patterns and bulk operations', async () => {
            await cacheService.set('test:pattern:1', { id: 1 });
            await cacheService.set('test:pattern:2', { id: 2 });
            await cacheService.set('test:pattern:3', { id: 3 });
            await cacheService.set('test:other:1', { other: true });
            const patternKeys = await cacheService.getKeysByPattern('test:pattern:*');
            expect(patternKeys).toHaveLength(3);
            expect(patternKeys).toContain('test:pattern:1');
            expect(patternKeys).toContain('test:pattern:2');
            expect(patternKeys).toContain('test:pattern:3');
            await cacheService.deleteByPattern('test:pattern:*');
            expect(await cacheService.get('test:pattern:1')).toBeNull();
            expect(await cacheService.get('test:pattern:2')).toBeNull();
            expect(await cacheService.get('test:pattern:3')).toBeNull();
            expect(await cacheService.get('test:other:1')).toEqual({ other: true });
        });
    });
    describe('Menu-Specific Caching', () => {
        it('should cache menu items with proper structure', async () => {
            const menuItem = {
                id: 'item_123',
                name: 'Vegetable Biryani',
                price: 80,
                nutritionalInfo: {
                    calories: 450,
                    protein: 12,
                    carbs: 65,
                    fat: 15,
                },
                allergens: ['GLUTEN'],
                available: true,
            };
            await cacheService.cacheMenuItem(menuItem, 1800);
            const cached = await cacheService.getMenuItem('item_123');
            expect(cached).toEqual(menuItem);
            await cacheService.invalidateByTags(['menu']);
            expect(await cacheService.getMenuItem('item_123')).toBeNull();
        });
        it('should cache school menus with date-based keys', async () => {
            const schoolMenu = {
                schoolId: 'school_123',
                date: '2024-01-15',
                mealType: 'LUNCH',
                items: [
                    { id: 'item_1', name: 'Rice', price: 40 },
                    { id: 'item_2', name: 'Dal', price: 35 },
                ],
                totalItems: 2,
            };
            await cacheService.cacheSchoolMenu(schoolMenu.schoolId, schoolMenu.date, schoolMenu.mealType, schoolMenu);
            const cached = await cacheService.getSchoolMenu('school_123', '2024-01-15', 'LUNCH');
            expect(cached).toEqual(schoolMenu);
            const tags = await cacheService.getKeyTags(cacheService.generateMenuKey('school_123', '2024-01-15', 'LUNCH'));
            expect(tags).toContain('menu');
            expect(tags).toContain('school:school_123');
        });
        it('should handle menu availability updates', async () => {
            const menuItem = {
                id: 'item_456',
                name: 'Paneer Curry',
                available: true,
                stock: 50,
            };
            await cacheService.cacheMenuItem(menuItem);
            expect(await cacheService.getMenuItem('item_456')).toEqual(menuItem);
            await cacheService.updateMenuItemAvailability('item_456', false);
            const updated = await cacheService.getMenuItem('item_456');
            expect(updated?.available).toBe(false);
            expect(updated?.stock).toBe(50);
        });
        it('should cache and invalidate nutritional analysis', async () => {
            const nutritionalAnalysis = {
                menuItemId: 'item_789',
                totalCalories: 350,
                macroDistribution: {
                    protein: 15,
                    carbs: 55,
                    fat: 10,
                },
                complianceScore: 85,
                allergenWarnings: ['DAIRY'],
            };
            await cacheService.cacheNutritionalAnalysis('item_789', nutritionalAnalysis);
            const cached = await cacheService.getNutritionalAnalysis('item_789');
            expect(cached).toEqual(nutritionalAnalysis);
            await cacheService.invalidateByTags(['nutrition']);
            expect(await cacheService.getNutritionalAnalysis('item_789')).toBeNull();
        });
    });
    describe('Order-Specific Caching', () => {
        it('should cache user orders with proper expiration', async () => {
            const userOrders = [
                { id: 'order_1', status: 'CONFIRMED', items: ['item_1'] },
                { id: 'order_2', status: 'PREPARING', items: ['item_2'] },
            ];
            await cacheService.cacheUserOrders('user_123', userOrders);
            const cached = await cacheService.getUserOrders('user_123');
            expect(cached).toEqual(userOrders);
            const tags = await cacheService.getKeyTags(cacheService.generateUserOrdersKey('user_123'));
            expect(tags).toContain('orders');
            expect(tags).toContain('user:user_123');
        });
        it('should handle order status updates efficiently', async () => {
            const order = {
                id: 'order_abc',
                userId: 'user_456',
                status: 'CONFIRMED',
                items: [{ itemId: 'item_1', quantity: 2 }],
                timestamp: Date.now(),
            };
            await cacheService.cacheOrder(order);
            expect(await cacheService.getOrder('order_abc')).toEqual(order);
            await cacheService.updateOrderStatus('order_abc', 'PREPARING');
            const updated = await cacheService.getOrder('order_abc');
            expect(updated?.status).toBe('PREPARING');
            expect(updated?.items).toEqual(order.items);
        });
        it('should cache school order queue with real-time updates', async () => {
            const orderQueue = [
                { orderId: 'order_1', priority: 1, estimatedTime: 15 },
                { orderId: 'order_2', priority: 2, estimatedTime: 20 },
                { orderId: 'order_3', priority: 3, estimatedTime: 25 },
            ];
            await cacheService.cacheSchoolOrderQueue('school_789', orderQueue);
            const cached = await cacheService.getSchoolOrderQueue('school_789');
            expect(cached).toEqual(orderQueue);
            const ttl = await cacheService.getTTL(cacheService.generateSchoolQueueKey('school_789'));
            expect(ttl).toBeLessThanOrEqual(300);
        });
    });
    describe('Session & User Caching', () => {
        it('should cache user sessions with security considerations', async () => {
            const sessionData = {
                userId: 'user_789',
                schoolId: 'school_456',
                role: 'STUDENT',
                permissions: ['ORDER_FOOD', 'VIEW_MENU'],
                lastActivity: Date.now(),
                ipAddress: '192.168.1.100',
            };
            await cacheService.cacheUserSession('session_xyz', sessionData, 86400);
            const cached = await cacheService.getUserSession('session_xyz');
            expect(cached).toEqual(sessionData);
            const tags = await cacheService.getKeyTags(cacheService.generateSessionKey('session_xyz'));
            expect(tags).toContain('session');
            expect(tags).toContain('user:user_789');
        });
        it('should handle user preference caching with personalization', async () => {
            const preferences = {
                userId: 'user_012',
                dietaryRestrictions: ['VEGETARIAN'],
                allergens: ['NUTS', 'DAIRY'],
                favoriteItems: ['item_1', 'item_5', 'item_12'],
                spicePreference: 'MEDIUM',
                portionSize: 'REGULAR',
                lastUpdated: Date.now(),
            };
            await cacheService.cacheUserPreferences('user_012', preferences);
            const cached = await cacheService.getUserPreferences('user_012');
            expect(cached).toEqual(preferences);
            await cacheService.invalidateByTags(['user:user_012']);
            expect(await cacheService.getUserPreferences('user_012')).toBeNull();
        });
        it('should cache search results with query-based keys', async () => {
            const searchQuery = 'vegetarian biryani';
            const searchResults = [
                { id: 'item_1', name: 'Veg Biryani', relevance: 0.95 },
                { id: 'item_2', name: 'Vegetarian Fried Rice', relevance: 0.75 },
            ];
            await cacheService.cacheSearchResults(searchQuery, 'school_123', searchResults);
            const cached = await cacheService.getSearchResults(searchQuery, 'school_123');
            expect(cached).toEqual(searchResults);
            const tags = await cacheService.getKeyTags(cacheService.generateSearchKey(searchQuery, 'school_123'));
            expect(tags).toContain('search');
            expect(tags).toContain('school:school_123');
        });
    });
    describe('Performance and Scalability', () => {
        it('should handle high-volume concurrent operations', async () => {
            const operations = Array.from({ length: 1000 }, (_, i) => ({
                key: `test:concurrent:${i}`,
                data: { index: i, timestamp: Date.now() },
            }));
            const startTime = Date.now();
            await Promise.all(operations.map(op => cacheService.set(op.key, op.data, 300)));
            const results = await Promise.all(operations.map(op => cacheService.get(op.key)));
            const endTime = Date.now();
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(5000);
            results.forEach((result, index) => {
                expect(result).toEqual(operations[index].data);
            });
        });
        it('should maintain cache consistency under load', async () => {
            const key = 'test:consistency';
            const counter = 0;
            const incrementPromises = Array.from({ length: 100 }, () => cacheService.increment(key));
            const results = await Promise.all(incrementPromises);
            results.sort((a, b) => a - b);
            expect(results[0]).toBe(1);
            expect(results[99]).toBe(100);
            const finalValue = await redisClient.get(key);
            expect(parseInt(finalValue || '0')).toBe(100);
        });
        it('should handle cache warming efficiently', async () => {
            const warmupData = Array.from({ length: 500 }, (_, i) => ({
                key: `warmup:item:${i}`,
                data: {
                    id: i,
                    name: `Item ${i}`,
                    category: i % 10 === 0 ? 'PREMIUM' : 'REGULAR',
                    price: 50 + (i % 100),
                },
                ttl: 3600,
                tags: ['menu', `category:${i % 10 === 0 ? 'PREMIUM' : 'REGULAR'}`],
            }));
            const startTime = Date.now();
            await cacheService.bulkWarmup(warmupData);
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(3000);
            for (let i = 0; i < 10; i++) {
                const randomIndex = Math.floor(Math.random() * 500);
                const cached = await cacheService.get(`warmup:item:${randomIndex}`);
                expect(cached).toEqual(warmupData[randomIndex].data);
            }
        });
        it('should provide accurate cache statistics', async () => {
            await cacheService.set('stats:test:1', { data: 'A' });
            await cacheService.set('stats:test:2', { data: 'B' });
            await cacheService.get('stats:test:1');
            await cacheService.get('stats:test:3');
            await cacheService.delete('stats:test:2');
            const stats = await cacheService.getCacheStatistics();
            expect(stats.totalKeys).toBeGreaterThan(0);
            expect(stats.memoryUsage).toBeGreaterThan(0);
            expect(stats.hitRate).toBeGreaterThanOrEqual(0);
            expect(stats.hitRate).toBeLessThanOrEqual(100);
            expect(stats.operations.gets).toBeGreaterThan(0);
            expect(stats.operations.sets).toBeGreaterThan(0);
            expect(stats.operations.deletes).toBeGreaterThan(0);
        });
    });
    describe('Error Handling and Recovery', () => {
        it('should handle Redis connection failures gracefully', async () => {
            await cacheService.disconnect();
            const result = await cacheService.get('test:disconnected');
            expect(result).toBeNull();
            const setResult = await cacheService.set('test:disconnected', { data: true });
            expect(setResult).toBe(false);
            await cacheService.connect();
            await cacheService.set('test:reconnected', { success: true });
            expect(await cacheService.get('test:reconnected')).toEqual({ success: true });
        });
        it('should handle malformed data gracefully', async () => {
            await redisClient.set('test:malformed', 'invalid-json{');
            const result = await cacheService.get('test:malformed');
            expect(result).toBeNull();
            await cacheService.set('test:malformed', { valid: true });
            expect(await cacheService.get('test:malformed')).toEqual({ valid: true });
        });
        it('should handle large data objects appropriately', async () => {
            const largeObject = {
                id: 'large_test',
                data: Array.from({ length: 10000 }, (_, i) => ({
                    index: i,
                    value: `Large data item ${i}`,
                    metadata: { created: Date.now(), type: 'test' },
                })),
            };
            const setResult = await cacheService.set('test:large', largeObject, 300);
            expect(setResult).toBe(true);
            const retrieved = await cacheService.get('test:large');
            expect(retrieved?.id).toBe(largeObject.id);
            expect(retrieved?.data).toHaveLength(10000);
            expect(retrieved?.data[0]).toEqual(largeObject.data[0]);
        });
        it('should implement cache circuit breaker for failures', async () => {
            const stats = await cacheService.getCacheStatistics();
            expect(stats.errors).toBeDefined();
            expect(typeof stats.errors.total).toBe('number');
            expect(typeof stats.errors.connectionErrors).toBe('number');
            expect(typeof stats.errors.timeouts).toBe('number');
        });
    });
    describe('Cache Optimization and Maintenance', () => {
        it('should implement intelligent cache warming based on usage patterns', async () => {
            const popularItems = [
                { key: 'popular:item:1', data: { name: 'Popular Item 1', hits: 100 } },
                { key: 'popular:item:2', data: { name: 'Popular Item 2', hits: 95 } },
                { key: 'popular:item:3', data: { name: 'Popular Item 3', hits: 85 } },
            ];
            for (const item of popularItems) {
                await cacheService.set(item.key, item.data, 300);
                for (let i = 0; i < item.data.hits; i++) {
                    await cacheService.get(item.key);
                }
            }
            await cacheService.warmPopularItems(3);
            for (const item of popularItems) {
                const cached = await cacheService.get(item.key);
                expect(cached).toEqual(item.data);
            }
        });
        it('should handle cache invalidation cascading correctly', async () => {
            await cacheService.setWithTags('school:123:menu', { data: 'school menu' }, 3600, ['school:123', 'menu']);
            await cacheService.setWithTags('school:123:orders', { data: 'school orders' }, 3600, ['school:123', 'orders']);
            await cacheService.setWithTags('user:456:orders', { data: 'user orders' }, 3600, ['user:456', 'orders', 'school:123']);
            await cacheService.invalidateByTags(['school:123']);
            expect(await cacheService.get('school:123:menu')).toBeNull();
            expect(await cacheService.get('school:123:orders')).toBeNull();
            expect(await cacheService.get('user:456:orders')).toBeNull();
        });
        it('should provide cache health monitoring', async () => {
            const health = await cacheService.getCacheHealth();
            expect(health.status).toMatch(/^(healthy|warning|critical)$/);
            expect(typeof health.connectionStatus).toBe('string');
            expect(typeof health.memoryUsagePercent).toBe('number');
            expect(typeof health.responseTime).toBe('number');
            expect(health.responseTime).toBeGreaterThan(0);
            expect(Array.isArray(health.recommendations)).toBe(true);
        });
    });
});
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
//# sourceMappingURL=redis-cache.service.integration.test.js.map