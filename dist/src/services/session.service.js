"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = exports.SessionService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const crypto_1 = require("crypto");
const environment_1 = require("../config/environment");
const logger_service_1 = require("../shared/logger.service");
const jwt_service_1 = require("../shared/jwt.service");
class SessionService {
    static instance;
    redis;
    sessionPrefix = 'session:';
    csrfPrefix = 'csrf:';
    userSessionsPrefix = 'user_sessions:';
    blacklistPrefix = 'blacklist:';
    constructor() {
        this.redis = new ioredis_1.default(environment_1.config.redis.url, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keepAlive: 30000,
            family: 4,
        });
        this.redis.on('error', error => {
            logger_service_1.logger.error('Redis connection error', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
        });
        this.redis.on('connect', () => {
            logger_service_1.logger.info('Connected to Redis for session management');
        });
    }
    static getInstance() {
        if (!SessionService.instance) {
            SessionService.instance = new SessionService();
        }
        return SessionService.instance;
    }
    async createSession(req, res, sessionData, options = {}) {
        try {
            const sessionId = this.generateSecureSessionId();
            const expirationMs = options.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
            const expiresAt = new Date(Date.now() + expirationMs);
            const deviceFingerprint = options.deviceFingerprint || this.createDeviceFingerprint(req);
            const userSessions = await this.getUserSessions(sessionData.userId);
            const maxSessions = options.maxConcurrentSessions || this.getMaxSessionsForRole(sessionData.role);
            if (userSessions.length >= maxSessions) {
                const oldestSession = userSessions[0];
                await this.destroySession(oldestSession);
                logger_service_1.logger.info('Removed oldest session due to concurrent limit', {
                    userId: sessionData.userId,
                    oldSessionId: oldestSession,
                    maxSessions,
                });
            }
            const session = {
                ...sessionData,
                deviceFingerprint,
                ipAddress: this.getClientIP(req),
                userAgent: req.get('User-Agent') || 'unknown',
                createdAt: new Date(),
                lastActivity: new Date(),
                expiresAt,
                isActive: true,
                concurrentSessions: [...userSessions, sessionId],
            };
            await this.redis.setex(`${this.sessionPrefix}${sessionId}`, Math.floor(expirationMs / 1000), JSON.stringify(session));
            await this.addUserSession(sessionData.userId, sessionId, expirationMs);
            const tokenPayload = {
                userId: sessionData.userId,
                email: sessionData.email,
                role: sessionData.role,
                permissions: sessionData.permissions,
                sessionId,
                deviceId: deviceFingerprint,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                schoolId: sessionData.schoolId,
            };
            const { accessToken, refreshToken } = jwt_service_1.jwtService.generateTokenPair(tokenPayload, {
                expiresIn: '15m',
                includeSessionData: true,
                includeDeviceInfo: true,
            });
            this.setSecureCookies(res, {
                sessionId,
                accessToken,
                refreshToken,
            }, options.rememberMe);
            const csrfToken = await this.generateCSRFToken(sessionId);
            res.setHeader('X-CSRF-Token', csrfToken.token);
            logger_service_1.logger.info('Session created successfully', {
                userId: sessionData.userId,
                sessionId,
                role: sessionData.role,
                deviceFingerprint,
                rememberMe: options.rememberMe,
                expiresAt: expiresAt.toISOString(),
            });
            return { sessionId, accessToken, refreshToken };
        }
        catch (error) {
            logger_service_1.logger.error('Failed to create session', undefined, {
                userId: sessionData.userId,
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Session creation failed');
        }
    }
    async validateSession(sessionId, req) {
        try {
            if (!sessionId) {
                return {
                    valid: false,
                    error: 'Session ID is required',
                    reason: 'invalid',
                };
            }
            const isBlacklisted = await this.redis.exists(`${this.blacklistPrefix}${sessionId}`);
            if (isBlacklisted) {
                return {
                    valid: false,
                    error: 'Session is blacklisted',
                    reason: 'invalid',
                };
            }
            const sessionData = await this.redis.get(`${this.sessionPrefix}${sessionId}`);
            if (!sessionData) {
                return {
                    valid: false,
                    error: 'Session not found',
                    reason: 'not_found',
                };
            }
            const session = JSON.parse(sessionData);
            if (!session.isActive) {
                return {
                    valid: false,
                    error: 'Session is inactive',
                    reason: 'inactive',
                };
            }
            if (new Date() > new Date(session.expiresAt)) {
                await this.destroySession(sessionId);
                return {
                    valid: false,
                    error: 'Session has expired',
                    reason: 'expired',
                };
            }
            if (req) {
                const currentFingerprint = this.createDeviceFingerprint(req);
                if (session.deviceFingerprint !== currentFingerprint) {
                    logger_service_1.logger.warn('Device fingerprint mismatch detected', {
                        sessionId,
                        userId: session.userId,
                        expected: session.deviceFingerprint,
                        received: currentFingerprint,
                    });
                    await this.destroySession(sessionId);
                    return {
                        valid: false,
                        error: 'Device fingerprint mismatch - possible session hijacking',
                        reason: 'fingerprint_mismatch',
                    };
                }
            }
            return {
                valid: true,
                session,
            };
        }
        catch (error) {
            logger_service_1.logger.error('Session validation error', undefined, {
                sessionId,
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            return {
                valid: false,
                error: 'Session validation failed',
                reason: 'invalid',
            };
        }
    }
    async updateSessionActivity(sessionId, metadata) {
        try {
            const sessionData = await this.redis.get(`${this.sessionPrefix}${sessionId}`);
            if (!sessionData) {
                return false;
            }
            const session = JSON.parse(sessionData);
            session.lastActivity = new Date();
            if (metadata) {
                if (metadata.userAgent)
                    session.userAgent = metadata.userAgent;
                if (metadata.ipAddress)
                    session.ipAddress = metadata.ipAddress;
            }
            const extendedExpiration = new Date(Date.now() + 60 * 60 * 1000);
            session.expiresAt = extendedExpiration;
            await this.redis.setex(`${this.sessionPrefix}${sessionId}`, Math.floor(60 * 60), JSON.stringify(session));
            return true;
        }
        catch (error) {
            logger_service_1.logger.error('Failed to update session activity', undefined, {
                sessionId,
                errorMessage: error instanceof Error
                    ? error instanceof Error
                        ? error.message
                        : String(error)
                    : 'Unknown error',
            });
            return false;
        }
    }
    async destroySession(sessionId) {
        try {
            const sessionData = await this.redis.get(`${this.sessionPrefix}${sessionId}`);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                await this.removeUserSession(session.userId, sessionId);
                await this.redis.setex(`${this.blacklistPrefix}${sessionId}`, 24 * 60 * 60, 'destroyed');
            }
            await this.redis.del(`${this.sessionPrefix}${sessionId}`);
            await this.redis.del(`${this.csrfPrefix}${sessionId}`);
            logger_service_1.logger.info('Session destroyed successfully', { sessionId });
            return true;
        }
        catch (error) {
            logger_service_1.logger.error('Failed to destroy session', undefined, {
                sessionId,
                errorMessage: error instanceof Error
                    ? error instanceof Error
                        ? error.message
                        : String(error)
                    : 'Unknown error',
            });
            return false;
        }
    }
    async destroyAllUserSessions(userId, excludeSessionId) {
        try {
            const userSessions = await this.getUserSessions(userId);
            let destroyedCount = 0;
            for (const sessionId of userSessions) {
                if (sessionId !== excludeSessionId) {
                    const success = await this.destroySession(sessionId);
                    if (success)
                        destroyedCount++;
                }
            }
            logger_service_1.logger.info('Destroyed user sessions', {
                userId,
                destroyedCount,
                excludedSession: excludeSessionId,
            });
            return destroyedCount;
        }
        catch (error) {
            logger_service_1.logger.error('Failed to destroy user sessions', undefined, {
                userId,
                errorMessage: error instanceof Error
                    ? error instanceof Error
                        ? error.message
                        : String(error)
                    : 'Unknown error',
            });
            return 0;
        }
    }
    async generateCSRFToken(sessionId) {
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        const csrfData = {
            token,
            sessionId,
            expiresAt,
        };
        await this.redis.setex(`${this.csrfPrefix}${sessionId}`, 60 * 60, JSON.stringify(csrfData));
        return csrfData;
    }
    async validateCSRFToken(sessionId, token) {
        try {
            const csrfData = await this.redis.get(`${this.csrfPrefix}${sessionId}`);
            if (!csrfData) {
                return false;
            }
            const csrf = JSON.parse(csrfData);
            return csrf.token === token && new Date() < new Date(csrf.expiresAt);
        }
        catch (error) {
            logger_service_1.logger.error('CSRF validation error', undefined, {
                sessionId,
                errorMessage: error instanceof Error
                    ? error instanceof Error
                        ? error.message
                        : String(error)
                    : 'Unknown error',
            });
            return false;
        }
    }
    setSecureCookies(res, tokens, rememberMe = false) {
        const isProduction = environment_1.config.server.nodeEnv === 'production';
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge,
            path: '/',
        };
        res.cookie('sessionId', tokens.sessionId, cookieOptions);
        res.cookie('accessToken', tokens.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        });
        res.cookie('refreshToken', tokens.refreshToken, cookieOptions);
    }
    clearAuthCookies(res) {
        const cookieOptions = {
            httpOnly: true,
            secure: environment_1.config.server.nodeEnv === 'production',
            sameSite: 'strict',
            path: '/',
        };
        res.clearCookie('sessionId', cookieOptions);
        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);
    }
    generateSecureSessionId() {
        const timestamp = Date.now().toString();
        const randomData = (0, crypto_1.randomBytes)(32).toString('hex');
        return (0, crypto_1.createHash)('sha256')
            .update(timestamp + randomData)
            .digest('hex');
    }
    createDeviceFingerprint(req) {
        const userAgent = req.get('User-Agent') || '';
        const acceptLanguage = req.get('Accept-Language') || '';
        const acceptEncoding = req.get('Accept-Encoding') || '';
        const ip = this.getClientIP(req);
        const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${ip}`;
        return (0, crypto_1.createHash)('sha256').update(fingerprintData).digest('hex');
    }
    getClientIP(req) {
        return (req.headers['x-forwarded-for']?.split(',')[0] ||
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            '127.0.0.1');
    }
    getMaxSessionsForRole(role) {
        const limits = {
            student: 3,
            parent: 5,
            teacher: 3,
            kitchen_staff: 1,
            vendor: 2,
            admin: 2,
        };
        return limits[role] || 3;
    }
    async getUserSessions(userId) {
        try {
            const sessionsData = await this.redis.get(`${this.userSessionsPrefix}${userId}`);
            return sessionsData ? JSON.parse(sessionsData) : [];
        }
        catch (error) {
            logger_service_1.logger.error('Failed to get user sessions', undefined, {
                userId,
                errorMessage: error instanceof Error
                    ? error instanceof Error
                        ? error.message
                        : String(error)
                    : 'Unknown error',
            });
            return [];
        }
    }
    async addUserSession(userId, sessionId, ttlMs) {
        try {
            const sessions = await this.getUserSessions(userId);
            sessions.push(sessionId);
            await this.redis.setex(`${this.userSessionsPrefix}${userId}`, Math.floor(ttlMs / 1000), JSON.stringify(sessions));
        }
        catch (error) {
            logger_service_1.logger.error('Failed to add user session', undefined, {
                userId,
                sessionId,
                errorMessage: error instanceof Error
                    ? error instanceof Error
                        ? error.message
                        : String(error)
                    : 'Unknown error',
            });
        }
    }
    async removeUserSession(userId, sessionId) {
        try {
            const sessions = await this.getUserSessions(userId);
            const updatedSessions = sessions.filter(id => id !== sessionId);
            if (updatedSessions.length > 0) {
                await this.redis.setex(`${this.userSessionsPrefix}${userId}`, 24 * 60 * 60, JSON.stringify(updatedSessions));
            }
            else {
                await this.redis.del(`${this.userSessionsPrefix}${userId}`);
            }
        }
        catch (error) {
            logger_service_1.logger.error('Failed to remove user session', undefined, {
                userId,
                sessionId,
                errorMessage: error instanceof Error
                    ? error instanceof Error
                        ? error.message
                        : String(error)
                    : 'Unknown error',
            });
        }
    }
    async getSessionStats() {
        try {
            const keys = await this.redis.keys(`${this.sessionPrefix}*`);
            const sessions = [];
            for (const key of keys.slice(0, 100)) {
                const sessionData = await this.redis.get(key);
                if (sessionData) {
                    sessions.push(JSON.parse(sessionData));
                }
            }
            const sessionsByRole = {};
            let totalDuration = 0;
            sessions.forEach(session => {
                sessionsByRole[session.role] = (sessionsByRole[session.role] || 0) + 1;
                const duration = new Date(session.lastActivity).getTime() - new Date(session.createdAt).getTime();
                totalDuration += duration;
            });
            return {
                totalActiveSessions: sessions.length,
                sessionsByRole,
                averageSessionDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
            };
        }
        catch (error) {
            logger_service_1.logger.error('Failed to get session stats', undefined, {
                errorMessage: error instanceof Error
                    ? error instanceof Error
                        ? error.message
                        : String(error)
                    : 'Unknown error',
            });
            return {
                totalActiveSessions: 0,
                sessionsByRole: {},
                averageSessionDuration: 0,
            };
        }
    }
    async healthCheck() {
        try {
            await this.redis.ping();
            const testSessionId = 'health-check-session';
            await this.redis.setex(`${this.sessionPrefix}${testSessionId}`, 60, JSON.stringify({ test: true }));
            const retrieved = await this.redis.get(`${this.sessionPrefix}${testSessionId}`);
            await this.redis.del(`${this.sessionPrefix}${testSessionId}`);
            if (!retrieved) {
                throw new Error('Session storage test failed');
            }
            return {
                status: 'healthy',
                details: {
                    redis: 'connected',
                    sessionStorage: 'working',
                    timestamp: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: error instanceof Error
                        ? error instanceof Error
                            ? error.message
                            : String(error)
                        : 'Unknown error',
                    timestamp: new Date().toISOString(),
                },
            };
        }
    }
}
exports.SessionService = SessionService;
exports.sessionService = SessionService.getInstance();
//# sourceMappingURL=session.service.js.map