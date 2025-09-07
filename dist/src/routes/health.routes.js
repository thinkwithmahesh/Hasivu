"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const database_service_1 = require("@/services/database.service");
const redis_service_1 = require("@/services/redis.service");
const error_middleware_1 = require("@/middleware/error.middleware");
const router = (0, express_1.Router)();
exports.healthRouter = router;
function getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
        rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(usage.external / 1024 / 1024)}MB`,
        arrayBuffers: `${Math.round(usage.arrayBuffers / 1024 / 1024)}MB`,
    };
}
router.get('/', (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const start = Date.now();
    let dbHealth = { status: 'up' };
    try {
        await database_service_1.DatabaseService.client.$queryRaw `SELECT 1`;
        dbHealth.responseTime = `${Date.now() - start}ms`;
    }
    catch (err) {
        dbHealth = { status: 'down', error: err.message };
    }
    let redisHealth = { status: 'up' };
    try {
        await redis_service_1.RedisService.ping();
        redisHealth.responseTime = `${Date.now() - start}ms`;
    }
    catch (err) {
        redisHealth = { status: 'down', error: err.message };
    }
    const health = {
        system: {
            uptime: `${process.uptime()}s`,
            timestamp: new Date().toISOString(),
        },
        services: {
            database: dbHealth,
            redis: redisHealth,
        },
        metrics: {
            memory: process.memoryUsage(),
        },
    };
    res.status(200).json(health);
}));
//# sourceMappingURL=health.routes.js.map