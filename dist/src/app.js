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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = require("http");
const environment_1 = require("./config/environment");
const logger_1 = require("./utils/logger");
const health_routes_1 = require("./routes/health.routes");
const auth_routes_1 = require("./routes/auth.routes");
const payments_routes_1 = __importDefault(require("./routes/payments.routes"));
const redis_service_1 = require("./services/redis.service");
class SimpleApp {
    app;
    server;
    constructor() {
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                },
            },
        }));
        this.app.use((0, cors_1.default)({
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
        }));
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.set('trust proxy', true);
        this.app.use((0, cookie_parser_1.default)());
        Promise.resolve().then(() => __importStar(require('./middleware/auth.middleware'))).then(({ validateInput }) => {
            this.app.use(validateInput);
        })
            .catch(err => logger_1.logger.error('Failed to load auth middleware', err));
        Promise.resolve().then(() => __importStar(require('./middleware/rateLimiter.middleware'))).then(({ generalRateLimit }) => {
            this.app.use(generalRateLimit);
        })
            .catch(err => logger_1.logger.error('Failed to load rate limiter middleware', err));
        Promise.resolve().then(() => __importStar(require('./middleware/csrf.middleware'))).then(({ csrfProtection, attachCSRFToken }) => {
            this.app.use(attachCSRFToken);
            this.app.use('/api', csrfProtection());
        })
            .catch(err => logger_1.logger.error('Failed to load CSRF middleware', err));
    }
    setupRoutes() {
        this.app.use('/health', health_routes_1.healthRouter);
        this.app.use('/api/health', health_routes_1.healthRouter);
        this.app.use('/api/auth', auth_routes_1.authRouter);
        this.app.use('/api/payments', payments_routes_1.default);
        this.app.get('/', (req, res) => {
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
        this.app.use('*', (req, res) => {
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
    setupErrorHandling() {
        this.app.use(((error, req, res, _next) => {
            logger_1.logger.error('Application error:', undefined, {
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
        }));
    }
    async start() {
        try {
            await redis_service_1.redisService.connect();
            logger_1.logger.info('Redis connected successfully');
            const port = environment_1.env.get('PORT');
            const host = '0.0.0.0';
            this.server.listen(Number(port), host, () => {
                logger_1.logger.info('🚀 HASIVU Platform server started successfully', {
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
            process.on('SIGTERM', () => {
                logger_1.logger.info('SIGTERM received, shutting down gracefully');
                this.server.close(() => {
                    process.exit(0);
                });
            });
            process.on('SIGINT', () => {
                logger_1.logger.info('SIGINT received, shutting down gracefully');
                this.server.close(() => {
                    process.exit(0);
                });
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to start HASIVU Platform server', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }
}
const appInstance = new SimpleApp();
if (process.env.NODE_ENV !== 'test') {
    appInstance.start().catch(error => {
        logger_1.logger.error('Failed to start HASIVU Platform', undefined, {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
    });
}
exports.default = appInstance.app;
//# sourceMappingURL=app.js.map