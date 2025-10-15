"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySecurityHeaders = exports.devSecurityHeaders = exports.websocketSecurityHeaders = exports.downloadSecurityHeaders = exports.pciComplianceHeaders = exports.apiSecurityHeaders = exports.securityHeaders = void 0;
const helmet_1 = __importDefault(require("helmet"));
const environment_1 = require("../config/environment");
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://js.razorpay.com',
                'https://checkout.razorpay.com',
                'https://www.google-analytics.com',
                'https://www.googletagmanager.com',
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://fonts.googleapis.com',
            ],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            connectSrc: [
                "'self'",
                'https://api.razorpay.com',
                'https://lumberjack.razorpay.com',
                process.env.AWS_REGION
                    ? `https://*.${process.env.AWS_REGION}.amazonaws.com`
                    : 'https://*.amazonaws.com',
                'wss:',
                'ws:',
            ],
            frameSrc: [
                "'self'",
                'https://api.razorpay.com',
                'https://checkout.razorpay.com',
            ],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", 'https:', 'blob:'],
            manifestSrc: ["'self'"],
            workerSrc: ["'self'", 'blob:'],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            baseUri: ["'self'"],
            upgradeInsecureRequests: [],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    frameguard: {
        action: 'sameorigin',
    },
    noSniff: true,
    dnsPrefetchControl: {
        allow: false,
    },
    ieNoOpen: true,
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
    },
    permittedCrossDomainPolicies: {
        permittedPolicies: 'none',
    },
    hidePoweredBy: true,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: {
        policy: 'same-origin',
    },
    crossOriginResourcePolicy: {
        policy: 'same-origin',
    },
    originAgentCluster: true,
    xssFilter: true,
});
const apiSecurityHeaders = (req, res, next) => {
    res.setHeader('X-API-Version', '1.0');
    res.setHeader('X-Request-ID', req.headers['x-request-id'] || crypto.randomUUID());
    res.setHeader('X-Response-Time', Date.now().toString());
    if (req.path.includes('/auth') || req.path.includes('/payment')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    const originalSend = res.send;
    res.send = function (data) {
        if (res.statusCode >= 400) {
            res.setHeader('Cache-Control', 'no-store');
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.apiSecurityHeaders = apiSecurityHeaders;
const pciComplianceHeaders = (req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none';");
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    if (environment_1.config.server.nodeEnv === 'production') {
    }
    next();
};
exports.pciComplianceHeaders = pciComplianceHeaders;
const downloadSecurityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox;");
    res.setHeader('X-Download-Options', 'noopen');
    next();
};
exports.downloadSecurityHeaders = downloadSecurityHeaders;
const websocketSecurityHeaders = (req, res, next) => {
    res.setHeader('X-WebSocket-Protocol', 'hasivu-v1');
    res.setHeader('Sec-WebSocket-Protocol', 'hasivu-v1');
    next();
};
exports.websocketSecurityHeaders = websocketSecurityHeaders;
exports.devSecurityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: false,
    hsts: false,
});
const applySecurityHeaders = (req, res, next) => {
    if (environment_1.config.server.nodeEnv === 'development') {
        return (0, exports.devSecurityHeaders)(req, res, () => {
            (0, exports.apiSecurityHeaders)(req, res, next);
        });
    }
    return (0, exports.securityHeaders)(req, res, () => {
        (0, exports.apiSecurityHeaders)(req, res, next);
    });
};
exports.applySecurityHeaders = applySecurityHeaders;
exports.default = {
    securityHeaders: exports.securityHeaders,
    apiSecurityHeaders: exports.apiSecurityHeaders,
    pciComplianceHeaders: exports.pciComplianceHeaders,
    downloadSecurityHeaders: exports.downloadSecurityHeaders,
    websocketSecurityHeaders: exports.websocketSecurityHeaders,
    devSecurityHeaders: exports.devSecurityHeaders,
    applySecurityHeaders: exports.applySecurityHeaders,
};
//# sourceMappingURL=security-headers.middleware.js.map