import { Router, Request, Response } from 'express';
import { DatabaseService } from '@/services/database.service';
import { RedisService } from '@/services/redis.service';
import { asyncHandler } from '@/middleware/error.middleware';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const memory = process.memoryUsage();
    const [databaseUp, redisUp] = await Promise.all([
      DatabaseService.client
        .$queryRaw`SELECT 1`
        .then(() => 1)
        .catch(() => 0),
      RedisService.ping()
        .then(() => 1)
        .catch(() => 0),
    ]);

    res.type('text/plain').send(
      [
        '# HELP hasivu_process_ready Whether required dependencies are available.',
        '# TYPE hasivu_process_ready gauge',
        `hasivu_process_ready ${databaseUp && redisUp ? 1 : 0}`,
        '# HELP hasivu_process_uptime_seconds Node.js process uptime in seconds.',
        '# TYPE hasivu_process_uptime_seconds gauge',
        `hasivu_process_uptime_seconds ${process.uptime()}`,
        '# HELP hasivu_process_memory_bytes Node.js process memory usage in bytes.',
        '# TYPE hasivu_process_memory_bytes gauge',
        `hasivu_process_memory_bytes{type="rss"} ${memory.rss}`,
        `hasivu_process_memory_bytes{type="heapUsed"} ${memory.heapUsed}`,
        `hasivu_dependency_up{dependency="database"} ${databaseUp}`,
        `hasivu_dependency_up{dependency="redis"} ${redisUp}`,
        '',
      ].join('\n')
    );
  })
);

export { router as metricsRouter };
