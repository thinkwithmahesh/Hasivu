export declare const API_CONFIG: {
    readonly versioning: {
        readonly defaultVersion: "v1";
        readonly supportedVersions: readonly ["v1", "v2"];
        readonly versionHeader: "X-API-Version";
        readonly deprecationWarnings: true;
        readonly backwardCompatibility: {
            readonly v1: {
                readonly sunset: "2025-12-31";
                readonly alternatives: readonly ["v2"];
            };
        };
    };
    readonly rateLimiting: {
        readonly tiers: {
            readonly student: {
                readonly requests: 100;
                readonly burst: 20;
                readonly windowMs: 60000;
            };
            readonly parent: {
                readonly requests: 200;
                readonly burst: 40;
                readonly windowMs: 60000;
            };
            readonly teacher: {
                readonly requests: 300;
                readonly burst: 60;
                readonly windowMs: 60000;
            };
            readonly staff: {
                readonly requests: 500;
                readonly burst: 100;
                readonly windowMs: 60000;
            };
            readonly school_admin: {
                readonly requests: 1000;
                readonly burst: 200;
                readonly windowMs: 60000;
            };
            readonly admin: {
                readonly requests: 2000;
                readonly burst: 400;
                readonly windowMs: 60000;
            };
            readonly super_admin: {
                readonly requests: 5000;
                readonly burst: 1000;
                readonly windowMs: 60000;
            };
            readonly anonymous: {
                readonly requests: 20;
                readonly burst: 5;
                readonly windowMs: 60000;
            };
        };
        readonly endpoints: {
            readonly '/api/v1/auth/login': {
                readonly requests: 5;
                readonly windowMs: 300000;
                readonly skipSuccessfulRequests: true;
            };
            readonly '/api/v1/auth/register': {
                readonly requests: 3;
                readonly windowMs: 3600000;
                readonly skipSuccessfulRequests: true;
            };
            readonly '/api/v1/payments/process': {
                readonly requests: 10;
                readonly windowMs: 60000;
                readonly skipSuccessfulRequests: false;
            };
            readonly '/api/v1/orders/create': {
                readonly requests: 50;
                readonly windowMs: 60000;
                readonly skipSuccessfulRequests: false;
            };
        };
        readonly global: {
            readonly max: 10000;
            readonly windowMs: 60000;
            readonly message: {
                readonly error: "Too many requests from this IP, please try again later";
                readonly retryAfter: 60;
            };
        };
    };
    readonly performance: {
        readonly responseTimeTargets: {
            readonly simple: 50;
            readonly complex: 100;
            readonly write: 200;
            readonly batch: 500;
            readonly report: 1000;
        };
        readonly caching: {
            readonly default: {
                readonly ttl: 300;
                readonly stale: 60;
            };
            readonly static: {
                readonly ttl: 3600;
                readonly stale: 600;
            };
            readonly dynamic: {
                readonly ttl: 60;
                readonly stale: 10;
            };
            readonly realtime: {
                readonly ttl: 5;
                readonly stale: 1;
            };
        };
        readonly database: {
            readonly maxConnections: 100;
            readonly minConnections: 10;
            readonly idleTimeoutMs: 30000;
            readonly connectionTimeoutMs: 10000;
            readonly maxRetries: 3;
            readonly retryDelayMs: 1000;
        };
        readonly queries: {
            readonly maxLimit: 1000;
            readonly defaultLimit: 20;
            readonly maxComplexity: 50;
            readonly timeoutMs: 10000;
        };
    };
    readonly security: {
        readonly cors: {
            readonly origin: string[];
            readonly credentials: true;
            readonly optionsSuccessStatus: 200;
            readonly methods: readonly ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];
            readonly allowedHeaders: readonly ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "X-API-Version", "X-Request-ID", "X-Device-ID", "X-Session-ID"];
            readonly exposedHeaders: readonly ["X-Total-Count", "X-Rate-Limit-Remaining", "X-Rate-Limit-Reset", "X-API-Version", "X-Response-Time"];
        };
        readonly csp: {
            readonly directives: {
                readonly defaultSrc: readonly ["'self'"];
                readonly scriptSrc: readonly ["'self'", "'unsafe-inline'"];
                readonly styleSrc: readonly ["'self'", "'unsafe-inline'"];
                readonly imgSrc: readonly ["'self'", "data:", "https:"];
                readonly connectSrc: readonly ["'self'"];
                readonly fontSrc: readonly ["'self'"];
                readonly objectSrc: readonly ["'none'"];
                readonly mediaSrc: readonly ["'self'"];
                readonly frameSrc: readonly ["'none'"];
            };
        };
        readonly validation: {
            readonly maxBodySize: "10mb";
            readonly maxFileSize: "50mb";
            readonly allowedFileTypes: readonly ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
            readonly sanitization: {
                readonly stripTags: true;
                readonly escapeHtml: true;
                readonly normalizeEmail: true;
                readonly trimStrings: true;
            };
        };
        readonly apiKeys: {
            readonly headerName: "X-API-Key";
            readonly queryParam: "api_key";
            readonly encryption: "aes-256-gcm";
            readonly rotation: {
                readonly enabled: true;
                readonly intervalDays: 90;
                readonly warningDays: 30;
            };
            readonly scopes: {
                readonly read: readonly ["GET"];
                readonly write: readonly ["POST", "PUT", "PATCH"];
                readonly delete: readonly ["DELETE"];
                readonly admin: readonly ["GET", "POST", "PUT", "PATCH", "DELETE"];
            };
        };
    };
    readonly monitoring: {
        readonly healthCheck: {
            readonly interval: 30000;
            readonly timeout: 5000;
            readonly retries: 3;
            readonly endpoints: readonly ["/health", "/health/ready", "/health/live"];
        };
        readonly metrics: {
            readonly enabled: true;
            readonly interval: 10000;
            readonly retention: 86400000;
            readonly categories: readonly ["request_count", "request_duration", "error_rate", "active_connections", "memory_usage", "cpu_usage"];
        };
        readonly logging: {
            readonly level: "info" | "debug";
            readonly format: "json";
            readonly includeRequestId: true;
            readonly includeUserContext: true;
            readonly sensitiveFields: readonly ["password", "passwordHash", "token", "secret", "apiKey", "creditCard", "ssn", "bankAccount"];
        };
        readonly alerts: {
            readonly errorRate: 0.05;
            readonly responseTime: 1000;
            readonly memoryUsage: 0.85;
            readonly cpuUsage: 0.8;
            readonly diskUsage: 0.9;
            readonly connectionPoolSize: 0.9;
        };
    };
    readonly graphql: {
        readonly enabled: true;
        readonly endpoint: "/graphql";
        readonly introspection: boolean;
        readonly playground: boolean;
        readonly maxQueryDepth: 10;
        readonly maxQueryComplexity: 1000;
        readonly queryTimeout: 30000;
        readonly subscriptions: {
            readonly enabled: true;
            readonly endpoint: "/graphql/subscriptions";
            readonly path: "/subscriptions";
            readonly keepAlive: 10000;
        };
    };
    readonly errorHandling: {
        readonly includeStack: boolean;
        readonly logErrors: true;
        readonly notifyOnCritical: true;
        readonly retryableErrors: readonly ["ECONNRESET", "ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "ConnectionError", "TimeoutError"];
        readonly nonRetryableErrors: readonly ["ValidationError", "AuthenticationError", "AuthorizationError", "NotFoundError"];
    };
    readonly documentation: {
        readonly openapi: {
            readonly version: "3.0.3";
            readonly info: {
                readonly title: "HASIVU Platform API";
                readonly version: "1.0.0";
                readonly description: "Enterprise-grade School Meal Delivery Platform API";
                readonly termsOfService: "https://hasivu.com/terms";
                readonly contact: {
                    readonly name: "HASIVU API Support";
                    readonly email: "api-support@hasivu.com";
                    readonly url: "https://support.hasivu.com";
                };
                readonly license: {
                    readonly name: "MIT";
                    readonly url: "https://opensource.org/licenses/MIT";
                };
            };
            readonly servers: readonly [{
                readonly url: "https://api.hasivu.com/v1";
                readonly description: "Production server";
            }, {
                readonly url: "https://staging-api.hasivu.com/v1";
                readonly description: "Staging server";
            }, {
                readonly url: "http://localhost:3000/api/v1";
                readonly description: "Development server";
            }];
        };
    };
};
export declare const getEnvironmentConfig: () => {
    rateLimiting: {
        tiers: {
            anonymous: {
                requests: number;
                burst: number;
                windowMs: number;
            };
            student: {
                readonly requests: 100;
                readonly burst: 20;
                readonly windowMs: 60000;
            };
            parent: {
                readonly requests: 200;
                readonly burst: 40;
                readonly windowMs: 60000;
            };
            teacher: {
                readonly requests: 300;
                readonly burst: 60;
                readonly windowMs: 60000;
            };
            staff: {
                readonly requests: 500;
                readonly burst: 100;
                readonly windowMs: 60000;
            };
            school_admin: {
                readonly requests: 1000;
                readonly burst: 200;
                readonly windowMs: 60000;
            };
            admin: {
                readonly requests: 2000;
                readonly burst: 400;
                readonly windowMs: 60000;
            };
            super_admin: {
                readonly requests: 5000;
                readonly burst: 1000;
                readonly windowMs: 60000;
            };
        };
        endpoints: {
            readonly '/api/v1/auth/login': {
                readonly requests: 5;
                readonly windowMs: 300000;
                readonly skipSuccessfulRequests: true;
            };
            readonly '/api/v1/auth/register': {
                readonly requests: 3;
                readonly windowMs: 3600000;
                readonly skipSuccessfulRequests: true;
            };
            readonly '/api/v1/payments/process': {
                readonly requests: 10;
                readonly windowMs: 60000;
                readonly skipSuccessfulRequests: false;
            };
            readonly '/api/v1/orders/create': {
                readonly requests: 50;
                readonly windowMs: 60000;
                readonly skipSuccessfulRequests: false;
            };
        };
        global: {
            readonly max: 10000;
            readonly windowMs: 60000;
            readonly message: {
                readonly error: "Too many requests from this IP, please try again later";
                readonly retryAfter: 60;
            };
        };
    };
    monitoring: {
        logging: {
            level: string;
            format: "json";
            includeRequestId: true;
            includeUserContext: true;
            sensitiveFields: readonly ["password", "passwordHash", "token", "secret", "apiKey", "creditCard", "ssn", "bankAccount"];
        };
        healthCheck: {
            readonly interval: 30000;
            readonly timeout: 5000;
            readonly retries: 3;
            readonly endpoints: readonly ["/health", "/health/ready", "/health/live"];
        };
        metrics: {
            readonly enabled: true;
            readonly interval: 10000;
            readonly retention: 86400000;
            readonly categories: readonly ["request_count", "request_duration", "error_rate", "active_connections", "memory_usage", "cpu_usage"];
        };
        alerts: {
            readonly errorRate: 0.05;
            readonly responseTime: 1000;
            readonly memoryUsage: 0.85;
            readonly cpuUsage: 0.8;
            readonly diskUsage: 0.9;
            readonly connectionPoolSize: 0.9;
        };
    };
    versioning: {
        readonly defaultVersion: "v1";
        readonly supportedVersions: readonly ["v1", "v2"];
        readonly versionHeader: "X-API-Version";
        readonly deprecationWarnings: true;
        readonly backwardCompatibility: {
            readonly v1: {
                readonly sunset: "2025-12-31";
                readonly alternatives: readonly ["v2"];
            };
        };
    };
    performance: {
        readonly responseTimeTargets: {
            readonly simple: 50;
            readonly complex: 100;
            readonly write: 200;
            readonly batch: 500;
            readonly report: 1000;
        };
        readonly caching: {
            readonly default: {
                readonly ttl: 300;
                readonly stale: 60;
            };
            readonly static: {
                readonly ttl: 3600;
                readonly stale: 600;
            };
            readonly dynamic: {
                readonly ttl: 60;
                readonly stale: 10;
            };
            readonly realtime: {
                readonly ttl: 5;
                readonly stale: 1;
            };
        };
        readonly database: {
            readonly maxConnections: 100;
            readonly minConnections: 10;
            readonly idleTimeoutMs: 30000;
            readonly connectionTimeoutMs: 10000;
            readonly maxRetries: 3;
            readonly retryDelayMs: 1000;
        };
        readonly queries: {
            readonly maxLimit: 1000;
            readonly defaultLimit: 20;
            readonly maxComplexity: 50;
            readonly timeoutMs: 10000;
        };
    };
    security: {
        readonly cors: {
            readonly origin: string[];
            readonly credentials: true;
            readonly optionsSuccessStatus: 200;
            readonly methods: readonly ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];
            readonly allowedHeaders: readonly ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "X-API-Version", "X-Request-ID", "X-Device-ID", "X-Session-ID"];
            readonly exposedHeaders: readonly ["X-Total-Count", "X-Rate-Limit-Remaining", "X-Rate-Limit-Reset", "X-API-Version", "X-Response-Time"];
        };
        readonly csp: {
            readonly directives: {
                readonly defaultSrc: readonly ["'self'"];
                readonly scriptSrc: readonly ["'self'", "'unsafe-inline'"];
                readonly styleSrc: readonly ["'self'", "'unsafe-inline'"];
                readonly imgSrc: readonly ["'self'", "data:", "https:"];
                readonly connectSrc: readonly ["'self'"];
                readonly fontSrc: readonly ["'self'"];
                readonly objectSrc: readonly ["'none'"];
                readonly mediaSrc: readonly ["'self'"];
                readonly frameSrc: readonly ["'none'"];
            };
        };
        readonly validation: {
            readonly maxBodySize: "10mb";
            readonly maxFileSize: "50mb";
            readonly allowedFileTypes: readonly ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
            readonly sanitization: {
                readonly stripTags: true;
                readonly escapeHtml: true;
                readonly normalizeEmail: true;
                readonly trimStrings: true;
            };
        };
        readonly apiKeys: {
            readonly headerName: "X-API-Key";
            readonly queryParam: "api_key";
            readonly encryption: "aes-256-gcm";
            readonly rotation: {
                readonly enabled: true;
                readonly intervalDays: 90;
                readonly warningDays: 30;
            };
            readonly scopes: {
                readonly read: readonly ["GET"];
                readonly write: readonly ["POST", "PUT", "PATCH"];
                readonly delete: readonly ["DELETE"];
                readonly admin: readonly ["GET", "POST", "PUT", "PATCH", "DELETE"];
            };
        };
    };
    graphql: {
        readonly enabled: true;
        readonly endpoint: "/graphql";
        readonly introspection: boolean;
        readonly playground: boolean;
        readonly maxQueryDepth: 10;
        readonly maxQueryComplexity: 1000;
        readonly queryTimeout: 30000;
        readonly subscriptions: {
            readonly enabled: true;
            readonly endpoint: "/graphql/subscriptions";
            readonly path: "/subscriptions";
            readonly keepAlive: 10000;
        };
    };
    errorHandling: {
        readonly includeStack: boolean;
        readonly logErrors: true;
        readonly notifyOnCritical: true;
        readonly retryableErrors: readonly ["ECONNRESET", "ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "ConnectionError", "TimeoutError"];
        readonly nonRetryableErrors: readonly ["ValidationError", "AuthenticationError", "AuthorizationError", "NotFoundError"];
    };
    documentation: {
        readonly openapi: {
            readonly version: "3.0.3";
            readonly info: {
                readonly title: "HASIVU Platform API";
                readonly version: "1.0.0";
                readonly description: "Enterprise-grade School Meal Delivery Platform API";
                readonly termsOfService: "https://hasivu.com/terms";
                readonly contact: {
                    readonly name: "HASIVU API Support";
                    readonly email: "api-support@hasivu.com";
                    readonly url: "https://support.hasivu.com";
                };
                readonly license: {
                    readonly name: "MIT";
                    readonly url: "https://opensource.org/licenses/MIT";
                };
            };
            readonly servers: readonly [{
                readonly url: "https://api.hasivu.com/v1";
                readonly description: "Production server";
            }, {
                readonly url: "https://staging-api.hasivu.com/v1";
                readonly description: "Staging server";
            }, {
                readonly url: "http://localhost:3000/api/v1";
                readonly description: "Development server";
            }];
        };
    };
} | {
    rateLimiting: {
        tiers: {
            [k: string]: {
                requests: number;
                burst: 20;
                windowMs: 60000;
            } | {
                requests: number;
                burst: 40;
                windowMs: 60000;
            } | {
                requests: number;
                burst: 60;
                windowMs: 60000;
            } | {
                requests: number;
                burst: 100;
                windowMs: 60000;
            } | {
                requests: number;
                burst: 200;
                windowMs: 60000;
            } | {
                requests: number;
                burst: 400;
                windowMs: 60000;
            } | {
                requests: number;
                burst: 1000;
                windowMs: 60000;
            } | {
                requests: number;
                burst: 5;
                windowMs: 60000;
            };
        };
        endpoints: {
            readonly '/api/v1/auth/login': {
                readonly requests: 5;
                readonly windowMs: 300000;
                readonly skipSuccessfulRequests: true;
            };
            readonly '/api/v1/auth/register': {
                readonly requests: 3;
                readonly windowMs: 3600000;
                readonly skipSuccessfulRequests: true;
            };
            readonly '/api/v1/payments/process': {
                readonly requests: 10;
                readonly windowMs: 60000;
                readonly skipSuccessfulRequests: false;
            };
            readonly '/api/v1/orders/create': {
                readonly requests: 50;
                readonly windowMs: 60000;
                readonly skipSuccessfulRequests: false;
            };
        };
        global: {
            readonly max: 10000;
            readonly windowMs: 60000;
            readonly message: {
                readonly error: "Too many requests from this IP, please try again later";
                readonly retryAfter: 60;
            };
        };
    };
    versioning: {
        readonly defaultVersion: "v1";
        readonly supportedVersions: readonly ["v1", "v2"];
        readonly versionHeader: "X-API-Version";
        readonly deprecationWarnings: true;
        readonly backwardCompatibility: {
            readonly v1: {
                readonly sunset: "2025-12-31";
                readonly alternatives: readonly ["v2"];
            };
        };
    };
    performance: {
        readonly responseTimeTargets: {
            readonly simple: 50;
            readonly complex: 100;
            readonly write: 200;
            readonly batch: 500;
            readonly report: 1000;
        };
        readonly caching: {
            readonly default: {
                readonly ttl: 300;
                readonly stale: 60;
            };
            readonly static: {
                readonly ttl: 3600;
                readonly stale: 600;
            };
            readonly dynamic: {
                readonly ttl: 60;
                readonly stale: 10;
            };
            readonly realtime: {
                readonly ttl: 5;
                readonly stale: 1;
            };
        };
        readonly database: {
            readonly maxConnections: 100;
            readonly minConnections: 10;
            readonly idleTimeoutMs: 30000;
            readonly connectionTimeoutMs: 10000;
            readonly maxRetries: 3;
            readonly retryDelayMs: 1000;
        };
        readonly queries: {
            readonly maxLimit: 1000;
            readonly defaultLimit: 20;
            readonly maxComplexity: 50;
            readonly timeoutMs: 10000;
        };
    };
    security: {
        readonly cors: {
            readonly origin: string[];
            readonly credentials: true;
            readonly optionsSuccessStatus: 200;
            readonly methods: readonly ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];
            readonly allowedHeaders: readonly ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "X-API-Version", "X-Request-ID", "X-Device-ID", "X-Session-ID"];
            readonly exposedHeaders: readonly ["X-Total-Count", "X-Rate-Limit-Remaining", "X-Rate-Limit-Reset", "X-API-Version", "X-Response-Time"];
        };
        readonly csp: {
            readonly directives: {
                readonly defaultSrc: readonly ["'self'"];
                readonly scriptSrc: readonly ["'self'", "'unsafe-inline'"];
                readonly styleSrc: readonly ["'self'", "'unsafe-inline'"];
                readonly imgSrc: readonly ["'self'", "data:", "https:"];
                readonly connectSrc: readonly ["'self'"];
                readonly fontSrc: readonly ["'self'"];
                readonly objectSrc: readonly ["'none'"];
                readonly mediaSrc: readonly ["'self'"];
                readonly frameSrc: readonly ["'none'"];
            };
        };
        readonly validation: {
            readonly maxBodySize: "10mb";
            readonly maxFileSize: "50mb";
            readonly allowedFileTypes: readonly ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
            readonly sanitization: {
                readonly stripTags: true;
                readonly escapeHtml: true;
                readonly normalizeEmail: true;
                readonly trimStrings: true;
            };
        };
        readonly apiKeys: {
            readonly headerName: "X-API-Key";
            readonly queryParam: "api_key";
            readonly encryption: "aes-256-gcm";
            readonly rotation: {
                readonly enabled: true;
                readonly intervalDays: 90;
                readonly warningDays: 30;
            };
            readonly scopes: {
                readonly read: readonly ["GET"];
                readonly write: readonly ["POST", "PUT", "PATCH"];
                readonly delete: readonly ["DELETE"];
                readonly admin: readonly ["GET", "POST", "PUT", "PATCH", "DELETE"];
            };
        };
    };
    monitoring: {
        readonly healthCheck: {
            readonly interval: 30000;
            readonly timeout: 5000;
            readonly retries: 3;
            readonly endpoints: readonly ["/health", "/health/ready", "/health/live"];
        };
        readonly metrics: {
            readonly enabled: true;
            readonly interval: 10000;
            readonly retention: 86400000;
            readonly categories: readonly ["request_count", "request_duration", "error_rate", "active_connections", "memory_usage", "cpu_usage"];
        };
        readonly logging: {
            readonly level: "info" | "debug";
            readonly format: "json";
            readonly includeRequestId: true;
            readonly includeUserContext: true;
            readonly sensitiveFields: readonly ["password", "passwordHash", "token", "secret", "apiKey", "creditCard", "ssn", "bankAccount"];
        };
        readonly alerts: {
            readonly errorRate: 0.05;
            readonly responseTime: 1000;
            readonly memoryUsage: 0.85;
            readonly cpuUsage: 0.8;
            readonly diskUsage: 0.9;
            readonly connectionPoolSize: 0.9;
        };
    };
    graphql: {
        readonly enabled: true;
        readonly endpoint: "/graphql";
        readonly introspection: boolean;
        readonly playground: boolean;
        readonly maxQueryDepth: 10;
        readonly maxQueryComplexity: 1000;
        readonly queryTimeout: 30000;
        readonly subscriptions: {
            readonly enabled: true;
            readonly endpoint: "/graphql/subscriptions";
            readonly path: "/subscriptions";
            readonly keepAlive: 10000;
        };
    };
    errorHandling: {
        readonly includeStack: boolean;
        readonly logErrors: true;
        readonly notifyOnCritical: true;
        readonly retryableErrors: readonly ["ECONNRESET", "ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "ConnectionError", "TimeoutError"];
        readonly nonRetryableErrors: readonly ["ValidationError", "AuthenticationError", "AuthorizationError", "NotFoundError"];
    };
    documentation: {
        readonly openapi: {
            readonly version: "3.0.3";
            readonly info: {
                readonly title: "HASIVU Platform API";
                readonly version: "1.0.0";
                readonly description: "Enterprise-grade School Meal Delivery Platform API";
                readonly termsOfService: "https://hasivu.com/terms";
                readonly contact: {
                    readonly name: "HASIVU API Support";
                    readonly email: "api-support@hasivu.com";
                    readonly url: "https://support.hasivu.com";
                };
                readonly license: {
                    readonly name: "MIT";
                    readonly url: "https://opensource.org/licenses/MIT";
                };
            };
            readonly servers: readonly [{
                readonly url: "https://api.hasivu.com/v1";
                readonly description: "Production server";
            }, {
                readonly url: "https://staging-api.hasivu.com/v1";
                readonly description: "Staging server";
            }, {
                readonly url: "http://localhost:3000/api/v1";
                readonly description: "Development server";
            }];
        };
    };
} | {
    rateLimiting: {
        tiers: {
            [k: string]: {
                requests: number;
                burst: 20;
                windowMs: 60000;
            } | {
                requests: number;
                burst: 40;
                windowMs: 60000;
            } | {
                requests: number;
                burst: 60;
                windowMs: 60000;
            } | {
                requests: number;
                burst: 100;
                windowMs: 60000;
            } | {
                requests: number;
                burst: 200;
                windowMs: 60000;
            } | {
                requests: number;
                burst: 400;
                windowMs: 60000;
            } | {
                requests: number;
                burst: 1000;
                windowMs: 60000;
            } | {
                requests: number;
                burst: 5;
                windowMs: 60000;
            };
        };
        endpoints: {
            readonly '/api/v1/auth/login': {
                readonly requests: 5;
                readonly windowMs: 300000;
                readonly skipSuccessfulRequests: true;
            };
            readonly '/api/v1/auth/register': {
                readonly requests: 3;
                readonly windowMs: 3600000;
                readonly skipSuccessfulRequests: true;
            };
            readonly '/api/v1/payments/process': {
                readonly requests: 10;
                readonly windowMs: 60000;
                readonly skipSuccessfulRequests: false;
            };
            readonly '/api/v1/orders/create': {
                readonly requests: 50;
                readonly windowMs: 60000;
                readonly skipSuccessfulRequests: false;
            };
        };
        global: {
            readonly max: 10000;
            readonly windowMs: 60000;
            readonly message: {
                readonly error: "Too many requests from this IP, please try again later";
                readonly retryAfter: 60;
            };
        };
    };
    monitoring: {
        logging: {
            level: string;
            format: "json";
            includeRequestId: true;
            includeUserContext: true;
            sensitiveFields: readonly ["password", "passwordHash", "token", "secret", "apiKey", "creditCard", "ssn", "bankAccount"];
        };
        healthCheck: {
            readonly interval: 30000;
            readonly timeout: 5000;
            readonly retries: 3;
            readonly endpoints: readonly ["/health", "/health/ready", "/health/live"];
        };
        metrics: {
            readonly enabled: true;
            readonly interval: 10000;
            readonly retention: 86400000;
            readonly categories: readonly ["request_count", "request_duration", "error_rate", "active_connections", "memory_usage", "cpu_usage"];
        };
        alerts: {
            readonly errorRate: 0.05;
            readonly responseTime: 1000;
            readonly memoryUsage: 0.85;
            readonly cpuUsage: 0.8;
            readonly diskUsage: 0.9;
            readonly connectionPoolSize: 0.9;
        };
    };
    versioning: {
        readonly defaultVersion: "v1";
        readonly supportedVersions: readonly ["v1", "v2"];
        readonly versionHeader: "X-API-Version";
        readonly deprecationWarnings: true;
        readonly backwardCompatibility: {
            readonly v1: {
                readonly sunset: "2025-12-31";
                readonly alternatives: readonly ["v2"];
            };
        };
    };
    performance: {
        readonly responseTimeTargets: {
            readonly simple: 50;
            readonly complex: 100;
            readonly write: 200;
            readonly batch: 500;
            readonly report: 1000;
        };
        readonly caching: {
            readonly default: {
                readonly ttl: 300;
                readonly stale: 60;
            };
            readonly static: {
                readonly ttl: 3600;
                readonly stale: 600;
            };
            readonly dynamic: {
                readonly ttl: 60;
                readonly stale: 10;
            };
            readonly realtime: {
                readonly ttl: 5;
                readonly stale: 1;
            };
        };
        readonly database: {
            readonly maxConnections: 100;
            readonly minConnections: 10;
            readonly idleTimeoutMs: 30000;
            readonly connectionTimeoutMs: 10000;
            readonly maxRetries: 3;
            readonly retryDelayMs: 1000;
        };
        readonly queries: {
            readonly maxLimit: 1000;
            readonly defaultLimit: 20;
            readonly maxComplexity: 50;
            readonly timeoutMs: 10000;
        };
    };
    security: {
        readonly cors: {
            readonly origin: string[];
            readonly credentials: true;
            readonly optionsSuccessStatus: 200;
            readonly methods: readonly ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];
            readonly allowedHeaders: readonly ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "X-API-Version", "X-Request-ID", "X-Device-ID", "X-Session-ID"];
            readonly exposedHeaders: readonly ["X-Total-Count", "X-Rate-Limit-Remaining", "X-Rate-Limit-Reset", "X-API-Version", "X-Response-Time"];
        };
        readonly csp: {
            readonly directives: {
                readonly defaultSrc: readonly ["'self'"];
                readonly scriptSrc: readonly ["'self'", "'unsafe-inline'"];
                readonly styleSrc: readonly ["'self'", "'unsafe-inline'"];
                readonly imgSrc: readonly ["'self'", "data:", "https:"];
                readonly connectSrc: readonly ["'self'"];
                readonly fontSrc: readonly ["'self'"];
                readonly objectSrc: readonly ["'none'"];
                readonly mediaSrc: readonly ["'self'"];
                readonly frameSrc: readonly ["'none'"];
            };
        };
        readonly validation: {
            readonly maxBodySize: "10mb";
            readonly maxFileSize: "50mb";
            readonly allowedFileTypes: readonly ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
            readonly sanitization: {
                readonly stripTags: true;
                readonly escapeHtml: true;
                readonly normalizeEmail: true;
                readonly trimStrings: true;
            };
        };
        readonly apiKeys: {
            readonly headerName: "X-API-Key";
            readonly queryParam: "api_key";
            readonly encryption: "aes-256-gcm";
            readonly rotation: {
                readonly enabled: true;
                readonly intervalDays: 90;
                readonly warningDays: 30;
            };
            readonly scopes: {
                readonly read: readonly ["GET"];
                readonly write: readonly ["POST", "PUT", "PATCH"];
                readonly delete: readonly ["DELETE"];
                readonly admin: readonly ["GET", "POST", "PUT", "PATCH", "DELETE"];
            };
        };
    };
    graphql: {
        readonly enabled: true;
        readonly endpoint: "/graphql";
        readonly introspection: boolean;
        readonly playground: boolean;
        readonly maxQueryDepth: 10;
        readonly maxQueryComplexity: 1000;
        readonly queryTimeout: 30000;
        readonly subscriptions: {
            readonly enabled: true;
            readonly endpoint: "/graphql/subscriptions";
            readonly path: "/subscriptions";
            readonly keepAlive: 10000;
        };
    };
    errorHandling: {
        readonly includeStack: boolean;
        readonly logErrors: true;
        readonly notifyOnCritical: true;
        readonly retryableErrors: readonly ["ECONNRESET", "ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "ConnectionError", "TimeoutError"];
        readonly nonRetryableErrors: readonly ["ValidationError", "AuthenticationError", "AuthorizationError", "NotFoundError"];
    };
    documentation: {
        readonly openapi: {
            readonly version: "3.0.3";
            readonly info: {
                readonly title: "HASIVU Platform API";
                readonly version: "1.0.0";
                readonly description: "Enterprise-grade School Meal Delivery Platform API";
                readonly termsOfService: "https://hasivu.com/terms";
                readonly contact: {
                    readonly name: "HASIVU API Support";
                    readonly email: "api-support@hasivu.com";
                    readonly url: "https://support.hasivu.com";
                };
                readonly license: {
                    readonly name: "MIT";
                    readonly url: "https://opensource.org/licenses/MIT";
                };
            };
            readonly servers: readonly [{
                readonly url: "https://api.hasivu.com/v1";
                readonly description: "Production server";
            }, {
                readonly url: "https://staging-api.hasivu.com/v1";
                readonly description: "Staging server";
            }, {
                readonly url: "http://localhost:3000/api/v1";
                readonly description: "Development server";
            }];
        };
    };
};
export default API_CONFIG;
//# sourceMappingURL=api.config.d.ts.map