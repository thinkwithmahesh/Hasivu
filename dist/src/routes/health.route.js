"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const database_service_1 = require("../functions/shared/database.service");
const environment_1 = require("../config/environment");
const os = __importStar(require("os"));
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: environment_1.config.server.nodeEnv,
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
            }
        };
        res.status(200).json(healthStatus);
    }
    catch (error) {
        logger_1.logger.error('Health check failed', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});
router.get('/detailed', async (req, res) => {
    try {
        const startTime = Date.now();
        let databaseStatus = 'unknown';
        let databaseLatency = 0;
        try {
            const dbStartTime = Date.now();
            await database_service_1.DatabaseService.client.$queryRaw `SELECT 1`;
            databaseLatency = Date.now() - dbStartTime;
            databaseStatus = 'healthy';
        }
        catch (error) {
            databaseStatus = 'unhealthy';
            logger_1.logger.error('Database health check failed', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
            });
        }
        const totalLatency = Date.now() - startTime;
        const overallStatus = databaseStatus === 'healthy' ? 'healthy' : 'degraded';
        const detailedHealth = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: environment_1.config.server.nodeEnv,
            uptime: process.uptime(),
            latency: `${totalLatency}ms`,
            checks: {
                database: {
                    status: databaseStatus,
                    latency: `${databaseLatency}ms`,
                    timestamp: new Date().toISOString()
                },
                memory: {
                    status: 'healthy',
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                    rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
                    percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
                },
                cpu: {
                    status: 'healthy',
                    usage: process.cpuUsage(),
                    loadAverage: process.platform === 'linux' ? os.loadavg() : null
                }
            }
        };
        const statusCode = overallStatus === 'healthy' ? 200 : 503;
        res.status(statusCode).json(detailedHealth);
    }
    catch (error) {
        logger_1.logger.error('Detailed health check failed', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Detailed health check failed'
        });
    }
});
router.get('/database', async (req, res) => {
    try {
        const startTime = Date.now();
        await database_service_1.DatabaseService.client.$queryRaw `SELECT 1`;
        const latency = Date.now() - startTime;
        res.status(200).json({
            status: 'healthy',
            service: 'database',
            latency: `${latency}ms`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Database health check failed', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
        });
        res.status(503).json({
            status: 'unhealthy',
            service: 'database',
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Database connection failed',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/ready', async (req, res) => {
    try {
        await database_service_1.DatabaseService.client.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Readiness check failed', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
        });
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
            error: 'Critical services not available'
        });
    }
});
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        pid: process.pid,
        uptime: process.uptime()
    });
});
router.get('/startup', (req, res) => {
    const isStarted = process.uptime() > 5;
    if (isStarted) {
        res.status(200).json({
            status: 'started',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    }
    else {
        res.status(503).json({
            status: 'starting',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    }
});
router.get('/metrics', (req, res) => {
    try {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const metrics = {
            timestamp: new Date().toISOString(),
            process: {
                pid: process.pid,
                uptime: process.uptime(),
                version: process.version,
                platform: process.platform,
                arch: process.arch
            },
            memory: {
                rss: memoryUsage.rss,
                heapTotal: memoryUsage.heapTotal,
                heapUsed: memoryUsage.heapUsed,
                external: memoryUsage.external,
                arrayBuffers: memoryUsage.arrayBuffers
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            environment: {
                nodeEnv: process.env.NODE_ENV,
                version: process.env.npm_package_version || '1.0.0'
            }
        };
        res.status(200).json(metrics);
    }
    catch (error) {
        logger_1.logger.error('Metrics collection failed', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
        });
        res.status(500).json({
            error: 'Failed to collect metrics',
            timestamp: new Date().toISOString()
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.route.js.map