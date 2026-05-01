/**
 * Request XSS hardening — replaces unmaintained `xss-clean` by reusing ValidationService rules.
 * Sanitizes string values in JSON bodies and query strings before route handlers run.
 */

import { RequestHandler } from 'express';
import { logger } from '../shared/logger.service';
import { validationService } from '../services/validation.service';

function sanitizeParsedQuery(query: Record<string, unknown>): void {
  for (const key of Object.keys(query)) {
    const value = query[key];
    if (typeof value === 'string') {
      query[key] = validationService.sanitizeString(value);
    } else if (Array.isArray(value)) {
      query[key] = value.map(item =>
        typeof item === 'string' ? validationService.sanitizeString(item) : item
      );
    }
  }
}

export const sanitizeXSS: RequestHandler = (req, _res, next) => {
  try {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      req.body = validationService.sanitizePayload(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      sanitizeParsedQuery(req.query as Record<string, unknown>);
    }
    next();
  } catch (error: unknown) {
    logger.error(
      'XSS sanitization error',
      error instanceof Error ? error : new Error(String(error)),
      {
        ip: req.ip,
        path: req.path,
      }
    );
    next();
  }
};
