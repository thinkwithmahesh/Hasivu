/**
 * HASIVU Platform - Input Sanitization Middleware
 * Protects against NoSQL injection, XSS attacks, and malicious input
 */
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../shared/logger.service';

/**
 * MongoDB injection protection
 * Removes $ and . from request data to prevent NoSQL injection
 */
export const sanitizeMongoInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('Potential NoSQL injection attempt detected', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      sanitizedKey: key,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * XSS protection
 * Sanitizes user input to prevent cross-site scripting attacks
 */
export const sanitizeXSS = xss();

/**
 * Custom sanitization for specific fields
 */
export const customSanitizer = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize email addresses
    if (req.body?.email) {
      req.body.email = String(req.body.email).trim().toLowerCase();
    }

    // Sanitize phone numbers (remove non-digits)
    if (req.body?.phone) {
      req.body.phone = String(req.body.phone).replace(/\D/g, '');
    }

    // Sanitize URLs
    if (req.body?.url) {
      const url = String(req.body.url).trim();
      if (!url.match(/^https?:\/\//)) {
        logger.warn('Invalid URL format detected', {
          ip: req.ip,
          path: req.path,
          url: url.substring(0, 50), // Log only first 50 chars
        });
        return res.status(400).json({
          error: 'Invalid URL format',
          message: 'URL must start with http:// or https://',
        });
      }
      req.body.url = url;
    }

    // Remove null bytes
    const removeNullBytes = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/\0/g, '');
      }
      if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => {
          obj[key] = removeNullBytes(obj[key]);
        });
      }
      return obj;
    };

    if (req.body) {
      req.body = removeNullBytes(req.body);
    }

    next();
  } catch (error: unknown) {
    logger.error(
      'Error in custom sanitizer',
      error instanceof Error ? error : new Error(String(error)),
      {
        ip: req.ip,
        path: req.path,
      }
    );
    next();
  }
};

/**
 * SQL injection protection
 * Detects and blocks common SQL injection patterns
 */
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
    /(\'|\"|--|;|\*|\/\*|\*\/)/g,
    /(\bOR\b\s+\d+\s*=\s*\d+|\bAND\b\s+\d+\s*=\s*\d+)/gi,
    /(1=1|1='1'|1="1")/gi,
  ];

  const checkForSqlInjection = (value: any): boolean => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => checkForSqlInjection(v));
    }
    return false;
  };

  try {
    const suspicious =
      checkForSqlInjection(req.body) ||
      checkForSqlInjection(req.query) ||
      checkForSqlInjection(req.params);

    if (suspicious) {
      logger.warn('Potential SQL injection attempt detected', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        body: JSON.stringify(req.body).substring(0, 100),
        query: JSON.stringify(req.query).substring(0, 100),
        timestamp: new Date().toISOString(),
      });

      return res.status(400).json({
        error: 'Invalid input',
        message: 'Your request contains potentially malicious content',
      });
    }

    next();
  } catch (error: unknown) {
    logger.error(
      'Error in SQL injection protection',
      error instanceof Error ? error : new Error(String(error)),
      {
        ip: req.ip,
        path: req.path,
      }
    );
    next();
  }
};

/**
 * Path traversal protection
 * Prevents directory traversal attacks
 */
export const pathTraversalProtection = (req: Request, res: Response, next: NextFunction) => {
  const pathTraversalPatterns = [/\.\./g, /\.\.\\/g, /%2e%2e/gi, /\.\//g];

  const checkForPathTraversal = (value: any): boolean => {
    if (typeof value === 'string') {
      return pathTraversalPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => checkForPathTraversal(v));
    }
    return false;
  };

  try {
    const suspicious =
      checkForPathTraversal(req.body) ||
      checkForPathTraversal(req.query) ||
      checkForPathTraversal(req.params) ||
      checkForPathTraversal(req.path);

    if (suspicious) {
      logger.warn('Potential path traversal attempt detected', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });

      return res.status(400).json({
        error: 'Invalid request',
        message: 'Path traversal attempts are not allowed',
      });
    }

    next();
  } catch (error: unknown) {
    logger.error(
      'Error in path traversal protection',
      error instanceof Error ? error : new Error(String(error)),
      {
        ip: req.ip,
        path: req.path,
      }
    );
    next();
  }
};

/**
 * Combined sanitization middleware
 * Apply all sanitization in the correct order
 */
export const sanitizeInput = [
  sanitizeMongoInput,
  sanitizeXSS,
  customSanitizer,
  sqlInjectionProtection,
  pathTraversalProtection,
];

export default {
  sanitizeMongoInput,
  sanitizeXSS,
  customSanitizer,
  sqlInjectionProtection,
  pathTraversalProtection,
  sanitizeInput,
};
