/**
 * HASIVU Platform - Authentication Routes
 * User authentication, registration, and password management endpoints
 */

import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { DatabaseService } from '../services/database.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Register new user
 * POST /auth/register
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, passwordConfirm, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password || !passwordConfirm || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Check password match
    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // Validate password strength
    const passwordValidation = authService.validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed',
        errors: passwordValidation.errors || [passwordValidation.message],
      });
    }

    // Check if user already exists
    const existingUser = await DatabaseService.client.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Create user in transaction
    const user = await DatabaseService.transaction(async prisma => {
      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: role || 'parent',
        },
      });

      // Find or create role
      const userRole = await prisma.role.findUnique({
        where: { name: role || 'parent' },
      });

      if (userRole) {
        // Create user-role association
        await prisma.userRoleAssignment.create({
          data: {
            userId: newUser.id,
            roleId: userRole.id,
          },
        });
      }

      return newUser;
    });

    logger.info(`User registered successfully: ${user.email}`);

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
  } catch (error) {
    logger.error('Registration error:', undefined, {
      errorMessage:
        error instanceof Error
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

/**
 * Login user
 * POST /auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Authenticate user
    const authResult = await authService.authenticate({
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

    // Update session activity
    if (authResult.sessionId) {
      await authService.updateSessionActivity(authResult.sessionId);
    }

    // Ensure tokens exist
    if (!authResult.tokens) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate authentication tokens',
      });
    }

    // Set secure HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 7 days or 1 day
    };

    res.cookie('accessToken', authResult.tokens.accessToken, cookieOptions);
    res.cookie('refreshToken', authResult.tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
    });

    logger.info(`User logged in successfully: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: authResult.user,
      tokens: authResult.tokens,
    });
  } catch (error) {
    logger.error('Login error:', undefined, {
      errorMessage:
        error instanceof Error
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

/**
 * Refresh access token
 * POST /auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const result = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: result.accessToken,
    });
  } catch (error) {
    logger.error('Token refresh error:', undefined, {
      errorMessage:
        error instanceof Error
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

/**
 * Validate password strength
 * POST /auth/validate-password
 */
router.post('/validate-password', (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    const validation = authService.validatePassword(password);

    res.status(200).json({
      success: true,
      validation,
    });
  } catch (error) {
    logger.error(
      'Password validation error:',
      error instanceof Error ? error : new Error(String(error))
    );
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Validation failed',
    });
  }
});

/**
 * Forgot password - request reset
 * POST /auth/forgot-password
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Check if user exists
    const user = await DatabaseService.client.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent',
    });

    // Only send email if user exists
    if (user) {
      // TODO: Implement password reset email sending
      logger.info(`Password reset requested for: ${email}`);
    }
  } catch (error) {
    logger.error(
      'Forgot password error:',
      error instanceof Error ? error : new Error(String(error))
    );
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Request failed',
    });
  }
});

export { router as authRouter };
