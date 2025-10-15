/**
 * HASIVU Platform - JWT Token Utility Service
 * Production-ready JWT token extraction and validation
 * Replaces all mock authentication implementations
 */

import * as jwt from 'jsonwebtoken';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { config } from '../config/environment';
import { logger } from './logger.service';

/**
 * JWT payload interface
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  tokenType: 'access' | 'refresh';
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
  jti?: string;
  businessId?: string;
  sessionId?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  schoolId?: string;
}

/**
 * JWT extraction result
 */
export interface JWTExtractionResult {
  isValid: boolean;
  payload: JWTPayload | null;
  token: string | null;
  error?: string;
  errorCode?: string;
  expiresAt?: Date;
  issuedAt?: Date;
  remainingTTL?: number;
}

/**
 * Token generation options
 */
export interface TokenGenerationOptions {
  expiresIn?: string | number;
  audience?: string;
  issuer?: string;
  jwtid?: string;
  notBefore?: string | number;
  subject?: string;
  keyid?: string;
  includeSessionData?: boolean;
  includeDeviceInfo?: boolean;
}

/**
 * Refresh token result
 */
export interface RefreshTokenResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
  errorCode?: string;
}

/**
 * JWT Service Class
 * Centralized JWT token management with comprehensive security features
 * Singleton pattern for consistent token handling across application
 */
export class JWTService {
  private static instance: JWTService;
  private readonly jwtSecret: string;
  private readonly refreshSecret: string;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly defaultExpiresIn: string;
  private readonly refreshExpiresIn: string;

  private constructor() {
    this.jwtSecret = config.jwt.secret;
    this.refreshSecret = config.jwt.refreshSecret;
    this.issuer = config.jwt.issuer || 'hasivu-platform';
    this.audience = config.jwt.audience || 'hasivu-users';
    this.defaultExpiresIn = config.jwt.expiresIn || '15m';
    this.refreshExpiresIn = config.jwt.refreshExpiresIn || '7d';

    // Validate JWT configuration
    this.validateJWTConfiguration();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): JWTService {
    if (!JWTService.instance) {
      JWTService.instance = new JWTService();
    }
    return JWTService.instance;
  }

  /**
   * Validate JWT configuration
   */
  private validateJWTConfiguration(): void {
    const issues: string[] = [];

    if (!this.jwtSecret) {
      issues.push('JWT secret is not configured');
    } else if (this.jwtSecret.length < 32) {
      issues.push('JWT secret is too short (minimum 32 characters required)');
    }

    if (!this.refreshSecret) {
      issues.push('Refresh token secret is not configured');
    } else if (this.refreshSecret.length < 32) {
      issues.push('Refresh token secret is too short (minimum 32 characters required)');
    }

    if (this.jwtSecret === this.refreshSecret) {
      issues.push('JWT secret and refresh secret should be different');
    }

    if (issues.length > 0) {
      logger.error('JWT configuration validation failed', undefined, {
        issues,
      });
      throw new Error(`JWT configuration issues: ${issues.join(', ')}`);
    }

    logger.info('JWT configuration validated successfully', {
      issuer: this.issuer,
      audience: this.audience,
      defaultExpiresIn: this.defaultExpiresIn,
      refreshExpiresIn: this.refreshExpiresIn,
    });
  }

  /**
   * Extract JWT token from API Gateway event
   */
  public extractTokenFromEvent(event: APIGatewayProxyEvent): string | null {
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
      const customHeaderName = (config.jwt as any).customHeaderName || 'x-access-token';
      const customToken =
        event.headers?.[customHeaderName] || event.headers?.[customHeaderName.toLowerCase()];
      if (customToken && customToken.length > 0) {
        logger.debug('JWT token found in custom header');
        return customToken;
      }

      logger.warn('No JWT token found in request', {
        hasAuthHeader: !!authHeader,
        hasQueryToken: !!queryToken,
        hasCookies: !!cookieHeader,
        requestId: event.requestContext?.requestId,
      });

      return null;
    } catch (error: unknown) {
      logger.error('Error extracting JWT token from event', undefined, {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        requestId: event.requestContext?.requestId,
      });
      return null;
    }
  }

  /**
   * Parse cookies from Cookie header
   */
  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};

    try {
      const cookiePairs = cookieHeader.split(';');

      for (const pair of cookiePairs) {
        const [key, ...valueParts] = pair.trim().split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          cookies[key.trim()] = decodeURIComponent(value);
        }
      }
    } catch (error: unknown) {
      logger.warn('Failed to parse cookies', {
        cookieHeader,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return cookies;
  }

  /**
   * Verify and decode JWT token
   */
  public verifyToken(token: string): JWTExtractionResult {
    if (!token || token.trim().length === 0) {
      return {
        isValid: false,
        payload: null,
        token: null,
        error: 'Token is empty or null',
        errorCode: 'EMPTY_TOKEN',
      };
    }

    try {
      // Verify token signature and decode payload
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: this.issuer,
        audience: this.audience,
        complete: false,
      }) as JWTPayload;

      // Validate token type (should be access token)
      if (decoded.tokenType !== 'access') {
        return {
          isValid: false,
          payload: null,
          token,
          error: `Invalid token type: ${decoded.tokenType}. Expected: access`,
          errorCode: 'INVALID_TOKEN_TYPE',
        };
      }

      // Validate required fields
      const requiredFields = ['userId', 'email', 'role'];
      const missingFields = requiredFields.filter(field => !decoded[field as keyof JWTPayload]);

      if (missingFields.length > 0) {
        return {
          isValid: false,
          payload: null,
          token,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          errorCode: 'MISSING_FIELDS',
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
        remainingTTL,
      });

      return {
        isValid: true,
        payload: decoded,
        token,
        expiresAt,
        issuedAt,
        remainingTTL,
      };
    } catch (error: unknown) {
      let errorMessage = 'Token verification failed';
      let errorCode = 'VERIFICATION_FAILED';

      if (error instanceof jwt.JsonWebTokenError) {
        if (error instanceof jwt.TokenExpiredError) {
          errorMessage = 'Token has expired';
          errorCode = 'TOKEN_EXPIRED';
        } else if (error instanceof jwt.NotBeforeError) {
          errorMessage = 'Token is not active yet';
          errorCode = 'TOKEN_NOT_ACTIVE';
        } else {
          errorMessage = `Token validation error: ${error.message}`;
          errorCode = 'INVALID_TOKEN';
        }
      } else {
        errorMessage = `Unexpected token error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errorCode = 'UNKNOWN_ERROR';
      }

      logger.warn('JWT token verification failed', {
        error: errorMessage,
        errorCode,
        tokenLength: token.length,
        tokenPrefix: `${token.substring(0, 20)}...`,
      });

      return {
        isValid: false,
        payload: null,
        token,
        error: errorMessage,
        errorCode,
      };
    }
  }

  /**
   * Generate access token
   */
  public generateAccessToken(
    payload: Omit<JWTPayload, 'iat' | 'exp' | 'tokenType'>,
    options: TokenGenerationOptions = {}
  ): string {
    try {
      const tokenPayload: JWTPayload = {
        ...payload,
        tokenType: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: 0, // Will be set by jwt.sign
      };

      // Add session and device info if requested
      if (options.includeSessionData && payload.sessionId) {
        tokenPayload.sessionId = payload.sessionId;
      }

      if (options.includeDeviceInfo) {
        if (payload.deviceId) tokenPayload.deviceId = payload.deviceId;
        if (payload.ipAddress) tokenPayload.ipAddress = payload.ipAddress;
        if (payload.userAgent) tokenPayload.userAgent = payload.userAgent;
      }

      const signOptions: jwt.SignOptions = {
        issuer: options.issuer || this.issuer,
        audience: (options.audience || this.audience) as string,
        expiresIn: (options.expiresIn || this.defaultExpiresIn) as any,
        jwtid: options.jwtid,
        subject: options.subject || payload.userId,
        keyid: options.keyid as string | undefined,
        notBefore: options.notBefore as any,
      };

      const token = jwt.sign(tokenPayload, this.jwtSecret, signOptions);

      logger.info('Access token generated successfully', {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        expiresIn: signOptions.expiresIn,
        includeSessionData: options.includeSessionData,
        includeDeviceInfo: options.includeDeviceInfo,
      });

      return token;
    } catch (error: unknown) {
      const errorMessage = `Failed to generate access token: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage, undefined, {
        userId: payload.userId,
        email: payload.email,
        error: error instanceof Error ? error.stack : error,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(
    payload: Pick<JWTPayload, 'userId' | 'email' | 'role' | 'sessionId'>,
    options: TokenGenerationOptions = {}
  ): string {
    try {
      const tokenPayload = {
        ...payload,
        tokenType: 'refresh' as const,
        iat: Math.floor(Date.now() / 1000),
        exp: 0, // Will be set by jwt.sign
      };

      const signOptions: jwt.SignOptions = {
        issuer: options.issuer || this.issuer,
        audience: (options.audience || this.audience) as string,
        expiresIn: (options.expiresIn || this.refreshExpiresIn) as any,
        jwtid: options.jwtid,
        subject: options.subject || payload.userId,
        keyid: options.keyid as string | undefined,
        notBefore: options.notBefore as any,
      };

      const token = jwt.sign(tokenPayload, this.refreshSecret, signOptions);

      logger.info('Refresh token generated successfully', {
        userId: payload.userId,
        email: payload.email,
        sessionId: payload.sessionId,
        expiresIn: signOptions.expiresIn,
      });

      return token;
    } catch (error: unknown) {
      const errorMessage = `Failed to generate refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage, undefined, {
        userId: payload.userId,
        email: payload.email,
        error: error instanceof Error ? error.stack : error,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * Verify refresh token
   */
  public verifyRefreshToken(token: string): JWTExtractionResult {
    if (!token || token.trim().length === 0) {
      return {
        isValid: false,
        payload: null,
        token: null,
        error: 'Refresh token is empty or null',
        errorCode: 'EMPTY_TOKEN',
      };
    }

    try {
      const decoded = jwt.verify(token, this.refreshSecret, {
        issuer: this.issuer,
        audience: this.audience,
        complete: false,
      }) as JWTPayload;

      // Validate token type (should be refresh token)
      if (decoded.tokenType !== 'refresh') {
        return {
          isValid: false,
          payload: null,
          token,
          error: `Invalid token type: ${decoded.tokenType}. Expected: refresh`,
          errorCode: 'INVALID_TOKEN_TYPE',
        };
      }

      // Validate required fields for refresh token
      const requiredFields = ['userId', 'email', 'role'];
      const missingFields = requiredFields.filter(field => !decoded[field as keyof JWTPayload]);

      if (missingFields.length > 0) {
        return {
          isValid: false,
          payload: null,
          token,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          errorCode: 'MISSING_FIELDS',
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
        remainingTTL,
      });

      return {
        isValid: true,
        payload: decoded,
        token,
        expiresAt,
        issuedAt,
        remainingTTL,
      };
    } catch (error: unknown) {
      let errorMessage = 'Refresh token verification failed';
      let errorCode = 'VERIFICATION_FAILED';

      if (error instanceof jwt.JsonWebTokenError) {
        if (error instanceof jwt.TokenExpiredError) {
          errorMessage = 'Refresh token has expired';
          errorCode = 'TOKEN_EXPIRED';
        } else if (error instanceof jwt.NotBeforeError) {
          errorMessage = 'Refresh token is not active yet';
          errorCode = 'TOKEN_NOT_ACTIVE';
        } else {
          errorMessage = `Refresh token validation error: ${error.message}`;
          errorCode = 'INVALID_TOKEN';
        }
      } else {
        errorMessage = `Unexpected refresh token error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errorCode = 'UNKNOWN_ERROR';
      }

      logger.warn('Refresh token verification failed', {
        error: errorMessage,
        errorCode,
        tokenLength: token.length,
      });

      return {
        isValid: false,
        payload: null,
        token,
        error: errorMessage,
        errorCode,
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshAccessToken(refreshToken: string): Promise<RefreshTokenResult> {
    try {
      // Verify the refresh token
      const refreshResult = this.verifyRefreshToken(refreshToken);

      if (!refreshResult.isValid || !refreshResult.payload) {
        return {
          success: false,
          error: refreshResult.error || 'Invalid refresh token',
          errorCode: refreshResult.errorCode,
        };
      }

      // Generate new access token with same user data
      const accessTokenPayload = {
        userId: refreshResult.payload.userId,
        email: refreshResult.payload.email,
        role: refreshResult.payload.role,
        permissions: refreshResult.payload.permissions || [],
        businessId: refreshResult.payload.businessId,
        sessionId: refreshResult.payload.sessionId,
      };

      const newAccessToken = this.generateAccessToken(accessTokenPayload);

      // Optionally generate new refresh token (token rotation) - safe property access
      let newRefreshToken: string | undefined;
      if ((config.jwt as any).rotateRefreshTokens) {
        newRefreshToken = this.generateRefreshToken({
          userId: refreshResult.payload.userId,
          email: refreshResult.payload.email,
          role: refreshResult.payload.role,
          sessionId: refreshResult.payload.sessionId,
        });
      }

      // Calculate expiration time
      const decoded = jwt.decode(newAccessToken) as JWTPayload;
      const expiresIn = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900; // Default 15 minutes

      logger.info('Access token refreshed successfully', {
        userId: refreshResult.payload.userId,
        email: refreshResult.payload.email,
        sessionId: refreshResult.payload.sessionId,
        rotatedRefreshToken: !!newRefreshToken,
      });

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn,
      };
    } catch (error: unknown) {
      const errorMessage = `Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage, undefined, {
        error: error instanceof Error ? error.stack : error,
      });

      return {
        success: false,
        error: errorMessage,
        errorCode: 'REFRESH_FAILED',
      };
    }
  }

  /**
   * Decode JWT token without verification (for debugging)
   */
  public decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch (error: unknown) {
      logger.warn('Failed to decode JWT token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenLength: token.length,
      });
      return null;
    }
  }

  /**
   * Check if token is expired without full verification
   */
  public isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  public getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Get remaining token TTL in seconds
   */
  public getTokenTTL(token: string): number | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return null;
      }

      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, decoded.exp - now);
    } catch {
      return null;
    }
  }

  /**
   * Validate token permissions
   */
  public hasPermission(payload: JWTPayload, requiredPermission: string): boolean {
    if (!payload.permissions || !Array.isArray(payload.permissions)) {
      return false;
    }

    return payload.permissions.includes(requiredPermission) || payload.permissions.includes('*');
  }

  /**
   * Validate token role
   */
  public hasRole(payload: JWTPayload, requiredRole: string): boolean {
    if (!payload.role) {
      return false;
    }

    // Check exact role match or admin role (which has access to everything)
    return payload.role === requiredRole || payload.role === 'admin';
  }

  /**
   * Generate JWT token pair (access + refresh)
   */
  public generateTokenPair(
    payload: Omit<JWTPayload, 'iat' | 'exp' | 'tokenType'>,
    options: TokenGenerationOptions = {}
  ): { accessToken: string; refreshToken: string; expiresIn: number } {
    try {
      const accessToken = this.generateAccessToken(payload, options);
      const refreshToken = this.generateRefreshToken(
        {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          sessionId: payload.sessionId,
        },
        options
      );

      // Calculate expiration time from access token
      const decoded = jwt.decode(accessToken) as JWTPayload;
      const expiresIn = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;

      logger.info('JWT token pair generated successfully', {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sessionId,
        expiresIn,
      });

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error: unknown) {
      const errorMessage = `Failed to generate token pair: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMessage, undefined, {
        userId: payload.userId,
        email: payload.email,
        error: error instanceof Error ? error.stack : error,
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * Revoke token (add to blacklist - requires external storage)
   */
  public async revokeToken(token: string): Promise<boolean> {
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
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'unknown',
      });

      return true;
    } catch (error: unknown) {
      logger.error('Failed to revoke token', undefined, {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Create JWT service health check
   */
  public healthCheck(): { status: 'healthy' | 'unhealthy'; details: any } {
    try {
      // Test token generation and verification
      const testPayload = {
        userId: 'health-check-user',
        email: 'healthcheck@test.com',
        role: 'test',
        permissions: ['health:check'],
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
            refreshExpiry: this.refreshExpiresIn,
          },
        };
      } else {
        return {
          status: 'unhealthy',
          details: {
            jwtConfigured: true,
            tokenGeneration: 'working',
            tokenVerification: 'failed',
            error: verification.error,
          },
        };
      }
    } catch (error: unknown) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}

// Export singleton instance
export const jwtService = JWTService.getInstance();
