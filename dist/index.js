"use strict";
/**
 * HASIVU Platform - Main Application Entry Point
 * Production-ready Express.js server with comprehensive middleware, security, and monitoring
 */
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = require("express");
const cors_1 = require("cors");
const helmet_1 = require("helmet");
const compression_1 = require("compression");
const morgan_1 = require("morgan");
const express_rate_limit_1 = require("express-rate-limit");
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const environment_1 = require("@/config/environment");
const logger_1 = require("@/utils/logger");
const environment_validator_service_1 = require("@/shared/environment-validator.service");
const database_service_1 = require("@/services/database.service");
const redis_service_1 = require("@/services/redis.service");
const error_middleware_1 = require("@/middleware/error.middleware");
const request_logger_middleware_1 = require("@/middleware/request-logger.middleware");
const health_routes_1 = require("@/routes/health.routes");
const auth_routes_1 = require("@/routes/auth.routes");
const rfid_routes_1 = require("@/routes/rfid.routes");
const payment_routes_1 = require("@/routes/payment.routes");
const notification_routes_1 = require("@/routes/notification.routes");
const analytics_routes_1 = require("@/routes/analytics.routes");
// import { userRouter } from '@/routes/user.routes'; // if exists
// import { studentRouter } from '@/routes/student.routes';
// import { productRouter } from '@/routes/product.routes';
// import { orderRouter } from '@/routes/order.routes';
// import { adminRouter } from '@/routes/admin.routes';
const socket_service_1 = require("@/services/socket.service");
const graceful_shutdown_1 = require("@/utils/graceful-shutdown");
class Application {
    app;
    server;
    io;
    constructor() {
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.server, { cors: { origin: '*' } });
        this.validateEnvironment();
        this.setupMiddleware();
        this.setupRoutes();
        this.initializeServices();
        this.setupErrorHandling();
    }
    validateEnvironment() {
        const validationResult = environment_validator_service_1.EnvironmentValidatorService.getInstance().validateEnvironment();
        const criticalErrors = validationResult.errors.filter(e => e.severity === 'critical');
        if (criticalErrors.length > 0) {
            const criticalErrorMessages = criticalErrors
                .map(e => `${e.field}: ${e.message}`)
                .join(', ');
            throw new Error(`Configuration validation failed with errors: ${criticalErrorMessages}`);
        }
        validationResult.warnings.forEach(w => logger_1.logger.warn(`Config warning - ${w.field}: ${w.message}`));
    }
    setupMiddleware() {
        this.app.use((0, cors_1.default)());
        this.app.use(helmet_1.default.crossOriginEmbedderPolicy({ policy: 'unsafe-none' }));
        this.app.use((0, compression_1.default)());
        this.app.use((0, morgan_1.default)(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'));
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: 1 * 60 * 1000,
            max: 100,
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.use(request_logger_middleware_1.default);
        this.app.set('trust proxy', true);
    }
    setupRoutes() {
        this.app.use('/health', health_routes_1.healthRouter);
        this.app.use('/api/auth', auth_routes_1.authRouter);
        this.app.use('/api/rfid', rfid_routes_1.rfidRouter);
        this.app.use('/api/payments', payment_routes_1.default);
        this.app.use('/api/notifications', notification_routes_1.default);
        this.app.use('/api/analytics', analytics_routes_1.analyticsRoutes);
        // 404 fallback
        this.app.use('*', (req, res) => {
            res.status(404).json({
                message: `Route ${req.method} ${req.originalUrl} not found`,
            });
        });
    }
    initializeServices() {
        database_service_1.DatabaseService.connect();
        redis_service_1.RedisService.connect();
        socket_service_1.socketService.initialize(this.server);
    }
    setupErrorHandling() {
        this.app.use(error_middleware_1.errorHandler);
    }
    start() {
        const port = environment_1.config.server.port || 3000;
        this.server.listen(port, () => {
            logger_1.logger.info(`Server running on http://${environment_1.config.server.host}:${port}`);
            logger_1.logger.info(`Health check at http://${environment_1.config.server.host}:${port}/health`);
        });
        (0, graceful_shutdown_1.setupGracefulShutdown)(this.server);
    }
}
const appInstance = new Application();
appInstance.start();
exports.default = appInstance.app;
