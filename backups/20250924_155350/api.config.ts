/**
 * HASIVU Platform - Enterprise API Configuration
 *
 * Comprehensive API configuration for 10/10 production readiness
 * - Rate limiting strategies
 * - API versioning
 * - Performance optimization
 * - Security configurations
 */

export const API_CONFIG = {
  // API Versioning Strategy
  versioning: {
    defaultVersion: 'v1',
    supportedVersions: ['v1', 'v2'],
    versionHeader: 'X-API-Version',
    deprecationWarnings: true,
    backwardCompatibility: {
      v1: {
        sunset: '2025-12-31',
        alternatives: ['v2'],
      },
    },
  },

  // Rate Limiting Configuration
  rateLimiting: {
    // Per user role rate limits (requests per minute)
    tiers: {
      student: {
        requests: 100,
        burst: 20,
        windowMs: 60000, // 1 minute
      },
      parent: {
        requests: 200,
        burst: 40,
        windowMs: 60000,
      },
      teacher: {
        requests: 300,
        burst: 60,
        windowMs: 60000,
      },
      staff: {
        requests: 500,
        burst: 100,
        windowMs: 60000,
      },
      school_admin: {
        requests: 1000,
        burst: 200,
        windowMs: 60000,
      },
      admin: {
        requests: 2000,
        burst: 400,
        windowMs: 60000,
      },
      super_admin: {
        requests: 5000,
        burst: 1000,
        windowMs: 60000,
      },
      anonymous: {
        requests: 20,
        burst: 5,
        windowMs: 60000,
      },
    },

    // Special endpoint limits
    endpoints: {
      '/api/v1/auth/login': {
        requests: 5,
        windowMs: 300000, // 5 minutes
        skipSuccessfulRequests: true,
      },
      '/api/v1/auth/register': {
        requests: 3,
        windowMs: 3600000, // 1 hour
        skipSuccessfulRequests: true,
      },
      '/api/v1/payments/process': {
        requests: 10,
        windowMs: 60000,
        skipSuccessfulRequests: false,
      },
      '/api/v1/orders/create': {
        requests: 50,
        windowMs: 60000,
        skipSuccessfulRequests: false,
      },
    },

    // Global rate limiting
    global: {
      max: 10000,
      windowMs: 60000,
      message: {
        error: 'Too many requests from this IP, please try again later',
        retryAfter: 60,
      },
    },
  },

  // Performance Configuration
  performance: {
    // Response time targets (milliseconds)
    responseTimeTargets: {
      simple: 50, // Simple GET requests
      complex: 100, // Complex queries with joins
      write: 200, // Write operations
      batch: 500, // Batch operations
      report: 1000, // Analytics/reporting
    },

    // Caching strategies
    caching: {
      default: {
        ttl: 300, // 5 minutes
        stale: 60, // Serve stale for 1 minute while refreshing
      },
      static: {
        ttl: 3600, // 1 hour
        stale: 600, // 10 minutes
      },
      dynamic: {
        ttl: 60, // 1 minute
        stale: 10, // 10 seconds
      },
      realtime: {
        ttl: 5, // 5 seconds
        stale: 1, // 1 second
      },
    },

    // Connection pooling
    database: {
      maxConnections: 100,
      minConnections: 10,
      idleTimeoutMs: 30000,
      connectionTimeoutMs: 10000,
      maxRetries: 3,
      retryDelayMs: 1000,
    },

    // Query optimization
    queries: {
      maxLimit: 1000,
      defaultLimit: 20,
      maxComplexity: 50,
      timeoutMs: 10000,
    },
  },

  // Security Configuration
  security: {
    // CORS Configuration
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
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
        'X-Session-ID',
      ],
      exposedHeaders: [
        'X-Total-Count',
        'X-Rate-Limit-Remaining',
        'X-Rate-Limit-Reset',
        'X-API-Version',
        'X-Response-Time',
      ],
    },

    // Content Security Policy
    csp: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },

    // Request validation
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
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      sanitization: {
        stripTags: true,
        escapeHtml: true,
        normalizeEmail: true,
        trimStrings: true,
      },
    },

    // API Key Management
    apiKeys: {
      headerName: 'X-API-Key',
      queryParam: 'api_key',
      encryption: 'aes-256-gcm',
      rotation: {
        enabled: true,
        intervalDays: 90,
        warningDays: 30,
      },
      scopes: {
        read: ['GET'],
        write: ['POST', 'PUT', 'PATCH'],
        delete: ['DELETE'],
        admin: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      },
    },
  },

  // Monitoring & Observability
  monitoring: {
    // Health check configuration
    healthCheck: {
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      retries: 3,
      endpoints: ['/health', '/health/ready', '/health/live'],
    },

    // Metrics collection
    metrics: {
      enabled: true,
      interval: 10000, // 10 seconds
      retention: 86400000, // 24 hours
      categories: [
        'request_count',
        'request_duration',
        'error_rate',
        'active_connections',
        'memory_usage',
        'cpu_usage',
      ],
    },

    // Logging configuration
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
        'bankAccount',
      ],
    },

    // Alerting thresholds
    alerts: {
      errorRate: 0.05, // 5% error rate
      responseTime: 1000, // 1 second average
      memoryUsage: 0.85, // 85% memory usage
      cpuUsage: 0.8, // 80% CPU usage
      diskUsage: 0.9, // 90% disk usage
      connectionPoolSize: 0.9, // 90% connection pool usage
    },
  },

  // GraphQL Configuration
  graphql: {
    enabled: true,
    endpoint: '/graphql',
    introspection: process.env.NODE_ENV !== 'production',
    playground: process.env.NODE_ENV !== 'production',
    maxQueryDepth: 10,
    maxQueryComplexity: 1000,
    queryTimeout: 30000, // 30 seconds
    subscriptions: {
      enabled: true,
      endpoint: '/graphql/subscriptions',
      path: '/subscriptions',
      keepAlive: 10000, // 10 seconds
    },
  },

  // Error Handling
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
      'TimeoutError',
    ],
    nonRetryableErrors: [
      'ValidationError',
      'AuthenticationError',
      'AuthorizationError',
      'NotFoundError',
    ],
  },

  // API Documentation
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
          url: 'https://support.hasivu.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: 'https://api.hasivu.com/v1',
          description: 'Production server',
        },
        {
          url: 'https://staging-api.hasivu.com/v1',
          description: 'Staging server',
        },
        {
          url: 'http://localhost:3000/api/v1',
          description: 'Development server',
        },
      ],
    },
  },
} as const;

// Environment-specific overrides
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return {
        ...API_CONFIG,
        rateLimiting: {
          ...API_CONFIG.rateLimiting,
          // Stricter limits in production
          tiers: {
            ...API_CONFIG.rateLimiting.tiers,
            anonymous: {
              requests: 10,
              burst: 2,
              windowMs: 60000,
            },
          },
        },
        monitoring: {
          ...API_CONFIG.monitoring,
          logging: {
            ...API_CONFIG.monitoring.logging,
            level: 'warn',
          },
        },
      };

    case 'staging':
      return {
        ...API_CONFIG,
        rateLimiting: {
          ...API_CONFIG.rateLimiting,
          // More lenient for testing
          tiers: Object.fromEntries(
            Object.entries(API_CONFIG.rateLimiting.tiers).map(([key, value]) => [
              key,
              { ...value, requests: value.requests * 2 },
            ])
          ),
        },
      };

    case 'development':
    default:
      return {
        ...API_CONFIG,
        rateLimiting: {
          ...API_CONFIG.rateLimiting,
          // Very lenient for development
          tiers: Object.fromEntries(
            Object.entries(API_CONFIG.rateLimiting.tiers).map(([key, value]) => [
              key,
              { ...value, requests: value.requests * 10 },
            ])
          ),
        },
        monitoring: {
          ...API_CONFIG.monitoring,
          logging: {
            ...API_CONFIG.monitoring.logging,
            level: 'debug',
          },
        },
      };
  }
};

export default API_CONFIG;
