/**
 * HASIVU Platform - Simplified Application Entry Point
 * Focus on working components only
 */

// Load environment variables first
import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { config } from './config/environment';
import { logger } from './utils/logger';

// Import only working routes
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';

// Import essential services
import redisInstance from './services/redis.service';

class SimpleApp {
  public app: express.Application;
  public server: ReturnType<typeof createServer>;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Basic CORS
    this.app.use(cors());

    // Security headers
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
      })
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Trust proxy for accurate IPs
    this.app.set('trust proxy', true);
  }

  private setupRoutes(): void {
    // Health check - no auth needed
    this.app.use('/health', healthRouter);
    this.app.use('/api/health', healthRouter);

    // Authentication
    this.app.use('/api/auth', authRouter);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'HASIVU Platform API',
        version: '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          auth: '/api/auth',
        },
      });
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.originalUrl} not found`,
          timestamp: new Date().toISOString(),
        },
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
      logger.error('Application error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          timestamp: new Date().toISOString(),
        },
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize Redis
      await redisInstance.connect();
      logger.info('Redis connected successfully');

      const port = config.server?.port || process.env.PORT || 3000;
      const host = config.server?.host || '0.0.0.0';

      this.server.listen(Number(port), host, () => {
        logger.info('🚀 HASIVU Platform server started successfully', {
          port,
          host,
          environment: process.env.NODE_ENV || 'development',
          endpoints: {
            health: `http://${host}:${port}/health`,
            auth: `http://${host}:${port}/api/auth`,
            docs: `http://${host}:${port}/`,
          },
        });
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        logger.info('SIGTERM received, shutting down gracefully');
        this.server.close(() => {
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        logger.info('SIGINT received, shutting down gracefully');
        this.server.close(() => {
          process.exit(0);
        });
      });
    } catch (error) {
      logger.error('Failed to start HASIVU Platform server', error);
      throw error;
    }
  }
}

// Export the app instance
const appInstance = new SimpleApp();

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  appInstance.start().catch(error => {
    logger.error('Failed to start HASIVU Platform', error);
    process.exit(1);
  });
}

export default appInstance.app;
