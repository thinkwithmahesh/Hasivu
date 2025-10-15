export declare const CacheTTL: {
    readonly USER_PROFILE: 3600;
    readonly ORDER_LIST: 300;
    readonly MENU_ITEMS: 1800;
    readonly DAILY_MENU: 7200;
    readonly PAYMENT_METHODS: 1800;
    readonly ANALYTICS: 3600;
    readonly SCHOOL_CONFIG: 7200;
    readonly SUBSCRIPTION_PLAN: 3600;
    readonly SHORT_LIVED: 60;
    readonly MEDIUM_LIVED: 600;
    readonly LONG_LIVED: 86400;
};
export declare function getCached<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T>;
export declare function setCached<T>(key: string, value: T, ttl: number): Promise<void>;
export declare function getFromCache<T>(key: string): Promise<T | null>;
export declare function deleteCache(key: string): Promise<void>;
export declare function invalidateCache(pattern: string): Promise<void>;
export declare function invalidateMultiplePatterns(patterns: string[]): Promise<void>;
export declare function cacheExists(key: string): Promise<boolean>;
export declare function getCacheTTL(key: string): Promise<number>;
export declare function extendCacheTTL(key: string, ttl: number): Promise<void>;
export declare function getCacheStats(): Promise<{
    keys: number;
    memory: string;
    hitRate: number;
}>;
export declare function warmUpCache(dataLoaders: Array<{
    key: string;
    ttl: number;
    loader: () => Promise<any>;
}>): Promise<void>;
export declare function clearAllCache(): Promise<void>;
//# sourceMappingURL=cache-utils.d.ts.map