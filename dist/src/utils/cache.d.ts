export interface CacheOptions {
    ttl?: number;
    namespace?: string;
    serialize?: boolean;
}
export type _CacheOptions = CacheOptions;
declare class InMemoryCache {
    private cache;
    constructor();
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    setex(key: string, seconds: number, value: string): Promise<void>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<boolean>;
    clear(): Promise<void>;
    size(): number;
}
export declare const cache: InMemoryCache;
export declare const _cache: InMemoryCache;
export {};
//# sourceMappingURL=cache.d.ts.map