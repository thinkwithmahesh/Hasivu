/**
 * HASIVU Platform - Environment Configuration
 * Centralized configuration management with validation and type safety
 * Security-hardened configuration with comprehensive validation
 */
import { cleanEnv, str, num, bool, url, email } from 'envalid';
/**
 * Environment configuration interface with strict typing
 */
export interface Config {
  // Server configuration
  server: {
    nodeEnv: string;
    port: number;
    host: string;
    appName: string;
    apiVersion: string;
    baseUrl: string;
  };
  // Database configuration
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
    ssl: boolean;
    poolMin: number;
    poolMax: number;
    acquireTimeout: number;
    idleTimeout: number;
  };
  // Redis configuration
  redis: {
    url: string;
    host: string;
    port: number;
    password: string;
    db: number;
    maxRetries: number;
    retryDelay: number;
    enableOfflineQueue: boolean;
    lazyConnect: boolean;
  };
  // JWT authentication with enhanced security
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string;
  };
  // Security settings with comprehensive validation
  security: {
    bcryptRounds: number;
    sessionSecret: string;
    corsOrigins: string;
    trustedProxies: string;
    encryptionKey: string;
    rateLimitEnabled: boolean;
    securityHeadersEnabled: boolean;
  };
  // Rate limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessful: boolean;
    skipFailed: boolean;
  };
  // CORS configuration
  cors: {
    origins: string;
  };
  // File upload settings
  upload: {
    maxSize: string;
    allowedTypes: string;
    destination: string;
  };
  // AWS configuration
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket: string;
    sesFromEmail: string;
    cloudwatchLogGroup: string;
  };
  // External service APIs with validation
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
    baseUrl: string;
  };
  whatsapp: {
    apiUrl: string;
    accessToken: string;
    phoneNumberId: string;
    webhookVerifyToken: string;
    businessAccountId: string;
  };
  sendgrid: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  firebase: {
    projectId: string;
    privateKey: string;
    clientEmail: string;
    databaseUrl: string;
  };
  // Monitoring and logging
  monitoring: {
    enableMetrics: boolean;
    metricsPort: number;
    logLevel: string;
    logFile: string;
    enableCloudwatch: boolean;
    enableSentry: boolean;
    sentryDsn: string;
  };
  // Feature flags
  features: {
    enableWebsocket: boolean;
    enableFileUpload: boolean;
    enableNotifications: boolean;
    enableAnalytics: boolean;
    enableRfid: boolean;
    enableTesting: boolean;
  };
  // Development settings
  development: {
    enableHotReload: boolean;
    enableDebug: boolean;
    enableProfiling: boolean;
    enableSqlLogging: boolean;
  };
  // Notification services
  notifications: {
    email: {
      apiKey: string;
      fromEmail: string;
      provider: string;
    };
    sms: {
      apiKey: string;
      provider: string;
    };
    push: {
      apiKey: string;
      provider: string;
    };
  };
}
/**
 * Validate and parse environment variables with enhanced security
 */
const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'staging', 'production'], default: 'development' }),
  PORT: num({ default: 3000 }),
  HOST: str({ default: '0.0.0.0' }),
  APP_NAME: str({ default: 'HASIVU Platform' }),
  API_VERSION: str({ default: 'v1' }),
  BASE_URL: str({ default: 'http://localhost:3000' }),
  // Database - Required for all environments
  DATABASE_URL: str({ desc: 'Primary database connection URL' }),
  DATABASE_HOST: str({ default: 'localhost' }),
  DATABASE_PORT: num({ default: 5432 }),
  DATABASE_NAME: str({ default: 'hasivu_platform' }),
  DATABASE_USERNAME: str({ default: 'hasivu_admin' }),
  DATABASE_PASSWORD: str({ desc: 'Database password - required' }),
  DATABASE_SSL: bool({ default: false }),
  DATABASE_POOL_MIN: num({ default: 2 }),
  DATABASE_POOL_MAX: num({ default: 10 }),
  DATABASE_ACQUIRE_TIMEOUT: num({ default: 30000 }),
  DATABASE_IDLE_TIMEOUT: num({ default: 10000 }),
  // Redis - Required for session storage
  REDIS_URL: str({ desc: 'Redis connection URL for session storage' }),
  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: num({ default: 6379 }),
  REDIS_PASSWORD: str({ default: '' }),
  REDIS_DB: num({ default: 0 }),
  REDIS_MAX_RETRIES: num({ default: 3 }),
  REDIS_RETRY_DELAY: num({ default: 100 }),
  REDIS_ENABLE_OFFLINE_QUEUE: bool({ default: false }),
  REDIS_LAZY_CONNECT: bool({ default: true }),
  // JWT - Enhanced security validation
  JWT_SECRET: str({ default: 'test-jwt-secret-key-for-testing-purposes-only-must-be-changed-in-production', desc: 'JWT secret must be at least 64 characters for production security' }),
  JWT_REFRESH_SECRET: str({ default: '', desc: 'Separate secret for refresh tokens (optional, will use JWT_SECRET + suffix)' }),
  JWT_EXPIRES_IN: str({ default: '1h', desc: 'Access token expiration time' }),
  JWT_REFRESH_EXPIRES_IN: str({ default: '7d', desc: 'Refresh token expiration time' }),
  JWT_ISSUER: str({ default: 'hasivu-platform' }),
  JWT_AUDIENCE: str({ default: 'hasivu-users' }),
  // Security - Enhanced validation
  BCRYPT_ROUNDS: num({ default: 12, choices: [10, 11, 12, 13, 14, 15] }),
  SESSION_SECRET: str({ default: 'test-session-secret-key-for-testing-only', desc: 'Session secret must be at least 32 characters' }),
  CORS_ORIGINS: str({ default: 'http://localhost:3000,http://localhost:3001' }),
  TRUSTED_PROXIES: str({ default: '' }),
  ENCRYPTION_KEY: str({ default: 'test-encryption-key-for-testing-must-be-32-chars', desc: 'Data encryption key for sensitive information' }),
  RATE_LIMIT_ENABLED: bool({ default: true }),
  SECURITY_HEADERS_ENABLED: bool({ default: true }),
  // Rate limiting
  RATE_LIMIT_WINDOW: num({ default: 900000 }), // 15 minutes
  RATE_LIMIT_MAX: num({ default: 100 }),
  RATE_LIMIT_SKIP_SUCCESSFUL: bool({ default: false }),
  RATE_LIMIT_SKIP_FAILED: bool({ default: false }),
  // File upload
  UPLOAD_MAX_SIZE: str({ default: '10mb' }),
  UPLOAD_ALLOWED_TYPES: str({ default: 'image/jpeg,image/png,image/webp,application/pdf' }),
  UPLOAD_DESTINATION: str({ default: './uploads' }),
  // AWS - Production required
  AWS_REGION: str({ default: 'us-east-1' }),
  AWS_ACCESS_KEY_ID: str({ default: 'test-aws-access-key', desc: 'AWS access key ID for S3 and SES' }),
  AWS_SECRET_ACCESS_KEY: str({ default: 'test-aws-secret-key', desc: 'AWS secret access key' }),
  AWS_S3_BUCKET: str({ default: 'test-bucket', desc: 'S3 bucket for file storage' }),
  AWS_SES_FROM_EMAIL: email({ default: 'test@example.com', desc: 'SES from email address' }),
  AWS_CLOUDWATCH_LOG_GROUP: str({ default: '/aws/lambda/hasivu-platform' }),
  // Razorpay - Enhanced validation
  RAZORPAY_KEY_ID: str({ default: 'rzp_test_1234567890', desc: 'Razorpay key ID must be valid format' }),
  RAZORPAY_KEY_SECRET: str({ default: 'test_secret_1234567890', desc: 'Razorpay key secret must be valid format' }),
  RAZORPAY_WEBHOOK_SECRET: str({ default: 'test-webhook-secret-32-characters-long', desc: 'Webhook secret must be at least 32 characters' }),
  RAZORPAY_BASE_URL: url({ default: 'https://api.razorpay.com/v1' }),
  // WhatsApp - Enhanced validation
  WHATSAPP_API_URL: url({ default: 'https://graph.facebook.com/v18.0' }),
  WHATSAPP_ACCESS_TOKEN: str({ default: 'test-whatsapp-access-token-1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890', desc: 'WhatsApp access token must be valid format' }),
  WHATSAPP_PHONE_NUMBER_ID: str({ default: 'test-phone-number-id', desc: 'WhatsApp phone number ID must be valid' }),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: str({ default: 'test-webhook-verify-token', desc: 'WhatsApp webhook verify token' }),
  WHATSAPP_BUSINESS_ACCOUNT_ID: str({ default: 'test-business-account-id', desc: 'WhatsApp business account ID' }),
  // SendGrid
  SENDGRID_API_KEY: str({ default: 'test-sendgrid-api-key', desc: 'SendGrid API key for email services' }),
  SENDGRID_FROM_EMAIL: email({ default: 'test@example.com', desc: 'SendGrid from email address' }),
  SENDGRID_FROM_NAME: str({ default: 'HASIVU Platform' }),
  // Firebase
  FIREBASE_PROJECT_ID: str({ default: 'test-firebase-project', desc: 'Firebase project ID' }),
  FIREBASE_PRIVATE_KEY: str({ default: 'test-firebase-private-key', desc: 'Firebase private key' }),
  FIREBASE_CLIENT_EMAIL: email({ default: 'test@firebase.com', desc: 'Firebase client email' }),
  FIREBASE_DATABASE_URL: url({ default: 'https://test-project.firebaseio.com', desc: 'Firebase database URL' }),
  // Monitoring
  ENABLE_METRICS: bool({ default: true }),
  METRICS_PORT: num({ default: 9090 }),
  LOG_LEVEL: str({ choices: ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'], default: 'info' }),
  LOG_FILE: str({ default: './logs/app.log' }),
  ENABLE_CLOUDWATCH: bool({ default: false }),
  ENABLE_SENTRY: bool({ default: false }),
  SENTRY_DSN: str({ default: '' }),
  // Feature flags
  ENABLE_WEBSOCKET: bool({ default: true }),
  ENABLE_FILE_UPLOAD: bool({ default: true }),
  ENABLE_NOTIFICATIONS: bool({ default: true }),
  ENABLE_ANALYTICS: bool({ default: true }),
  ENABLE_RFID: bool({ default: true }),
  ENABLE_TESTING: bool({ default: false }),
  // Development
  ENABLE_HOT_RELOAD: bool({ default: false }),
  ENABLE_DEBUG: bool({ default: false }),
  ENABLE_PROFILING: bool({ default: false }),
  ENABLE_SQL_LOGGING: bool({ default: false })
});

/**
 * Parsed and validated configuration object with security enhancements
 */
export const config: Config = {
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
export function validateConfig(): void {
  const errors: string[] = [];
  const warnings: string[] = [];
  // Production security validations
  if (config.server.nodeEnv === 'production') {
    // JWT Security
    if (config.jwt.secret.length < 64) {
      errors.push('JWT secret must be at least 64 characters for production');
    }
    if (config.jwt.secret.toLowerCase().includes('secret') || 
        config.jwt.secret.toLowerCase().includes('password') ||
        config.jwt.secret.toLowerCase().includes('default')) {
      errors.push('JWT secret appears to contain weak or default values');
    }
    // Session Security
    if (config.security.sessionSecret.length < 32) {
      errors.push('Session secret must be at least 32 characters for production');
    }
    // CORS Security
    if (config.security.corsOrigins.includes('*')) {
      errors.push('Wildcard CORS origins (*) not allowed in production');
    }
    // Monitoring
    if (!config.monitoring.enableMetrics) {
      warnings.push('Monitoring metrics should be enabled in production');
    }
    // Rate Limiting
    if (!config.security.rateLimitEnabled) {
      warnings.push('Rate limiting should be enabled in production');
    }
    // Security Headers
    if (!config.security.securityHeadersEnabled) {
      warnings.push('Security headers should be enabled in production');
    }
    // Encryption
    if (config.security.encryptionKey.length < 32) {
      errors.push('Encryption key must be at least 32 characters for production');
    }
  }
  // General validations
  // Database validations
  if (!config.database.url) {
    errors.push('Database URL is required');
  }
  // Redis validations
  if (!config.redis.url) {
    errors.push('Redis URL is required for session storage');
  }
  // AWS validations
  if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
    errors.push('AWS credentials are required');
  }
  // External service validations (skip for test environment)
  if (config.server.nodeEnv !== 'test') {
    if (config.razorpay.keyId.length < 14 || config.razorpay.keySecret.length < 24) {
      errors.push('Invalid Razorpay credentials format');
    }
    if (config.razorpay.webhookSecret.length < 32) {
      errors.push('Razorpay webhook secret must be at least 32 characters');
    }
  }
  // Encryption validation
  if (config.security.encryptionKey.length < 32) {
    errors.push('Encryption key must be at least 32 characters');
  }
  // bcrypt rounds validation
  if (config.security.bcryptRounds < 10 || config.security.bcryptRounds > 15) {
    errors.push('bcrypt rounds must be between 10 and 15');
  }
  // WhatsApp validations (if enabled and not test environment)
  if (config.features.enableNotifications && config.server.nodeEnv !== 'test') {
    if (config.whatsapp.accessToken.length < 100) {
      errors.push('WhatsApp access token appears to be invalid format');
    }
    if (config.whatsapp.webhookVerifyToken.length < 20) {
      errors.push('WhatsApp webhook verify token must be at least 20 characters');
    }
  }
  // SendGrid validations (skip for test environment)
  if (config.server.nodeEnv !== 'test' && config.sendgrid.apiKey.length < 20) {
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
// Validate configuration on import
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}

export default config;