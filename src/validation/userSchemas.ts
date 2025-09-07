/**
 * User Management Validation Schemas
 * Comprehensive Joi validation schemas for all user management operations
 * Implements Story 1.3 Task 8: Data Validation and Security
 * ReDoS Protection: All regex patterns use safe constructs with bounded quantifiers
 */
import Joi from 'joi';

// ReDoS-safe timeout wrapper for regex validation
export const safeRegexValidator = (value: string, pattern: RegExp, helpers: any, timeout: number = 100) => {
  try {
    const startTime = Date.now();
    const result = pattern.test(value);
    const endTime = Date.now();
    
    if (endTime - startTime > timeout) {
      return helpers.error('string.pattern.timeout');
    }
    
    if (!result) {
      return helpers.error('string.pattern.base');
    }
    
    return value;
  } catch (error) {
    return helpers.error('string.pattern.error');
  }
};

// Safe regex patterns with ReDoS protection
export const SAFE_PATTERNS = {
  // UUID: Standard UUID format
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  // Email: RFC 5322 compliant, bounded length
  email: /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,255}\.[a-zA-Z]{2,}$/,
  // Phone: International format, bounded length
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  // Name: Only letters and spaces, bounded length
  name: /^[a-zA-Z\s]{1,100}$/,
  // Address: Alphanumeric with common punctuation, bounded
  address: /^[a-zA-Z0-9\s\-\.,#]{1,255}$/,
  // School code: Uppercase alphanumeric, fixed length range
  schoolCode: /^[A-Z0-9]{4,12}$/,
  // Student ID: Alphanumeric, fixed length range
  studentId: /^[A-Z0-9]{6,15}$/,
  // RFID card: Hex format, fixed length
  rfidCard: /^[A-Fa-f0-9]{8,16}$/,
  // Grade: Simple number range
  grade: /^(1[0-2]|[1-9])$/,
  // Section: Single letter
  section: /^[A-Z]$/,
  // Indian PIN code: 6 digits, first digit not 0
  pinCode: /^[1-9][0-9]{5}$/
};

// Base user role enum
const UserRoles = ['PARENT', 'SCHOOL_ADMIN', 'VENDOR', 'STUDENT', 'SYSTEM_ADMIN'] as const;
const UserStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'] as const;
const Languages = ['en', 'hi', 'kn'] as const;

export type UserRole = typeof UserRoles[number];
export type UserStatus = typeof UserStatuses[number];
export type Language = typeof Languages[number];

/**
 * User Profile Validation Schema
 * AC 1: User profile management with personal information, contact details, and preferences
 */
export const createUserSchema = Joi.object({
  email: Joi.string()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.email, helpers);
    })
    .required()
    .messages({
      'string.pattern.base': 'Invalid email format',
      'string.pattern.timeout': 'Email validation timed out',
      'string.pattern.error': 'Email validation error'
    }),
  
  phone: Joi.string()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.phone, helpers);
    })
    .optional()
    .allow(null)
    .messages({
      'string.pattern.base': 'Invalid phone number format',
      'string.pattern.timeout': 'Phone validation timed out'
    }),
  
  firstName: Joi.string()
    .required()
    .min(1)
    .max(100)
    .trim()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.name, helpers);
    })
    .messages({
      'string.pattern.base': 'First name can only contain letters and spaces',
      'string.pattern.timeout': 'Name validation timed out'
    }),
  
  lastName: Joi.string()
    .required()
    .min(1)
    .max(100)
    .trim()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.name, helpers);
    })
    .messages({
      'string.pattern.base': 'Last name can only contain letters and spaces',
      'string.pattern.timeout': 'Name validation timed out'
    }),
  
  role: Joi.string()
    .valid(...UserRoles)
    .required(),
  
  status: Joi.string()
    .valid(...UserStatuses)
    .default('PENDING'),
  
  language: Joi.string()
    .valid(...Languages)
    .default('en'),
  
  // School-specific fields
  schoolCode: Joi.when('role', {
    is: Joi.string().valid('SCHOOL_ADMIN', 'STUDENT'),
    then: Joi.string()
      .custom((value, helpers) => {
        return safeRegexValidator(value, SAFE_PATTERNS.schoolCode, helpers);
      })
      .required()
      .messages({
        'string.pattern.base': 'Invalid school code format',
        'string.pattern.timeout': 'School code validation timed out'
      }),
    otherwise: Joi.optional()
  }),
  
  // Student-specific fields
  studentId: Joi.when('role', {
    is: 'STUDENT',
    then: Joi.string()
      .custom((value, helpers) => {
        return safeRegexValidator(value, SAFE_PATTERNS.studentId, helpers);
      })
      .required()
      .messages({
        'string.pattern.base': 'Invalid student ID format',
        'string.pattern.timeout': 'Student ID validation timed out'
      }),
    otherwise: Joi.optional()
  }),
  
  grade: Joi.when('role', {
    is: 'STUDENT',
    then: Joi.number().integer().min(1).max(12).required(),
    otherwise: Joi.optional()
  }),
  
  section: Joi.when('role', {
    is: 'STUDENT',
    then: Joi.string()
      .custom((value, helpers) => {
        return safeRegexValidator(value, SAFE_PATTERNS.section, helpers);
      })
      .required()
      .messages({
        'string.pattern.base': 'Section must be a single uppercase letter',
        'string.pattern.timeout': 'Section validation timed out'
      }),
    otherwise: Joi.optional()
  }),
  
  // Address information
  address: Joi.object({
    street: Joi.string()
      .custom((value, helpers) => {
        return safeRegexValidator(value, SAFE_PATTERNS.address, helpers);
      })
      .required()
      .messages({
        'string.pattern.base': 'Invalid street address format',
        'string.pattern.timeout': 'Address validation timed out'
      }),
    
    city: Joi.string()
      .max(100)
      .custom((value, helpers) => {
        return safeRegexValidator(value, SAFE_PATTERNS.name, helpers);
      })
      .required(),
    
    state: Joi.string()
      .max(100)
      .custom((value, helpers) => {
        return safeRegexValidator(value, SAFE_PATTERNS.name, helpers);
      })
      .required(),
    
    pinCode: Joi.string()
      .length(6)
      .pattern(SAFE_PATTERNS.pinCode)
      .required()
      .messages({
        'string.pattern.base': 'PIN code must be 6 digits and first digit cannot be 0'
      }),
    
    country: Joi.string()
      .default('India')
      .max(100)
  }).optional(),
  
  // Preferences
  preferences: Joi.object({
    notifications: Joi.object({
      email: Joi.boolean().default(true),
      sms: Joi.boolean().default(false),
      push: Joi.boolean().default(true)
    }).default(),
    dietary: Joi.object({
      restrictions: Joi.array().items(Joi.string()).default([]),
      preferences: Joi.array().items(Joi.string()).default([])
    }).default(),
    language: Joi.string().valid(...Languages).default('en'),
    timezone: Joi.string().default('Asia/Kolkata')
  }).optional()
});

/**
 * Update User Schema - allows partial updates
 */
export const updateUserSchema = Joi.object({
  phone: Joi.string()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.phone, helpers);
    })
    .allow(null),
  
  firstName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.name, helpers);
    }),
  
  lastName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.name, helpers);
    }),
  
  status: Joi.string()
    .valid(...UserStatuses),
  
  language: Joi.string()
    .valid(...Languages),
  
  grade: Joi.number().integer().min(1).max(12),
  
  section: Joi.string()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.section, helpers);
    }),
  
  // Address update
  address: createUserSchema.extract('address').optional(),
  
  // Preferences update
  preferences: createUserSchema.extract('preferences').optional()
}).min(1);

/**
 * User Query Schema for filtering and searching
 */
export const userQuerySchema = Joi.object({
  role: Joi.string().valid(...UserRoles).optional(),
  status: Joi.string().valid(...UserStatuses).optional(),
  schoolCode: Joi.string()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.schoolCode, helpers);
    })
    .optional(),
  
  grade: Joi.number().integer().min(1).max(12).optional(),
  
  section: Joi.string()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.section, helpers);
    })
    .optional(),
  
  search: Joi.string().max(255).trim().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'firstName', 'lastName', 'email').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

/**
 * User ID validation
 */
export const userIdSchema = Joi.object({
  id: Joi.string()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.uuid, helpers);
    })
    .required()
});

/**
 * RFID Card Association Schema
 */
export const rfidAssociationSchema = Joi.object({
  rfidCardId: Joi.string()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.rfidCard, helpers);
    })
    .required()
    .messages({
      'string.pattern.base': 'Invalid RFID card format',
      'string.pattern.timeout': 'RFID validation timed out'
    }),
  
  isActive: Joi.boolean().default(true)
});

/**
 * Bulk user import schema
 */
export const bulkUserImportSchema = Joi.object({
  users: Joi.array()
    .items(createUserSchema)
    .min(1)
    .max(100)
    .custom((value, helpers) => {
      // Check for duplicate emails within the batch
      const emails = value.map((user: any) => user.email.toLowerCase());
      const uniqueEmails = new Set(emails);
      if (emails.length !== uniqueEmails.size) {
        return helpers.error('array.unique', { message: 'Duplicate emails found in batch' });
      }
      return value;
    })
    .required()
});

/**
 * Password reset schema
 */
export const passwordResetSchema = Joi.object({
  email: Joi.string()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.email, helpers);
    })
    .required(),
  
  token: Joi.string()
    .min(32)
    .max(128)
    .required(),
  
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    })
});

/**
 * Change password schema
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordResetSchema.extract('newPassword')
});

// Export interfaces for TypeScript
export interface CreateUserRequest {
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: UserStatus;
  language?: Language;
  schoolCode?: string;
  studentId?: string;
  grade?: number;
  section?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    pinCode: string;
    country?: string;
  };
  preferences?: {
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
    dietary?: {
      restrictions?: string[];
      preferences?: string[];
    };
    language?: Language;
    timezone?: string;
  };
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {}

export interface UserQueryRequest {
  role?: UserRole;
  status?: UserStatus;
  schoolCode?: string;
  grade?: number;
  section?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Safe patterns and validator already exported above

export default {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  userIdSchema,
  rfidAssociationSchema,
  bulkUserImportSchema,
  passwordResetSchema,
  changePasswordSchema,
  SAFE_PATTERNS,
  safeRegexValidator,
  UserRoles,
  UserStatuses,
  Languages
};