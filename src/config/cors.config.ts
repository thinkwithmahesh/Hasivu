/**
 * HASIVU Platform - CORS Configuration
 * Implements secure cross-origin resource sharing
 */
import { CorsOptions } from 'cors';
import { env } from './environment';
import { logger } from '../shared/logger.service';

/**
 * Allowed origins for CORS
 * Production: Only specific domains
 * Development: Local development URLs
 */
const getAllowedOrigins = (): string[] => {
  const origins = [
    process.env.FRONTEND_URL || 'https://hasivu.com',
    'https://www.hasivu.com',
    'https://app.hasivu.com',
    'https://admin.hasivu.com',
  ];

  // Add development origins
  if (env.isDevelopment() || env.isTest()) {
    origins.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    );
  }

  // Add staging origins
  if (env.get('NODE_ENV') === 'staging') {
    origins.push('https://staging.hasivu.com', 'https://staging-admin.hasivu.com');
  }

  // Remove duplicates
  return [...new Set(origins)];
};

/**
 * CORS origin validator
 */
const validateOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  const allowedOrigins = getAllowedOrigins();

  // Allow requests with no origin (mobile apps, Postman, etc.)
  if (!origin) {
    logger.debug('CORS: No origin header, allowing request');
    return callback(null, true);
  }

  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    logger.debug('CORS: Origin allowed', { origin });
    return callback(null, true);
  }

  // Log blocked origin
  logger.warn('CORS: Origin blocked', {
    origin,
    allowedOrigins: allowedOrigins.join(', '),
    timestamp: new Date().toISOString(),
  });

  callback(new Error(`Origin ${origin} not allowed by CORS policy`));
};

/**
 * Main CORS configuration
 */
export const corsOptions: CorsOptions = {
  origin: validateOrigin,
  credentials: true, // Allow cookies and authentication headers
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'X-API-Key',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-Response-Time',
    'X-API-Version',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours - how long browser should cache preflight
  preflightContinue: false,
};

/**
 * Strict CORS configuration for payment endpoints
 * Only allow specific trusted origins
 */
export const paymentCorsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const paymentOrigins = [
      process.env.FRONTEND_URL || 'https://hasivu.com',
      'https://app.hasivu.com',
    ];

    if (env.isDevelopment()) {
      paymentOrigins.push('http://localhost:3000');
    }

    if (!origin || paymentOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('Payment CORS: Origin blocked', { origin });
      callback(new Error('Payment operations not allowed from this origin'));
    }
  },
  credentials: true,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  maxAge: 3600, // 1 hour
};

/**
 * Strict CORS configuration for admin endpoints
 * Only allow admin dashboard origins
 */
export const adminCorsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const adminOrigins = ['https://admin.hasivu.com', 'https://app.hasivu.com'];

    if (env.isDevelopment()) {
      adminOrigins.push('http://localhost:3000', 'http://localhost:3001');
    }

    if (env.get('NODE_ENV') === 'staging') {
      adminOrigins.push('https://staging-admin.hasivu.com');
    }

    if (!origin || adminOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('Admin CORS: Origin blocked', { origin });
      callback(new Error('Admin operations not allowed from this origin'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Admin-Token'],
  maxAge: 3600,
};

/**
 * Public CORS configuration for public APIs
 * More permissive for public endpoints
 */
export const publicCorsOptions: CorsOptions = {
  origin: '*', // Allow all origins for public APIs
  credentials: false, // No credentials for public APIs
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'X-Request-ID'],
  maxAge: 86400,
};

/**
 * WebSocket CORS configuration
 */
export const websocketCorsOptions: CorsOptions = {
  origin: validateOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
};

/**
 * Development-only permissive CORS
 * WARNING: Never use in production
 */
export const devCorsOptions: CorsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: '*',
  exposedHeaders: '*',
  maxAge: 86400,
};

/**
 * Get CORS configuration based on environment
 */
export const getCorsConfig = (): CorsOptions => {
  if (env.isDevelopment()) {
    logger.info('Using development CORS configuration (permissive)');
    return devCorsOptions;
  }

  if (env.isTest()) {
    return {
      origin: true,
      credentials: true,
    };
  }

  logger.info('Using production CORS configuration (strict)');
  return corsOptions;
};

export default {
  corsOptions,
  paymentCorsOptions,
  adminCorsOptions,
  publicCorsOptions,
  websocketCorsOptions,
  devCorsOptions,
  getCorsConfig,
};
