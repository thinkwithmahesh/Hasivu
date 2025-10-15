"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_service_1 = require("../shared/logger.service");
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    lazyConnect: false,
};
const redis = new ioredis_1.default(redisConfig);
exports.redis = redis;
redis.on('connect', () => {
    logger_service_1.logger.info('Redis client connecting...');
});
redis.on('ready', () => {
    logger_service_1.logger.info('Redis client connected and ready');
});
redis.on('error', error => {
    logger_service_1.logger.error('Redis connection error', error);
});
redis.on('close', () => {
    logger_service_1.logger.warn('Redis connection closed');
});
redis.on('reconnecting', () => {
    logger_service_1.logger.info('Redis client reconnecting...');
});
process.on('SIGINT', async () => {
    await redis.quit();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await redis.quit();
    process.exit(0);
});
exports.default = redis;
//# sourceMappingURL=redis.js.map