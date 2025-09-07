"use strict";
/**
 * HASIVU Platform - JWT Token Utility Service
 * Production-ready JWT token extraction and validation
 * Replaces all mock authentication implementations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtService = exports.JWTService = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const environment_1 = require("../config/environment");
// import { LoggerService } from './logger.service';  // Temporarily use console for logging
const logger = {
    info: (message, data) => console.log(message, data),
    warn: (message, data) => console.warn(message, data),
    error: (message, data) => console.error(message, data),
    debug: (message, data) => console.debug(message, data)
};
/**
 * JWT Service Class
 * Centralized JWT token management with comprehensive security features
 * Singleton pattern for consistent token handling across application
 */
class JWTService {
    static instance;
    jwtSecret;
    refreshSecret;
    issuer;
    audience;
    defaultExpiresIn;
    refreshExpiresIn;
    constructor() {
        this.jwtSecret = environment_1.config.jwt.secret;
        this.refreshSecret = environment_1.config.jwt.refreshSecret;
        this.issuer = environment_1.config.jwt.issuer || 'hasivu-platform';
        this.audience = environment_1.config.jwt.audience || 'hasivu-users';
        this.defaultExpiresIn = environment_1.config.jwt.expiresIn || '15m';
        this.refreshExpiresIn = environment_1.config.jwt.refreshExpiresIn || '7d';
        // Validate JWT configuration
        this.validateJWTConfiguration();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!JWTService.instance) {
            JWTService.instance = new JWTService();
        }
        return JWTService.instance;
    }
    /**
     * Validate JWT configuration
     */
    validateJWTConfiguration() {
        const issues = [];
        if (!this.jwtSecret) {
            issues.push('JWT secret is not configured');
        }
        else if (this.jwtSecret.length < 32) {
            issues.push('JWT secret is too short (minimum 32 characters required)');
        }
        if (!this.refreshSecret) {
            issues.push('Refresh token secret is not configured');
        }
        else if (this.refreshSecret.length < 32) {
            issues.push('Refresh token secret is too short (minimum 32 characters required)');
        }
        if (this.jwtSecret === this.refreshSecret) {
            issues.push('JWT secret and refresh secret should be different');
        }
        if (issues.length > 0) {
            logger.error('JWT configuration validation failed', { issues });
            throw new Error(`JWT configuration issues: ${issues.join(', ')}`);
        }
        logger.info('JWT configuration validated successfully', {
            issuer: this.issuer,
            audience: this.audience,
            defaultExpiresIn: this.defaultExpiresIn,
            refreshExpiresIn: this.refreshExpiresIn
        });
    }
    /**
     * Extract JWT token from API Gateway event
     */
    extractTokenFromEvent(event) {
        try {
            // Priority 1: Authorization header (Bearer token)
            const authHeader = event.headers?.Authorization || event.headers?.authorization;
            if (authHeader) {
                const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
                if (bearerMatch) {
                    const token = bearerMatch[1].trim();
                    if (token.length > 0) {
                        logger.debug('JWT token found in Authorization header');
                        return token;
                    }
                }
            }
            // Priority 2: API Gateway Authorizer context
            const authContext = event.requestContext?.authorizer;
            if (authContext?.accessToken) {
                logger.debug('JWT token found in authorizer context');
                return authContext.accessToken;
            }
            // Priority 3: Query parameter (less secure, use with caution)
            const queryToken = event.queryStringParameters?.token;
            if (queryToken && queryToken.length > 0) {
                logger.debug('JWT token found in query parameter');
                return queryToken;
            }
            // Priority 4: Cookie header
            const cookieHeader = event.headers?.Cookie || event.headers?.cookie;
            if (cookieHeader) {
                const cookies = this.parseCookies(cookieHeader);
                const cookieToken = cookies.accessToken || cookies.token;
                if (cookieToken && cookieToken.length > 0) {
                    logger.debug('JWT token found in cookies');
                    return cookieToken;
                }
            }
            // Priority 5: Custom header (x-access-token) - safe property access
            const customHeaderName = environment_1.config.jwt.customHeaderName || 'x-access-token';
            const customToken = event.headers?.[customHeaderName] ||
                event.headers?.[customHeaderName.toLowerCase()];
            if (customToken && customToken.length > 0) {
                logger.debug('JWT token found in custom header');
                return customToken;
            }
            logger.warn('No JWT token found in request', {
                hasAuthHeader: !!authHeader,
                hasQueryToken: !!queryToken,
                hasCookies: !!cookieHeader,
                requestId: event.requestContext?.requestId
            });
            return null;
        }
        catch (error) {
            logger.error('Error extracting JWT token from event', {
                error: error instanceof Error ? error.message : 'Unknown error',
                requestId: event.requestContext?.requestId
            });
            return null;
        }
    }
    /**
     * Parse cookies from Cookie header
     */
    parseCookies(cookieHeader) {
        const cookies = {};
        try {
            const cookiePairs = cookieHeader.split(';');
            for (const pair of cookiePairs) {
                const [key, ...valueParts] = pair.trim().split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim();
                    cookies[key.trim()] = decodeURIComponent(value);
                }
            }
        }
        catch (error) {
            logger.warn('Failed to parse cookies', {
                cookieHeader,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        return cookies;
    }
    /**
     * Verify and decode JWT token
     */
    verifyToken(token) {
        if (!token || token.trim().length === 0) {
            return {
                isValid: false,
                payload: null,
                token: null,
                error: 'Token is empty or null',
                errorCode: 'EMPTY_TOKEN'
            };
        }
        try {
            // Verify token signature and decode payload
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret, {
                issuer: this.issuer,
                audience: this.audience,
                complete: false
            });
            // Validate token type (should be access token)
            if (decoded.tokenType !== 'access') {
                return {
                    isValid: false,
                    payload: null,
                    token,
                    error: `Invalid token type: ${decoded.tokenType}. Expected: access`,
                    errorCode: 'INVALID_TOKEN_TYPE'
                };
            }
            // Validate required fields
            const requiredFields = ['userId', 'email', 'role'];
            const missingFields = requiredFields.filter(field => !decoded[field]);
            if (missingFields.length > 0) {
                return {
                    isValid: false,
                    payload: null,
                    token,
                    error: `Missing required fields: ${missingFields.join(', ')}`,
                    errorCode: 'MISSING_FIELDS'
                };
            }
            // Calculate time-based information
            const now = Math.floor(Date.now() / 1000);
            const issuedAt = decoded.iat ? new Date(decoded.iat * 1000) : undefined;
            const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : undefined;
            const remainingTTL = decoded.exp ? Math.max(0, decoded.exp - now) : undefined;
            logger.debug('JWT token verified successfully', {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                expiresAt: expiresAt?.toISOString(),
                remainingTTL
            });
            return {
                isValid: true,
                payload: decoded,
                token,
                expiresAt,
                issuedAt,
                remainingTTL
            };
        }
        catch (error) {
            let errorMessage = 'Token verification failed';
            let errorCode = 'VERIFICATION_FAILED';
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                    errorMessage = 'Token has expired';
                    errorCode = 'TOKEN_EXPIRED';
                }
                else if (error instanceof jsonwebtoken_1.default.NotBeforeError) {
                    errorMessage = 'Token is not active yet';
                    errorCode = 'TOKEN_NOT_ACTIVE';
                }
                else {
                    errorMessage = `Token validation error: ${error.message}`;
                    errorCode = 'INVALID_TOKEN';
                }
            }
            else {
                errorMessage = `Unexpected token error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                errorCode = 'UNKNOWN_ERROR';
            }
            logger.warn('JWT token verification failed', {
                error: errorMessage,
                errorCode,
                tokenLength: token.length,
                tokenPrefix: token.substring(0, 20) + '...'
            });
            return {
                isValid: false,
                payload: null,
                token,
                error: errorMessage,
                errorCode
            };
        }
    }
    /**
     * Generate access token
     */
    generateAccessToken(payload, options = {}) {
        try {
            const tokenPayload = {
                ...payload,
                tokenType: 'access',
                iat: Math.floor(Date.now() / 1000),
                exp: 0 // Will be set by jwt.sign
            };
            // Add session and device info if requested
            if (options.includeSessionData && payload.sessionId) {
                tokenPayload.sessionId = payload.sessionId;
            }
            if (options.includeDeviceInfo) {
                if (payload.deviceId)
                    tokenPayload.deviceId = payload.deviceId;
                if (payload.ipAddress)
                    tokenPayload.ipAddress = payload.ipAddress;
                if (payload.userAgent)
                    tokenPayload.userAgent = payload.userAgent;
            }
            const signOptions = {
                issuer: options.issuer || this.issuer,
                audience: (options.audience || this.audience),
                expiresIn: (options.expiresIn || this.defaultExpiresIn),
                jwtid: options.jwtid,
                subject: options.subject || payload.userId,
                keyid: options.keyid,
                notBefore: options.notBefore
            };
            const token = jsonwebtoken_1.default.sign(tokenPayload, this.jwtSecret, signOptions);
            logger.info('Access token generated successfully', {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                expiresIn: signOptions.expiresIn,
                includeSessionData: options.includeSessionData,
                includeDeviceInfo: options.includeDeviceInfo
            });
            return token;
        }
        catch (error) {
            const errorMessage = `Failed to generate access token: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logger.error(errorMessage, {
                userId: payload.userId,
                email: payload.email,
                error: error instanceof Error ? error.stack : error
            });
            throw new Error(errorMessage);
        }
    }
    /**
     * Generate refresh token
     */
    generateRefreshToken(payload, options = {}) {
        try {
            const tokenPayload = {
                ...payload,
                tokenType: 'refresh',
                iat: Math.floor(Date.now() / 1000),
                exp: 0 // Will be set by jwt.sign
            };
            const signOptions = {
                issuer: options.issuer || this.issuer,
                audience: (options.audience || this.audience),
                expiresIn: (options.expiresIn || this.refreshExpiresIn),
                jwtid: options.jwtid,
                subject: options.subject || payload.userId,
                keyid: options.keyid,
                notBefore: options.notBefore
            };
            const token = jsonwebtoken_1.default.sign(tokenPayload, this.refreshSecret, signOptions);
            logger.info('Refresh token generated successfully', {
                userId: payload.userId,
                email: payload.email,
                sessionId: payload.sessionId,
                expiresIn: signOptions.expiresIn
            });
            return token;
        }
        catch (error) {
            const errorMessage = `Failed to generate refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logger.error(errorMessage, {
                userId: payload.userId,
                email: payload.email,
                error: error instanceof Error ? error.stack : error
            });
            throw new Error(errorMessage);
        }
    }
    /**
     * Verify refresh token
     */
    verifyRefreshToken(token) {
        if (!token || token.trim().length === 0) {
            return {
                isValid: false,
                payload: null,
                token: null,
                error: 'Refresh token is empty or null',
                errorCode: 'EMPTY_TOKEN'
            };
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.refreshSecret, {
                issuer: this.issuer,
                audience: this.audience,
                complete: false
            });
            // Validate token type (should be refresh token)
            if (decoded.tokenType !== 'refresh') {
                return {
                    isValid: false,
                    payload: null,
                    token,
                    error: `Invalid token type: ${decoded.tokenType}. Expected: refresh`,
                    errorCode: 'INVALID_TOKEN_TYPE'
                };
            }
            // Validate required fields for refresh token
            const requiredFields = ['userId', 'email', 'role'];
            const missingFields = requiredFields.filter(field => !decoded[field]);
            if (missingFields.length > 0) {
                return {
                    isValid: false,
                    payload: null,
                    token,
                    error: `Missing required fields: ${missingFields.join(', ')}`,
                    errorCode: 'MISSING_FIELDS'
                };
            }
            // Calculate time-based information
            const now = Math.floor(Date.now() / 1000);
            const issuedAt = decoded.iat ? new Date(decoded.iat * 1000) : undefined;
            const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : undefined;
            const remainingTTL = decoded.exp ? Math.max(0, decoded.exp - now) : undefined;
            logger.debug('Refresh token verified successfully', {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                sessionId: decoded.sessionId,
                expiresAt: expiresAt?.toISOString(),
                remainingTTL
            });
            return {
                isValid: true,
                payload: decoded,
                token,
                expiresAt,
                issuedAt,
                remainingTTL
            };
        }
        catch (error) {
            let errorMessage = 'Refresh token verification failed';
            let errorCode = 'VERIFICATION_FAILED';
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                    errorMessage = 'Refresh token has expired';
                    errorCode = 'TOKEN_EXPIRED';
                }
                else if (error instanceof jsonwebtoken_1.default.NotBeforeError) {
                    errorMessage = 'Refresh token is not active yet';
                    errorCode = 'TOKEN_NOT_ACTIVE';
                }
                else {
                    errorMessage = `Refresh token validation error: ${error.message}`;
                    errorCode = 'INVALID_TOKEN';
                }
            }
            else {
                errorMessage = `Unexpected refresh token error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                errorCode = 'UNKNOWN_ERROR';
            }
            logger.warn('Refresh token verification failed', {
                error: errorMessage,
                errorCode,
                tokenLength: token.length
            });
            return {
                isValid: false,
                payload: null,
                token,
                error: errorMessage,
                errorCode
            };
        }
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken) {
        try {
            // Verify the refresh token
            const refreshResult = this.verifyRefreshToken(refreshToken);
            if (!refreshResult.isValid || !refreshResult.payload) {
                return {
                    success: false,
                    error: refreshResult.error || 'Invalid refresh token',
                    errorCode: refreshResult.errorCode
                };
            }
            // Generate new access token with same user data
            const accessTokenPayload = {
                userId: refreshResult.payload.userId,
                email: refreshResult.payload.email,
                role: refreshResult.payload.role,
                permissions: refreshResult.payload.permissions || [],
                businessId: refreshResult.payload.businessId,
                sessionId: refreshResult.payload.sessionId
            };
            const newAccessToken = this.generateAccessToken(accessTokenPayload);
            // Optionally generate new refresh token (token rotation) - safe property access
            let newRefreshToken;
            if (environment_1.config.jwt.rotateRefreshTokens) {
                newRefreshToken = this.generateRefreshToken({
                    userId: refreshResult.payload.userId,
                    email: refreshResult.payload.email,
                    role: refreshResult.payload.role,
                    sessionId: refreshResult.payload.sessionId
                });
            }
            // Calculate expiration time
            const decoded = jsonwebtoken_1.default.decode(newAccessToken);
            const expiresIn = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900; // Default 15 minutes
            logger.info('Access token refreshed successfully', {
                userId: refreshResult.payload.userId,
                email: refreshResult.payload.email,
                sessionId: refreshResult.payload.sessionId,
                rotatedRefreshToken: !!newRefreshToken
            });
            return {
                success: true,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn
            };
        }
        catch (error) {
            const errorMessage = `Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logger.error(errorMessage, {
                error: error instanceof Error ? error.stack : error
            });
            return {
                success: false,
                error: errorMessage,
                errorCode: 'REFRESH_FAILED'
            };
        }
    }
    /**
     * Decode JWT token without verification (for debugging)
     */
    decodeToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            return decoded;
        }
        catch (error) {
            logger.warn('Failed to decode JWT token', {
                error: error instanceof Error ? error.message : 'Unknown error',
                tokenLength: token.length
            });
            return null;
        }
    }
    /**
     * Check if token is expired without full verification
     */
    isTokenExpired(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) {
                return true;
            }
            const now = Math.floor(Date.now() / 1000);
            return decoded.exp < now;
        }
        catch {
            return true;
        }
    }
    /**
     * Get token expiration time
     */
    getTokenExpiration(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) {
                return null;
            }
            return new Date(decoded.exp * 1000);
        }
        catch {
            return null;
        }
    }
    /**
     * Get remaining token TTL in seconds
     */
    getTokenTTL(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) {
                return null;
            }
            const now = Math.floor(Date.now() / 1000);
            return Math.max(0, decoded.exp - now);
        }
        catch {
            return null;
        }
    }
    /**
     * Validate token permissions
     */
    hasPermission(payload, requiredPermission) {
        if (!payload.permissions || !Array.isArray(payload.permissions)) {
            return false;
        }
        return payload.permissions.includes(requiredPermission) || payload.permissions.includes('*');
    }
    /**
     * Validate token role
     */
    hasRole(payload, requiredRole) {
        if (!payload.role) {
            return false;
        }
        // Check exact role match or admin role (which has access to everything)
        return payload.role === requiredRole || payload.role === 'admin';
    }
    /**
     * Generate JWT token pair (access + refresh)
     */
    generateTokenPair(payload, options = {}) {
        try {
            const accessToken = this.generateAccessToken(payload, options);
            const refreshToken = this.generateRefreshToken({
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                sessionId: payload.sessionId
            }, options);
            // Calculate expiration time from access token
            const decoded = jsonwebtoken_1.default.decode(accessToken);
            const expiresIn = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;
            logger.info('JWT token pair generated successfully', {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                sessionId: payload.sessionId,
                expiresIn
            });
            return {
                accessToken,
                refreshToken,
                expiresIn
            };
        }
        catch (error) {
            const errorMessage = `Failed to generate token pair: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logger.error(errorMessage, {
                userId: payload.userId,
                email: payload.email,
                error: error instanceof Error ? error.stack : error
            });
            throw new Error(errorMessage);
        }
    }
    /**
     * Revoke token (add to blacklist - requires external storage)
     */
    async revokeToken(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.jti) {
                logger.warn('Cannot revoke token without JTI', { tokenLength: token.length });
                return false;
            }
            // TODO: Implement token blacklisting with Redis or database
            // For now, just log the revocation
            logger.info('Token revoked', {
                jti: decoded.jti,
                userId: decoded.userId,
                email: decoded.email,
                tokenType: decoded.tokenType,
                expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'unknown'
            });
            return true;
        }
        catch (error) {
            logger.error('Failed to revoke token', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
    /**
     * Create JWT service health check
     */
    healthCheck() {
        try {
            // Test token generation and verification
            const testPayload = {
                userId: 'health-check-user',
                email: 'healthcheck@test.com',
                role: 'test',
                permissions: ['health:check']
            };
            const testToken = this.generateAccessToken(testPayload, { expiresIn: '1m' });
            const verification = this.verifyToken(testToken);
            if (verification.isValid && verification.payload) {
                return {
                    status: 'healthy',
                    details: {
                        jwtConfigured: true,
                        tokenGeneration: 'working',
                        tokenVerification: 'working',
                        issuer: this.issuer,
                        audience: this.audience,
                        defaultExpiry: this.defaultExpiresIn,
                        refreshExpiry: this.refreshExpiresIn
                    }
                };
            }
            else {
                return {
                    status: 'unhealthy',
                    details: {
                        jwtConfigured: true,
                        tokenGeneration: 'working',
                        tokenVerification: 'failed',
                        error: verification.error
                    }
                };
            }
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                }
            };
        }
    }
}
exports.JWTService = JWTService;
// Export singleton instance
exports.jwtService = JWTService.getInstance();
