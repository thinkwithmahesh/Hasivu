/**
 * HASIVU Platform - Comprehensive Input Validation and Sanitization Middleware
 * Combines validation, sanitization, and security checks for all incoming requests
 */
import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import { logger } from '../shared/logger.service';
import { validationService } from '../services/validation.service';

export interface ValidationRule {
  type: 'string' | 'email' | 'phone' | 'uuid' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  custom?: (value: any) => boolean;
  arrayItemType?: ValidationRule;
  objectSchema?: { [key: string]: ValidationRule };
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

/**
 * MongoDB injection protection
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
          url: url.substring(0, 50),
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
 * Validate request body against schema
 */
export const validateBody = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: Array<{ field: string; message: string }> = [];

      for (const [field, rule] of Object.entries(schema)) {
        const value = req.body[field];

        // Check required fields
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push({
            field,
            message: `${field} is required`,
          });
          continue;
        }

        // Skip validation if field is not required and not provided
        if (!rule.required && (value === undefined || value === null || value === '')) {
          continue;
        }

        // Type validation
        switch (rule.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push({
                field,
                message: `${field} must be a string`,
              });
            } else {
              if (rule.minLength && value.length < rule.minLength) {
                errors.push({
                  field,
                  message: `${field} must be at least ${rule.minLength} characters long`,
                });
              }
              if (rule.maxLength && value.length > rule.maxLength) {
                errors.push({
                  field,
                  message: `${field} must be at most ${rule.maxLength} characters long`,
                });
              }
              if (rule.pattern && !rule.pattern.test(value)) {
                errors.push({
                  field,
                  message: `${field} format is invalid`,
                });
              }
            }
            break;

          case 'email':
            if (!validationService.validateEmail(value)) {
              errors.push({
                field,
                message: `${field} must be a valid email address`,
              });
            }
            break;

          case 'phone':
            if (!validationService.validatePhone(value)) {
              errors.push({
                field,
                message: `${field} must be a valid phone number`,
              });
            }
            break;

          case 'uuid':
            if (!validationService.validateUUID(value)) {
              errors.push({
                field,
                message: `${field} must be a valid UUID`,
              });
            }
            break;

          case 'number':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              errors.push({
                field,
                message: `${field} must be a number`,
              });
            } else {
              const numValue = Number(value);
              if (rule.min !== undefined && numValue < rule.min) {
                errors.push({
                  field,
                  message: `${field} must be at least ${rule.min}`,
                });
              }
              if (rule.max !== undefined && numValue > rule.max) {
                errors.push({
                  field,
                  message: `${field} must be at most ${rule.max}`,
                });
              }
            }
            break;

          case 'boolean':
            if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
              errors.push({
                field,
                message: `${field} must be a boolean`,
              });
            }
            break;

          case 'date':
            if (!validationService.validateDate(value)) {
              errors.push({
                field,
                message: `${field} must be a valid date`,
              });
            }
            break;

          case 'array':
            if (!Array.isArray(value)) {
              errors.push({
                field,
                message: `${field} must be an array`,
              });
            } else {
              if (rule.minLength && value.length < rule.minLength) {
                errors.push({
                  field,
                  message: `${field} must have at least ${rule.minLength} items`,
                });
              }
              if (rule.maxLength && value.length > rule.maxLength) {
                errors.push({
                  field,
                  message: `${field} must have at most ${rule.maxLength} items`,
                });
              }
              if (rule.arrayItemType) {
                value.forEach((item, index) => {
                  // Simple validation for array items - could be enhanced
                  if (rule.arrayItemType!.type === 'string' && typeof item !== 'string') {
                    errors.push({
                      field,
                      message: `${field}[${index}] must be a string`,
                    });
                  }
                });
              }
            }
            break;

          case 'object':
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
              errors.push({
                field,
                message: `${field} must be an object`,
              });
            } else if (rule.objectSchema) {
              // Recursive validation for nested objects
              const nestedErrors = validateObject(value, rule.objectSchema);
              nestedErrors.forEach(error => {
                errors.push({
                  field: `${field}.${error.field}`,
                  message: error.message,
                });
              });
            }
            break;
        }

        // Enum validation
        if (rule.enum && !rule.enum.includes(value)) {
          errors.push({
            field,
            message: `${field} must be one of: ${rule.enum.join(', ')}`,
          });
        }

        // Custom validation
        if (rule.custom && !rule.custom(value)) {
          errors.push({
            field,
            message: `${field} failed custom validation`,
          });
        }
      }

      if (errors.length > 0) {
        logger.warn('Input validation failed', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          errors: errors.map(e => e.message),
        });

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
      }

      next();
    } catch (error: unknown) {
      logger.error(
        'Validation middleware error',
        error instanceof Error ? error : new Error(String(error)),
        {
          ip: req.ip,
          path: req.path,
        }
      );
      next();
    }
  };
};

/**
 * Helper function to validate nested objects
 */
function validateObject(
  obj: any,
  schema: ValidationSchema
): Array<{ field: string; message: string }> {
  const errors: Array<{ field: string; message: string }> = [];

  for (const [field, rule] of Object.entries(schema)) {
    const value = obj[field];

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `${field} is required`,
      });
      continue;
    }

    // Skip validation if field is not required and not provided
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Basic type validation for nested objects
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field,
            message: `${field} must be a string`,
          });
        }
        break;
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          errors.push({
            field,
            message: `${field} must be a number`,
          });
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field,
            message: `${field} must be a boolean`,
          });
        }
        break;
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field,
        message: `${field} must be one of: ${rule.enum.join(', ')}`,
      });
    }
  }

  return errors;
}

/**
 * Validate request query parameters
 */
export const validateQuery = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: Array<{ field: string; message: string }> = [];

      for (const [field, rule] of Object.entries(schema)) {
        const value = req.query[field];

        // Check required fields
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push({
            field,
            message: `${field} is required`,
          });
          continue;
        }

        // Skip validation if field is not required and not provided
        if (!rule.required && (value === undefined || value === null || value === '')) {
          continue;
        }

        // Basic type validation for query params (all come as strings)
        if (rule.type === 'number' && isNaN(Number(value))) {
          errors.push({
            field,
            message: `${field} must be a number`,
          });
        }

        if (rule.type === 'boolean' && value !== 'true' && value !== 'false') {
          errors.push({
            field,
            message: `${field} must be a boolean`,
          });
        }

        // Enum validation
        if (rule.enum && !rule.enum.includes(String(value))) {
          errors.push({
            field,
            message: `${field} must be one of: ${rule.enum.join(', ')}`,
          });
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details: errors,
        });
      }

      next();
    } catch (error: unknown) {
      logger.error(
        'Query validation middleware error',
        error instanceof Error ? error : new Error(String(error)),
        {
          ip: req.ip,
          path: req.path,
        }
      );
      next();
    }
  };
};

/**
 * Validate request parameters (URL params)
 */
export const validateParams = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: Array<{ field: string; message: string }> = [];

      for (const [field, rule] of Object.entries(schema)) {
        const value = req.params[field];

        if (rule.type === 'uuid' && !validationService.validateUUID(value)) {
          errors.push({
            field,
            message: `${field} must be a valid UUID`,
          });
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push({
            field,
            message: `${field} format is invalid`,
          });
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Parameter validation failed',
          details: errors,
        });
      }

      next();
    } catch (error: unknown) {
      logger.error(
        'Parameter validation middleware error',
        error instanceof Error ? error : new Error(String(error)),
        {
          ip: req.ip,
          path: req.path,
        }
      );
      next();
    }
  };
};

/**
 * Sanitize input data
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = validationService.sanitizePayload(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          (req.query as any)[key] = validationService.sanitizeString(value);
        }
      }
    }

    next();
  } catch (error: unknown) {
    logger.error(
      'Input sanitization error',
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
 * Rate limiting for validation endpoints
 */
export const validationRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // Simple in-memory rate limiting (in production, use Redis or similar)
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const key = `validation_rate_limit_${clientIP}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  // This is a simplified implementation - in production use a proper rate limiter
  const globalAny = global as any;
  if (!globalAny.validationRateLimitStore) {
    globalAny.validationRateLimitStore = new Map();
  }

  const store = globalAny.validationRateLimitStore;
  const userRequests = store.get(key) || [];

  // Remove old requests outside the window
  const validRequests = userRequests.filter((timestamp: number) => now - timestamp < windowMs);

  if (validRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Too many validation requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }

  validRequests.push(now);
  store.set(key, validRequests);

  next();
};

/**
 * Combined comprehensive input validation and sanitization middleware
 * Apply all security measures in the correct order
 */
export const comprehensiveInputValidation = [
  // Security sanitization first
  sanitizeMongoInput,
  sanitizeXSS,
  customSanitizer,
  sqlInjectionProtection,
  pathTraversalProtection,

  // Input sanitization
  sanitizeInput,

  // Rate limiting
  validationRateLimit,
];

export default {
  validateBody,
  validateQuery,
  validateParams,
  sanitizeInput,
  sanitizeMongoInput,
  sanitizeXSS,
  customSanitizer,
  sqlInjectionProtection,
  pathTraversalProtection,
  validationRateLimit,
  comprehensiveInputValidation,
};
