export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
}
export declare class RedisService {
    private static instance;
    private connected;
    private config;
    private cache;
    private constructor();
    static getInstance(): RedisService;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<void>;
    incr(key: string): Promise<number>;
    healthCheck(): Promise<{
        healthy: boolean;
        latency?: number;
    }>;
    flushdb(): Promise<void>;
    static get(key: string): Promise<string | null>;
    static set(key: string, value: string, ttl?: number): Promise<string>;
    static setex(key: string, ttl: number, value: string): Promise<void>;
    static del(key: string | string[]): Promise<number>;
    static exists(key: string): Promise<number>;
    static ping(): Promise<void>;
    static keys(pattern: string): Promise<string[]>;
}
export declare const redisService: RedisService;
export default RedisService;
//# sourceMappingURL=redis.service.d.ts.map