"use strict";
/**
 * HASIVU Platform - CORS Configuration Utilities
 * Production-ready CORS headers and configuration for Lambda functions and Express.js applications
 * Provides secure cross-origin resource sharing with environment-based configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCorsRequest = exports.CorsError = exports.createEnvironmentCorsHeaders = exports.websocketCorsConfig = exports.apiCorsConfig = exports.secureCorsConfig = exports.createCorsMiddleware = exports.handleCorsForLambda = exports.validateOrigin = exports.generateCorsHeaders = exports.getCorsConfig = exports.stagingCorsConfig = exports.productionCorsConfig = exports.developmentCorsConfig = exports.preflightHeaders = exports.corsHeaders = void 0;
/**
 * Standard CORS headers for API responses
 * Configured for production security with proper origin handling
 */
exports.corsHeaders = {
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
exports.preflightHeaders = {
    ...exports.corsHeaders,
    'Access-Control-Max-Age': '86400', // 24 hours cache
    'Cache-Control': 'public, max-age=86400',
    'Content-Type': 'application/json',
    'Content-Length': '0'
};
/**
 * Development CORS configuration
 * Allows all origins for local development
 */
exports.developmentCorsConfig = {
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
exports.productionCorsConfig = {
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
exports.stagingCorsConfig = {
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
function getCorsConfig(environment = 'development') {
    switch (environment.toLowerCase()) {
        case 'production':
        case 'prod':
            return exports.productionCorsConfig;
        case 'staging':
        case 'stage':
            return exports.stagingCorsConfig;
        case 'development':
        case 'dev':
        case 'local':
        default:
            return exports.developmentCorsConfig;
    }
}
exports.getCorsConfig = getCorsConfig;
/**
 * Generate CORS headers for Lambda response
 * @param origin The request origin
 * @param config CORS configuration
 * @returns CORS headers object
 */
function generateCorsHeaders(origin, config = exports.developmentCorsConfig) {
    const headers = {};
    // Handle origin
    if (config.origins === true) {
        headers['Access-Control-Allow-Origin'] = origin || '*';
    }
    else if (typeof config.origins === 'string') {
        headers['Access-Control-Allow-Origin'] = config.origins;
    }
    else if (Array.isArray(config.origins)) {
        if (origin && config.origins.includes(origin)) {
            headers['Access-Control-Allow-Origin'] = origin;
        }
        else if (config.origins.length === 1) {
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
exports.generateCorsHeaders = generateCorsHeaders;
/**
 * Validate origin against allowed origins
 * @param origin The request origin
 * @param allowedOrigins Allowed origins configuration
 * @returns Whether the origin is allowed
 */
function validateOrigin(origin, allowedOrigins) {
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
exports.validateOrigin = validateOrigin;
/**
 * Lambda-compatible CORS middleware function
 * @param event AWS Lambda event object
 * @param config CORS configuration
 * @returns CORS headers for the response
 */
function handleCorsForLambda(event, config) {
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
exports.handleCorsForLambda = handleCorsForLambda;
/**
 * Express.js CORS middleware
 * @param config CORS configuration
 * @returns Express middleware function
 */
function createCorsMiddleware(config) {
    const environment = process.env.NODE_ENV || 'development';
    const corsConfig = config || getCorsConfig(environment);
    return (req, res, next) => {
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
exports.createCorsMiddleware = createCorsMiddleware;
/**
 * Security-focused CORS configuration for sensitive operations
 * Minimal permissions with strict origin validation
 */
exports.secureCorsConfig = {
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
exports.apiCorsConfig = {
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
exports.websocketCorsConfig = {
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
function createEnvironmentCorsHeaders(environment = 'development', customOrigins) {
    const config = getCorsConfig(environment);
    if (customOrigins && Array.isArray(config.origins)) {
        config.origins = [...config.origins, ...customOrigins];
    }
    return generateCorsHeaders(undefined, config);
}
exports.createEnvironmentCorsHeaders = createEnvironmentCorsHeaders;
/**
 * CORS error handler
 * Provides detailed error information for CORS-related issues
 */
class CorsError extends Error {
    code;
    statusCode;
    origin;
    constructor(message, code = 'CORS_ERROR', statusCode = 403, origin) {
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
exports.CorsError = CorsError;
/**
 * Validate CORS request and throw appropriate errors
 * @param origin Request origin
 * @param method Request method
 * @param headers Request headers
 * @param config CORS configuration
 * @throws CorsError if validation fails
 */
function validateCorsRequest(origin, method, headers = {}, config = exports.developmentCorsConfig) {
    // Validate origin
    if (!validateOrigin(origin, config.origins)) {
        throw new CorsError(`Origin '${origin}' is not allowed by CORS policy`, 'CORS_ORIGIN_NOT_ALLOWED', 403, origin);
    }
    // Validate method
    if (!config.methods.includes(method.toUpperCase())) {
        throw new CorsError(`Method '${method}' is not allowed by CORS policy`, 'CORS_METHOD_NOT_ALLOWED', 405, origin);
    }
    // Validate headers for preflight requests
    const requestedHeaders = headers['access-control-request-headers'];
    if (requestedHeaders && method === 'OPTIONS') {
        const headerList = requestedHeaders.split(',').map(h => h.trim().toLowerCase());
        const allowedHeaders = config.allowedHeaders.map(h => h.toLowerCase());
        for (const header of headerList) {
            if (!allowedHeaders.includes(header)) {
                throw new CorsError(`Header '${header}' is not allowed by CORS policy`, 'CORS_HEADER_NOT_ALLOWED', 403, origin);
            }
        }
    }
}
exports.validateCorsRequest = validateCorsRequest;
/**
 * Default export with common utilities
 */
exports.default = {
    corsHeaders: exports.corsHeaders,
    preflightHeaders: exports.preflightHeaders,
    getCorsConfig,
    generateCorsHeaders,
    validateOrigin,
    handleCorsForLambda,
    createCorsMiddleware,
    createEnvironmentCorsHeaders,
    validateCorsRequest,
    CorsError,
    configs: {
        development: exports.developmentCorsConfig,
        staging: exports.stagingCorsConfig,
        production: exports.productionCorsConfig,
        secure: exports.secureCorsConfig,
        api: exports.apiCorsConfig,
        websocket: exports.websocketCorsConfig
    }
};
