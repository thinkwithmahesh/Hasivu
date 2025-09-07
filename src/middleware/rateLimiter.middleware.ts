/**
 * HASIVU Platform - Enhanced Rate Limiting Middleware
 * Comprehensive rate limiting with different rules for different endpoint types
 * Enhanced with security logging and threat detection
 */
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { RedisService } from '../services/redis.service';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiter options interface
 */
interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  statusCode?: number;
  onLimitReached?: (req: Request, res: Response) => void;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Enhanced rate limiter factory with security logging
 */
const createRateLimiter = (options: RateLimiterOptions = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes default
    max: 100, // Default limit
    message: 'Too many requests from this IP, please try again later',
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => req.ip || 'unknown',
    handler: (req: Request, res: Response) => {
      // Log rate limit hit
      logger.warn('Rate limit exceeded', {
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

  return rateLimit(defaultOptions);
};

/**
 * General API rate limiter
 */
export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: 'Too many API requests, please slow down'
});

/**
 * Authentication endpoints rate limiter (stricter)
 */
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  message: 'Too many authentication attempts, please try again later',
  onLimitReached: (req: Request, res: Response) => {
    logger.warn('Authentication rate limit exceeded', {
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
export const passwordResetRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: 'Too many password reset attempts, please try again later'
});

/**
 * Payment endpoints rate limiter
 */
export const paymentRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 payment requests per window
  message: 'Too many payment requests, please wait before trying again'
});

/**
 * RFID verification rate limiter
 */
export const rfidRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 RFID scans per minute
  message: 'RFID scanning rate limit exceeded'
});

/**
 * Registration rate limiter
 */
export const registrationRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: 'Too many registration attempts, please try again later'
});

/**
 * File upload rate limiter
 */
export const uploadRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // 30 file uploads per window
  message: 'Too many file uploads, please wait before uploading more files'
});

/**
 * Admin endpoints rate limiter (more lenient for authenticated admins)
 */
export const adminRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 500, // 500 requests per window for admins
  message: 'Admin rate limit exceeded'
});

/**
 * Suspicious activity rate limiter (very strict)
 */
export const suspiciousActivityRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1, // Only 1 request per hour for suspicious IPs
  message: 'IP flagged for suspicious activity'
});

/**
 * Dynamic rate limiter based on user role and endpoint
 */
export const dynamicRateLimit = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const isAuthenticated = !!user;
    const userRole = user?.role || 'guest';
    const path = req.path;

    // Admin users get higher limits
    if (userRole === 'admin' || userRole === 'super_admin') {
      return adminRateLimit(req, res, next);
    }

    // Authentication endpoints
    if (path.includes('/auth/')) {
      return authRateLimit(req, res, next);
    }

    // Payment endpoints
    if (path.includes('/payment/') || path.includes('/billing/')) {
      return paymentRateLimit(req, res, next);
    }

    // RFID endpoints
    if (path.includes('/rfid/') || path.includes('/scan/')) {
      return rfidRateLimit(req, res, next);
    }

    // File upload endpoints
    if (path.includes('/upload/') || req.method === 'POST' && path.includes('/files/')) {
      return uploadRateLimit(req, res, next);
    }

    // Registration endpoints
    if (path.includes('/register/') || path.includes('/signup/')) {
      return registrationRateLimit(req, res, next);
    }

    // Default to general rate limiting
    return generalRateLimit(req, res, next);
  } catch (error) {
    logger.error('Dynamic rate limiter error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    
    // Fallback to general rate limiting
    return generalRateLimit(req, res, next);
  }
};

/**
 * IP-based suspicious activity detector
 */
export const detectSuspiciousActivity = async (req: Request, res: Response, next: NextFunction) => {
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
      logger.warn('Suspicious activity detected', {
        ip,
        userAgent,
        path,
        method,
        suspiciousScore,
        suspiciousPatterns: suspiciousPatterns.map((p, i) => ({ index: i, matched: p }))
      });

      // Apply very strict rate limiting
      return suspiciousActivityRateLimit(req, res, next);
    }

    next();
  } catch (error) {
    logger.error('Suspicious activity detector error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      path: req.path
    });
    next();
  }
};

/**
 * Middleware to check if IP is in whitelist
 */
export const ipWhitelistCheck = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip;
  const whitelist = (config as any).security?.ipWhitelist || [];

  if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
    logger.warn('IP not in whitelist', {
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

/**
 * Burst protection middleware for high-frequency endpoints
 */
export const burstProtection = createRateLimiter({
  windowMs: 1000, // 1 second window
  max: 10, // 10 requests per second
  message: 'Request burst limit exceeded, please slow down'
});

export default {
  general: generalRateLimit,
  auth: authRateLimit,
  passwordReset: passwordResetRateLimit,
  payment: paymentRateLimit,
  rfid: rfidRateLimit,
  registration: registrationRateLimit,
  upload: uploadRateLimit,
  admin: adminRateLimit,
  suspicious: suspiciousActivityRateLimit,
  dynamic: dynamicRateLimit,
  detectSuspicious: detectSuspiciousActivity,
  ipWhitelist: ipWhitelistCheck,
  burst: burstProtection
};