"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = exports.config = void 0;
/**
 * HASIVU Platform - Environment Configuration
 * Centralized configuration management with validation and type safety
 * Security-hardened configuration with comprehensive validation
 */
const envalid_1 = require("envalid");
/**
 * Validate and parse environment variables with enhanced security
 */
const env = (0, envalid_1.cleanEnv)(process.env, {
    NODE_ENV: (0, envalid_1.str)({ choices: ['development', 'test', 'staging', 'production'], default: 'development' }),
    PORT: (0, envalid_1.num)({ default: 3000 }),
    HOST: (0, envalid_1.str)({ default: '0.0.0.0' }),
    APP_NAME: (0, envalid_1.str)({ default: 'HASIVU Platform' }),
    API_VERSION: (0, envalid_1.str)({ default: 'v1' }),
    BASE_URL: (0, envalid_1.str)({ default: 'http://localhost:3000' }),
    // Database - Required for all environments
    DATABASE_URL: (0, envalid_1.str)({ desc: 'Primary database connection URL' }),
    DATABASE_HOST: (0, envalid_1.str)({ default: 'localhost' }),
    DATABASE_PORT: (0, envalid_1.num)({ default: 5432 }),
    DATABASE_NAME: (0, envalid_1.str)({ default: 'hasivu_platform' }),
    DATABASE_USERNAME: (0, envalid_1.str)({ default: 'hasivu_admin' }),
    DATABASE_PASSWORD: (0, envalid_1.str)({ desc: 'Database password - required' }),
    DATABASE_SSL: (0, envalid_1.bool)({ default: false }),
    DATABASE_POOL_MIN: (0, envalid_1.num)({ default: 2 }),
    DATABASE_POOL_MAX: (0, envalid_1.num)({ default: 10 }),
    DATABASE_ACQUIRE_TIMEOUT: (0, envalid_1.num)({ default: 30000 }),
    DATABASE_IDLE_TIMEOUT: (0, envalid_1.num)({ default: 10000 }),
    // Redis - Required for session storage
    REDIS_URL: (0, envalid_1.str)({ desc: 'Redis connection URL for session storage' }),
    REDIS_HOST: (0, envalid_1.str)({ default: 'localhost' }),
    REDIS_PORT: (0, envalid_1.num)({ default: 6379 }),
    REDIS_PASSWORD: (0, envalid_1.str)({ default: '' }),
    REDIS_DB: (0, envalid_1.num)({ default: 0 }),
    REDIS_MAX_RETRIES: (0, envalid_1.num)({ default: 3 }),
    REDIS_RETRY_DELAY: (0, envalid_1.num)({ default: 100 }),
    REDIS_ENABLE_OFFLINE_QUEUE: (0, envalid_1.bool)({ default: false }),
    REDIS_LAZY_CONNECT: (0, envalid_1.bool)({ default: true }),
    // JWT - Enhanced security validation
    JWT_SECRET: (0, envalid_1.str)({ default: 'test-jwt-secret-key-for-testing-purposes-only-must-be-changed-in-production', desc: 'JWT secret must be at least 64 characters for production security' }),
    JWT_REFRESH_SECRET: (0, envalid_1.str)({ default: '', desc: 'Separate secret for refresh tokens (optional, will use JWT_SECRET + suffix)' }),
    JWT_EXPIRES_IN: (0, envalid_1.str)({ default: '1h', desc: 'Access token expiration time' }),
    JWT_REFRESH_EXPIRES_IN: (0, envalid_1.str)({ default: '7d', desc: 'Refresh token expiration time' }),
    JWT_ISSUER: (0, envalid_1.str)({ default: 'hasivu-platform' }),
    JWT_AUDIENCE: (0, envalid_1.str)({ default: 'hasivu-users' }),
    // Security - Enhanced validation
    BCRYPT_ROUNDS: (0, envalid_1.num)({ default: 12, choices: [10, 11, 12, 13, 14, 15] }),
    SESSION_SECRET: (0, envalid_1.str)({ default: 'test-session-secret-key-for-testing-only', desc: 'Session secret must be at least 32 characters' }),
    CORS_ORIGINS: (0, envalid_1.str)({ default: 'http://localhost:3000,http://localhost:3001' }),
    TRUSTED_PROXIES: (0, envalid_1.str)({ default: '' }),
    ENCRYPTION_KEY: (0, envalid_1.str)({ default: 'test-encryption-key-for-testing-must-be-32-chars', desc: 'Data encryption key for sensitive information' }),
    RATE_LIMIT_ENABLED: (0, envalid_1.bool)({ default: true }),
    SECURITY_HEADERS_ENABLED: (0, envalid_1.bool)({ default: true }),
    // Rate limiting
    RATE_LIMIT_WINDOW: (0, envalid_1.num)({ default: 900000 }), // 15 minutes
    RATE_LIMIT_MAX: (0, envalid_1.num)({ default: 100 }),
    RATE_LIMIT_SKIP_SUCCESSFUL: (0, envalid_1.bool)({ default: false }),
    RATE_LIMIT_SKIP_FAILED: (0, envalid_1.bool)({ default: false }),
    // File upload
    UPLOAD_MAX_SIZE: (0, envalid_1.str)({ default: '10mb' }),
    UPLOAD_ALLOWED_TYPES: (0, envalid_1.str)({ default: 'image/jpeg,image/png,image/webp,application/pdf' }),
    UPLOAD_DESTINATION: (0, envalid_1.str)({ default: './uploads' }),
    // AWS - Production required
    AWS_REGION: (0, envalid_1.str)({ default: 'us-east-1' }),
    AWS_ACCESS_KEY_ID: (0, envalid_1.str)({ default: 'test-aws-access-key', desc: 'AWS access key ID for S3 and SES' }),
    AWS_SECRET_ACCESS_KEY: (0, envalid_1.str)({ default: 'test-aws-secret-key', desc: 'AWS secret access key' }),
    AWS_S3_BUCKET: (0, envalid_1.str)({ default: 'test-bucket', desc: 'S3 bucket for file storage' }),
    AWS_SES_FROM_EMAIL: (0, envalid_1.email)({ default: 'test@example.com', desc: 'SES from email address' }),
    AWS_CLOUDWATCH_LOG_GROUP: (0, envalid_1.str)({ default: '/aws/lambda/hasivu-platform' }),
    // Razorpay - Enhanced validation
    RAZORPAY_KEY_ID: (0, envalid_1.str)({ default: 'rzp_test_1234567890', desc: 'Razorpay key ID must be valid format' }),
    RAZORPAY_KEY_SECRET: (0, envalid_1.str)({ default: 'test_secret_1234567890', desc: 'Razorpay key secret must be valid format' }),
    RAZORPAY_WEBHOOK_SECRET: (0, envalid_1.str)({ default: 'test-webhook-secret-32-characters-long', desc: 'Webhook secret must be at least 32 characters' }),
    RAZORPAY_BASE_URL: (0, envalid_1.url)({ default: 'https://api.razorpay.com/v1' }),
    // WhatsApp - Enhanced validation
    WHATSAPP_API_URL: (0, envalid_1.url)({ default: 'https://graph.facebook.com/v18.0' }),
    WHATSAPP_ACCESS_TOKEN: (0, envalid_1.str)({ default: 'test-whatsapp-access-token-1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890', desc: 'WhatsApp access token must be valid format' }),
    WHATSAPP_PHONE_NUMBER_ID: (0, envalid_1.str)({ default: 'test-phone-number-id', desc: 'WhatsApp phone number ID must be valid' }),
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: (0, envalid_1.str)({ default: 'test-webhook-verify-token', desc: 'WhatsApp webhook verify token' }),
    WHATSAPP_BUSINESS_ACCOUNT_ID: (0, envalid_1.str)({ default: 'test-business-account-id', desc: 'WhatsApp business account ID' }),
    // SendGrid
    SENDGRID_API_KEY: (0, envalid_1.str)({ default: 'test-sendgrid-api-key', desc: 'SendGrid API key for email services' }),
    SENDGRID_FROM_EMAIL: (0, envalid_1.email)({ default: 'test@example.com', desc: 'SendGrid from email address' }),
    SENDGRID_FROM_NAME: (0, envalid_1.str)({ default: 'HASIVU Platform' }),
    // Firebase
    FIREBASE_PROJECT_ID: (0, envalid_1.str)({ default: 'test-firebase-project', desc: 'Firebase project ID' }),
    FIREBASE_PRIVATE_KEY: (0, envalid_1.str)({ default: 'test-firebase-private-key', desc: 'Firebase private key' }),
    FIREBASE_CLIENT_EMAIL: (0, envalid_1.email)({ default: 'test@firebase.com', desc: 'Firebase client email' }),
    FIREBASE_DATABASE_URL: (0, envalid_1.url)({ default: 'https://test-project.firebaseio.com', desc: 'Firebase database URL' }),
    // Monitoring
    ENABLE_METRICS: (0, envalid_1.bool)({ default: true }),
    METRICS_PORT: (0, envalid_1.num)({ default: 9090 }),
    LOG_LEVEL: (0, envalid_1.str)({ choices: ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'], default: 'info' }),
    LOG_FILE: (0, envalid_1.str)({ default: './logs/app.log' }),
    ENABLE_CLOUDWATCH: (0, envalid_1.bool)({ default: false }),
    ENABLE_SENTRY: (0, envalid_1.bool)({ default: false }),
    SENTRY_DSN: (0, envalid_1.str)({ default: '' }),
    // Feature flags
    ENABLE_WEBSOCKET: (0, envalid_1.bool)({ default: true }),
    ENABLE_FILE_UPLOAD: (0, envalid_1.bool)({ default: true }),
    ENABLE_NOTIFICATIONS: (0, envalid_1.bool)({ default: true }),
    ENABLE_ANALYTICS: (0, envalid_1.bool)({ default: true }),
    ENABLE_RFID: (0, envalid_1.bool)({ default: true }),
    ENABLE_TESTING: (0, envalid_1.bool)({ default: false }),
    // Development
    ENABLE_HOT_RELOAD: (0, envalid_1.bool)({ default: false }),
    ENABLE_DEBUG: (0, envalid_1.bool)({ default: false }),
    ENABLE_PROFILING: (0, envalid_1.bool)({ default: false }),
    ENABLE_SQL_LOGGING: (0, envalid_1.bool)({ default: false })
});
/**
 * Parsed and validated configuration object with security enhancements
 */
exports.config = {
    server: {
        nodeEnv: env.NODE_ENV,
        port: env.PORT,
        host: env.HOST,
        appName: env.APP_NAME,
        apiVersion: env.API_VERSION,
        baseUrl: env.BASE_URL
    },
    // Database configuration
    database: {
        url: env.DATABASE_URL,
        host: env.DATABASE_HOST,
        port: env.DATABASE_PORT,
        name: env.DATABASE_NAME,
        username: env.DATABASE_USERNAME,
        password: env.DATABASE_PASSWORD,
        ssl: env.DATABASE_SSL,
        poolMin: env.DATABASE_POOL_MIN,
        poolMax: env.DATABASE_POOL_MAX,
        acquireTimeout: env.DATABASE_ACQUIRE_TIMEOUT,
        idleTimeout: env.DATABASE_IDLE_TIMEOUT
    },
    // Redis configuration
    redis: {
        url: env.REDIS_URL,
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        db: env.REDIS_DB,
        maxRetries: env.REDIS_MAX_RETRIES,
        retryDelay: env.REDIS_RETRY_DELAY,
        enableOfflineQueue: env.REDIS_ENABLE_OFFLINE_QUEUE,
        lazyConnect: env.REDIS_LAZY_CONNECT
    },
    // JWT authentication with enhanced security
    jwt: {
        secret: env.JWT_SECRET,
        refreshSecret: env.JWT_REFRESH_SECRET || env.JWT_SECRET + '_refresh',
        expiresIn: env.JWT_EXPIRES_IN,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE
    },
    // Security settings with enhanced validation
    security: {
        bcryptRounds: env.BCRYPT_ROUNDS,
        sessionSecret: env.SESSION_SECRET,
        corsOrigins: env.CORS_ORIGINS,
        trustedProxies: env.TRUSTED_PROXIES,
        encryptionKey: env.ENCRYPTION_KEY,
        rateLimitEnabled: env.RATE_LIMIT_ENABLED,
        securityHeadersEnabled: env.SECURITY_HEADERS_ENABLED
    },
    // Rate limiting
    rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW,
        maxRequests: env.RATE_LIMIT_MAX,
        skipSuccessful: env.RATE_LIMIT_SKIP_SUCCESSFUL,
        skipFailed: env.RATE_LIMIT_SKIP_FAILED
    },
    // CORS configuration
    cors: {
        origins: env.CORS_ORIGINS
    },
    // File upload settings
    upload: {
        maxSize: env.UPLOAD_MAX_SIZE,
        allowedTypes: env.UPLOAD_ALLOWED_TYPES,
        destination: env.UPLOAD_DESTINATION
    },
    // AWS configuration
    aws: {
        region: env.AWS_REGION,
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        s3Bucket: env.AWS_S3_BUCKET,
        sesFromEmail: env.AWS_SES_FROM_EMAIL,
        cloudwatchLogGroup: env.AWS_CLOUDWATCH_LOG_GROUP
    },
    // External service APIs with validation
    razorpay: {
        keyId: env.RAZORPAY_KEY_ID,
        keySecret: env.RAZORPAY_KEY_SECRET,
        webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
        baseUrl: env.RAZORPAY_BASE_URL
    },
    whatsapp: {
        apiUrl: env.WHATSAPP_API_URL,
        accessToken: env.WHATSAPP_ACCESS_TOKEN,
        phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
        webhookVerifyToken: env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
        businessAccountId: env.WHATSAPP_BUSINESS_ACCOUNT_ID
    },
    sendgrid: {
        apiKey: env.SENDGRID_API_KEY,
        fromEmail: env.SENDGRID_FROM_EMAIL,
        fromName: env.SENDGRID_FROM_NAME
    },
    firebase: {
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        databaseUrl: env.FIREBASE_DATABASE_URL
    },
    // Monitoring and logging
    monitoring: {
        enableMetrics: env.ENABLE_METRICS,
        metricsPort: env.METRICS_PORT,
        logLevel: env.LOG_LEVEL,
        logFile: env.LOG_FILE,
        enableCloudwatch: env.ENABLE_CLOUDWATCH,
        enableSentry: env.ENABLE_SENTRY,
        sentryDsn: env.SENTRY_DSN
    },
    // Feature flags
    features: {
        enableWebsocket: env.ENABLE_WEBSOCKET,
        enableFileUpload: env.ENABLE_FILE_UPLOAD,
        enableNotifications: env.ENABLE_NOTIFICATIONS,
        enableAnalytics: env.ENABLE_ANALYTICS,
        enableRfid: env.ENABLE_RFID,
        enableTesting: env.ENABLE_TESTING
    },
    // Development settings
    development: {
        enableHotReload: env.ENABLE_HOT_RELOAD,
        enableDebug: env.ENABLE_DEBUG,
        enableProfiling: env.ENABLE_PROFILING,
        enableSqlLogging: env.ENABLE_SQL_LOGGING
    },
    // Notification services
    notifications: {
        email: {
            apiKey: env.SENDGRID_API_KEY,
            fromEmail: env.SENDGRID_FROM_EMAIL,
            provider: 'sendgrid'
        },
        sms: {
            apiKey: '',
            provider: 'twilio'
        },
        push: {
            apiKey: '',
            provider: 'firebase'
        }
    }
};
/**
 * Validate configuration based on environment with comprehensive security checks
 */
function validateConfig() {
    const errors = [];
    const warnings = [];
    // Production security validations
    if (exports.config.server.nodeEnv === 'production') {
        // JWT Security
        if (exports.config.jwt.secret.length < 64) {
            errors.push('JWT secret must be at least 64 characters for production');
        }
        if (exports.config.jwt.secret.toLowerCase().includes('secret') ||
            exports.config.jwt.secret.toLowerCase().includes('password') ||
            exports.config.jwt.secret.toLowerCase().includes('default')) {
            errors.push('JWT secret appears to contain weak or default values');
        }
        // Session Security
        if (exports.config.security.sessionSecret.length < 32) {
            errors.push('Session secret must be at least 32 characters for production');
        }
        // CORS Security
        if (exports.config.security.corsOrigins.includes('*')) {
            errors.push('Wildcard CORS origins (*) not allowed in production');
        }
        // Monitoring
        if (!exports.config.monitoring.enableMetrics) {
            warnings.push('Monitoring metrics should be enabled in production');
        }
        // Rate Limiting
        if (!exports.config.security.rateLimitEnabled) {
            warnings.push('Rate limiting should be enabled in production');
        }
        // Security Headers
        if (!exports.config.security.securityHeadersEnabled) {
            warnings.push('Security headers should be enabled in production');
        }
        // Encryption
        if (exports.config.security.encryptionKey.length < 32) {
            errors.push('Encryption key must be at least 32 characters for production');
        }
    }
    // General validations
    // Database validations
    if (!exports.config.database.url) {
        errors.push('Database URL is required');
    }
    // Redis validations
    if (!exports.config.redis.url) {
        errors.push('Redis URL is required for session storage');
    }
    // AWS validations
    if (!exports.config.aws.accessKeyId || !exports.config.aws.secretAccessKey) {
        errors.push('AWS credentials are required');
    }
    // External service validations (skip for test environment)
    if (exports.config.server.nodeEnv !== 'test') {
        if (exports.config.razorpay.keyId.length < 14 || exports.config.razorpay.keySecret.length < 24) {
            errors.push('Invalid Razorpay credentials format');
        }
        if (exports.config.razorpay.webhookSecret.length < 32) {
            errors.push('Razorpay webhook secret must be at least 32 characters');
        }
    }
    // Encryption validation
    if (exports.config.security.encryptionKey.length < 32) {
        errors.push('Encryption key must be at least 32 characters');
    }
    // bcrypt rounds validation
    if (exports.config.security.bcryptRounds < 10 || exports.config.security.bcryptRounds > 15) {
        errors.push('bcrypt rounds must be between 10 and 15');
    }
    // WhatsApp validations (if enabled and not test environment)
    if (exports.config.features.enableNotifications && exports.config.server.nodeEnv !== 'test') {
        if (exports.config.whatsapp.accessToken.length < 100) {
            errors.push('WhatsApp access token appears to be invalid format');
        }
        if (exports.config.whatsapp.webhookVerifyToken.length < 20) {
            errors.push('WhatsApp webhook verify token must be at least 20 characters');
        }
    }
    // SendGrid validations (skip for test environment)
    if (exports.config.server.nodeEnv !== 'test' && exports.config.sendgrid.apiKey.length < 20) {
        warnings.push('SendGrid API key appears to be too short');
    }
    // Log warnings
    if (warnings.length > 0) {
        console.warn('Configuration warnings:', warnings.join(', '));
    }
    // Throw errors
    if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
    console.info('Configuration validation passed');
}
exports.validateConfig = validateConfig;
// Validate configuration on import
try {
    validateConfig();
}
catch (error) {
    console.error('Configuration validation failed:', error);
    process.exit(1);
}
exports.default = exports.config;
