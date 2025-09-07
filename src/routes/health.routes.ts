/**
 * HASIVU Platform - Health Check Routes
 * System health monitoring endpoints with comprehensive service checks
 */

import { Router, Request, Response } from 'express';
import { logger } from '@/utils/logger';
import { DatabaseService } from '@/services/database.service';
import { RedisService } from '@/services/redis.service';
import { config } from '@/config/environment';
import { asyncHandler } from '@/middleware/error.middleware';

const router = Router();

// Health status interfaces
interface ServiceHealth {
  status: 'up' | 'down';
  responseTime?: string;
  error?: string;
}

interface SystemHealth {
  system: {
    uptime: string;
    timestamp: string;
  };
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
  };
  metrics?: {
    memory: NodeJS.MemoryUsage;
  };
}

// Utility to format memory usage
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

// /health endpoint
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const start = Date.now();

    // Check DB
    let dbHealth: ServiceHealth = { status: 'up' };
    try {
      await DatabaseService.client.$queryRaw`SELECT 1`; // Basic connectivity check
      dbHealth.responseTime = `${Date.now() - start}ms`;
    } catch (err: any) {
      dbHealth = { status: 'down', error: err.message };
    }

    // Check Redis
    let redisHealth: ServiceHealth = { status: 'up' };
    try {
      await RedisService.ping();
      redisHealth.responseTime = `${Date.now() - start}ms`;
    } catch (err: any) {
      redisHealth = { status: 'down', error: err.message };
    }

    const health: SystemHealth = {
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
  })
);

export { router as healthRouter };
