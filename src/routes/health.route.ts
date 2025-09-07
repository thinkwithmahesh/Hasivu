/**
 * HASIVU Platform - Health Check Routes
 * Comprehensive health monitoring endpoints with graceful degradation integration
 * Provides detailed system status for monitoring and alerting
 */
import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { DatabaseService } from '../functions/shared/database.service';
import { config } from '../config/environment';

const router = Router();

/**
 * Basic health check endpoint
 * GET /health
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.server.nodeEnv,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      }
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

/**
 * Detailed health check endpoint
 * GET /health/detailed
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check database connectivity
    let databaseStatus = 'unknown';
    let databaseLatency = 0;
    
    try {
      const dbStartTime = Date.now();
      await DatabaseService.client.$queryRaw`SELECT 1`; // Basic connectivity check
      databaseLatency = Date.now() - dbStartTime;
      databaseStatus = 'healthy';
    } catch (error) {
      databaseStatus = 'unhealthy';
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const totalLatency = Date.now() - startTime;
    const overallStatus = databaseStatus === 'healthy' ? 'healthy' : 'degraded';

    const detailedHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.server.nodeEnv,
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
          loadAverage: process.platform === 'linux' ? require('os').loadavg() : null
        }
      }
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(detailedHealth);

  } catch (error) {
    logger.error('Detailed health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

/**
 * Database-specific health check
 * GET /health/database
 */
router.get('/database', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    await DatabaseService.client.$queryRaw`SELECT 1`; // Basic connectivity check
    
    const latency = Date.now() - startTime;
    
    res.status(200).json({
      status: 'healthy',
      service: 'database',
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Database health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(503).json({
      status: 'unhealthy',
      service: 'database',
      error: error instanceof Error ? error.message : 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Ready check endpoint (for Kubernetes readiness probe)
 * GET /health/ready
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if all critical services are ready
    await DatabaseService.client.$queryRaw`SELECT 1`; // Basic connectivity check
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Readiness check failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Critical services not available'
    });
  }
});

/**
 * Liveness check endpoint (for Kubernetes liveness probe)
 * GET /health/live
 */
router.get('/live', (req: Request, res: Response) => {
  // Simple liveness check - if this endpoint responds, the app is alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    pid: process.pid,
    uptime: process.uptime()
  });
});

/**
 * Startup check endpoint (for Kubernetes startup probe)
 * GET /health/startup
 */
router.get('/startup', (req: Request, res: Response) => {
  // Check if the application has completed its startup sequence
  const isStarted = process.uptime() > 5; // Assume 5 seconds minimum startup time
  
  if (isStarted) {
    res.status(200).json({
      status: 'started',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } else {
    res.status(503).json({
      status: 'starting',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
});

/**
 * System metrics endpoint
 * GET /health/metrics
 */
router.get('/metrics', (req: Request, res: Response) => {
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
  } catch (error) {
    logger.error('Metrics collection failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;