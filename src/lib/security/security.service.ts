import { JwtPayload } from 'jsonwebtoken';
import * as crypto from 'crypto';
import { logger } from '../../shared/logger.service';
import { encryptionService } from './encryption.service';

export class SecurityService {
  private csrfTokens: Set<string> = new Set();

  /**
   * Validate CSRF token
   */
  async validateCSRFToken(token: string): Promise<boolean> {
    try {
      const isValid = this.csrfTokens.has(token);
      if (isValid) {
        // Remove token after use (one-time use)
        this.csrfTokens.delete(token);
      }
      return isValid;
    } catch (error: unknown) {
      logger.error('CSRF token validation failed', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.csrfTokens.add(token);
    return token;
  }

  /**
   * Sanitize input data
   */
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove dangerous characters and patterns
      return input
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
        .trim();
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        // Skip dangerous prototype properties
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Detect SQL injection patterns
   */
  detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
      /(\'|\"|--|;|\*|\/\*|\*\/)/g,
      /(\bOR\b\s+\d+\s*=\s*\d+|\bAND\b\s+\d+\s*=\s*\d+)/gi,
      /(1=1|1='1'|1="1")/gi,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Validate JWT token
   */
  async validateJWTToken(token: string): Promise<{ valid: boolean; payload?: JwtPayload }> {
    try {
      // Import auth service for token validation
      const { authService } = await import('../../services/auth.service');

      const payload = await authService.verifyToken(token);
      return { valid: true, payload };
    } catch (error: unknown) {
      logger.error('JWT token validation failed', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return { valid: false };
    }
  }

  /**
   * Generate secure random string
   */
  generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash password securely
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const { authService } = await import('../../services/auth.service');
      return await authService.hashPassword(password);
    } catch (error: unknown) {
      logger.error('Password hashing failed', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const { authService } = await import('../../services/auth.service');
      return await authService.verifyPassword(password, hash);
    } catch (error: unknown) {
      logger.error('Password verification failed', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string): string {
    try {
      const result = encryptionService.encrypt(data);
      return JSON.stringify(result);
    } catch (error: unknown) {
      logger.error('Data encryption failed', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string): string {
    try {
      const parsed = JSON.parse(encryptedData);
      const result = encryptionService.decrypt(parsed.encrypted, parsed.iv);
      if (result.success) {
        return result.decrypted;
      }
      throw new Error('Decryption failed');
    } catch (error: unknown) {
      logger.error('Data decryption failed', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Generate HMAC for data integrity
   */
  generateHMAC(data: string, key?: string): string {
    const hmacKey = key || crypto.randomBytes(32).toString('hex');
    return crypto.createHmac('sha256', hmacKey).update(data).digest('hex');
  }

  /**
   * Verify HMAC for data integrity
   */
  verifyHMAC(data: string, hmac: string, key: string): boolean {
    const expectedHMAC = this.generateHMAC(data, key);
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHMAC, 'hex'));
  }

  /**
   * Detect XSS patterns
   */
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Clean up expired CSRF tokens (should be called periodically)
   */
  cleanupExpiredTokens(): void {
    // In a real implementation, you'd track token expiry times
    // For now, just clear all tokens periodically
    if (this.csrfTokens.size > 1000) {
      this.csrfTokens.clear();
      logger.info('Cleaned up CSRF tokens');
    }
  }
}
