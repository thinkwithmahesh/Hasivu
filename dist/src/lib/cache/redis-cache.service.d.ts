import { MenuItem } from '../../services/nutritional-compliance.types';
export interface Order {
    id: string;
    studentId?: string;
    userId?: string;
    status?: string;
    items: string[] | {
        itemId: string;
        quantity: number;
    }[];
    timestamp: number;
}
export declare class RedisCacheService {
    private redis;
    private logger;
    constructor(redisUrl?: string);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    get(key: string): Promise<any>;
    cacheMenuItem(item: any, ttl?: number): Promise<void>;
    getMenuItem(id: string): Promise<MenuItem | null>;
    getSchoolMenu(schoolId: string, date: string, mealType: string): Promise<any>;
    cacheSchoolMenu(schoolId: string, date: string, mealType: string, menuData: any): Promise<void>;
    cacheOrder(order: Order): Promise<void>;
    setWithTags(key: string, value: any, ttl: number, tags: string[]): Promise<void>;
    invalidateByTags(tags: string[]): Promise<void>;
    logMetric(name: string, value: any): Promise<void>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    getTTL(key: string): Promise<number>;
    increment(key: string, amount?: number): Promise<number>;
    decrement(key: string, amount?: number): Promise<number>;
    getKeysByPattern(pattern: string): Promise<string[]>;
    deleteByPattern(pattern: string): Promise<number>;
    getKeyTags(key: string): Promise<string[]>;
    generateMenuKey(schoolId: string, date: string, mealType: string): string;
    updateMenuItemAvailability(itemId: string, available: boolean): Promise<void>;
    cacheNutritionalAnalysis(itemId: string, analysis: any): Promise<void>;
    getNutritionalAnalysis(itemId: string): Promise<any>;
    cacheUserOrders(userId: string, orders: any[]): Promise<void>;
    getUserOrders(userId: string): Promise<any[]>;
    generateUserOrdersKey(userId: string): string;
    getOrder(orderId: string): Promise<Order | null>;
    updateOrderStatus(orderId: string, status: string): Promise<void>;
    cacheSchoolOrderQueue(schoolId: string, queue: any[]): Promise<void>;
    getSchoolOrderQueue(schoolId: string): Promise<any[]>;
    generateSchoolQueueKey(schoolId: string): string;
    cacheUserSession(sessionId: string, sessionData: any, ttl?: number): Promise<void>;
    getUserSession(sessionId: string): Promise<any>;
    generateSessionKey(sessionId: string): string;
    cacheUserPreferences(userId: string, preferences: any): Promise<void>;
    getUserPreferences(userId: string): Promise<any>;
    cacheSearchResults(query: string, schoolId: string, results: any[]): Promise<void>;
    getSearchResults(query: string, schoolId: string): Promise<any[]>;
    generateSearchKey(query: string, schoolId: string): string;
    bulkWarmup(data: Array<{
        key: string;
        data: any;
        ttl?: number;
        tags?: string[];
    }>): Promise<void>;
    getCacheStatistics(): {
        totalKeys: number;
        memoryUsage: number;
        hitRate: number;
        operations: {
            gets: number;
            sets: number;
            deletes: number;
        };
        errors: {
            total: number;
            connectionErrors: number;
            timeouts: number;
        };
    };
    warmPopularItems(count: number): Promise<void>;
    getCacheHealth(): Promise<{
        status: 'healthy' | 'warning' | 'critical';
        connectionStatus: string;
        memoryUsagePercent: number;
        responseTime: number;
        recommendations: string[];
    }>;
}
//# sourceMappingURL=redis-cache.service.d.ts.map