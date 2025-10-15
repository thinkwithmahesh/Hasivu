"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCorsConfig = exports.devCorsOptions = exports.websocketCorsOptions = exports.publicCorsOptions = exports.adminCorsOptions = exports.paymentCorsOptions = exports.corsOptions = void 0;
const environment_1 = require("./environment");
const logger_service_1 = require("../shared/logger.service");
const getAllowedOrigins = () => {
    const origins = [
        process.env.FRONTEND_URL || 'https://hasivu.com',
        'https://www.hasivu.com',
        'https://app.hasivu.com',
        'https://admin.hasivu.com',
    ];
    if (environment_1.env.isDevelopment() || environment_1.env.isTest()) {
        origins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001');
    }
    if (environment_1.env.get('NODE_ENV') === 'staging') {
        origins.push('https://staging.hasivu.com', 'https://staging-admin.hasivu.com');
    }
    return [...new Set(origins)];
};
const validateOrigin = (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    if (!origin) {
        logger_service_1.logger.debug('CORS: No origin header, allowing request');
        return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
        logger_service_1.logger.debug('CORS: Origin allowed', { origin });
        return callback(null, true);
    }
    logger_service_1.logger.warn('CORS: Origin blocked', {
        origin,
        allowedOrigins: allowedOrigins.join(', '),
        timestamp: new Date().toISOString(),
    });
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
};
exports.corsOptions = {
    origin: validateOrigin,
    credentials: true,
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
    maxAge: 86400,
    preflightContinue: false,
};
exports.paymentCorsOptions = {
    origin: (origin, callback) => {
        const paymentOrigins = [
            process.env.FRONTEND_URL || 'https://hasivu.com',
            'https://app.hasivu.com',
        ];
        if (environment_1.env.isDevelopment()) {
            paymentOrigins.push('http://localhost:3000');
        }
        if (!origin || paymentOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            logger_service_1.logger.warn('Payment CORS: Origin blocked', { origin });
            callback(new Error('Payment operations not allowed from this origin'));
        }
    },
    credentials: true,
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    maxAge: 3600,
};
exports.adminCorsOptions = {
    origin: (origin, callback) => {
        const adminOrigins = ['https://admin.hasivu.com', 'https://app.hasivu.com'];
        if (environment_1.env.isDevelopment()) {
            adminOrigins.push('http://localhost:3000', 'http://localhost:3001');
        }
        if (environment_1.env.get('NODE_ENV') === 'staging') {
            adminOrigins.push('https://staging-admin.hasivu.com');
        }
        if (!origin || adminOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            logger_service_1.logger.warn('Admin CORS: Origin blocked', { origin });
            callback(new Error('Admin operations not allowed from this origin'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Admin-Token'],
    maxAge: 3600,
};
exports.publicCorsOptions = {
    origin: '*',
    credentials: false,
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'X-Request-ID'],
    maxAge: 86400,
};
exports.websocketCorsOptions = {
    origin: validateOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
};
exports.devCorsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: '*',
    exposedHeaders: '*',
    maxAge: 86400,
};
const getCorsConfig = () => {
    if (environment_1.env.isDevelopment()) {
        logger_service_1.logger.info('Using development CORS configuration (permissive)');
        return exports.devCorsOptions;
    }
    if (environment_1.env.isTest()) {
        return {
            origin: true,
            credentials: true,
        };
    }
    logger_service_1.logger.info('Using production CORS configuration (strict)');
    return exports.corsOptions;
};
exports.getCorsConfig = getCorsConfig;
exports.default = {
    corsOptions: exports.corsOptions,
    paymentCorsOptions: exports.paymentCorsOptions,
    adminCorsOptions: exports.adminCorsOptions,
    publicCorsOptions: exports.publicCorsOptions,
    websocketCorsOptions: exports.websocketCorsOptions,
    devCorsOptions: exports.devCorsOptions,
    getCorsConfig: exports.getCorsConfig,
};
//# sourceMappingURL=cors.config.js.map