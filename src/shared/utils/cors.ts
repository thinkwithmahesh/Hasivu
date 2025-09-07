/**
 * HASIVU Platform - CORS Configuration Utilities
 * Production-ready CORS headers and configuration for Lambda functions and Express.js applications
 * Provides secure cross-origin resource sharing with environment-based configuration
 */

/**
 * Standard CORS headers for API responses
 * Configured for production security with proper origin handling
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Will be configured per environment
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key, X-Client-Version',
  'Access-Control-Expose-Headers': 'X-Total-Count, X-Page-Size, X-Current-Page, X-Rate-Limit-Remaining',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours preflight cache
  'Vary': 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers'
};

/**
 * Preflight CORS headers for OPTIONS requests
 * Optimized for performance with appropriate cache duration
 */
export const preflightHeaders = {
  ...corsHeaders,
  'Access-Control-Max-Age': '86400', // 24 hours cache
  'Cache-Control': 'public, max-age=86400',
  'Content-Type': 'application/json',
  'Content-Length': '0'
};

/**
 * CORS configuration for different environments
 */
export interface CorsConfig {
  origins: string[] | string | boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
}

/**
 * Development CORS configuration
 * Allows all origins for local development
 */
export const developmentCorsConfig: CorsConfig = {
  origins: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key',
    'X-Client-Version',
    'X-Device-ID',
    'X-Session-ID'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Size',
    'X-Current-Page',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
    'X-Request-ID'
  ],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * Production CORS configuration
 * Restricted to specific origins for security
 */
export const productionCorsConfig: CorsConfig = {
  origins: [
    'https://hasivu.com',
    'https://www.hasivu.com',
    'https://app.hasivu.com',
    'https://admin.hasivu.com',
    'https://api.hasivu.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key',
    'X-Client-Version'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Size',
    'X-Current-Page',
    'X-Rate-Limit-Remaining'
  ],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * Staging CORS configuration
 * Allows staging domains and some development flexibility
 */
export const stagingCorsConfig: CorsConfig = {
  origins: [
    'https://staging.hasivu.com',
    'https://dev.hasivu.com',
    'https://test.hasivu.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key',
    'X-Client-Version',
    'X-Debug-Mode'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Size',
    'X-Current-Page',
    'X-Rate-Limit-Remaining',
    'X-Debug-Info'
  ],
  credentials: true,
  maxAge: 3600, // 1 hour for faster development iteration
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * Get CORS configuration based on environment
 * @param environment The deployment environment
 * @returns Appropriate CORS configuration
 */
export function getCorsConfig(environment: string = 'development'): CorsConfig {
  switch (environment.toLowerCase()) {
    case 'production':
    case 'prod':
      return productionCorsConfig;
    case 'staging':
    case 'stage':
      return stagingCorsConfig;
    case 'development':
    case 'dev':
    case 'local':
    default:
      return developmentCorsConfig;
  }
}

/**
 * Generate CORS headers for Lambda response
 * @param origin The request origin
 * @param config CORS configuration
 * @returns CORS headers object
 */
export function generateCorsHeaders(
  origin?: string,
  config: CorsConfig = developmentCorsConfig
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Handle origin
  if (config.origins === true) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
  } else if (typeof config.origins === 'string') {
    headers['Access-Control-Allow-Origin'] = config.origins;
  } else if (Array.isArray(config.origins)) {
    if (origin && config.origins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    } else if (config.origins.length === 1) {
      headers['Access-Control-Allow-Origin'] = config.origins[0];
    }
  }

  // Add other headers
  headers['Access-Control-Allow-Methods'] = config.methods.join(', ');
  headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');
  headers['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ');
  headers['Access-Control-Allow-Credentials'] = config.credentials.toString();
  headers['Access-Control-Max-Age'] = config.maxAge.toString();
  headers['Vary'] = 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers';

  return headers;
}

/**
 * Validate origin against allowed origins
 * @param origin The request origin
 * @param allowedOrigins Allowed origins configuration
 * @returns Whether the origin is allowed
 */
export function validateOrigin(
  origin: string | undefined,
  allowedOrigins: string[] | string | boolean
): boolean {
  if (!origin) {
    return false;
  }

  if (allowedOrigins === true) {
    return true;
  }

  if (typeof allowedOrigins === 'string') {
    return origin === allowedOrigins;
  }

  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.includes(origin);
  }

  return false;
}

/**
 * Lambda-compatible CORS middleware function
 * @param event AWS Lambda event object
 * @param config CORS configuration
 * @returns CORS headers for the response
 */
export function handleCorsForLambda(
  event: any,
  config?: CorsConfig
): Record<string, string> {
  const environment = process.env.NODE_ENV || 'development';
  const corsConfig = config || getCorsConfig(environment);
  const origin = event.headers?.origin || event.headers?.Origin;

  // For OPTIONS requests, return preflight headers
  if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
    return {
      ...generateCorsHeaders(origin, corsConfig),
      'Content-Type': 'application/json',
      'Content-Length': '0'
    };
  }

  return generateCorsHeaders(origin, corsConfig);
}

/**
 * Express.js CORS middleware
 * @param config CORS configuration
 * @returns Express middleware function
 */
export function createCorsMiddleware(config?: CorsConfig) {
  const environment = process.env.NODE_ENV || 'development';
  const corsConfig = config || getCorsConfig(environment);

  return (req: any, res: any, next: any) => {
    const origin = req.headers.origin;

    // Validate origin
    if (!validateOrigin(origin, corsConfig.origins)) {
      if (corsConfig.origins !== true) {
        return res.status(403).json({
          error: 'CORS policy violation',
          message: 'Origin not allowed',
          code: 'CORS_ORIGIN_NOT_ALLOWED'
        });
      }
    }

    // Generate and set headers
    const headers = generateCorsHeaders(origin, corsConfig);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.setHeader('Content-Length', '0');
      return res.status(corsConfig.optionsSuccessStatus).end();
    }

    next();
  };
}

/**
 * Security-focused CORS configuration for sensitive operations
 * Minimal permissions with strict origin validation
 */
export const secureCorsConfig: CorsConfig = {
  origins: [], // Must be explicitly configured
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: [],
  credentials: false,
  maxAge: 300, // 5 minutes only
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * API-specific CORS configuration
 * Optimized for REST API usage with common headers
 */
export const apiCorsConfig: CorsConfig = {
  origins: false, // Must be explicitly set
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Client-Version',
    'X-Request-ID'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],
  credentials: false,
  maxAge: 3600,
  preflightContinue: false,
  optionsSuccessStatus: 200
};

/**
 * WebSocket CORS configuration
 * Specific settings for WebSocket upgrades
 */
export const websocketCorsConfig: CorsConfig = {
  origins: false, // Must be explicitly configured
  methods: ['GET'], // WebSocket only uses GET for upgrade
  allowedHeaders: [
    'Origin',
    'Sec-WebSocket-Key',
    'Sec-WebSocket-Version',
    'Sec-WebSocket-Protocol',
    'Sec-WebSocket-Extensions'
  ],
  exposedHeaders: [],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 101 // Switching Protocols
};

/**
 * Create environment-specific CORS headers
 * @param environment Target environment
 * @param customOrigins Optional custom origins to add
 * @returns Environment-specific CORS headers
 */
export function createEnvironmentCorsHeaders(
  environment: string = 'development',
  customOrigins?: string[]
): Record<string, string> {
  const config = getCorsConfig(environment);
  
  if (customOrigins && Array.isArray(config.origins)) {
    config.origins = [...config.origins, ...customOrigins];
  }

  return generateCorsHeaders(undefined, config);
}

/**
 * CORS error handler
 * Provides detailed error information for CORS-related issues
 */
export class CorsError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly origin?: string;

  constructor(message: string, code: string = 'CORS_ERROR', statusCode: number = 403, origin?: string) {
    super(message);
    this.name = 'CorsError';
    this.code = code;
    this.statusCode = statusCode;
    this.origin = origin;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, CorsError.prototype);
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      origin: this.origin,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Validate CORS request and throw appropriate errors
 * @param origin Request origin
 * @param method Request method
 * @param headers Request headers
 * @param config CORS configuration
 * @throws CorsError if validation fails
 */
export function validateCorsRequest(
  origin: string | undefined,
  method: string,
  headers: Record<string, string> = {},
  config: CorsConfig = developmentCorsConfig
): void {
  // Validate origin
  if (!validateOrigin(origin, config.origins)) {
    throw new CorsError(
      `Origin '${origin}' is not allowed by CORS policy`,
      'CORS_ORIGIN_NOT_ALLOWED',
      403,
      origin
    );
  }

  // Validate method
  if (!config.methods.includes(method.toUpperCase())) {
    throw new CorsError(
      `Method '${method}' is not allowed by CORS policy`,
      'CORS_METHOD_NOT_ALLOWED',
      405,
      origin
    );
  }

  // Validate headers for preflight requests
  const requestedHeaders = headers['access-control-request-headers'];
  if (requestedHeaders && method === 'OPTIONS') {
    const headerList = requestedHeaders.split(',').map(h => h.trim().toLowerCase());
    const allowedHeaders = config.allowedHeaders.map(h => h.toLowerCase());
    
    for (const header of headerList) {
      if (!allowedHeaders.includes(header)) {
        throw new CorsError(
          `Header '${header}' is not allowed by CORS policy`,
          'CORS_HEADER_NOT_ALLOWED',
          403,
          origin
        );
      }
    }
  }
}

/**
 * Default export with common utilities
 */
export default {
  corsHeaders,
  preflightHeaders,
  getCorsConfig,
  generateCorsHeaders,
  validateOrigin,
  handleCorsForLambda,
  createCorsMiddleware,
  createEnvironmentCorsHeaders,
  validateCorsRequest,
  CorsError,
  configs: {
    development: developmentCorsConfig,
    staging: stagingCorsConfig,
    production: productionCorsConfig,
    secure: secureCorsConfig,
    api: apiCorsConfig,
    websocket: websocketCorsConfig
  }
};