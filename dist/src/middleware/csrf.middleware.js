"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCSRFToken = exports.enhancedCSRFProtection = exports.sameSiteCSRF = exports.doubleSubmitCSRF = exports.attachCSRFToken = exports.csrfProtection = void 0;
const session_service_1 = require("../services/session.service");
const logger_service_1 = require("../shared/logger.service");
const defaultCSRFConfig = {
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    customHeaderName: 'X-CSRF-Token',
    skipPaths: ['/health', '/metrics', '/auth/refresh'],
    errorMessage: 'Invalid CSRF token',
};
const csrfProtection = (config = {}) => {
    const csrfConfig = { ...defaultCSRFConfig, ...config };
    return async (req, res, next) => {
        try {
            if (csrfConfig.ignoreMethods?.includes(req.method)) {
                next();
                return;
            }
            if (csrfConfig.skipPaths?.some(path => req.path.startsWith(path))) {
                next();
                return;
            }
            const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
            if (!sessionId) {
                res.status(401).json({
                    error: 'Authentication required',
                    message: 'Session ID is required for CSRF protection',
                });
                return;
            }
            const csrfToken = req.headers[csrfConfig.customHeaderName.toLowerCase()] ||
                req.body?.csrfToken ||
                req.query?.csrfToken;
            if (!csrfToken) {
                logger_service_1.logger.warn('CSRF token missing', {
                    method: req.method,
                    path: req.path,
                    sessionId,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                });
                res.status(403).json({
                    error: 'CSRF token required',
                    message: 'CSRF token is required for this operation',
                });
                return;
            }
            const isValidCSRF = await session_service_1.sessionService.validateCSRFToken(sessionId, csrfToken);
            if (!isValidCSRF) {
                logger_service_1.logger.warn('Invalid CSRF token detected', {
                    method: req.method,
                    path: req.path,
                    sessionId,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    providedToken: `${csrfToken.substring(0, 8)}...`,
                });
                res.status(403).json({
                    error: 'Invalid CSRF token',
                    message: csrfConfig.errorMessage || 'CSRF token validation failed',
                });
                return;
            }
            req.csrfToken = csrfToken;
            req.sessionId = sessionId;
            logger_service_1.logger.debug('CSRF token validated successfully', {
                method: req.method,
                path: req.path,
                sessionId,
            });
            next();
        }
        catch (error) {
            logger_service_1.logger.error('CSRF protection middleware error', undefined, {
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                method: req.method,
                path: req.path,
                sessionId: req.sessionId,
            });
            res.status(500).json({
                error: 'CSRF validation error',
                message: 'Failed to validate CSRF token',
            });
        }
    };
};
exports.csrfProtection = csrfProtection;
const attachCSRFToken = async (req, res, next) => {
    try {
        const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
        if (sessionId) {
            const csrfData = await session_service_1.sessionService.generateCSRFToken(sessionId);
            res.setHeader('X-CSRF-Token', csrfData.token);
            res.locals.csrfToken = csrfData.token;
            logger_service_1.logger.debug('CSRF token attached to response', {
                sessionId,
                tokenExpires: csrfData.expiresAt.toISOString(),
            });
        }
        next();
    }
    catch (error) {
        logger_service_1.logger.error('Failed to attach CSRF token', undefined, {
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            sessionId: req.sessionId,
        });
        next();
    }
};
exports.attachCSRFToken = attachCSRFToken;
const doubleSubmitCSRF = (config = {}) => {
    const csrfConfig = { ...defaultCSRFConfig, ...config };
    return (req, res, next) => {
        try {
            if (csrfConfig.ignoreMethods?.includes(req.method)) {
                next();
                return;
            }
            if (csrfConfig.skipPaths?.some(path => req.path.startsWith(path))) {
                next();
                return;
            }
            const cookieToken = req.cookies?.csrfToken;
            const headerToken = req.headers[csrfConfig.customHeaderName.toLowerCase()] || req.body?.csrfToken;
            if (!cookieToken || !headerToken) {
                res.status(403).json({
                    error: 'CSRF token required',
                    message: 'CSRF token must be provided in both cookie and header/body',
                });
                return;
            }
            if (cookieToken !== headerToken) {
                logger_service_1.logger.warn('CSRF double submit validation failed', {
                    method: req.method,
                    path: req.path,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                });
                res.status(403).json({
                    error: 'Invalid CSRF token',
                    message: 'CSRF token mismatch detected',
                });
                return;
            }
            next();
        }
        catch (error) {
            logger_service_1.logger.error('Double submit CSRF protection error', undefined, {
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                method: req.method,
                path: req.path,
            });
            res.status(500).json({
                error: 'CSRF validation error',
                message: 'Failed to validate CSRF token',
            });
        }
    };
};
exports.doubleSubmitCSRF = doubleSubmitCSRF;
const sameSiteCSRF = (req, res, next) => {
    try {
        const { origin } = req.headers;
        const { referer } = req.headers;
        const { host } = req.headers;
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            if (!origin && !referer) {
                logger_service_1.logger.warn('Missing origin and referer headers', {
                    method: req.method,
                    path: req.path,
                    ip: req.ip,
                });
                res.status(403).json({
                    error: 'Invalid request',
                    message: 'Origin or referer header required',
                });
                return;
            }
            if (origin) {
                const originHost = new URL(origin).host;
                if (originHost !== host) {
                    logger_service_1.logger.warn('Origin host mismatch', {
                        method: req.method,
                        path: req.path,
                        origin,
                        host,
                        ip: req.ip,
                    });
                    res.status(403).json({
                        error: 'Invalid origin',
                        message: 'Request origin does not match host',
                    });
                    return;
                }
            }
        }
        next();
    }
    catch (error) {
        logger_service_1.logger.error('SameSite CSRF protection error', undefined, {
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            method: req.method,
            path: req.path,
        });
        res.status(500).json({
            error: 'Origin validation error',
            message: 'Failed to validate request origin',
        });
    }
};
exports.sameSiteCSRF = sameSiteCSRF;
const enhancedCSRFProtection = (config = {}) => {
    return [exports.sameSiteCSRF, (0, exports.csrfProtection)(config), exports.attachCSRFToken];
};
exports.enhancedCSRFProtection = enhancedCSRFProtection;
const getCSRFToken = async (req, res) => {
    try {
        const sessionId = req.cookies?.sessionId;
        if (!sessionId) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'Valid session required to get CSRF token',
            });
            return;
        }
        const sessionValidation = await session_service_1.sessionService.validateSession(sessionId, req);
        if (!sessionValidation.valid) {
            res.status(401).json({
                error: 'Invalid session',
                message: sessionValidation.error || 'Session validation failed',
            });
            return;
        }
        const csrfData = await session_service_1.sessionService.generateCSRFToken(sessionId);
        res.json({
            csrfToken: csrfData.token,
            expiresAt: csrfData.expiresAt.toISOString(),
        });
    }
    catch (error) {
        logger_service_1.logger.error('Failed to generate CSRF token', undefined, {
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            error: 'CSRF token generation failed',
            message: 'Unable to generate CSRF token',
        });
    }
};
exports.getCSRFToken = getCSRFToken;
exports.default = {
    csrfProtection: exports.csrfProtection,
    attachCSRFToken: exports.attachCSRFToken,
    doubleSubmitCSRF: exports.doubleSubmitCSRF,
    sameSiteCSRF: exports.sameSiteCSRF,
    enhancedCSRFProtection: exports.enhancedCSRFProtection,
    getCSRFToken: exports.getCSRFToken,
};
//# sourceMappingURL=csrf.middleware.js.map