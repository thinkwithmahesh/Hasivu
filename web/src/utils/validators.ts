/**
 * HASIVU Platform - Validation Utilities
 * Comprehensive form validation, data validation, and business logic validation
 * Integrates with react-hook-form and yup for consistent validation across the platform
 */
import * as yup from 'yup';

/**
 * Common validation patterns and regex
 */
export const validationPatterns = {
  // Indian phone number (10 digits starting with 6-9)
  phoneNumber: /^[6-9]\d{9}$/,
  // Email validation
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // RFID card format (8-16 hex characters)
  rfidCard: /^[A-Fa-f0-9]{8,16}$/,
  // Strong password (min 8 chars, 1 upper, 1 lower, 1 number, 1 special)
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  // Indian PIN code (6 digits)
  pinCode: /^[1-9][0-9]{5}$/,
  // Student ID format (alphanumeric, 6-12 characters)
  studentId: /^[A-Za-z0-9]{6,12}$/,
  // School code format (uppercase alphanumeric, 4-8 characters)
  schoolCode: /^[A-Z0-9]{4,8}$/,
  // Order code format (HSV-YYYYMMDD-XXXX)
  orderCode: /^HSV-\d{8}-\d{4}$/,
  // Amount validation (positive number with up to 2 decimal places)
  amount: /^\d+(\.\d{1,2})?$/,
  // Time format (HH:MM)
  timeFormat: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
};

/**
 * Common validation messages
 */
export const validationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid 10-digit phone number',
  password: 'Password must be at least 8 characters with uppercase, lowercase, number and special character',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  range: (min: number, max: number) => `Must be between ${min} and ${max}`,
  positive: 'Must be a positive number',
  integer: 'Must be a whole number',
  rfid: 'Please enter a valid RFID card number',
  studentId: 'Student ID must be 6-12 alphanumeric characters',
  schoolCode: 'School code must be 4-8 uppercase alphanumeric characters',
};

/**
 * File validation utilities
 */
export const fileValidators = {
  validateFileSize: (file: File, maxSize: number) => {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }
    return { valid: true };
  },

  validateFileType: (file: File, allowedTypes: string[]) => {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }
    return { valid: true };
  },

  validateFileExtension: (fileName: string, allowedExtensions: string[]) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension ${extension} is not allowed`,
      };
    }
    return { valid: true };
  },
};

/**
 * Yup validation schemas
 */
export const validationSchemas = {
  // User registration schema
  userRegistration: yup.object().shape({
    firstName: yup
      .string()
      .required(validationMessages.required)
      .min(2, validationMessages.minLength(2))
      .max(50, validationMessages.maxLength(50)),
    lastName: yup
      .string()
      .required(validationMessages.required)
      .min(2, validationMessages.minLength(2))
      .max(50, validationMessages.maxLength(50)),
    email: yup
      .string()
      .required(validationMessages.required)
      .email(validationMessages.email),
    phone: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.phoneNumber, validationMessages.phone),
    password: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.strongPassword, validationMessages.password),
    confirmPassword: yup
      .string()
      .required(validationMessages.required)
      .oneOf([yup.ref('password')], 'Passwords must match'),
  }),

  // Login schema
  login: yup.object().shape({
    email: yup
      .string()
      .required(validationMessages.required)
      .email(validationMessages.email),
    password: yup.string().required(validationMessages.required),
  }),

  // Student profile schema
  studentProfile: yup.object().shape({
    studentId: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.studentId, validationMessages.studentId),
    grade: yup
      .number()
      .required(validationMessages.required)
      .integer(validationMessages.integer)
      .min(1, 'Grade must be between 1 and 12')
      .max(12, 'Grade must be between 1 and 12'),
    section: yup
      .string()
      .required(validationMessages.required)
      .max(5, validationMessages.maxLength(5)),
    rfidCard: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.rfidCard, validationMessages.rfid),
  }),

  // Order schema
  mealOrder: yup.object().shape({
    items: yup
      .array()
      .min(1, 'At least one item is required')
      .required(validationMessages.required),
    deliveryDate: yup
      .date()
      .required(validationMessages.required)
      .min(new Date(), 'Delivery date must be in the future'),
    pickupTime: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.timeFormat, 'Please enter a valid time (HH:MM)'),
    contactPhone: yup
      .string()
      .required(validationMessages.required)
      .matches(validationPatterns.phoneNumber, validationMessages.phone),
  }),

  // Payment schema
  payment: yup.object().shape({
    amount: yup
      .number()
      .required(validationMessages.required)
      .positive(validationMessages.positive)
      .test('decimal', 'Amount can have at most 2 decimal places', (value) => {
        return value == null || /^\d+(\.\d{1,2})?$/.test(value.toString());
      }),
    paymentMethod: yup
      .string()
      .required(validationMessages.required)
      .oneOf(['upi', 'card', 'netbanking', 'wallet'], 'Please select a valid payment method'),
  }),
};

/**
 * Custom validation functions
 */
export const customValidators = {
  // Validate Indian phone number
  isValidPhoneNumber: (phone: string): boolean => {
    return validationPatterns.phoneNumber.test(phone);
  },

  // Validate email format
  isValidEmail: (email: string): boolean => {
    return validationPatterns.email.test(email);
  },

  // Validate strong password
  isStrongPassword: (password: string): boolean => {
    return validationPatterns.strongPassword.test(password);
  },

  // Validate RFID card format
  isValidRfidCard: (rfid: string): boolean => {
    return validationPatterns.rfidCard.test(rfid);
  },

  // Validate amount format
  isValidAmount: (amount: string | number): boolean => {
    const amountStr = typeof amount === 'number' ? amount.toString() : amount;
    return validationPatterns.amount.test(amountStr);
  },

  // Validate age for school enrollment
  isValidSchoolAge: (birthDate: Date): boolean => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 5 && age - 1 <= 18;
    }
    
    return age >= 5 && age <= 18;
  },

  // Validate meal order timing (orders must be placed before cutoff time)
  isValidOrderTime: (deliveryDate: Date, cutoffHours: number = 24): boolean => {
    const now = new Date();
    const timeDiff = deliveryDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    return hoursDiff >= cutoffHours;
  },
};

/**
 * Form validation helpers
 */
export const formValidators = {
  // Validate form data against schema
  validateFormData: async <T>(data: T, schema: yup.ObjectSchema<any>) => {
    try {
      await schema.validate(data, { abortEarly: false });
      return { valid: true, errors: {} };
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        error.inner.forEach((err) => {
          if (err.path) {
            errors[err.path] = err.message;
          }
        });
        return { valid: false, errors };
      }
      return { valid: false, errors: { general: 'Validation failed' } };
    }
  },

  // Clean and format phone number
  formatPhoneNumber: (phone: string): string => {
    return phone.replace(/\D/g, '').slice(-10);
  },

  // Clean and format email
  formatEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },

  // Format amount to 2 decimal places
  formatAmount: (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  },
};

export default {
  validationPatterns,
  validationMessages,
  validationSchemas,
  customValidators,
  formValidators,
  fileValidators,
};