"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const database_service_1 = require("../services/database.service");
const logger_1 = require("../utils/logger");
const error_middleware_1 = require("../middleware/error.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const environment_1 = require("../config/environment");
const router = (0, express_1.Router)();
exports.authRouter = router;
router.post('/register', (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { email, password, passwordConfirm, firstName, lastName, role = 'parent' } = req.body;
    if (!email || !password || !firstName || !lastName) {
        throw (0, error_middleware_1.createValidationError)('All required fields must be provided');
    }
    if (password !== passwordConfirm) {
        throw (0, error_middleware_1.createValidationError)('Passwords do not match');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw (0, error_middleware_1.createValidationError)('Invalid email format');
    }
    const passwordValidation = auth_service_1.authService.validatePassword(password);
    if (!passwordValidation.valid) {
        throw (0, error_middleware_1.createValidationError)(`Password validation failed: ${passwordValidation.message}`);
    }
    const existingUser = await database_service_1.DatabaseService.client.user.findUnique({
        where: { email: email.toLowerCase() }
    });
    if (existingUser) {
        throw (0, error_middleware_1.createConflictError)('User with this email already exists');
    }
    const passwordHash = await auth_service_1.authService.hashPassword(password);
    const user = await database_service_1.DatabaseService.transaction(async (prisma) => {
        const newUser = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                firstName,
                lastName,
                role,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true
            }
        });
        return newUser;
    });
    logger_1.logger.info('User registered successfully', { userId: user.id, email: user.email, role });
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        }
    });
}));
router.post('/login', (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { email, password, rememberMe = false } = req.body;
    if (!email || !password) {
        throw (0, error_middleware_1.createValidationError)('Email and password are required');
    }
    const authResult = await auth_service_1.authService.authenticate({
        email: email.toLowerCase(),
        password,
        rememberMe,
        userAgent: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || 'Unknown'
    });
    await auth_service_1.authService.updateSessionActivity(authResult.sessionId, {
        lastActivity: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });
    const cookieOptions = {
        httpOnly: true,
        secure: environment_1.config.server.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    };
    res.cookie('accessToken', authResult.tokens.accessToken, cookieOptions);
    res.cookie('refreshToken', authResult.tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(200).json({
        success: true,
        message: 'Login successful',
        user: authResult.user,
        tokens: authResult.tokens
    });
}));
router.post('/refresh', (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    const tokenFromCookie = req.cookies?.refreshToken;
    const token = refreshToken || tokenFromCookie;
    if (!token) {
        throw (0, error_middleware_1.createValidationError)('Refresh token is required');
    }
    const result = await auth_service_1.authService.refreshToken(token);
    if (tokenFromCookie) {
        const cookieOptions = {
            httpOnly: true,
            secure: environment_1.config.server.nodeEnv === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        };
        res.cookie('accessToken', result.accessToken, cookieOptions);
    }
    res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: result.accessToken
    });
}));
router.post('/logout', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    await auth_service_1.authService.logout(req.sessionId);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
}));
router.post('/logout-all', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    await auth_service_1.authService.logoutAll(req.userId);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({
        success: true,
        message: 'Logged out from all sessions successfully'
    });
}));
router.get('/me', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.userId;
    const user = await database_service_1.DatabaseService.client.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            phone: true,
            timezone: true,
            language: true,
            preferences: true,
            createdAt: true,
            updatedAt: true
        }
    });
    if (!user) {
        throw (0, error_middleware_1.createValidationError)('User not found');
    }
    const permissions = [];
    const roles = [user.role];
    res.status(200).json({
        success: true,
        user: {
            ...user,
            permissions,
            roles
        },
        sessionId: req.sessionId
    });
}));
router.patch('/profile', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.userId;
    const { firstName, lastName, phoneNumber, timezone, language, preferences } = req.body;
    const updatedUser = await database_service_1.DatabaseService.client.user.update({
        where: { id: userId },
        data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(phoneNumber && { phone: phoneNumber }),
            ...(timezone && { timezone }),
            ...(language && { language }),
            ...(preferences && { preferences }),
            updatedAt: new Date()
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            timezone: true,
            language: true,
            preferences: true,
            updatedAt: true
        }
    });
    logger_1.logger.info('User profile updated', { userId, changes: Object.keys(req.body) });
    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
    });
}));
router.patch('/change-password', auth_middleware_1.authMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.userId;
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;
    if (!currentPassword || !newPassword || !newPasswordConfirm) {
        throw (0, error_middleware_1.createValidationError)('All password fields are required');
    }
    if (newPassword !== newPasswordConfirm) {
        throw (0, error_middleware_1.createValidationError)('New passwords do not match');
    }
    const passwordValidation = auth_service_1.authService.validatePassword(newPassword);
    if (!passwordValidation.valid) {
        throw (0, error_middleware_1.createValidationError)(`Password validation failed: ${passwordValidation.message}`);
    }
    const user = await database_service_1.DatabaseService.client.user.findUnique({
        where: { id: userId }
    });
    if (!user) {
        throw (0, error_middleware_1.createValidationError)('User not found');
    }
    const isCurrentPasswordValid = await auth_service_1.authService.verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
        throw (0, error_middleware_1.createValidationError)('Current password is incorrect');
    }
    const newPasswordHash = await auth_service_1.authService.hashPassword(newPassword);
    await database_service_1.DatabaseService.client.user.update({
        where: { id: userId },
        data: {
            passwordHash: newPasswordHash,
            updatedAt: new Date()
        }
    });
    logger_1.logger.info('Password changed', { userId, timestamp: new Date() });
    await auth_service_1.authService.logoutAll(userId);
    res.status(200).json({
        success: true,
        message: 'Password changed successfully'
    });
}));
router.get('/status', auth_middleware_1.optionalAuthMiddleware, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (req.userId) {
        res.status(200).json({
            authenticated: true,
            userId: req.userId,
            sessionId: req.sessionId
        });
    }
    else {
        res.status(200).json({
            authenticated: false
        });
    }
}));
router.post('/forgot-password', (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw (0, error_middleware_1.createValidationError)('Email is required');
    }
    const user = await database_service_1.DatabaseService.client.user.findUnique({
        where: { email: email.toLowerCase() }
    });
    res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent'
    });
    if (user) {
        logger_1.logger.info('Password reset requested', { userId: user.id, email: user.email });
    }
}));
router.post('/validate-password', (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { password } = req.body;
    if (!password) {
        throw (0, error_middleware_1.createValidationError)('Password is required');
    }
    const validation = auth_service_1.authService.validatePassword(password);
    res.status(200).json({
        success: true,
        validation
    });
}));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map