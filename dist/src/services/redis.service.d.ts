export interface RedisHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    connected: boolean;
    errors: string[];
}
declare class RedisService {
    private static instance;
    private cache;
    private connected;
    constructor();
    static getInstance(): RedisService;
    static connect(): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<string>;
    setex(key: string, seconds: number, value: string): Promise<string>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ttl(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
    sadd(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    sismember(key: string, member: string): Promise<number>;
    getStats(): {
        size: number;
        connected: boolean;
    };
    flushall(): Promise<string>;
    ping(): Promise<string>;
    getHealth(): Promise<RedisHealth>;
    private cleanupExpired;
}
declare const redisService: RedisService;
export { redisService as RedisService };
export default redisService;
//# sourceMappingURL=redis.service.d.ts.map