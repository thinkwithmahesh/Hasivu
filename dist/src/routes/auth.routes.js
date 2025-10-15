"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const database_service_1 = require("../services/database.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.authRouter = router;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
}
router.post('/register', async (req, res) => {
    try {
        const { email, password, passwordConfirm, firstName, lastName, role } = req.body;
        if (!email || !password || !passwordConfirm || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided',
            });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }
        if (password !== passwordConfirm) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match',
            });
        }
        const passwordValidation = auth_service_1.authService.validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Password validation failed',
                errors: passwordValidation.errors || [passwordValidation.message],
            });
        }
        const existingUser = await database_service_1.DatabaseService.client.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists',
            });
        }
        const passwordHash = await auth_service_1.authService.hashPassword(password);
        const user = await database_service_1.DatabaseService.transaction(async (prisma) => {
            const newUser = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    firstName,
                    lastName,
                    role: role || 'parent',
                },
            });
            const userRole = await prisma.role.findUnique({
                where: { name: role || 'parent' },
            });
            if (userRole) {
                await prisma.userRoleAssignment.create({
                    data: {
                        userId: newUser.id,
                        roleId: userRole.id,
                    },
                });
            }
            return newUser;
        });
        logger_1.logger.info(`User registered successfully: ${user.email}`);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Registration error:', undefined, {
            errorMessage: error instanceof Error
                ? error
                : new Error(String(error)) instanceof Error
                    ? error instanceof Error
                        ? error
                        : new Error(String(error)).message
                    : String(error instanceof Error ? error : new Error(String(error))),
        });
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Registration failed',
        });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }
        const authResult = await auth_service_1.authService.authenticate({
            email,
            password,
            rememberMe: rememberMe || false,
            userAgent: req.headers['user-agent'] || 'unknown',
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        });
        if (!authResult.success) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }
        if (authResult.sessionId) {
            await auth_service_1.authService.updateSessionActivity(authResult.sessionId);
        }
        if (!authResult.tokens) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate authentication tokens',
            });
        }
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
        };
        res.cookie('accessToken', authResult.tokens.accessToken, cookieOptions);
        res.cookie('refreshToken', authResult.tokens.refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        logger_1.logger.info(`User logged in successfully: ${email}`);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: authResult.user,
            tokens: authResult.tokens,
        });
    }
    catch (error) {
        logger_1.logger.error('Login error:', undefined, {
            errorMessage: error instanceof Error
                ? error
                : new Error(String(error)) instanceof Error
                    ? error instanceof Error
                        ? error
                        : new Error(String(error)).message
                    : String(error instanceof Error ? error : new Error(String(error))),
        });
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Login failed',
        });
    }
});
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required',
            });
        }
        const result = await auth_service_1.authService.refreshToken(refreshToken);
        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            accessToken: result.accessToken,
        });
    }
    catch (error) {
        logger_1.logger.error('Token refresh error:', undefined, {
            errorMessage: error instanceof Error
                ? error
                : new Error(String(error)) instanceof Error
                    ? error instanceof Error
                        ? error
                        : new Error(String(error)).message
                    : String(error instanceof Error ? error : new Error(String(error))),
        });
        res.status(401).json({
            success: false,
            message: error instanceof Error ? error.message : 'Token refresh failed',
        });
    }
});
router.post('/validate-password', (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required',
            });
        }
        const validation = auth_service_1.authService.validatePassword(password);
        res.status(200).json({
            success: true,
            validation,
        });
    }
    catch (error) {
        logger_1.logger.error('Password validation error:', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Validation failed',
        });
    }
});
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }
        const user = await database_service_1.DatabaseService.client.user.findUnique({
            where: { email },
        });
        res.status(200).json({
            success: true,
            message: 'If an account with this email exists, a password reset link has been sent',
        });
        if (user) {
            logger_1.logger.info(`Password reset requested for: ${email}`);
        }
    }
    catch (error) {
        logger_1.logger.error('Forgot password error:', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Request failed',
        });
    }
});
//# sourceMappingURL=auth.routes.js.map