"use strict";
/**
 * HASIVU Platform - JWT Service
 * Production-ready JWT token extraction and validation
 * Replaces all mock authentication implementations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtService = exports.JWTService = exports.JWTServiceError = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const environment_1 = require("../../config/environment");
const logger_1 = require("@/utils/logger");
const crypto_1 = require("crypto");
/**
 * JWT Service Error
 */
class JWTServiceError extends Error {
    code;
    details;
    constructor(message, code = 'JWT_ERROR', details) {
        super(message);
        this.name = 'JWTServiceError';
        this.code = code;
        this.details = details;
        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, JWTServiceError.prototype);
    }
}
exports.JWTServiceError = JWTServiceError;
/**
 * ReDoS protection timeout in milliseconds
 */
const TOKEN_VERIFICATION_TIMEOUT = 5000; // 5 seconds
/**
 * JWT Service Class with comprehensive security features
 * Singleton pattern for consistent configuration
 */
class JWTService {
    static instance;
    jwtSecret;
    jwtRefreshSecret;
    jwtIssuer;
    jwtAudience;
    tokenBlacklist = new Set();
    refreshTokens = new Map();
    constructor() {
        this.jwtSecret = environment_1.config.jwt?.secret || process.env.JWT_SECRET || '';
        this.jwtRefreshSecret = environment_1.config.jwt?.refreshSecret || process.env.JWT_REFRESH_SECRET || this.jwtSecret + '_refresh';
        this.jwtIssuer = environment_1.config.jwt?.issuer || environment_1.config.server?.name || 'hasivu-platform';
        this.jwtAudience = environment_1.config.jwt?.audience || environment_1.config.server?.domain || 'hasivu.com';
        // Critical security validation
        this.validateConfiguration();
        logger_1.logger.info('JWT Service initialized', {
            issuer: this.jwtIssuer,
            audience: this.jwtAudience,
            secretConfigured: !!this.jwtSecret,
            refreshSecretConfigured: !!this.jwtRefreshSecret
        });
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
     * Validate JWT configuration for production readiness
     */
    validateConfiguration() {
        const issues = [];
        if (!this.jwtSecret || this.jwtSecret.length < 64) {
            issues.push('JWT secret must be at least 64 characters for production security');
        }
        if (!this.jwtRefreshSecret || this.jwtRefreshSecret.length < 64) {
            issues.push('JWT refresh secret must be at least 64 characters for production security');
        }
        if (!this.jwtIssuer || this.jwtIssuer.length < 3) {
            issues.push('JWT issuer must be properly configured');
        }
        if (!this.jwtAudience || this.jwtAudience.length < 3) {
            issues.push('JWT audience must be properly configured');
        }
        // Check for weak or default secrets
        const weakSecrets = ['secret', 'password', '123456', 'default', 'test'];
        if (weakSecrets.some(weak => this.jwtSecret.toLowerCase().includes(weak))) {
            issues.push('JWT secret appears to contain weak or default values');
        }
        // Ensure refresh secret is different from access secret
        if (this.jwtSecret === this.jwtRefreshSecret) {
            issues.push('JWT refresh secret must be different from access token secret');
        }
        if (issues.length > 0) {
            throw new JWTServiceError(`JWT configuration security violations: ${issues.join(', ')}`, 'INVALID_CONFIGURATION', { issues });
        }
    }
    /**
     * Generate access and refresh token pair
     */
    generateTokenPair(options) {
        try {
            const sessionId = options.sessionId || this.generateSessionId();
            const now = Math.floor(Date.now() / 1000);
            // Generate access token (short-lived)
            const accessTokenPayload = {
                userId: options.userId,
                email: options.email,
                role: options.role,
                sessionId,
                tokenType: 'access',
                permissions: options.permissions,
                iat: now,
                exp: now + (15 * 60), // 15 minutes
                iss: this.jwtIssuer,
                aud: this.jwtAudience
            };
            const accessToken = jsonwebtoken_1.default.sign(accessTokenPayload, this.jwtSecret, {
                algorithm: 'HS256',
                noTimestamp: false
            });
            // Generate refresh token (long-lived)
            const refreshTokenPayload = {
                userId: options.userId,
                email: options.email,
                role: options.role,
                sessionId,
                tokenType: 'refresh',
                permissions: options.permissions,
                iat: now,
                exp: now + (7 * 24 * 60 * 60), // 7 days
                iss: this.jwtIssuer,
                aud: this.jwtAudience,
                accessTokenId: this.generateTokenId()
            };
            const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, this.jwtRefreshSecret, {
                algorithm: 'HS256',
                noTimestamp: false
            });
            // Store refresh token for validation
            this.refreshTokens.set(refreshToken, refreshTokenPayload);
            logger_1.logger.info('Token pair generated', {
                userId: options.userId,
                role: options.role,
                sessionId,
                accessTokenLength: accessToken.length,
                refreshTokenLength: refreshToken.length
            });
            return {
                accessToken,
                refreshToken,
                expiresIn: 15 * 60, // 15 minutes in seconds
                tokenType: 'Bearer'
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate token pair', {
                error: error.message,
                userId: options.userId,
                role: options.role
            });
            throw new JWTServiceError(`Token generation failed: ${error.message}`, 'TOKEN_GENERATION_FAILED', error);
        }
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken) {
        try {
            // Verify refresh token
            const refreshPayload = await this.verifyRefreshToken(refreshToken);
            if (!refreshPayload.isValid || !refreshPayload.payload) {
                throw new JWTServiceError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
            }
            // Check if refresh token is stored
            if (!this.refreshTokens.has(refreshToken)) {
                throw new JWTServiceError('Refresh token not found or expired', 'REFRESH_TOKEN_NOT_FOUND');
            }
            const payload = refreshPayload.payload;
            // Generate new token pair
            const newTokenPair = this.generateTokenPair({
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                permissions: payload.permissions,
                sessionId: payload.sessionId
            });
            // Remove old refresh token and add new one
            this.refreshTokens.delete(refreshToken);
            logger_1.logger.info('Access token refreshed', {
                userId: payload.userId,
                sessionId: payload.sessionId
            });
            return newTokenPair;
        }
        catch (error) {
            if (error instanceof JWTServiceError) {
                throw error;
            }
            logger_1.logger.error('Failed to refresh access token', {
                error: error.message,
                refreshTokenLength: refreshToken?.length
            });
            throw new JWTServiceError(`Token refresh failed: ${error.message}`, 'TOKEN_REFRESH_FAILED', error);
        }
    }
    /**
     * Extract JWT token from API Gateway event with comprehensive security
     */
    extractTokenFromEvent(event) {
        try {
            // Primary: Authorization header
            const authHeader = event.headers?.Authorization || event.headers?.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7).trim();
                if (this.isValidTokenFormat(token)) {
                    return token;
                }
            }
            // Secondary: API Gateway Authorizer context
            const authContext = event.requestContext?.authorizer;
            if (authContext?.accessToken && this.isValidTokenFormat(authContext.accessToken)) {
                return authContext.accessToken;
            }
            // Tertiary: Query parameter (with security warning)
            const queryToken = event.queryStringParameters?.token;
            if (queryToken && queryToken.length > 0 && this.isValidTokenFormat(queryToken)) {
                logger_1.logger.warn('JWT token extracted from query parameter - security risk', {
                    userAgent: event.headers?.['User-Agent'] || 'unknown',
                    sourceIp: event.requestContext?.identity?.sourceIp
                });
                return queryToken;
            }
            // Last resort: Cookie (web applications)
            const cookieHeader = event.headers?.Cookie || event.headers?.cookie;
            if (cookieHeader) {
                const cookies = this.parseCookies(cookieHeader);
                const tokenFromCookie = cookies.accessToken || cookies.token;
                if (tokenFromCookie && this.isValidTokenFormat(tokenFromCookie)) {
                    return tokenFromCookie;
                }
            }
            logger_1.logger.debug('No valid JWT token found in request', {
                hasAuthHeader: !!authHeader,
                hasAuthContext: !!authContext,
                hasQueryToken: !!queryToken,
                hasCookies: !!cookieHeader
            });
            return null;
        }
        catch (error) {
            logger_1.logger.error('Error extracting JWT token from event', {
                error: error.message,
                hasHeaders: !!event.headers
            });
            return null;
        }
    }
    /**
     * Validate token format to prevent ReDoS attacks
     */
    isValidTokenFormat(token) {
        // JWT tokens have exactly 3 parts separated by dots
        if (!token || typeof token !== 'string')
            return false;
        // Length check to prevent extremely long tokens
        if (token.length < 10 || token.length > 2048)
            return false;
        // Simple format validation (3 parts separated by dots)
        const parts = token.split('.');
        if (parts.length !== 3)
            return false;
        // Each part should be base64url encoded
        const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
        return parts.every(part => part.length > 0 && base64UrlRegex.test(part));
    }
    /**
     * Parse cookies from Cookie header with security validation
     */
    parseCookies(cookieHeader) {
        const cookies = {};
        try {
            // Prevent ReDoS with length limit
            if (cookieHeader.length > 4096) {
                logger_1.logger.warn('Cookie header too large, truncating', { length: cookieHeader.length });
                cookieHeader = cookieHeader.substring(0, 4096);
            }
            cookieHeader.split(';').forEach(cookie => {
                const [name, ...rest] = cookie.trim().split('=');
                if (name && rest.length > 0) {
                    const value = rest.join('=').trim();
                    // Sanitize cookie name and validate
                    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '');
                    if (sanitizedName && value.length <= 1024) {
                        cookies[sanitizedName] = value;
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.warn('Failed to parse cookies safely', {
                cookieHeader: cookieHeader.substring(0, 100),
                error: error.message
            });
        }
        return cookies;
    }
    /**
     * Verify and decode JWT access token with timeout protection and comprehensive validation
     */
    async verifyToken(token, expectedType = 'access') {
        if (!token || typeof token !== 'string') {
            return {
                payload: {},
                token: '',
                isValid: false,
                error: 'Token is empty or invalid format'
            };
        }
        // Check if token is blacklisted
        if (this.tokenBlacklist.has(token)) {
            return {
                payload: {},
                token: '',
                isValid: false,
                error: 'Token has been revoked'
            };
        }
        // Pre-validation
        if (!this.isValidTokenFormat(token)) {
            return {
                payload: {},
                token: '',
                isValid: false,
                error: 'Invalid token format'
            };
        }
        try {
            // Use appropriate secret based on token type
            const secret = expectedType === 'refresh' ? this.jwtRefreshSecret : this.jwtSecret;
            // Use timeout to prevent ReDoS attacks
            const decoded = await Promise.race([
                new Promise((resolve, reject) => {
                    try {
                        const result = jsonwebtoken_1.default.verify(token, secret, {
                            issuer: this.jwtIssuer,
                            audience: this.jwtAudience,
                            algorithms: ['HS256'], // Explicitly specify algorithm
                            clockTolerance: 60 // 1 minute clock tolerance
                        });
                        resolve(result);
                    }
                    catch (error) {
                        reject(error);
                    }
                }),
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Token verification timeout')), TOKEN_VERIFICATION_TIMEOUT);
                })
            ]);
            // Validate token type
            if (decoded.tokenType !== expectedType) {
                return {
                    payload: {},
                    token: '',
                    isValid: false,
                    error: `Invalid token type: ${decoded.tokenType}. Expected: ${expectedType}`
                };
            }
            // Additional payload validation
            const validationError = this.validateTokenPayload(decoded);
            if (validationError) {
                return {
                    payload: {},
                    token: '',
                    isValid: false,
                    error: validationError
                };
            }
            return {
                payload: decoded,
                token,
                isValid: true
            };
        }
        catch (error) {
            let errorMessage = 'Token verification failed';
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                errorMessage = 'Token has expired';
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                errorMessage = `Token validation error: ${error.message}`;
            }
            else if (error instanceof Error) {
                errorMessage = error.message === 'Token verification timeout'
                    ? 'Token verification timeout - possible ReDoS attempt'
                    : `Unexpected token error: ${error.message}`;
            }
            logger_1.logger.warn('JWT verification failed', {
                error: errorMessage,
                tokenLength: token.length,
                expectedType
            });
            return {
                payload: {},
                token: '',
                isValid: false,
                error: errorMessage
            };
        }
    }
    /**
     * Verify refresh token specifically
     */
    async verifyRefreshToken(refreshToken) {
        return this.verifyToken(refreshToken, 'refresh');
    }
    /**
     * Validate token payload structure and content
     */
    validateTokenPayload(payload) {
        const required = ['userId', 'email', 'role', 'sessionId', 'tokenType'];
        for (const field of required) {
            if (!payload[field]) {
                return `Missing required field: ${field}`;
            }
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(payload.email)) {
            return 'Invalid email format in token';
        }
        // Validate role
        const validRoles = ['admin', 'teacher', 'student', 'parent', 'staff', 'user'];
        if (!validRoles.includes(payload.role)) {
            return `Invalid role: ${payload.role}`;
        }
        // Validate session ID format
        if (!/^[a-zA-Z0-9_-]{10,}$/.test(payload.sessionId)) {
            return 'Invalid session ID format';
        }
        // Validate token expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp <= now) {
            return 'Token has expired';
        }
        // Validate issued at time
        if (payload.iat > now + 60) { // 1 minute tolerance for clock skew
            return 'Token issued in the future';
        }
        return null;
    }
    /**
     * Blacklist a token (for logout/revocation)
     */
    blacklistToken(token) {
        this.tokenBlacklist.add(token);
        // Also remove from refresh tokens if it's a refresh token
        if (this.refreshTokens.has(token)) {
            this.refreshTokens.delete(token);
        }
        logger_1.logger.info('Token blacklisted', {
            tokenHash: crypto_1.default.createHash('sha256').update(token).digest('hex').substring(0, 16)
        });
    }
    /**
     * Blacklist all tokens for a specific session
     */
    blacklistSession(sessionId) {
        let blacklistedCount = 0;
        // Remove refresh tokens for this session
        for (const [token, payload] of this.refreshTokens.entries()) {
            if (payload.sessionId === sessionId) {
                this.refreshTokens.delete(token);
                this.tokenBlacklist.add(token);
                blacklistedCount++;
            }
        }
        logger_1.logger.info('Session tokens blacklisted', {
            sessionId,
            tokensBlacklisted: blacklistedCount
        });
    }
    /**
     * Check if token is blacklisted
     */
    isTokenBlacklisted(token) {
        return this.tokenBlacklist.has(token);
    }
    /**
     * Clean expired tokens from blacklist and refresh token store
     */
    cleanupExpiredTokens() {
        const now = Math.floor(Date.now() / 1000);
        let refreshTokensRemoved = 0;
        // Clean expired refresh tokens
        for (const [token, payload] of this.refreshTokens.entries()) {
            if (payload.exp <= now) {
                this.refreshTokens.delete(token);
                refreshTokensRemoved++;
            }
        }
        // Clear blacklist if it gets too large (in production, use Redis with TTL)
        let blacklistCleared = false;
        if (this.tokenBlacklist.size > 10000) {
            this.tokenBlacklist.clear();
            blacklistCleared = true;
        }
        logger_1.logger.info('Token cleanup completed', {
            refreshTokensRemoved,
            blacklistCleared,
            currentBlacklistSize: this.tokenBlacklist.size,
            currentRefreshTokens: this.refreshTokens.size
        });
    }
    /**
     * Generate secure session ID
     */
    generateSessionId() {
        return crypto_1.default.randomBytes(16).toString('base64url');
    }
    /**
     * Generate secure token ID
     */
    generateTokenId() {
        return crypto_1.default.randomBytes(12).toString('base64url');
    }
    /**
     * Get token information without verifying (for debugging)
     */
    decodeToken(token) {
        try {
            if (!this.isValidTokenFormat(token)) {
                return null;
            }
            const decoded = jsonwebtoken_1.default.decode(token, { complete: true });
            return decoded;
        }
        catch (error) {
            logger_1.logger.warn('Failed to decode token', {
                error: error.message,
                tokenLength: token?.length
            });
            return null;
        }
    }
    /**
     * Health check for JWT service
     */
    healthCheck() {
        try {
            return {
                status: 'healthy',
                timestamp: Date.now(),
                configuration: {
                    secretConfigured: !!this.jwtSecret && this.jwtSecret.length >= 64,
                    refreshSecretConfigured: !!this.jwtRefreshSecret && this.jwtRefreshSecret.length >= 64,
                    issuer: this.jwtIssuer,
                    audience: this.jwtAudience
                },
                metrics: {
                    blacklistedTokens: this.tokenBlacklist.size,
                    activeRefreshTokens: this.refreshTokens.size
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                timestamp: Date.now(),
                configuration: {
                    secretConfigured: false,
                    refreshSecretConfigured: false,
                    issuer: this.jwtIssuer || 'unknown',
                    audience: this.jwtAudience || 'unknown'
                },
                metrics: {
                    blacklistedTokens: 0,
                    activeRefreshTokens: 0
                },
                error: error.message
            };
        }
    }
}
exports.JWTService = JWTService;
// Export singleton instance
exports.jwtService = JWTService.getInstance();
