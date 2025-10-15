/**
 * HASIVU Platform - Lambda-Optimized Validation Service
 * Standalone validation service optimized for AWS Lambda
 * Migration from Express middleware-based validation
 */
import * as Joi from 'joi';

/**
 * Validation error class
 */
export class ValidationError extends Error {
  public details: any[];

  constructor(message: string, details: any[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  // User Registration Schema
  userRegistration: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character',
        'any.required': 'Password is required'
      }),
    firstName: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.min': 'First name is required',
        'string.max': 'First name cannot exceed 50 characters',
        'any.required': 'First name is required'
      }),
    lastName: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.min': 'Last name is required',
        'string.max': 'Last name cannot exceed 50 characters',
        'any.required': 'Last name is required'
      }),
    schoolId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Invalid school ID format',
        'any.required': 'School ID is required'
      }),
    role: Joi.string()
      .valid('student', 'teacher', 'admin', 'parent')
      .default('student')
      .messages({
        'any.only': 'Role must be one of: student, teacher, admin, parent'
      })
  }),

  // User Login Schema
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  // Profile Update Schema
  profileUpdate: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .optional()
      .messages({
        'string.min': 'First name cannot be empty',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Last name cannot be empty',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    phone: Joi.string()
      .pattern(new RegExp('^[+]?[1-9]?[0-9]{7,15}$'))
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    preferences: Joi.object({
      language: Joi.string().valid('en', 'hi', 'ta').default('en'),
      notifications: Joi.boolean().default(true),
      theme: Joi.string().valid('light', 'dark').default('light')
    }).optional()
  }),

  // Password Change Schema
  passwordChange: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    newPassword: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character',
        'any.required': 'New password is required'
      }),
    confirmPassword: Joi.string()
      .required()
      .valid(Joi.ref('newPassword'))
      .messages({
        'any.only': 'Password confirmation does not match new password',
        'any.required': 'Password confirmation is required'
      })
  }),

  // RFID Card Schema
  rfidCard: Joi.object({
    cardNumber: Joi.string()
      .pattern(new RegExp('^[0-9A-Fa-f]{8,16}$'))
      .required()
      .messages({
        'string.pattern.base': 'RFID card number must be 8-16 hexadecimal characters',
        'any.required': 'RFID card number is required'
      }),
    studentId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Invalid student ID format',
        'any.required': 'Student ID is required'
      }),
    expiryDate: Joi.date()
      .greater('now')
      .optional()
      .messages({
        'date.greater': 'Expiry date must be in the future'
      })
  }),

  // Payment Order Schema
  paymentOrder: Joi.object({
    amount: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.positive': 'Amount must be positive',
        'any.required': 'Amount is required'
      }),
    currency: Joi.string()
      .valid('INR')
      .default('INR'),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      }),
    orderId: Joi.string()
      .uuid()
      .optional()
  }),

  // Notification Schema
  notification: Joi.object({
    type: Joi.string()
      .valid('order_confirmation', 'payment_success', 'delivery_notification', 'system_alert')
      .required()
      .messages({
        'any.only': 'Notification type must be one of: order_confirmation, payment_success, delivery_notification, system_alert',
        'any.required': 'Notification type is required'
      }),
    title: Joi.string()
      .max(100)
      .required()
      .messages({
        'string.max': 'Title cannot exceed 100 characters',
        'any.required': 'Title is required'
      }),
    message: Joi.string()
      .max(500)
      .required()
      .messages({
        'string.max': 'Message cannot exceed 500 characters',
        'any.required': 'Message is required'
      }),
    data: Joi.object().optional()
  })
};

/**
 * Lambda-optimized validation service
 */
export class ValidationService {
  private static instance: ValidationService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Validate data against a Joi schema
   */
  public async validate<T>(schema: Joi.ObjectSchema<T>, data: any): Promise<T> {
    try {
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
        throw new ValidationError('Validation failed', details);
      }

      return value;
    } catch (validationError) {
      if (validationError instanceof ValidationError) {
        throw validationError;
      }
      throw new ValidationError('Validation error occurred', []);
    }
  }

  /**
   * Validate user registration data
   */
  public async validateRegistration(data: any): Promise<any> {
    return this.validate(ValidationSchemas.userRegistration, data);
  }

  /**
   * Validate user login data
   */
  public async validateLogin(data: any): Promise<any> {
    return this.validate(ValidationSchemas.login, data);
  }

  /**
   * Validate profile update data
   */
  public async validateProfileUpdate(data: any): Promise<any> {
    return this.validate(ValidationSchemas.profileUpdate, data);
  }

  /**
   * Validate password change data
   */
  public async validatePasswordChange(data: any): Promise<any> {
    return this.validate(ValidationSchemas.passwordChange, data);
  }

  /**
   * Validate RFID card data
   */
  public async validateRfidCard(data: any): Promise<any> {
    return this.validate(ValidationSchemas.rfidCard, data);
  }

  /**
   * Validate payment order data
   */
  public async validatePaymentOrder(data: any): Promise<any> {
    return this.validate(ValidationSchemas.paymentOrder, data);
  }

  /**
   * Validate notification data
   */
  public async validateNotification(data: any): Promise<any> {
    return this.validate(ValidationSchemas.notification, data);
  }

  /**
   * Validate UUID format
   */
  public validateUUID(value: string, fieldName: string = 'ID'): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(value)) {
      throw new ValidationError(`Invalid ${fieldName} format`, [{
        field: fieldName.toLowerCase(),
        message: `${fieldName} must be a valid UUID`,
        value
      }]);
    }
    
    return true;
  }

  /**
   * Validate email format
   */
  public validateEmail(value: string, fieldName: string = 'Email'): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(value)) {
      throw new ValidationError(`Invalid ${fieldName} format`, [{
        field: fieldName.toLowerCase(),
        message: `${fieldName} must be a valid email address`,
        value
      }]);
    }
    
    return true;
  }

  /**
   * Validate required field
   */
  public validateRequired(value: any, fieldName: string): boolean {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required`, [{
        field: fieldName.toLowerCase(),
        message: `${fieldName} is required`,
        value
      }]);
    }
    
    return true;
  }

  /**
   * Validate string length
   */
  public validateStringLength(value: string, min: number, max: number, fieldName: string): boolean {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`, [{
        field: fieldName.toLowerCase(),
        message: `${fieldName} must be a string`,
        value
      }]);
    }

    if (value.length < min) {
      throw new ValidationError(`${fieldName} too short`, [{
        field: fieldName.toLowerCase(),
        message: `${fieldName} must be at least ${min} characters`,
        value
      }]);
    }

    if (value.length > max) {
      throw new ValidationError(`${fieldName} too long`, [{
        field: fieldName.toLowerCase(),
        message: `${fieldName} must not exceed ${max} characters`,
        value
      }]);
    }

    return true;
  }

  /**
   * Validate array
   */
  public validateArray(value: any, fieldName: string, minLength?: number, maxLength?: number): boolean {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`, [{
        field: fieldName.toLowerCase(),
        message: `${fieldName} must be an array`,
        value
      }]);
    }

    if (minLength !== undefined && value.length < minLength) {
      throw new ValidationError(`${fieldName} too short`, [{
        field: fieldName.toLowerCase(),
        message: `${fieldName} must contain at least ${minLength} items`,
        value
      }]);
    }

    if (maxLength !== undefined && value.length > maxLength) {
      throw new ValidationError(`${fieldName} too long`, [{
        field: fieldName.toLowerCase(),
        message: `${fieldName} must not exceed ${maxLength} items`,
        value
      }]);
    }

    return true;
  }

  /**
   * Static method to validate objects against Joi schema
   */
  public static validateObject(data: any, schema: any): { isValid: boolean; errors?: string[] } {
    try {
      const { error } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map((detail: any) => detail.message);
        return { isValid: false, errors };
      }

      return { isValid: true };
    } catch (validationError) {
      return { isValid: false, errors: ['Validation error occurred'] };
    }
  }
}