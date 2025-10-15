/**
 * HASIVU Platform - Main Application Entry Point
 * Production-ready Express.js server with comprehensive middleware, security, and monitoring
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { config } from '@/config/environment';
import { logger } from '@/utils/logger';
import { EnvironmentValidatorService } from '@/shared/environment-validator.service';
import { DatabaseService } from '@/services/database.service';
import { RedisService } from '@/services/redis.service';
import { errorHandler } from '@/middleware/error.middleware';
import { authMiddleware } from '@/middleware/auth.middleware';
import requestLogger from '@/middleware/request-logger.middleware';

import { healthRouter } from '@/routes/health.routes';
import { authRouter } from '@/routes/auth.routes';
import { rfidRouter } from '@/routes/rfid.routes';
import paymentRouter from '@/routes/payment.routes';
import notificationRouter from '@/routes/notification.routes';
import { analyticsRoutes as analyticsRouter } from '@/routes/analytics.routes';
// import { userRouter } from '@/routes/user.routes'; // if exists
// import { studentRouter } from '@/routes/student.routes';
// import { productRouter } from '@/routes/product.routes';
// import { orderRouter } from '@/routes/order.routes';
// import { adminRouter } from '@/routes/admin.routes';

import { socketService } from '@/services/socket.service';
import { setupGracefulShutdown } from '@/utils/graceful-shutdown';

class Application {
  public app: express.Application;
  public server: ReturnType<typeof createServer>;
  public io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, { cors: { origin: '*' } });

    this.validateEnvironment();
    this.setupMiddleware();
    this.setupRoutes();
    this.initializeServices();
    this.setupErrorHandling();
  }

  private validateEnvironment(): void {
    const validationResult = EnvironmentValidatorService.getInstance().validateEnvironment();
    const criticalErrors = validationResult.errors.filter(e => e.severity === 'critical');
    if (criticalErrors.length > 0) {
      const criticalErrorMessages = criticalErrors
        .map(e => `${e.field}: ${e.message}`)
        .join(', ');
      throw new Error(
        `Configuration validation failed with errors: ${criticalErrorMessages}`,
      );
    }
    validationResult.warnings.forEach(w =>
      logger.warn(`Config warning - ${w.field}: ${w.message}`),
    );
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(helmet.crossOriginEmbedderPolicy({ policy: 'unsafe-none' }));
    this.app.use(compression());
    this.app.use(
      morgan(
        ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms',
      ),
    );

    const limiter = rateLimit({
      windowMs: 1 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(requestLogger);

    this.app.set('trust proxy', true);
  }

  private setupRoutes(): void {
    this.app.use('/health', healthRouter);
    this.app.use('/api/auth', authRouter);
    this.app.use('/api/rfid', rfidRouter);
    this.app.use('/api/payments', paymentRouter);
    this.app.use('/api/notifications', notificationRouter);
    this.app.use('/api/analytics', analyticsRouter);

    // 404 fallback
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        message: `Route ${req.method} ${req.originalUrl} not found`,
      });
    });
  }

  private initializeServices(): void {
    DatabaseService.connect();
    RedisService.connect();
    socketService.initialize(this.server);
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public start(): void {
    const port = config.server.port || 3000;
    this.server.listen(port, () => {
      logger.info(`Server running on http://${config.server.host}:${port}`);
      logger.info(`Health check at http://${config.server.host}:${port}/health`);
    });
    setupGracefulShutdown(this.server);
  }
}

const appInstance = new Application();
appInstance.start();

export default appInstance.app;
