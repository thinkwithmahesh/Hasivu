/**
 * HASIVU Platform - Security Headers Middleware
 * Implements comprehensive security headers using Helmet
 */
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';

/**
 * Security headers configuration
 * Implements OWASP security best practices
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for some inline scripts (consider nonce-based approach)
        'https://js.razorpay.com', // Payment gateway
        'https://checkout.razorpay.com',
        'https://www.google-analytics.com', // Analytics
        'https://www.googletagmanager.com',
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and Material-UI
        'https://fonts.googleapis.com',
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: [
        "'self'",
        'https://api.razorpay.com', // Payment gateway
        'https://lumberjack.razorpay.com',
        process.env.AWS_REGION
          ? `https://*.${process.env.AWS_REGION}.amazonaws.com`
          : 'https://*.amazonaws.com',
        'wss:', // WebSocket connections
        'ws:', // WebSocket connections (local dev)
      ],
      frameSrc: [
        "'self'",
        'https://api.razorpay.com', // Payment gateway iframes
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

  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options (Clickjacking protection)
  frameguard: {
    action: 'sameorigin',
  },

  // X-Content-Type-Options (MIME-type sniffing protection)
  noSniff: true,

  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false,
  },

  // X-Download-Options (IE8+ file download protection)
  ieNoOpen: true,

  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Cross-Origin-Embedder-Policy
  crossOriginEmbedderPolicy: false, // Disabled for compatibility

  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin',
  },

  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy: {
    policy: 'same-origin',
  },

  // Origin-Agent-Cluster
  originAgentCluster: true,

  // X-XSS-Protection (legacy, CSP is preferred)
  xssFilter: true,
});

/**
 * Custom security headers for API responses
 */
export const apiSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set API-specific security headers
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || crypto.randomUUID());
  res.setHeader('X-Response-Time', Date.now().toString());

  // Cache control for sensitive endpoints
  if (req.path.includes('/auth') || req.path.includes('/payment')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  // Prevent caching of error responses
  const originalSend = res.send;
  res.send = function (data: any) {
    if (res.statusCode >= 400) {
      res.setHeader('Cache-Control', 'no-store');
    }
    return originalSend.call(this, data);
  };

  next();
};

/**
 * PCI DSS compliance headers for payment endpoints
 */
export const pciComplianceHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Enhanced security for payment endpoints
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none';");
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  // Log access to payment endpoints
  if (config.server.nodeEnv === 'production') {
    // Implement audit logging here
  }

  next();
};

/**
 * Security headers for file download endpoints
 */
export const downloadSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox;");
  res.setHeader('X-Download-Options', 'noopen');
  next();
};

/**
 * Security headers for WebSocket connections
 */
export const websocketSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // WebSocket-specific security headers
  res.setHeader('X-WebSocket-Protocol', 'hasivu-v1');
  res.setHeader('Sec-WebSocket-Protocol', 'hasivu-v1');
  next();
};

/**
 * Development environment security headers (more lenient)
 */
export const devSecurityHeaders = helmet({
  contentSecurityPolicy: false, // Disabled in development for easier debugging
  hsts: false, // Disabled in development (no HTTPS)
});

/**
 * Combined security headers middleware
 */
export const applySecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Apply environment-specific headers
  if (config.server.nodeEnv === 'development') {
    return devSecurityHeaders(req, res, () => {
      apiSecurityHeaders(req, res, next);
    });
  }

  // Production security headers
  return securityHeaders(req, res, () => {
    apiSecurityHeaders(req, res, next);
  });
};

export default {
  securityHeaders,
  apiSecurityHeaders,
  pciComplianceHeaders,
  downloadSecurityHeaders,
  websocketSecurityHeaders,
  devSecurityHeaders,
  applySecurityHeaders,
};
