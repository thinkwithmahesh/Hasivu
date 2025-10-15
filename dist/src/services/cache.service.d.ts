export interface CacheOptions {
    ttl?: number;
    compress?: boolean;
    invalidationTags?: string[];
    priority?: 'low' | 'medium' | 'high';
    warmup?: boolean;
    serialize?: boolean;
}
export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    hitRate: number;
    memoryUsage: number;
    keyCount: number;
    avgGetTime: number;
    avgSetTime: number;
}
export interface CacheHealth {
    status: 'healthy' | 'warning' | 'error';
    redisStatus: 'connected' | 'disconnected' | 'error';
    memoryStatus: 'healthy' | 'warning' | 'critical';
    performanceStatus: 'optimal' | 'degraded' | 'poor';
    stats: CacheStats;
    errors: Array<{
        type: string;
        message: string;
        timestamp: Date;
    }>;
}
declare class CacheService {
    private readonly defaultTTL;
    private readonly defaultPrefix;
    private stats;
    get<T>(key: string, options?: CacheOptions): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    invalidatePattern(pattern: string): Promise<number>;
    invalidateByTag(tag: string): Promise<number>;
    getOrSet<T>(key: string, fetchFn: () => Promise<T>, options?: CacheOptions): Promise<T>;
    mget<T>(keys: string[]): Promise<Map<string, T>>;
    mset(entries: Map<string, any>, options?: CacheOptions): Promise<boolean>;
    getHealth(): Promise<CacheHealth>;
    getStats(): CacheStats;
    clear(): Promise<boolean>;
    cleanup(): Promise<void>;
    private buildKey;
    private parseRedisInfo;
    private updateAvgTime;
    private determineHealthStatus;
    private determineMemoryStatus;
    private determinePerformanceStatus;
}
declare const cacheServiceInstance: CacheService;
export declare const cacheService: CacheService;
export declare const _cacheService: CacheService;
export { CacheService };
export default cacheServiceInstance;
//# sourceMappingURL=cache.service.d.ts.map