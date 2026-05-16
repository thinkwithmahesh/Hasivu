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
import { metricsRouter } from './routes/metrics.routes';
import { authRouter } from './routes/auth.routes';
import paymentsRouter from './routes/payments.routes';
import ordersRouter from './routes/orders.routes';
import kitchenRouter from './routes/kitchen.routes';
import menusRouter from './routes/menus.routes';
import walletRouter from './routes/wallet.routes';
import invoiceRouter from './routes/invoice.routes';
import subscriptionRouter from './routes/subscription.routes';
import whatsappRouter from './routes/whatsapp.routes';
import inventoryRouter from './routes/inventory.routes';
import analyticsRouter from './routes/analytics.routes';
import mealSchedulerRouter from './routes/meal-scheduler.routes';
import recommendationRouter from './routes/recommendations.routes';
import realtimeRouter from './routes/realtime.routes';
import { createRealtimeServer } from './realtime/realtime.server';

// Import essential services
import { redisService } from './services/redis.service';

class SimpleApp {
  public app: express.Application;
  public server: ReturnType<typeof createServer>;
  private readonly strictSecurityMiddleware: boolean;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.strictSecurityMiddleware =
      process.env.NODE_ENV === 'production' || process.env.STRICT_SECURITY_MIDDLEWARE === 'true';
  }

  private async setupMiddleware(): Promise<void> {
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
        // Allow browsers on another dev port (e.g. Next on :3001) to read JSON from this API.
        // Set HELMET_CORP_POLICY=cross-origin in docker-compose.dev.yml for local full-stack.
        ...(process.env.HELMET_CORP_POLICY === 'cross-origin'
          ? { crossOriginResourcePolicy: { policy: 'cross-origin' as const } }
          : {}),
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

    // Body parsing. Keep the original bytes so signed webhooks can verify the
    // provider signature against the exact payload Express received.
    this.app.use(
      express.json({
        limit: '10mb',
        verify: (req: Request, _res, buf) => {
          req.rawBody = Buffer.from(buf);
        },
      })
    );
    this.app.use(express.urlencoded({ extended: true }));

    // Trust proxy for accurate IPs
    this.app.set('trust proxy', true);

    // Cookie parser for session management
    this.app.use(cookieParser());

    // Load middleware with proper error handling and fallbacks
    await this.loadMiddlewareSafely();
  }

  private async loadMiddlewareSafely(): Promise<void> {
    const middlewarePromises = [
      this.loadInputValidationMiddleware(),
      this.loadRateLimiterMiddleware(),
      this.loadCSRFMiddleware(),
    ];

    const middlewareResults = await Promise.allSettled(middlewarePromises);
    const failedMiddleware: string[] = [];

    middlewareResults.forEach(result => {
      if (result.status === 'rejected') {
        failedMiddleware.push(result.reason?.message || 'unknown middleware');
      }
    });

    if (failedMiddleware.length > 0) {
      const errorMessage = `Critical security middleware failed to load: ${failedMiddleware.join(', ')}`;

      if (this.strictSecurityMiddleware) {
        throw new Error(errorMessage);
      }

      logger.warn(`${errorMessage}. Continuing because strict mode is disabled.`);
    }
  }

  private async loadInputValidationMiddleware(): Promise<void> {
    const { comprehensiveInputValidation } = await import(
      './middleware/input-validation.middleware'
    );
    this.app.use(comprehensiveInputValidation);
    logger.info('Comprehensive input validation middleware loaded successfully');
  }

  private async loadRateLimiterMiddleware(): Promise<void> {
    const { generalRateLimit } = await import('./middleware/rateLimiter.middleware');
    this.app.use(generalRateLimit);
    logger.info('Rate limiter middleware loaded successfully');
  }

  private async loadCSRFMiddleware(): Promise<void> {
    const { csrfProtection, attachCSRFToken } = await import('./middleware/csrf.middleware');
    this.app.use('/api', csrfProtection());
    this.app.use(attachCSRFToken);
    logger.info('CSRF middleware loaded successfully');
  }

  private setupRoutes(): void {
    // Health check - no auth needed
    this.app.use('/health', healthRouter);
    this.app.use('/api/health', healthRouter);
    this.app.use('/metrics', metricsRouter);

    // Authentication - exclude from CSRF protection for registration
    this.app.use('/api/auth', authRouter);

    // Payments
    this.app.use('/api/payments', paymentsRouter);

    // Orders (v1) + kitchen assignment
    this.app.use('/api/v1/orders', ordersRouter);
    this.app.use('/api/v1/menus', menusRouter);
    this.app.use('/api/v1/wallet', walletRouter);
    this.app.use('/api/v1/invoices', invoiceRouter);
    this.app.use('/api/v1/subscriptions', subscriptionRouter);
    this.app.use('/api/v1/whatsapp', whatsappRouter);
    this.app.use('/api/v1/inventory', inventoryRouter);
    this.app.use('/api/v1/analytics', analyticsRouter);
    this.app.use('/api/v1/meal-schedules', mealSchedulerRouter);
    this.app.use('/api/v1/recommendations', recommendationRouter);
    this.app.use('/api/v1/realtime', realtimeRouter);
    this.app.use('/api/kitchen', kitchenRouter);

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
      env.assertProductionSafe();

      // Initialize Redis
      await redisService.connect();
      logger.info('Redis connected successfully');

      // Setup middleware, routes, and error handling
      await this.setupMiddleware();
      this.setupRoutes();
      this.setupErrorHandling();
      createRealtimeServer(this.server);

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
