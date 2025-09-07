"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.burstProtection = exports.ipWhitelistCheck = exports.detectSuspiciousActivity = exports.dynamicRateLimit = exports.suspiciousActivityRateLimit = exports.adminRateLimit = exports.uploadRateLimit = exports.registrationRateLimit = exports.rfidRateLimit = exports.paymentRateLimit = exports.passwordResetRateLimit = exports.authRateLimit = exports.generalRateLimit = void 0;
/**
 * HASIVU Platform - Enhanced Rate Limiting Middleware
 * Comprehensive rate limiting with different rules for different endpoint types
 * Enhanced with security logging and threat detection
 */
const express_rate_limit_1 = require("express-rate-limit");
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
/**
 * Enhanced rate limiter factory with security logging
 */
const createRateLimiter = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15 minutes default
        max: 100, // Default limit
        message: 'Too many requests from this IP, please try again later',
        statusCode: 429,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => req.ip || 'unknown',
        handler: (req, res) => {
            // Log rate limit hit
            logger_1.logger.warn('Rate limit exceeded', {
                ip: req.ip,
                path: req.path,
                method: req.method,
                userAgent: req.get('User-Agent'),
                body: req.body?.email ? { email: req.body.email } : undefined,
                headers: {
                    'x-forwarded-for': req.get('x-forwarded-for'),
                    'x-real-ip': req.get('x-real-ip')
                },
                timestamp: new Date().toISOString()
            });
            // Call custom handler if provided
            if (options.onLimitReached) {
                options.onLimitReached(req, res);
            }
            // Send rate limit response
            res.status(options.statusCode || 429).json({
                error: 'Rate limit exceeded',
                message: options.message || 'Too many requests',
                retryAfter: Math.ceil(options.windowMs ? options.windowMs / 1000 : 900)
            });
        },
        ...options
    };
    // Note: Redis store not configured - using default in-memory store
    return (0, express_rate_limit_1.default)(defaultOptions);
};
/**
 * General API rate limiter
 */
exports.generalRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: 'Too many API requests, please slow down'
});
/**
 * Authentication endpoints rate limiter (stricter)
 */
exports.authRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts per window
    message: 'Too many authentication attempts, please try again later',
    onLimitReached: (req, res) => {
        logger_1.logger.warn('Authentication rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            body: req.body?.email ? { email: req.body.email } : undefined,
            headers: {
                'user-agent': req.get('User-Agent'),
                'x-forwarded-for': req.get('x-forwarded-for')
            }
        });
    }
});
/**
 * Password reset rate limiter (very strict)
 */
exports.passwordResetRateLimit = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: 'Too many password reset attempts, please try again later'
});
/**
 * Payment endpoints rate limiter
 */
exports.paymentRateLimit = createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // 20 payment requests per window
    message: 'Too many payment requests, please wait before trying again'
});
/**
 * RFID verification rate limiter
 */
exports.rfidRateLimit = createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // 50 RFID scans per minute
    message: 'RFID scanning rate limit exceeded'
});
/**
 * Registration rate limiter
 */
exports.registrationRateLimit = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registrations per hour per IP
    message: 'Too many registration attempts, please try again later'
});
/**
 * File upload rate limiter
 */
exports.uploadRateLimit = createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30, // 30 file uploads per window
    message: 'Too many file uploads, please wait before uploading more files'
});
/**
 * Admin endpoints rate limiter (more lenient for authenticated admins)
 */
exports.adminRateLimit = createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 500, // 500 requests per window for admins
    message: 'Admin rate limit exceeded'
});
/**
 * Suspicious activity rate limiter (very strict)
 */
exports.suspiciousActivityRateLimit = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1, // Only 1 request per hour for suspicious IPs
    message: 'IP flagged for suspicious activity'
});
/**
 * Dynamic rate limiter based on user role and endpoint
 */
const dynamicRateLimit = (req, res, next) => {
    try {
        const user = req.user;
        const isAuthenticated = !!user;
        const userRole = user?.role || 'guest';
        const path = req.path;
        // Admin users get higher limits
        if (userRole === 'admin' || userRole === 'super_admin') {
            return (0, exports.adminRateLimit)(req, res, next);
        }
        // Authentication endpoints
        if (path.includes('/auth/')) {
            return (0, exports.authRateLimit)(req, res, next);
        }
        // Payment endpoints
        if (path.includes('/payment/') || path.includes('/billing/')) {
            return (0, exports.paymentRateLimit)(req, res, next);
        }
        // RFID endpoints
        if (path.includes('/rfid/') || path.includes('/scan/')) {
            return (0, exports.rfidRateLimit)(req, res, next);
        }
        // File upload endpoints
        if (path.includes('/upload/') || req.method === 'POST' && path.includes('/files/')) {
            return (0, exports.uploadRateLimit)(req, res, next);
        }
        // Registration endpoints
        if (path.includes('/register/') || path.includes('/signup/')) {
            return (0, exports.registrationRateLimit)(req, res, next);
        }
        // Default to general rate limiting
        return (0, exports.generalRateLimit)(req, res, next);
    }
    catch (error) {
        logger_1.logger.error('Dynamic rate limiter error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            path: req.path,
            method: req.method,
            ip: req.ip
        });
        // Fallback to general rate limiting
        return (0, exports.generalRateLimit)(req, res, next);
    }
};
exports.dynamicRateLimit = dynamicRateLimit;
/**
 * IP-based suspicious activity detector
 */
const detectSuspiciousActivity = async (req, res, next) => {
    try {
        const ip = req.ip || 'unknown';
        const userAgent = req.get('User-Agent') || '';
        const path = req.path;
        const method = req.method;
        // Suspicious patterns to detect
        const suspiciousPatterns = [
            /bot|crawler|spider/i.test(userAgent),
            /sqlmap|nmap|nikto|dirb|dirbuster/i.test(userAgent),
            path.includes('../') || path.includes('..\\'),
            path.includes('/admin') && !req.headers.authorization,
            method === 'OPTIONS' && !req.headers.origin,
            path.includes('.env') || path.includes('.git'),
            path.includes('/wp-admin') || path.includes('/wp-login'),
            userAgent.length < 10 || userAgent.length > 500
        ];
        const suspiciousScore = suspiciousPatterns.filter(Boolean).length;
        if (suspiciousScore >= 2) {
            logger_1.logger.warn('Suspicious activity detected', {
                ip,
                userAgent,
                path,
                method,
                suspiciousScore,
                suspiciousPatterns: suspiciousPatterns.map((p, i) => ({ index: i, matched: p }))
            });
            // Apply very strict rate limiting
            return (0, exports.suspiciousActivityRateLimit)(req, res, next);
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Suspicious activity detector error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
            path: req.path
        });
        next();
    }
};
exports.detectSuspiciousActivity = detectSuspiciousActivity;
/**
 * Middleware to check if IP is in whitelist
 */
const ipWhitelistCheck = (req, res, next) => {
    const clientIp = req.ip;
    const whitelist = environment_1.config.security?.ipWhitelist || [];
    if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
        logger_1.logger.warn('IP not in whitelist', {
            ip: clientIp,
            path: req.path,
            method: req.method
        });
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Your IP address is not authorized to access this resource'
        });
    }
    next();
};
exports.ipWhitelistCheck = ipWhitelistCheck;
/**
 * Burst protection middleware for high-frequency endpoints
 */
exports.burstProtection = createRateLimiter({
    windowMs: 1000, // 1 second window
    max: 10, // 10 requests per second
    message: 'Request burst limit exceeded, please slow down'
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
    burst: exports.burstProtection
};
