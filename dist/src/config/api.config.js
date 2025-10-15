"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvironmentConfig = exports.API_CONFIG = void 0;
exports.API_CONFIG = {
    versioning: {
        defaultVersion: 'v1',
        supportedVersions: ['v1', 'v2'],
        versionHeader: 'X-API-Version',
        deprecationWarnings: true,
        backwardCompatibility: {
            v1: {
                sunset: '2025-12-31',
                alternatives: ['v2']
            }
        }
    },
    rateLimiting: {
        tiers: {
            student: {
                requests: 100,
                burst: 20,
                windowMs: 60000
            },
            parent: {
                requests: 200,
                burst: 40,
                windowMs: 60000
            },
            teacher: {
                requests: 300,
                burst: 60,
                windowMs: 60000
            },
            staff: {
                requests: 500,
                burst: 100,
                windowMs: 60000
            },
            school_admin: {
                requests: 1000,
                burst: 200,
                windowMs: 60000
            },
            admin: {
                requests: 2000,
                burst: 400,
                windowMs: 60000
            },
            super_admin: {
                requests: 5000,
                burst: 1000,
                windowMs: 60000
            },
            anonymous: {
                requests: 20,
                burst: 5,
                windowMs: 60000
            }
        },
        endpoints: {
            '/api/v1/auth/login': {
                requests: 5,
                windowMs: 300000,
                skipSuccessfulRequests: true
            },
            '/api/v1/auth/register': {
                requests: 3,
                windowMs: 3600000,
                skipSuccessfulRequests: true
            },
            '/api/v1/payments/process': {
                requests: 10,
                windowMs: 60000,
                skipSuccessfulRequests: false
            },
            '/api/v1/orders/create': {
                requests: 50,
                windowMs: 60000,
                skipSuccessfulRequests: false
            }
        },
        global: {
            max: 10000,
            windowMs: 60000,
            message: {
                error: 'Too many requests from this IP, please try again later',
                retryAfter: 60
            }
        }
    },
    performance: {
        responseTimeTargets: {
            simple: 50,
            complex: 100,
            write: 200,
            batch: 500,
            report: 1000
        },
        caching: {
            default: {
                ttl: 300,
                stale: 60
            },
            static: {
                ttl: 3600,
                stale: 600
            },
            dynamic: {
                ttl: 60,
                stale: 10
            },
            realtime: {
                ttl: 5,
                stale: 1
            }
        },
        database: {
            maxConnections: 100,
            minConnections: 10,
            idleTimeoutMs: 30000,
            connectionTimeoutMs: 10000,
            maxRetries: 3,
            retryDelayMs: 1000
        },
        queries: {
            maxLimit: 1000,
            defaultLimit: 20,
            maxComplexity: 50,
            timeoutMs: 10000
        }
    },
    security: {
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? ['https://app.hasivu.com', 'https://admin.hasivu.com', 'https://kitchen.hasivu.com']
                : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4000'],
            credentials: true,
            optionsSuccessStatus: 200,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
                'X-API-Version',
                'X-Request-ID',
                'X-Device-ID',
                'X-Session-ID'
            ],
            exposedHeaders: [
                'X-Total-Count',
                'X-Rate-Limit-Remaining',
                'X-Rate-Limit-Reset',
                'X-API-Version',
                'X-Response-Time'
            ]
        },
        csp: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            }
        },
        validation: {
            maxBodySize: '10mb',
            maxFileSize: '50mb',
            allowedFileTypes: [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/pdf',
                'text/csv',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ],
            sanitization: {
                stripTags: true,
                escapeHtml: true,
                normalizeEmail: true,
                trimStrings: true
            }
        },
        apiKeys: {
            headerName: 'X-API-Key',
            queryParam: 'api_key',
            encryption: 'aes-256-gcm',
            rotation: {
                enabled: true,
                intervalDays: 90,
                warningDays: 30
            },
            scopes: {
                read: ['GET'],
                write: ['POST', 'PUT', 'PATCH'],
                delete: ['DELETE'],
                admin: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
            }
        }
    },
    monitoring: {
        healthCheck: {
            interval: 30000,
            timeout: 5000,
            retries: 3,
            endpoints: [
                '/health',
                '/health/ready',
                '/health/live'
            ]
        },
        metrics: {
            enabled: true,
            interval: 10000,
            retention: 86400000,
            categories: [
                'request_count',
                'request_duration',
                'error_rate',
                'active_connections',
                'memory_usage',
                'cpu_usage'
            ]
        },
        logging: {
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            format: 'json',
            includeRequestId: true,
            includeUserContext: true,
            sensitiveFields: [
                'password',
                'passwordHash',
                'token',
                'secret',
                'apiKey',
                'creditCard',
                'ssn',
                'bankAccount'
            ]
        },
        alerts: {
            errorRate: 0.05,
            responseTime: 1000,
            memoryUsage: 0.85,
            cpuUsage: 0.80,
            diskUsage: 0.90,
            connectionPoolSize: 0.90
        }
    },
    graphql: {
        enabled: true,
        endpoint: '/graphql',
        introspection: process.env.NODE_ENV !== 'production',
        playground: process.env.NODE_ENV !== 'production',
        maxQueryDepth: 10,
        maxQueryComplexity: 1000,
        queryTimeout: 30000,
        subscriptions: {
            enabled: true,
            endpoint: '/graphql/subscriptions',
            path: '/subscriptions',
            keepAlive: 10000
        }
    },
    errorHandling: {
        includeStack: process.env.NODE_ENV !== 'production',
        logErrors: true,
        notifyOnCritical: true,
        retryableErrors: [
            'ECONNRESET',
            'ENOTFOUND',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ConnectionError',
            'TimeoutError'
        ],
        nonRetryableErrors: [
            'ValidationError',
            'AuthenticationError',
            'AuthorizationError',
            'NotFoundError'
        ]
    },
    documentation: {
        openapi: {
            version: '3.0.3',
            info: {
                title: 'HASIVU Platform API',
                version: '1.0.0',
                description: 'Enterprise-grade School Meal Delivery Platform API',
                termsOfService: 'https://hasivu.com/terms',
                contact: {
                    name: 'HASIVU API Support',
                    email: 'api-support@hasivu.com',
                    url: 'https://support.hasivu.com'
                },
                license: {
                    name: 'MIT',
                    url: 'https://opensource.org/licenses/MIT'
                }
            },
            servers: [
                {
                    url: 'https://api.hasivu.com/v1',
                    description: 'Production server'
                },
                {
                    url: 'https://staging-api.hasivu.com/v1',
                    description: 'Staging server'
                },
                {
                    url: 'http://localhost:3000/api/v1',
                    description: 'Development server'
                }
            ]
        }
    }
};
const getEnvironmentConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    switch (env) {
        case 'production':
            return {
                ...exports.API_CONFIG,
                rateLimiting: {
                    ...exports.API_CONFIG.rateLimiting,
                    tiers: {
                        ...exports.API_CONFIG.rateLimiting.tiers,
                        anonymous: {
                            requests: 10,
                            burst: 2,
                            windowMs: 60000
                        }
                    }
                },
                monitoring: {
                    ...exports.API_CONFIG.monitoring,
                    logging: {
                        ...exports.API_CONFIG.monitoring.logging,
                        level: 'warn'
                    }
                }
            };
        case 'staging':
            return {
                ...exports.API_CONFIG,
                rateLimiting: {
                    ...exports.API_CONFIG.rateLimiting,
                    tiers: Object.fromEntries(Object.entries(exports.API_CONFIG.rateLimiting.tiers).map(([key, value]) => [
                        key,
                        { ...value, requests: value.requests * 2 }
                    ]))
                }
            };
        case 'development':
        default:
            return {
                ...exports.API_CONFIG,
                rateLimiting: {
                    ...exports.API_CONFIG.rateLimiting,
                    tiers: Object.fromEntries(Object.entries(exports.API_CONFIG.rateLimiting.tiers).map(([key, value]) => [
                        key,
                        { ...value, requests: value.requests * 10 }
                    ]))
                },
                monitoring: {
                    ...exports.API_CONFIG.monitoring,
                    logging: {
                        ...exports.API_CONFIG.monitoring.logging,
                        level: 'debug'
                    }
                }
            };
    }
};
exports.getEnvironmentConfig = getEnvironmentConfig;
exports.default = exports.API_CONFIG;
//# sourceMappingURL=api.config.js.map