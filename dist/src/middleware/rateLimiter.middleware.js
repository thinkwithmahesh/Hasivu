"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.burstProtection = exports.ipWhitelistCheck = exports.detectSuspiciousActivity = exports.dynamicRateLimit = exports.suspiciousActivityRateLimit = exports.adminRateLimit = exports.uploadRateLimit = exports.registrationRateLimit = exports.rfidRateLimit = exports.paymentRateLimit = exports.passwordResetRateLimit = exports.authRateLimit = exports.generalRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const environment_1 = require("../config/environment");
const logger_service_1 = require("../shared/logger.service");
const createRateLimiter = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later',
        statusCode: 429,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => req.ip || 'unknown',
        handler: (req, res) => {
            logger_service_1.logger.warn('Rate limit exceeded', {
                ip: req.ip,
                path: req.path,
                method: req.method,
                userAgent: req.get('User-Agent'),
                body: req.body?.email ? { email: req.body.email } : undefined,
                headers: {
                    'x-forwarded-for': req.get('x-forwarded-for'),
                    'x-real-ip': req.get('x-real-ip'),
                },
                timestamp: new Date().toISOString(),
            });
            if (options.onLimitReached) {
                options.onLimitReached(req, res);
            }
            res.status(options.statusCode || 429).json({
                error: 'Rate limit exceeded',
                message: options.message || 'Too many requests',
                retryAfter: Math.ceil(options.windowMs ? options.windowMs / 1000 : 900),
            });
        },
        ...options,
    };
    return (0, express_rate_limit_1.default)(defaultOptions);
};
exports.generalRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Too many API requests, please slow down',
});
exports.authRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts, please try again later',
    onLimitReached: (req, res) => {
        logger_service_1.logger.warn('Authentication rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            body: req.body?.email ? { email: req.body.email } : undefined,
            headers: {
                'user-agent': req.get('User-Agent'),
                'x-forwarded-for': req.get('x-forwarded-for'),
            },
        });
    },
});
exports.passwordResetRateLimit = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Too many password reset attempts, please try again later',
});
exports.paymentRateLimit = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: 'Too many payment requests, please wait before trying again',
});
exports.rfidRateLimit = createRateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 50,
    message: 'RFID scanning rate limit exceeded',
});
exports.registrationRateLimit = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many registration attempts, please try again later',
});
exports.uploadRateLimit = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 30,
    message: 'Too many file uploads, please wait before uploading more files',
});
exports.adminRateLimit = createRateLimiter({
    windowMs: 5 * 60 * 1000,
    max: 500,
    message: 'Admin rate limit exceeded',
});
exports.suspiciousActivityRateLimit = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 1,
    message: 'IP flagged for suspicious activity',
});
const dynamicRateLimit = (req, res, next) => {
    try {
        const { user } = req;
        const isAuthenticated = !!user;
        const userRole = user?.role || 'guest';
        const { path } = req;
        if (userRole === 'admin' || userRole === 'super_admin') {
            return (0, exports.adminRateLimit)(req, res, next);
        }
        if (path.includes('/auth/')) {
            return (0, exports.authRateLimit)(req, res, next);
        }
        if (path.includes('/payment/') || path.includes('/billing/')) {
            return (0, exports.paymentRateLimit)(req, res, next);
        }
        if (path.includes('/rfid/') || path.includes('/scan/')) {
            return (0, exports.rfidRateLimit)(req, res, next);
        }
        if (path.includes('/upload/') || (req.method === 'POST' && path.includes('/files/'))) {
            return (0, exports.uploadRateLimit)(req, res, next);
        }
        if (path.includes('/register/') || path.includes('/signup/')) {
            return (0, exports.registrationRateLimit)(req, res, next);
        }
        return (0, exports.generalRateLimit)(req, res, next);
    }
    catch (error) {
        logger_service_1.logger.error('Dynamic rate limiter error', error instanceof Error ? error : new Error(String(error)), {
            path: req.path,
            method: req.method,
            ip: req.ip,
        });
        return (0, exports.generalRateLimit)(req, res, next);
    }
};
exports.dynamicRateLimit = dynamicRateLimit;
const detectSuspiciousActivity = async (req, res, next) => {
    try {
        const ip = req.ip || 'unknown';
        const userAgent = req.get('User-Agent') || '';
        const { path } = req;
        const { method } = req;
        const suspiciousPatterns = [
            /bot|crawler|spider/i.test(userAgent),
            /sqlmap|nmap|nikto|dirb|dirbuster/i.test(userAgent),
            path.includes('../') || path.includes('..\\'),
            path.includes('/admin') && !req.headers.authorization,
            method === 'OPTIONS' && !req.headers.origin,
            path.includes('.env') || path.includes('.git'),
            path.includes('/wp-admin') || path.includes('/wp-login'),
            userAgent.length < 10 || userAgent.length > 500,
        ];
        const suspiciousScore = suspiciousPatterns.filter(Boolean).length;
        if (suspiciousScore >= 2) {
            logger_service_1.logger.warn('Suspicious activity detected', {
                ip,
                userAgent,
                path,
                method,
                suspiciousScore,
                suspiciousPatterns: suspiciousPatterns.map((p, i) => ({ index: i, matched: p })),
            });
            return (0, exports.suspiciousActivityRateLimit)(req, res, next);
        }
        next();
    }
    catch (error) {
        logger_service_1.logger.error('Suspicious activity detector error', error instanceof Error ? error : new Error(String(error)), {
            ip: req.ip,
            path: req.path,
        });
        next();
    }
};
exports.detectSuspiciousActivity = detectSuspiciousActivity;
const ipWhitelistCheck = (req, res, next) => {
    const clientIp = req.ip;
    const whitelist = environment_1.config.security?.ipWhitelist || [];
    if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
        logger_service_1.logger.warn('IP not in whitelist', {
            ip: clientIp,
            path: req.path,
            method: req.method,
        });
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Your IP address is not authorized to access this resource',
        });
    }
    next();
};
exports.ipWhitelistCheck = ipWhitelistCheck;
exports.burstProtection = createRateLimiter({
    windowMs: 1000,
    max: 10,
    message: 'Request burst limit exceeded, please slow down',
});
exports.default = {
    general: exports.generalRateLimit,
    auth: exports.authRateLimit,
    passwordReset: exports.passwordResetRateLimit,
    payment: exports.paymentRateLimit,
    rfid: exports.rfidRateLimit,
    registration: exports.registrationRateLimit,
    upload: exports.uploadRateLimit,
    admin: exports.adminRateLimit,
    suspicious: exports.suspiciousActivityRateLimit,
    dynamic: exports.dynamicRateLimit,
    detectSuspicious: exports.detectSuspiciousActivity,
    ipWhitelist: exports.ipWhitelistCheck,
    burst: exports.burstProtection,
};
//# sourceMappingURL=rateLimiter.middleware.js.map