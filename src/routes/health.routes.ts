/**
 * HASIVU Platform - Health Check Routes
 * System health monitoring endpoints with comprehensive service checks
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '@/services/database.service';
import { RedisService } from '@/services/redis.service';
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

async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    await DatabaseService.client.$queryRaw`SELECT 1`;
    return { status: 'up', responseTime: `${Date.now() - start}ms` };
  } catch (err: unknown) {
    return {
      status: 'down',
      error: err instanceof Error ? err.message : 'Database health check failed',
    };
  }
}

async function checkRedis(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    await RedisService.ping();
    return { status: 'up', responseTime: `${Date.now() - start}ms` };
  } catch (err: unknown) {
    return {
      status: 'down',
      error: err instanceof Error ? err.message : 'Redis health check failed',
    };
  }
}

async function checkDependencies(): Promise<SystemHealth> {
  const [dbHealth, redisHealth] = await Promise.all([checkDatabase(), checkRedis()]);

  return {
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
}

function isReady(health: SystemHealth): boolean {
  return Object.values(health.services).every(service => service.status === 'up');
}

// /health endpoint
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const health = await checkDependencies();
    res.status(isReady(health) ? 200 : 503).json(health);
  })
);

router.get(
  '/live',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'up',
      uptime: `${process.uptime()}s`,
      timestamp: new Date().toISOString(),
    });
  })
);

router.get(
  '/ready',
  asyncHandler(async (_req: Request, res: Response) => {
    const health = await checkDependencies();
    res.status(isReady(health) ? 200 : 503).json(health);
  })
);

router.get(
  '/metrics',
  asyncHandler(async (_req: Request, res: Response) => {
    const health = await checkDependencies();
    const memory = process.memoryUsage();
    const ready = isReady(health) ? 1 : 0;

    res.type('text/plain').send(
      [
        '# HELP hasivu_process_ready Whether the API is ready to serve traffic.',
        '# TYPE hasivu_process_ready gauge',
        `hasivu_process_ready ${ready}`,
        '# HELP hasivu_process_uptime_seconds Node.js process uptime in seconds.',
        '# TYPE hasivu_process_uptime_seconds gauge',
        `hasivu_process_uptime_seconds ${process.uptime()}`,
        '# HELP hasivu_process_memory_bytes Node.js process memory usage in bytes.',
        '# TYPE hasivu_process_memory_bytes gauge',
        `hasivu_process_memory_bytes{type="rss"} ${memory.rss}`,
        `hasivu_process_memory_bytes{type="heapUsed"} ${memory.heapUsed}`,
        `hasivu_dependency_up{dependency="database"} ${health.services.database.status === 'up' ? 1 : 0}`,
        `hasivu_dependency_up{dependency="redis"} ${health.services.redis.status === 'up' ? 1 : 0}`,
        '',
      ].join('\n')
    );
  })
);

export { router as healthRouter };
