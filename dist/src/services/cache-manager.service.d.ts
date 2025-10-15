/// <reference types="node" />
import { EventEmitter } from 'events';
export interface CacheEntry<T = any> {
    key: string;
    value: T;
    ttl?: number;
    expiresAt?: Date;
    createdAt: Date;
    accessCount: number;
    lastAccessedAt: Date;
    size: number;
    compressed?: boolean;
}
export interface CacheStats {
    totalEntries: number;
    totalMemoryUsage: number;
    hitRate: number;
    missRate: number;
    totalHits: number;
    totalMisses: number;
    totalEvictions: number;
    averageEntrySize: number;
    oldestEntry?: Date;
    newestEntry?: Date;
}
export interface CacheConfig {
    maxEntries: number;
    maxMemoryMB: number;
    defaultTTL: number;
    enableCompression: boolean;
    compressionThreshold: number;
    cleanupInterval: number;
    enableRedisBackup: boolean;
}
export declare class CacheManager extends EventEmitter {
    private readonly cache;
    private readonly accessOrder;
    private stats;
    private accessCounter;
    private cleanupTimer?;
    private readonly config;
    constructor(config?: Partial<CacheConfig>);
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    setex(key: string, ttlSeconds: number, value: any): Promise<void>;
    del(key: string): Promise<boolean>;
    has(key: string): Promise<boolean>;
    mget<T = any>(keys: string[]): Promise<Array<T | null>>;
    mset(entries: Array<{
        key: string;
        value: any;
        ttl?: number;
    }>): Promise<void>;
    keys(pattern?: string): string[];
    clear(): Promise<void>;
    getStats(): CacheStats;
    getHealthStatus(): {
        healthy: boolean;
        memoryUsagePercent: number;
        entryCount: number;
    };
    shutdown(): void;
    private isExpired;
    private serializeValue;
    private deserializeValue;
    private calculateSize;
    private compress;
    private decompress;
    private ensureMemoryLimits;
    private evictLRU;
    private startCleanupProcess;
    private cleanupExpiredEntries;
}
export declare const cacheManager: CacheManager;
export default cacheManager;
//# sourceMappingURL=cache-manager.service.d.ts.map