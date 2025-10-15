"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiInfo = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const api_middleware_1 = require("../middleware/api.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_handler_middleware_1 = require("../middleware/error-handler.middleware");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const users_routes_1 = __importDefault(require("./users.routes"));
const menus_routes_1 = __importDefault(require("./menus.routes"));
const orders_routes_1 = __importDefault(require("./orders.routes"));
const payments_routes_1 = __importDefault(require("../routes/payments.routes"));
const kitchen_routes_1 = __importDefault(require("./kitchen.routes"));
const health_routes_1 = require("./health.routes");
const analytics_routes_1 = require("./analytics.routes");
const notification_routes_1 = __importDefault(require("./notification.routes"));
const api_config_1 = require("../config/api.config");
const logger_1 = require("../utils/logger");
const redis_service_1 = __importDefault(require("../services/redis.service"));
const enhanced_database_service_1 = require("../services/enhanced-database.service");
const cache_service_1 = require("../services/cache.service");
const router = express_1.default.Router();
const swaggerDocument = {
    openapi: '3.0.3',
    info: api_config_1.API_CONFIG.documentation.openapi.info,
    servers: api_config_1.API_CONFIG.documentation.openapi.servers,
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            },
            ApiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key'
            }
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        description: 'Error code'
                    },
                    message: {
                        type: 'string',
                        description: 'Human-readable error message'
                    },
                    details: {
                        type: 'object',
                        description: 'Additional error details'
                    },
                    requestId: {
                        type: 'string',
                        description: 'Unique request identifier'
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Error timestamp'
                    }
                }
            },
            SuccessResponse: {
                type: 'object',
                properties: {
                    data: {
                        type: 'object',
                        description: 'Response data'
                    },
                    message: {
                        type: 'string',
                        description: 'Success message'
                    },
                    requestId: {
                        type: 'string',
                        description: 'Unique request identifier'
                    }
                }
            },
            PaginatedResponse: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: {
                            type: 'object'
                        }
                    },
                    pagination: {
                        type: 'object',
                        properties: {
                            page: { type: 'integer' },
                            limit: { type: 'integer' },
                            total: { type: 'integer' },
                            totalPages: { type: 'integer' },
                            hasNext: { type: 'boolean' },
                            hasPrev: { type: 'boolean' }
                        }
                    },
                    requestId: {
                        type: 'string'
                    }
                }
            }
        }
    },
    security: [
        { BearerAuth: [] },
        { ApiKeyAuth: [] }
    ],
    tags: [
        { name: 'Authentication', description: 'User authentication and authorization' },
        { name: 'Users', description: 'User management operations' },
        { name: 'Menus', description: 'Menu and meal management' },
        { name: 'Orders', description: 'Order processing and tracking' },
        { name: 'Payments', description: 'Payment processing and billing' },
        { name: 'Kitchen', description: 'Kitchen operations and management' },
        { name: 'Analytics', description: 'Data analytics and reporting' },
        { name: 'Notifications', description: 'Notification system' },
        { name: 'Health', description: 'System health and monitoring' }
    ]
};
router.use(api_middleware_1.requestIdMiddleware);
router.use(api_middleware_1.apiVersionMiddleware);
router.use(api_middleware_1.performanceMiddleware);
router.use(api_middleware_1.securityHeadersMiddleware);
router.use(api_middleware_1.corsPreflightMiddleware);
router.use((0, cors_1.default)({
    ...api_config_1.API_CONFIG.security.cors,
    origin: [...api_config_1.API_CONFIG.security.cors.origin],
    methods: [...api_config_1.API_CONFIG.security.cors.methods],
    allowedHeaders: [...api_config_1.API_CONFIG.security.cors.allowedHeaders],
    exposedHeaders: [...api_config_1.API_CONFIG.security.cors.exposedHeaders]
}));
router.use(api_middleware_1.compressionMiddleware);
router.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => {
            logger_1.logger.info('HTTP Request', { message: message.trim() });
        }
    },
    skip: (req) => {
        return req.url?.startsWith('/health') || req.url?.startsWith('/docs') || false;
    }
}));
router.use(api_middleware_1.sanitizationMiddleware);
const globalRateLimit = (0, api_middleware_1.createRateLimiter)({
    requests: api_config_1.API_CONFIG.rateLimiting.global.max,
    windowMs: api_config_1.API_CONFIG.rateLimiting.global.windowMs,
    skipSuccessfulRequests: false
});
router.use(globalRateLimit);
router.use('/docs', swagger_ui_express_1.default.serve);
router.get('/docs', swagger_ui_express_1.default.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'HASIVU Platform API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        filter: true,
        deepLinking: true
    }
}));
router.get('/health', async (req, res) => {
    try {
        const [databaseHealth, cacheHealth, redisHealth] = await Promise.all([
            enhanced_database_service_1.enhancedDatabaseService.getHealth(),
            cache_service_1.cacheService.getHealth(),
            redis_service_1.default.ping().then(() => ({ status: 'healthy' })).catch(() => ({ status: 'error' }))
        ]);
        const overallHealth = databaseHealth.status === 'healthy' &&
            cacheHealth.status === 'healthy' &&
            redisHealth.status === 'healthy'
            ? 'healthy'
            : 'degraded';
        res.json({
            status: overallHealth,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: databaseHealth,
                cache: cacheHealth,
                redis: redisHealth
            },
            requestId: req.requestId
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'error',
            message: 'Health check failed',
            error: error instanceof Error ? error.message : String(error),
            requestId: req.requestId
        });
    }
});
router.get('/health/ready', async (req, res) => {
    try {
        await Promise.all([
            enhanced_database_service_1.enhancedDatabaseService.executeQuery(prisma => prisma.$queryRaw `SELECT 1`),
            redis_service_1.default.ping()
        ]);
        res.json({
            status: 'ready',
            timestamp: new Date().toISOString(),
            requestId: req.requestId
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'not_ready',
            error: error instanceof Error ? error.message : String(error),
            requestId: req.requestId
        });
    }
});
router.get('/health/live', (req, res) => {
    res.json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
    });
});
router.get('/info', (req, res) => {
    res.json({
        name: 'HASIVU Platform API',
        version: process.env.npm_package_version || '1.0.0',
        description: 'Enterprise-grade School Meal Delivery Platform API',
        environment: process.env.NODE_ENV || 'development',
        apiVersion: req.apiVersion,
        supportedVersions: api_config_1.API_CONFIG.versioning.supportedVersions,
        documentation: '/api/docs',
        rateLimits: {
            global: api_config_1.API_CONFIG.rateLimiting.global,
            perUser: 'Varies by role'
        },
        features: [
            'Multi-factor Authentication',
            'Real-time Order Tracking',
            'Payment Processing',
            'Kitchen Management',
            'Analytics & Reporting',
            'Multi-language Support',
            'Mobile PWA Support'
        ],
        requestId: req.requestId
    });
});
router.get('/metrics', auth_middleware_1.authMiddleware, async (req, res) => {
    if (!['admin', 'super_admin'].includes(req.user?.role)) {
        return res.status(403).json({
            error: 'FORBIDDEN',
            message: 'Access denied',
            requestId: req.requestId
        });
    }
    try {
        const [databaseHealth, cacheStats] = await Promise.all([
            enhanced_database_service_1.enhancedDatabaseService.getHealth(),
            cache_service_1.cacheService.getStats()
        ]);
        res.json({
            timestamp: new Date().toISOString(),
            database: {
                status: databaseHealth.status,
                connections: databaseHealth.connections,
                performance: databaseHealth.performance
            },
            cache: cacheStats,
            api: {
                totalRequests: 0,
                averageResponseTime: 0,
                errorRate: 0
            },
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            },
            requestId: req.requestId
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'METRICS_ERROR',
            message: 'Failed to retrieve metrics',
            requestId: req.requestId
        });
    }
});
router.use('/auth', auth_routes_1.default);
router.use('/users', users_routes_1.default);
router.use('/menus', menus_routes_1.default);
router.use('/orders', orders_routes_1.default);
router.use('/payments', payments_routes_1.default);
router.use('/kitchen', kitchen_routes_1.default);
router.use('/analytics', analytics_routes_1.analyticsRoutes);
router.use('/notifications', notification_routes_1.default);
router.use('/system', health_routes_1.healthRouter);
if (api_config_1.API_CONFIG.graphql.enabled) {
    router.use('/graphql', (req, res) => {
        res.json({
            message: 'GraphQL endpoint - implementation pending',
            endpoint: api_config_1.API_CONFIG.graphql.endpoint,
            introspection: api_config_1.API_CONFIG.graphql.introspection
        });
    });
}
router.use('/ws', (req, res) => {
    res.json({
        message: 'WebSocket endpoint - upgrade to WebSocket protocol required',
        protocols: ['wss'],
        endpoints: [
            '/ws/orders',
            '/ws/kitchen',
            '/ws/notifications'
        ]
    });
});
router.use('*', (req, res) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
        suggestion: 'Check the API documentation at /api/docs',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
    });
});
router.use(error_handler_middleware_1.errorHandler);
exports.default = router;
exports.apiInfo = {
    version: api_config_1.API_CONFIG.versioning.defaultVersion,
    supportedVersions: api_config_1.API_CONFIG.versioning.supportedVersions,
    rateLimits: api_config_1.API_CONFIG.rateLimiting,
    security: api_config_1.API_CONFIG.security,
    documentation: swaggerDocument
};
//# sourceMappingURL=api.routes.js.map