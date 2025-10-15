"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPCIAuditEvent = exports.sanitizePCIData = exports.pciComplianceMiddleware = void 0;
const logger_1 = require("../../utils/logger");
const pciComplianceMiddleware = (options = {}) => {
    const { requireTLS = true, requireHTTPS = true, maxRequestSize = 1024 * 1024, allowedHeaders = ['content-type', 'authorization', 'x-user-id', 'x-razorpay-signature'], sensitiveFields = ['cardNumber', 'cvv', 'pin', 'password', 'ssn'], } = options;
    return {
        before: async (event) => {
            try {
                if (requireHTTPS) {
                    const protocol = event.headers['x-forwarded-proto'] || event.headers['x-forwarded-protocol'];
                    if (protocol !== 'https') {
                        logger_1.logger.warn('PCI DSS violation: Non-HTTPS request detected', {
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
                const bodySize = event.body ? Buffer.byteLength(event.body, 'utf8') : 0;
                if (bodySize > maxRequestSize) {
                    logger_1.logger.warn('PCI DSS violation: Request size exceeds limit', {
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
                const requestHeaders = Object.keys(event.headers || {});
                const unknownHeaders = requestHeaders.filter(header => !allowedHeaders.includes(header.toLowerCase()) &&
                    !header.toLowerCase().startsWith('x-') &&
                    !header.toLowerCase().startsWith('accept') &&
                    !header.toLowerCase().startsWith('content-') &&
                    !header.toLowerCase().startsWith('user-agent') &&
                    !header.toLowerCase().startsWith('authorization'));
                if (unknownHeaders.length > 0) {
                    logger_1.logger.warn('PCI DSS warning: Unknown headers detected', {
                        unknownHeaders,
                        path: event.path,
                    });
                }
                if (event.queryStringParameters) {
                    const sensitiveParams = Object.keys(event.queryStringParameters).filter(param => sensitiveFields.some(field => param.toLowerCase().includes(field.toLowerCase())));
                    if (sensitiveParams.length > 0) {
                        logger_1.logger.error('PCI DSS violation: Sensitive data in query parameters', undefined, {
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
                if (event.pathParameters) {
                    const sensitivePathParams = Object.keys(event.pathParameters).filter(param => sensitiveFields.some(field => event.pathParameters[param]?.toLowerCase().includes(field.toLowerCase())));
                    if (sensitivePathParams.length > 0) {
                        logger_1.logger.error('PCI DSS violation: Sensitive data in path parameters', undefined, {
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
                logger_1.logger.info('PCI DSS compliance check passed', {
                    path: event.path,
                    method: event.httpMethod,
                    hasBody: !!event.body,
                });
                return null;
            }
            catch (error) {
                logger_1.logger.error('PCI DSS compliance check failed', error, {
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
        after: async (result) => {
            const headers = {
                ...result.headers,
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
                'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
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
exports.pciComplianceMiddleware = pciComplianceMiddleware;
const sanitizePCIData = (data, sensitiveFields = ['cardNumber', 'cvv', 'pin', 'password']) => {
    if (!data || typeof data !== 'object') {
        return data;
    }
    const sanitized = { ...data };
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });
    Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            sanitized[key] = (0, exports.sanitizePCIData)(sanitized[key], sensitiveFields);
        }
    });
    return sanitized;
};
exports.sanitizePCIData = sanitizePCIData;
const logPCIAuditEvent = (event, details, userId) => {
    logger_1.logger.info(`PCI_AUDIT: ${event}`, {
        ...(0, exports.sanitizePCIData)(details),
        userId,
        timestamp: new Date().toISOString(),
        pciCompliant: true,
    });
};
exports.logPCIAuditEvent = logPCIAuditEvent;
//# sourceMappingURL=pci-compliance.middleware.js.map