/**
 * Validation Service
 * Centralized data validation utilities
 */

import { z, ZodSchema, ZodError } from 'zod';

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export class ValidationService {
  private static instance: ValidationService;

  private constructor() {}

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Validate data against a Zod schema
   */
  public validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
    try {
      const validated = schema.parse(data);
      return {
        success: true,
        data: validated,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          errors: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ field: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  /**
   * Validate email format
   */
  public validateEmail(email: string): boolean {
    const emailSchema = z.string().email();
    return emailSchema.safeParse(email).success;
  }

  /**
   * Validate phone number (Indian format)
   */
  public validatePhone(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate UUID
   */
  public validateUUID(uuid: string): boolean {
    const uuidSchema = z.string().uuid();
    return uuidSchema.safeParse(uuid).success;
  }

  /**
   * Validate date string
   */
  public validateDate(date: string): boolean {
    const dateSchema = z.string().datetime();
    return dateSchema.safeParse(date).success || !isNaN(Date.parse(date));
  }

  /**
   * Validate required fields
   */
  public validateRequired(data: Record<string, any>, requiredFields: string[]): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push({
          field,
          message: `${field} is required`,
        });
      }
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Sanitize string input
   */
  public sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[\r\n]+/g, ' '); // Replace newlines with spaces
  }

  /**
   * Validate password strength
   */
  public validatePassword(password: string): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (password.length < 8) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 8 characters long',
      });
    }

    if (!/[A-Z]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one uppercase letter',
      });
    }

    if (!/[a-z]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one lowercase letter',
      });
    }

    if (!/[0-9]/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one number',
      });
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Validate number range
   */
  public validateRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Sanitize payload object to prevent prototype pollution and injection
   */
  public sanitizePayload(payload: any): any {
    if (typeof payload !== 'object' || payload === null) {
      return payload;
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(payload)) {
      // Skip dangerous prototype properties
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizePayload(value);
      } else if (typeof value === 'string') {
        // Sanitize string values
        sanitized[key] = this.sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Validate object against a schema
   */
  public static validateObject(schema: any, data: any): any {
    const { error, value } = schema.validate(data);
    if (error) {
      throw new Error(error.details.map((d: any) => d.message).join(', '));
    }
    return value;
  }
}

// Export singleton instance
export const validationService = ValidationService.getInstance();

// Export for direct access
export default ValidationService;
