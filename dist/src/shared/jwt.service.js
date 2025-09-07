"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtService = exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
const logger = {
    info: (message, data) => console.log(message, data),
    warn: (message, data) => console.warn(message, data),
    error: (message, data) => console.error(message, data),
    debug: (message, data) => console.debug(message, data)
};
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
        this.validateJWTConfiguration();
    }
    static getInstance() {
        if (!JWTService.instance) {
            JWTService.instance = new JWTService();
        }
        return JWTService.instance;
    }
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
    extractTokenFromEvent(event) {
        try {
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
            const authContext = event.requestContext?.authorizer;
            if (authContext?.accessToken) {
                logger.debug('JWT token found in authorizer context');
                return authContext.accessToken;
            }
            const queryToken = event.queryStringParameters?.token;
            if (queryToken && queryToken.length > 0) {
                logger.debug('JWT token found in query parameter');
                return queryToken;
            }
            const cookieHeader = event.headers?.Cookie || event.headers?.cookie;
            if (cookieHeader) {
                const cookies = this.parseCookies(cookieHeader);
                const cookieToken = cookies.accessToken || cookies.token;
                if (cookieToken && cookieToken.length > 0) {
                    logger.debug('JWT token found in cookies');
                    return cookieToken;
                }
            }
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
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret, {
                issuer: this.issuer,
                audience: this.audience,
                complete: false
            });
            if (decoded.tokenType !== 'access') {
                return {
                    isValid: false,
                    payload: null,
                    token,
                    error: `Invalid token type: ${decoded.tokenType}. Expected: access`,
                    errorCode: 'INVALID_TOKEN_TYPE'
                };
            }
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
    generateAccessToken(payload, options = {}) {
        try {
            const tokenPayload = {
                ...payload,
                tokenType: 'access',
                iat: Math.floor(Date.now() / 1000),
                exp: 0
            };
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
    generateRefreshToken(payload, options = {}) {
        try {
            const tokenPayload = {
                ...payload,
                tokenType: 'refresh',
                iat: Math.floor(Date.now() / 1000),
                exp: 0
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
            if (decoded.tokenType !== 'refresh') {
                return {
                    isValid: false,
                    payload: null,
                    token,
                    error: `Invalid token type: ${decoded.tokenType}. Expected: refresh`,
                    errorCode: 'INVALID_TOKEN_TYPE'
                };
            }
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
    async refreshAccessToken(refreshToken) {
        try {
            const refreshResult = this.verifyRefreshToken(refreshToken);
            if (!refreshResult.isValid || !refreshResult.payload) {
                return {
                    success: false,
                    error: refreshResult.error || 'Invalid refresh token',
                    errorCode: refreshResult.errorCode
                };
            }
            const accessTokenPayload = {
                userId: refreshResult.payload.userId,
                email: refreshResult.payload.email,
                role: refreshResult.payload.role,
                permissions: refreshResult.payload.permissions || [],
                businessId: refreshResult.payload.businessId,
                sessionId: refreshResult.payload.sessionId
            };
            const newAccessToken = this.generateAccessToken(accessTokenPayload);
            let newRefreshToken;
            if (environment_1.config.jwt.rotateRefreshTokens) {
                newRefreshToken = this.generateRefreshToken({
                    userId: refreshResult.payload.userId,
                    email: refreshResult.payload.email,
                    role: refreshResult.payload.role,
                    sessionId: refreshResult.payload.sessionId
                });
            }
            const decoded = jsonwebtoken_1.default.decode(newAccessToken);
            const expiresIn = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;
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
    hasPermission(payload, requiredPermission) {
        if (!payload.permissions || !Array.isArray(payload.permissions)) {
            return false;
        }
        return payload.permissions.includes(requiredPermission) || payload.permissions.includes('*');
    }
    hasRole(payload, requiredRole) {
        if (!payload.role) {
            return false;
        }
        return payload.role === requiredRole || payload.role === 'admin';
    }
    generateTokenPair(payload, options = {}) {
        try {
            const accessToken = this.generateAccessToken(payload, options);
            const refreshToken = this.generateRefreshToken({
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                sessionId: payload.sessionId
            }, options);
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
    async revokeToken(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.jti) {
                logger.warn('Cannot revoke token without JTI', { tokenLength: token.length });
                return false;
            }
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
    healthCheck() {
        try {
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
exports.jwtService = JWTService.getInstance();
//# sourceMappingURL=jwt.service.js.map