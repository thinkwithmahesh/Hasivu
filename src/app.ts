/**
 * HASIVU Platform - Simplified Application Entry Point
 * Focus on working components only
 */

// Load environment variables first
import 'dotenv/config';

import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { env } from './config/environment';
import { logger } from './utils/logger';

// Import only working routes
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import paymentsRouter from './routes/payments.routes';

// Import essential services
import { redisService } from './services/redis.service';

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
    // Security headers and helmet configuration
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

    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: [
          'Origin',
          'X-Requested-With',
          'Content-Type',
          'Accept',
          'Authorization',
          'X-CSRF-Token',
        ],
      })
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Trust proxy for accurate IPs
    this.app.set('trust proxy', true);

    // Cookie parser for session management
    this.app.use(cookieParser());

    // Input validation and sanitization
    import('./middleware/auth.middleware')
      .then(({ validateInput }) => {
        this.app.use(validateInput);
      })
      .catch(err => logger.error('Failed to load auth middleware', err));

    // Rate limiting
    import('./middleware/rateLimiter.middleware')
      .then(({ generalRateLimit }) => {
        this.app.use(generalRateLimit);
      })
      .catch(err => logger.error('Failed to load rate limiter middleware', err));

    // CSRF protection for state-changing requests
    import('./middleware/csrf.middleware')
      .then(({ csrfProtection, attachCSRFToken }) => {
        this.app.use(attachCSRFToken);
        this.app.use('/api', csrfProtection());
      })
      .catch(err => logger.error('Failed to load CSRF middleware', err));
  }

  private setupRoutes(): void {
    // Health check - no auth needed
    this.app.use('/health', healthRouter);
    this.app.use('/api/health', healthRouter);

    // Authentication
    this.app.use('/api/auth', authRouter);

    // Payments
    this.app.use('/api/payments', paymentsRouter);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response): void => {
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
    this.app.use('*', (req: Request, res: Response): void => {
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
    // Error handling middleware
    this.app.use(((error: unknown, req: Request, res: Response, _next: NextFunction): void => {
      logger.error('Application error:', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          timestamp: new Date().toISOString(),
        },
      });
    }) as ErrorRequestHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize Redis
      await redisService.connect();
      logger.info('Redis connected successfully');

      const port = env.get('PORT');
      const host = '0.0.0.0';

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
    } catch (error: unknown) {
      logger.error(
        'Failed to start HASIVU Platform server',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
}

// Export the app instance
const appInstance = new SimpleApp();

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  appInstance.start().catch(error => {
    logger.error('Failed to start HASIVU Platform', undefined, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
}

export default appInstance.app;
