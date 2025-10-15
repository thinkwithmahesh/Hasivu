/**
 * PCI DSS Compliance Middleware
 * Implements security measures for payment processing
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../../utils/logger';

export interface PCIComplianceOptions {
  requireTLS?: boolean;
  requireHTTPS?: boolean;
  maxRequestSize?: number; // in bytes
  allowedHeaders?: string[];
  sensitiveFields?: string[];
}

/**
 * PCI DSS compliance middleware
 */
export const pciComplianceMiddleware = (options: PCIComplianceOptions = {}) => {
  const {
    requireTLS = true,
    requireHTTPS = true,
    maxRequestSize = 1024 * 1024, // 1MB default
    allowedHeaders = ['content-type', 'authorization', 'x-user-id', 'x-razorpay-signature'],
    sensitiveFields = ['cardNumber', 'cvv', 'pin', 'password', 'ssn'],
  } = options;

  return {
    before: async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult | null> => {
      try {
        // Check HTTPS requirement
        if (requireHTTPS) {
          const protocol =
            event.headers['x-forwarded-proto'] || event.headers['x-forwarded-protocol'];
          if (protocol !== 'https') {
            logger.warn('PCI DSS violation: Non-HTTPS request detected', {
              protocol,
              path: event.path,
              method: event.httpMethod,
            });
            return {
              statusCode: 403,
              headers: {
                'Content-Type': 'application/json',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
              },
              body: JSON.stringify({
                error: 'HTTPS required for payment operations',
                code: 'PCI_DSS_VIOLATION',
              }),
            };
          }
        }

        // Check request size limit
        const bodySize = event.body ? Buffer.byteLength(event.body, 'utf8') : 0;
        if (bodySize > maxRequestSize) {
          logger.warn('PCI DSS violation: Request size exceeds limit', {
            size: bodySize,
            limit: maxRequestSize,
            path: event.path,
          });
          return {
            statusCode: 413,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Request too large',
              code: 'PAYLOAD_TOO_LARGE',
            }),
          };
        }

        // Validate headers (PCI DSS requirement for known headers)
        const requestHeaders = Object.keys(event.headers || {});
        const unknownHeaders = requestHeaders.filter(
          header =>
            !allowedHeaders.includes(header.toLowerCase()) &&
            !header.toLowerCase().startsWith('x-') &&
            !header.toLowerCase().startsWith('accept') &&
            !header.toLowerCase().startsWith('content-') &&
            !header.toLowerCase().startsWith('user-agent') &&
            !header.toLowerCase().startsWith('authorization')
        );

        if (unknownHeaders.length > 0) {
          logger.warn('PCI DSS warning: Unknown headers detected', {
            unknownHeaders,
            path: event.path,
          });
        }

        // Check for sensitive data in query parameters
        if (event.queryStringParameters) {
          const sensitiveParams = Object.keys(event.queryStringParameters).filter(param =>
            sensitiveFields.some(field => param.toLowerCase().includes(field.toLowerCase()))
          );

          if (sensitiveParams.length > 0) {
            logger.error('PCI DSS violation: Sensitive data in query parameters', undefined, {
              sensitiveParams,
              path: event.path,
            });
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                error: 'Sensitive data not allowed in query parameters',
                code: 'PCI_DSS_VIOLATION',
              }),
            };
          }
        }

        // Check for sensitive data in URL path
        if (event.pathParameters) {
          const sensitivePathParams = Object.keys(event.pathParameters).filter(param =>
            sensitiveFields.some(field =>
              event.pathParameters![param]?.toLowerCase().includes(field.toLowerCase())
            )
          );

          if (sensitivePathParams.length > 0) {
            logger.error('PCI DSS violation: Sensitive data in path parameters', undefined, {
              sensitivePathParams,
              path: event.path,
            });
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                error: 'Sensitive data not allowed in path parameters',
                code: 'PCI_DSS_VIOLATION',
              }),
            };
          }
        }

        // Log PCI DSS compliance check passed
        logger.info('PCI DSS compliance check passed', {
          path: event.path,
          method: event.httpMethod,
          hasBody: !!event.body,
        });

        return null; // Continue to next middleware/handler
      } catch (error) {
        logger.error('PCI DSS compliance check failed', error as Error, {
          path: event.path,
          method: event.httpMethod,
        });
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Internal server error',
            code: 'PCI_COMPLIANCE_ERROR',
          }),
        };
      }
    },

    after: async (result: APIGatewayProxyResult): Promise<APIGatewayProxyResult> => {
      // Add PCI DSS security headers
      const headers = {
        ...result.headers,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      };

      return {
        ...result,
        headers,
      };
    },
  };
};

/**
 * PCI DSS data sanitization utility
 */
export const sanitizePCIData = (
  data: any,
  sensitiveFields: string[] = ['cardNumber', 'cvv', 'pin', 'password']
): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };

  // Remove sensitive fields
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizePCIData(sanitized[key], sensitiveFields);
    }
  });

  return sanitized;
};

/**
 * PCI DSS audit logging utility
 */
export const logPCIAuditEvent = (event: string, details: any, userId?: string) => {
  logger.info(`PCI_AUDIT: ${event}`, {
    ...sanitizePCIData(details),
    userId,
    timestamp: new Date().toISOString(),
    pciCompliant: true,
  });
};
