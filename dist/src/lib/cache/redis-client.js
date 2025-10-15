"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const cloudwatch_metrics_1 = require("../monitoring/cloudwatch-metrics");
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy: (times) => {
        if (times > 10) {
            console.error('Redis max retry attempts reached');
            return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    connectTimeout: 10000,
    keepAlive: 30000,
};
const redis = new ioredis_1.default(redisConfig);
redis.on('connect', () => {
    console.log('Redis client connected successfully');
    (0, cloudwatch_metrics_1.recordMetric)('RedisConnectionStatus', 1, 'Count').catch(console.error);
});
redis.on('ready', () => {
    console.log('Redis client ready to accept commands');
});
redis.on('error', error => {
    console.error('Redis connection error:', error);
    (0, cloudwatch_metrics_1.recordMetric)('RedisConnectionErrors', 1, 'Count').catch(console.error);
});
redis.on('close', () => {
    console.log('Redis connection closed');
    (0, cloudwatch_metrics_1.recordMetric)('RedisConnectionStatus', 0, 'Count').catch(console.error);
});
redis.on('reconnecting', () => {
    console.log('Redis client reconnecting...');
});
process.on('SIGTERM', async () => {
    console.log('Closing Redis connection...');
    await redis.quit();
});
process.on('SIGINT', async () => {
    console.log('Closing Redis connection...');
    await redis.quit();
});
exports.default = redis;
//# sourceMappingURL=redis-client.js.map